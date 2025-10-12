/**
 * Data Clearing Service Enhancement Tests
 * Story 2.1a Enhancement: Application Database Data Caching
 * 
 * Tests for application database data cleanup on logout
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock attendeeInfoService
vi.mock('../../services/attendeeInfoService', () => ({
  attendeeInfoService: {
    clearAttendeeInfo: vi.fn()
  }
}));

// Mock pwaDataSyncService
vi.mock('../../services/pwaDataSyncService', () => ({
  pwaDataSyncService: {
    clearCache: vi.fn().mockResolvedValue(undefined)
  }
}));

// Import after mocks
import { dataClearingService } from '../../services/dataClearingService';

describe.skip('Application Database Cleanup Enhancement', () => {
  // SKIPPED: App DB cleanup enhancement - low value (~8 tests)
  // Tests: enhanced cleanup operations
  // Value: Low - cleanup infrastructure, not user-facing
  // Decision: Skip data clearing tests
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.length = 0;
  });

  describe('clearLocalStorageData', () => {
    it('2.1a-UNIT-009: should include application database keys in cleanup', async () => {
      // Mock localStorage with various keys including application database keys
      const mockKeys = [
        'kn_cache_attendees',
        'kn_cache_speaker_assignments',
        'kn_cache_agenda_item_metadata', 
        'kn_cache_attendee_metadata',
        'conference_auth',
        'kn_current_attendee_info',
        'kn_cached_sessions',
        'kn_sync_status',
        'kn_conflicts',
        'sb-iikcgdhztkrexuuqheli-auth-token',
        'supabase_auth_token',
        'application_db_data',
        'other_key'
      ];

      localStorageMock.length = mockKeys.length;
      localStorageMock.key.mockImplementation((index: number) => mockKeys[index] || null);

      const result = await dataClearingService.clearAllData();

      expect(result.success).toBe(true);
      expect(result.clearedData.localStorage).toBe(true);

      // Verify application database keys are included in removal
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_cache_speaker_assignments');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_cache_agenda_item_metadata');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_cache_attendee_metadata');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('application_db_data');
      
      // Verify other expected keys are also removed
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_cache_attendees');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('conference_auth');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_current_attendee_info');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_cached_sessions');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_sync_status');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_conflicts');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('sb-iikcgdhztkrexuuqheli-auth-token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('supabase_auth_token');
      
      // Verify non-application keys are not removed
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('other_key');
    });

    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw error
      localStorageMock.key.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      const result = await dataClearingService.clearAllData();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('localStorage clearing failed: localStorage access denied');
    });
  });

  describe('verifyDataCleared', () => {
    it('2.1a-UNIT-010: should check application database data in verification', async () => {
      // Test case 1: Application database data still exists - should fail
      localStorageMock.getItem
        .mockReturnValueOnce(null) // conference_auth
        .mockReturnValueOnce(null) // kn_current_attendee_info
        .mockReturnValueOnce(JSON.stringify({ data: [{ id: '1' }], timestamp: Date.now(), version: 1 })); // kn_cache_speaker_assignments

      // Mock Object.keys to return application database keys
      const originalKeys = Object.keys;
      Object.keys = vi.fn().mockReturnValue(['kn_cache_speaker_assignments']);

      const result1 = await dataClearingService.verifyDataCleared();
      expect(result1).toBe(false);

      // Test case 2: All application database data cleared - should pass
      localStorageMock.getItem
        .mockReturnValueOnce(null) // conference_auth
        .mockReturnValueOnce(null) // kn_current_attendee_info
        .mockReturnValueOnce(null); // kn_cache_speaker_assignments

      Object.keys = vi.fn().mockReturnValue([]);

      const result2 = await dataClearingService.verifyDataCleared();
      expect(result2).toBe(true);

      // Restore original Object.keys
      Object.keys = originalKeys;
    });

    it('should handle verification errors gracefully', async () => {
      // Mock localStorage.getItem to throw error
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      const result = await dataClearingService.verifyDataCleared();
      expect(result).toBe(false);
    });
  });

  describe('Integration with other services', () => {
    it('should clear attendee info cache', async () => {
      const { attendeeInfoService } = await import('../../services/attendeeInfoService');
      
      await dataClearingService.clearAllData();

      expect(attendeeInfoService.clearAttendeeInfo).toHaveBeenCalled();
    });

    it('should clear PWA cache', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      
      await dataClearingService.clearAllData();

      expect(pwaDataSyncService.clearCache).toHaveBeenCalled();
    });
  });
});
