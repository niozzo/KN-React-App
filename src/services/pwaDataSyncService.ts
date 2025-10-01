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
import { sanitizeAttendeeForStorage } from '../types/attendee.ts';
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
    this.initializeSync();
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
    
    console.log('📝 PWA Data Sync: Registered cache invalidation callbacks');
  }

  /**
   * Handle dining metadata cache invalidation
   */
  private async handleDiningMetadataInvalidation(): Promise<void> {
    const tableName = 'dining_item_metadata';
    
    // Prevent recursive calls
    if (this.cacheInvalidationInProgress.has(tableName)) {
      console.log(`🚫 PWA Data Sync: Cache invalidation already in progress for ${tableName}, skipping`);
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
      console.log(`🚫 PWA Data Sync: Cache invalidation already in progress for ${tableName}, skipping`);
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
      console.log(`🚫 PWA Data Sync: Cache invalidation already in progress for ${tableName}, skipping`);
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
    console.log('🏠 Schema validation initialization moved to lazy loading');
  }

  /**
   * Get schema validator with lazy loading (only in production)
   */
  private async getSchemaValidator(): Promise<any | null> {
    // Skip schema validation in local development
    if (this.isLocalMode()) {
      console.log('🏠 Local mode: Skipping schema validation');
      return null;
    }
    
    // Lazy load schema validator only when needed
    if (!this.schemaValidator) {
      try {
        const { SchemaValidationService } = await import('./schemaValidationService');
        this.schemaValidator = new SchemaValidationService();
        console.log('✅ Schema validation service lazy-loaded for production mode');
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
      console.log('🔄 Application DB: Circuit breaker reset - attempting application database operations again');
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
      console.log('✅ Application DB: Success recorded, resetting failure count');
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

  /**
   * Setup event listeners for online/offline status
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.setOnlineStatus(true);
      this.startPeriodicSync();
      if (this.isUserAuthenticated()) {
        this.syncAllData();
      }
    });

    window.addEventListener('offline', () => {
      this.setOnlineStatus(false);
      this.stopPeriodicSync();
    });

    // Sync when page becomes visible (only if authenticated)
    document.addEventListener('visibilitychange', () => {
      const willSync = !document.hidden && this.syncStatus.isOnline && this.isUserAuthenticated();
      
      // Log visibility change with sync decision
      
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
          } else {
            console.log('✅ Schema validation passed');
          }
        } else {
          console.log('🏠 Local mode: Skipping schema validation');
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
      console.log(`🚫 PWA Data Sync: Application database circuit breaker open - skipping sync for ${tableName}`);
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
      } else {
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
        
        // Cache the validated data
        await this.cacheTableData(tableName, validRecords);
        console.log(`✅ PWA Data Sync: Successfully synced ${tableName} with ${validRecords.length} valid records`);
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
        console.log(`✅ PWA Data Sync: Successfully synced ${tableName} with 0 records`);
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
      const cacheKey = `${this.CACHE_PREFIX}${tableName}`;
      
      // Sanitize attendees data to remove access_code before caching
      let sanitizedData = data;
      if (tableName === 'attendees') {
        sanitizedData = data.map(attendee => sanitizeAttendeeForStorage(attendee));
      }
      
      // ✅ NEW: Use cache versioning service for proper cache entry creation with environment-aware TTL
      const ttl = this.getCacheTTL(tableName);
      const cacheEntry = cacheVersioningService.createCacheEntry(sanitizedData, ttl);
      
      // Log cache operation

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
      console.log('🔄 Service Worker: Circuit breaker reset - attempting service worker operations again');
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
      console.log('✅ Service Worker: Success recorded, resetting failure count');
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
      console.log(`🚫 Service Worker: Circuit breaker open - skipping cache for ${tableName}`);
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
          console.log(`✅ Service Worker: Cached ${tableName} data successfully`);
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
      console.warn('⚠️ Failed to cache data in service worker:', error);
      this.recordServiceWorkerFailure();
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
      console.log('🔍 Cache validation: No cache data or timestamp');
      return false;
    }

    // Use safe timestamp validation
    const validation = isTimestampExpired(cacheData.timestamp, this.cacheConfig.maxAge);
    
    console.log('🔍 Cache validation debug:', {
      timestamp: cacheData.timestamp,
      maxAge: this.cacheConfig.maxAge,
      isValid: validation.isValid,
      isExpired: validation.isExpired,
      isFuture: validation.isFuture,
      age: validation.age,
      error: validation.error
    });
    
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
    
    // Fallback: Use navigator.onLine
    return navigator.onLine;
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
    const applicationTables = ['speaker_assignments', 'agenda_item_metadata', 'attendee_metadata', 'dining_item_metadata'];
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
    const applicationTables = ['speaker_assignments', 'agenda_item_metadata', 'attendee_metadata', 'dining_item_metadata'];
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
      console.log(`🔄 PWA Data Sync: Invalidating cache for ${tableName}`);
      serviceRegistry.invalidateCache(tableName);
      console.log(`✅ PWA Data Sync: Cache invalidated for ${tableName}`);
    } catch (error) {
      console.error(`❌ PWA Data Sync: Failed to invalidate cache for ${tableName}:`, error);
      throw error;
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
