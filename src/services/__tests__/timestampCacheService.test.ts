import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { timestampCacheService } from '../timestampCacheService';
import { serverDataSyncService } from '../serverDataSyncService';

// Mock dependencies
vi.mock('../supabaseClientService', () => ({
  supabaseClientService: {
    getClient: vi.fn()
  }
}));

vi.mock('../serverDataSyncService', () => ({
  serverDataSyncService: {
    syncTable: vi.fn()
  }
}));

vi.mock('../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    progress: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('TimestampCacheService', () => {
  let mockSupabaseClient: any;
  let mockSyncTable: any;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock Supabase client
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis()
    };
    
    mockSyncTable = vi.mocked(serverDataSyncService.syncTable);
    
    // Mock supabaseClientService.getClient
    const { supabaseClientService } = await import('../supabaseClientService');
    vi.mocked(supabaseClientService.getClient).mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('hasTableChanged', () => {
    it('should return true for first sync (no timestamp)', async () => {
      const result = await timestampCacheService.hasTableChanged('attendees');
      expect(result).toBe(true);
    });

    it('should return true when table has changed', async () => {
      // Set a timestamp
      localStorage.setItem('kn_last_sync_attendees', '2025-01-01T00:00:00.000Z');
      
      // Mock Supabase to return changed data
      mockSupabaseClient.limit.mockResolvedValue({
        data: [{ updated_at: '2025-01-01T12:00:00.000Z' }],
        error: null
      });
      
      const result = await timestampCacheService.hasTableChanged('attendees');
      expect(result).toBe(true);
    });

    it('should return false when table has not changed', async () => {
      // Set a timestamp
      localStorage.setItem('kn_last_sync_attendees', '2025-01-01T00:00:00.000Z');
      
      // Mock Supabase to return no changes
      mockSupabaseClient.limit.mockResolvedValue({
        data: [],
        error: null
      });
      
      const result = await timestampCacheService.hasTableChanged('attendees');
      expect(result).toBe(false);
    });

    it('should return true on error (fail-safe)', async () => {
      // Set a timestamp
      localStorage.setItem('kn_last_sync_attendees', '2025-01-01T00:00:00.000Z');
      
      // Mock Supabase to return error
      mockSupabaseClient.limit.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });
      
      const result = await timestampCacheService.hasTableChanged('attendees');
      expect(result).toBe(true);
    });
  });

  describe('syncChangedTables', () => {
    it('should sync only changed tables', async () => {
      // Mock hasTableChanged to return different results for different tables
      const hasTableChangedSpy = vi.spyOn(timestampCacheService, 'hasTableChanged');
      hasTableChangedSpy
        .mockResolvedValueOnce(true)  // attendees - changed
        .mockResolvedValueOnce(false) // agenda_items - unchanged
        .mockResolvedValueOnce(true)  // dining_options - changed
        .mockResolvedValueOnce(false) // seat_assignments - unchanged
        .mockResolvedValueOnce(false) // seating_configurations - unchanged
        .mockResolvedValueOnce(false) // standardized_companies - unchanged
        .mockResolvedValueOnce(false); // company_aliases - unchanged
      
      // Mock syncTable to succeed
      mockSyncTable.mockResolvedValue([]);
      
      const result = await timestampCacheService.syncChangedTables();
      
      expect(result.success).toBe(true);
      expect(result.syncedTables).toEqual(['attendees', 'dining_options']);
      expect(result.skippedTables).toEqual(['agenda_items', 'seat_assignments', 'seating_configurations', 'standardized_companies', 'company_aliases']);
      expect(mockSyncTable).toHaveBeenCalledTimes(2);
      expect(mockSyncTable).toHaveBeenCalledWith('attendees');
      expect(mockSyncTable).toHaveBeenCalledWith('dining_options');
    });

    it('should skip all tables when none have changed', async () => {
      // Mock hasTableChanged to return false for all tables
      const hasTableChangedSpy = vi.spyOn(timestampCacheService, 'hasTableChanged');
      hasTableChangedSpy.mockResolvedValue(false);
      
      const result = await timestampCacheService.syncChangedTables();
      
      expect(result.success).toBe(true);
      expect(result.syncedTables).toEqual([]);
      expect(result.skippedTables).toHaveLength(7);
      expect(mockSyncTable).not.toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      // Mock hasTableChanged to return true for one table
      const hasTableChangedSpy = vi.spyOn(timestampCacheService, 'hasTableChanged');
      hasTableChangedSpy
        .mockResolvedValueOnce(true)  // attendees - changed
        .mockResolvedValue(false);    // all others - unchanged
      
      // Mock syncTable to fail
      mockSyncTable.mockRejectedValue(new Error('Sync failed'));
      
      const result = await timestampCacheService.syncChangedTables();
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to sync attendees');
    });
  });

  describe('forceSyncAll', () => {
    it('should clear timestamps and sync all tables', async () => {
      // Set some timestamps
      localStorage.setItem('kn_last_sync_attendees', '2025-01-01T00:00:00.000Z');
      localStorage.setItem('kn_last_sync_agenda_items', '2025-01-01T00:00:00.000Z');
      
      // Mock hasTableChanged to return true for all (since timestamps cleared)
      const hasTableChangedSpy = vi.spyOn(timestampCacheService, 'hasTableChanged');
      hasTableChangedSpy.mockResolvedValue(true);
      
      // Mock syncTable to succeed
      mockSyncTable.mockResolvedValue([]);
      
      const result = await timestampCacheService.forceSyncAll();
      
      expect(result.success).toBe(true);
      expect(result.syncedTables).toHaveLength(7);
      expect(mockSyncTable).toHaveBeenCalledTimes(7);
      
      // Verify timestamps were cleared
      expect(localStorage.getItem('kn_last_sync_attendees')).toBeNull();
      expect(localStorage.getItem('kn_last_sync_agenda_items')).toBeNull();
    });
  });

  describe('clearAllTimestamps', () => {
    it('should clear all timestamp keys', () => {
      // Set some timestamps
      localStorage.setItem('kn_last_sync_attendees', '2025-01-01T00:00:00.000Z');
      localStorage.setItem('kn_last_sync_agenda_items', '2025-01-01T00:00:00.000Z');
      localStorage.setItem('other_key', 'should remain');
      
      timestampCacheService.clearAllTimestamps();
      
      // Verify timestamp keys are cleared
      expect(localStorage.getItem('kn_last_sync_attendees')).toBeNull();
      expect(localStorage.getItem('kn_last_sync_agenda_items')).toBeNull();
      
      // Verify other keys remain
      expect(localStorage.getItem('other_key')).toBe('should remain');
    });
  });

  describe('sync statistics', () => {
    it('should track sync statistics', async () => {
      // Mock hasTableChanged to return mixed results
      const hasTableChangedSpy = vi.spyOn(timestampCacheService, 'hasTableChanged');
      hasTableChangedSpy
        .mockResolvedValueOnce(true)  // attendees - changed
        .mockResolvedValueOnce(false) // agenda_items - unchanged
        .mockResolvedValueOnce(true); // dining_options - changed
      
      // Mock syncTable to succeed
      mockSyncTable.mockResolvedValue([]);
      
      await timestampCacheService.syncChangedTables();
      
      const stats = timestampCacheService.getSyncStats();
      expect(stats.totalChecks).toBe(1);
      expect(stats.tablesChanged).toBe(2);
      expect(stats.tablesSkipped).toBe(1);
      expect(stats.totalSyncTime).toBeGreaterThan(0);
    });
  });

  describe('maintains data processing', () => {
    it('should use serverDataSyncService.syncTable for all processing', async () => {
      // Mock hasTableChanged to return true
      const hasTableChangedSpy = vi.spyOn(timestampCacheService, 'hasTableChanged');
      hasTableChangedSpy.mockResolvedValue(true);
      
      // Mock syncTable to succeed
      mockSyncTable.mockResolvedValue([]);
      
      await timestampCacheService.syncChangedTables();
      
      // Verify serverDataSyncService.syncTable was called
      // This ensures all transformations, filtering, and normalization happen
      expect(mockSyncTable).toHaveBeenCalled();
    });
  });
});
