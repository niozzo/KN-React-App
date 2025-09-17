/**
 * AgendaService - Data access layer for agenda_items table
 * Story 1.2: Database Integration & Data Access Layer Setup
 */

// Reads must go through server-side authenticated endpoints
import { 
  AgendaItem, 
  DatabaseResponse, 
  PaginatedResponse, 
  AgendaService as IAgendaService 
} from '../types/database';
import { serverDataSyncService } from './serverDataSyncService';

export class AgendaService implements IAgendaService {
  private backgroundRefreshInProgress = false;
  private readonly tableName = 'agenda_items';
  private readonly basePath = '/api/agenda-items';

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
   * Get active agenda items only
   */
  async getActiveAgendaItems(): Promise<PaginatedResponse<AgendaItem>> {
    try {
      // PRIMARY: Check localStorage first (populated during login)
      try {
        const cachedData = localStorage.getItem('kn_cache_agenda_items');
        if (cachedData) {
          const cacheObj = JSON.parse(cachedData);
          // Handle both direct array format and wrapped format
          const agendaItems = cacheObj.data || cacheObj;
          const data = agendaItems
            .filter((item: any) => item.isActive);
          
          console.log('🏠 LOCALSTORAGE: Using cached agenda items from localStorage');
          console.log('🏠 LOCALSTORAGE: Found', data.length, 'cached agenda items');
          
          // If we have cached data, return it but also trigger a background refresh
          if (data.length > 0) {
            // Background refresh to ensure data is up to date
            this.refreshAgendaItemsInBackground();
            return {
              data,
              count: data.length,
              error: null,
              success: true
            };
          }
        }
      } catch (cacheError) {
        console.warn('⚠️ Failed to load cached agenda items:', cacheError);
      }
      
      // FALLBACK: Use serverDataSyncService if no cached data exists or cache is empty
      console.log('🌐 serverDataSyncService: No cached agenda items found, using serverDataSyncService...');
      try {
        const syncResult = await serverDataSyncService.syncAllData();
        
        if (syncResult.success && syncResult.syncedTables.includes('agenda_items')) {
          console.log('🌐 serverDataSyncService: Successfully synced agenda items');
          
          // Get the fresh data from cache (serverDataSyncService already cached it)
          const cachedData = localStorage.getItem('kn_cache_agenda_items');
          if (cachedData) {
            const cacheObj = JSON.parse(cachedData);
            const agendaItems = cacheObj.data || cacheObj;
            const data = agendaItems
              .filter((item: any) => item.isActive)
              .sort((a: any, b: any) => {
                // First sort by date
                const dateComparison = (a.date || '').localeCompare(b.date || '')
                if (dateComparison !== 0) return dateComparison
                
                // Then sort by start time
                return (a.start_time || '').localeCompare(b.start_time || '')
              });
            
            console.log('🌐 serverDataSyncService: Retrieved', data.length, 'agenda items from cache');
            return {
              data,
              count: data.length,
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
    } catch (err) {
      console.error('❌ AgendaService.getActiveAgendaItems error:', err);
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
   * Uses the same serverDataSyncService as login to ensure consistency
   */
  private async refreshAgendaItemsInBackground(): Promise<void> {
    // Prevent multiple simultaneous background refreshes
    if (this.backgroundRefreshInProgress) {
      return;
    }

    this.backgroundRefreshInProgress = true;
    
    try {
      // Use the same service that works during login
      const syncResult = await serverDataSyncService.syncAllData();
      
      if (syncResult.success && syncResult.syncedTables.includes('agenda_items')) {
        // The data is already cached by serverDataSyncService, so we don't need to cache it again
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
