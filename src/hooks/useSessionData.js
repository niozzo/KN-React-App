/**
 * useSessionData Hook - Simplified Version
 * Story 2.1: Now/Next Glance Card - Task 9 (TDD)
 * 
 * Simplified version that uses the new simplified cache architecture
 */

import { useState, useEffect, useCallback } from 'react';
import { agendaService } from '../services/agendaService';
import { getCurrentAttendeeData, getAttendeeSeatAssignments, getAllDiningOptions, getAllSeatingConfigurations } from '../services/dataService';
import TimeService from '../services/timeService';
import { useAuth } from '../contexts/AuthContext';
import { simplifiedDataService } from '../services/simplifiedDataService';

/**
 * Determine if a session is currently active
 * @param {Object} session - Session data
 * @param {Date} currentTime - Current time
 * @returns {boolean} Whether session is active
 */
const isSessionActive = (session, currentTime) => {
  if (!session.start_time) return false;
  
  // ✅ FIX: Parse date without timezone conversion to avoid day shift
  // Split date and time, create Date objects in local timezone
  const [year, month, day] = session.date.split('-').map(Number);
  const [startHour, startMin, startSec] = session.start_time.split(':').map(Number);
  const start = new Date(year, month - 1, day, startHour, startMin, startSec || 0);
  
  // If no end time, assume it ends at midnight
  let end;
  if (session.end_time) {
    const [endHour, endMin, endSec] = session.end_time.split(':').map(Number);
    end = new Date(year, month - 1, day, endHour, endMin, endSec || 0);
  } else {
    end = new Date(year, month - 1, day, 23, 59, 59);
  }
  
  return currentTime >= start && currentTime <= end;
};

/**
 * Determine if a session is upcoming
 * @param {Object} session - Session data
 * @param {Date} currentTime - Current time
 * @returns {boolean} Whether session is upcoming
 */
const isSessionUpcoming = (session, currentTime) => {
  if (!session.start_time) return false;
  
  // ✅ FIX: Parse date without timezone conversion to avoid day shift
  // Split date and time, create Date object in local timezone
  const [year, month, day] = session.date.split('-').map(Number);
  const [startHour, startMin, startSec] = session.start_time.split(':').map(Number);
  const start = new Date(year, month - 1, day, startHour, startMin, startSec || 0);
  
  const isUpcoming = currentTime < start;
  
  return isUpcoming;
};

/**
 * Filter sessions for current attendee
 * @param {Array} sessions - All sessions
 * @param {Object} attendee - Current attendee data
 * @returns {Array} Filtered sessions
 */
const filterSessionsForAttendee = (sessions, attendee) => {
  if (!attendee) {
    console.log('🔍 DEBUG: No attendee data, returning all sessions');
    return sessions;
  }
  
  console.log('🔍 DEBUG: Filtering sessions for attendee:', {
    attendee_id: attendee.id,
    selected_breakouts: attendee.selected_breakouts,
    sessions_count: sessions.length
  });
  
  const filteredSessions = sessions.filter(session => {
    if (session.session_type === 'breakout') {
      console.log('🔍 DEBUG: Processing breakout session:', {
        session_id: session.id,
        session_title: session.title,
        attendee_breakouts: attendee.selected_breakouts,
        attendee_breakouts_stringified: JSON.stringify(attendee.selected_breakouts),
        session_id_type: typeof session.id,
        is_assigned: attendee.selected_breakouts?.includes(session.id),
        comparison_details: {
          session_id: session.id,
          attendee_breakouts: attendee.selected_breakouts,
          includes_check: attendee.selected_breakouts?.includes(session.id)
        }
      });
      
      // For breakout sessions, only show if user is assigned
      if (attendee && attendee.selected_breakouts) {
        return attendee.selected_breakouts.includes(session.id);
      }
      
      // If no attendee data, don't show breakout sessions
      return false;
    } else {
      // Show all other session types (keynote, meal, etc.) to everyone
      return true;
    }
  });

  console.log('🔍 DEBUG: Filtered sessions result:', {
    original_count: sessions.length,
    filtered_count: filteredSessions.length,
    filtered_sessions: filteredSessions.map(s => ({ id: s.id, title: s.title, type: s.session_type }))
  });

  return filteredSessions;
};

