/**
 * useScheduleData Hook
 * Manages personalized schedule data with day grouping and filtering
 * Story 2.2: Personalized Schedule View - Task 4
 */

import { useMemo } from 'react';
import useSessionData from './useSessionData';

/**
 * Custom hook for personalized schedule view
 * Leverages existing useSessionData infrastructure with schedule-specific filtering
 */
const useScheduleData = () => {
  // Leverage existing comprehensive data integration
  const {
    sessions,
    allSessions,
    diningOptions,
    allEvents,
    attendee,
    seatAssignments,
    isLoading,
    isOffline,
    lastUpdated,
    error,
    diningError,
    refresh
  } = useSessionData();

  // Filter and group sessions for schedule view
  const scheduleData = useMemo(() => {
    // Combine all sessions and dining events for complete schedule
    const allScheduleEvents = [...allEvents] || [];
    
    // Group events by date
    const groupedByDate = allScheduleEvents.reduce((groups, event) => {
      const date = event.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
      return groups;
    }, {});

    // Sort events within each day by start time
    Object.keys(groupedByDate).forEach(date => {
      groupedByDate[date].sort((a, b) => {
        if (!a.start_time || !b.start_time) return 0;
        return a.start_time.localeCompare(b.start_time);
      });
    });

    // Convert to array format for ScheduleView component
    const scheduleDays = Object.keys(groupedByDate)
      .sort((a, b) => new Date(a) - new Date(b)) // Sort days chronologically
      .map(date => ({
        date,
        sessions: groupedByDate[date]
      }));

    return {
      scheduleDays,
      totalEvents: allScheduleEvents.length,
      hasEvents: allScheduleEvents.length > 0
    };
  }, [allEvents]);

  // Get current day's sessions for quick access
  const currentDaySessions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return scheduleData.scheduleDays.find(day => day.date === today)?.sessions || [];
  }, [scheduleData]);

  // Get upcoming sessions (next 7 days)
  const upcomingSessions = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return scheduleData.scheduleDays
      .filter(day => {
        const dayDate = new Date(day.date);
        return dayDate >= today && dayDate <= nextWeek;
      })
      .flatMap(day => day.sessions);
  }, [scheduleData]);

  // Get sessions by type for filtering
  const sessionsByType = useMemo(() => {
    const types = {};
    scheduleData.scheduleDays.forEach(day => {
      day.sessions.forEach(session => {
        const type = session.type || 'session';
        if (!types[type]) {
          types[type] = [];
        }
        types[type].push(session);
      });
    });
    return types;
  }, [scheduleData]);

  // Get sessions with seat assignments
  const sessionsWithSeats = useMemo(() => {
    return scheduleData.scheduleDays
      .flatMap(day => day.sessions)
      .filter(session => session.seatInfo || session.seatAssignments);
  }, [scheduleData]);

  // Get dining events specifically
  const diningEvents = useMemo(() => {
    return scheduleData.scheduleDays
      .flatMap(day => day.sessions)
      .filter(session => session.type === 'dining' || session.isDiningEvent);
  }, [scheduleData]);

  return {
    // Core data from useSessionData
    sessions,
    allSessions,
    diningOptions,
    allEvents,
    attendee,
    seatAssignments,
    isLoading,
    isOffline,
    lastUpdated,
    error,
    diningError,
    refresh,
    
    // Schedule-specific data
    scheduleData,
    currentDaySessions,
    upcomingSessions,
    sessionsByType,
    sessionsWithSeats,
    diningEvents,
    
    // Computed properties
    hasScheduleData: scheduleData.hasEvents,
    totalScheduleEvents: scheduleData.totalEvents,
    scheduleDaysCount: scheduleData.scheduleDays.length
  };
};

export default useScheduleData;
