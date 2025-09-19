/**
 * useSessionData Hook Time Override Integration Tests
 * Tests for session data logic with time override functionality
 * 
 * Edge Cases Covered:
 * 1. Session detection with time override
 * 2. Current/next session logic with override
 * 3. Session boundary handling with override
 * 4. Data refresh with time override
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionData } from '../../hooks/useSessionData';
import TimeService from '../../services/timeService';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock TimeService
vi.mock('../../services/timeService', () => ({
  default: {
    getCurrentTime: vi.fn(),
    isOverrideActive: vi.fn(),
    getOverrideTime: vi.fn()
  }
}));

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

describe('useSessionData Hook - Time Override Integration', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalLocalStorage = global.localStorage;

  // Wrapper component for tests that need AuthProvider
  const TestWrapper = ({ children }) => (
    <AuthProvider>
      {children}
    </AuthProvider>
  );

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

  let mockStorage = {};

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Clear mock storage between tests
    mockStorage = {};
    
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };

    // Set development environment
    process.env.NODE_ENV = 'development';

    // Mock successful service responses
    const { agendaService } = await import('../../services/agendaService');
    const { getCurrentAttendeeData, getAttendeeSeatAssignments } = await import('../../services/dataService');
    
    agendaService.getActiveAgendaItems.mockResolvedValue({
      success: true,
      data: mockSessions,
      error: null
    });

    getCurrentAttendeeData.mockResolvedValue(mockAttendee);
    getAttendeeSeatAssignments.mockResolvedValue([]);

    // Mock TimeService to return real time by default
    vi.mocked(TimeService.getCurrentTime).mockReturnValue(new Date());
    vi.mocked(TimeService.isOverrideActive).mockReturnValue(false);
    vi.mocked(TimeService.getOverrideTime).mockReturnValue(null);

    // Mock localStorage with actual storage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => mockStorage[key] || null),
        setItem: vi.fn((key, value) => { mockStorage[key] = value; }),
        removeItem: vi.fn((key) => { delete mockStorage[key]; })
      },
      writable: true
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    global.localStorage = originalLocalStorage;
    vi.clearAllMocks();
  });

  describe('Session Detection with Time Override', () => {
    it('should detect current session when override time is during session', async () => {
      // Set override time to 9:05 AM (during first session)
      const overrideTime = new Date('2024-12-19T09:05:00');
      
      // Mock TimeService to return override time
      vi.mocked(TimeService.getCurrentTime).mockReturnValue(overrideTime);
      vi.mocked(TimeService.isOverrideActive).mockReturnValue(true);
      vi.mocked(TimeService.getOverrideTime).mockReturnValue(overrideTime);

      const { result } = renderHook(() => useSessionData(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentSession).toEqual(mockSessions[0]);
      expect(result.current.nextSession).toEqual(mockSessions[1]);
    });

    it('should detect no current session when override time is between sessions', async () => {
      // Set override time to 9:45 AM (between sessions)
      const overrideTime = new Date('2024-12-19T09:45:00');
      
      // Mock TimeService to return override time
      vi.mocked(TimeService.getCurrentTime).mockReturnValue(overrideTime);
      vi.mocked(TimeService.isOverrideActive).mockReturnValue(true);
      vi.mocked(TimeService.getOverrideTime).mockReturnValue(overrideTime);

      const { result } = renderHook(() => useSessionData(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentSession).toBeNull();
      expect(result.current.nextSession).toEqual(mockSessions[2]);
    });

    it('should detect next session when override time is before first session', async () => {
      // Set override time to 8:30 AM (before first session)
      const overrideTime = new Date('2024-12-19T08:30:00');
      
      // Mock TimeService to return override time
      vi.mocked(TimeService.getCurrentTime).mockReturnValue(overrideTime);
      vi.mocked(TimeService.isOverrideActive).mockReturnValue(true);
      vi.mocked(TimeService.getOverrideTime).mockReturnValue(overrideTime);

      const { result } = renderHook(() => useSessionData(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentSession).toBeNull();
      expect(result.current.nextSession).toEqual(mockSessions[0]);
    });

    it('should detect no sessions when override time is after last session', async () => {
      // Set override time to 12:00 PM (after last session)
      const overrideTime = new Date('2024-12-19T12:00:00');
      
      // Mock TimeService to return override time
      vi.mocked(TimeService.getCurrentTime).mockReturnValue(overrideTime);
      vi.mocked(TimeService.isOverrideActive).mockReturnValue(true);
      vi.mocked(TimeService.getOverrideTime).mockReturnValue(overrideTime);

      const { result } = renderHook(() => useSessionData(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentSession).toBeNull();
      expect(result.current.nextSession).toBeNull();
    });
  });

  describe('Session Boundary Edge Cases', () => {
    it('should handle override time at exact session start', async () => {
      // Set override time to exact start of first session
      const overrideTime = new Date('2024-12-19T09:00:00');
      
      // Mock TimeService to return override time
      vi.mocked(TimeService.getCurrentTime).mockReturnValue(overrideTime);
      vi.mocked(TimeService.isOverrideActive).mockReturnValue(true);
      vi.mocked(TimeService.getOverrideTime).mockReturnValue(overrideTime);

      const { result } = renderHook(() => useSessionData(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentSession).toEqual(mockSessions[0]);
    });

    it('should handle override time at exact session end', async () => {
      // Set override time to exact end of first session
      const overrideTime = new Date('2024-12-19T09:30:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      const { result } = renderHook(() => useSessionData(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // At exact end time, should not be current session
      expect(result.current.currentSession).toBeNull();
      expect(result.current.nextSession).toEqual(mockSessions[1]);
    });

    it('should handle back-to-back sessions correctly', async () => {
      // Set override time at the boundary between sessions 1 and 2
      const overrideTime = new Date('2024-12-19T09:30:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      const { result } = renderHook(() => useSessionData(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentSession).toBeNull();
      expect(result.current.nextSession).toEqual(mockSessions[1]);
    });
  });

  describe('Data Refresh with Time Override', () => {
    it('should maintain override time during data refresh', async () => {
      const overrideTime = new Date('2024-12-19T09:05:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      const { result } = renderHook(() => useSessionData(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentSession).toEqual(mockSessions[0]);

      // Trigger refresh
      await act(async () => {
        result.current.refresh();
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should still use override time
      expect(result.current.currentSession).toEqual(mockSessions[0]);
    });

    it('should update session state when override time changes', async () => {
      // Start with override during first session
      let overrideTime = new Date('2024-12-19T09:05:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      const { result, rerender } = renderHook(() => useSessionData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentSession).toEqual(mockSessions[0]);

      // Change override to between sessions
      overrideTime = new Date('2024-12-19T09:45:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      // Re-render to simulate time change
      rerender();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentSession).toBeNull();
      expect(result.current.nextSession).toEqual(mockSessions[2]);
    });
  });

  describe('Attendee Filtering with Time Override', () => {
    it('should filter breakout sessions correctly with time override', async () => {
      const sessionsWithBreakout = [
        ...mockSessions,
        {
          id: '4',
          title: 'Breakout Session',
          start_time: '11:00:00',
          end_time: '12:00:00',
          date: '2024-12-19',
          location: 'Room B',
          type: 'breakout-session'
        }
      ];

      const attendeeWithBreakout = {
        ...mockAttendee,
        selected_breakouts: ['4']
      };

      const { agendaService } = await import('../../services/agendaService');
      const dataService = await import('../../services/dataService');
      
      vi.mocked(agendaService.getActiveAgendaItems).mockResolvedValue({
        success: true,
        data: sessionsWithBreakout
      });

      vi.mocked(dataService.getCurrentAttendeeData).mockResolvedValue(attendeeWithBreakout);

      // Set override time during breakout session
      const overrideTime = new Date('2024-12-19T11:30:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      const { result } = renderHook(() => useSessionData(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should include the breakout session in filtered sessions
      expect(result.current.sessions).toContainEqual(sessionsWithBreakout[3]);
      expect(result.current.currentSession).toEqual(sessionsWithBreakout[3]);
    });

    it('should exclude unassigned breakout sessions with time override', async () => {
      const sessionsWithBreakout = [
        ...mockSessions,
        {
          id: '4',
          title: 'Breakout Session',
          start_time: '11:00:00',
          end_time: '12:00:00',
          date: '2024-12-19',
          location: 'Room B',
          type: 'breakout-session'
        }
      ];

      // Attendee not assigned to breakout session
      const { agendaService } = await import('../../services/agendaService');
      vi.mocked(agendaService.getActiveAgendaItems).mockResolvedValue({
        success: true,
        data: sessionsWithBreakout
      });

      // Set override time during breakout session
      const overrideTime = new Date('2024-12-19T11:30:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      const { result } = renderHook(() => useSessionData(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should not include the breakout session in filtered sessions
      expect(result.current.sessions).not.toContainEqual(sessionsWithBreakout[3]);
      expect(result.current.currentSession).toBeNull();
    });
  });

  describe('Error Handling with Time Override', () => {
    it('should handle invalid override time gracefully', async () => {
      global.localStorage.getItem.mockReturnValue('invalid-date');

      const { result } = renderHook(() => useSessionData(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should not throw error and should use real time
      expect(result.current.sessions).toEqual(mockSessions);
    });

    it('should handle localStorage errors with time override', async () => {
      global.localStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const { result } = renderHook(() => useSessionData(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should not throw error and should use real time
      expect(result.current.sessions).toEqual(mockSessions);
    });
  });

  describe('Performance with Time Override', () => {
    it('should not cause unnecessary re-renders with static override time', async () => {
      const overrideTime = new Date('2024-12-19T09:05:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;
        return useSessionData();
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const initialRenderCount = renderCount;

      // Wait a bit more
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should not have additional renders due to static override time
      expect(renderCount).toBe(initialRenderCount);
    });
  });
});
