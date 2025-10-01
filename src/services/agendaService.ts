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
import type { IUnifiedCacheService } from './interfaces/IUnifiedCacheService';
import type { ServiceResult } from './interfaces/IAgendaService';
import { pwaDataSyncService } from './pwaDataSyncService.ts';
import { cacheMonitoringService } from './cacheMonitoringService.ts';
import { cacheVersioningService, type CacheEntry } from './cacheVersioningService.ts';
import { unifiedCacheService } from './unifiedCacheService.ts';
import { ServerDataSyncService } from './serverDataSyncService.ts';
import { applicationDatabaseService } from './applicationDatabaseService.ts';
import { AgendaTransformer } from '../transformers/agendaTransformer.ts';

export class AgendaService implements IAgendaService {
  private backgroundRefreshInProgress = false;
  private readonly tableName = 'agenda_items';
  private readonly basePath = '/api/agenda-items';
  private agendaTransformer = new AgendaTransformer();

  private serverDataSyncService: ServerDataSyncService | null = null;
  private cacheService?: ICacheService;
  private unifiedCache?: IUnifiedCacheService;

  constructor(
    serverDataSyncService?: IServerDataSyncService,
    cacheService?: ICacheService,
    unifiedCache?: IUnifiedCacheService
  ) {
    this.serverDataSyncService = serverDataSyncService as ServerDataSyncService || null;
    this.cacheService = cacheService;
    this.unifiedCache = unifiedCache || unifiedCacheService;
    
    // Initialize serverDataSyncService for background refresh if not provided
    if (!this.serverDataSyncService) {
      this.serverDataSyncService = new ServerDataSyncService();
      console.log('✅ AgendaService: ServerDataSyncService initialized for background refresh');
    }
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
   * Enrich agenda items with speaker information and admin title overrides
   */
  private async enrichWithSpeakerData(agendaItems: any[]): Promise<any[]> {
    try {
      // Get speaker assignments from cache
      const speakerAssignments = await pwaDataSyncService.getCachedTableData('speaker_assignments');
      
      // Get attendees from cache for name lookup
      const attendees = await pwaDataSyncService.getCachedTableData('attendees');
      
      // Get edited titles from application database metadata
      const agendaItemMetadata = await pwaDataSyncService.getCachedTableData('agenda_item_metadata');
      
      // Create attendee lookup map
      const attendeeMap = new Map();
      attendees.forEach((attendee: any) => {
        attendeeMap.set(attendee.id, attendee);
      });
      
      // Enrich each agenda item with ordered speakers and title overrides
      return agendaItems.map(item => {
        // Find any edited metadata for this agenda item
        const metadata = agendaItemMetadata.find((meta: any) => meta.id === item.id);
        
        // Override title if it was edited in the application database
        const finalTitle = (metadata as any)?.title || item.title;
        
        const speakers = speakerAssignments
          .filter((assignment: any) => assignment.agenda_item_id === item.id)
          .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
          .map((assignment: any) => {
            const attendee = attendeeMap.get(assignment.attendee_id);
            let name = '';
            
            if (attendee) {
              // DEBUG: Log attendee data for RCA
              console.log('RCA DEBUG (agendaService): Attendee data for assignment:', assignment.attendee_id, attendee);

              // Format as "First Name Last Name, Title at Company" (matching mockup)
              const firstName = attendee.first_name || '';
              const lastName = attendee.last_name || '';
              const title = attendee.title || '';
              const company = attendee.company || '';
              
              const fullName = `${firstName} ${lastName}`.trim();
              if (title && company) {
                name = `${fullName}, ${title} at ${company}`;
              } else if (title) {
                name = `${fullName}, ${title}`;
              } else {
                name = fullName;
              }
              
              // DEBUG: Log constructed name for RCA
              console.log('RCA DEBUG (agendaService): Constructed name:', name);
            } else {
              name = `Speaker ${assignment.attendee_id}`;
            }
            
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
          title: finalTitle, // Use edited title if available
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
   * Apply time overrides to agenda items
   */
  private async applyTimeOverrides(agendaItems: any[]): Promise<any[]> {
    try {
      // Get time overrides from application database
      const timeOverrides = await applicationDatabaseService.getAgendaItemTimeOverrides();
      console.log('🕐 Applying time overrides to agenda items:', timeOverrides.length, 'overrides found');
      
      if (timeOverrides.length === 0) {
        return agendaItems;
      }
      
      // Convert overrides to Map for efficient lookup
      const timeOverridesMap = new Map();
      timeOverrides.forEach(override => {
        timeOverridesMap.set(override.id, override);
      });
      
      // Apply time overrides directly without re-transforming
      const transformedItems = agendaItems.map(item => {
        const override = timeOverridesMap.get(item.id);
        if (override) {
          return {
            ...item,
            start_time: override.start_time || item.start_time,
            end_time: override.end_time || item.end_time,
            date: override.date || item.date
          };
        }
        return item;
      });
      
      console.log('✅ Time overrides applied successfully');
      return transformedItems;
    } catch (error) {
      console.error('❌ Failed to apply time overrides:', error);
      // Return original items if override application fails
      return agendaItems;
    }
  }

  /**
   * Get active agenda items only
   */
  async getActiveAgendaItems(): Promise<PaginatedResponse<AgendaItem>> {
    try {
      // Use unified cache service
      const cachedData = await this.unifiedCache!.get('kn_cache_agenda_items');
      
      if (cachedData) {
        const agendaItems = (cachedData as any)?.data || cachedData;
        const filteredItems = agendaItems.filter((item: any) => item.isActive);
        
        if (agendaItems.length > 0) {
          console.log('🏠 CACHE: Using cached agenda items');
          
          // Apply time overrides before enrichment
          const itemsWithOverrides = await this.applyTimeOverrides(filteredItems);
          const enrichedData = await this.enrichWithSpeakerData(itemsWithOverrides);
          this.refreshAgendaItemsInBackground();
          
          return {
            data: enrichedData,
            count: enrichedData.length,
            error: null,
            success: true
          };
        }
      }
      
      // Fallback to server sync
      return await this.fetchFromServer();
    } catch (error) {
      console.error('❌ Error in getActiveAgendaItems:', error);
      return {
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Fetch data from server and cache it
   */
  private async fetchFromServer(): Promise<PaginatedResponse<AgendaItem>> {
    console.log('🌐 SYNC: No cached agenda items found, using serverDataSyncService...');
    
    if (!this.serverDataSyncService) {
      console.warn('⚠️ No serverDataSyncService available, trying direct API fallback...');
      
      // Fallback to direct API call
      try {
        const response = await fetch('/api/agenda-items', { 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          throw new Error(`Expected JSON but got ${contentType || 'unknown content type'}`);
        }
        
        const result = await response.json();
        const agendaItems = result.data || result;
        
        if (Array.isArray(agendaItems) && agendaItems.length > 0) {
          console.log('🌐 API FALLBACK: Successfully fetched agenda items from API');
          
          // Cache the data for future use
          await this.unifiedCache!.set('kn_cache_agenda_items', agendaItems);
          
          const filteredItems = agendaItems
            .filter((item: any) => item.isActive)
            .sort((a: any, b: any) => {
              const dateComparison = (a.date || '').localeCompare(b.date || '');
              if (dateComparison !== 0) return dateComparison;
              return (a.start_time || '').localeCompare(b.start_time || '');
            });
          
          // Apply time overrides before enrichment
          const itemsWithOverrides = await this.applyTimeOverrides(filteredItems);
          const enrichedData = await this.enrichWithSpeakerData(itemsWithOverrides);
          
          return {
            data: enrichedData,
            count: enrichedData.length,
            error: null,
            success: true
          };
        } else {
          throw new Error('No agenda items returned from API');
        }
      } catch (apiError) {
        console.error('❌ API FALLBACK: Direct API call failed:', apiError);
        return {
          data: [],
          count: 0,
          error: `API fallback failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`,
          success: false
        };
      }
    }

    try {
      const syncResult = await this.serverDataSyncService.syncAllData();
      
      if (syncResult.success && syncResult.syncedTables?.includes('agenda_items')) {
        console.log('🌐 SYNC: Successfully synced agenda items');
        
        // Get the fresh data from cache
        const freshCachedData = await this.unifiedCache!.get('kn_cache_agenda_items');
        
        if (freshCachedData) {
          const agendaItems = (freshCachedData as any)?.data || freshCachedData;
          const filteredItems = agendaItems
            .filter((item: any) => item.isActive)
            .sort((a: any, b: any) => {
              // First sort by date
              const dateComparison = (a.date || '').localeCompare(b.date || '')
              if (dateComparison !== 0) return dateComparison
              
              // Then sort by start time
              return (a.start_time || '').localeCompare(b.start_time || '')
            });
          
          // Apply time overrides before enrichment
          const itemsWithOverrides = await this.applyTimeOverrides(filteredItems);
          const enrichedData = await this.enrichWithSpeakerData(itemsWithOverrides);
          
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
      return {
        data: [],
        count: 0,
        error: 'Failed to sync data',
        success: false
      };
    } catch (syncError) {
      console.error('❌ serverDataSyncService error:', syncError);
      return {
        data: [],
        count: 0,
        error: syncError instanceof Error ? syncError.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Cache agenda items using unified cache service
   */
  private async cacheAgendaItems(agendaItems: AgendaItem[]): Promise<void> {
    try {
      await this.unifiedCache!.set('kn_cache_agenda_items', agendaItems);
      console.log('💾 Cached', agendaItems.length, 'agenda items using unified cache');
    } catch (error) {
      console.warn('⚠️ Failed to cache agenda items:', error);
    }
  }

  /**
   * Refresh agenda items - public method required by interface
   */
  async refreshAgendaItems(): Promise<ServiceResult<AgendaItem[]>> {
    try {
      // Force refresh by clearing cache first
      await this.unifiedCache!.remove('kn_cache_agenda_items');
      
      // Get fresh data
      const result = await this.getActiveAgendaItems();
      return result;
    } catch (error) {
      console.error('❌ Failed to refresh agenda items:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Refresh agenda items in background without blocking UI
   * Uses the injected serverDataSyncService to ensure consistency
   */
  private async refreshAgendaItemsInBackground(): Promise<void> {
    // Prevent multiple simultaneous background refreshes
    if (this.backgroundRefreshInProgress) {
      console.log('🔄 Background refresh: Already in progress, skipping');
      return;
    }

    this.backgroundRefreshInProgress = true;
    
    try {
      if (!this.serverDataSyncService) {
        console.warn('⚠️ Background refresh: No serverDataSyncService available, reinitializing...');
        this.serverDataSyncService = new ServerDataSyncService();
      }

      console.log('🔄 Background refresh: Starting server sync...');
      
      // Use the injected service
      const syncResult = await this.serverDataSyncService.syncAllData();
      
      if (syncResult.success && syncResult.syncedTables?.includes('agenda_items')) {
        // The data is already cached by serverDataSyncService, so we don't need to cache it again
        console.log('✅ Background refresh: Successfully synced agenda items');
      } else {
        console.warn('⚠️ Background refresh: serverDataSyncService failed, keeping existing cache');
      }
    } catch (error) {
      console.warn('⚠️ Background refresh failed:', error);
      // Reset service on error to allow retry
      this.serverDataSyncService = null;
    } finally {
      this.backgroundRefreshInProgress = false;
    }
  }
}

// Export singleton instance
export const agendaService = new AgendaService();
