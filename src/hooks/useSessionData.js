/**
 * useSessionData Hook
 * Manages session data for Now/Next cards with offline support
 * Story 2.1: Now/Next Glance Card - Task 2 & 3
 */

import { useState, useEffect, useCallback } from 'react';
import { agendaService } from '../services/agendaService.ts';
import { getCurrentAttendeeData, getAttendeeSeatAssignments } from '../services/dataService';
import TimeService from '../services/timeService';
import { useAuth } from '../contexts/AuthContext';

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
  
  const isActive = currentTime >= start && currentTime <= end;
  
  // Debug logging for the first session
  if (session.id === '1' || session.title?.includes('Opening')) {
    console.log('🔍 isSessionActive debug:', {
      sessionId: session.id,
      sessionTitle: session.title,
      sessionDate: session.date,
      sessionStartTime: session.start_time,
      sessionEndTime: session.end_time,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      currentTime: currentTime.toISOString(),
      isActive: isActive,
      currentTimeMs: currentTime.getTime(),
      startTimeMs: start.getTime(),
      endTimeMs: end.getTime()
    });
  }
  
  return isActive;
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
  return TimeService.getCurrentTime();
};

/**
 * Filter sessions for current attendee
 * @param {Array} sessions - All sessions
 * @param {Object} attendee - Current attendee data
 * @returns {Array} Filtered sessions
 */
const filterSessionsForAttendee = (sessions, attendee) => {
  if (!attendee) {
    return sessions;
  }
  
  return sessions.filter(session => {
    if (session.session_type === 'breakout-session') {
      // Only show breakout sessions if attendee is assigned to them
      return attendee.selected_breakouts && 
             attendee.selected_breakouts.includes(session.id);
    } else {
      // Show all other session types (keynote, meal, etc.) to everyone
      return true;
    }
  });
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

  // Get authentication status
  const { isAuthenticated } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
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

      let allSessionsData = agendaResponse.data;
      
      // Store all sessions for conference start date logic
      setAllSessions(allSessionsData);
      
      // Filter sessions for current attendee based on session type and breakout assignments
      let filteredSessions = filterSessionsForAttendee(allSessionsData, attendeeData);

      setSessions(filteredSessions);
      setLastUpdated(new Date());
      
      // Debug: Log the first few sessions
      console.log('📋 Loaded sessions:', filteredSessions.slice(0, 3).map(s => ({
        id: s.id,
        title: s.title,
        date: s.date,
        start_time: s.start_time,
        end_time: s.end_time
      })));

      // Determine current and next sessions
      const currentTime = getCurrentTime();
      const activeSession = filteredSessions.find(session => 
        isSessionActive(session, currentTime)
      );
      const upcomingSession = filteredSessions.find(session => 
        isSessionUpcoming(session, currentTime)
      );

      // Enhance sessions with seat assignment data
      const enhanceSessionWithSeatInfo = (session) => {
        if (!session || !seatAssignments.length) return session || null;
        
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

      setCurrentSession(enhanceSessionWithSeatInfo(activeSession) || null);
      setNextSession(enhanceSessionWithSeatInfo(upcomingSession) || null);

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
      if (autoRefresh && isAuthenticated) {
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
  }, [autoRefresh, isAuthenticated, loadSessionData]);

  // Initial load
  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  // Auto-refresh when online and authenticated
  useEffect(() => {
    if (!autoRefresh || isOffline || !isAuthenticated) return;

    const interval = setInterval(() => {
      loadSessionData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, isOffline, isAuthenticated, refreshInterval, loadSessionData]);

  // Cache data when it changes
  useEffect(() => {
    cacheSessionData();
  }, [cacheSessionData]);

  // Listen for time override changes and re-evaluate session states
  useEffect(() => {
    const handleTimeOverrideChange = () => {
      // Re-evaluate session states when time override changes
      const currentTime = getCurrentTime();
      
      console.log('🕐 Time override change detected:', {
        currentTime: currentTime.toISOString(),
        sessionsCount: sessions.length
      });
      
      // Find current active session
      const activeSession = sessions.find(session => 
        isSessionActive(session, currentTime)
      );
      
      // Find next upcoming session
      const upcomingSession = sessions.find(session => 
        isSessionUpcoming(session, currentTime)
      );
      
      console.log('🔍 Session evaluation:', {
        activeSession: activeSession?.id || 'none',
        upcomingSession: upcomingSession?.id || 'none',
        currentTime: currentTime.toISOString()
      });
      
      // Update state only if changed (performance optimization)
      setCurrentSession(prev => {
        if (prev?.id !== activeSession?.id) {
          console.log('🔄 Time override: Session state updated', {
            previous: prev?.id,
            current: activeSession?.id,
            time: currentTime.toISOString()
          });
          return activeSession;
        }
        return prev;
      });
      
      setNextSession(prev => {
        if (prev?.id !== upcomingSession?.id) {
          console.log('🔄 Time override: Next session updated', {
            previous: prev?.id,
            current: upcomingSession?.id,
            time: currentTime.toISOString()
          });
          return upcomingSession;
        }
        return prev;
      });
    };

    // Listen for time override changes via localStorage (cross-tab)
    const handleStorageChange = (e) => {
      if (e.key === 'kn_time_override') {
        console.log('📱 Storage event detected for time override');
        handleTimeOverrideChange();
      }
    };

    // Listen for time override changes via custom event (same-tab)
    const handleTimeOverrideUpdate = () => {
      console.log('🎯 Custom event detected for time override');
      handleTimeOverrideChange();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('timeOverrideChanged', handleTimeOverrideUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('timeOverrideChanged', handleTimeOverrideUpdate);
    };
  }, [sessions]); // Re-run when sessions change to update the closure

  // Refresh data manually
  const refresh = useCallback(() => {
    loadSessionData();
  }, [loadSessionData]);

  return {
    sessions,
    allSessions,
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
