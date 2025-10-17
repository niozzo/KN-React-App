/**
 * Admin Data Service
 * Loads all conference data for admin management without requiring user authentication
 */

import { SupabaseClientFactory } from './SupabaseClientFactory';

export interface AdminDataResult {
  success: boolean;
  data: any[];
  error?: string;
}

export class AdminDataService {
  private readonly ADMIN_CACHE_PREFIX = 'admin_cache_';

  /**
   * Load all conference data for admin management
   */
  async loadAllConferenceData(): Promise<void> {
    try {
      console.log('🔧 Admin: Loading all conference data...');
      
      // Get admin client (with service key, no RLS restrictions)
      const adminClient = SupabaseClientFactory.getAdminClient();
      
      // Load agenda items
      console.log('🔧 Admin: Loading agenda items...');
      const agendaResult = await this.loadAgendaItems(adminClient);
      if (agendaResult.success) {
        this.setAdminCache('agenda_items', agendaResult.data);
        console.log('🔧 Admin: Loaded agenda items:', agendaResult.data.length);
      }

      // Load dining options
      console.log('🔧 Admin: Loading dining options...');
      const diningResult = await this.loadDiningOptions(adminClient);
      if (diningResult.success) {
        this.setAdminCache('dining_options', diningResult.data);
        console.log('🔧 Admin: Loaded dining options:', diningResult.data.length);
      }

      // Load attendees
      console.log('🔧 Admin: Loading attendees...');
      const attendeesResult = await this.loadAttendees(adminClient);
      if (attendeesResult.success) {
        this.setAdminCache('attendees', attendeesResult.data);
        console.log('🔧 Admin: Loaded attendees:', attendeesResult.data.length);
      }

      console.log('🔧 Admin: All conference data loaded successfully');

    } catch (error) {
      console.error('🔧 Admin: Failed to load conference data:', error);
      throw error;
    }
  }

  /**
   * Load agenda items from database
   */
  private async loadAgendaItems(client: any): Promise<AdminDataResult> {
    try {
      const { data, error } = await client
        .from('agenda_items')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('🔧 Admin: Error loading agenda items:', error);
        return { success: false, data: [], error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('🔧 Admin: Exception loading agenda items:', error);
      return { success: false, data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Load dining options from database
   */
  private async loadDiningOptions(client: any): Promise<AdminDataResult> {
    try {
      const { data, error } = await client
        .from('dining_options')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('🔧 Admin: Error loading dining options:', error);
        return { success: false, data: [], error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('🔧 Admin: Exception loading dining options:', error);
      return { success: false, data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Load attendees from database
   */
  private async loadAttendees(client: any): Promise<AdminDataResult> {
    try {
      const { data, error } = await client
        .from('attendees')
        .select('*')
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });

      if (error) {
        console.error('🔧 Admin: Error loading attendees:', error);
        return { success: false, data: [], error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('🔧 Admin: Exception loading attendees:', error);
      return { success: false, data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Set admin cache data
   */
  private setAdminCache(tableName: string, data: any[]): void {
    const cacheKey = `${this.ADMIN_CACHE_PREFIX}${tableName}`;
    const cacheData = {
      data: data,
      timestamp: Date.now(),
      source: 'admin_direct_db'
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`🔧 Admin: Cached ${tableName} (${data.length} records)`);
  }

  /**
   * Get admin cache data
   */
  getAdminCache(tableName: string): any[] {
    const cacheKey = `${this.ADMIN_CACHE_PREFIX}${tableName}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return parsed.data || [];
      } catch (error) {
        console.error(`🔧 Admin: Error parsing cache for ${tableName}:`, error);
        return [];
      }
    }
    
    return [];
  }
}

// Export singleton instance
export const adminDataService = new AdminDataService();
