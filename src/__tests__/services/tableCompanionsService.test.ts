/**
 * Table Companions Service Tests
 * Tests for table companions service functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tableCompanionsService, TableCompanion } from '../../services/tableCompanionsService';

// Mock Supabase client service
vi.mock('../../services/supabaseClientService', () => ({
  supabaseClientService: {
    getClient: vi.fn()
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

describe('TableCompanionsService - Basic Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.localStorage = mockLocalStorage;
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', async () => {
      await tableCompanionsService.initialize();
      expect(tableCompanionsService.getHealthStatus().healthy).toBe(true);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache for specific table', () => {
      tableCompanionsService.clearCache('Table 1', 'dining-event-1');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('table_companions_Table 1_dining-event-1');
    });

    it('should clear all cache', () => {
      // Mock Object.keys to return cache keys
      const originalKeys = Object.keys;
      Object.keys = vi.fn().mockReturnValue(['table_companions_Table 1_dining-event-1', 'other_key']);
      
      tableCompanionsService.clearAllCache();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('table_companions_Table 1_dining-event-1');
      
      // Restore original
      Object.keys = originalKeys;
    });

    it('should get cache statistics', () => {
      // Mock Object.keys to return cache keys
      const originalKeys = Object.keys;
      Object.keys = vi.fn().mockReturnValue(['table_companions_Table 1_dining-event-1', 'other_key']);
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        companions: [],
        cached_at: Date.now(),
        expires_at: Date.now() + 300000
      }));
      
      const stats = tableCompanionsService.getCacheStats();
      expect(stats.totalEntries).toBe(1);
      expect(stats.entries).toHaveLength(1);
      
      // Restore original
      Object.keys = originalKeys;
    });
  });

  describe('Data Retrieval', () => {
    it('should return cached data when available and valid', async () => {
      const mockCompanions: TableCompanion[] = [
        {
          attendee_id: 'attendee-1',
          first_name: 'John',
          last_name: 'Doe',
          seat_number: 1,
          assignment_type: 'manual'
        }
      ];
      
      const cacheData = {
        companions: mockCompanions,
        cached_at: Date.now(),
        expires_at: Date.now() + 300000
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cacheData));
      
      const result = await tableCompanionsService.getTableCompanions('Table 1', 'dining-event-1');
      
      expect(result).toEqual(mockCompanions);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('table_companions_Table 1_dining-event-1');
    });

    it('should fetch from database when cache is invalid', async () => {
      const mockSeatAssignments = [
        {
          attendee_id: 'attendee-1',
          attendee_first_name: 'John',
          attendee_last_name: 'Doe',
          seat_number: 1,
          assignment_type: 'manual'
        }
      ];
      
      const mockSupabaseClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockSeatAssignments,
                error: null
              })
            })
          })
        })
      };
      
      const { supabaseClientService } = await import('../../services/supabaseClientService');
      vi.mocked(supabaseClientService.getClient).mockReturnValue(mockSupabaseClient as any);
      
      // Mock expired cache
      const expiredCache = {
        companions: [],
        cached_at: Date.now() - 600000, // 10 minutes ago
        expires_at: Date.now() - 300000 // 5 minutes ago
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredCache));
      
      const result = await tableCompanionsService.getTableCompanions('Table 1', 'dining-event-1');
      
      expect(result).toEqual([
        {
          attendee_id: 'attendee-1',
          first_name: 'John',
          last_name: 'Doe',
          seat_number: 1,
          assignment_type: 'manual'
        }
      ]);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const mockSupabaseClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
              })
            })
          })
        })
      };
      
      const { supabaseClientService } = await import('../../services/supabaseClientService');
      vi.mocked(supabaseClientService.getClient).mockReturnValue(mockSupabaseClient as any);
      
      await expect(
        tableCompanionsService.getTableCompanions('Table 1', 'dining-event-1')
      ).rejects.toThrow('Failed to fetch seat assignments: Database error');
    });

    it('should return empty array when no seat assignments found', async () => {
      const mockSupabaseClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      };
      
      const { supabaseClientService } = await import('../../services/supabaseClientService');
      vi.mocked(supabaseClientService.getClient).mockReturnValue(mockSupabaseClient as any);
      
      const result = await tableCompanionsService.getTableCompanions('Table 1', 'dining-event-1');
      
      expect(result).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const mockSupabaseClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      };
      
      const { supabaseClientService } = await import('../../services/supabaseClientService');
      vi.mocked(supabaseClientService.getClient).mockReturnValue(mockSupabaseClient as any);
      
      const result = await tableCompanionsService.getTableCompanions('Table 1', 'dining-event-1');
      
      expect(result).toEqual([]);
    });
  });
});
