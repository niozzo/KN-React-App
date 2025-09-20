/**
 * PWA Data Synchronization Service
 * Story 1.2: Database Integration & Data Access Layer Setup
 * Story 1.3: PWA Polish & Branding - Added schema validation
 * 
 * Handles offline data caching, synchronization, and conflict resolution
 */

// All data reads must go through backend endpoints protected by RLS-aware auth
import { SchemaValidationService } from './schemaValidationService';
import { supabase } from '../lib/supabase';
import { sanitizeAttendeeForStorage } from '../types/attendee';
import { applicationDb } from './applicationDatabaseService';
import { cacheMonitoringService } from './cacheMonitoringService';
import { cacheVersioningService, type CacheEntry } from './cacheVersioningService';

export interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  pendingChanges: number;
  syncInProgress: boolean;
}

export interface SyncResult {
  success: boolean;
  syncedTables: string[];
  errors: string[];
  conflicts: ConflictItem[];
}

export interface ConflictItem {
  table: string;
  recordId: string;
  localData: any;
  serverData: any;
  conflictType: 'modified' | 'deleted' | 'created';
}

export interface CacheConfig {
  maxAge: number; // in milliseconds
  maxSize: number; // in MB
  syncInterval: number; // in milliseconds
}

export class PWADataSyncService {
  private readonly CACHE_PREFIX = 'kn_cache_';
  private readonly SYNC_STATUS_KEY = 'kn_sync_status';
  private readonly CONFLICT_KEY = 'kn_conflicts';
  
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    lastSync: null,
    pendingChanges: 0,
    syncInProgress: false
  };

  private schemaValidator: SchemaValidationService;

  private cacheConfig: CacheConfig = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 50 * 1024 * 1024, // 50MB
    syncInterval: 5 * 60 * 1000 // 5 minutes
  };

  private syncTimer: NodeJS.Timeout | null = null;
  
  // Map table names to Supabase table names
  private readonly tableToSupabaseTable: Record<string, string> = {
    attendees: 'attendees',
    sponsors: 'sponsors',
    seat_assignments: 'seat_assignments',
    agenda_items: 'agenda_items',
    dining_options: 'dining_options',
    hotels: 'hotels',
    seating_configurations: 'seating_configurations',
    user_profiles: 'user_profiles',
    // Application database tables
    speaker_assignments: 'speaker_assignments',
    agenda_item_metadata: 'agenda_item_metadata',
    attendee_metadata: 'attendee_metadata'
  };

  constructor() {
    this.schemaValidator = new SchemaValidationService();
    this.initializeSync();
    this.setupEventListeners();
  }

  /**
   * Initialize synchronization system
   */
  private initializeSync(): void {
    // Load sync status from storage
    this.loadSyncStatus();
    
    // Register background sync
    this.registerBackgroundSync();
    
    // Start periodic sync if online
    if (this.syncStatus.isOnline) {
      this.startPeriodicSync();
    }
  }

  /**
   * Setup event listeners for online/offline status
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      this.startPeriodicSync();
      if (this.isUserAuthenticated()) {
        this.syncAllData();
      }
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
      this.stopPeriodicSync();
    });

    // Sync when page becomes visible (only if authenticated)
    document.addEventListener('visibilitychange', () => {
      const willSync = !document.hidden && this.syncStatus.isOnline && this.isUserAuthenticated();
      
      // Log visibility change with sync decision
      console.log('👁️ VISIBILITY CHANGE:', {
        hidden: document.hidden,
        isOnline: this.syncStatus.isOnline,
        isAuthenticated: this.isUserAuthenticated(),
        willSync,
        timestamp: new Date().toISOString(),
        lastSync: this.syncStatus.lastSync
      });
      
      cacheMonitoringService.logVisibilityChange(document.hidden, willSync, {
        isOnline: this.syncStatus.isOnline,
        isAuthenticated: this.isUserAuthenticated(),
        lastSync: this.syncStatus.lastSync
      });
      
      if (willSync) {
        this.syncAllData();
      }
    });
  }

  /**
   * Start periodic synchronization
   */
  private startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      // Only sync if online, not in progress, and user is authenticated
      if (this.syncStatus.isOnline && !this.syncStatus.syncInProgress && this.isUserAuthenticated()) {
        this.syncAllData();
      }
    }, this.cacheConfig.syncInterval);
  }

  /**
   * Check if user is authenticated
   */
  private isUserAuthenticated(): boolean {
    try {
      const authData = localStorage.getItem('conference_auth');
      if (!authData) return false;
      
      const auth = JSON.parse(authData);
      return auth.isAuthenticated === true && auth.attendee?.id;
    } catch (error) {
      console.warn('⚠️ Failed to check authentication status:', error);
      return false;
    }
  }

  /**
   * Register background sync with service worker
   */
  private async registerBackgroundSync(): Promise<void> {
    try {
      // Check if service worker and background sync are supported
      if ('serviceWorker' in navigator && 
          'ServiceWorkerRegistration' in window &&
          'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('data-sync');
        console.log('🔄 Background sync registered');
      } else {
        console.log('⚠️ Background sync not supported in this environment');
      }
    } catch (error) {
      console.warn('⚠️ Background sync registration failed:', error);
    }
  }

  /**
   * Stop periodic synchronization
   */
  private stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Sync all data tables
   */
  async syncAllData(): Promise<SyncResult> {
    const sessionId = cacheMonitoringService.getSessionId();
    
    if (this.syncStatus.syncInProgress) {
      cacheMonitoringService.logSyncFailure('syncAllData', 'Sync already in progress', { sessionId });
      return {
        success: false,
        syncedTables: [],
        errors: ['Sync already in progress'],
        conflicts: []
      };
    }

    // Validate cache health before syncing
    if (!this.validateCacheHealth()) {
      console.warn('⚠️ Cache health validation failed, proceeding with fresh sync');
      cacheMonitoringService.logCacheCorruption('sync_health_check', 'Cache health validation failed', { sessionId });
    }

    console.log('🌐 SYNC: Starting sync operation', { sessionId, timestamp: new Date().toISOString() });
    this.syncStatus.syncInProgress = true;
    this.saveSyncStatus();

    const result: SyncResult = {
      success: true,
      syncedTables: [],
      errors: [],
      conflicts: []
    };

    try {

      // Validate schema before syncing
      try {
        const schemaResult = await this.schemaValidator.validateSchema();
        if (!schemaResult.isValid) {
          console.warn('⚠️ Schema validation failed:', schemaResult.errors);
          result.errors.push(`Schema validation failed: ${schemaResult.errors.length} errors found`);
        }
      } catch (schemaError) {
        console.warn('⚠️ Schema validation error:', schemaError);
        result.errors.push(`Schema validation error: ${schemaError.message}`);
      }

      // Sync each table
      const tables = ['attendees', 'sponsors', 'seat_assignments', 'agenda_items', 'dining_options', 'hotels', 'seating_configurations', 'user_profiles'];
      
      // Sync application database tables
      const applicationTables = ['speaker_assignments', 'agenda_item_metadata', 'attendee_metadata'];
      
      for (const table of tables) {
        try {
          await this.syncTable(table);
          result.syncedTables.push(table);
        } catch (error) {
          const errorMsg = `Failed to sync ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Sync application database tables
      for (const table of applicationTables) {
        try {
          await this.syncApplicationTable(table);
          result.syncedTables.push(table);
        } catch (error) {
          const errorMsg = `Failed to sync application table ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Update sync status
      this.syncStatus.lastSync = new Date().toISOString();
      this.syncStatus.pendingChanges = 0;
      this.syncStatus.syncInProgress = false;
      this.saveSyncStatus();
      
      console.log('🌐 SYNC: Sync completed', {
        success: result.success,
        syncedTables: result.syncedTables.length,
        errors: result.errors.length,
        sessionId,
        timestamp: new Date().toISOString()
      });
      
      if (result.errors.length > 0) {
        console.warn(`⚠️ Sync completed with errors: ${result.errors.join(', ')}`);
        result.errors.forEach(error => {
          cacheMonitoringService.logSyncFailure('syncAllData', error, { sessionId, syncedTables: result.syncedTables });
        });
      }

    } catch (error) {
      console.error('❌ Sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      cacheMonitoringService.logSyncFailure('syncAllData', error.message, { sessionId, error });
    } finally {
      this.syncStatus.syncInProgress = false;
      this.saveSyncStatus();
    }

    return result;
  }

  /**
   * Sync individual table
   */
  private async syncTable(tableName: string): Promise<void> {
    console.log(`🔄 Syncing ${tableName}...`);

    try {
      // Get Supabase table name
      const supabaseTable = this.tableToSupabaseTable[tableName];
      if (!supabaseTable) {
        throw new Error(`No Supabase table configured for: ${tableName}`);
      }

      // Query data from Supabase
      const { data, error } = await supabase
        .from(supabaseTable)
        .select('*');
      
      if (error) {
        throw new Error(`Supabase query failed: ${error.message}`);
      }

      let records = data || [];

      // Apply data transformation for specific tables
      if (tableName === 'agenda_items') {
        try {
          // Debug: Log raw data structure
          console.log('🔍 Raw agenda_items data structure:', records[0] ? Object.keys(records[0]) : 'No data');
          console.log('🔍 First agenda item raw data:', records[0]);
          
          // Import and apply AgendaTransformer
          const { AgendaTransformer } = await import('../transformers/agendaTransformer.js');
          const agendaTransformer = new AgendaTransformer();
          records = agendaTransformer.transformArrayFromDatabase(records);
          records = agendaTransformer.sortAgendaItems(records);
          console.log(`🔧 Applied AgendaTransformer to ${records.length} agenda items`);
          console.log('🔍 Transformed first agenda item:', records[0]);
        } catch (transformError) {
          console.warn(`⚠️ Failed to transform agenda_items:`, transformError);
          // Continue with raw data if transformation fails
        }
      }

      // Cache the data
      await this.cacheTableData(tableName, records);

    } catch (error) {
      console.error(`❌ Failed to sync ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Sync application database table
   */
  private async syncApplicationTable(tableName: string): Promise<void> {
    console.log(`🔄 Syncing application table ${tableName}...`);

    try {
      // Get Supabase table name
      const supabaseTable = this.tableToSupabaseTable[tableName];
      if (!supabaseTable) {
        throw new Error(`No Supabase table configured for: ${tableName}`);
      }

      // Query data from application database
      const { data, error } = await applicationDb
        .from(supabaseTable)
        .select('*');
      
      if (error) {
        throw new Error(`Application database query failed: ${error.message}`);
      }

      // Cache the data
      await this.cacheTableData(tableName, data || []);

    } catch (error) {
      console.error(`❌ Failed to sync application table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Cache table data to IndexedDB
   */
  async cacheTableData(tableName: string, data: any[]): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${tableName}`;
      
      // Sanitize attendees data to remove access_code before caching
      let sanitizedData = data;
      if (tableName === 'attendees') {
        sanitizedData = data.map(attendee => sanitizeAttendeeForStorage(attendee));
      }
      
      // ✅ NEW: Use cache versioning service for proper cache entry creation
      const cacheEntry = cacheVersioningService.createCacheEntry(sanitizedData);
      
      // Log cache operation
      console.log(`💾 Caching ${tableName} with versioning:`, {
        tableName,
        recordCount: sanitizedData.length,
        version: cacheEntry.version,
        ttl: Math.round(cacheEntry.ttl / 1000) + 's',
        checksum: cacheEntry.checksum
      });

      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      
      // Update cache size tracking
      this.updateCacheSize();
      
      // Also cache in service worker for faster access (with sanitized data)
      this.cacheInServiceWorker(tableName, sanitizedData);
      
    } catch (error) {
      console.error(`❌ Failed to cache ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Cache data in service worker
   */
  private async cacheInServiceWorker(tableName: string, data: any[]): Promise<void> {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        const registration = await navigator.serviceWorker.ready;
        const supabaseTable = this.tableToSupabaseTable[tableName];
        
        if (supabaseTable && registration.active) {
          // Create a cache key for the Supabase table
          const cacheKey = `supabase_${supabaseTable}`;
          registration.active.postMessage({
            type: 'CACHE_DATA',
            data: { [cacheKey]: data }
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to cache data in service worker:', error);
    }
  }

  /**
   * Get cached table data
   */
  async getCachedTableData<T>(tableName: string): Promise<T[]> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${tableName}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return [];
      }

      const cacheData = JSON.parse(cached);
      
      // Check if cache is still valid
      if (this.isCacheValid(cacheData)) {
        return cacheData.data || [];
      } else {
        // Cache expired, return empty array to prevent infinite recursion
        console.log(`⚠️ Cache expired for ${tableName}, returning empty data`);
        return [];
      }

    } catch (error) {
      console.error(`❌ Failed to get cached ${tableName}:`, error);
      return [];
    }
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(cacheData: any): boolean {
    if (!cacheData || !cacheData.timestamp) {
      return false;
    }

    // Check for future timestamps (cache corruption detection)
    const now = Date.now();
    if (cacheData.timestamp > now) {
      console.warn('⚠️ Future timestamp detected in cache data, marking as invalid');
      return false;
    }

    const age = now - cacheData.timestamp;
    return age < this.cacheConfig.maxAge;
  }

  /**
   * Validate cache health and detect corruption
   * Story 2.1c: Fix Cache Validation Logic
   */
  private validateCacheHealth(): boolean {
    try {
      const syncStatus = localStorage.getItem(this.SYNC_STATUS_KEY);
      if (syncStatus) {
        const status = JSON.parse(syncStatus);
        const lastSync = new Date(status.lastSync);
        const now = new Date();
        
        // Check for future timestamps (time override issue)
        if (lastSync > now) {
          console.warn('⚠️ Future timestamp detected in cache, clearing...');
          this.clearCache();
          return false;
        }
      }
      return true;
    } catch (error) {
      console.warn('⚠️ Cache validation failed:', error);
      return false;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Force sync all data
   */
  async forceSync(): Promise<SyncResult> {
    console.log('🔄 Force syncing all data...');
    return this.syncAllData();
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('🗑️ Cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Update cache size tracking
   */
  private updateCacheSize(): void {
    try {
      let totalSize = 0;
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += new Blob([value]).size;
          }
        }
      });

      const sizeMB = totalSize / (1024 * 1024);
      
      if (sizeMB > this.cacheConfig.maxSize) {
        console.warn(`⚠️ Cache size exceeded: ${sizeMB.toFixed(2)}MB`);
        this.cleanupOldCache();
      }

    } catch (error) {
      console.error('❌ Failed to update cache size:', error);
    }
  }

  /**
   * Cleanup old cache entries
   */
  private cleanupOldCache(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheEntries = keys
        .filter(key => key.startsWith(this.CACHE_PREFIX))
        .map(key => ({
          key,
          data: JSON.parse(localStorage.getItem(key) || '{}')
        }))
        .sort((a, b) => a.data.timestamp - b.data.timestamp);

      // Remove oldest entries until under size limit
      let removed = 0;
      for (const entry of cacheEntries) {
        localStorage.removeItem(entry.key);
        removed++;
        
        // Check if we're under the limit now
        if (this.getCurrentCacheSize() < this.cacheConfig.maxSize) {
          break;
        }
      }

      console.log(`🗑️ Cleaned up ${removed} old cache entries`);

    } catch (error) {
      console.error('❌ Failed to cleanup cache:', error);
    }
  }

  /**
   * Get current cache size in MB
   */
  private getCurrentCacheSize(): number {
    try {
      let totalSize = 0;
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += new Blob([value]).size;
          }
        }
      });

      return totalSize / (1024 * 1024);
    } catch (error) {
      console.error('❌ Failed to get cache size:', error);
      return 0;
    }
  }

  /**
   * Save sync status to storage
   */
  private saveSyncStatus(): void {
    try {
      localStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(this.syncStatus));
    } catch (error) {
      console.error('❌ Failed to save sync status:', error);
    }
  }

  /**
   * Load sync status from storage
   */
  private loadSyncStatus(): void {
    try {
      const stored = localStorage.getItem(this.SYNC_STATUS_KEY);
      if (stored) {
        this.syncStatus = { ...this.syncStatus, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('❌ Failed to load sync status:', error);
    }
  }

  /**
   * Handle data conflicts
   */
  async resolveConflict(tableName: string, conflict: ConflictItem, resolution: 'local' | 'server'): Promise<boolean> {
    try {
      if (resolution === 'local') {
        // Use local data
        await this.cacheTableData(tableName, [conflict.localData]);
        console.log(`✅ Resolved conflict for ${tableName} using local data`);
      } else {
        // Use server data
        await this.cacheTableData(tableName, [conflict.serverData]);
        console.log(`✅ Resolved conflict for ${tableName} using server data`);
      }

      return true;
    } catch (error) {
      console.error(`❌ Failed to resolve conflict for ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Get offline data availability
   */
  async getOfflineDataStatus(): Promise<{ [tableName: string]: boolean }> {
    const tables = ['attendees', 'sponsors', 'seat_assignments', 'agenda_items', 'dining_options', 'hotels', 'seating_configurations', 'user_profiles'];
    const applicationTables = ['speaker_assignments', 'agenda_item_metadata', 'attendee_metadata'];
    const allTables = [...tables, ...applicationTables];
    const status: { [tableName: string]: boolean } = {};

    for (const table of allTables) {
      try {
        const data = await this.getCachedTableData(table);
        status[table] = data.length > 0;
      } catch (error) {
        status[table] = false;
      }
    }

    return status;
  }

  /**
   * Debug method to check what data is cached
   */
  async debugCachedData(): Promise<void> {
    console.log('🔍 Debugging cached data...');
    const tables = ['attendees', 'sponsors', 'seat_assignments', 'agenda_items', 'dining_options', 'hotels', 'seating_configurations', 'user_profiles'];
    const applicationTables = ['speaker_assignments', 'agenda_item_metadata', 'attendee_metadata'];
    const allTables = [...tables, ...applicationTables];
    
    for (const table of allTables) {
      try {
        const data = await this.getCachedTableData(table);
        console.log(`📊 ${table}: ${data.length} records cached`);
        if (data.length > 0) {
          console.log(`📊 ${table} sample record:`, data[0]);
        }
      } catch (error) {
        console.log(`❌ ${table}: Error getting cached data`, error);
      }
    }
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    this.stopPeriodicSync();
  }
}

// Export singleton instance
export const pwaDataSyncService = new PWADataSyncService();
