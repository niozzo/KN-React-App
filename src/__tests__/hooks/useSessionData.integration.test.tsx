/**
 * Integration Tests for useSessionData Hook
 * 
 * Tests the integration between useSessionData and attendee data synchronization,
 * including event-driven updates and personalization re-application.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSessionData } from '../useSessionData';
import { AttendeeSyncService } from '../../services/attendeeSyncService';
import type { Attendee } from '../../types/attendee';

// Mock dependencies
vi.mock('../../services/attendeeSyncService', () => ({
  AttendeeSyncService: vi.fn(),
  attendeeSyncService: {
    shouldRefreshAttendeeData: vi.fn(),
    refreshAttendeeData: vi.fn()
  }
}));

vi.mock('../../services/attendeeSyncErrorHandler', () => ({
  AttendeeSyncErrorHandler: {
    handleSyncError: vi.fn()
  }
}));

vi.mock('../../services/attendeeSyncFallback', () => ({
  AttendeeSyncFallback: {
    getFallbackAttendeeData: vi.fn(),
    validateFallbackData: vi.fn()
  }
}));

vi.mock('../../services/dataService', () => ({
  getCurrentAttendeeData: vi.fn(),
  getAttendeeSeatAssignments: vi.fn()
}));

vi.mock('../../services/agendaService', () => ({
  agendaService: {
    getActiveAgendaItems: vi.fn()
  }
}));

vi.mock('../../services/pwaDataSyncService', () => ({
  pwaDataSyncService: {
    getCachedTableData: vi.fn(),
    setOnlineStatus: vi.fn(),
    getOnlineStatus: vi.fn()
  }
}));

vi.mock('../../services/cacheMonitoringService', () => ({
  cacheMonitoringService: {
    getSessionId: vi.fn(() => 'test-session'),
    logStateTransition: vi.fn(),
    logCacheCorruption: vi.fn()
  }
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true
  })
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

// Mock window.dispatchEvent and addEventListener
const dispatchEventMock = vi.fn();
const addEventListenerMock = vi.fn();
const removeEventListenerMock = vi.fn();

Object.defineProperty(window, 'dispatchEvent', {
  value: dispatchEventMock
});

Object.defineProperty(window, 'addEventListener', {
  value: addEventListenerMock
});

Object.defineProperty(window, 'removeEventListener', {
  value: removeEventListenerMock
});

describe('useSessionData Integration', () => {
  let mockAttendee: Attendee;
  let mockSessions: any[];
  let mockDiningOptions: any[];

  beforeEach(() => {
    mockAttendee = {
      id: 'attendee-001',
      first_name: 'John',
      last_name: 'Doe',
      selected_breakouts: ['breakout-001', 'breakout-002'],
      dining_preferences: ['vegetarian'],
      updated_at: Date.now()
    } as Attendee;

    mockSessions = [
      {
        id: 'session-001',
        title: 'Keynote',
        session_type: 'keynote',
        start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'breakout-001',
        title: 'Breakout Session 1',
        session_type: 'breakout',
        start_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      }
    ];

    mockDiningOptions = [
      {
        id: 'dining-001',
        name: 'Vegetarian Lunch',
        type: 'dining',
        start_time: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Reset all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    addEventListenerMock.mockImplementation(() => {});
    removeEventListenerMock.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Event-Driven Attendee Data Updates', () => {
    it('should update attendee state when attendee-data-updated event is fired', async () => {
      const { getCurrentAttendeeData } = await import('../../services/dataService');
      const { attendeeSyncService } = await import('../../services/attendeeSyncService');
      
      vi.mocked(getCurrentAttendeeData).mockResolvedValue(mockAttendee);
      vi.mocked(attendeeSyncService.shouldRefreshAttendeeData).mockReturnValue(false);

      const { result } = renderHook(() => useSessionData());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.attendee).toEqual(mockAttendee);
      });

      // Simulate attendee data update event
      const updatedAttendee = {
        ...mockAttendee,
        selected_breakouts: ['breakout-003', 'breakout-004'] // Different breakouts
      };

      const event = new CustomEvent('attendee-data-updated', {
        detail: {
          attendee: updatedAttendee,
          timestamp: Date.now(),
          syncVersion: '1.0.1'
        }
      });

      act(() => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(result.current.attendee).toEqual(updatedAttendee);
      });
    });

    it('should re-apply personalization when attendee data changes', async () => {
      const { getCurrentAttendeeData } = await import('../../services/dataService');
      const { attendeeSyncService } = await import('../../services/attendeeSyncService');
      
      vi.mocked(getCurrentAttendeeData).mockResolvedValue(mockAttendee);
      vi.mocked(attendeeSyncService.shouldRefreshAttendeeData).mockReturnValue(false);

      // Mock agenda service to return sessions
      const { agendaService } = await import('../../services/agendaService');
      vi.mocked(agendaService.getActiveAgendaItems).mockResolvedValue({
        success: true,
        data: mockSessions
      });

      const { result } = renderHook(() => useSessionData());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.sessions).toBeDefined();
      });

      // Simulate attendee data update with different breakout assignments
      const updatedAttendee = {
        ...mockAttendee,
        selected_breakouts: ['breakout-003'] // Only one breakout now
      };

      const event = new CustomEvent('attendee-data-updated', {
        detail: {
          attendee: updatedAttendee,
          timestamp: Date.now(),
          syncVersion: '1.0.1'
        }
      });

      act(() => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(result.current.attendee).toEqual(updatedAttendee);
        // Sessions should be re-filtered based on new attendee data
        expect(result.current.sessions).toBeDefined();
      });
    });

    it('should update lastUpdated timestamp when attendee data changes', async () => {
      const { getCurrentAttendeeData } = await import('../../services/dataService');
      const { attendeeSyncService } = await import('../../services/attendeeSyncService');
      
      vi.mocked(getCurrentAttendeeData).mockResolvedValue(mockAttendee);
      vi.mocked(attendeeSyncService.shouldRefreshAttendeeData).mockReturnValue(false);

      const { result } = renderHook(() => useSessionData());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.attendee).toEqual(mockAttendee);
      });

      const initialLastUpdated = result.current.lastUpdated;

      // Simulate attendee data update event
      const event = new CustomEvent('attendee-data-updated', {
        detail: {
          attendee: mockAttendee,
          timestamp: Date.now(),
          syncVersion: '1.0.1'
        }
      });

      act(() => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(result.current.lastUpdated).not.toEqual(initialLastUpdated);
      });
    });
  });

  describe('Attendee Data Refresh Integration', () => {
    it('should refresh attendee data when stale', async () => {
      const { getCurrentAttendeeData } = await import('../../services/dataService');
      const { attendeeSyncService } = await import('../../services/attendeeSyncService');
      
      vi.mocked(getCurrentAttendeeData).mockResolvedValue(mockAttendee);
      vi.mocked(attendeeSyncService.shouldRefreshAttendeeData).mockReturnValue(true);
      vi.mocked(attendeeSyncService.refreshAttendeeData).mockResolvedValue({
        success: true,
        attendee: mockAttendee,
        lastSync: new Date(),
        syncVersion: '1.0.1'
      });

      const { result } = renderHook(() => useSessionData());

      await waitFor(() => {
        expect(attendeeSyncService.refreshAttendeeData).toHaveBeenCalled();
        expect(result.current.attendee).toEqual(mockAttendee);
      });
    });

    it('should handle attendee sync failures with fallback', async () => {
      const { getCurrentAttendeeData } = await import('../../services/dataService');
      const { attendeeSyncService } = await import('../../services/attendeeSyncService');
      const { AttendeeSyncErrorHandler } = await import('../../services/attendeeSyncErrorHandler');
      const { AttendeeSyncFallback } = await import('../../services/attendeeSyncFallback');
      
      vi.mocked(getCurrentAttendeeData).mockResolvedValue(mockAttendee);
      vi.mocked(attendeeSyncService.shouldRefreshAttendeeData).mockReturnValue(true);
      vi.mocked(attendeeSyncService.refreshAttendeeData).mockRejectedValue(new Error('Network error'));
      
      const fallbackAttendee = { ...mockAttendee, id: 'fallback-001' };
      vi.mocked(AttendeeSyncFallback.getFallbackAttendeeData).mockReturnValue(fallbackAttendee);
      vi.mocked(AttendeeSyncFallback.validateFallbackData).mockReturnValue(true);
      
      vi.mocked(AttendeeSyncErrorHandler.handleSyncError).mockResolvedValue({
        success: false,
        error: 'Max retry attempts exceeded'
      });

      const { result } = renderHook(() => useSessionData());

      await waitFor(() => {
        expect(AttendeeSyncFallback.getFallbackAttendeeData).toHaveBeenCalled();
        expect(result.current.attendee).toEqual(fallbackAttendee);
      });
    });

    it('should handle import errors gracefully', async () => {
      const { getCurrentAttendeeData } = await import('../../services/dataService');
      
      vi.mocked(getCurrentAttendeeData).mockResolvedValue(mockAttendee);

      // Mock import to throw error
      vi.doMock('../../services/attendeeSyncService', () => {
        throw new Error('Import error');
      });

      const { result } = renderHook(() => useSessionData());

      await waitFor(() => {
        expect(result.current.attendee).toEqual(mockAttendee);
        // Should continue with existing attendee data
      });
    });
  });

  describe('Event Listener Management', () => {
    it('should add event listener on mount', () => {
      renderHook(() => useSessionData());

      expect(addEventListenerMock).toHaveBeenCalledWith(
        'attendee-data-updated',
        expect.any(Function)
      );
    });

    it('should remove event listener on unmount', () => {
      const { unmount } = renderHook(() => useSessionData());

      unmount();

      expect(removeEventListenerMock).toHaveBeenCalledWith(
        'attendee-data-updated',
        expect.any(Function)
      );
    });

    it('should handle multiple event listeners correctly', () => {
      const { rerender } = renderHook(() => useSessionData());

      // Rerender to trigger dependency changes
      rerender();

      // Should have added listener multiple times
      expect(addEventListenerMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling Integration', () => {
    it('should set error state when attendee data loading fails completely', async () => {
      const { getCurrentAttendeeData } = await import('../../services/dataService');
      const { attendeeSyncService } = await import('../../services/attendeeSyncService');
      const { AttendeeSyncErrorHandler } = await import('../../services/attendeeSyncErrorHandler');
      const { AttendeeSyncFallback } = await import('../../services/attendeeSyncFallback');
      
      vi.mocked(getCurrentAttendeeData).mockResolvedValue(mockAttendee);
      vi.mocked(attendeeSyncService.shouldRefreshAttendeeData).mockReturnValue(true);
      vi.mocked(attendeeSyncService.refreshAttendeeData).mockRejectedValue(new Error('Network error'));
      
      vi.mocked(AttendeeSyncFallback.getFallbackAttendeeData).mockReturnValue(null);
      vi.mocked(AttendeeSyncErrorHandler.handleSyncError).mockRejectedValue(new Error('Fallback failed'));

      const { result } = renderHook(() => useSessionData());

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load attendee data');
      });
    });
  });
});
