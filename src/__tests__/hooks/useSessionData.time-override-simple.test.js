/**
 * useSessionData Hook Time Override Simple Tests
 * Simplified tests for session data logic with time override functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionData } from '../../hooks/useSessionData';

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

describe('useSessionData Hook - Time Override Simple Tests', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalLocalStorage = global.localStorage;

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
    }
  ];

  const mockAttendee = {
    id: '1',
    name: 'Test User',
    selected_breakouts: []
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
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
    const dataService = await import('../../services/dataService');
    
    vi.mocked(agendaService.getActiveAgendaItems).mockResolvedValue({
      success: true,
      data: mockSessions
    });

    vi.mocked(dataService.getCurrentAttendeeData).mockResolvedValue(mockAttendee);
    vi.mocked(dataService.getAttendeeSeatAssignments).mockResolvedValue([]);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    global.localStorage = originalLocalStorage;
    vi.clearAllMocks();
  });

  describe('Basic Time Override Functionality', () => {
    it('should load session data successfully', async () => {
      const { result } = renderHook(() => useSessionData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.sessions).toEqual(mockSessions);
      expect(result.current.attendee).toEqual(mockAttendee);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle time override in development environment', async () => {
      // Set override time to 9:05 AM (during first session)
      const overrideTime = new Date('2024-12-19T09:05:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      const { result } = renderHook(() => useSessionData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should detect current session based on override time
      expect(result.current.currentSession).toEqual(mockSessions[0]);
      expect(result.current.nextSession).toEqual(mockSessions[1]);
    });

    it('should handle no override time', async () => {
      global.localStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useSessionData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should use real time for session detection
      expect(result.current.sessions).toEqual(mockSessions);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const { agendaService } = await import('../../services/agendaService');
      
      vi.mocked(agendaService.getActiveAgendaItems).mockRejectedValue(
        new Error('Service error')
      );

      const { result } = renderHook(() => useSessionData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.error).toBe('Service error');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle localStorage errors gracefully', async () => {
      global.localStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const { result } = renderHook(() => useSessionData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should not throw error and should use real time
      expect(result.current.sessions).toEqual(mockSessions);
    });
  });
});
