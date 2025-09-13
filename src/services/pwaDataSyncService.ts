/**
 * PWA Data Synchronization Service
 * Story 1.2: Database Integration & Data Access Layer Setup
 * 
 * Handles offline data caching, synchronization, and conflict resolution
 */

// All data reads must go through backend endpoints protected by RLS-aware auth

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

  private cacheConfig: CacheConfig = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 50 * 1024 * 1024, // 50MB
    syncInterval: 5 * 60 * 1000 // 5 minutes
  };

  private syncTimer: NodeJS.Timeout | null = null;
  
  // Map table names to backend API endpoints
  private readonly tableToEndpoint: Record<string, string> = {
    attendees: 'http://localhost:3000/api/db/table-data?table=attendees',
    sponsors: 'http://localhost:3000/api/db/table-data?table=sponsors',
    seat_assignments: 'http://localhost:3000/api/db/table-data?table=seat_assignments',
    agenda_items: 'http://localhost:3000/api/db/table-data?table=agenda_items',
    dining_options: 'http://localhost:3000/api/db/table-data?table=dining_options',
    hotels: 'http://localhost:3000/api/db/table-data?table=hotels',
    seating_configurations: 'http://localhost:3000/api/db/table-data?table=seating_configurations',
    user_profiles: 'http://localhost:3000/api/db/table-data?table=user_profiles'
  };

  constructor() {
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
      console.log('🌐 Online - Starting sync');
      this.syncStatus.isOnline = true;
      this.startPeriodicSync();
      this.syncAllData();
    });

    window.addEventListener('offline', () => {
      console.log('📱 Offline - Stopping sync');
      this.syncStatus.isOnline = false;
      this.stopPeriodicSync();
    });

    // Sync when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.syncStatus.isOnline) {
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
      if (this.syncStatus.isOnline && !this.syncStatus.syncInProgress) {
        this.syncAllData();
      }
    }, this.cacheConfig.syncInterval);
  }

  /**
   * Register background sync with service worker
   */
  private async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('data-sync');
        console.log('🔄 Background sync registered');
      } catch (error) {
        console.warn('⚠️ Background sync registration failed:', error);
      }
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
    if (this.syncStatus.syncInProgress) {
      console.log('⏳ Sync already in progress');
      return {
        success: false,
        syncedTables: [],
        errors: ['Sync already in progress'],
        conflicts: []
      };
    }

    this.syncStatus.syncInProgress = true;
    this.saveSyncStatus();

    const result: SyncResult = {
      success: true,
      syncedTables: [],
      errors: [],
      conflicts: []
    };

    try {
      console.log('🔄 Starting data synchronization...');

      // Sync each table
      const tables = ['attendees', 'sponsors', 'seat_assignments', 'agenda_items', 'dining_options', 'hotels'];
      
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

      // Update sync status
      this.syncStatus.lastSync = new Date().toISOString();
      this.syncStatus.pendingChanges = 0;
      this.syncStatus.syncInProgress = false;
      this.saveSyncStatus();

      console.log('✅ Data synchronization completed');
      console.log(`📊 Synced tables: ${result.syncedTables.join(', ')}`);
      
      if (result.errors.length > 0) {
        console.warn(`⚠️ Errors: ${result.errors.join(', ')}`);
      }

    } catch (error) {
      console.error('❌ Sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
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
      // Get data from backend API (server-side authenticated)
      const endpoint = this.tableToEndpoint[tableName];
      if (!endpoint) {
        throw new Error(`No endpoint configured for table: ${tableName}`);
      }

      const response = await fetch(endpoint, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(response.statusText || `HTTP ${response.status}`);
      }
      const json = await response.json();
      const data = (json?.data ?? json) as any[];

      // Cache the data
      await this.cacheTableData(tableName, data || []);
      
      console.log(`✅ ${tableName} synced (${data?.length || 0} records)`);

    } catch (error) {
      console.error(`❌ Failed to sync ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Cache table data to IndexedDB
   */
  private async cacheTableData(tableName: string, data: any[]): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${tableName}`;
      const cacheData = {
        data,
        timestamp: Date.now(),
        version: 1
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // Update cache size tracking
      this.updateCacheSize();
      
      // Also cache in service worker for faster access
      this.cacheInServiceWorker(tableName, data);
      
    } catch (error) {
      console.error(`❌ Failed to cache ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Cache data in service worker
   */
  private async cacheInServiceWorker(tableName: string, data: any[]): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const endpoint = this.tableToEndpoint[tableName];
        
        if (endpoint) {
          registration.active?.postMessage({
            type: 'CACHE_DATA',
            data: { [endpoint]: data }
          });
        }
      } catch (error) {
        console.warn('⚠️ Failed to cache data in service worker:', error);
      }
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

    const age = Date.now() - cacheData.timestamp;
    return age < this.cacheConfig.maxAge;
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
    const tables = ['attendees', 'sponsors', 'seat_assignments', 'agenda_items', 'dining_options', 'hotels'];
    const status: { [tableName: string]: boolean } = {};

    for (const table of tables) {
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
   * Cleanup on destroy
   */
  destroy(): void {
    this.stopPeriodicSync();
  }
}

// Export singleton instance
export const pwaDataSyncService = new PWADataSyncService();
