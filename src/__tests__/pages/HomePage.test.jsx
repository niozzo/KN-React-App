/**
 * HomePage Component Tests
 * Testing conditional rendering for empty session states
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../../pages/HomePage';

// Mock dependencies
vi.mock('../../hooks/useSessionData', () => ({
  __esModule: true,
  default: vi.fn()
}));

vi.mock('../../services/timeService', () => ({
  default: {
    getCurrentTime: vi.fn(() => new Date('2024-01-15T10:00:00'))
  }
}));

// Mock components
vi.mock('../../components/layout/PageLayout', () => ({
  default: ({ children, ...props }) => <div data-testid="page-layout" {...props}>{children}</div>
}));

vi.mock('../../components/AnimatedNowNextCards', () => ({
  default: ({ currentSession, nextSession, ...props }) => (
    <div data-testid="animated-cards" {...props}>
      {currentSession && <div data-testid="current-session">{currentSession.title}</div>}
      {nextSession && <div data-testid="next-session">{nextSession.title}</div>}
    </div>
  )
}));

vi.mock('../../components/common/Card', () => ({
  default: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>
}));

vi.mock('../../components/common/Button', () => ({
  default: ({ children, ...props }) => <button data-testid="button" {...props}>{children}</button>
}));

vi.mock('../../components/InstallPrompt', () => ({
  default: () => <div data-testid="install-prompt">Install Prompt</div>
}));

vi.mock('../../components/dev/TimeOverride', () => ({
  default: () => <div data-testid="time-override">Time Override</div>
}));

const mockUseSessionData = vi.fn();

describe('HomePage Conditional Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Import and mock useSessionData
    const useSessionDataModule = await import('../../hooks/useSessionData');
    useSessionDataModule.default.mockImplementation(mockUseSessionData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderHomePage = () => {
    return render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
  };

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        allSessions: [],
        attendee: { id: 'test-attendee' },
        isLoading: true,
        isOffline: false,
        error: null
      });

      renderHomePage();

      expect(screen.getByText('Loading your schedule...')).toBeInTheDocument();
      expect(screen.getByTestId('page-layout')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when there is an error and not offline', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        allSessions: [],
        attendee: { id: 'test-attendee' },
        isLoading: false,
        isOffline: false,
        error: 'Failed to load data'
      });

      renderHomePage();

      expect(screen.getByText('Unable to load schedule')).toBeInTheDocument();
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should not show error message when offline', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        allSessions: [],
        attendee: { id: 'test-attendee' },
        isLoading: false,
        isOffline: true,
        error: 'Network error'
      });

      renderHomePage();

      expect(screen.queryByText('Unable to load schedule')).not.toBeInTheDocument();
    });
  });

  describe('Conference Not Started State', () => {
    it('should show Conference Not Started when no sessions and conference not started', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        allSessions: [], // No sessions at all
        attendee: { id: 'test-attendee' },
        isLoading: false,
        isOffline: false,
        error: null
      });

      renderHomePage();

      expect(screen.getByText('Conference schedule to start on TBD')).toBeInTheDocument();
      expect(screen.getByText('Conference Not Started')).toBeInTheDocument();
      expect(screen.getByText('The conference will begin on TBD. Check back then for your personalized schedule.')).toBeInTheDocument();
      expect(screen.getByText('View Full Schedule')).toBeInTheDocument();
      expect(screen.getByText('Update Preferences')).toBeInTheDocument();
    });

    it('should show Conference Not Started when no sessions assigned and conference not started', () => {
      const futureSessions = [
        {
          id: '1',
          title: 'Future Session',
          date: '2024-01-20', // Future date
          start_time: '09:00:00',
          end_time: '10:00:00',
          type: 'keynote'
        }
      ];

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        allSessions: futureSessions, // Has sessions but not started
        attendee: { id: 'test-attendee' },
        isLoading: false,
        isOffline: false,
        error: null
      });

      renderHomePage();

      expect(screen.getByText('Conference schedule to start on Jan 20, 2024')).toBeInTheDocument();
      expect(screen.getByText('Conference Not Started')).toBeInTheDocument();
    });
  });

  describe('No Sessions Assigned State', () => {
    it('should show No Sessions Assigned when no sessions assigned but conference started', () => {
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

      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        allSessions: pastSessions, // Has sessions (conference started)
        attendee: { id: 'test-attendee' },
        isLoading: false,
        isOffline: false,
        error: null
      });

      renderHomePage();

      expect(screen.getByText('Now & Next')).toBeInTheDocument();
      expect(screen.getByText('No Sessions Assigned')).toBeInTheDocument();
      expect(screen.getByText("You don't have any sessions assigned for today. Check the full schedule to see all available sessions.")).toBeInTheDocument();
      expect(screen.getByText('View Full Schedule')).toBeInTheDocument();
      expect(screen.getByText('Update Preferences')).toBeInTheDocument();
    });
  });

  describe('Normal State with Sessions', () => {
    it('should show normal Now/Next cards when sessions are available', () => {
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

      mockUseSessionData.mockReturnValue({
        currentSession: sessions[0],
        nextSession: sessions[1],
        allSessions: sessions,
        attendee: { id: 'test-attendee' },
        isLoading: false,
        isOffline: false,
        error: null
      });

      renderHomePage();

      expect(screen.getByText('Now & Next')).toBeInTheDocument();
      expect(screen.getByTestId('animated-cards')).toBeInTheDocument();
      expect(screen.getByTestId('current-session')).toHaveTextContent('Current Session');
      expect(screen.getByTestId('next-session')).toHaveTextContent('Next Session');
      expect(screen.getByText('View Full Schedule')).toBeInTheDocument();
    });
  });

  describe('Offline Mode', () => {
    it('should show offline indicator when offline', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        allSessions: [],
        attendee: { id: 'test-attendee' },
        isLoading: false,
        isOffline: true,
        error: null
      });

      renderHomePage();

      expect(screen.getByText('📱 Offline mode - showing cached data')).toBeInTheDocument();
    });

    it('should not show offline indicator when online', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        allSessions: [],
        attendee: { id: 'test-attendee' },
        isLoading: false,
        isOffline: false,
        error: null
      });

      renderHomePage();

      expect(screen.queryByText('📱 Offline mode - showing cached data')).not.toBeInTheDocument();
    });
  });

  describe('Time Override', () => {
    it('should always show Time Override component', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        allSessions: [],
        attendee: { id: 'test-attendee' },
        isLoading: false,
        isOffline: false,
        error: null
      });

      renderHomePage();

      expect(screen.getByTestId('time-override')).toBeInTheDocument();
    });
  });

  describe('Install Prompt', () => {
    it('should show Install Prompt component', () => {
      mockUseSessionData.mockReturnValue({
        currentSession: null,
        nextSession: null,
        allSessions: [],
        attendee: { id: 'test-attendee' },
        isLoading: false,
        isOffline: false,
        error: null
      });

      renderHomePage();

      expect(screen.getByTestId('install-prompt')).toBeInTheDocument();
    });
  });
});
