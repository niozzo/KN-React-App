/**
 * localStorage-First DataService Tests
 * Tests the localStorage-first approach for data access
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCurrentAttendeeData, getAllAttendees } from '../../services/dataService';

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

describe('DataService localStorage-First Approach', () => {
  const mockAttendee = {
    id: 'test-user-123',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com'
  };

  const mockAttendees = [
    mockAttendee,
    {
      id: 'test-user-456',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCurrentAttendeeData', () => {
    it('should use localStorage data when available', async () => {
      // Mock localStorage with cached data
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        data: mockAttendees
      }));

      const result = await getCurrentAttendeeData();

      expect(result).toEqual(mockAttendee);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('kn_cache_attendees');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle direct array format in localStorage', async () => {
      // Mock localStorage with direct array format
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockAttendees));

      const result = await getCurrentAttendeeData();

      expect(result).toEqual(mockAttendee);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fallback to API when localStorage is empty', async () => {
      // Mock empty localStorage
      mockLocalStorage.getItem.mockReturnValue(null);

      // Mock successful API response
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
      expect(mockFetch).toHaveBeenCalledWith('/api/attendees/test-user-123', { credentials: 'include' });
    });

    it('should fallback to API when localStorage has no matching attendee', async () => {
      // Mock localStorage with different attendee
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        data: [{ id: 'different-user', first_name: 'Other', last_name: 'User' }]
      }));

      // Mock successful API response
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
      expect(mockFetch).toHaveBeenCalledWith('/api/attendees/test-user-123', { credentials: 'include' });
    });

    it('should handle localStorage parse errors gracefully', async () => {
      // Mock invalid JSON in localStorage
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      // Mock successful API response
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
      expect(mockFetch).toHaveBeenCalledWith('/api/attendees/test-user-123', { credentials: 'include' });
    });

    it('should return null when no current user', async () => {
      // Mock no current user
      const { getCurrentAttendee } = await import('../../services/authService');
      vi.mocked(getCurrentAttendee).mockReturnValueOnce(null);

      const result = await getCurrentAttendeeData();

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('getAllAttendees', () => {
    it('should use localStorage data when available', async () => {
      // Mock localStorage with cached data
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        data: mockAttendees
      }));

      const result = await getAllAttendees();

      expect(result).toEqual(mockAttendees);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('kn_cache_attendees');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle direct array format in localStorage', async () => {
      // Mock localStorage with direct array format
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockAttendees));

      const result = await getAllAttendees();

      expect(result).toEqual(mockAttendees);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should sort attendees by last name', async () => {
      const unsortedAttendees = [
        { id: '1', first_name: 'John', last_name: 'Doe' },
        { id: '2', first_name: 'Jane', last_name: 'Smith' },
        { id: '3', first_name: 'Bob', last_name: 'Anderson' }
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        data: unsortedAttendees
      }));

      const result = await getAllAttendees();

      expect(result[0].last_name).toBe('Anderson');
      expect(result[1].last_name).toBe('Doe');
      expect(result[2].last_name).toBe('Smith');
    });

    it('should fallback to API when localStorage is empty', async () => {
      // Mock empty localStorage
      mockLocalStorage.getItem.mockReturnValue(null);

      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn().mockReturnValue('application/json')
        },
        json: vi.fn().mockResolvedValue(mockAttendees)
      });

      const result = await getAllAttendees();

      expect(result).toEqual(mockAttendees);
      expect(mockFetch).toHaveBeenCalledWith('/api/attendees', { credentials: 'include' });
    });

    it('should fallback to API when localStorage has invalid data', async () => {
      // Mock localStorage with invalid data
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        data: 'not-an-array'
      }));

      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn().mockReturnValue('application/json')
        },
        json: vi.fn().mockResolvedValue(mockAttendees)
      });

      const result = await getAllAttendees();

      expect(result).toEqual(mockAttendees);
      expect(mockFetch).toHaveBeenCalledWith('/api/attendees', { credentials: 'include' });
    });

    it('should handle localStorage parse errors gracefully', async () => {
      // Mock invalid JSON in localStorage
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn().mockReturnValue('application/json')
        },
        json: vi.fn().mockResolvedValue(mockAttendees)
      });

      const result = await getAllAttendees();

      expect(result).toEqual(mockAttendees);
      expect(mockFetch).toHaveBeenCalledWith('/api/attendees', { credentials: 'include' });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when both localStorage and API fail', async () => {
      // Mock localStorage failure
      mockLocalStorage.getItem.mockReturnValue(null);

      // Mock API failure
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getCurrentAttendeeData()).rejects.toThrow('Failed to fetch current attendee data');
    });

    it('should throw error when authentication fails', async () => {
      // Mock authentication failure
      const { isUserAuthenticated } = await import('../../services/authService');
      vi.mocked(isUserAuthenticated).mockReturnValueOnce(false);

      await expect(getCurrentAttendeeData()).rejects.toThrow('Authentication required to access data');
    });
  });
});
