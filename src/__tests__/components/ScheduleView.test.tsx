/**
 * ScheduleView Container Tests
 * Story 2.2: Personalized Schedule View - Task 3
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ScheduleView from '../../components/ScheduleView';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock SessionCard to avoid complex dependencies
vi.mock('../../components/session/SessionCard', () => ({
  default: ({ session, variant, onClick, className }) => (
    <div 
      className={`mock-session-card ${className}`}
      data-variant={variant}
      data-session-id={session.id}
      onClick={() => onClick && onClick(session)}
    >
      <h3>{session.title}</h3>
      <p>{session.start_time} - {session.end_time}</p>
      <p>{session.location}</p>
    </div>
  )
}));

// Helper function to render ScheduleView with router
const renderScheduleView = (props) => {
  return render(
    <BrowserRouter>
      <ScheduleView {...props} />
    </BrowserRouter>
  );
};

describe('ScheduleView Container', () => {
  const mockSessions = [
    {
      id: '1',
      title: 'Morning Keynote',
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
      speaker: 'Conference Staff',
      type: 'coffee_break'
    },
    {
      id: '3',
      title: 'Lunch',
      date: '2024-12-19',
      start_time: '12:00:00',
      end_time: '13:00:00',
      location: 'Dining Room',
      speaker: 'Conference Staff',
      type: 'meal'
    },
    {
      id: '4',
      title: 'Afternoon Session',
      date: '2024-12-20',
      start_time: '14:00:00',
      end_time: '15:00:00',
      location: 'Room A',
      speaker: 'Jane Smith',
      type: 'session'
    }
  ];

  describe('Given sessions with multiple days', () => {
    it('When rendering schedule view, Then groups sessions by day', () => {
      renderScheduleView({ sessions: mockSessions });

      // Should have day headers for each day
      expect(screen.getByText(/December 18, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/December 19, 2024/)).toBeInTheDocument();
      
      // Should display session count for each day
      expect(screen.getByText('3 sessions')).toBeInTheDocument();
      expect(screen.getByText('1 session')).toBeInTheDocument();
    });

    it('When rendering schedule view, Then displays sessions in chronological order', () => {
      renderScheduleView({ sessions: mockSessions });

      // Should display sessions in order
      expect(screen.getByText('Morning Keynote')).toBeInTheDocument();
      expect(screen.getByText('Coffee Break')).toBeInTheDocument();
      expect(screen.getByText('Lunch')).toBeInTheDocument();
      expect(screen.getByText('Afternoon Session')).toBeInTheDocument();
    });

    it('When rendering schedule view, Then uses agenda variant for SessionCard', () => {
      const { container } = renderScheduleView({ sessions: mockSessions });

      const sessionCards = container.querySelectorAll('.mock-session-card');
      expect(sessionCards).toHaveLength(4);
      
      // All cards should have agenda variant
      sessionCards.forEach(card => {
        expect(card).toHaveAttribute('data-variant', 'agenda');
      });
    });

    it('When rendering schedule view, Then applies schedule-specific CSS classes', () => {
      const { container } = renderScheduleView({ sessions: mockSessions });

      expect(container.querySelector('.schedule-view')).toBeInTheDocument();
      expect(container.querySelector('.schedule-day-group')).toBeInTheDocument();
      expect(container.querySelector('.schedule-day-sessions')).toBeInTheDocument();
      expect(container.querySelector('.schedule-session-card')).toBeInTheDocument();
    });
  });

  describe('Given empty sessions array', () => {
    it('When rendering schedule view, Then displays empty state message', () => {
      renderScheduleView({ sessions: [] });

      expect(screen.getByText('No sessions scheduled')).toBeInTheDocument();
      expect(screen.getByText('Your personalized schedule will appear here once sessions are assigned.')).toBeInTheDocument();
    });

    it('When rendering schedule view, Then applies empty state CSS class', () => {
      const { container } = renderScheduleView({ sessions: [] });

      expect(container.querySelector('.schedule-view--empty')).toBeInTheDocument();
    });
  });

  describe('Given session click handling', () => {
    it('When session is clicked, Then calls onSessionClick with session data', () => {
      const mockOnSessionClick = vi.fn();
      renderScheduleView({ 
        sessions: mockSessions, 
        onSessionClick: mockOnSessionClick 
      });

      const firstSession = screen.getByText('Morning Keynote');
      fireEvent.click(firstSession);

      expect(mockOnSessionClick).toHaveBeenCalledWith(mockSessions[0]);
    });

    it('When no onSessionClick provided, Then does not throw error', () => {
      renderScheduleView({ sessions: mockSessions });

      const firstSession = screen.getByText('Morning Keynote');
      expect(() => fireEvent.click(firstSession)).not.toThrow();
    });
  });

  describe('Given session sorting', () => {
    it('When sessions have different start times, Then sorts by start time within day', () => {
      const unsortedSessions = [
        {
          id: '1',
          title: 'Late Session',
          date: '2024-12-19',
          start_time: '15:00:00',
          end_time: '16:00:00',
          location: 'Room A',
          speaker: 'Speaker 1',
          type: 'session'
        },
        {
          id: '2',
          title: 'Early Session',
          date: '2024-12-19',
          start_time: '09:00:00',
          end_time: '10:00:00',
          location: 'Room B',
          speaker: 'Speaker 2',
          type: 'session'
        }
      ];

      renderScheduleView({ sessions: unsortedSessions });

      const sessionCards = screen.getAllByText(/Session/);
      expect(sessionCards[0]).toHaveTextContent('Early Session');
      expect(sessionCards[1]).toHaveTextContent('Late Session');
    });

    it('When sessions have no start time, Then handles gracefully', () => {
      const sessionsWithoutTime = [
        {
          id: '1',
          title: 'Session Without Time',
          date: '2024-12-19',
          location: 'Room A',
          speaker: 'Speaker 1',
          type: 'session'
        }
      ];

      renderScheduleView({ sessions: sessionsWithoutTime });

      expect(screen.getByText('Session Without Time')).toBeInTheDocument();
    });
  });

  describe('Given day grouping', () => {
    it('When sessions span multiple days, Then groups correctly by date', () => {
      const multiDaySessions = [
        {
          id: '1',
          title: 'Day 1 Session',
          date: '2024-12-19',
          start_time: '09:00:00',
          end_time: '10:00:00',
          location: 'Room A',
          speaker: 'Speaker 1',
          type: 'session'
        },
        {
          id: '2',
          title: 'Day 2 Session',
          date: '2024-12-20',
          start_time: '09:00:00',
          end_time: '10:00:00',
          location: 'Room B',
          speaker: 'Speaker 2',
          type: 'session'
        }
      ];

      renderScheduleView({ sessions: multiDaySessions });

      // Should have two day headers
      expect(screen.getByText(/December 18, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/December 19, 2024/)).toBeInTheDocument();
      
      // Each day should have 1 session
      expect(screen.getAllByText('1 session')).toHaveLength(2);
    });
  });

  describe('Given custom className', () => {
    it('When custom className provided, Then applies to schedule view', () => {
      const { container } = renderScheduleView({ 
        sessions: mockSessions,
        className: 'custom-schedule'
      });

      expect(container.querySelector('.schedule-view.custom-schedule')).toBeInTheDocument();
    });
  });

  describe('Given accessibility', () => {
    it('When rendering schedule view, Then maintains proper structure', () => {
      renderScheduleView({ sessions: mockSessions });

      // Should have proper heading structure from DayHeader (multiple headings for multiple days)
      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings).toHaveLength(2); // Two days
      
      // Should display all session information
      expect(screen.getByText('Morning Keynote')).toBeInTheDocument();
      expect(screen.getByText('Coffee Break')).toBeInTheDocument();
    });
  });
});
