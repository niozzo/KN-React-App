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
import { breakoutMappingService } from '../services/breakoutMappingService';

/**
 * Determine if a session is currently active
 * @param {Object} session - Session data
 * @param {Date} currentTime - Current time
 * @returns {boolean} Whether session is active
 */
const isSessionActive = (session, currentTime) => {
  if (!session.start_time) return false;
  
  const start = new Date(`${session.date}T${session.start_time}`);
  
  // If no end time, assume it ends at midnight
  let end;
  if (session.end_time) {
    end = new Date(`${session.date}T${session.end_time}`);
  } else {
    end = new Date(`${session.date}T23:59:59`);
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
  
  const start = new Date(`${session.date}T${session.start_time}`);
  return currentTime < start;
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
    
    // Find seat assignment for this session
    const seatAssignment = seatAssignments.find(assignment => 
      assignment.session_id === session.id
    );
    
    // Find seating configuration for this session
    const seatingConfig = seatingConfigurations.find(config => 
      config.session_id === session.id
    );
    
    return {
      ...session,
      isActive,
      isUpcoming,
      seatAssignment,
      seatingConfig,
      hasSeating: !!seatingConfig,
      hasSeatAssignment: !!seatAssignment
    };
  });
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

      // Load seat assignments
      const seatData = await getAttendeeSeatAssignments();
      setSeatAssignments(seatData);

      // Load seating configurations
      const seatingData = await getAllSeatingConfigurations();
      setSeatingConfigurations(seatingData);

      // Load dining options
      try {
        const diningData = await getAllDiningOptions();
        setDiningOptions(diningData);
        setDiningError(null);
      } catch (diningErr) {
        console.error('Failed to load dining options:', diningErr);
        setDiningError(diningErr.message);
      }

      // Load agenda items (sessions)
      const agendaResponse = await agendaService.getActiveAgendaItems();
      let allSessionsData = [];
          
          if (agendaResponse.success && agendaResponse.data && agendaResponse.data.length > 0) {
            allSessionsData = agendaResponse.data;
      }

      // Enhance session data
      const enhancedSessions = enhanceSessionData(
        allSessionsData,
        attendeeData,
        seatData,
        seatingData
      );

      // Filter sessions based on current time
      const currentTime = TimeService.getCurrentTime();
      const filteredSessions = enhancedSessions.filter(session => {
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

      // Set state
      setSessions(filteredSessions);
      setAllSessions(enhancedSessions);
      setAllEvents(enhancedSessions);
      setLastUpdated(new Date());

      // Find current and next sessions
      const activeSession = enhancedSessions.find(s => s.isActive);
      const upcomingSession = enhancedSessions.find(s => s.isUpcoming);
      
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
      // Load fresh data
      const [agendaResponse, diningResponse] = await Promise.all([
        agendaService.getActiveAgendaItems(),
        getAllDiningOptions()
      ]);
      
      if (agendaResponse.success && agendaResponse.data && agendaResponse.data.length > 0) {
        const enhancedSessions = enhanceSessionData(
          agendaResponse.data,
          attendee,
          seatAssignments,
          seatingConfigurations
        );
        
        setSessions(enhancedSessions);
        setAllSessions(enhancedSessions);
        setAllEvents(enhancedSessions);
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
  }, [isAuthenticated, attendee, seatAssignments, seatingConfigurations]);

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
  }, [autoRefresh, isAuthenticated, loadSessionData]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  // Auto-refresh when online
  useEffect(() => {
    if (!autoRefresh || isOffline || !isAuthenticated) return;

    const interval = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, isOffline, isAuthenticated, refreshData]);

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