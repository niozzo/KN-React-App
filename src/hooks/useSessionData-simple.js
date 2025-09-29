/**
 * useSessionData Hook - Simple Version for Testing
 * Manages session data for Now/Next cards with offline support
 * Story 2.1: Now/Next Glance Card - Task 2 & 3
 * 
 * This version is simplified for testing without complex useEffect logic
 */

import { useState, useEffect, useCallback } from 'react';

// Service getters (can be overridden for testing)
let getAgendaService = () => null;
let getDataService = () => null;
let getTimeService = () => null;

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
  getAgendaService = () => null;
  getDataService = () => null;
  getTimeService = () => null;
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
  
  // Session is active if current time is >= start and < end (exclusive of end time)
  return currentTime >= start && currentTime < end;
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
 * useSessionData Hook (Simple Version)
 * @param {Object} user - User object (for testing)
 * @returns {Object} Session data and loading state
 */
export const useSessionData = (user = { id: 'test-user' }) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendee, setAttendee] = useState(null);

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
      const agendaService = getAgendaService();
      const dataService = getDataService();
      const timeService = getTimeService();

      if (!agendaService || !dataService || !timeService) {
        throw new Error('Services not injected');
      }

      // Load agenda items
      const agendaResponse = await agendaService.getActiveAgendaItems();
      
      if (!agendaResponse.success) {
        throw new Error(agendaResponse.error || 'Failed to load agenda items');
      }

      let allSessions = agendaResponse.data || [];

      // Load attendee data for filtering
      const attendeeData = await dataService.getCurrentAttendeeData();
      setAttendee(attendeeData);

      // Filter sessions based on attendee assignments
      const filteredSessions = allSessions.filter(session => {
        // Show all non-breakout sessions to all users
        if (session.session_type !== 'breakout-session') {
          return true;
        }
        
        // For breakout sessions, use mapping service to check assignment
        if (attendeeData && attendeeData.selected_breakouts) {
          // Import and use the mapping service
          const { BreakoutMappingService } = require('../services/breakoutMappingService');
          const mappingService = new BreakoutMappingService();
          return mappingService.isAttendeeAssignedToBreakout(session, attendeeData);
        }
        
        // If no attendee data, don't show breakout sessions
        return false;
      });

      // Set sessions
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
  }, []); // Remove user dependency to prevent infinite loop

  // Load data on mount and when user changes
  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

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
