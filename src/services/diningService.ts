/**
 * DiningService - Data access layer for dining_options table
 * Story 1.2: Database Integration & Data Access Layer Setup
 */

import { supabase } from '../lib/supabase';
import { 
  DiningOption, 
  DatabaseResponse, 
  PaginatedResponse, 
  DiningService as IDiningService 
} from '../types/database';

export class DiningService implements IDiningService {
  private readonly tableName = 'dining_options';

  /**
   * Get all dining options
   */
  async getAllDiningOptions(): Promise<PaginatedResponse<DiningOption>> {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('❌ Error fetching dining options:', error.message);
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
      console.error('❌ DiningService.getAllDiningOptions error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get dining option by ID
   */
  async getDiningOptionById(id: string): Promise<DatabaseResponse<DiningOption>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error fetching dining option by ID:', error.message);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data as DiningOption,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ DiningService.getDiningOptionById error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get dining options by date
   */
  async getDiningOptionsByDate(date: string): Promise<PaginatedResponse<DiningOption>> {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('date', date)
        .order('time', { ascending: true });

      if (error) {
        console.error('❌ Error fetching dining options by date:', error.message);
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
      console.error('❌ DiningService.getDiningOptionsByDate error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Create new dining option
   */
  async createDiningOption(option: Omit<DiningOption, 'id' | 'created_at'>): Promise<DatabaseResponse<DiningOption>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert(option)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating dining option:', error.message);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data as DiningOption,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ DiningService.createDiningOption error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Update dining option
   */
  async updateDiningOption(id: string, updates: Partial<DiningOption>): Promise<DatabaseResponse<DiningOption>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating dining option:', error.message);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data as DiningOption,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ DiningService.updateDiningOption error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Delete dining option
   */
  async deleteDiningOption(id: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting dining option:', error.message);
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
      console.error('❌ DiningService.deleteDiningOption error:', err);
      return {
        data: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get active dining options only
   */
  async getActiveDiningOptions(): Promise<PaginatedResponse<DiningOption>> {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('❌ Error fetching active dining options:', error.message);
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
      console.error('❌ DiningService.getActiveDiningOptions error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get dining options with table assignments
   */
  async getDiningOptionsWithTableAssignments(): Promise<PaginatedResponse<DiningOption>> {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('has_table_assignments', true)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('❌ Error fetching dining options with table assignments:', error.message);
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
      console.error('❌ DiningService.getDiningOptionsWithTableAssignments error:', err);
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
export const diningService = new DiningService();
