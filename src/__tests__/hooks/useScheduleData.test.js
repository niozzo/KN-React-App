/**
 * useScheduleData Hook Tests
 * Story 2.2: Personalized Schedule View - Task 4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useScheduleData from '../../hooks/useScheduleData';
import useSessionData from '../../hooks/useSessionData';

// Mock the useSessionData hook
vi.mock('../../hooks/useSessionData', () => ({
  default: vi.fn()
}));

const mockUseSessionData = vi.mocked(useSessionData);

describe('useScheduleData Hook', () => {
  const mockSessionData = {
    sessions: [
      {
        id: '1',
        title: 'Morning Keynote',
        date: '2024-12-19',
        start_time: '09:00:00',
        end_time: '10:00:00',
        location: 'Main Hall',
        speaker: 'John Doe',
        type: 'keynote'
      }
    ],
    allSessions: [],
    diningOptions: [],
    allEvents: [
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
        type: 'dining',
        isDiningEvent: true
      },
      {
        id: '4',
        title: 'Afternoon Session',
        date: '2024-12-20',
        start_time: '14:00:00',
        end_time: '15:00:00',
        location: 'Room A',
        speaker: 'Jane Smith',
        type: 'session',
        seatInfo: { table: 'Table 5', seat: 'Seat 12' }
      }
    ],
    attendee: { id: 'attendee1', name: 'Test Attendee' },
    seatAssignments: [],
    isLoading: false,
    isOffline: false,
    lastUpdated: new Date(),
    error: null,
    diningError: null,
    refresh: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSessionData.mockReturnValue(mockSessionData);
  });

  describe('Given valid session data', () => {
    it('When hook is called, Then returns all useSessionData properties', () => {
      const { result } = renderHook(() => useScheduleData());

      // Should return all original useSessionData properties
      expect(result.current.sessions).toEqual(mockSessionData.sessions);
      expect(result.current.allSessions).toEqual(mockSessionData.allSessions);
      expect(result.current.diningOptions).toEqual(mockSessionData.diningOptions);
      expect(result.current.allEvents).toEqual(mockSessionData.allEvents);
      expect(result.current.attendee).toEqual(mockSessionData.attendee);
      expect(result.current.seatAssignments).toEqual(mockSessionData.seatAssignments);
      expect(result.current.isLoading).toBe(mockSessionData.isLoading);
      expect(result.current.isOffline).toBe(mockSessionData.isOffline);
      expect(result.current.lastUpdated).toEqual(mockSessionData.lastUpdated);
      expect(result.current.error).toBe(mockSessionData.error);
      expect(result.current.diningError).toBe(mockSessionData.diningError);
      expect(result.current.refresh).toBe(mockSessionData.refresh);
    });

    it('When hook is called, Then groups events by date in scheduleData', () => {
      const { result } = renderHook(() => useScheduleData());

      expect(result.current.scheduleData.scheduleDays).toHaveLength(2);
      expect(result.current.scheduleData.scheduleDays[0].date).toBe('2024-12-19');
      expect(result.current.scheduleData.scheduleDays[1].date).toBe('2024-12-20');
    });

    it('When hook is called, Then sorts events by start time within each day', () => {
      const { result } = renderHook(() => useScheduleData());

      const day1Sessions = result.current.scheduleData.scheduleDays[0].sessions;
      expect(day1Sessions[0].start_time).toBe('09:00:00');
      expect(day1Sessions[1].start_time).toBe('10:00:00');
      expect(day1Sessions[2].start_time).toBe('12:00:00');
    });

    it('When hook is called, Then provides computed schedule properties', () => {
      const { result } = renderHook(() => useScheduleData());

      expect(result.current.hasScheduleData).toBe(true);
      expect(result.current.totalScheduleEvents).toBe(4);
      expect(result.current.scheduleDaysCount).toBe(2);
    });
  });

  describe('Given current day sessions', () => {
    it('When today has sessions, Then returns current day sessions', () => {
      // Mock today as 2024-12-19
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-12-19T10:00:00Z'));

      const { result } = renderHook(() => useScheduleData());

      expect(result.current.currentDaySessions).toHaveLength(3);
      expect(result.current.currentDaySessions[0].title).toBe('Morning Keynote');

      vi.useRealTimers();
    });

    it('When today has no sessions, Then returns empty array', () => {
      // Mock today as a day with no sessions
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-12-21T10:00:00Z'));

      const { result } = renderHook(() => useScheduleData());

      expect(result.current.currentDaySessions).toHaveLength(0);

      vi.useRealTimers();
    });
  });

  describe('Given upcoming sessions', () => {
    it('When sessions exist in next 7 days, Then returns upcoming sessions', () => {
      // Mock today as before the test dates
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-12-18T10:00:00Z'));

      const { result } = renderHook(() => useScheduleData());

      expect(result.current.upcomingSessions).toHaveLength(4);
      expect(result.current.upcomingSessions.some(s => s.title === 'Morning Keynote')).toBe(true);
      expect(result.current.upcomingSessions.some(s => s.title === 'Afternoon Session')).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('Given sessions by type', () => {
    it('When sessions have different types, Then groups by type', () => {
      const { result } = renderHook(() => useScheduleData());

      expect(result.current.sessionsByType.keynote).toHaveLength(1);
      expect(result.current.sessionsByType.coffee_break).toHaveLength(1);
      expect(result.current.sessionsByType.dining).toHaveLength(1);
      expect(result.current.sessionsByType.session).toHaveLength(1);
    });
  });

  describe('Given sessions with seat assignments', () => {
    it('When sessions have seat info, Then filters sessions with seats', () => {
      const { result } = renderHook(() => useScheduleData());

      expect(result.current.sessionsWithSeats).toHaveLength(1);
      expect(result.current.sessionsWithSeats[0].title).toBe('Afternoon Session');
      expect(result.current.sessionsWithSeats[0].seatInfo).toEqual({ table: 'Table 5', seat: 'Seat 12' });
    });
  });

  describe('Given dining events', () => {
    it('When dining events exist, Then filters dining events', () => {
      const { result } = renderHook(() => useScheduleData());

      expect(result.current.diningEvents).toHaveLength(1);
      expect(result.current.diningEvents[0].title).toBe('Lunch');
      expect(result.current.diningEvents[0].isDiningEvent).toBe(true);
    });
  });

  describe('Given empty data', () => {
    it('When no events exist, Then returns empty schedule data', () => {
      mockUseSessionData.mockReturnValue({
        ...mockSessionData,
        allEvents: []
      });

      const { result } = renderHook(() => useScheduleData());

      expect(result.current.scheduleData.scheduleDays).toHaveLength(0);
      expect(result.current.hasScheduleData).toBe(false);
      expect(result.current.totalScheduleEvents).toBe(0);
      expect(result.current.scheduleDaysCount).toBe(0);
    });
  });

  describe('Given error states', () => {
    it('When useSessionData has errors, Then passes through error states', () => {
      mockUseSessionData.mockReturnValue({
        ...mockSessionData,
        error: 'Network error',
        diningError: 'Dining service error'
      });

      const { result } = renderHook(() => useScheduleData());

      expect(result.current.error).toBe('Network error');
      expect(result.current.diningError).toBe('Dining service error');
    });

    it('When loading, Then passes through loading state', () => {
      mockUseSessionData.mockReturnValue({
        ...mockSessionData,
        isLoading: true
      });

      const { result } = renderHook(() => useScheduleData());

      expect(result.current.isLoading).toBe(true);
    });

    it('When offline, Then passes through offline state', () => {
      mockUseSessionData.mockReturnValue({
        ...mockSessionData,
        isOffline: true
      });

      const { result } = renderHook(() => useScheduleData());

      expect(result.current.isOffline).toBe(true);
    });
  });

  describe('Given performance optimization', () => {
    it('When data changes, Then memoizes computed values', () => {
      const { result, rerender } = renderHook(() => useScheduleData());

      const initialScheduleData = result.current.scheduleData;
      
      // Rerender with same data
      rerender();
      
      // Should return same memoized object
      expect(result.current.scheduleData).toBe(initialScheduleData);
    });
  });
});
