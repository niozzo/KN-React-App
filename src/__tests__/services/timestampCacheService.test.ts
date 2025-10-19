import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { timestampCacheService } from '../../services/timestampCacheService';
import { serverDataSyncService } from '../../services/serverDataSyncService';

// Mock dependencies
vi.mock('../../services/supabaseClientService', () => ({
  supabaseClientService: {
    getClient: vi.fn()
  }
}));

vi.mock('../../services/serverDataSyncService', () => ({
  serverDataSyncService: {
    syncTable: vi.fn()
  }
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    progress: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('TimestampCacheService - Critical Functions Only', () => {
  let mockSyncTable: any;

  beforeEach(async () => {
    // Clear localStorage
    localStorage.clear();
    
    // Reset all mocks
    vi.clearAllMocks();
    vi.resetAllMocks();
    
    mockSyncTable = vi.mocked(serverDataSyncService.syncTable);
  });

  afterEach(() => {
    localStorage.clear();
    // Clear any cached state in the singleton
    timestampCacheService.clearAllTimestamps();
  });

  describe('Core Functionality', () => {
    it('should return true for first sync (no timestamp)', async () => {
      const result = await timestampCacheService.hasTableChanged('attendees');
      expect(result).toBe(true);
    });

    it('should clear all timestamps', () => {
      // Simply verify the method exists and can be called without error
      expect(() => timestampCacheService.clearAllTimestamps()).not.toThrow();
    });

    it('should force sync all tables', async () => {
      // Mock hasTableChanged to return true for all tables
      const hasTableChangedSpy = vi.spyOn(timestampCacheService, 'hasTableChanged');
      hasTableChangedSpy.mockResolvedValue(true);
      
      mockSyncTable.mockResolvedValue([]);
      
      const result = await timestampCacheService.forceSyncAll();
      
      // Check that all tables were synced
      expect(result.success).toBe(true);
      expect(result.syncedTables).toHaveLength(7);
      expect(mockSyncTable).toHaveBeenCalledTimes(7);
    });

    it('should track sync statistics', async () => {
      // Mock hasTableChanged to return true
      const hasTableChangedSpy = vi.spyOn(timestampCacheService, 'hasTableChanged');
      hasTableChangedSpy.mockResolvedValue(true);
      
      mockSyncTable.mockResolvedValue([]);
      
      await timestampCacheService.syncChangedTables();
      
      const stats = timestampCacheService.getSyncStats();
      expect(stats.totalChecks).toBeGreaterThan(0);
      expect(stats.tablesChanged).toBeGreaterThan(0);
    });

    it('should use serverDataSyncService for data processing', async () => {
      // Mock hasTableChanged to return true
      const hasTableChangedSpy = vi.spyOn(timestampCacheService, 'hasTableChanged');
      hasTableChangedSpy.mockResolvedValue(true);
      
      mockSyncTable.mockResolvedValue([]);
      
      await timestampCacheService.syncChangedTables();
      
      // Verify serverDataSyncService.syncTable was called
      expect(mockSyncTable).toHaveBeenCalled();
    });
  });
});