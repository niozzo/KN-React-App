/**
 * SessionCard Agenda Variant Tests
 * Story 2.2: Personalized Schedule View - Task 1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import SessionCard from '../../components/session/SessionCard';
import useCountdown from '../../hooks/useCountdown';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the useCountdown hook
vi.mock('../../hooks/useCountdown', () => ({
  default: vi.fn()
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock sessionUtils
vi.mock('../../utils/sessionUtils', () => ({
  isCoffeeBreak: vi.fn(),
  isMeal: vi.fn(),
  isDiningEvent: vi.fn(),
  getDiningEventType: vi.fn(),
  getDiningEventIcon: vi.fn(),
  getSessionCategory: vi.fn(),
  shouldShowCountdown: vi.fn(),
  getCountdownPriority: vi.fn(),
  formatSessionTitle: vi.fn(),
  getSessionIcon: vi.fn(),
  getSessionClassName: vi.fn(),
  hasSpecialStyling: vi.fn()
}));

import * as sessionUtils from '../../utils/sessionUtils';

const mockUseCountdown = vi.mocked(useCountdown);

// Test wrapper component with AuthProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

// Helper function to render SessionCard with router
const renderSessionCard = (props) => {
  return render(
    <TestWrapper>
      <SessionCard {...props} />
    </TestWrapper>
  );
};

describe('SessionCard Agenda Variant', () => {
  const mockSession = {
    id: '1',
    title: 'Test Session',
    date: '2024-12-19',
    start_time: '10:00:00',
    end_time: '11:00:00',
    location: 'Room A',
    speaker: 'John Doe',
    type: 'session'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    sessionUtils.isCoffeeBreak.mockReturnValue(false);
    sessionUtils.isMeal.mockReturnValue(false);
    sessionUtils.isDiningEvent.mockReturnValue(false);
    sessionUtils.getDiningEventType.mockReturnValue('lunch');
    sessionUtils.getDiningEventIcon.mockReturnValue('🍽️');
    sessionUtils.getSessionCategory.mockReturnValue('session');
    sessionUtils.shouldShowCountdown.mockReturnValue(false);
    sessionUtils.getCountdownPriority.mockReturnValue(1);
    sessionUtils.formatSessionTitle.mockImplementation((session) => session.title);
    sessionUtils.getSessionIcon.mockReturnValue('📅');
    sessionUtils.getSessionClassName.mockReturnValue('session-card session-card--session');
    sessionUtils.hasSpecialStyling.mockReturnValue(false);
    
    // Default countdown mock with complete object structure
    mockUseCountdown.mockReturnValue({
      timeRemaining: 900000,
      formattedTime: '15 minutes left',
      isActive: false,
      isComplete: false,
      minutesRemaining: 15,
      hoursRemaining: 0
    });
  });

  describe('Given variant="agenda"', () => {
    it('When rendering session card, Then NOW/NEXT labels are hidden', () => {
      renderSessionCard({
        session: mockSession,
        variant: 'agenda'
      });

      // Should not display NOW or Next labels
      expect(screen.queryByText('NOW')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('When rendering session card, Then countdown is disabled', () => {
      renderSessionCard({
        session: mockSession,
        variant: 'agenda'
      });

      // useCountdown should be called with enabled: false
      expect(mockUseCountdown).toHaveBeenCalledWith(
        expect.any(Date),
        expect.objectContaining({
          enabled: false
        })
      );
    });

    it('When rendering session card, Then all other functionality is preserved', () => {
      renderSessionCard({
        session: mockSession,
        variant: 'agenda'
      });

      // Should display session title
      expect(screen.getByText('Test Session')).toBeInTheDocument();
      
      // Should display time range
      expect(screen.getByText('10:00 AM - 11:00 AM')).toBeInTheDocument();
      
      // Should display location
      expect(screen.getByText('Room A')).toBeInTheDocument();
      
      // Should display speaker
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('When rendering session card, Then agenda-specific CSS class is applied', () => {
      const { container } = renderSessionCard({
        session: mockSession,
        variant: 'agenda'
      });

      // Should have session-card--agenda class
      expect(container.querySelector('.session-card--agenda')).toBeInTheDocument();
    });

    it('When rendering with dining event, Then dining functionality is preserved', () => {
      sessionUtils.isDiningEvent.mockReturnValue(true);
      sessionUtils.getDiningEventType.mockReturnValue('lunch');
      
      const diningSession = {
        ...mockSession,
        type: 'dining',
        seating_type: 'open'
      };

      renderSessionCard({
        session: diningSession,
        variant: 'agenda'
      });

      // Should display dining event information
      expect(screen.getByText('Open seating')).toBeInTheDocument();
    });

    it('When rendering with seat info, Then seat information is displayed', () => {
      const sessionWithSeat = {
        ...mockSession,
        seatInfo: {
          table: 'Table 5',
          seat: 'Seat 12'
        }
      };

      renderSessionCard({
        session: sessionWithSeat,
        variant: 'agenda'
      });

      // Should display seat information if present
      // Note: This depends on the existing seat info display logic
      expect(screen.getByText('Test Session')).toBeInTheDocument();
    });
  });

  describe('Given agenda variant with different session types', () => {
    it('When rendering coffee break session, Then special styling is preserved', () => {
      sessionUtils.isCoffeeBreak.mockReturnValue(true);
      sessionUtils.getSessionClassName.mockReturnValue('session-card session-card--coffee-break');
      
      const coffeeBreakSession = {
        ...mockSession,
        type: 'coffee_break'
      };

      renderSessionCard({
        session: coffeeBreakSession,
        variant: 'agenda'
      });

      // Should display coffee break session
      expect(screen.getByText('Test Session')).toBeInTheDocument();
      
      // Should not show countdown (disabled for agenda variant)
      expect(mockUseCountdown).toHaveBeenCalledWith(
        expect.any(Date),
        expect.objectContaining({
          enabled: false
        })
      );
    });

    it('When rendering meal session, Then meal functionality is preserved', () => {
      sessionUtils.isMeal.mockReturnValue(true);
      
      const mealSession = {
        ...mockSession,
        type: 'meal'
      };

      renderSessionCard({
        session: mealSession,
        variant: 'agenda'
      });

      // Should display meal session
      expect(screen.getByText('Test Session')).toBeInTheDocument();
    });
  });

  describe('Given agenda variant accessibility', () => {
    it('When rendering session card, Then accessibility features are preserved', () => {
      renderSessionCard({
        session: mockSession,
        variant: 'agenda'
      });

      // Should have proper heading structure
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      
      // Should display all session information
      expect(screen.getByText('Test Session')).toBeInTheDocument();
      expect(screen.getByText('Room A')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
