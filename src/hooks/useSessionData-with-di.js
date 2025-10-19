/**
 * useSessionData Hook with Dependency Injection Support
 * Manages session data for Now/Next cards with offline support
 * Story 2.1: Now/Next Glance Card - Task 2 & 3
 * 
 * This version supports dependency injection for better testability
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Service imports - can be overridden for testing
let agendaService, dataService, timeService;

// Initialize services (can be overridden for testing)
const initializeServices = async () => {
  if (!agendaService) {
    const agendaModule = await import('../services/agendaService.ts');
    agendaService = agendaModule.agendaService;
  }
  if (!dataService) {
    const dataModule = await import('../services/dataService');
    dataService = dataModule;
  }
  if (!timeService) {
    const timeModule = await import('../services/timeService');
    timeService = timeModule.default;
  }
};

// Dependency injection function for testing
export const injectServices = (services) => {
  if (services.agendaService) {
    agendaService = services.agendaService;
  }
  if (services.dataService) {
    dataService = services.dataService;
  }
  if (services.timeService) {
    timeService = services.timeService;
  }
};

// Reset services to defaults
export const resetServices = () => {
  agendaService = null;
  dataService = null;
  timeService = null;
};

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
  return currentTime < start;
};

/**
 * Filter sessions based on attendee's selected breakouts
 * @param {Array} sessions - All sessions
 * @param {Object} attendee - Attendee data
 * @returns {Array} Filtered sessions
 */
const filterSessionsForAttendee = (sessions, attendee) => {
  if (!attendee || !attendee.selected_breakouts) {
    return sessions;
  }

  return sessions.filter(session => {
    // Always include non-breakout sessions
    if (session.session_type !== 'breakout') {
      return true;
    }
    
    // For breakout sessions, check if attendee is assigned
    return attendee.selected_breakouts.includes(session.id);
  });
};

/**
 * Find current and next sessions
 * @param {Array} sessions - All sessions
 * @param {Date} currentTime - Current time
 * @returns {Object} Current and next session
 */
const findCurrentAndNextSessions = (sessions, currentTime) => {
  let currentSession = null;
  let nextSession = null;

  for (const session of sessions) {
    if (isSessionActive(session, currentTime)) {
      currentSession = session;
    } else if (isSessionUpcoming(session, currentTime)) {
      if (!nextSession) {
        nextSession = session;
      }
    }
  }

  return { currentSession, nextSession };
};

/**
 * useSessionData Hook
 * @returns {Object} Session data and loading state
 */
export const useSessionData = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendee, setAttendee] = useState(null);

  // Initialize services
  useEffect(() => {
    initializeServices();
  }, []);

  /**
   * Load session data
   */
  const loadSessionData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load agenda items
      const agendaResponse = await agendaService.getActiveAgendaItems();
      
      if (!agendaResponse.success) {
        throw new Error(agendaResponse.error || 'Failed to load agenda items');
      }

      let allSessions = agendaResponse.data || [];

      // Load attendee data for filtering
      const attendeeData = await dataService.getCurrentAttendeeData();
      setAttendee(attendeeData);

      // Filter sessions based on attendee's selections
      const filteredSessions = filterSessionsForAttendee(allSessions, attendeeData);
      setSessions(filteredSessions);

      // Get current time (respects time override)
      const currentTime = timeService.getCurrentTime();
      
      // Find current and next sessions
      const { currentSession: current, nextSession: next } = findCurrentAndNextSessions(filteredSessions, currentTime);
      
      setCurrentSession(current);
      setNextSession(next);

    } catch (err) {
      console.error('Error loading session data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Update session state based on current time
   */
  const updateSessionState = useCallback(() => {
    if (sessions.length === 0) return;

    const currentTime = timeService.getCurrentTime();
    const { currentSession: current, nextSession: next } = findCurrentAndNextSessions(sessions, currentTime);
    
    setCurrentSession(current);
    setNextSession(next);
  }, [sessions]);

  // Load data on mount and when user changes
  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  // Update session state when time changes (for time override)
  useEffect(() => {
    if (sessions.length === 0) return;

    // Update immediately
    updateSessionState();

    // Set up interval to check for time changes
    const interval = setInterval(updateSessionState, 1000);

    return () => clearInterval(interval);
  }, [sessions, updateSessionState]);

  return {
    sessions,
    currentSession,
    nextSession,
    loading,
    error,
    attendee,
    refresh: loadSessionData
  };
};
