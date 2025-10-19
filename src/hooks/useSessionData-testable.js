/**
 * useSessionData Hook - Testable Version
 * Manages session data for Now/Next cards with offline support
 * Story 2.1: Now/Next Glance Card - Task 2 & 3
 * 
 * This version is designed for easy testing with dependency injection
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Default service implementations
let defaultAgendaService, defaultDataService, defaultTimeService;

// Initialize default services
const initDefaultServices = async () => {
  // Only initialize if services haven't been injected
  if (getAgendaService === (() => defaultAgendaService)) {
    if (!defaultAgendaService) {
      const agendaModule = await import('../services/agendaService.ts');
      defaultAgendaService = agendaModule.agendaService;
    }
  }
  if (getDataService === (() => defaultDataService)) {
    if (!defaultDataService) {
      const dataModule = await import('../services/dataService');
      defaultDataService = dataModule;
    }
  }
  if (getTimeService === (() => defaultTimeService)) {
    if (!defaultTimeService) {
      const timeModule = await import('../services/timeService');
      defaultTimeService = timeModule.default;
    }
  }
};

// Service getters (can be overridden for testing)
let getAgendaService = async () => {
  if (!defaultAgendaService) {
    const agendaModule = await import('../services/agendaService.ts');
    defaultAgendaService = agendaModule.agendaService;
  }
  return defaultAgendaService;
};

let getDataService = async () => {
  if (!defaultDataService) {
    const dataModule = await import('../services/dataService');
    defaultDataService = dataModule;
  }
  return defaultDataService;
};

let getTimeService = () => {
  if (!defaultTimeService) {
    // For time service, we need to handle this synchronously
    // This is a fallback - in tests, services should be injected
    throw new Error('TimeService not initialized. Please inject services for testing.');
  }
  return defaultTimeService;
};

// Dependency injection functions for testing
export const injectServices = (services) => {
  if (services.agendaService) {
    getAgendaService = () => services.agendaService;
  }
  if (services.dataService) {
    getDataService = () => services.dataService;
  }
  if (services.timeService) {
    getTimeService = () => services.timeService;
  }
};

export const resetServices = () => {
  getAgendaService = () => defaultAgendaService;
  getDataService = () => defaultDataService;
  getTimeService = () => defaultTimeService;
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
    
    // For breakout sessions, check if attendee is assigned (using title-based matching)
    const sessionTitle = session.title?.toLowerCase() || '';
    const selectedBreakouts = attendee.selected_breakouts || [];
    
    return selectedBreakouts.some(breakout => 
      breakout.toLowerCase().includes(sessionTitle) || 
      sessionTitle.includes(breakout.toLowerCase())
    );
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

  // Services will be initialized when first accessed

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

      // Get services (will use injected ones if available)
      const agendaService = await getAgendaService();
      const dataService = await getDataService();
      const timeService = getTimeService();

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

    const timeService = getTimeService();
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
