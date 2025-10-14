/**
 * PWA Data Synchronization Service
 * Story 1.2: Database Integration & Data Access Layer Setup
 * Story 1.3: PWA Polish & Branding - Added schema validation
 * 
 * Handles offline data caching, synchronization, and conflict resolution
 */

// All data reads must go through backend endpoints protected by RLS-aware auth
// import { SchemaValidationService } from './schemaValidationService';
import { supabase } from '../lib/supabase.js';
// Removed sanitizeAttendeeForStorage - now using AttendeeCacheFilterService for comprehensive filtering
import { applicationDb } from './applicationDatabaseService.ts';
import { cacheMonitoringService } from './cacheMonitoringService.ts';
import { cacheVersioningService, type CacheEntry } from './cacheVersioningService.ts';
import { BaseService } from './baseService.ts';
import { isTimestampExpired } from '../utils/timestampUtils.ts';
import { TABLE_MAPPINGS, getAllApplicationTables, getAllMainTables, isValidApplicationTable, isValidMainTable, type ApplicationTableName, type MainTableName } from '../config/tableMappings.ts';
import { serviceRegistry } from './ServiceRegistry.ts';
import { SupabaseClientFactory } from './SupabaseClientFactory.ts';

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

export class PWADataSyncService extends BaseService {
  private readonly CACHE_PREFIX = 'kn_cache_';
  private readonly SYNC_STATUS_KEY = 'kn_sync_status';
  private readonly CONFLICT_KEY = 'kn_conflicts';
  
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    lastSync: null,
    pendingChanges: 0,
    syncInProgress: false
  };

  private isSyncInProgress = false;
  private syncLockTimeout: NodeJS.Timeout | null = null;
  private syncAbortController?: AbortController;
  private isLogoutInProgress = false;

  private schemaValidator: any | null = null;
  
  // Circuit breaker for service worker caching failures
  private serviceWorkerFailureCount = 0;
  private readonly MAX_SERVICE_WORKER_FAILURES = 3;
  private serviceWorkerCircuitOpen = false;
  private lastServiceWorkerFailure: number | null = null;
  private readonly CIRCUIT_RESET_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  
  // Circuit breaker for online status changes
  private lastStatusChange = 0;
  private readonly STATUS_DEBOUNCE_MS = 1000; // 1 second debounce
  
  // Protection against recursive cache invalidation calls
  private cacheInvalidationInProgress = new Set<string>();
  
  // Circuit breaker for application database sync failures
  private applicationDbFailureCount = 0;
  private readonly MAX_APPLICATION_DB_FAILURES = 3;
  private applicationDbCircuitOpen = false;
  private lastApplicationDbFailure: number | null = null;
  private readonly APPLICATION_DB_CIRCUIT_RESET_TIMEOUT = 10 * 60 * 1000; // 10 minutes

  private cacheConfig: CacheConfig = {
    maxAge: this.isLocalMode() ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000, // 24h local, 1h prod
    maxSize: 50 * 1024 * 1024, // 50MB
    syncInterval: this.isLocalMode() ? 30 * 60 * 1000 : 5 * 60 * 1000 // 30min local, 5min prod
  };

  private syncTimer: NodeJS.Timeout | null = null;
  
  // Use centralized table mappings configuration
  private readonly tableMappings = TABLE_MAPPINGS;

  constructor() {
    super();
    this.initializeSchemaValidator();
    // ❌ REMOVED: this.initializeSync() - Now started explicitly after login
    // This prevents periodic sync from starting when user is logged out
    this.setupEventListeners();
    this.clearCorruptedCacheOnStartup();
    this.registerCacheInvalidationCallbacks();
  }

  /**
   * Check if running in local development mode
   */
  private isLocalMode(): boolean {
    return import.meta.env.DEV || import.meta.env.MODE === 'development';
  }

  /**
   * Register cache invalidation callbacks with service registry
   */
  private registerCacheInvalidationCallbacks(): void {
    // Register callback for dining_item_metadata table
    serviceRegistry.registerCacheInvalidationCallback('dining_item_metadata', 
      () => this.handleDiningMetadataInvalidation()
    );
    
    // Register callback for agenda_item_metadata table
    serviceRegistry.registerCacheInvalidationCallback('agenda_item_metadata', 
      () => this.handleAgendaMetadataInvalidation()
    );
    
    // Register callback for attendee_metadata table
    serviceRegistry.registerCacheInvalidationCallback('attendee_metadata', 
      () => this.handleAttendeeMetadataInvalidation()
    );
    
    // Cache invalidation callbacks registered silently
  }

  /**
   * Handle dining metadata cache invalidation
   */
  private async handleDiningMetadataInvalidation(): Promise<void> {
    const tableName = 'dining_item_metadata';
    
    // Prevent recursive calls
    if (this.cacheInvalidationInProgress.has(tableName)) {
      return;
    }
    
    this.cacheInvalidationInProgress.add(tableName);
    
    try {
      // Remove the recursive invalidateCache call - it's already being invalidated
      // await this.invalidateCache('dining_item_metadata'); // ❌ REMOVED - causes infinite loop
      await this.syncApplicationTable('dining_item_metadata');
    } catch (error) {
      console.error('❌ PWA Data Sync: Failed to refresh dining metadata cache:', error);
    } finally {
      this.cacheInvalidationInProgress.delete(tableName);
    }
  }

  /**
   * Handle agenda metadata cache invalidation
   */
  private async handleAgendaMetadataInvalidation(): Promise<void> {
    const tableName = 'agenda_item_metadata';
    
    // Prevent recursive calls
    if (this.cacheInvalidationInProgress.has(tableName)) {
      return;
    }
    
    this.cacheInvalidationInProgress.add(tableName);
    
    try {
      // Remove the recursive invalidateCache call - it's already being invalidated
      // await this.invalidateCache('agenda_item_metadata'); // ❌ REMOVED - causes infinite loop
      await this.syncApplicationTable('agenda_item_metadata');
    } catch (error) {
      console.error('❌ PWA Data Sync: Failed to refresh agenda metadata cache:', error);
    } finally {
      this.cacheInvalidationInProgress.delete(tableName);
    }
  }

  /**
   * Handle attendee metadata cache invalidation
   */
  private async handleAttendeeMetadataInvalidation(): Promise<void> {
    const tableName = 'attendee_metadata';
    
    // Prevent recursive calls
    if (this.cacheInvalidationInProgress.has(tableName)) {
      return;
    }
    
    this.cacheInvalidationInProgress.add(tableName);
    
    try {
      // Remove the recursive invalidateCache call - it's already being invalidated
      // await this.invalidateCache('attendee_metadata'); // ❌ REMOVED - causes infinite loop
      await this.syncApplicationTable('attendee_metadata');
    } catch (error) {
      console.error('❌ PWA Data Sync: Failed to refresh attendee metadata cache:', error);
    } finally {
      this.cacheInvalidationInProgress.delete(tableName);
    }
  }

  /**
   * Initialize schema validator only in production mode
   * DEPRECATED: Use getSchemaValidator() for lazy loading instead
   */
  private initializeSchemaValidator(): void {
    // This method is kept for backward compatibility but should not be used
    // Schema validation is now lazy-loaded via getSchemaValidator()
  }

  /**
   * Get schema validator with lazy loading (only in production)
   */
  private async getSchemaValidator(): Promise<any | null> {
    // Skip schema validation in local development
    if (this.isLocalMode()) {
      return null;
    }
    
    // Lazy load schema validator only when needed
    if (!this.schemaValidator) {
      try {
        const { SchemaValidationService } = await import('./schemaValidationService');
        this.schemaValidator = new SchemaValidationService();
      } catch (error) {
        console.warn('⚠️ Failed to initialize schema validation service:', error);
        return null;
      }
    }
    
    return this.schemaValidator;
  }

  /**
   * Check if application database circuit breaker is open
   */
  private isApplicationDbCircuitOpen(): boolean {
    if (!this.applicationDbCircuitOpen) {
      return false;
    }
    
    // Check if enough time has passed to reset the circuit
    if (this.lastApplicationDbFailure && 
        Date.now() - this.lastApplicationDbFailure > this.APPLICATION_DB_CIRCUIT_RESET_TIMEOUT) {
      this.applicationDbCircuitOpen = false;
      this.applicationDbFailureCount = 0;
      this.lastApplicationDbFailure = null;
      return false;
    }
    
    return true;
  }

  /**
   * Record application database failure and potentially open circuit breaker
   */
  private recordApplicationDbFailure(): void {
    this.applicationDbFailureCount++;
    this.lastApplicationDbFailure = Date.now();
    
    if (this.applicationDbFailureCount >= this.MAX_APPLICATION_DB_FAILURES) {
      this.applicationDbCircuitOpen = true;
      console.warn(`⚠️ Application DB: Circuit breaker opened after ${this.applicationDbFailureCount} failures. Application database sync disabled for ${this.APPLICATION_DB_CIRCUIT_RESET_TIMEOUT / 1000 / 60} minutes.`);
    }
  }

  /**
   * Record application database success and reset failure count
   */
  private recordApplicationDbSuccess(): void {
    if (this.applicationDbFailureCount > 0) {
      this.applicationDbFailureCount = 0;
      this.applicationDbCircuitOpen = false;
      this.lastApplicationDbFailure = null;
    }
  }

  /**
   * Clear corrupted cache on startup to prevent validation loops
   */
  private async clearCorruptedCacheOnStartup(): Promise<void> {
    try {
      // Import unifiedCacheService dynamically to avoid circular dependencies
      const { unifiedCacheService } = await import('./unifiedCacheService');
      
      // Force clear agenda items cache specifically to resolve persistent corruption
      await unifiedCacheService.clearAgendaItemsCache();
      
      // Also clear any other corrupted entries
      await unifiedCacheService.clearCorruptedCache();
      
    } catch (error) {
      console.warn('⚠️ Failed to clear corrupted cache on startup:', error);
    }
  }

  /**
   * Get cache TTL for specific table based on environment and data type
   * Fixed TTL management to prevent premature expiration
   */
  private getCacheTTL(tableName: string): number {
    // Use consistent TTL regardless of environment to prevent confusion
    const baseTTL = 24 * 60 * 60 * 1000; // 24 hours base TTL
    
    // Different TTLs for different data types with more generous timeouts
    const ttlOverrides: Record<string, number> = {
      'agenda_items': 2 * 60 * 60 * 1000, // 2 hours for dynamic data (was 5 minutes)
      'attendees': 7 * 24 * 60 * 60 * 1000, // 7 days for static data (was 24 hours)
      'speaker_assignments': 7 * 24 * 60 * 60 * 1000, // 7 days for static data
      'sponsors': 7 * 24 * 60 * 60 * 1000, // 7 days for static data
      'seat_assignments': 7 * 24 * 60 * 60 * 1000, // 7 days for static data
      'dining_options': 7 * 24 * 60 * 60 * 1000, // 7 days for static data
      'hotels': 7 * 24 * 60 * 60 * 1000, // 7 days for static data
      'seating_configurations': 7 * 24 * 60 * 60 * 1000, // 7 days for static data
      'user_profiles': 7 * 24 * 60 * 60 * 1000, // 7 days for static data
    };

    return ttlOverrides[tableName] || baseTTL;
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

  // Store event handler references for cleanup
  private handleOnlineEvent = () => {
    this.setOnlineStatus(true);
    this.startPeriodicSync();
    if (this.isUserAuthenticated()) {
      this.syncAllData();
    }
  };

  private handleOfflineEvent = () => {
    this.setOnlineStatus(false);
    this.stopPeriodicSync();
  };

  private handleVisibilityChange = () => {
    const willSync = !document.hidden && this.syncStatus.isOnline && this.isUserAuthenticated();
    
    cacheMonitoringService.logVisibilityChange(document.hidden, willSync, {
      isOnline: this.syncStatus.isOnline,
      isAuthenticated: this.isUserAuthenticated(),
      lastSync: this.syncStatus.lastSync
    });
      
    if (willSync) {
      this.syncAllData();
    }
  };

  /**
   * Setup event listeners for online/offline status
   */
  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnlineEvent);
    window.addEventListener('offline', this.handleOfflineEvent);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
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
      }
    } catch (error) {
      console.warn('⚠️ Background sync registration failed:', error);
    }
  }

  /**
   * Stop periodic synchronization
   * Made public to support logout cleanup
   */
  public stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Sync all data tables
   */
  async syncAllData(): Promise<SyncResult> {
    // 🛑 GUARD: Don't start sync if logout is in progress
    if (this.isLogoutInProgress) {
      // 🔧 SAFETY FIX: If flag has been stuck for too long, reset it automatically
      // This prevents the flag from permanently blocking sync operations
      const lastLogoutTime = localStorage.getItem('kn_last_logout_time');
      if (lastLogoutTime) {
        const logoutTime = new Date(lastLogoutTime).getTime();
        const now = Date.now();
        const timeSinceLogout = now - logoutTime;
        
        // If more than 5 minutes have passed since logout, reset the flag
        if (timeSinceLogout > 5 * 60 * 1000) {
          console.warn('🔧 SAFETY: Logout flag stuck for >5 minutes, auto-resetting');
          this.isLogoutInProgress = false;
          localStorage.removeItem('kn_last_logout_time');
        } else {
          return {
            success: false,
            syncedTables: [],
            errors: ['Sync cancelled - logout in progress'],
            timestamp: new Date().toISOString()
          };
        }
      } else {
        // No logout timestamp, flag might be stuck from previous session
        console.warn('🔧 SAFETY: Logout flag set but no logout timestamp, auto-resetting');
        this.isLogoutInProgress = false;
      }
    }

    const sessionId = cacheMonitoringService.getSessionId();
    
    // Check if sync is already in progress
    if (this.isSyncInProgress) {
      cacheMonitoringService.logSyncFailure('syncAllData', 'Sync already in progress', { sessionId });
      return {
        success: false,
        syncedTables: [],
        errors: ['Sync already in progress'],
        conflicts: []
      };
    }
    
    // Set lock and create abort controller for this sync
    this.isSyncInProgress = true;
    this.syncAbortController = new AbortController();
    
    // Set timeout to release lock if sync takes too long (2 minutes)
    this.syncLockTimeout = setTimeout(() => {
      console.warn('⚠️ SYNC: Sync operation timed out, releasing lock');
      this.isSyncInProgress = false;
    }, 120000);

    // Validate cache health before syncing
    if (!this.validateCacheHealth()) {
      console.warn('⚠️ Cache health validation failed, proceeding with fresh sync');
      cacheMonitoringService.logCacheCorruption('sync_health_check', 'Cache health validation failed', { sessionId });
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

      // Validate schema before syncing (lazy-loaded only in production)
      try {
        const schemaValidator = await this.getSchemaValidator();
        if (schemaValidator) {
          const schemaResult = await schemaValidator.validateSchema();
          if (!schemaResult.isValid) {
            console.warn('⚠️ Schema validation failed:', schemaResult.errors);
            result.errors.push(`Schema validation failed: ${schemaResult.errors.length} errors found`);
          }
        }
      } catch (schemaError) {
        console.warn('⚠️ Schema validation error:', schemaError);
        result.errors.push(`Schema validation error: ${schemaError.message}`);
      }

      // Sync each table using centralized configuration
      const tables = getAllMainTables();
      
      // Sync application database tables using centralized configuration
      const applicationTables = getAllApplicationTables();
      
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

      // ✅ NEW: Add attendee data sync
      try {
        const { attendeeSyncService } = await import('./attendeeSyncService');
        const attendeeResult = await attendeeSyncService.refreshAttendeeData();
        if (attendeeResult.success) {
          result.syncedTables.push('attendee_data');
        } else {
          console.warn('⚠️ Attendee data sync failed:', attendeeResult.error);
          result.errors.push(`Attendee sync failed: ${attendeeResult.error}`);
        }
      } catch (attendeeError) {
        console.warn('⚠️ Attendee data sync error:', attendeeError);
        result.errors.push(`Attendee sync error: ${attendeeError instanceof Error ? attendeeError.message : 'Unknown error'}`);
      }

      // Update sync status
      this.syncStatus.lastSync = new Date().toISOString();
      this.syncStatus.pendingChanges = 0;
      this.syncStatus.syncInProgress = false;
      this.saveSyncStatus();
      
      
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
      // Always release lock
      this.isSyncInProgress = false;
      if (this.syncLockTimeout) {
        clearTimeout(this.syncLockTimeout);
        this.syncLockTimeout = null;
      }
      this.syncStatus.syncInProgress = false;
      this.saveSyncStatus();
    }

    return result;
  }

  /**
   * Sync individual table
   */
  private async syncTable(tableName: MainTableName): Promise<void> {

    try {
      // Validate table name and get Supabase table name
      if (!isValidMainTable(tableName)) {
        throw new Error(`Invalid main table name: ${tableName}`);
      }
      const supabaseTable = this.tableMappings.main[tableName];

      // Query data from Supabase
      const { data, error } = await supabase
        .from(supabaseTable)
        .select('*');
      
      if (error) {
        throw new Error(`Supabase query failed: ${error.message}`);
      }

      let records = data || [];

      // ✅ FIX: Add defensive check for data before processing
      if (!records || !Array.isArray(records)) {
        throw new Error(`Invalid data received from Supabase for ${tableName}: ${typeof records}`);
      }

      // Apply data transformation for specific tables
      if (tableName === 'agenda_items') {
        try {
          // Debug: Log raw data structure
          
          // Import and apply AgendaTransformer
          const { AgendaTransformer } = await import('../transformers/agendaTransformer.js');
          const agendaTransformer = new AgendaTransformer();
          records = agendaTransformer.transformArrayFromDatabase(records);
          records = agendaTransformer.sortAgendaItems(records);
        } catch (transformError) {
          console.warn(`⚠️ Failed to transform agenda_items:`, transformError);
          // Continue with raw data if transformation fails
        }
      }

      // ✅ FIX: Validate records before caching
      if (!records || !Array.isArray(records)) {
        throw new Error(`Records became invalid after processing for ${tableName}: ${typeof records}`);
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
  async syncApplicationTable(tableName: ApplicationTableName): Promise<void> {

    // Check circuit breaker first
    if (this.isApplicationDbCircuitOpen()) {
      return;
    }

    try {
      // Validate table name and get Supabase table name
      if (!isValidApplicationTable(tableName)) {
        throw new Error(`Invalid application table name: ${tableName}`);
      }
      const supabaseTable = this.tableMappings.application[tableName];


      // Query data from application database using service registry
      const applicationDbClient = serviceRegistry.getApplicationDbClient();
      
      // Enhanced debugging for application database connection
      if (!applicationDbClient) {
        console.error(`❌ PWA Data Sync: Application database client is null for ${tableName}`);
        this.recordApplicationDbFailure();
        throw new Error(`Application database client not available for ${tableName}`);
      }
      

      const { data, error } = await applicationDbClient
        .from(supabaseTable)
        .select('*');
      
      if (error) {
        console.error(`❌ PWA Data Sync: Application database query failed for ${tableName}:`, {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          tableName,
          supabaseTable
        });
        this.recordApplicationDbFailure();
        throw new Error(`Application database query failed: ${error.message}`);
      }

      
      // Enhanced debugging for empty results
      if (!data || data.length === 0) {
        console.warn(`⚠️ PWA Data Sync: No records found in ${supabaseTable} for ${tableName}`);
      }

      // ✅ FIX: Add defensive check for data before processing
      if (!data || !Array.isArray(data)) {
        this.recordApplicationDbFailure();
        throw new Error(`Invalid data received from application database for ${tableName}: ${typeof data}`);
      }

      // Validate data before caching to prevent overwriting user changes
      if (data && data.length > 0) {
        
        // Check for data integrity
        const validRecords = data.filter(record => {
          if (!record.id) {
            console.warn(`⚠️ PWA Data Sync: Record missing ID in ${tableName}:`, record);
            return false;
          }
          return true;
        });
        
        if (validRecords.length !== data.length) {
          console.warn(`⚠️ PWA Data Sync: Filtered out ${data.length - validRecords.length} invalid records for ${tableName}`);
        }
        
        // ✅ FIX: Validate records before caching
        if (!validRecords || !Array.isArray(validRecords)) {
          this.recordApplicationDbFailure();
          throw new Error(`ValidRecords became invalid for ${tableName}: ${typeof validRecords}`);
        }
        
        // Cache the validated data
        await this.cacheTableData(tableName, validRecords);
        this.recordApplicationDbSuccess();
      } else {
        // Handle empty results with caution
        
        // For dining_item_metadata, check if we should preserve existing cache
        if (tableName === 'dining_item_metadata') {
          const existingCache = await this.getCachedTableData(tableName);
          if (existingCache && existingCache.length > 0) {
            console.warn(`⚠️ PWA Data Sync: Preserving existing ${existingCache.length} dining metadata records to prevent data loss`);
            // Don't overwrite existing data with empty results
            return;
          }
        }
        
        // Cache empty data only if no existing data
        await this.cacheTableData(tableName, []);
        this.recordApplicationDbSuccess();
      }

    } catch (error) {
      console.error(`❌ PWA Data Sync: Failed to sync application table ${tableName}:`, error);
      this.recordApplicationDbFailure();
      throw error;
    }
  }

  /**
   * Cache table data to IndexedDB
   */
  async cacheTableData(tableName: string, data: any[]): Promise<void> {
    try {
      // 🛑 GUARD: Prevent cache writes during logout
      if (this.isLogoutInProgress) {
        return;
      }

      const cacheKey = `${this.CACHE_PREFIX}${tableName}`;
      
      // ✅ FIX: Add defensive check for undefined data
      if (!data || !Array.isArray(data)) {
        throw new Error(`Invalid data provided for caching ${tableName}: ${typeof data}`);
      }
      
      // Apply comprehensive confidential data filtering for attendees
      let sanitizedData = data;
      // QA FIX: Handle both 'attendees' (plural) and 'attendee' (singular) table names
      if (tableName === 'attendees' || tableName === 'attendee') {
        // Use AttendeeCacheFilterService for comprehensive filtering
        const { AttendeeCacheFilterService } = await import('./attendeeCacheFilterService');
        sanitizedData = await AttendeeCacheFilterService.filterAttendeesArray(data);
        
        // ✅ FIX: Validate filtered data
        if (!sanitizedData || !Array.isArray(sanitizedData)) {
          throw new Error(`AttendeeCacheFilterService returned invalid data for ${tableName}`);
        }
      }
      
      // ✅ NEW: Use cache versioning service for proper cache entry creation with environment-aware TTL
      const ttl = this.getCacheTTL(tableName);
      const cacheEntry = cacheVersioningService.createCacheEntry(sanitizedData, ttl);
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      
      // Update cache size tracking
      this.updateCacheSize();
      
      // Also cache in service worker for faster access (with sanitized data)
      // This is optional - if it fails, the main localStorage cache still works
      try {
        await this.cacheInServiceWorker(tableName, sanitizedData);
      } catch (serviceWorkerError) {
        // Don't throw - service worker caching is optional
        console.warn(`⚠️ Service worker caching failed for ${tableName}, but localStorage cache succeeded:`, serviceWorkerError);
      }
      
    } catch (error) {
      console.error(`❌ Failed to cache ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Check if service worker circuit breaker is open
   */
  private isServiceWorkerCircuitOpen(): boolean {
    if (!this.serviceWorkerCircuitOpen) {
      return false;
    }
    
    // Check if enough time has passed to reset the circuit
    if (this.lastServiceWorkerFailure && 
        Date.now() - this.lastServiceWorkerFailure > this.CIRCUIT_RESET_TIMEOUT) {
      this.serviceWorkerCircuitOpen = false;
      this.serviceWorkerFailureCount = 0;
      this.lastServiceWorkerFailure = null;
      return false;
    }
    
    return true;
  }

  /**
   * Record service worker failure and potentially open circuit breaker
   */
  private recordServiceWorkerFailure(): void {
    this.serviceWorkerFailureCount++;
    this.lastServiceWorkerFailure = Date.now();
    
    if (this.serviceWorkerFailureCount >= this.MAX_SERVICE_WORKER_FAILURES) {
      this.serviceWorkerCircuitOpen = true;
      console.warn(`⚠️ Service Worker: Circuit breaker opened after ${this.serviceWorkerFailureCount} failures. Service worker caching disabled for ${this.CIRCUIT_RESET_TIMEOUT / 1000 / 60} minutes.`);
    }
  }

  /**
   * Record service worker success and reset failure count
   */
  private recordServiceWorkerSuccess(): void {
    if (this.serviceWorkerFailureCount > 0) {
      this.serviceWorkerFailureCount = 0;
      this.serviceWorkerCircuitOpen = false;
      this.lastServiceWorkerFailure = null;
    }
  }

  /**
   * Cache data in service worker with circuit breaker protection
   */
  private async cacheInServiceWorker(tableName: string, data: any[]): Promise<void> {
    // Check circuit breaker first
    if (this.isServiceWorkerCircuitOpen()) {
      return;
    }

    // ✅ FIX: Add defensive check for undefined data before service worker operations
    if (!data || !Array.isArray(data)) {
      this.recordServiceWorkerFailure();
      return;
    }

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        const registration = await navigator.serviceWorker.ready;
        
        // Use existing TABLE_MAPPINGS configuration instead of undefined tableToSupabaseTable
        const supabaseTable = this.tableMappings.application[tableName as ApplicationTableName] || 
                             this.tableMappings.main[tableName as MainTableName];
        
        if (supabaseTable && registration.active) {
          // Create a cache key for the Supabase table
          const cacheKey = `supabase_${supabaseTable}`;
          registration.active.postMessage({
            type: 'CACHE_DATA',
            data: { [cacheKey]: data }
          });
          this.recordServiceWorkerSuccess();
        } else {
          console.warn(`⚠️ Service Worker: No mapping found for table ${tableName} or service worker not active`);
          this.recordServiceWorkerFailure();
        }
      } else {
        console.warn('⚠️ Service Worker: Not available or not ready');
        this.recordServiceWorkerFailure();
      }
    } catch (error) {
      this.recordServiceWorkerFailure();
    }
  }

  /**
   * Get cached table data (stale-while-revalidate pattern)
   */
  async getCachedTableData<T>(tableName: string): Promise<T[]> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${tableName}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return [];
      }

      const cacheData = JSON.parse(cached);
      const data = cacheData.data || [];
      
      // Return stale data even if expired (offline-first)
      if (!this.isCacheValid(cacheData)) {
        // Trigger background revalidation (non-blocking)
        this.revalidateCache(tableName).catch(err => 
          console.error(`Failed to revalidate ${tableName}:`, err)
        );
      }

      return data;

    } catch (error) {
      console.error(`❌ Failed to get cached ${tableName}:`, error);
      return [];
    }
  }

  /**
   * Revalidate expired cache in background (non-blocking)
   */
  private async revalidateCache(tableName: string): Promise<void> {
    try {
      // Attempt to sync from server
      if (isValidMainTable(tableName)) {
        await this.syncTable(tableName as MainTableName);
      } else if (isValidApplicationTable(tableName)) {
        await this.syncApplicationTable(tableName as ApplicationTableName);
      }
    } catch (error) {
      console.error(`❌ Background revalidation failed for ${tableName}:`, error);
      // Silently fail - we're already serving stale data
    }
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(cacheData: any): boolean {
    if (!cacheData || !cacheData.timestamp) {
      return false;
    }

    // Use safe timestamp validation
    const validation = isTimestampExpired(cacheData.timestamp, this.cacheConfig.maxAge);
    
    if (!validation.isValid) {
      console.warn('⚠️ Invalid timestamp detected in cache data:', validation.error);
      return false;
    }
    
    if (validation.isFuture) {
      console.warn('⚠️ Future timestamp detected in cache data, marking as invalid');
      return false;
    }

    return !validation.isExpired;
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
   * Get reliable online status
   * Uses multiple detection methods for better accuracy
   */
  getOnlineStatus(): boolean {
    // Primary: Use our tracked status
    if (this.syncStatus.isOnline !== undefined) {
      return this.syncStatus.isOnline;
    }
    
    // Enhanced detection with platform-specific handling
    const basicOnline = navigator.onLine;
    
    // Additional connection quality checks
    const hasGoodConnection = navigator.connection && 
      navigator.connection.effectiveType !== 'offline' &&
      navigator.connection.effectiveType !== 'slow-2g';
    
    // Platform-specific detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSimulator = navigator.userAgent.includes('Simulator');
    
    // For iOS simulator, be more conservative
    if (isIOS && isSimulator) {
      return basicOnline && hasGoodConnection !== false;
    }
    
    // For other platforms, use enhanced detection
    return basicOnline && (hasGoodConnection !== false);
  }

  /**
   * Set online status with proper encapsulation and event notification
   */
  setOnlineStatus(isOnline: boolean): void {
    // Prevent rapid state changes with circuit breaker
    const now = Date.now();
    if (now - this.lastStatusChange < this.STATUS_DEBOUNCE_MS) {
      return; // Debounce rapid changes
    }
    
    this.lastStatusChange = now;
    this.syncStatus.isOnline = isOnline;
    this.saveSyncStatus();
    
    // Notify other components of status change
    this.notifyStatusChange(isOnline);
  }

  /**
   * Notify other components of online status changes
   */
  private notifyStatusChange(isOnline: boolean): void {
    // Emit custom event for other components
    window.dispatchEvent(new CustomEvent('pwa-status-change', {
      detail: { isOnline }
    }));
  }

  /**
   * Force sync all data
   */
  async forceSync(): Promise<SyncResult> {
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
      } else {
        // Use server data
        await this.cacheTableData(tableName, [conflict.serverData]);
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
    const tables = ['attendees', 'sponsors', 'seat_assignments', 'agenda_items', 'dining_options', 'hotels', 'seating_configurations'];
    const applicationTables = ['speaker_assignments', 'agenda_item_metadata', 'dining_item_metadata'];
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
    const tables = ['attendees', 'sponsors', 'seat_assignments', 'agenda_items', 'dining_options', 'hotels', 'seating_configurations'];
    const applicationTables = ['speaker_assignments', 'agenda_item_metadata', 'dining_item_metadata'];
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
   * Invalidate cache for a specific table
   * Delegates to ServiceRegistry for consistency
   */
  async invalidateCache(tableName: string): Promise<void> {
    try {
      serviceRegistry.invalidateCache(tableName);
    } catch (error) {
      console.error(`❌ PWA Data Sync: Failed to invalidate cache for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Abort any pending sync operations
   * Public method to support logout cleanup
   */
  public abortPendingSyncOperations(): void {
    // Abort any pending sync operations
    if (this.syncAbortController) {
      this.syncAbortController.abort();
      this.syncAbortController = undefined;
    }
    
    // Clear sync lock timeout
    if (this.syncLockTimeout) {
      clearTimeout(this.syncLockTimeout);
      this.syncLockTimeout = null;
    }
    
    // Reset sync state
    this.isSyncInProgress = false;
  }

  /**
   * Set logout in progress flag to prevent cache writes during logout
   */
  public setLogoutInProgress(value: boolean): void {
    this.isLogoutInProgress = value;
    console.log(`${value ? '🚪' : '✅'} Logout in progress: ${value}`);
  }

  /**
   * 🔧 SAFETY FIX: Reset stuck logout flag
   * This method can be called to reset the flag if it gets stuck
   */
  public resetLogoutFlag(): void {
    this.isLogoutInProgress = false;
    console.log('🔧 SAFETY: Logout flag reset to prevent sync blocking');
  }

  /**
   * Check if logout is in progress
   */
  private isLogoutActive(): boolean {
    return this.isLogoutInProgress;
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    // Stop periodic sync (clears interval)
    this.stopPeriodicSync();
    
    // Abort pending operations
    this.abortPendingSyncOperations();
    
    // Remove event listeners to prevent memory leaks
    window.removeEventListener('online', this.handleOnlineEvent);
    window.removeEventListener('offline', this.handleOfflineEvent);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}

// Export singleton instance
export const pwaDataSyncService = new PWADataSyncService();
