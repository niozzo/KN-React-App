import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SessionCard from '../../components/session/SessionCard';

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the useCountdown hook
const mockUseCountdown = vi.fn();
vi.mock('../../hooks/useCountdown', () => ({
  default: mockUseCountdown
}));

// Mock TimeService
const mockTimeService = {
  getCurrentTime: vi.fn(),
  isOverrideActive: vi.fn(),
  getOverrideTime: vi.fn()
};

vi.mock('../../services/timeService', () => ({
  default: mockTimeService
}));

describe('SessionCard Time Override Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCountdown.mockReturnValue({
      formattedTime: '45:00',
      isActive: true,
      minutesRemaining: 45
    });
  });

  describe('Time Override at Session Boundary', () => {
    it('Test 8: Should handle time override at 11:15 AM session boundary', async () => {
      // Mock time override at 11:15 AM (session transition time)
      const overrideTime = new Date('2025-10-21T11:15:00');
      mockTimeService.getCurrentTime.mockReturnValue(overrideTime);
      mockTimeService.isOverrideActive.mockReturnValue(true);

      const session = {
        id: 'test-session-boundary',
        title: 'Morning Keynote | Political Perspectives...',
        start_time: '11:15:00',
        end_time: '12:15:00',
        date: '2025-10-21',
        location: 'The Grand Ballroom, 8th Floor',
        speaker: {}, // Empty object that previously caused React Error #31
        speakerInfo: '',
        speakers: []
      };

      // Should not throw React Error #31 during session boundary transition
      expect(() => {
        render(<SessionCard session={session} variant="now" />);
      }).not.toThrow();

      expect(screen.getByText('Morning Keynote | Political Perspectives...')).toBeInTheDocument();
      expect(screen.getByText('NOW')).toBeInTheDocument();
    });

    it('Test 9: Should handle time override with empty speaker objects', async () => {
      const sessions = [
        {
          id: 'session-1',
          title: 'Session 1',
          start_time: '10:30:00',
          end_time: '11:15:00',
          date: '2025-10-21',
          location: 'Room A',
          speaker: {}, // Empty object
          speakerInfo: '',
          speakers: []
        },
        {
          id: 'session-2',
          title: 'Session 2',
          start_time: '11:15:00',
          end_time: '12:00:00',
          date: '2025-10-21',
          location: 'Room B',
          speaker: {}, // Empty object
          speakerInfo: '',
          speakers: []
        }
      ];

      // Test each session with time override
      sessions.forEach(session => {
        expect(() => {
          render(<SessionCard session={session} variant="now" />);
        }).not.toThrow();

        expect(screen.getByText(session.title)).toBeInTheDocument();
      });
    });

    it('Test 10: Should maintain performance during rapid time override changes', async () => {
      const session = {
        id: 'performance-test',
        title: 'Performance Test Session',
        start_time: '10:00:00',
        end_time: '11:00:00',
        date: '2025-10-21',
        location: 'Test Location',
        speaker: {},
        speakerInfo: '',
        speakers: []
      };

      const startTime = performance.now();

      // Simulate rapid time override changes
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<SessionCard session={session} variant="now" />);
        unmount();
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete in reasonable time (less than 500ms for 10 renders)
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('Time Override with Various Speaker Data Types', () => {
    it('Should handle time override with null speaker', () => {
      const session = {
        id: 'null-speaker-session',
        title: 'Null Speaker Session',
        start_time: '11:15:00',
        end_time: '12:15:00',
        date: '2025-10-21',
        location: 'Test Location',
        speaker: null,
        speakerInfo: '',
        speakers: []
      };

      expect(() => {
        render(<SessionCard session={session} variant="now" />);
      }).not.toThrow();

      expect(screen.getByText('Null Speaker Session')).toBeInTheDocument();
    });

    it('Should handle time override with undefined speaker', () => {
      const session = {
        id: 'undefined-speaker-session',
        title: 'Undefined Speaker Session',
        start_time: '11:15:00',
        end_time: '12:15:00',
        date: '2025-10-21',
        location: 'Test Location',
        speaker: undefined,
        speakerInfo: '',
        speakers: []
      };

      expect(() => {
        render(<SessionCard session={session} variant="now" />);
      }).not.toThrow();

      expect(screen.getByText('Undefined Speaker Session')).toBeInTheDocument();
    });

    it('Should handle time override with valid speaker string', () => {
      const session = {
        id: 'valid-speaker-session',
        title: 'Valid Speaker Session',
        start_time: '11:15:00',
        end_time: '12:15:00',
        date: '2025-10-21',
        location: 'Test Location',
        speaker: 'John Doe',
        speakerInfo: '',
        speakers: []
      };

      expect(() => {
        render(<SessionCard session={session} variant="now" />);
      }).not.toThrow();

      expect(screen.getByText('Valid Speaker Session')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Countdown Integration with Time Override', () => {
    it('Should work with countdown during time override', () => {
      mockUseCountdown.mockReturnValue({
        formattedTime: '30:00',
        isActive: true,
        minutesRemaining: 30
      });

      const session = {
        id: 'countdown-session',
        title: 'Countdown Test Session',
        start_time: '10:00:00',
        end_time: '11:00:00',
        date: '2025-10-21',
        location: 'Test Location',
        speaker: {},
        speakerInfo: '',
        speakers: []
      };

      render(<SessionCard session={session} variant="now" />);

      expect(screen.getByText('Countdown Test Session')).toBeInTheDocument();
      expect(screen.getByText('NOW')).toBeInTheDocument();
    });
  });

  describe('Error Recovery During Time Override', () => {
    it('Should recover from errors during time override transitions', () => {
      const session = {
        id: 'error-recovery-session',
        title: 'Error Recovery Session',
        start_time: '11:15:00',
        end_time: '12:15:00',
        date: '2025-10-21',
        location: 'Test Location',
        speaker: {}, // Initially empty object
        speakerInfo: '',
        speakers: []
      };

      // First render with empty speaker object
      const { rerender } = render(<SessionCard session={session} variant="now" />);
      expect(screen.getByText('Error Recovery Session')).toBeInTheDocument();

      // Update with valid speaker data
      const updatedSession = {
        ...session,
        speaker: 'Valid Speaker'
      };

      rerender(<SessionCard session={updatedSession} variant="now" />);
      expect(screen.getByText('Valid Speaker')).toBeInTheDocument();
    });
  });
});
