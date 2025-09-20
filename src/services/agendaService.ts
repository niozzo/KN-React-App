/**
 * AgendaService - Data access layer for agenda_items table
 * Story 1.2: Database Integration & Data Access Layer Setup
 */

// Reads must go through server-side authenticated endpoints
import type { 
  AgendaItem, 
  DatabaseResponse, 
  PaginatedResponse, 
  AgendaService as IAgendaService 
} from '../types/database';
import type { IServerDataSyncService } from './interfaces/IServerDataSyncService';
import type { ICacheService } from './interfaces/ICacheService';
import type { ServiceResult } from './interfaces/IAgendaService';
import { pwaDataSyncService } from './pwaDataSyncService';
import { cacheMonitoringService } from './cacheMonitoringService';
import { cacheVersioningService, type CacheEntry } from './cacheVersioningService';

export class AgendaService implements IAgendaService {
  private backgroundRefreshInProgress = false;
  private readonly tableName = 'agenda_items';
  private readonly basePath = '/api/agenda-items';

  private serverDataSyncService?: IServerDataSyncService;
  private cacheService?: ICacheService;

  constructor(
    serverDataSyncService?: IServerDataSyncService,
    cacheService?: ICacheService
  ) {
    this.serverDataSyncService = serverDataSyncService;
    this.cacheService = cacheService;
    // If no dependencies provided, we'll use the default implementations
    // This maintains backward compatibility
  }

