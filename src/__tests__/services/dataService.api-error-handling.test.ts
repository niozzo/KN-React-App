/**
 * API Error Handling Tests for DataService
 * Tests the enhanced error handling and fallback mechanisms
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCurrentAttendeeData } from '../../services/dataService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock authService
vi.mock('../../services/authService', () => ({
  getCurrentAttendee: vi.fn(() => ({ id: 'test-user-123' })),
  isUserAuthenticated: vi.fn(() => true)
}));

describe('DataService API Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Content-Type Validation', () => {
    it('should throw error when API returns HTML instead of JSON', async () => {
      // Mock HTML response (like a 404 error page)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn().mockReturnValue('text/html')
        },
        json: vi.fn().mockRejectedValue(new Error('Unexpected token'))
      });

      await expect(getCurrentAttendeeData()).rejects.toThrow('Failed to fetch current attendee data');
    });

    it('should throw error when content-type is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn().mockReturnValue(null)
        },
        json: vi.fn().mockRejectedValue(new Error('Unexpected token'))
      });

      await expect(getCurrentAttendeeData()).rejects.toThrow('Failed to fetch current attendee data');
    });

    it('should work correctly with valid JSON response', async () => {
      const mockAttendee = { id: 'test-user-123', name: 'Test User' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn().mockReturnValue('application/json')
        },
        json: vi.fn().mockResolvedValue(mockAttendee)
      });

      const result = await getCurrentAttendeeData();
      expect(result).toEqual(mockAttendee);
    });
  });

  describe('Fallback to Cached Data', () => {
    it('should fallback to cached data when API fails', async () => {
      // Mock API failure with HTML response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn().mockReturnValue('text/html')
        },
        json: vi.fn().mockRejectedValue(new Error('Unexpected token'))
      });

      // Mock cached data
      const cachedAttendees = [
        { id: 'test-user-123', name: 'Test User', email: 'test@example.com' }
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedAttendees));

      const result = await getCurrentAttendeeData();
      expect(result).toEqual(cachedAttendees[0]);
    });

    it('should throw error when both API and cache fail', async () => {
      // Mock API failure
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn().mockReturnValue('text/html')
        },
        json: vi.fn().mockRejectedValue(new Error('Unexpected token'))
      });

      // Mock no cached data
      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(getCurrentAttendeeData()).rejects.toThrow('Failed to fetch current attendee data');
    });

    it('should handle corrupted cached data gracefully', async () => {
      // Mock API failure
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn().mockReturnValue('text/html')
        },
        json: vi.fn().mockRejectedValue(new Error('Unexpected token'))
      });

      // Mock corrupted cached data
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      await expect(getCurrentAttendeeData()).rejects.toThrow('Failed to fetch current attendee data');
    });
  });

  describe('HTTP Status Code Handling', () => {
    it('should handle 404 errors properly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: vi.fn().mockReturnValue('application/json')
        }
      });

      await expect(getCurrentAttendeeData()).rejects.toThrow('Failed to fetch current attendee data');
    });

    it('should handle 500 errors properly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: vi.fn().mockReturnValue('application/json')
        }
      });

      await expect(getCurrentAttendeeData()).rejects.toThrow('Failed to fetch current attendee data');
    });
  });
});
