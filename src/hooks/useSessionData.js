/**
 * useSessionData Hook
 * Manages session data for Now/Next cards with offline support
 * Story 2.1: Now/Next Glance Card - Task 2 & 3
 */

import { useState, useEffect, useCallback } from 'react';
import { agendaService } from '../services/agendaService';
import { getCurrentAttendeeData, getAttendeeSeatAssignments } from '../services/dataService';

/**
 * Determine if a session is currently active
 * @param {Object} session - Session data
 * @param {Date} currentTime - Current time
 * @returns {boolean} Whether session is active
 */
const isSessionActive = (session, currentTime) => {
  if (!session.start_time || !session.end_time) return false;
  
  const start = new Date(`${session.date}T${session.start_time}`);
  const end = new Date(`${session.date}T${session.end_time}`);
  
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
  
  const start = new Date(`${session.date}T${session.start_time}`);
  return start > currentTime;
};

/**
 * Get current time (supports time override for dev/staging)
 * @returns {Date} Current time or override time
 */
const getCurrentTime = () => {
  // Check for time override in dev/staging environments
  if (process.env.NODE_ENV !== 'production') {
    const overrideTime = localStorage.getItem('kn_time_override');
    if (overrideTime) {
      const overrideDate = new Date(overrideTime);
      const now = new Date();
      const timeDiff = now.getTime() - new Date(overrideTime).getTime();
      // Return override time + elapsed time since override was set
      return new Date(overrideDate.getTime() + timeDiff);
    }
  }
  return new Date();
};

/**
 * Filter sessions for current attendee
 * @param {Array} sessions - All sessions
 * @param {Object} attendee - Current attendee data
 * @returns {Array} Filtered sessions
 */
const filterSessionsForAttendee = (sessions, attendee) => {
  if (!attendee || !attendee.selected_agenda_items) {
    return sessions;
  }
  
  const selectedIds = attendee.selected_agenda_items.map(item => item.id);
  return sessions.filter(session => selectedIds.includes(session.id));
};

/**
 * useSessionData Hook
 * @param {Object} options - Configuration options
 * @returns {Object} Session data state and utilities
 */
export const useSessionData = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 300000, // 5 minutes
    enableOfflineMode = true
  } = options;

  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [attendee, setAttendee] = useState(null);
  const [seatAssignments, setSeatAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Load session data
  const loadSessionData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load attendee data
      const attendeeData = await getCurrentAttendeeData();
      setAttendee(attendeeData);

      // Load seat assignments for the attendee
      if (attendeeData && attendeeData.id) {
        try {
          const seatData = await getAttendeeSeatAssignments(attendeeData.id);
          setSeatAssignments(seatData);
        } catch (seatError) {
          console.warn('⚠️ Could not load seat assignments:', seatError);
          setSeatAssignments([]);
        }
      }

      // Load agenda items
      const agendaResponse = await agendaService.getActiveAgendaItems();
      if (!agendaResponse.success) {
        throw new Error(agendaResponse.error || 'Failed to load agenda items');
      }

      let allSessions = agendaResponse.data;
      
      // Filter sessions for current attendee if they have selections
      if (attendeeData && attendeeData.selected_agenda_items) {
        allSessions = filterSessionsForAttendee(allSessions, attendeeData);
      }

      setSessions(allSessions);
      setLastUpdated(new Date());

      // Determine current and next sessions
      const currentTime = getCurrentTime();
      const activeSession = allSessions.find(session => 
        isSessionActive(session, currentTime)
      );
      const upcomingSession = allSessions.find(session => 
        isSessionUpcoming(session, currentTime)
      );

      // Enhance sessions with seat assignment data
      const enhanceSessionWithSeatInfo = (session) => {
        if (!session || !seatAssignments.length) return session;
        
        // Find seat assignment for this session (if any)
        const seatAssignment = seatAssignments.find(seat => 
          seat.seating_configuration_id === session.seating_configuration_id
        );
        
        return {
          ...session,
          seatInfo: seatAssignment ? {
            table: seatAssignment.table_name,
            seat: seatAssignment.seat_number,
            position: seatAssignment.seat_position
          } : null
        };
      };

      setCurrentSession(enhanceSessionWithSeatInfo(activeSession));
      setNextSession(enhanceSessionWithSeatInfo(upcomingSession));

    } catch (err) {
      console.error('❌ Error loading session data:', err);
      setError(err.message);
      
      // Try to load from cache if offline
      if (enableOfflineMode && isOffline) {
        try {
          const cachedData = localStorage.getItem('kn_cached_sessions');
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            setSessions(parsed.sessions || []);
            setCurrentSession(parsed.currentSession || null);
            setNextSession(parsed.nextSession || null);
            setLastUpdated(new Date(parsed.lastUpdated));
          }
        } catch (cacheErr) {
          console.warn('⚠️ Failed to load cached session data:', cacheErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [enableOfflineMode, isOffline]);

  // Cache session data for offline use
  const cacheSessionData = useCallback(() => {
    if (enableOfflineMode && sessions.length > 0) {
      const cacheData = {
        sessions,
        currentSession,
        nextSession,
        lastUpdated: lastUpdated?.toISOString()
      };
      localStorage.setItem('kn_cached_sessions', JSON.stringify(cacheData));
    }
  }, [sessions, currentSession, nextSession, lastUpdated, enableOfflineMode]);

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (autoRefresh) {
        loadSessionData();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoRefresh, loadSessionData]);

  // Initial load
  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  // Auto-refresh when online
  useEffect(() => {
    if (!autoRefresh || isOffline) return;

    const interval = setInterval(() => {
      loadSessionData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, isOffline, refreshInterval, loadSessionData]);

  // Cache data when it changes
  useEffect(() => {
    cacheSessionData();
  }, [cacheSessionData]);

  // Refresh data manually
  const refresh = useCallback(() => {
    loadSessionData();
  }, [loadSessionData]);

  return {
    sessions,
    currentSession,
    nextSession,
    attendee,
    seatAssignments,
    isLoading,
    isOffline,
    lastUpdated,
    error,
    refresh
  };
};

export default useSessionData;
