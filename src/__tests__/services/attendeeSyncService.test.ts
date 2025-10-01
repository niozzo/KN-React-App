/**
 * Unit Tests for AttendeeSyncService
 * 
 * Tests the core functionality of attendee data synchronization
 * including error handling, fallback mechanisms, and event emission.
 */

import { describe, it, expect, beforeEach, afterEach, vi, jest } from 'vitest';
import { AttendeeSyncService, AttendeeSyncError } from '../../services/attendeeSyncService';
import { AttendeeSyncErrorHandler } from '../../services/attendeeSyncErrorHandler';
import { AttendeeSyncFallback } from '../../services/attendeeSyncFallback';
import type { Attendee } from '../../types/attendee';

// Mock dependencies
vi.mock('../../services/dataService', () => ({
  getCurrentAttendeeData: vi.fn()
}));

vi.mock('../../types/attendee', () => ({
  sanitizeAttendeeForStorage: vi.fn((attendee) => ({
    ...attendee,
    access_code: undefined // Remove sensitive data
  }))
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.dispatchEvent
const dispatchEventMock = vi.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: dispatchEventMock
});

describe('AttendeeSyncService', () => {
  let attendeeSyncService: AttendeeSyncService;
  let mockAttendee: Attendee;

  beforeEach(() => {
    attendeeSyncService = new AttendeeSyncService();
    mockAttendee = {
      id: 'attendee-001',
      first_name: 'John',
      last_name: 'Doe',
      selected_breakouts: ['breakout-001', 'breakout-002'],
      dining_preferences: ['vegetarian'],
      updated_at: Date.now()
    } as Attendee;

    // Reset all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    dispatchEventMock.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('refreshAttendeeData', () => {
    it('should refresh attendee data successfully', async () => {
      // Mock getCurrentAttendeeData to return fresh data
      const { getCurrentAttendeeData } = await import('../../services/dataService');
      vi.mocked(getCurrentAttendeeData).mockResolvedValue(mockAttendee);

      // Mock localStorage to return existing auth data
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'conference_auth') {
          return JSON.stringify({
            attendee: { ...mockAttendee, access_code: undefined },
            isAuthenticated: true,
            timestamp: Date.now() - 1000
          });
        }
        if (key === 'attendee_sync_version') {
          return '1.0.0';
        }
        return null;
      });

      const result = await attendeeSyncService.refreshAttendeeData();

      expect(result.success).toBe(true);
      expect(result.attendee).toEqual(mockAttendee);
      expect(result.lastSync).toBeInstanceOf(Date);
      expect(result.syncVersion).toBe('1.0.0'); // Initial version

      // Verify localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'conference_auth',
        expect.stringContaining('"attendee"')
      );

      // Verify event was emitted
      expect(dispatchEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'attendee-data-updated'
        })
      );
    });

    it('should handle network errors gracefully', async () => {
      // Mock getCurrentAttendeeData to throw network error
      const { getCurrentAttendeeData } = await import('../../services/dataService');
      vi.mocked(getCurrentAttendeeData).mockRejectedValue(new Error('Network error'));

      const result = await attendeeSyncService.refreshAttendeeData();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.attendee).toBeUndefined();
    });

    it('should handle no attendee data available', async () => {
      // Mock getCurrentAttendeeData to return null
      const { getCurrentAttendeeData } = await import('../../services/dataService');
      vi.mocked(getCurrentAttendeeData).mockResolvedValue(null);

      const result = await attendeeSyncService.refreshAttendeeData();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No attendee data available');
    });

    it('should handle localStorage errors', async () => {
      // Mock getCurrentAttendeeData to return data
      const { getCurrentAttendeeData } = await import('../../services/dataService');
      vi.mocked(getCurrentAttendeeData).mockResolvedValue(mockAttendee);

      // Mock localStorage.setItem to throw error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      const result = await attendeeSyncService.refreshAttendeeData();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update conference_auth');
    });
  });

  describe('getCurrentAttendeeFromAuth', () => {
    it('should return attendee data from conference_auth', () => {
      const testAttendee = {
        id: 'attendee-001',
        first_name: 'John',
        last_name: 'Doe'
      };
      
      const authData = {
        attendee: testAttendee,
        isAuthenticated: true,
        timestamp: Date.now()
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(authData));

      const result = attendeeSyncService.getCurrentAttendeeFromAuth();

      expect(result).toEqual(testAttendee);
    });

    it('should return null when no auth data exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = attendeeSyncService.getCurrentAttendeeFromAuth();

      expect(result).toBeNull();
    });

    it('should handle malformed auth data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = attendeeSyncService.getCurrentAttendeeFromAuth();

      expect(result).toBeNull();
    });
  });

  describe('shouldRefreshAttendeeData', () => {
    it('should return true when data is stale', () => {
      const staleAuthData = {
        attendee: mockAttendee,
        isAuthenticated: true,
        lastUpdated: Date.now() - (31 * 60 * 1000) // 31 minutes ago
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(staleAuthData));

      const result = attendeeSyncService.shouldRefreshAttendeeData(30); // 30 minute TTL

      expect(result).toBe(true);
    });

    it('should return false when data is fresh', () => {
      const freshAuthData = {
        attendee: mockAttendee,
        isAuthenticated: true,
        lastUpdated: Date.now() - (15 * 60 * 1000) // 15 minutes ago
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(freshAuthData));

      const result = attendeeSyncService.shouldRefreshAttendeeData(30); // 30 minute TTL

      expect(result).toBe(false);
    });

    it('should return true when no auth data exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = attendeeSyncService.shouldRefreshAttendeeData(30);

      expect(result).toBe(true);
    });

    it('should handle TTL check errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = attendeeSyncService.shouldRefreshAttendeeData(30);

      expect(result).toBe(true); // Should default to true on error
    });
  });

  describe('clearSyncState', () => {
    it('should clear sync version from localStorage', () => {
      attendeeSyncService.clearSyncState();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('attendee_sync_version');
    });

    it('should handle clear errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Clear error');
      });

      // Should not throw
      expect(() => attendeeSyncService.clearSyncState()).not.toThrow();
    });
  });
});

