/**
 * SeatAssignmentService - Data access layer for seat_assignments table
 * Story 1.2: Database Integration & Data Access Layer Setup
 */

import { supabase } from '../lib/supabase';
import { 
  SeatAssignment, 
  DatabaseResponse, 
  PaginatedResponse, 
  SeatAssignmentService as ISeatAssignmentService 
} from '../types/database';

export class SeatAssignmentService implements ISeatAssignmentService {
  private readonly tableName = 'seat_assignments';

  /**
   * Get seat assignments by attendee ID
   */
  async getSeatAssignmentsByAttendee(attendeeId: string): Promise<PaginatedResponse<SeatAssignment>> {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('attendee_id', attendeeId)
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching seat assignments by attendee:', error.message);
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
      console.error('❌ SeatAssignmentService.getSeatAssignmentsByAttendee error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get seat assignments by table name
   */
  async getSeatAssignmentsByTable(tableName: string): Promise<PaginatedResponse<SeatAssignment>> {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('table_name', tableName)
        .order('seat_number', { ascending: true });

      if (error) {
        console.error('❌ Error fetching seat assignments by table:', error.message);
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
      console.error('❌ SeatAssignmentService.getSeatAssignmentsByTable error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Create new seat assignment
   */
  async createSeatAssignment(assignment: Omit<SeatAssignment, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<SeatAssignment>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert(assignment)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating seat assignment:', error.message);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data as SeatAssignment,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ SeatAssignmentService.createSeatAssignment error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get seat assignment by ID
   */
  async getSeatAssignmentById(id: string): Promise<DatabaseResponse<SeatAssignment>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error fetching seat assignment by ID:', error.message);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data as SeatAssignment,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ SeatAssignmentService.getSeatAssignmentById error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get all seat assignments
   */
  async getAllSeatAssignments(): Promise<PaginatedResponse<SeatAssignment>> {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .order('table_name', { ascending: true })
        .order('seat_number', { ascending: true });

      if (error) {
        console.error('❌ Error fetching all seat assignments:', error.message);
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
      console.error('❌ SeatAssignmentService.getAllSeatAssignments error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get seat assignments by seating configuration
   */
  async getSeatAssignmentsByConfiguration(configurationId: string): Promise<PaginatedResponse<SeatAssignment>> {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('seating_configuration_id', configurationId)
        .order('table_name', { ascending: true })
        .order('seat_number', { ascending: true });

      if (error) {
        console.error('❌ Error fetching seat assignments by configuration:', error.message);
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
      console.error('❌ SeatAssignmentService.getSeatAssignmentsByConfiguration error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Update seat assignment
   */
  async updateSeatAssignment(id: string, updates: Partial<SeatAssignment>): Promise<DatabaseResponse<SeatAssignment>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating seat assignment:', error.message);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data as SeatAssignment,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ SeatAssignmentService.updateSeatAssignment error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Delete seat assignment
   */
  async deleteSeatAssignment(id: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting seat assignment:', error.message);
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
      console.error('❌ SeatAssignmentService.deleteSeatAssignment error:', err);
      return {
        data: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }
}

// Export singleton instance
export const seatAssignmentService = new SeatAssignmentService();