/**
 * Enhanced session data with additional computed properties
 * @param {Array} sessions - Array of session objects
 * @param {Object} attendee - Current attendee data
 * @param {Array} seatAssignments - Seat assignments
 * @param {Array} seatingConfigurations - Seating configurations
 * @returns {Array} Enhanced sessions
 */
const enhanceSessionData = (sessions, attendee, seatAssignments, seatingConfigurations) => {
  const currentTime = TimeService.getCurrentTime();
  
  return sessions.map(session => {
    const isActive = isSessionActive(session, currentTime);
    const isUpcoming = isSessionUpcoming(session, currentTime);
    
    // Enhanced seat assignment logic (from working build)
    const enhanceEventWithSeatInfo = (event) => {
      if (!event) {
        return event || null;
      }
      
      // Look for seat assignments if we have the necessary data
      if (!seatAssignments.length || !seatingConfigurations.length) {
        return event;
      }
      
      // Step 1: Find the seating configuration for this event (bridge table lookup)
      let seatingConfig = null;
      
      if (event.type === 'dining') {
        // For dining events, match by dining_option_id
        seatingConfig = seatingConfigurations.find(
          config => config.dining_option_id === event.id
        );
      } else {
        // For agenda items, match by agenda_item_id
        seatingConfig = seatingConfigurations.find(
          config => config.agenda_item_id === event.id
        );
      }
      
      // If no seating configuration found, return event without seat info
      if (!seatingConfig) {
        return event;
      }
      
      // Step 2: Find seat assignment using the configuration ID from bridge table
      const seatAssignment = seatAssignments.find(seat => 
        seat.seating_configuration_id === seatingConfig.id
      );
      
      // Step 3: Return enhanced event with seat info
      return {
        ...event,
        seatInfo: seatAssignment ? {
          table: seatAssignment.table_name,
          seat: seatAssignment.seat_number,
          row: seatAssignment.row_number,
          column: seatAssignment.column_number,
          position: seatAssignment.seat_position
        } : null
      };
    };
    
    return enhanceEventWithSeatInfo({
      ...session,
      isActive,
      isUpcoming
    });
  });
};

/**
 * Convert dining options to session format for unified display
 * @param {Array} diningOptions - Array of dining option objects
 * @returns {Array} Array of session objects
 */
const convertDiningToSessions = (diningOptions) => {
  console.log('🍽️ convertDiningToSessions called with:', { diningOptionsLength: diningOptions?.length || 0, diningOptions });
  
  if (!diningOptions || diningOptions.length === 0) {
    console.log('🍽️ No dining options to convert');
    return [];
  }
  
  const currentTime = TimeService.getCurrentTime();
  
  const sessions = diningOptions.map(dining => {
    // ✅ FIX: Map dining option fields to session format for timing functions
    const sessionForTiming = {
      ...dining,
      start_time: dining.time,  // Map 'time' to 'start_time'
      end_time: null            // Set to null for dining events (no end time)
    };
    
    // Calculate isActive and isUpcoming for dining options using mapped fields
    const isActive = isSessionActive(sessionForTiming, currentTime);
    const isUpcoming = isSessionUpcoming(sessionForTiming, currentTime);
    
    return {
      id: `dining-${dining.id}`,
      title: dining.name,
      description: dining.location || '',
      date: dining.date,
      start_time: dining.time,
      end_time: null, // Dining events have no explicit end time
      location: dining.location || '',
      session_type: 'meal',
      type: 'dining',
      capacity: dining.capacity || 0,
      registered_count: 0,
      attendee_selection: 'everyone',
      selected_attendees: [],
      isActive,
      isUpcoming,
      seating_notes: dining.seating_notes || '',
      seating_type: dining.seating_type || 'open',
      speakers: [],
      speakerInfo: '',
      speaker: '',
      seatInfo: null,
      // Dining-specific fields
      diningOption: true,
      originalDiningId: dining.id,
      seating_config: dining
    };
  });
  
  console.log('🍽️ Converted dining sessions:', { sessionsLength: sessions?.length || 0, sessions });
  return sessions;
};

