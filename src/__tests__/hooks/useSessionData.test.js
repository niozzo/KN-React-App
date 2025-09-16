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

    it('should filter sessions for attendee selections', async () => {
      const attendeeWithSelections = {
        ...mockAttendee,
        selected_agenda_items: [{ id: '1' }, { id: '3' }] // Only sessions 1 and 3
      };
      
      const { getCurrentAttendeeData, getAttendeeSeatAssignments } = await import('../../services/dataService');
      getCurrentAttendeeData.mockResolvedValue(attendeeWithSelections);
      getAttendeeSeatAssignments.mockResolvedValue([]);
      
      const { result } = renderHook(() => useSessionData());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.sessions).toHaveLength(2);
      expect(result.current.sessions.map(s => s.id)).toEqual(['1', '3']);
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
});
