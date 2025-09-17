/**
 * SessionCard Coffee Break Tests
 * Tests for coffee break treatment in SessionCard component
 * Story 2.2: Coffee Break Treatment - Component integration tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SessionCard from '../../components/session/SessionCard';

// Mock the useCountdown hook
vi.mock('../../hooks/useCountdown', () => ({
  default: vi.fn()
}));

// Mock the sessionUtils
vi.mock('../../utils/sessionUtils', () => ({
  isCoffeeBreak: vi.fn(),
  isMeal: vi.fn(),
  getSessionCategory: vi.fn(),
  shouldShowCountdown: vi.fn(),
  getCountdownPriority: vi.fn(),
  formatSessionTitle: vi.fn(),
  getSessionIcon: vi.fn(),
  getSessionClassName: vi.fn(),
  hasSpecialStyling: vi.fn()
}));

import useCountdown from '../../hooks/useCountdown';
import * as sessionUtils from '../../utils/sessionUtils';

const mockUseCountdown = vi.mocked(useCountdown);

// Helper function to render SessionCard with router
const renderSessionCard = (props) => {
  return render(
    <BrowserRouter>
      <SessionCard {...props} />
    </BrowserRouter>
  );
};

describe('SessionCard Coffee Break Treatment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    sessionUtils.isCoffeeBreak.mockReturnValue(false);
    sessionUtils.isMeal.mockReturnValue(false);
    sessionUtils.getSessionCategory.mockReturnValue('session');
    sessionUtils.shouldShowCountdown.mockReturnValue(false);
    sessionUtils.getCountdownPriority.mockReturnValue(1);
    sessionUtils.formatSessionTitle.mockImplementation((session) => session.title);
    sessionUtils.getSessionIcon.mockReturnValue('📅');
    sessionUtils.getSessionClassName.mockReturnValue('session-card session-card--session');
    sessionUtils.hasSpecialStyling.mockReturnValue(false);
    
    // Default countdown mock
    mockUseCountdown.mockReturnValue({
      formattedTime: '15 minutes left',
      isActive: false,
      minutesRemaining: 15
    });
  });

  describe('Coffee Break Detection and Styling', () => {
    it('should apply coffee break styling when session is a coffee break', () => {
      const coffeeBreakSession = {
        id: '1',
        title: 'Networking Coffee Break',
        session_type: 'meal',
        start_time: '10:00:00',
        end_time: '10:30:00',
        date: '2024-01-16',
        location: 'Main Hall'
      };

      sessionUtils.isCoffeeBreak.mockReturnValue(true);
      sessionUtils.getSessionClassName.mockReturnValue('session-card session-card--coffee-break');
      sessionUtils.hasSpecialStyling.mockReturnValue(true);

      renderSessionCard({
        session: coffeeBreakSession,
        variant: 'now'
      });

      const card = screen.getByRole('button');
      expect(card).toHaveClass('session-card--coffee-break');
    });

    it('should show coffee icon for coffee break sessions', () => {
      const coffeeBreakSession = {
        id: '1',
        title: 'Coffee Break',
        session_type: 'meal'
      };

      sessionUtils.isCoffeeBreak.mockReturnValue(true);
      sessionUtils.getSessionIcon.mockReturnValue('☕');
      sessionUtils.formatSessionTitle.mockReturnValue('Coffee Break');

      renderSessionCard({
        session: coffeeBreakSession,
        variant: 'now'
      });

      expect(screen.getByText('☕')).toBeInTheDocument();
      expect(screen.getByText('Coffee Break')).toBeInTheDocument();
    });

    it('should apply special inline styling for coffee breaks in Now status', () => {
      const coffeeBreakSession = {
        id: '1',
        title: 'Coffee Break',
        session_type: 'meal'
      };

      sessionUtils.isCoffeeBreak.mockReturnValue(true);

      renderSessionCard({
        session: coffeeBreakSession,
        variant: 'now'
      });

      const card = screen.getByRole('button');
      expect(card).toHaveStyle({
        background: 'var(--purple-050)',
        border: '2px solid var(--purple-500)',
        boxShadow: '0 4px 12px rgba(124, 76, 196, 0.15)'
      });
    });
  });

  describe('Coffee Break Countdown Treatment', () => {
    it('should show countdown instead of NOW text for coffee breaks', () => {
      const coffeeBreakSession = {
        id: '1',
        title: 'Coffee Break',
        session_type: 'meal',
        start_time: '10:00:00',
        end_time: '10:30:00',
        date: '2024-01-16'
      };

      sessionUtils.isCoffeeBreak.mockReturnValue(true);
      sessionUtils.shouldShowCountdown.mockReturnValue(true);
      mockUseCountdown.mockReturnValue({
        formattedTime: '23 minutes left',
        isActive: true,
        minutesRemaining: 23
      });

      renderSessionCard({
        session: coffeeBreakSession,
        variant: 'now'
      });

      expect(screen.getByText('23 minutes left')).toBeInTheDocument();
      expect(screen.queryByText('NOW')).not.toBeInTheDocument();
    });

    it('should hide time range when countdown is active for coffee breaks', () => {
      const coffeeBreakSession = {
        id: '1',
        title: 'Coffee Break',
        session_type: 'meal',
        start_time: '10:00:00',
        end_time: '10:30:00',
        date: '2024-01-16'
      };

      sessionUtils.isCoffeeBreak.mockReturnValue(true);
      sessionUtils.shouldShowCountdown.mockReturnValue(true);
      mockUseCountdown.mockReturnValue({
        formattedTime: '23 minutes left',
        isActive: true,
        minutesRemaining: 23
      });

      renderSessionCard({
        session: coffeeBreakSession,
        variant: 'now'
      });

      expect(screen.queryByText('10:00 AM - 10:30 AM')).not.toBeInTheDocument();
    });

    it('should show time range when countdown is not active for coffee breaks', () => {
      const coffeeBreakSession = {
        id: '1',
        title: 'Coffee Break',
        session_type: 'meal',
        start_time: '10:00:00',
        end_time: '10:30:00',
        date: '2024-01-16'
      };

      sessionUtils.isCoffeeBreak.mockReturnValue(true);
      sessionUtils.shouldShowCountdown.mockReturnValue(true);
      mockUseCountdown.mockReturnValue({
        formattedTime: '23 minutes left',
        isActive: false,
        minutesRemaining: 23
      });

      renderSessionCard({
        session: coffeeBreakSession,
        variant: 'now'
      });

      expect(screen.getByText('10:00 AM - 10:30 AM')).toBeInTheDocument();
      expect(screen.getByText('NOW')).toBeInTheDocument();
    });

    it('should enable countdown for coffee breaks in Now status', () => {
      const coffeeBreakSession = {
        id: '1',
        title: 'Coffee Break',
        session_type: 'meal',
        start_time: '10:00:00',
        end_time: '10:30:00',
        date: '2024-01-16'
      };

      sessionUtils.isCoffeeBreak.mockReturnValue(true);
      sessionUtils.shouldShowCountdown.mockReturnValue(true);

      renderSessionCard({
        session: coffeeBreakSession,
        variant: 'now'
      });

      expect(mockUseCountdown).toHaveBeenCalledWith(
        expect.any(Date),
        expect.objectContaining({
          updateInterval: 60000,
          enabled: true
        })
      );
    });

    it('should not enable countdown for coffee breaks in Next status', () => {
      const coffeeBreakSession = {
        id: '1',
        title: 'Coffee Break',
        session_type: 'meal',
        start_time: '10:00:00',
        end_time: '10:30:00',
        date: '2024-01-16'
      };

      sessionUtils.isCoffeeBreak.mockReturnValue(true);
      sessionUtils.shouldShowCountdown.mockReturnValue(true);

      renderSessionCard({
        session: coffeeBreakSession,
        variant: 'next'
      });

      expect(mockUseCountdown).toHaveBeenCalledWith(
        expect.any(Date),
        expect.objectContaining({
          updateInterval: 60000,
          enabled: false
        })
      );
    });
  });

  describe('Coffee Break Accessibility', () => {
    it('should have proper ARIA labels for coffee break icon', () => {
      const coffeeBreakSession = {
        id: '1',
        title: 'Coffee Break',
        session_type: 'meal'
      };

      sessionUtils.isCoffeeBreak.mockReturnValue(true);
      sessionUtils.getSessionIcon.mockReturnValue('☕');

      renderSessionCard({
        session: coffeeBreakSession,
        variant: 'now'
      });

      const icon = screen.getByLabelText('Coffee break');
      expect(icon).toBeInTheDocument();
    });

    it('should maintain proper heading structure for coffee breaks', () => {
      const coffeeBreakSession = {
        id: '1',
        title: 'Coffee Break',
        session_type: 'meal'
      };

      sessionUtils.isCoffeeBreak.mockReturnValue(true);
      sessionUtils.formatSessionTitle.mockReturnValue('Coffee Break');

      renderSessionCard({
        session: coffeeBreakSession,
        variant: 'now'
      });

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Coffee Break');
    });
  });

  describe('Coffee Break Edge Cases', () => {
    it('should handle coffee break sessions without time data', () => {
      const coffeeBreakSession = {
        id: '1',
        title: 'Coffee Break',
        session_type: 'meal'
      };

      sessionUtils.isCoffeeBreak.mockReturnValue(true);
      sessionUtils.shouldShowCountdown.mockReturnValue(true);

      renderSessionCard({
        session: coffeeBreakSession,
        variant: 'now'
      });

      expect(mockUseCountdown).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          enabled: true
        })
      );
    });

    it('should handle coffee break sessions with missing title', () => {
      const coffeeBreakSession = {
        id: '1',
        session_type: 'meal'
      };

      sessionUtils.isCoffeeBreak.mockReturnValue(false);
      sessionUtils.formatSessionTitle.mockReturnValue('');

      renderSessionCard({
        session: coffeeBreakSession,
        variant: 'now'
      });

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('');
    });

    it('should not show coffee break styling for non-coffee break sessions', () => {
      const regularSession = {
        id: '1',
        title: 'Regular Session',
        session_type: 'keynote'
      };

      sessionUtils.isCoffeeBreak.mockReturnValue(false);
      sessionUtils.hasSpecialStyling.mockReturnValue(false);

      renderSessionCard({
        session: regularSession,
        variant: 'now'
      });

      const card = screen.getByRole('button');
      expect(card).not.toHaveStyle({
        background: 'var(--purple-050)'
      });
    });
  });

  describe('Coffee Break Integration with Other Features', () => {
    it('should work with seat assignments for coffee breaks', () => {
      const coffeeBreakSession = {
        id: '1',
        title: 'Coffee Break',
        session_type: 'meal',
        seatInfo: {
          table: 'Table 5',
          seat: 'Seat 3'
        }
      };

      sessionUtils.isCoffeeBreak.mockReturnValue(true);

      renderSessionCard({
        session: coffeeBreakSession,
        variant: 'now'
      });

      expect(screen.getByText('Table 5 • Seat 3')).toBeInTheDocument();
      expect(screen.getByText('Find my seat')).toBeInTheDocument();
    });

    it('should work with speaker information for coffee breaks', () => {
      const coffeeBreakSession = {
        id: '1',
        title: 'Coffee Break',
        session_type: 'meal',
        speaker: 'John Doe'
      };

      sessionUtils.isCoffeeBreak.mockReturnValue(true);

      renderSessionCard({
        session: coffeeBreakSession,
        variant: 'now'
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