/**
 * Merge and sort sessions and dining options by time
 * @param {Array} sessions - Array of session objects
 * @param {Array} diningOptions - Array of dining option objects
 * @returns {Array} Combined and sorted array
 */
const mergeAndSortEvents = (sessions, diningOptions, seatAssignments = [], seatingConfigurations = []) => {
  
  // Convert dining options to session format
  const diningSessions = convertDiningToSessions(diningOptions);
  
  // Enhance dining sessions with seat assignment data
  const enhancedDiningSessions = diningSessions.map(diningSession => {
    // Enhanced seat assignment logic for dining events
    if (!seatAssignments.length || !seatingConfigurations.length) {
      return diningSession;
    }
    
    // Step 1: Find the seating configuration for this dining event
    // Use originalDiningId to match against dining_option_id in seating configs
    const seatingConfig = seatingConfigurations.find(
      config => config.dining_option_id === diningSession.originalDiningId
    );
    
    // If no seating configuration found, return dining session without seat info
    if (!seatingConfig) {
      return diningSession;
    }
    
    // Step 2: Find seat assignment using the configuration ID from bridge table
    const seatAssignment = seatAssignments.find(seat => 
      seat.seating_configuration_id === seatingConfig.id
    );
    
    // Step 3: Return enhanced dining session with seat info
    return {
      ...diningSession,
      seatInfo: seatAssignment ? {
        table: seatAssignment.table_name,
        seat: seatAssignment.seat_number,
        row: seatAssignment.row_number,
        column: seatAssignment.column_number,
        position: seatAssignment.seat_position
      } : null
    };
  });
  
  // Combine sessions and enhanced dining
  const allEvents = [...sessions, ...enhancedDiningSessions];
  
  // Sort by date and time
  const sortedEvents = allEvents.sort((a, b) => {
    // First sort by date
    const dateComparison = (a.date || '').localeCompare(b.date || '');
    if (dateComparison !== 0) return dateComparison;
    
    // Then sort by start time
    return (a.start_time || '').localeCompare(b.start_time || '');
  });
  
  return sortedEvents;
};

/**
 * Apply seat assignment normalization for October 21st
 * @param {Array} seatData - Raw seat assignments
 * @param {Object} attendeeData - Current attendee data
 * @param {Array} agendaItems - All agenda items
 * @param {Array} seatingData - All seating configurations
 * @returns {Array} Normalized seat assignments
 */
const applySeatAssignmentNormalization = async (seatData, attendeeData, agendaItems, seatingData) => {
  try {
    const { seatAssignmentNormalizationService } = await import('../services/seatAssignmentNormalizationService');
    
    if (agendaItems && seatingData && attendeeData?.id) {
      const normalizedSeatData = seatAssignmentNormalizationService.normalizeSeatAssignmentsForDate(
        seatData,
        seatingData,
        agendaItems,
        '2025-10-21',
        attendeeData.id
      );
      console.log(`🔄 Seat assignment normalization applied for user ${attendeeData.id}`);
      return normalizedSeatData;
    }
    
    return seatData;
  } catch (normalizationError) {
    console.warn('⚠️ Seat assignment normalization failed:', normalizationError);
    return seatData;
  }
};

/**
 * Custom hook for managing session data
 * @param {boolean} enableOfflineMode - Whether to enable offline mode
 * @param {boolean} autoRefresh - Whether to auto-refresh data
 * @returns {Object} Session data and loading state
 */