  private async apiGet<T>(path: string): Promise<T> {
    const res = await fetch(path, { credentials: 'include' });
    
    // Check content type before parsing to prevent HTML parsing errors
    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error(`❌ AgendaService API returned non-JSON content: ${contentType} for path: ${path}`);
      throw new Error(`Expected JSON but got ${contentType || 'unknown content type'}`);
    }
    
    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }
    const json = await res.json();
    return (json?.data ?? json) as T;
  }

  /**
   * Get all agenda items
   */
  async getAllAgendaItems(): Promise<PaginatedResponse<AgendaItem>> {
    try {
      const all = await this.apiGet<AgendaItem[]>(this.basePath);
      const data = [...all].sort((a, b) => {
        // First sort by date
        const dateComparison = (a.date || '').localeCompare(b.date || '')
        if (dateComparison !== 0) return dateComparison
        
        // Then sort by start time
        return (a.start_time || '').localeCompare(b.start_time || '')
      });
      return {
        data,
        count: data.length,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ AgendaService.getAllAgendaItems error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get agenda item by ID
   */
  async getAgendaItemById(id: string): Promise<DatabaseResponse<AgendaItem>> {
    try {
      // No dedicated endpoint yet; fetch all and filter client-side
      const all = await this.apiGet<AgendaItem[]>(this.basePath);
      const found = all.find(item => (item as any).id === id) || null;
      return {
        data: found as AgendaItem,
        error: found ? null : 'Not found',
        success: Boolean(found)
      };
    } catch (err) {
      console.error('❌ AgendaService.getAgendaItemById error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get agenda items by date
   */
  async getAgendaItemsByDate(date: string): Promise<PaginatedResponse<AgendaItem>> {
    try {
      const all = await this.apiGet<AgendaItem[]>(this.basePath);
      const data = all
        .filter(item => (item as any).date === date)
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
      return {
        data,
        count: data.length,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ AgendaService.getAgendaItemsByDate error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Create new agenda item
   */
  async createAgendaItem(item: Omit<AgendaItem, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<AgendaItem>> {
    return { data: null as any, error: 'WRITE_NOT_SUPPORTED_IN_CLIENT', success: false };
  }

  /**
   * Update agenda item
   */
  async updateAgendaItem(id: string, updates: Partial<AgendaItem>): Promise<DatabaseResponse<AgendaItem>> {
    return { data: null as any, error: 'WRITE_NOT_SUPPORTED_IN_CLIENT', success: false };
  }

  /**
   * Delete agenda item
   */
  async deleteAgendaItem(id: string): Promise<DatabaseResponse<boolean>> {
    return { data: false, error: 'WRITE_NOT_SUPPORTED_IN_CLIENT', success: false };
  }

  /**
   * Get agenda items by type
   */
  async getAgendaItemsByType(type: string): Promise<PaginatedResponse<AgendaItem>> {
    try {
      const all = await this.apiGet<AgendaItem[]>(this.basePath);
      const data = all
        .filter(item => (item as any).type === type)
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
      return {
        data,
        count: data.length,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ AgendaService.getAgendaItemsByType error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Enrich agenda items with speaker information
   */
  private async enrichWithSpeakerData(agendaItems: any[]): Promise<any[]> {
    try {
      // Get speaker assignments from cache
      const speakerAssignments = await pwaDataSyncService.getCachedTableData('speaker_assignments');
      
      // Get attendees from cache for name lookup
      const attendees = await pwaDataSyncService.getCachedTableData('attendees');
      
      // Create attendee lookup map
      const attendeeMap = new Map();
      attendees.forEach((attendee: any) => {
        attendeeMap.set(attendee.id, attendee);
      });
      
      // Enrich each agenda item with ordered speakers
      return agendaItems.map(item => {
        const speakers = speakerAssignments
          .filter((assignment: any) => assignment.agenda_item_id === item.id)
          .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
          .map((assignment: any) => {
            const attendee = attendeeMap.get(assignment.attendee_id);
            const name = attendee ? 
              (attendee.name || `${attendee.first_name || ''} ${attendee.last_name || ''}`.trim()) :
              `Speaker ${assignment.attendee_id}`;
            
            return {
              id: assignment.id,
              name,
              role: assignment.role,
              display_order: assignment.display_order
            };
          });
        
        // Create speakerInfo string for backward compatibility
        const speakerInfo = speakers.length > 0 ? 
          speakers.map(s => s.name).join(', ') : 
          null;
        
        return {
          ...item,
          speakers,
          speakerInfo // For backward compatibility with existing components
        };
      });
      
    } catch (error) {
      console.warn('⚠️ Failed to enrich agenda items with speaker data:', error);
      return agendaItems; // Return original items if enrichment fails
    }
  }

  /**
   * Get active agenda items only
   */
  async getActiveAgendaItems(): Promise<PaginatedResponse<AgendaItem>> {
    const startTime = Date.now();
    const sessionId = cacheMonitoringService.getSessionId();
    
    try {
      // Use injected cache service or fallback to localStorage
      const cacheKey = 'kn_cache_agenda_items';
      let cachedData = null;
      
      // Log cache access attempt
      console.log('🔍 CACHE DEBUG:', {
        cacheKey,
        sessionId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        hasCacheService: !!this.cacheService
      });
      
      if (this.cacheService) {
        cachedData = this.cacheService.get(cacheKey);
      } else {
        // Fallback to direct localStorage access
        try {
          const item = localStorage.getItem(cacheKey);
          cachedData = item ? JSON.parse(item) : null;
        } catch (cacheError) {
          console.warn('⚠️ Failed to load cached agenda items:', cacheError);
          cacheMonitoringService.logCacheCorruption(cacheKey, cacheError.message, { error: cacheError });
        }
      }

      if (cachedData) {
        // Handle both direct array format and wrapped format
        const agendaItems = cachedData.data || cachedData;
        const filteredItems = agendaItems
          .filter((item: any) => item.isActive);
        
        // Log cache state details
        console.log('🏠 CACHE: Using cached agenda items');
        console.log('🏠 CACHE: Found', agendaItems.length, 'total cached agenda items');
        console.log('🏠 CACHE: Found', filteredItems.length, 'active cached agenda items');
        
        // Log detailed cache state
        console.log('🔍 CACHE DEBUG:', {
          cacheKey: 'kn_cache_agenda_items',
          hasCachedData: !!cachedData,
          cachedDataKeys: cachedData ? Object.keys(cachedData) : [],
          totalItems: agendaItems.length,
          filteredItemsCount: filteredItems.length,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          sessionId
        });
        
        // ✅ NEW: Use cache versioning service for validation
        let cacheEntry: CacheEntry;
        let validationResult;
        
        try {
          // Migrate old cache format if needed
          cacheEntry = cacheVersioningService.migrateCacheEntry(cachedData) || 
                      cacheVersioningService.createCacheEntry(agendaItems);
          
          // Validate cache entry
          validationResult = cacheVersioningService.validateCacheEntry(cacheEntry);
          
          console.log('🔍 CACHE VALIDATION:', {
            isValid: validationResult.isValid,
            isExpired: validationResult.isExpired,
            isVersionValid: validationResult.isVersionValid,
            isChecksumValid: validationResult.isChecksumValid,
            age: Math.round(validationResult.age / 1000) + 's',
            issues: validationResult.issues
          });
          
          if (!validationResult.isValid) {
            console.warn('⚠️ Cache validation failed:', validationResult.issues);
            cacheMonitoringService.logCacheCorruption(cacheKey, `Validation failed: ${validationResult.issues?.join(', ')}`, {
              validationResult,
              cacheEntry
            });
            localStorage.removeItem(cacheKey);
            // Fall through to server sync
          } else if (agendaItems.length > 0) {
            // Check if cache needs refresh
            const needsRefresh = cacheVersioningService.needsRefresh(cacheEntry);
            if (needsRefresh) {
              console.log('🔄 Cache needs refresh, triggering background sync');
              this.refreshAgendaItemsInBackground();
            }
            
            // ✅ FIX: Check if cache exists (has data), not just if filtered items exist
            const responseTime = Date.now() - startTime;
            cacheMonitoringService.logCacheHit(cacheKey, JSON.stringify(cachedData).length, responseTime);
            
            // Enrich with speaker data
            const enrichedData = await this.enrichWithSpeakerData(filteredItems);
            
            return {
              data: enrichedData,
              count: enrichedData.length,
              error: null,
              success: true
            };
          }
        } catch (versioningError) {
          console.warn('⚠️ Cache versioning validation failed:', versioningError);
          cacheMonitoringService.logCacheCorruption(cacheKey, `Versioning error: ${versioningError.message}`, {
            error: versioningError,
            cachedData
          });
          localStorage.removeItem(cacheKey);
          // Fall through to server sync
        }
      }
      
      // FALLBACK: Use serverDataSyncService if no cached data exists or cache is empty
      console.log('🌐 SYNC: No cached agenda items found, using serverDataSyncService...');
      cacheMonitoringService.logCacheMiss(cacheKey, 'No cached data available', Date.now() - startTime);
      
      if (!this.serverDataSyncService) {
        // If no service injected, return empty data
        console.warn('⚠️ No serverDataSyncService available');
        cacheMonitoringService.logSyncFailure('getActiveAgendaItems', 'No serverDataSyncService available', {
          cacheKey,
          sessionId
        });
        return {
          data: [],
          count: 0,
          error: 'No sync service available',
          success: false
        };
      }

      try {
        const syncResult = await this.serverDataSyncService.syncAllData();
        
        if (syncResult.success && syncResult.syncedTables.includes('agenda_items')) {
          console.log('🌐 SYNC: Successfully synced agenda items');
          cacheMonitoringService.logCacheHit(cacheKey, 'Fresh data from sync', Date.now() - startTime);
          
          // Get the fresh data from cache
          let freshCachedData = null;
          if (this.cacheService) {
            freshCachedData = this.cacheService.get(cacheKey);
          } else {
            try {
              const item = localStorage.getItem(cacheKey);
              freshCachedData = item ? JSON.parse(item) : null;
            } catch (error) {
              console.warn('⚠️ Failed to load fresh cached data:', error);
              cacheMonitoringService.logCacheCorruption(cacheKey, 'Failed to load fresh data', { error: error.message });
            }
          }

          if (freshCachedData) {
            const agendaItems = freshCachedData.data || freshCachedData;
            const filteredItems = agendaItems
              .filter((item: any) => item.isActive)
              .sort((a: any, b: any) => {
                // First sort by date
                const dateComparison = (a.date || '').localeCompare(b.date || '')
                if (dateComparison !== 0) return dateComparison
                
                // Then sort by start time
                return (a.start_time || '').localeCompare(b.start_time || '')
              });
            
            // Enrich with speaker data
            const enrichedData = await this.enrichWithSpeakerData(filteredItems);
            
            console.log('🌐 SYNC: Retrieved', enrichedData.length, 'agenda items from cache');
            return {
              data: enrichedData,
              count: enrichedData.length,
              error: null,
              success: true
            };
          }
        }
        
        // If serverDataSyncService failed, return empty data
        console.warn('⚠️ serverDataSyncService failed, returning empty agenda items');
        cacheMonitoringService.logSyncFailure('getActiveAgendaItems', 'Sync failed', {
          cacheKey,
          sessionId,
          syncResult
        });
        return {
          data: [],
          count: 0,
          error: 'Failed to sync data',
          success: false
        };
      } catch (syncError) {
        console.error('❌ serverDataSyncService error:', syncError);
        cacheMonitoringService.logSyncFailure('getActiveAgendaItems', syncError.message, {
          cacheKey,
          sessionId,
          error: syncError
        });
        return {
          data: [],
          count: 0,
          error: syncError instanceof Error ? syncError.message : 'Unknown error',
          success: false
        };
      }
    } catch (err) {
      console.error('❌ AgendaService.getActiveAgendaItems error:', err);
      cacheMonitoringService.logSyncFailure('getActiveAgendaItems', err.message, {
        cacheKey: 'kn_cache_agenda_items',
        sessionId,
        error: err
      });
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Cache agenda items in localStorage
   */
  private cacheAgendaItems(agendaItems: AgendaItem[]): void {
    try {
      const cacheData = {
        data: agendaItems,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem('kn_cache_agenda_items', JSON.stringify(cacheData));
      console.log('💾 Cached', agendaItems.length, 'agenda items to localStorage');
    } catch (error) {
      console.warn('⚠️ Failed to cache agenda items:', error);
    }
  }

  /**
   * Refresh agenda items in background without blocking UI
   * Uses the injected serverDataSyncService to ensure consistency
   */
  private async refreshAgendaItemsInBackground(): Promise<void> {
    // Prevent multiple simultaneous background refreshes
    if (this.backgroundRefreshInProgress) {
      return;
    }

    this.backgroundRefreshInProgress = true;
    
    try {
      if (!this.serverDataSyncService) {
        console.warn('⚠️ Background refresh: No serverDataSyncService available');
        return;
      }

      // Use the injected service
      const syncResult = await this.serverDataSyncService.syncAllData();
      
      if (syncResult.success && syncResult.syncedTables.includes('agenda_items')) {
        // The data is already cached by serverDataSyncService, so we don't need to cache it again
        console.log('🔄 Background refresh: Successfully synced agenda items');
      } else {
        console.warn('⚠️ Background refresh: serverDataSyncService failed, keeping existing cache');
      }
    } catch (error) {
      console.warn('⚠️ Background refresh failed:', error);
    } finally {
      this.backgroundRefreshInProgress = false;
    }
  }
}

// Export singleton instance
export const agendaService = new AgendaService();
