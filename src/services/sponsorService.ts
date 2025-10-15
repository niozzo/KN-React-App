/**
 * SponsorService - Data access layer for sponsors table
 * Story 1.2: Database Integration & Data Access Layer Setup
 * 
 * ⚠️ DEPRECATED: Use standardizedCompanySponsorService.ts instead
 * The sponsors table is deprecated. Use standardized_companies table.
 */

import { supabase } from '../lib/supabase';
import { 
  Sponsor, 
  DatabaseResponse, 
  PaginatedResponse, 
  SponsorService as ISponsorService 
} from '../types/database';

export class SponsorService implements ISponsorService {
  private readonly tableName = 'sponsors';

  /**
   * Get all sponsors
   */
  async getAllSponsors(): Promise<PaginatedResponse<Sponsor>> {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching sponsors:', error.message);
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
      console.error('❌ SponsorService.getAllSponsors error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get active sponsors only
   */
  async getActiveSponsors(): Promise<PaginatedResponse<Sponsor>> {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching active sponsors:', error.message);
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
      console.error('❌ SponsorService.getActiveSponsors error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get sponsor by ID
   */
  async getSponsorById(id: string): Promise<DatabaseResponse<Sponsor>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error fetching sponsor by ID:', error.message);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data as Sponsor,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ SponsorService.getSponsorById error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Search sponsors by name
   */
  async searchSponsors(query: string): Promise<PaginatedResponse<Sponsor>> {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .ilike('name', `%${query}%`)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Error searching sponsors:', error.message);
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
      console.error('❌ SponsorService.searchSponsors error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get sponsors by display order range
   */
  async getSponsorsByDisplayOrder(start: number, end: number): Promise<PaginatedResponse<Sponsor>> {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .gte('display_order', start)
        .lte('display_order', end)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching sponsors by display order:', error.message);
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
      console.error('❌ SponsorService.getSponsorsByDisplayOrder error:', err);
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
export const sponsorService = new SponsorService();
