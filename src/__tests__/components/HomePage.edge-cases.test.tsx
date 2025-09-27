/**
 * HomePage Edge Cases Tests
 * Story 2.1: Now/Next Glance Card - Task 5 (Edge Cases)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimeService } from '../../services/timeService';

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

// Mock Supabase client first to prevent import errors
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

// Mock attendee types to prevent import errors
vi.mock('../../types/attendee', () => ({
  sanitizeAttendeeForStorage: vi.fn()
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

// Mock attendeeInfoService to prevent import errors
vi.mock('../../services/attendeeInfoService', () => ({
  attendeeInfoService: {
    getCurrentAttendeeData: vi.fn(),
    getAttendeeSeatAssignments: vi.fn()
  }
}));


// Mock the database types to prevent import errors
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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../../pages/HomePage';

// Mock the useSessionData hook and its dependencies
vi.mock('../../hooks/useSessionData', () => ({
  default: vi.fn()
}));

vi.mock('../../services/dataService', () => ({
  getCurrentAttendeeData: vi.fn(),
  getAttendeeSeatAssignments: vi.fn()
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

// Mock the TimeOverride component
vi.mock('../../components/dev/TimeOverride', () => ({
  default: () => <div data-testid="time-override">Time Override</div>
}));

const mockUseSessionData = require('../../hooks/useSessionData').default;

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('HomePage Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('No Current Session (Between Sessions)', () => {
    it('should display between sessions state when no current session', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: {
          id: '1',
          title: 'Next Session',
          start_time: '14:00:00',
          end_time: '15:00:00',
          date: '2024-12-19',
          location: 'Room A'
        },
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText('Between Sessions')).toBeInTheDocument();
      expect(screen.getByText('Take a break or check your full schedule')).toBeInTheDocument();
      expect(screen.getByText('View Schedule')).toBeInTheDocument();
    });

    it('should navigate to schedule when between sessions button is clicked', () => {
      const mockNavigate = vi.fn();
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate
        };
      });

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: {
          id: '1',
          title: 'Next Session',
          start_time: '14:00:00',
          end_time: '15:00:00',
          date: '2024-12-19',
          location: 'Room A'
        },
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      const scheduleButton = screen.getByText('View Schedule');
      fireEvent.click(scheduleButton);

      expect(mockNavigate).toHaveBeenCalledWith('/schedule');
    });
  });

  describe('No Next Session (All Caught Up)', () => {
    it('should display all caught up state when no next session', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: {
          id: '1',
          title: 'Current Session',
          start_time: '13:00:00',
          end_time: '14:00:00',
          date: '2024-12-19',
          location: 'Room A'
        },
        nextSession: null,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText('All Caught Up!')).toBeInTheDocument();
      expect(screen.getByText('No more sessions scheduled for today')).toBeInTheDocument();
      expect(screen.getByText('View Full Schedule')).toBeInTheDocument();
    });
  });

  describe('Conference Start Date Display Logic', () => {
    it('should display "Scheduled Start Date: [date]" when conference has not started', () => {
      // Mock sessions that are all in the future
      const futureSessions = [
        {
          id: '1',
          title: 'Future Session',
          start_time: '14:00:00',
          end_time: '15:00:00',
          date: '2025-12-25', // Future date
          location: 'Room A'
        }
      ];

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        sessions: futureSessions,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText('Scheduled Start Date: Dec 25, 2025')).toBeInTheDocument();
    });

    it('should display "Now & Next" when conference has started', () => {
      // Mock sessions with one in the past (conference started)
      const mixedSessions = [
        {
          id: '1',
          title: 'Past Session',
          start_time: '09:00:00',
          end_time: '10:00:00',
          date: '2024-01-01', // Past date
          location: 'Room A'
        },
        {
          id: '2',
          title: 'Future Session',
          start_time: '14:00:00',
          end_time: '15:00:00',
          date: '2025-12-25', // Future date
          location: 'Room B'
        }
      ];

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: mixedSessions[1],
        sessions: mixedSessions,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText('Now & Next')).toBeInTheDocument();
    });

    it('should display just the date when current date is on or after conference start date', () => {
      // Mock current time to be on the conference start date
      const mockCurrentTime = new Date('2025-12-25T10:00:00Z');
      vi.spyOn(TimeService, 'getCurrentTime').mockReturnValue(mockCurrentTime);

      const futureSessions = [
        {
          id: '1',
          title: 'Conference Session',
          start_time: '14:00:00',
          end_time: '15:00:00',
          date: '2025-12-25', // Same date as current time
          location: 'Room A'
        }
      ];

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        sessions: futureSessions,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      // Should show just the date without "Scheduled Start Date:" prefix
      expect(screen.getByText('Dec 25, 2025')).toBeInTheDocument();
      expect(screen.queryByText('Scheduled Start Date: Dec 25, 2025')).not.toBeInTheDocument();
    });

    it('should display "Scheduled Start Date:" prefix when current date is before conference start date', () => {
      // Mock current time to be before the conference start date
      const mockCurrentTime = new Date('2025-12-24T10:00:00Z');
      vi.spyOn(TimeService, 'getCurrentTime').mockReturnValue(mockCurrentTime);

      const futureSessions = [
        {
          id: '1',
          title: 'Conference Session',
          start_time: '14:00:00',
          end_time: '15:00:00',
          date: '2025-12-25', // Future date
          location: 'Room A'
        }
      ];

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        sessions: futureSessions,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      // Should show with "Scheduled Start Date:" prefix
      expect(screen.getByText('Scheduled Start Date: Dec 25, 2025')).toBeInTheDocument();
    });

    it('should handle missing sessions data gracefully', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        sessions: null,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText('Scheduled Start Date: TBD')).toBeInTheDocument();
    });

    it('should handle empty sessions array', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        sessions: [],
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText('Scheduled Start Date: TBD')).toBeInTheDocument();
    });

    it('should handle sessions with missing date data', () => {
      const sessionsWithMissingDate = [
        {
          id: '1',
          title: 'Session Without Date',
          start_time: '14:00:00',
          end_time: '15:00:00',
          date: null, // Missing date
          location: 'Room A'
        }
      ];

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        sessions: sessionsWithMissingDate,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText('Scheduled Start Date: TBD')).toBeInTheDocument();
    });
  });

  describe('No Sessions Assigned', () => {
    it('should display no assignments state when user has no sessions', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText('No Sessions Assigned')).toBeInTheDocument();
      expect(screen.getByText('You don\'t have any sessions assigned for today. Check the full schedule to see all available sessions.')).toBeInTheDocument();
      expect(screen.getByText('View Full Schedule')).toBeInTheDocument();
      expect(screen.getByText('Update Preferences')).toBeInTheDocument();
    });

    it('should navigate to settings when update preferences is clicked', () => {
      const mockNavigate = vi.fn();
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate
        };
      });

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      const preferencesButton = screen.getByText('Update Preferences');
      fireEvent.click(preferencesButton);

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });

  describe('Error States', () => {
    it('should display error state when data loading fails', () => {
      const mockRefresh = vi.fn();
      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        attendee: null,
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: 'Failed to load schedule data',
        refresh: mockRefresh
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText('Unable to load schedule')).toBeInTheDocument();
      expect(screen.getByText('Failed to load schedule data')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should call refresh when try again button is clicked', () => {
      const mockRefresh = vi.fn();
      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        attendee: null,
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: 'Failed to load schedule data',
        refresh: mockRefresh
      });

      renderWithRouter(<HomePage />);

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should display loading state while data is being fetched', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        attendee: null,
        seatAssignments: [],
        isLoading: true,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText('Loading your schedule...')).toBeInTheDocument();
    });
  });

  describe('Offline States', () => {
    it('should display offline indicator when offline', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: {
          id: '1',
          title: 'Current Session',
          start_time: '13:00:00',
          end_time: '14:00:00',
          date: '2024-12-19',
          location: 'Room A'
        },
        nextSession: null,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: true,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText('📱 Offline mode - showing cached data')).toBeInTheDocument();
    });

    it('should not show error state when offline', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        attendee: null,
        seatAssignments: [],
        isLoading: false,
        isOffline: true,
        error: 'Network error',
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      expect(screen.queryByText('Unable to load schedule')).not.toBeInTheDocument();
      expect(screen.getByText('📱 Offline mode - showing cached data')).toBeInTheDocument();
    });
  });

  describe('Seat Assignment Integration', () => {
    it('should display seat information when available', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: {
          id: '1',
          title: 'Current Session',
          start_time: '13:00:00',
          end_time: '14:00:00',
          date: '2024-12-19',
          location: 'Room A',
          seatInfo: {
            table: 'Table 5',
            seat: 3,
            position: { x: 100, y: 200 }
          }
        },
        nextSession: null,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [{
          id: '1',
          table_name: 'Table 5',
          seat_number: 3,
          seat_position: { x: 100, y: 200 }
        }],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText('Your Seat')).toBeInTheDocument();
      expect(screen.getByText('Table 5 • Seat 3')).toBeInTheDocument();
      expect(screen.getByText('Find my seat')).toBeInTheDocument();
    });

    it('should navigate to seat map with session and table parameters', () => {
      const mockNavigate = vi.fn();
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate
        };
      });

      mockUseSessionData.mockReturnValue({
        currentSession: {
          id: '1',
          title: 'Current Session',
          start_time: '13:00:00',
          end_time: '14:00:00',
          date: '2024-12-19',
          location: 'Room A',
          seatInfo: {
            table: 'Table 5',
            seat: 3,
            position: { x: 100, y: 200 }
          }
        },
        nextSession: null,
        attendee: { id: '1', name: 'Test User' },
        seatAssignments: [],
        isLoading: false,
        isOffline: false,
        error: null,
        refresh: vi.fn()
      });

      renderWithRouter(<HomePage />);

      const findSeatLink = screen.getByText('Find my seat');
      fireEvent.click(findSeatLink);

      expect(mockNavigate).toHaveBeenCalledWith('/seat-map?session=1&table=Table 5');
    });
  });
});
