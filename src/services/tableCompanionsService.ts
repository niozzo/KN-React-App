/**
 * Table Companions Service
 * 
 * Provides functionality to fetch and cache table companions data
 * READ-ONLY access to main database only - NO MODIFICATIONS ALLOWED
 */

import { BaseService } from './baseService';
import { supabaseClientService } from './supabaseClientService';

export interface TableCompanion {
  attendee_id: string;
  first_name: string;
  last_name: string;
  seat_number: number | null;
  assignment_type: 'manual' | 'automatic';
}

export interface TableCompanionsCache {
  companions: TableCompanion[];
  cached_at: number;
  expires_at: number;
}

export class TableCompanionsService extends BaseService {
  private readonly CACHE_PREFIX = 'table_companions_';
  private readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    super('TableCompanionsService');
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    this.isInitialized = true;
    console.log('✅ TableCompanionsService initialized');
  }

  /**
   * Get table companions for a specific table and dining event
   * READ-ONLY access to main database only
   */
  async getTableCompanions(
    tableName: string, 
    diningEventId: string
  ): Promise<TableCompanion[]> {
    const cacheKey = `${this.CACHE_PREFIX}${tableName}_${diningEventId}`;
    
    try {
      // Check localStorage cache first
      let cached: string | null = null;
      try {
        cached = localStorage.getItem(cacheKey);
      } catch (localStorageError) {
        console.warn('⚠️ localStorage error, proceeding with database query:', localStorageError);
      }
      
      if (cached) {
        const data: TableCompanionsCache = JSON.parse(cached);
        if (this.isCacheValid(data)) {
          console.log(`✅ Using cached table companions for ${tableName}`);
          return data.companions;
        }
      }
      
      // Query main database directly (READ-ONLY ONLY - NO MODIFICATIONS ALLOWED)
      console.log(`🌐 Fetching table companions for ${tableName} from main database`);
      
      const supabase = supabaseClientService.getClient();
      // Query seat assignments through the correct schema relationship:
      // DINING_OPTION → SEATING_CONFIGURATION → SEAT_ASSIGNMENT
      const { data: seatAssignments, error } = await supabase
        .from('seat_assignments')
        .select(`
          attendee_id,
          attendee_first_name,
          attendee_last_name,
          seat_number,
          assignment_type,
          seating_configuration_id,
          attendees!inner(company),
          seating_configurations!inner(dining_option_id)
        `)
        .eq('table_name', tableName)
        .eq('seating_configurations.dining_option_id', diningEventId);
      
      if (error) {
        console.error('❌ Error fetching seat assignments:', error);
        throw new Error(`Failed to fetch seat assignments: ${error.message}`);
      }
      
      if (!seatAssignments || seatAssignments.length === 0) {
        console.log(`⚠️ No seat assignments found for ${tableName}`);
        return [];
      }
      
      // Transform to table companions
      const companions: TableCompanion[] = seatAssignments.map(assignment => ({
        attendee_id: assignment.attendee_id,
        first_name: assignment.attendee_first_name,
        last_name: assignment.attendee_last_name,
        company: (assignment.attendees as any)?.company || 'N/A', // Access company from joined table
        seat_number: assignment.seat_number,
        assignment_type: assignment.assignment_type
      }));
      
      // Cache results
      const cacheData: TableCompanionsCache = {
        companions,
        cached_at: Date.now(),
        expires_at: Date.now() + this.CACHE_EXPIRY_MS
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`✅ Cached ${companions.length} table companions for ${tableName}`);
      
      return companions;
      
    } catch (error) {
      console.error('❌ Error in getTableCompanions:', error);
      throw error;
    }
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(data: TableCompanionsCache): boolean {
    return data.expires_at > Date.now();
  }

  /**
   * Clear cache for a specific table and dining event
   */
  clearCache(tableName: string, diningEventId: string): void {
    const cacheKey = `${this.CACHE_PREFIX}${tableName}_${diningEventId}`;
    localStorage.removeItem(cacheKey);
    console.log(`🗑️ Cleared cache for ${tableName}`);
  }

  /**
   * Clear all table companions cache
   */
  clearAllCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🗑️ Cleared all table companions cache');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalEntries: number; entries: Array<{ key: string; size: number; expires: number }> } {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
    
    const entries = cacheKeys.map(key => {
      const data = localStorage.getItem(key);
      const parsed = data ? JSON.parse(data) : null;
      return {
        key,
        size: data ? data.length : 0,
        expires: parsed ? parsed.expires_at : 0
      };
    });
    
    return {
      totalEntries: cacheKeys.length,
      entries
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.isInitialized = false;
    console.log('🧹 TableCompanionsService cleaned up');
  }
}

// Export singleton instance
export const tableCompanionsService = new TableCompanionsService();
