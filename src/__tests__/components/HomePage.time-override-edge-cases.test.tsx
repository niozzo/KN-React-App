/**
 * HomePage Time Override Edge Cases Tests
 * Tests for time override functionality edge cases identified in bug analysis
 * 
 * Edge Cases Covered:
 * 1. NOW/NEXT state when override time is during first event
 * 2. Time display not updating when override is active
 * 3. Session boundary edge cases with time override
 * 4. Override state transitions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../../pages/HomePage';
import TimeService from '../../services/timeService';

// Mock serverDataSyncService
vi.mock('../../services/serverDataSyncService', () => ({
  serverDataSyncService: {
    syncAllData: vi.fn(),
    getCachedTableData: vi.fn(),
    clearCache: vi.fn()
  }
}));

// Mock pwaDataSyncService to prevent import errors
vi.mock('../../services/pwaDataSyncService', () => ({
  pwaDataSyncService: {
    getCachedTableData: vi.fn(),
    cacheTableData: vi.fn(),
    syncAllData: vi.fn()
  }
}));

// Mock applicationDatabaseService to prevent import errors
vi.mock('../../services/applicationDatabaseService', () => ({
  applicationDatabaseService: {
    getSpeakerAssignments: vi.fn(),
    assignSpeaker: vi.fn(),
    removeSpeakerAssignment: vi.fn(),
    syncAgendaItemMetadata: vi.fn()
  },
  applicationDb: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

// Mock the useSessionData hook and its dependencies
vi.mock('../../hooks/useSessionData', () => ({
  default: vi.fn()
}));

// Mock the database types first to prevent import errors
vi.mock('../../types/database', () => ({
  AgendaItem: {},
  DatabaseResponse: {},
  PaginatedResponse: {},
  AgendaService: {}
}));

// Mock the services to prevent import errors
vi.mock('../../services/agendaService', () => ({
  agendaService: {
    getActiveAgendaItems: vi.fn(),
    getAgendaItems: vi.fn(),
    getAgendaItemById: vi.fn(),
    createAgendaItem: vi.fn(),
    updateAgendaItem: vi.fn(),
    deleteAgendaItem: vi.fn()
  }
}));

vi.mock('../../services/dataService', () => ({
  getCurrentAttendeeData: vi.fn(),
  getAttendeeSeatAssignments: vi.fn()
}));

// Mock TimeService to avoid import issues
vi.mock('../../services/timeService', () => ({
  default: {
    getCurrentTime: vi.fn(() => new Date()),
    isOverrideEnabled: vi.fn(() => true),
    getOverrideTime: vi.fn(() => null),
    setOverrideTime: vi.fn(),
    clearOverrideTime: vi.fn(),
    isOverrideActive: vi.fn(() => false),
    getOverrideStatus: vi.fn(() => ({
      isActive: false,
      overrideTime: null,
      realTime: new Date(),
      environment: 'development'
    }))
  }
}));

// Mock the AuthContext to prevent import errors
vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: { id: '1', name: 'Test User' },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn()
  })
}));

// Mock the TimeOverride component to test its behavior
vi.mock('../../components/dev/TimeOverride', () => ({
  default: ({ onTimeChange }) => (
    <div data-testid="time-override">
      <button 
        data-testid="set-override-btn"
        onClick={() => onTimeChange && onTimeChange(new Date('2024-12-19T09:05:00'))}
      >
        Set Override
      </button>
      <div data-testid="current-time-display">
        {TimeService.getCurrentTime().toLocaleString()}
      </div>
    </div>
  )
}));

const mockUseSessionData = require('../../hooks/useSessionData').default;

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('HomePage Time Override Edge Cases', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
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
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    global.localStorage = originalLocalStorage;
    vi.clearAllMocks();
  });

  describe('Edge Case 1: NOW/NEXT State During First Event', () => {
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
        title: 'Next Session',
        start_time: '10:00:00',
        end_time: '11:00:00',
        date: '2024-12-19',
        location: 'Room A',
        type: 'session'
      }
    ];

    it('should show NOW status when override time is during first event', async () => {
      // Set override time to 9:05 AM (during first event)
      const overrideTime = new Date('2024-12-19T09:05:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      mockUseSessionData.mockReturnValue({
        currentSession: mockSessions[0], // First session should be current
        nextSession: mockSessions[1],    // Second session should be next
        sessions: mockSessions,
        allSessions: mockSessions,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      // Should show the first session as current (NOW)
      expect(screen.getByText('Opening Remarks & Apax CEO Welcome')).toBeInTheDocument();
      expect(screen.getByText('NOW')).toBeInTheDocument();
      expect(screen.getByText('9:00 AM - 9:30 AM')).toBeInTheDocument();
    });

    it('should show NEXT status for upcoming session when override is during first event', async () => {
      const overrideTime = new Date('2024-12-19T09:05:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      mockUseSessionData.mockReturnValue({
        currentSession: mockSessions[0],
        nextSession: mockSessions[1],
        sessions: mockSessions,
        allSessions: mockSessions,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      // Should show the second session as next
      expect(screen.getByText('Next Session')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('10:00 AM - 11:00 AM')).toBeInTheDocument();
    });

    it('should handle edge case when override time is exactly at session start', async () => {
      const overrideTime = new Date('2024-12-19T09:00:00'); // Exactly at start
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      mockUseSessionData.mockReturnValue({
        currentSession: mockSessions[0],
        nextSession: mockSessions[1],
        sessions: mockSessions,
        allSessions: mockSessions,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText('NOW')).toBeInTheDocument();
    });

    it('should handle edge case when override time is exactly at session end', async () => {
      const overrideTime = new Date('2024-12-19T09:30:00'); // Exactly at end
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      mockUseSessionData.mockReturnValue({
        currentSession: null, // No current session at exact end time
        nextSession: mockSessions[1],
        sessions: mockSessions,
        allSessions: mockSessions,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText('Between Sessions')).toBeInTheDocument();
    });
  });

  describe('Edge Case 2: Time Display Not Updating When Override Active', () => {
    it('should display static override time when override is active', () => {
      const overrideTime = new Date('2024-12-19T09:05:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        sessions: [],
        allSessions: [],
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      // The time display should show the override time
      const timeDisplay = screen.getByTestId('current-time-display');
      expect(timeDisplay.textContent).toContain('12/19/2024, 9:05:00 AM');
    });

    it('should not update time display when override is active', async () => {
      const overrideTime = new Date('2024-12-19T09:05:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        sessions: [],
        allSessions: [],
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      const timeDisplay = screen.getByTestId('current-time-display');
      const initialTime = timeDisplay.textContent;

      // Wait a bit to see if time updates
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Time should remain the same (static override time)
      expect(timeDisplay.textContent).toBe(initialTime);
    });

    it('should update time display when override is cleared', async () => {
      // Start with override active
      const overrideTime = new Date('2024-12-19T09:05:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        sessions: [],
        allSessions: [],
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      const { rerender } = renderWithRouter(<HomePage />);

      // Clear override
      global.localStorage.getItem.mockReturnValue(null);

      // Re-render to simulate override being cleared
      rerender(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      // Time should now show real time (will be different from override)
      const timeDisplay = screen.getByTestId('current-time-display');
      expect(timeDisplay.textContent).not.toContain('12/19/2024, 9:05:00 AM');
    });
  });

  describe('Session Boundary Edge Cases', () => {
    const mockSessions = [
      {
        id: '1',
        title: 'Session 1',
        start_time: '09:00:00',
        end_time: '09:30:00',
        date: '2024-12-19',
        location: 'Room A',
        type: 'session'
      },
      {
        id: '2',
        title: 'Session 2',
        start_time: '09:30:00',
        end_time: '10:00:00',
        date: '2024-12-19',
        location: 'Room B',
        type: 'session'
      },
      {
        id: '3',
        title: 'Session 3',
        start_time: '10:00:00',
        end_time: '10:30:00',
        date: '2024-12-19',
        location: 'Room C',
        type: 'session'
      }
    ];

    it('should handle back-to-back sessions correctly', async () => {
      // Override time at the exact boundary between sessions
      const overrideTime = new Date('2024-12-19T09:30:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      mockUseSessionData.mockReturnValue({
        currentSession: null, // No current session at exact boundary
        nextSession: mockSessions[2], // Next session should be Session 3
        sessions: mockSessions,
        allSessions: mockSessions,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText('Between Sessions')).toBeInTheDocument();
    });

    it('should handle gap between sessions', async () => {
      // Override time in the gap between sessions
      const overrideTime = new Date('2024-12-19T09:45:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: mockSessions[2],
        sessions: mockSessions,
        allSessions: mockSessions,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText('Between Sessions')).toBeInTheDocument();
    });
  });

  describe('Override State Transitions', () => {
    it('should handle enabling time override', async () => {
      // Start without override
      global.localStorage.getItem.mockReturnValue(null);

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        sessions: [],
        allSessions: [],
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      // Enable override
      const overrideTime = new Date('2024-12-19T09:05:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      // Simulate override being set
      const setOverrideBtn = screen.getByTestId('set-override-btn');
      fireEvent.click(setOverrideBtn);

      // Time display should update to show override time
      await waitFor(() => {
        const timeDisplay = screen.getByTestId('current-time-display');
        expect(timeDisplay.textContent).toContain('12/19/2024, 9:05:00 AM');
      });
    });

    it('should handle disabling time override', async () => {
      // Start with override active
      const overrideTime = new Date('2024-12-19T09:05:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        sessions: [],
        allSessions: [],
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      const { rerender } = renderWithRouter(<HomePage />);

      // Disable override
      global.localStorage.getItem.mockReturnValue(null);

      // Re-render to simulate override being cleared
      rerender(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      // Time display should show real time
      const timeDisplay = screen.getByTestId('current-time-display');
      expect(timeDisplay.textContent).not.toContain('12/19/2024, 9:05:00 AM');
    });
  });

  describe('Integration with Session Data Updates', () => {
    it('should update session state when override time changes', async () => {
      const mockSessions = [
        {
          id: '1',
          title: 'Session 1',
          start_time: '09:00:00',
          end_time: '09:30:00',
          date: '2024-12-19',
          location: 'Room A',
          type: 'session'
        },
        {
          id: '2',
          title: 'Session 2',
          start_time: '10:00:00',
          end_time: '11:00:00',
          date: '2024-12-19',
          location: 'Room B',
          type: 'session'
        }
      ];

      // Start with override during first session
      const overrideTime1 = new Date('2024-12-19T09:15:00');
      global.localStorage.getItem.mockReturnValue(overrideTime1.toISOString());

      mockUseSessionData.mockReturnValue({
        currentSession: mockSessions[0],
        nextSession: mockSessions[1],
        sessions: mockSessions,
        allSessions: mockSessions,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      const { rerender } = renderWithRouter(<HomePage />);

      expect(screen.getByText('NOW')).toBeInTheDocument();

      // Change override to between sessions
      const overrideTime2 = new Date('2024-12-19T09:45:00');
      global.localStorage.getItem.mockReturnValue(overrideTime2.toISOString());

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: mockSessions[1],
        sessions: mockSessions,
        allSessions: mockSessions,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      rerender(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      expect(screen.getByText('Between Sessions')).toBeInTheDocument();
    });
  });

  describe('Error Handling with Time Override', () => {
    it('should handle invalid override time gracefully', () => {
      // Mock invalid date in localStorage
      global.localStorage.getItem.mockReturnValue('invalid-date');

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        sessions: [],
        allSessions: [],
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      // Should not throw error
      expect(() => renderWithRouter(<HomePage />)).not.toThrow();
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage error
      global.localStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        sessions: [],
        allSessions: [],
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      // Should not throw error and fall back to real time
      expect(() => renderWithRouter(<HomePage />)).not.toThrow();
    });
  });
});