export default function useSessionData(enableOfflineMode = true, autoRefresh = true) {
  const { isAuthenticated } = useAuth();

  // State
  const [sessions, setSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [diningOptions, setDiningOptions] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [attendee, setAttendee] = useState(null);
  const [seatAssignments, setSeatAssignments] = useState([]);
  const [seatingConfigurations, setSeatingConfigurations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [diningError, setDiningError] = useState(null);

  // Load session data
  const loadSessionData = useCallback(async () => {
    // Don't load data if not authenticated
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Load attendee data
      const attendeeData = await getCurrentAttendeeData();
      setAttendee(attendeeData);

      // Load seat assignments for the current attendee
      const seatData = await getAttendeeSeatAssignments(attendeeData.id);
      
      // Load seating configurations
      const seatingData = await getAllSeatingConfigurations();
      setSeatingConfigurations(seatingData);
      
      // Load agenda items for normalization and sessions
      const agendaResponse = await agendaService.getActiveAgendaItems();
      const agendaItems = agendaResponse.success ? agendaResponse.data : [];
      
      // Apply seat assignment normalization for October 21st
      const normalizedSeatData = await applySeatAssignmentNormalization(
        seatData,
        attendeeData,
        agendaItems,
        seatingData
      );
      setSeatAssignments(normalizedSeatData);

      // Load dining options
      let diningData = [];
      try {
        diningData = await getAllDiningOptions();
        setDiningOptions(diningData);
        setDiningError(null);
      } catch (diningErr) {
        console.error('Failed to load dining options:', diningErr);
        setDiningError(diningErr.message);
      }

      // Use agenda items for session data (already loaded above)
      let allSessionsData = agendaItems;

      // Enhance session data
      const enhancedSessions = enhanceSessionData(
        allSessionsData,
        attendeeData,
        normalizedSeatData,
        seatingData
      );

      // 🔍 DEBUG: Log attendee data and sessions for debugging
      console.log('🔍 DEBUG: Attendee data:', {
        id: attendeeData?.id,
        selected_breakouts: attendeeData?.selected_breakouts,
        selected_breakouts_type: typeof attendeeData?.selected_breakouts,
        selected_breakouts_length: attendeeData?.selected_breakouts?.length,
        selected_breakouts_content: attendeeData?.selected_breakouts
      });
      
      console.log('🔍 DEBUG: All sessions before filtering:', enhancedSessions.map(s => ({
        id: s.id,
        title: s.title,
        session_type: s.session_type,
        type: s.type
      })));
      
      // Filter sessions for current attendee (breakout sessions only show assigned tracks)
      const attendeeFilteredSessions = filterSessionsForAttendee(enhancedSessions, attendeeData);
      
      console.log('🔍 DEBUG: Sessions after filtering:', attendeeFilteredSessions.map(s => ({
        id: s.id,
        title: s.title,
        session_type: s.session_type,
        type: s.type
      })));

      // Filter sessions based on current time
      const currentTime = TimeService.getCurrentTime();
      const filteredSessions = attendeeFilteredSessions.filter(session => {
        // Show active sessions
        if (session.isActive) return true;
        
        // Show upcoming sessions within next 2 hours
        if (session.isUpcoming) {
          const start = new Date(`${session.date}T${session.start_time}`);
          const timeDiff = start.getTime() - currentTime.getTime();
          return timeDiff <= 2 * 60 * 60 * 1000; // 2 hours
        }
        
        return false;
      });

      // Merge sessions and dining options for unified display
      const allEventsCombined = mergeAndSortEvents(attendeeFilteredSessions, diningData || [], normalizedSeatData, seatingData);
      
      // Set state
      setSessions(filteredSessions);
      setAllSessions(enhancedSessions);
      setAllEvents(allEventsCombined);
      setLastUpdated(new Date());

      // Find current and next sessions from ALL events (including dining options)
      console.log('🔍 Finding current/next sessions from allEventsCombined:', { 
        allEventsLength: allEventsCombined?.length || 0,
        allEvents: allEventsCombined 
      });
      
      const activeSession = allEventsCombined.find(s => s.isActive);
      const upcomingSession = allEventsCombined.find(s => s.isUpcoming);
      
      // ✅ DEBUG: Log all upcoming sessions to see what's available
      const allUpcomingSessions = allEventsCombined.filter(s => s.isUpcoming);
      console.log('🔍 All upcoming sessions:', allUpcomingSessions.map(s => ({
        id: s.id,
        title: s.title,
        date: s.date,
        start_time: s.start_time,
        type: s.session_type || s.type,
        diningOption: s.diningOption,
        isUpcoming: s.isUpcoming
      })));
      
      console.log('🔍 Current/Next session detection:', {
        activeSession: activeSession ? { 
          id: activeSession.id, 
          title: activeSession.title, 
          isActive: activeSession.isActive,
          date: activeSession.date,
          start_time: activeSession.start_time,
          type: activeSession.session_type || activeSession.type,
          diningOption: activeSession.diningOption
        } : null,
        upcomingSession: upcomingSession ? { 
          id: upcomingSession.id, 
          title: upcomingSession.title, 
          isUpcoming: upcomingSession.isUpcoming,
          date: upcomingSession.date,
          start_time: upcomingSession.start_time,
          type: upcomingSession.session_type || upcomingSession.type,
          diningOption: upcomingSession.diningOption
        } : null
      });
      
      setCurrentSession(activeSession || null);
      setNextSession(upcomingSession || null);

    } catch (err) {
      console.error('Failed to load session data:', err);
      setError(err.message);
      
      // Try to load from cache if offline
      if (isOffline) {
        try {
          const cachedData = localStorage.getItem('kn_cached_sessions');
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            setSessions(parsed.sessions || []);
            setDiningOptions(parsed.diningOptions || []);
            setAllEvents(parsed.allEvents || []);
            setCurrentSession(parsed.currentSession || null);
            setNextSession(parsed.nextSession || null);
            setLastUpdated(new Date(parsed.lastUpdated));
          }
        } catch (cacheErr) {
          console.error('Failed to load from cache:', cacheErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isOffline, isAuthenticated]);

  // Refresh data
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      // Load fresh data including seat assignments
      const [agendaResponse, diningResponse, freshSeatData, freshSeatingData] = await Promise.all([
        agendaService.getActiveAgendaItems(),
        getAllDiningOptions(),
        getAttendeeSeatAssignments(attendee?.id),
        getAllSeatingConfigurations()
      ]);
      
      // Apply seat assignment normalization for October 21st
      const agendaItems = agendaResponse.success ? agendaResponse.data : [];
      const normalizedSeatData = await applySeatAssignmentNormalization(
        freshSeatData,
        attendee,
        agendaItems,
        freshSeatingData
      );
      
      // Update seat assignments and seating configurations state
      setSeatAssignments(normalizedSeatData);
      setSeatingConfigurations(freshSeatingData);
      
      if (agendaResponse.success && agendaResponse.data && agendaResponse.data.length > 0) {
        const enhancedSessions = enhanceSessionData(
          agendaResponse.data,
          attendee,
          normalizedSeatData,
          freshSeatingData
        );
        
        // Filter sessions for current attendee (breakout sessions only show assigned tracks)
        const attendeeFilteredSessions = filterSessionsForAttendee(enhancedSessions, attendee);
        
        // Merge sessions and dining options for unified display
        const allEventsCombined = mergeAndSortEvents(attendeeFilteredSessions, diningResponse || [], normalizedSeatData, freshSeatingData);
        
        // Find current and next sessions from ALL events (including dining options)
        const activeSession = allEventsCombined.find(s => s.isActive);
        const upcomingSession = allEventsCombined.find(s => s.isUpcoming);
        
        setSessions(attendeeFilteredSessions);
        setAllSessions(enhancedSessions);
        setAllEvents(allEventsCombined);
        setCurrentSession(activeSession || null);
        setNextSession(upcomingSession || null);
        setLastUpdated(new Date());
      }
      
      if (diningResponse) {
        setDiningOptions(diningResponse);
        setDiningError(null);
      }
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError(err.message);
    }
  }, [isAuthenticated, attendee]); // Add attendee dependency for seat assignment reload

  // Event handlers
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (autoRefresh && isAuthenticated) {
        loadSessionData();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoRefresh, isAuthenticated]); // Remove loadSessionData dependency

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadSessionData();
  }, [isAuthenticated]); // Only depend on authentication status

  // Auto-refresh when online
  useEffect(() => {
    if (!autoRefresh || isOffline || !isAuthenticated) return;

    const interval = setInterval(() => {
      refreshData();
    }, 6 * 60 * 60 * 1000); // 6 hours

    return () => clearInterval(interval);
  }, [autoRefresh, isOffline, isAuthenticated, refreshData]);

  // Listen for time override changes and re-evaluate session states
  useEffect(() => {
    const handleTimeOverrideChange = () => {
      const currentTime = TimeService.getCurrentTime();
      
      const activeEvent = allEvents.find(event => 
        isSessionActive(event, currentTime)
      );
      
      const upcomingEvent = allEvents
        .filter(event => isSessionUpcoming(event, currentTime))
        .sort((a, b) => {
          const dateComparison = (a.date || '').localeCompare(b.date || '');
          if (dateComparison !== 0) return dateComparison;
          const timeA = a.start_time || a.time || '';
          const timeB = b.start_time || b.time || '';
          return timeA.localeCompare(timeB);
        })[0];
      
      setCurrentSession(prev => 
        prev?.id !== activeEvent?.id ? (activeEvent || null) : prev
      );
      
      setNextSession(prev => 
        prev?.id !== upcomingEvent?.id ? (upcomingEvent || null) : prev
      );
    };

    const handleStorageChange = (e) => {
      if (e.key === 'kn_time_override' || e.key === 'kn_time_override_start') {
        handleTimeOverrideChange();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('timeOverrideChanged', handleTimeOverrideChange);
    window.addEventListener('timeOverrideBoundaryCrossed', handleTimeOverrideChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('timeOverrideChanged', handleTimeOverrideChange);
      window.removeEventListener('timeOverrideBoundaryCrossed', handleTimeOverrideChange);
    };
  }, [allEvents]);

  // Real-time update mechanism for both real time and time override
  useEffect(() => {
    if (allEvents.length === 0) return;

    const isOverrideActive = TimeService.isOverrideActive();
    
    if (isOverrideActive) {
      TimeService.startBoundaryMonitoring();
    }

    const handleRealTimeUpdate = () => {
      const currentTime = TimeService.getCurrentTime();
      
      const activeEvent = allEvents.find(event => 
        isSessionActive(event, currentTime)
      );
      
      const upcomingEvent = allEvents
        .filter(event => isSessionUpcoming(event, currentTime))
        .sort((a, b) => {
          const dateComparison = (a.date || '').localeCompare(b.date || '');
          if (dateComparison !== 0) return dateComparison;
          const timeA = a.start_time || a.time || '';
          const timeB = b.start_time || b.time || '';
          return timeA.localeCompare(timeB);
        })[0];
      
      setCurrentSession(activeEvent || null);
      setNextSession(upcomingEvent || null);
    };

    const interval = setInterval(handleRealTimeUpdate, 1000);

    return () => {
      clearInterval(interval);
      TimeService.stopBoundaryMonitoring();
    };
  }, [allEvents]);

  return {
    // Data
    sessions,
    allSessions,
    diningOptions,
    allEvents,
    currentSession,
    nextSession,
    attendee,
    seatAssignments,
    seatingConfigurations,
    
    // State
    isLoading,
    isOffline,
    lastUpdated,
    error,
    diningError,
    
    // Actions
    refreshData,
    loadSessionData
  };
}