describe('AttendeeSyncErrorHandler', () => {
  describe('handleSyncError', () => {
    it('should retry retryable errors', async () => {
      const retryableError = new Error('Network error');
      retryableError.name = 'NetworkError';
      
      const testAttendee = {
        id: 'attendee-001',
        first_name: 'John',
        last_name: 'Doe'
      };
      
      const retryCallback = vi.fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce({ success: true, attendee: testAttendee });

      const result = await AttendeeSyncErrorHandler.handleSyncError(
        retryableError,
        retryCallback
      );

      expect(result.success).toBe(true);
      expect(retryCallback).toHaveBeenCalledTimes(3);
    }, 10000); // Increase timeout for this test

    it('should not retry non-retryable errors', async () => {
      const nonRetryableError = new Error('Invalid data format');
      
      const retryCallback = vi.fn();

      const result = await AttendeeSyncErrorHandler.handleSyncError(
        nonRetryableError,
        retryCallback
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid data format');
      expect(retryCallback).not.toHaveBeenCalled();
    });

    it('should return fallback result after max retries', async () => {
      const retryableError = new Error('Network error');
      retryableError.name = 'NetworkError';
      
      const retryCallback = vi.fn().mockRejectedValue(retryableError);

      const result = await AttendeeSyncErrorHandler.handleSyncError(
        retryableError,
        retryCallback
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Max retry attempts exceeded');
      expect(retryCallback).toHaveBeenCalledTimes(3);
    }, 10000); // Increase timeout for this test
  });
});

describe('AttendeeSyncFallback', () => {
  describe('getFallbackAttendeeData', () => {
    it('should return attendee data from conference_auth', () => {
      const testAttendee = {
        id: 'attendee-001',
        first_name: 'John',
        last_name: 'Doe'
      };
      
      const authData = {
        attendee: testAttendee,
        isAuthenticated: true
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'conference_auth') {
          return JSON.stringify(authData);
        }
        return null;
      });

      const result = AttendeeSyncFallback.getFallbackAttendeeData();

      expect(result).toEqual(testAttendee);
    });

    it('should return attendee data from cache when conference_auth fails', () => {
      const testAttendee = {
        id: 'attendee-001',
        first_name: 'John',
        last_name: 'Doe'
      };
      
      const cacheData = {
        data: [testAttendee]
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'conference_auth') {
          return null;
        }
        if (key === 'kn_cache_attendees') {
          return JSON.stringify(cacheData);
        }
        return null;
      });

      const result = AttendeeSyncFallback.getFallbackAttendeeData();

      expect(result).toEqual(testAttendee);
    });

    it('should return null when no fallback data available', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = AttendeeSyncFallback.getFallbackAttendeeData();

      expect(result).toBeNull();
    });

    it('should handle fallback data errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = AttendeeSyncFallback.getFallbackAttendeeData();

      expect(result).toBeNull();
    });
  });

  describe('isFallbackDataStale', () => {
    it('should return true when data is stale', () => {
      const testAttendee = {
        id: 'attendee-001',
        first_name: 'John',
        last_name: 'Doe'
      };
      
      const staleAuthData = {
        attendee: testAttendee,
        lastUpdated: Date.now() - (61 * 60 * 1000) // 61 minutes ago
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(staleAuthData));

      const result = AttendeeSyncFallback.isFallbackDataStale(60); // 60 minute max age

      expect(result).toBe(true);
    });

    it('should return false when data is fresh', () => {
      const testAttendee = {
        id: 'attendee-001',
        first_name: 'John',
        last_name: 'Doe'
      };
      
      const freshAuthData = {
        attendee: testAttendee,
        lastUpdated: Date.now() - (30 * 60 * 1000) // 30 minutes ago
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(freshAuthData));

      const result = AttendeeSyncFallback.isFallbackDataStale(60); // 60 minute max age

      expect(result).toBe(false);
    });
  });

  describe('validateFallbackData', () => {
    it('should return true for valid attendee data', () => {
      const testAttendee = {
        id: 'attendee-001',
        first_name: 'John',
        last_name: 'Doe',
        updated_at: Date.now()
      };
      
      const result = AttendeeSyncFallback.validateFallbackData(testAttendee);

      expect(result).toBe(true);
    });

    it('should return false for null data', () => {
      const result = AttendeeSyncFallback.validateFallbackData(null);

      expect(result).toBe(false);
    });

    it('should return false for data missing required fields', () => {
      const invalidAttendee = {
        id: 'attendee-001'
        // Missing first_name, last_name
      } as Attendee;

      const result = AttendeeSyncFallback.validateFallbackData(invalidAttendee);

      expect(result).toBe(false);
    });

    it('should return false for very stale data', () => {
      const testAttendee = {
        id: 'attendee-001',
        first_name: 'John',
        last_name: 'Doe',
        updated_at: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      const result = AttendeeSyncFallback.validateFallbackData(testAttendee);

      expect(result).toBe(false);
    });
  });
});
