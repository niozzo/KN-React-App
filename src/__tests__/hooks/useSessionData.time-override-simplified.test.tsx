/**
 * useSessionData Hook Time Override Integration Tests - Simplified
 * Tests for session data logic with time override functionality using dependency injection
 * 
 * This version uses the new service factory pattern to eliminate complex mocking dependencies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionData, injectServices, resetServices } from '../../hooks/useSessionData-simple';
import { AuthProvider } from '../../contexts/AuthContext';
import { createMockAgendaService, createMockDataService, createMockTimeService } from '../utils/service-factory';

describe('useSessionData Hook - Time Override Integration (Simplified)', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalLocalStorage = global.localStorage;

  // No wrapper needed for simple version

  const mockSessions = [
    {
      id: '1',
      title: 'Opening Remarks & Apax CEO Welcome',
      date: '2024-12-19',
      start_time: '09:00:00',
      end_time: '09:30:00',
      location: 'The Grand Ballroom, 8th Floor',
      type: 'keynote'
    },
    {
      id: '2',
      title: 'Coffee Break',
      date: '2024-12-19',
      start_time: '09:30:00',
      end_time: '09:45:00',
      location: 'Lobby',
      type: 'coffee_break'
    },
    {
      id: '3',
      title: 'Next Session',
      date: '2024-12-19',
      start_time: '10:00:00',
      end_time: '11:00:00',
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
  let agendaService, dataService, timeService;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Clear mock storage between tests
    mockStorage = {};
    
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, value) => { mockStorage[key] = value; }),
      removeItem: vi.fn((key) => { delete mockStorage[key]; }),
      clear: vi.fn(() => { mockStorage = {}; }),
      length: 0,
      key: vi.fn()
    };

    // Set development environment
    process.env.NODE_ENV = 'development';

    // Create mock services using dependency injection
    agendaService = createMockAgendaService();
    dataService = createMockDataService();
    timeService = createMockTimeService();
    
    // Setup mock implementations
    agendaService.getActiveAgendaItems = vi.fn().mockResolvedValue({
      success: true,
      data: mockSessions,
      error: null
    });

    dataService.getCurrentAttendeeData = vi.fn().mockResolvedValue(mockAttendee);
    dataService.getAttendeeSeatAssignments = vi.fn().mockResolvedValue([]);

    timeService.getCurrentTime = vi.fn().mockReturnValue(new Date());
    timeService.isOverrideActive = vi.fn().mockReturnValue(false);
    timeService.getOverrideTime = vi.fn().mockReturnValue(null);

    // Inject services using dependency injection
    injectServices({
      agendaService,
      dataService,
      timeService
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    global.localStorage = originalLocalStorage;
    resetServices();
  });

  describe('Session Detection with Time Override', () => {
    it('should detect current session when override time is during session', async () => {
      // Setup time override during first session
      const overrideTime = new Date('2024-12-19T09:15:00');
      
      // Update the injected time service behavior
      timeService.getCurrentTime = vi.fn().mockReturnValue(overrideTime);
      timeService.isOverrideActive = vi.fn().mockReturnValue(true);
      timeService.getOverrideTime = vi.fn().mockReturnValue(overrideTime);

      const { result } = renderHook(() => useSessionData({ id: 'test-user' }));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentSession).toEqual(mockSessions[0]);
      expect(result.current.nextSession).toEqual(mockSessions[1]);
    });

    it('should detect no current session when override time is between sessions', async () => {
      // Setup time override between sessions (09:45:00-10:00:00 gap)
      const overrideTime = new Date('2024-12-19T09:50:00');
      
      timeService.getCurrentTime = vi.fn().mockReturnValue(overrideTime);
      timeService.isOverrideActive = vi.fn().mockReturnValue(true);
      timeService.getOverrideTime = vi.fn().mockReturnValue(overrideTime);

      const { result } = renderHook(() => useSessionData({ id: 'test-user' }));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentSession).toBeNull();
      expect(result.current.nextSession).toEqual(mockSessions[2]);
    });

    it('should detect next session when override time is before first session', async () => {
      // Setup time override before first session
      const overrideTime = new Date('2024-12-19T08:30:00');
      
      timeService.getCurrentTime = vi.fn().mockReturnValue(overrideTime);
      timeService.isOverrideActive = vi.fn().mockReturnValue(true);
      timeService.getOverrideTime = vi.fn().mockReturnValue(overrideTime);

      const { result } = renderHook(() => useSessionData({ id: 'test-user' }));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentSession).toBeNull();
      expect(result.current.nextSession).toEqual(mockSessions[0]);
    });

    it('should detect no sessions when override time is after last session', async () => {
      // Setup time override after last session
      const overrideTime = new Date('2024-12-19T12:00:00');
      
      timeService.getCurrentTime = vi.fn().mockReturnValue(overrideTime);
      timeService.isOverrideActive = vi.fn().mockReturnValue(true);
      timeService.getOverrideTime = vi.fn().mockReturnValue(overrideTime);

      const { result } = renderHook(() => useSessionData({ id: 'test-user' }));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentSession).toBeNull();
      expect(result.current.nextSession).toBeNull();
    });
  });

  describe('Session Boundary Edge Cases', () => {
    it('should handle override time at exact session start', async () => {
      // Setup time override at exact session start
      const overrideTime = new Date('2024-12-19T09:00:00');
      
      timeService.getCurrentTime = vi.fn().mockReturnValue(overrideTime);
      timeService.isOverrideActive = vi.fn().mockReturnValue(true);
      timeService.getOverrideTime = vi.fn().mockReturnValue(overrideTime);

      const { result } = renderHook(() => useSessionData({ id: 'test-user' }));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentSession).toEqual(mockSessions[0]);
    });

    it('should handle override time at exact session end', async () => {
      // Setup time override at exact session end (coffee break ends at 09:45:00)
      const overrideTime = new Date('2024-12-19T09:45:00');
      
      timeService.getCurrentTime = vi.fn().mockReturnValue(overrideTime);
      timeService.isOverrideActive = vi.fn().mockReturnValue(true);
      timeService.getOverrideTime = vi.fn().mockReturnValue(overrideTime);

      const { result } = renderHook(() => useSessionData({ id: 'test-user' }));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentSession).toBeNull();
      expect(result.current.nextSession).toEqual(mockSessions[2]);
    });
  });
});
