/**
 * HotelService - Data access layer for hotels table
 * Story 1.2: Database Integration & Data Access Layer Setup
 */

import { supabase } from '../lib/supabase';
import { 
  Hotel, 
  DatabaseResponse, 
  PaginatedResponse, 
  HotelService as IHotelService 
} from '../types/database';

export class HotelService implements IHotelService {
  private readonly tableName = 'hotels';

  /**
   * Get all hotels
   */
  async getAllHotels(): Promise<PaginatedResponse<Hotel>> {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching hotels:', error.message);
        return {
          data: [],
          count: 0,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        count: count || 0,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ HotelService.getAllHotels error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get active hotels only
   */
  async getActiveHotels(): Promise<PaginatedResponse<Hotel>> {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching active hotels:', error.message);
        return {
          data: [],
          count: 0,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        count: count || 0,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ HotelService.getActiveHotels error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get hotel by ID
   */
  async getHotelById(id: string): Promise<DatabaseResponse<Hotel>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error fetching hotel by ID:', error.message);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data as Hotel,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ HotelService.getHotelById error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Create new hotel
   */
  async createHotel(hotel: Omit<Hotel, 'id' | 'created_at'>): Promise<DatabaseResponse<Hotel>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert(hotel)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating hotel:', error.message);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data as Hotel,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ HotelService.createHotel error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Update hotel
   */
  async updateHotel(id: string, updates: Partial<Hotel>): Promise<DatabaseResponse<Hotel>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating hotel:', error.message);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data as Hotel,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ HotelService.updateHotel error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Delete hotel
   */
  async deleteHotel(id: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting hotel:', error.message);
        return {
          data: false,
          error: error.message,
          success: false
        };
      }

      return {
        data: true,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ HotelService.deleteHotel error:', err);
      return {
        data: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Search hotels by name
   */
  async searchHotels(query: string): Promise<PaginatedResponse<Hotel>> {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .ilike('name', `%${query}%`)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Error searching hotels:', error.message);
        return {
          data: [],
          count: 0,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        count: count || 0,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ HotelService.searchHotels error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get hotels by display order range
   */
  async getHotelsByDisplayOrder(start: number, end: number): Promise<PaginatedResponse<Hotel>> {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .gte('display_order', start)
        .lte('display_order', end)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching hotels by display order:', error.message);
        return {
          data: [],
          count: 0,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        count: count || 0,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ HotelService.getHotelsByDisplayOrder error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }
}

// Export singleton instance
export const hotelService = new HotelService();
