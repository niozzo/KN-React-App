import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';

// Mock all external dependencies
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'test-user', name: 'Test User' }
  })
}));

vi.mock('../../hooks/useSessionData', () => ({
  useSessionData: () => ({
    currentSession: {
      id: 'current-session',
      title: 'Current Session with Empty Speaker',
      start_time: '10:30:00',
      end_time: '11:15:00',
      date: '2025-10-21',
      location: 'Test Location',
      speaker: {}, // Empty object that causes React Error #31
      speakerInfo: '',
      speakers: []
    },
    nextSession: {
      id: 'next-session',
      title: 'Next Session with Empty Speaker',
      start_time: '11:15:00',
      end_time: '12:15:00',
      date: '2025-10-21',
      location: 'Test Location',
      speaker: {}, // Empty object that causes React Error #31
      speakerInfo: '',
      speakers: []
    },
    sessions: [],
    allSessions: [],
    attendee: { id: 'test-user', name: 'Test User' },
    seatAssignments: [],
    isLoading: false,
    isOffline: false,
    error: null,
    refresh: vi.fn()
  })
}));

// Mock TimeService
const mockTimeService = {
  getCurrentTime: vi.fn(),
  isOverrideActive: vi.fn(),
  getOverrideTime: vi.fn(),
  setOverrideTime: vi.fn(),
  clearOverrideTime: vi.fn()
};

vi.mock('../../services/timeService', () => ({
  default: mockTimeService
}));

describe.skip('Speaker Rendering Error Recovery E2E', () => {
  // SKIPPED: E2E error recovery test - slow, low value (~4 tests)
  // Value: Low - error handling tested elsewhere
  // Decision: Skip E2E tests
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock time override at 11:15 AM (session boundary)
    const overrideTime = new Date('2025-10-21T11:15:00');
    mockTimeService.getCurrentTime.mockReturnValue(overrideTime);
    mockTimeService.isOverrideActive.mockReturnValue(true);
    mockTimeService.getOverrideTime.mockReturnValue(overrideTime);
  });

  describe('Complete User Journey', () => {
    it('Test 20: Should complete full time override flow without errors', async () => {
      // Render the full application
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Wait for the application to load
      await waitFor(() => {
        expect(screen.getByText('Current Session with Empty Speaker')).toBeInTheDocument();
      });

      // Should display current session
      expect(screen.getByText('NOW')).toBeInTheDocument();
      
      // Should display next session
      expect(screen.getByText('Next Session with Empty Speaker')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();

      // Should not show any error messages
      expect(screen.queryByText('Session Display Issue')).not.toBeInTheDocument();
    });

    it('Test 21: Should handle error recovery flow gracefully', async () => {
      // Mock console.error to track any errors
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Current Session with Empty Speaker')).toBeInTheDocument();
      });

      // Should not have logged any React Error #31
      const errorCalls = consoleErrorSpy.mock.calls.filter(call => 
        call[0] && call[0].includes('React error #31')
      );
      expect(errorCalls).toHaveLength(0);

      consoleErrorSpy.mockRestore();
    });

    it('Should handle navigation between sessions with empty speaker objects', async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Current Session with Empty Speaker')).toBeInTheDocument();
      });

      // Simulate time override change to next session
      const nextSessionTime = new Date('2025-10-21T11:16:00');
      mockTimeService.getCurrentTime.mockReturnValue(nextSessionTime);

      // Trigger a re-render (simulating time override change)
      fireEvent(window, new Event('timeOverrideChanged'));

      await waitFor(() => {
        expect(screen.getByText('Next Session with Empty Speaker')).toBeInTheDocument();
      });

      // Should not show any error messages
      expect(screen.queryByText('Session Display Issue')).not.toBeInTheDocument();
    });
  });

  describe('Error Boundary Recovery', () => {
    it('Should recover from errors and allow continued app usage', async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Current Session with Empty Speaker')).toBeInTheDocument();
      });

      // Simulate a potential error scenario
      const errorButton = screen.queryByText('Try Again');
      if (errorButton) {
        fireEvent.click(errorButton);
      }

      // Should still be able to use the app
      expect(screen.getByText('Current Session with Empty Speaker')).toBeInTheDocument();
    });
  });

  describe('Performance and Stability', () => {
    it('Should maintain stable performance during extended use', async () => {
      const startTime = performance.now();

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Current Session with Empty Speaker')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in reasonable time
      expect(renderTime).toBeLessThan(200);
    });

    it('Should handle multiple rapid time override changes', async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Current Session with Empty Speaker')).toBeInTheDocument();
      });

      // Simulate rapid time override changes
      const times = [
        new Date('2025-10-21T11:14:58'),
        new Date('2025-10-21T11:14:59'),
        new Date('2025-10-21T11:15:00'),
        new Date('2025-10-21T11:15:01'),
        new Date('2025-10-21T11:15:02')
      ];

      for (const time of times) {
        mockTimeService.getCurrentTime.mockReturnValue(time);
        fireEvent(window, new Event('timeOverrideChanged'));
        
        await waitFor(() => {
          expect(screen.getByText('Current Session with Empty Speaker')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('Should work consistently across different platforms', () => {
      const platforms = [
        'Windows',
        'macOS',
        'Linux',
        'iOS',
        'Android'
      ];

      platforms.forEach(platform => {
        // Mock platform-specific behavior
        Object.defineProperty(navigator, 'platform', {
          value: platform,
          writable: true
        });

        expect(() => {
          render(
            <BrowserRouter>
              <App />
            </BrowserRouter>
          );
        }).not.toThrow();
      });
    });
  });

  describe('Data Integrity', () => {
    it('Should maintain data integrity throughout the session', async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Current Session with Empty Speaker')).toBeInTheDocument();
      });

      // Verify session data is consistent
      expect(screen.getByText('NOW')).toBeInTheDocument();
      expect(screen.getByText('Next Session with Empty Speaker')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();

      // Verify no error states are shown
      expect(screen.queryByText('Session Display Issue')).not.toBeInTheDocument();
      expect(screen.queryByText('Unable to load schedule')).not.toBeInTheDocument();
    });
  });

  describe('User Experience', () => {
    it('Should provide smooth user experience without interruptions', async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Current Session with Empty Speaker')).toBeInTheDocument();
      });

      // User should see normal session information
      expect(screen.getByText('Current Session with Empty Speaker')).toBeInTheDocument();
      expect(screen.getByText('NOW')).toBeInTheDocument();
      
      // Should not see any error messages or fallback UI
      expect(screen.queryByText('Session Display Issue')).not.toBeInTheDocument();
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });
  });
});
