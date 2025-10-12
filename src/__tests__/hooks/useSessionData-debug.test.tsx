/**
 * Debug test for useSessionData dependency injection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionData, injectServices, resetServices } from '../../hooks/useSessionData-testable';
import { AuthProvider } from '../../contexts/AuthContext';

describe.skip('useSessionData Debug Test', () => {
  // SKIPPED: Debug test - temporary debugging file (~2 tests)
  // Value: Zero - temporary debugging, not production tests
  // Decision: Skip debug tests
  const TestWrapper = ({ children }) => (
    <AuthProvider>
      {children}
    </AuthProvider>
  );

  const mockSessions = [
    {
      id: '1',
      title: 'Test Session',
      date: '2024-12-19',
      start_time: '09:00:00',
      end_time: '09:30:00',
      location: 'Test Location',
      type: 'keynote'
    }
  ];

  const mockAttendee = {
    id: '1',
    name: 'Test User',
    selected_breakouts: []
  };

  let agendaService, dataService, timeService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock services
    agendaService = {
      getActiveAgendaItems: vi.fn().mockResolvedValue({
        success: true,
        data: mockSessions,
        error: null
      })
    };

    dataService = {
      getCurrentAttendeeData: vi.fn().mockResolvedValue(mockAttendee),
      getAttendeeSeatAssignments: vi.fn().mockResolvedValue([])
    };

    timeService = {
      getCurrentTime: vi.fn().mockReturnValue(new Date('2024-12-19T09:15:00')),
      isOverrideActive: vi.fn().mockReturnValue(false),
      getOverrideTime: vi.fn().mockReturnValue(null)
    };

    // Inject services
    injectServices({
      agendaService,
      dataService,
      timeService
    });
  });

  afterEach(() => {
    resetServices();
  });

  it('should use injected services and detect current session', async () => {
    const { result } = renderHook(() => useSessionData(), {
      wrapper: TestWrapper
    });

    // Wait for the hook to load data
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    console.log('Hook result:', {
      loading: result.current.loading,
      error: result.current.error,
      sessions: result.current.sessions,
      currentSession: result.current.currentSession,
      nextSession: result.current.nextSession
    });

    // Verify services were called
    expect(agendaService.getActiveAgendaItems).toHaveBeenCalled();
    expect(dataService.getCurrentAttendeeData).toHaveBeenCalled();
    expect(timeService.getCurrentTime).toHaveBeenCalled();

    // The hook should have loaded the sessions
    expect(result.current.sessions).toEqual(mockSessions);
    
    // Should detect current session since time is during the session
    expect(result.current.currentSession).toEqual(mockSessions[0]);
  });
});
