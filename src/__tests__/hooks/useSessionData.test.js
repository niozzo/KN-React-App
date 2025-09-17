/**
 * useSessionData Hook Tests
 * Story 2.1: Now/Next Glance Card - Task 9 (TDD)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useSessionData from '../../hooks/useSessionData';

// Mock services
vi.mock('../../services/agendaService', () => ({
  agendaService: {
    getActiveAgendaItems: vi.fn()
  }
}));

vi.mock('../../services/dataService', () => ({
  getCurrentAttendeeData: vi.fn(),
  getAttendeeSeatAssignments: vi.fn()
}));

vi.mock('../../services/timeService', () => ({
  default: {
    getCurrentTime: vi.fn(() => new Date('2024-01-15T10:00:00')),
    registerSessionBoundaries: vi.fn(),
    isOverrideActive: vi.fn(() => false)
  }
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true
  }))
}));

// Mock TimeService for the new tests
const TimeService = {
  getCurrentTime: vi.fn(() => new Date('2024-01-15T10:00:00')),
  registerSessionBoundaries: vi.fn(),
  isOverrideActive: vi.fn(() => false)
};

describe('useSessionData Hook', () => {
  const mockSessions = [
    {
      id: '1',
      title: 'Opening Keynote',
      date: '2024-12-19',
      start_time: '09:00:00',
      end_time: '10:00:00',
      location: 'Main Hall',
      speaker: 'John Doe',
      type: 'keynote'
    },
    {
      id: '2',
      title: 'Coffee Break',
      date: '2024-12-19',
      start_time: '10:00:00',
      end_time: '10:30:00',
      location: 'Lobby',
      type: 'coffee_break'
    },
    {
      id: '3',
      title: 'Panel Discussion',
      date: '2024-12-19',
      start_time: '10:30:00',
      end_time: '11:30:00',
      location: 'Room A',
      speaker: 'Jane Smith',
      type: 'panel'
    }
  ];

  const mockAttendee = {
    id: 'attendee-1',
    name: 'Test User',
    selected_agenda_items: [
      { id: '1' },
      { id: '2' },
      { id: '3' }
    ]
  };

  let mockStorage = {};

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Clear mock storage between tests
    mockStorage = {};
    
    // Mock successful API responses
    const { agendaService } = await import('../../services/agendaService');
    const { getCurrentAttendeeData, getAttendeeSeatAssignments } = await import('../../services/dataService');
    
    agendaService.getActiveAgendaItems.mockResolvedValue({
      success: true,
      data: mockSessions,
      error: null
    });
    
    getCurrentAttendeeData.mockResolvedValue(mockAttendee);
    getAttendeeSeatAssignments.mockResolvedValue([]);
    
    // Mock localStorage with actual storage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => mockStorage[key] || null),
        setItem: vi.fn((key, value) => { mockStorage[key] = value; }),
        removeItem: vi.fn((key) => { delete mockStorage[key]; })
      },
      writable: true
    });
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Data Loading', () => {
    it('should load session data successfully', async () => {
      const { result } = renderHook(() => useSessionData());
      
      // Wait for async operations
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.sessions).toEqual(mockSessions);
      expect(result.current.attendee).toEqual(mockAttendee);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle API errors gracefully', async () => {
      const { agendaService } = await import('../../services/agendaService');
      const { getCurrentAttendeeData, getAttendeeSeatAssignments } = await import('../../services/dataService');
      
      agendaService.getActiveAgendaItems.mockResolvedValue({
        success: false,
        data: [],
        error: 'API Error'
      });
      
      getCurrentAttendeeData.mockResolvedValue(mockAttendee);
      getAttendeeSeatAssignments.mockResolvedValue([]);
      
      const { result } = renderHook(() => useSessionData());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.error).toBe('API Error');
      expect(result.current.sessions).toEqual([]);
    });

    it('should show all general sessions and only assigned breakout sessions', async () => {
      const attendeeWithBreakoutSelections = {
        ...mockAttendee,
        selected_breakouts: ['breakout-1'] // Only assigned to one breakout session
      };
      
      const { getCurrentAttendeeData, getAttendeeSeatAssignments } = await import('../../services/dataService');
      getCurrentAttendeeData.mockResolvedValue(attendeeWithBreakoutSelections);
      getAttendeeSeatAssignments.mockResolvedValue([]);
      
      const { result } = renderHook(() => useSessionData());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Should show all 3 general sessions (keynote, coffee_break, panel) since none are breakout-session type
      expect(result.current.sessions).toHaveLength(3);
      expect(result.current.sessions.map(s => s.id)).toEqual(['1', '2', '3']);
    });

    it('should hide all breakout sessions (simplified logic)', async () => {
      // Create mock sessions with breakout sessions
      const sessionsWithBreakouts = [
        ...mockSessions,
        {
          id: 'breakout-1',
          title: 'Breakout Session A',
          date: '2024-12-19',
          start_time: '14:00:00',
          end_time: '15:00:00',
          location: 'Room B',
          session_type: 'breakout-session'
        },
        {
          id: 'breakout-2',
          title: 'Breakout Session B',
          date: '2024-12-19',
          start_time: '14:00:00',
          end_time: '15:00:00',
          location: 'Room C',
          session_type: 'breakout-session'
        }
      ];

      const attendeeWithBreakoutSelections = {
        ...mockAttendee,
        selected_breakouts: ['breakout-1'] // Even with assignments, breakout sessions should be hidden
      };

      // Mock agendaService to return sessions with breakouts
      const { agendaService } = await import('../../services/agendaService');
      agendaService.getActiveAgendaItems.mockResolvedValue({
        success: true,
        data: sessionsWithBreakouts
      });

      const { getCurrentAttendeeData, getAttendeeSeatAssignments } = await import('../../services/dataService');
      getCurrentAttendeeData.mockResolvedValue(attendeeWithBreakoutSelections);
      getAttendeeSeatAssignments.mockResolvedValue([]);
      
      const { result } = renderHook(() => useSessionData());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Should show only 3 general sessions - all breakout sessions are hidden
      expect(result.current.sessions).toHaveLength(3);
      expect(result.current.sessions.map(s => s.id)).toEqual(['1', '2', '3']);
      // Verify no breakout sessions are included
      expect(result.current.sessions.filter(s => s.session_type === 'breakout-session')).toHaveLength(0);
    });

    it('should show all non-breakout session types to all users', async () => {
      // Create mock sessions with various session types
      const sessionsWithVariousTypes = [
        {
          id: 'keynote-1',
          title: 'Opening Keynote',
          date: '2024-12-19',
          start_time: '09:00:00',
          end_time: '10:00:00',
          location: 'Main Hall',
          session_type: 'keynote'
        },
        {
          id: 'exec-1',
          title: 'Executive Presentation',
          date: '2024-12-19',
          start_time: '10:30:00',
          end_time: '11:30:00',
          location: 'Main Hall',
          session_type: 'executive-presentation'
        },
        {
          id: 'panel-1',
          title: 'Panel Discussion',
          date: '2024-12-19',
          start_time: '14:00:00',
          end_time: '15:00:00',
          location: 'Main Hall',
          session_type: 'panel-discussion'
        },
        {
          id: 'meal-1',
          title: 'Lunch',
          date: '2024-12-19',
          start_time: '12:00:00',
          end_time: '13:00:00',
          location: 'Dining Hall',
          session_type: 'meal'
        },
        {
          id: 'reception-1',
          title: 'Welcome Reception',
          date: '2024-12-19',
          start_time: '18:00:00',
          end_time: '20:00:00',
          location: 'Lobby',
          session_type: 'reception'
        },
        {
          id: 'networking-1',
          title: 'Networking Session',
          date: '2024-12-19',
          start_time: '15:30:00',
          end_time: '16:30:00',
          location: 'Lobby',
          session_type: 'networking'
        },
        {
          id: 'breakout-1',
          title: 'Breakout Session',
          date: '2024-12-19',
          start_time: '16:00:00',
          end_time: '17:00:00',
          location: 'Room A',
          session_type: 'breakout-session'
        }
      ];

      // Mock agendaService to return sessions with various types
      const { agendaService } = await import('../../services/agendaService');
      agendaService.getActiveAgendaItems.mockResolvedValue({
        success: true,
        data: sessionsWithVariousTypes
      });

      const { getCurrentAttendeeData, getAttendeeSeatAssignments } = await import('../../services/dataService');
      getCurrentAttendeeData.mockResolvedValue(mockAttendee);
      getAttendeeSeatAssignments.mockResolvedValue([]);
      
      const { result } = renderHook(() => useSessionData());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Should show all 6 non-breakout sessions
      expect(result.current.sessions).toHaveLength(6);
      
      // Verify all non-breakout session types are included
      const sessionTypes = result.current.sessions.map(s => s.session_type);
      expect(sessionTypes).toContain('keynote');
      expect(sessionTypes).toContain('executive-presentation');
      expect(sessionTypes).toContain('panel-discussion');
      expect(sessionTypes).toContain('meal');
      expect(sessionTypes).toContain('reception');
      expect(sessionTypes).toContain('networking');
      
      // Verify no breakout sessions are included
      expect(sessionTypes).not.toContain('breakout-session');
    });
  });

  describe('Current/Next Session Detection', () => {
    it('should detect current session correctly', async () => {
      // Mock current time to be during the first session
      const mockCurrentTime = new Date('2024-12-19T09:30:00');
      vi.setSystemTime(mockCurrentTime);
      
      const { result } = renderHook(() => useSessionData());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.currentSession?.id).toBe('1');
      expect(result.current.nextSession?.id).toBe('2');
    });

    it('should handle no current session', async () => {
      // Mock current time to be before all sessions
      const mockCurrentTime = new Date('2024-12-19T08:00:00');
      vi.setSystemTime(mockCurrentTime);
      
      const { result } = renderHook(() => useSessionData());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.currentSession).toBe(null);
      expect(result.current.nextSession?.id).toBe('1');
    });

    it('should handle no upcoming sessions', async () => {
      // Mock current time to be after all sessions
      const mockCurrentTime = new Date('2024-12-19T12:00:00');
      vi.setSystemTime(mockCurrentTime);
      
      const { result } = renderHook(() => useSessionData());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.currentSession).toBe(null);
      expect(result.current.nextSession).toBe(null);
    });
  });

  describe('Offline Support', () => {
    it('should load cached data when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      // Mock cached data
      const cachedData = {
        sessions: mockSessions,
        currentSession: mockSessions[0],
        nextSession: mockSessions[1],
        lastUpdated: new Date().toISOString()
      };
      
      window.localStorage.getItem.mockReturnValue(JSON.stringify(cachedData));
      
      // Mock API failure
      const { agendaService } = await import('../../services/agendaService');
      agendaService.getActiveAgendaItems.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useSessionData());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.isOffline).toBe(true);
      expect(result.current.sessions).toEqual(mockSessions);
      expect(result.current.currentSession).toEqual(mockSessions[0]);
      expect(result.current.nextSession).toEqual(mockSessions[1]);
    });

    it('should cache data for offline use', async () => {
      const { result } = renderHook(() => useSessionData());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'kn_cached_sessions',
        expect.stringContaining('"sessions"')
      );
    });
  });

  describe('Auto-refresh', () => {
    it('should refresh data when coming online', async () => {
      const { result } = renderHook(() => useSessionData());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Simulate going offline then online
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
      
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.isOffline).toBe(false);
    });
  });

  describe('Manual Refresh', () => {
    it('should allow manual refresh', async () => {
      const { result } = renderHook(() => useSessionData());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      const initialLastUpdated = result.current.lastUpdated;
      
      // Wait a bit to ensure different timestamp
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      // Manual refresh
      act(() => {
        result.current.refresh();
      });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      expect(result.current.lastUpdated).not.toEqual(initialLastUpdated);
    });
  });

  describe('Time Override Support', () => {
    it('should use override time for session detection', async () => {
      // Mock dev environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Set override time
      const overrideTime = new Date('2024-12-19T09:30:00');
      localStorage.setItem('kn_time_override', overrideTime.toISOString());
      
      const { result } = renderHook(() => useSessionData());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });
      
      // Should detect current session based on override time
      expect(result.current.currentSession?.id).toBe('1');
      
      // Cleanup
      localStorage.removeItem('kn_time_override');
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Real-time Update State Preservation', () => {
    beforeEach(() => {
      // Mock console methods to track logging
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should preserve current session when no active sessions found', async () => {
      // Setup: Mock sessions that will not be active at current time
      const pastSessions = [
        {
          id: '1',
          title: 'Past Session',
          date: '2024-01-15',
          start_time: '08:00:00',
          end_time: '09:00:00',
          type: 'keynote'
        }
      ];

      const { agendaService } = await import('../../services/agendaService');
      agendaService.getActiveAgendaItems.mockResolvedValue({
        success: true,
        data: pastSessions,
        error: null
      });

      // Mock current time to be after the session
      const currentTime = new Date('2024-01-15T10:00:00');
      TimeService.getCurrentTime.mockReturnValue(currentTime);

      const { result } = renderHook(() => useSessionData());

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should have no current session initially
      expect(result.current.currentSession).toBe(null);
      expect(result.current.nextSession).toBe(null);

      // Simulate real-time update (no active sessions found)
      await act(async () => {
        // Trigger real-time update by advancing time
        const newTime = new Date('2024-01-15T11:00:00');
        TimeService.getCurrentTime.mockReturnValue(newTime);
        
        // Wait for real-time update interval
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      // Should preserve null state (not clear existing state)
      expect(result.current.currentSession).toBe(null);
      expect(result.current.nextSession).toBe(null);
    });

    it('should preserve next session when no upcoming sessions found', async () => {
      // Setup: Mock sessions that are all in the past
      const pastSessions = [
        {
          id: '1',
          title: 'Past Session 1',
          date: '2024-01-15',
          start_time: '08:00:00',
          end_time: '09:00:00',
          type: 'keynote'
        },
        {
          id: '2',
          title: 'Past Session 2',
          date: '2024-01-15',
          start_time: '09:00:00',
          end_time: '10:00:00',
          type: 'panel'
        }
      ];

      const { agendaService } = await import('../../services/agendaService');
      agendaService.getActiveAgendaItems.mockResolvedValue({
        success: true,
        data: pastSessions,
        error: null
      });

      // Mock current time to be after all sessions
      const currentTime = new Date('2024-01-15T11:00:00');
      TimeService.getCurrentTime.mockReturnValue(currentTime);

      const { result } = renderHook(() => useSessionData());

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should have no sessions initially
      expect(result.current.currentSession).toBe(null);
      expect(result.current.nextSession).toBe(null);

      // Simulate real-time update (no upcoming sessions found)
      await act(async () => {
        // Trigger real-time update by advancing time
        const newTime = new Date('2024-01-15T12:00:00');
        TimeService.getCurrentTime.mockReturnValue(newTime);
        
        // Wait for real-time update interval
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      // Should preserve null state (not clear existing state)
      expect(result.current.currentSession).toBe(null);
      expect(result.current.nextSession).toBe(null);
    });

    it('should update sessions when new ones are found', async () => {
      // Setup: Mock sessions with one active and one upcoming
      const sessions = [
        {
          id: '1',
          title: 'Current Session',
          date: '2024-01-15',
          start_time: '09:00:00',
          end_time: '10:00:00',
          type: 'keynote'
        },
        {
          id: '2',
          title: 'Next Session',
          date: '2024-01-15',
          start_time: '10:00:00',
          end_time: '11:00:00',
          type: 'panel'
        }
      ];

      const { agendaService } = await import('../../services/agendaService');
      agendaService.getActiveAgendaItems.mockResolvedValue({
        success: true,
        data: sessions,
        error: null
      });

      // Mock current time to be during first session
      const currentTime = new Date('2024-01-15T09:30:00');
      TimeService.getCurrentTime.mockReturnValue(currentTime);

      const { result } = renderHook(() => useSessionData());

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should have current and next sessions
      expect(result.current.currentSession?.id).toBe('1');
      expect(result.current.nextSession?.id).toBe('2');

      // Simulate real-time update (session transition)
      await act(async () => {
        // Advance time to next session
        const newTime = new Date('2024-01-15T10:30:00');
        TimeService.getCurrentTime.mockReturnValue(newTime);
        
        // Wait for real-time update interval
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      // Should update to new current session
      expect(result.current.currentSession?.id).toBe('2');
      expect(result.current.nextSession).toBe(null);
    });

    it('should not clear sessions when real-time update finds no active sessions', async () => {
      // Setup: Mock sessions that will become inactive
      const sessions = [
        {
          id: '1',
          title: 'Temporary Session',
          date: '2024-01-15',
          start_time: '09:00:00',
          end_time: '10:00:00',
          type: 'keynote'
        }
      ];

      const { agendaService } = await import('../../services/agendaService');
      agendaService.getActiveAgendaItems.mockResolvedValue({
        success: true,
        data: sessions,
        error: null
      });

      // Mock current time to be during session
      const currentTime = new Date('2024-01-15T09:30:00');
      TimeService.getCurrentTime.mockReturnValue(currentTime);

      const { result } = renderHook(() => useSessionData());

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should have current session
      expect(result.current.currentSession?.id).toBe('1');

      // Simulate real-time update (session ended)
      await act(async () => {
        // Advance time past session end
        const newTime = new Date('2024-01-15T10:30:00');
        TimeService.getCurrentTime.mockReturnValue(newTime);
        
        // Wait for real-time update interval
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      // Should preserve the session state (not clear it)
      // This is the key behavior that prevents the UI flash
      expect(result.current.currentSession?.id).toBe('1');
    });
  });
});
