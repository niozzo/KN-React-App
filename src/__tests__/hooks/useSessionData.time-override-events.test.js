/**
 * useSessionData Hook - Time Override Event Synchronization Tests
 * Tests for the new event-driven state synchronization when time override changes
 * 
 * Edge Cases Covered:
 * 1. Session state updates when time override changes via custom event
 * 2. Session state updates when time override changes via localStorage (cross-tab)
 * 3. Performance optimization - only updates when session state actually changes
 * 4. Event listener cleanup on component unmount
 * 5. Multiple rapid time override changes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionData } from '../../hooks/useSessionData';
import TimeService from '../../services/timeService';

// Mock the services
vi.mock('../../services/agendaService', () => ({
  agendaService: {
    getActiveAgendaItems: vi.fn()
  }
}));

vi.mock('../../services/dataService', () => ({
  getCurrentAttendeeData: vi.fn(),
  getAttendeeSeatAssignments: vi.fn()
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true })
}));

// Mock TimeService
vi.mock('../../services/timeService', () => ({
  default: {
    getCurrentTime: vi.fn(),
    isOverrideActive: vi.fn(),
    getOverrideTime: vi.fn(),
    getDynamicOverrideTime: vi.fn()
  }
}));

describe('useSessionData Hook - Time Override Event Synchronization', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalLocalStorage = global.localStorage;
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;
  const originalDispatchEvent = window.dispatchEvent;

  const mockSessions = [
    {
      id: '1',
      title: 'Opening Remarks & Apax CEO Welcome',
      start_time: '09:00:00',
      end_time: '09:30:00',
      date: '2024-12-19',
      location: 'The Grand Ballroom, 8th Floor',
      type: 'keynote'
    },
    {
      id: '2',
      title: 'Coffee Break',
      start_time: '09:30:00',
      end_time: '10:00:00',
      date: '2024-12-19',
      location: 'Lobby',
      type: 'coffee_break'
    },
    {
      id: '3',
      title: 'Next Session',
      start_time: '10:00:00',
      end_time: '11:00:00',
      date: '2024-12-19',
      location: 'Room A',
      type: 'session'
    }
  ];

  const mockAttendee = {
    id: '1',
    name: 'Test User',
    selected_breakouts: []
  };

  let mockEventListeners = {};
  let mockDispatchEvent;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };

    // Mock window event listeners
    mockEventListeners = {};
    mockDispatchEvent = vi.fn();
    
    window.addEventListener = vi.fn((event, handler) => {
      if (!mockEventListeners[event]) {
        mockEventListeners[event] = [];
      }
      mockEventListeners[event].push(handler);
    });
    
    window.removeEventListener = vi.fn((event, handler) => {
      if (mockEventListeners[event]) {
        const index = mockEventListeners[event].indexOf(handler);
        if (index > -1) {
          mockEventListeners[event].splice(index, 1);
        }
      }
    });
    
    window.dispatchEvent = mockDispatchEvent;

    // Set development environment
    process.env.NODE_ENV = 'development';

    // Mock successful service responses
    const { agendaService } = await import('../../services/agendaService');
    const dataService = await import('../../services/dataService');
    
    vi.mocked(agendaService.getActiveAgendaItems).mockResolvedValue({
      success: true,
      data: mockSessions
    });

    vi.mocked(dataService.getCurrentAttendeeData).mockResolvedValue(mockAttendee);
    vi.mocked(dataService.getAttendeeSeatAssignments).mockResolvedValue([]);

    // Mock TimeService - default to real time
    vi.mocked(TimeService.getCurrentTime).mockReturnValue(new Date('2024-12-19T08:00:00'));
    vi.mocked(TimeService.isOverrideActive).mockReturnValue(false);
    vi.mocked(TimeService.getOverrideTime).mockReturnValue(null);
    vi.mocked(TimeService.getDynamicOverrideTime).mockReturnValue(null);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    global.localStorage = originalLocalStorage;
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    window.dispatchEvent = originalDispatchEvent;
    vi.clearAllMocks();
  });

  describe('Event Listener Registration', () => {
    it('should register event listeners for time override changes', async () => {
      const { result } = renderHook(() => useSessionData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should register both storage and custom event listeners
      expect(window.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('timeOverrideChanged', expect.any(Function));
    });

    it('should clean up event listeners on unmount', async () => {
      const { unmount } = renderHook(() => useSessionData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      unmount();

      // Should remove both event listeners
      expect(window.removeEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('timeOverrideChanged', expect.any(Function));
    });
  });

  describe('Custom Event Handling', () => {
    it('should update session states when timeOverrideChanged event is fired', async () => {
      const { result } = renderHook(() => useSessionData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Initially no current session (no override time)
      expect(result.current.currentSession).toBeNull();
      expect(result.current.nextSession?.id).toBe('1');

      // Simulate time override change to 9:05 AM (during first session)
      const overrideTime = new Date('2024-12-19T09:05:00');
      vi.mocked(TimeService.getCurrentTime).mockReturnValue(overrideTime);
      vi.mocked(TimeService.isOverrideActive).mockReturnValue(true);

      // Get the custom event handler
      const customEventHandler = mockEventListeners['timeOverrideChanged'][0];
      
      await act(async () => {
        customEventHandler();
      });

      // Should now detect current session
      expect(result.current.currentSession?.id).toBe('1');
      expect(result.current.nextSession?.id).toBe('2');
    });

    it('should handle multiple rapid time override changes', async () => {
      const { result } = renderHook(() => useSessionData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const customEventHandler = mockEventListeners['timeOverrideChanged'][0];

      // Rapid changes: 9:05 -> 9:35 -> 10:05
      await act(async () => {
        // First change: 9:05 AM (during first session)
        vi.mocked(TimeService.getCurrentTime).mockReturnValue(new Date('2024-12-19T09:05:00'));
        vi.mocked(TimeService.isOverrideActive).mockReturnValue(true);
        customEventHandler();
      });

      expect(result.current.currentSession?.id).toBe('1');
      expect(result.current.nextSession?.id).toBe('2');

      await act(async () => {
        // Second change: 9:35 AM (during coffee break)
        vi.mocked(TimeService.getCurrentTime).mockReturnValue(new Date('2024-12-19T09:35:00'));
        customEventHandler();
      });

      expect(result.current.currentSession?.id).toBe('2');
      expect(result.current.nextSession?.id).toBe('3');

      await act(async () => {
        // Third change: 10:05 AM (during third session)
        vi.mocked(TimeService.getCurrentTime).mockReturnValue(new Date('2024-12-19T10:05:00'));
        customEventHandler();
      });

      expect(result.current.currentSession?.id).toBe('3');
      expect(result.current.nextSession).toBeUndefined();
    });
  });

  describe('Storage Event Handling', () => {
    it('should update session states when localStorage storage event is fired', async () => {
      const { result } = renderHook(() => useSessionData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Get the storage event handler
      const storageEventHandler = mockEventListeners['storage'][0];

      // Simulate localStorage change from another tab
      await act(async () => {
        const overrideTime = new Date('2024-12-19T09:05:00');
        vi.mocked(TimeService.getCurrentTime).mockReturnValue(overrideTime);
        vi.mocked(TimeService.isOverrideActive).mockReturnValue(true);
        
        // Simulate storage event
        storageEventHandler({
          key: 'kn_time_override',
          newValue: overrideTime.toISOString()
        });
      });

      // Should detect current session
      expect(result.current.currentSession?.id).toBe('1');
      expect(result.current.nextSession?.id).toBe('2');
    });

    it('should ignore storage events for other keys', async () => {
      const { result } = renderHook(() => useSessionData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const storageEventHandler = mockEventListeners['storage'][0];
      const initialCurrentSession = result.current.currentSession;
      const initialNextSession = result.current.nextSession;

      // Simulate storage event for different key
      await act(async () => {
        storageEventHandler({
          key: 'other_key',
          newValue: 'some_value'
        });
      });

      // Should not change session states
      expect(result.current.currentSession).toBe(initialCurrentSession);
      expect(result.current.nextSession).toBe(initialNextSession);
    });
  });

  describe('Performance Optimization', () => {
    it('should only update state when session actually changes', async () => {
      const { result } = renderHook(() => useSessionData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const customEventHandler = mockEventListeners['timeOverrideChanged'][0];
      
      // Set initial state
      await act(async () => {
        const overrideTime = new Date('2024-12-19T09:05:00');
        vi.mocked(TimeService.getCurrentTime).mockReturnValue(overrideTime);
        vi.mocked(TimeService.isOverrideActive).mockReturnValue(true);
        customEventHandler();
      });

      const firstCurrentSession = result.current.currentSession;
      const firstNextSession = result.current.nextSession;

      // Trigger same time override again
      await act(async () => {
        customEventHandler();
      });

      // Should be same objects (no unnecessary re-renders)
      expect(result.current.currentSession).toBe(firstCurrentSession);
      expect(result.current.nextSession).toBe(firstNextSession);
    });

    it('should update state when session changes occur', async () => {
      const { result } = renderHook(() => useSessionData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Initially no current session
      expect(result.current.currentSession).toBeNull();
      expect(result.current.nextSession?.id).toBe('1');

      const customEventHandler = mockEventListeners['timeOverrideChanged'][0];

      await act(async () => {
        const overrideTime = new Date('2024-12-19T09:05:00');
        vi.mocked(TimeService.getCurrentTime).mockReturnValue(overrideTime);
        vi.mocked(TimeService.isOverrideActive).mockReturnValue(true);
        customEventHandler();
      });

      // Should update the session state
      expect(result.current.currentSession?.id).toBe('1');
      expect(result.current.nextSession?.id).toBe('2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle time override change when no sessions are loaded', async () => {
      // Mock empty sessions
      const { agendaService } = await import('../../services/agendaService');
      vi.mocked(agendaService.getActiveAgendaItems).mockResolvedValue({
        success: true,
        data: []
      });

      const { result } = renderHook(() => useSessionData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const customEventHandler = mockEventListeners['timeOverrideChanged'][0];

      // Should not crash when triggering event with no sessions
      await act(async () => {
        const overrideTime = new Date('2024-12-19T09:05:00');
        global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());
        customEventHandler();
      });

      expect(result.current.currentSession).toBeNull();
      expect(result.current.nextSession).toBeNull();
    });

    it('should handle invalid time override gracefully', async () => {
      const { result } = renderHook(() => useSessionData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const customEventHandler = mockEventListeners['timeOverrideChanged'][0];

      // Mock invalid time override
      global.localStorage.getItem.mockReturnValue('invalid-date');

      // Should not crash
      await act(async () => {
        customEventHandler();
      });

      // Should fall back to real time
      expect(result.current.sessions).toEqual(mockSessions);
    });
  });
});
