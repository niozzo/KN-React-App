/**
 * useSessionData Hook
 * Manages session data for Now/Next cards with offline support
 * Story 2.1: Now/Next Glance Card - Task 2 & 3
 */

import { useState, useEffect, useCallback } from 'react';
import { agendaService } from '../services/agendaService';
import { getCurrentAttendeeData, getAttendeeSeatAssignments, getAllDiningOptions, getAllSeatingConfigurations } from '../services/dataService';
import TimeService from '../services/timeService';
import { useAuth } from '../contexts/AuthContext';
import { cacheMonitoringService } from '../services/cacheMonitoringService';
import { pwaDataSyncService } from '../services/pwaDataSyncService';
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
    // Set end time to midnight of the same day
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
  return start > currentTime;
};

/**
 * Determine if a dining event is currently active
 * @param {Object} dining - Dining event data (after mergeAndSortEvents)
 * @param {Date} currentTime - Current time
 * @returns {boolean} Whether dining event is active
 */
const isDiningActive = (dining, currentTime) => {
  // After mergeAndSortEvents, dining events have start_time and date fields
  if (!dining.start_time || !dining.date) {
    return false;
  }
  
  const start = new Date(`${dining.date}T${dining.start_time}`);
  
  // Check if current time is before the start time
  if (currentTime < start) {
    return false;
  }
  
  // Define the local end of the day for the dining event (midnight)
  // Create endOfDay in local timezone by using the same date as start but with 23:59:59
  const endOfDay = new Date(start);
  endOfDay.setHours(23, 59, 59, 999);
  
  // 🔧 FIX: Simple local time comparison
  // All times should be in local timezone for proper comparison
  const isActive = currentTime >= start && currentTime <= endOfDay;

  // If we're on the same day, the dining event is still active
  // If we've crossed to the next day, the dining event is no longer active
  return isActive;
};

/**
 * Determine if a dining event is upcoming
 * @param {Object} dining - Dining event data (after mergeAndSortEvents)
 * @param {Date} currentTime - Current time
 * @returns {boolean} Whether dining event is upcoming
 */
const isDiningUpcoming = (dining, currentTime) => {
  // After mergeAndSortEvents, dining events have start_time and date fields
  if (!dining.start_time || !dining.date) return false;
  
  const start = new Date(`${dining.date}T${dining.start_time}`);
  return start > currentTime;
};

/**
 * Create time-based comparator for sessions and dining events
 * @param {Object} a - First event (session or dining)
 * @param {Object} b - Second event (session or dining)
 * @returns {number} Comparison result
 */
const compareEventsByTime = (a, b) => {
  // First sort by date
  const dateComparison = (a.date || '').localeCompare(b.date || '');
  if (dateComparison !== 0) return dateComparison;
  
  // Then sort by time (start_time for sessions, time for dining)
  const timeA = a.start_time || a.time || '';
  const timeB = b.start_time || b.time || '';
  return timeA.localeCompare(timeB);
};

/**
 * Merge and sort sessions and dining events by time
 * @param {Array} sessions - Array of sessions
 * @param {Array} diningOptions - Array of dining options
 * @returns {Array} Combined and sorted events
 */
const mergeAndSortEvents = (sessions, diningOptions) => {
  // Convert dining options to event format for consistency
  const diningEvents = diningOptions.map(dining => ({
    ...dining,
    type: 'dining',
    start_time: dining.time,
    end_time: null, // Dining events have no explicit end time - will default to midnight
    title: dining.name,
    session_type: 'meal'
  }));

  // Combine sessions and dining events
  const allEvents = [...sessions, ...diningEvents];
  
  // Sort by time
  return allEvents.sort(compareEventsByTime);
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
  
  const filteredSessions = sessions.filter(session => {
    if (session.session_type === 'breakout') {
      // NEW: Check if attendee is assigned to this breakout using mapping service
      const isAssigned = breakoutMappingService.isAttendeeAssignedToBreakout(session, attendee);
      return isAssigned;
    } else {
      // Show all other session types (keynote, meal, etc.) to everyone
      return true;
    }
  });

  return filteredSessions;
};

/**
 * Load session and dining data from cache
 * @returns {Object} Cached data with sessions and dining options
 */
const loadFromCache = () => {
  try {
    const cachedData = localStorage.getItem('kn_cached_sessions');
    let sessions = [];
    let diningOptions = [];
    let allEvents = [];
    
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      sessions = parsed.sessions || [];
      diningOptions = parsed.diningOptions || [];
      allEvents = parsed.allEvents || [];
    }
    
    // Also check for dining data in the unified cache
    const diningCacheData = localStorage.getItem('kn_cache_dining_options');
    if (diningCacheData) {
      try {
        const parsedDining = JSON.parse(diningCacheData);
        if (parsedDining.data && parsedDining.data.length > 0) {
          diningOptions = parsedDining.data;
        }
      } catch (diningError) {      }
    }
    
    return { sessions, diningOptions, allEvents };
  } catch (error) {    return { sessions: [], diningOptions: [], allEvents: [] };
  }
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
  const [diningOptions, setDiningOptions] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // Combined sessions + dining
  const [currentSession, setCurrentSession] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [attendee, setAttendee] = useState(null);
  const [seatAssignments, setSeatAssignments] = useState([]);
  const [seatingConfigurations, setSeatingConfigurations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(() => {
    // Use PWA service as single source of truth for online status
    const isOnline = pwaDataSyncService.getOnlineStatus();
    
    // Additional platform-specific checks
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSimulator = navigator.userAgent.includes('Simulator');
    
    // For iOS simulator, be more conservative with offline detection
    if (isIOS && isSimulator) {
      console.log('🍎 iOS Simulator detected in useSessionData - using conservative offline detection');
      // Only consider offline if we're definitely offline
      return !isOnline && !navigator.onLine;
    }
    
    return !isOnline;
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [diningError, setDiningError] = useState(null);

  // Load session data
  const loadSessionData = useCallback(async () => {
    const sessionId = cacheMonitoringService.getSessionId();
    
    // Don't load data if not authenticated
    if (!isAuthenticated) {      cacheMonitoringService.logStateTransition('useSessionData', { authenticated: false }, { authenticated: false }, 'skipped');
      setIsLoading(false);
      return;
    }

    try {      cacheMonitoringService.logStateTransition('useSessionData', { loading: false }, { loading: true }, 'start');
      setIsLoading(true);
      setError(null);

      // Load attendee data
      const attendeeData = await getCurrentAttendeeData();
      setAttendee(attendeeData);

      // ✅ NEW: Check if attendee data needs refresh and handle errors
      try {
        const { attendeeSyncService } = await import('../services/attendeeSyncService');
        const { AttendeeSyncErrorHandler } = await import('../services/attendeeSyncErrorHandler');
        const { AttendeeSyncFallback } = await import('../services/attendeeSyncFallback');
        
        if (attendeeSyncService.shouldRefreshAttendeeData()) {
          console.log('🔄 Attendee data is stale, refreshing...');
          try {
            const attendeeResult = await attendeeSyncService.refreshAttendeeData();
            
            if (attendeeResult.success && attendeeResult.attendee) {
              setAttendee(attendeeResult.attendee);
              console.log('✅ Attendee data refreshed successfully');
            } else {
              // Handle sync failure with fallback
              console.warn('⚠️ Attendee sync failed, using fallback data');
              const fallbackAttendee = AttendeeSyncFallback.getFallbackAttendeeData();
              if (fallbackAttendee && AttendeeSyncFallback.validateFallbackData(fallbackAttendee)) {
                setAttendee(fallbackAttendee);
              }
            }
          } catch (error) {
            console.error('❌ Attendee sync error:', error);
            
            // Use error handler for retry logic
            try {
              const errorResult = await AttendeeSyncErrorHandler.handleSyncError(
                error,
                () => attendeeSyncService.refreshAttendeeData()
              );
              
              if (errorResult.success && errorResult.attendee) {
                setAttendee(errorResult.attendee);
              } else {
                // Final fallback
                const fallbackAttendee = AttendeeSyncFallback.getFallbackAttendeeData();
                if (fallbackAttendee && AttendeeSyncFallback.validateFallbackData(fallbackAttendee)) {
                  setAttendee(fallbackAttendee);
                }
              }
            } catch (fallbackError) {
              console.error('❌ Fallback failed:', fallbackError);
              setError('Failed to load attendee data');
            }
          }
        }
      } catch (importError) {
        console.warn('⚠️ Failed to load attendee sync services:', importError);
        // Continue with existing attendee data
      }

      // Load seat assignments for the attendee
      // ARCHITECTURE: Synchronous Transform with Async State Persistence
      // Store in local variables for immediate use, then persist to state for future re-renders
      let localSeatAssignments = [];
      if (attendeeData && attendeeData.id) {
        try {
          const seatData = await getAttendeeSeatAssignments(attendeeData.id);
          localSeatAssignments = seatData;
          setSeatAssignments(seatData); // Persist to state (async, non-blocking)
        } catch (seatError) {
          setSeatAssignments([]);
        }
      }

      // Load seating configurations (bridge table between events and seat assignments)
      let localSeatingConfigurations = [];
      if (attendeeData && attendeeData.id) {
        try {
          const seatingConfigData = await getAllSeatingConfigurations();
          localSeatingConfigurations = seatingConfigData || [];
          setSeatingConfigurations(localSeatingConfigurations); // Persist to state (async, non-blocking)
        } catch (configError) {
          console.warn('⚠️ Failed to load seating configurations:', configError);
          setSeatingConfigurations([]);
        }
      }

      // Progressive data loading: Try cache first, then server, then fallback
      let allSessionsData = [];
      let loadSource = 'unknown';
      let diningData = [];
      
      // Step 1: Try to load from cache first (fastest)
      try {
        const cachedData = loadFromCache();
        if (cachedData.sessions.length > 0 || cachedData.diningOptions.length > 0) {          allSessionsData = cachedData.sessions;
          if (cachedData.diningOptions.length > 0) {
            diningData = cachedData.diningOptions;
            setDiningOptions(diningData);          }
          if (cachedData.allEvents.length > 0) {
            setAllEvents(cachedData.allEvents);
          }
          loadSource = 'cache';
          cacheMonitoringService.logStateTransition('useSessionData', { sessions: [] }, { sessions: allSessionsData }, 'cache-primary');
        }
      } catch (cacheError) {        cacheMonitoringService.logCacheCorruption('kn_cached_sessions', cacheError.message, { error: cacheError });
      }
      
      // Load dining options (try API if not loaded from cache)
      if (diningData.length === 0) {
        try {          const rawDiningData = await getAllDiningOptions();
          
          // Additional filtering for active status (redundant but ensures consistency)
          diningData = rawDiningData.filter(dining => {
            const isActive = dining.is_active !== false && dining.is_active !== undefined;
            if (!isActive) {            }
            return isActive;
          });
          
          setDiningOptions(diningData);
          setDiningError(null);        } catch (diningError) {          setDiningError(diningError.message);
          setDiningOptions([]);
          // Don't fail the entire data load if dining fails
        }
      }

      // Apply dining metadata overrides (title changes from admin)
      if (diningData.length > 0) {
        try {          const diningItemMetadata = await pwaDataSyncService.getCachedTableData('dining_item_metadata');          
          // Apply title overrides to dining options
          diningData = diningData.map((option) => {
            const metadata = diningItemMetadata.find((meta) => meta.id === option.id);
            const finalTitle = metadata?.title || option.name;
            
            return {
              ...option,
              name: finalTitle, // Use edited title if available
              original_name: option.name // Keep original for reference
            };
          });
          
          setDiningOptions(diningData);        } catch (metadataError) {          // Continue with original dining data if metadata fails
        }
      }
      
      // Step 2: If no cache data, try server (if cache failed or empty)
      if (allSessionsData.length === 0) {
        try {          const agendaResponse = await agendaService.getActiveAgendaItems();
          
          if (agendaResponse.success && agendaResponse.data && agendaResponse.data.length > 0) {
            allSessionsData = agendaResponse.data;
            loadSource = 'server';            cacheMonitoringService.logStateTransition('useSessionData', { sessions: [] }, { sessions: allSessionsData }, 'server-success');
          } else {            cacheMonitoringService.logStateTransition('useSessionData', { agendaLoaded: false }, { agendaLoaded: false, error: agendaResponse.error }, 'server-empty');
          }
        } catch (serverError) {          cacheMonitoringService.logStateTransition('useSessionData', { agendaLoaded: false }, { agendaLoaded: false, error: serverError.message }, 'server-failed');
        }
      }
      
      // Step 3: If still no data, try localStorage fallback
      if (allSessionsData.length === 0) {
        try {
          const localStorageData = localStorage.getItem('kn_cached_sessions');
          if (localStorageData) {
            const parsed = JSON.parse(localStorageData);
            if (parsed.sessions && parsed.sessions.length > 0) {
              allSessionsData = parsed.sessions;
              loadSource = 'localStorage';              cacheMonitoringService.logStateTransition('useSessionData', { sessions: [] }, { sessions: allSessionsData }, 'localStorage-fallback');
            }
          }
        } catch (localStorageError) {        }
      }
      
      // Step 4: If still no data, set error state
      if (allSessionsData.length === 0) {
        const errorMessage = 'Unable to load conference schedule from any source';        cacheMonitoringService.logStateTransition('useSessionData', { sessions: [] }, { sessions: [], error: errorMessage }, 'all-sources-failed');
        setError(errorMessage);
        setAllSessions([]);
        setSessions([]);
        setLastUpdated(new Date());
        return;
      }      
      // Store all sessions for conference start date logic
      setAllSessions(allSessionsData);
      
      // If we loaded from cache, refresh from server in background
      if (loadSource === 'cache' || loadSource === 'localStorage') {        
        // ✅ ARCHITECTURE-COMPLIANT: Refresh both External DB (conference data) and Application DB (metadata)
        Promise.all([
          agendaService.getActiveAgendaItems(),
          getAllDiningOptions(), // ✅ CRITICAL FIX: Refresh dining data from source
          pwaDataSyncService.getCachedTableData('dining_item_metadata')
        ]).then(([agendaResponse, diningResponse, diningMetadata]) => {
          if (agendaResponse.success && agendaResponse.data && agendaResponse.data.length > 0) {            
            // Update conference data (External DB)
            setAllSessions(agendaResponse.data);
            setSessions(filterSessionsForAttendee(agendaResponse.data, attendeeData));
            
            // ✅ CRITICAL FIX: Update dining data from fresh source
            if (diningResponse.success && diningResponse.data && diningResponse.data.length > 0) {              setDiningOptions(diningResponse.data);
              
              // ✅ CRITICAL: Re-apply Application Database metadata overrides
              if (diningMetadata && diningMetadata.length > 0) {                const enrichedDiningOptions = diningResponse.data.map(option => {
                  const metadata = diningMetadata.find(meta => meta.id === option.id);
                  return metadata ? { 
                    ...option, 
                    name: metadata.title,  // Application DB override
                    original_name: option.name 
                  } : option;
                });
                setDiningOptions(enrichedDiningOptions);
                
                // Update combined events with enriched dining data
                const enrichedCombinedEvents = mergeAndSortEvents(
                  filterSessionsForAttendee(agendaResponse.data, attendeeData), 
                  enrichedDiningOptions
                );
                setAllEvents(enrichedCombinedEvents);
              } else {
                // Update combined events with fresh dining data (no metadata overrides)
                const freshCombinedEvents = mergeAndSortEvents(
                  filterSessionsForAttendee(agendaResponse.data, attendeeData), 
                  diningResponse.data
                );
                setAllEvents(freshCombinedEvents);
              }
            } else {            }
            
            setLastUpdated(new Date());
          }
        }).catch(err => {          // ✅ ERROR HANDLING: Log specific failure types for debugging
          if (err.message?.includes('dining')) {          }
        });
      }
      
      // Filter sessions for current attendee based on session type and breakout assignments
      let filteredSessions = filterSessionsForAttendee(allSessionsData, attendeeData);
      
      // Merge sessions and dining events (use dining data with metadata overrides)
      const combinedEvents = mergeAndSortEvents(filteredSessions, diningData);
      // AllEvents will be set after enhancement (see below)
      
      // 🔍 DEBUG: Enhanced logging for dining regression investigation      
      // 🔍 DEBUG: Cache data structure analysis      
      // Sessions will be set after enhancement (see below)

      // Log state transition with detailed data      
      cacheMonitoringService.logStateTransition('useSessionData', 
        { sessions: [], allSessions: [] }, 
        { sessions: filteredSessions, allSessions: allSessionsData }, 
        'server-success'
      );

      setLastUpdated(new Date());
      
      // Register session boundaries with TimeService for boundary detection
      TimeService.registerSessionBoundaries(filteredSessions);

      // Determine current and next events (sessions + dining)
      const currentTime = getCurrentTime();
      
      // Find current active event (session or dining)
      const activeEvent = combinedEvents.find(event => {
        if (event.type === 'dining') {
          const isActive = isDiningActive(event, currentTime);
          return isActive;
        } else {
          const isActive = isSessionActive(event, currentTime);
          
          
          return isActive;
        }
      });
      
      // 🔍 DEBUG: Log the final active event selection      
      // 🔍 DEBUG: Log all events being evaluated      
      // Find the next upcoming event (session or dining)
      const upcomingEvent = combinedEvents
        .filter(event => {
          if (event.type === 'dining') {
            return isDiningUpcoming(event, currentTime);
          } else {
            return isSessionUpcoming(event, currentTime);
          }
        })
        .sort(compareEventsByTime)[0]; // Get the first (earliest) upcoming event

      // Enhance events with seat assignment data (for both sessions AND dining events)
      // ARCHITECTURE: Use local variables for synchronous data transformation
      const enhanceEventWithSeatInfo = (event) => {
        if (!event || !localSeatAssignments.length || !localSeatingConfigurations.length) {
          return event || null;
        }
        
        // Step 1: Find the seating configuration for this event (bridge table lookup)
        let seatingConfig = null;
        
        if (event.type === 'dining') {
          // For dining events, match by dining_option_id
          seatingConfig = localSeatingConfigurations.find(
            config => config.dining_option_id === event.id
          );
        } else {
          // For agenda items, match by agenda_item_id
          seatingConfig = localSeatingConfigurations.find(
            config => config.agenda_item_id === event.id
          );
        }
        
        // If no seating configuration found, return event without seat info
        if (!seatingConfig) {
          return event;
        }
        
        // Step 2: Find seat assignment using the configuration ID from bridge table
        const seatAssignment = localSeatAssignments.find(seat => 
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

      // CRITICAL FIX: Enhance ALL sessions, not just current/next
      const enhancedSessions = filteredSessions.map(session => enhanceEventWithSeatInfo(session));
      const enhancedDiningOptions = diningData.map(dining => enhanceEventWithSeatInfo(dining));
      const enhancedCombinedEvents = combinedEvents.map(event => enhanceEventWithSeatInfo(event));
      
      // Update state with enhanced data
      setSessions(enhancedSessions);
      setDiningOptions(enhancedDiningOptions);
      setAllEvents(enhancedCombinedEvents);
      
      const enhancedActiveEvent = enhanceEventWithSeatInfo(activeEvent);
      const enhancedUpcomingEvent = enhanceEventWithSeatInfo(upcomingEvent);
      
      // 🔍 DEBUG: Log state updates      
      // 🔍 DEBUG: Log the exact values being set      
      setCurrentSession(enhancedActiveEvent || null);
      setNextSession(enhancedUpcomingEvent || null);
      
      // 🔍 DEBUG: Enhanced logging for current/next session determination
    } catch (err) {      cacheMonitoringService.logStateTransition('useSessionData', { error: null }, { error: err.message }, 'error');
      setError(err.message);
      
      // Try to load from cache if offline
      if (enableOfflineMode && isOffline) {
        try {
          const cachedData = localStorage.getItem('kn_cached_sessions');
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            cacheMonitoringService.logStateTransition('useSessionData', { sessions: [] }, { sessions: parsed.sessions || [] }, 'offline-cache');
            setSessions(parsed.sessions || []);
            setDiningOptions(parsed.diningOptions || []);
            setAllEvents(parsed.allEvents || []);
            setCurrentSession(parsed.currentSession || null);
            setNextSession(parsed.nextSession || null);
            setLastUpdated(new Date(parsed.lastUpdated));
          }
        } catch (cacheErr) {          cacheMonitoringService.logCacheCorruption('kn_cached_sessions', cacheErr.message, { error: cacheErr });
        }
      }
    } finally {
      cacheMonitoringService.logStateTransition('useSessionData', { loading: true }, { loading: false }, 'complete');
      setIsLoading(false);
    }
  }, [enableOfflineMode, isOffline, isAuthenticated]);

  // Cache session and dining data for offline use
  const cacheSessionData = useCallback(() => {
    if (enableOfflineMode && (sessions.length > 0 || diningOptions.length > 0)) {
      const cacheData = {
        sessions,
        diningOptions,
        allEvents,
        currentSession,
        nextSession,
        lastUpdated: lastUpdated?.toISOString()
      };
      
      // Find John Boehner event for debugging
      const boehnerEvent = sessions.find(s => s.id === 'f95a4c5a-0120-4156-b02a-0c92fc1bf64d');
      console.log('💾 [SESSION-HOOK] Caching kn_cached_sessions:', {
        total_sessions: sessions.length,
        total_dining: diningOptions.length,
        total_events: allEvents.length,
        boehner_event: boehnerEvent ? {
          id: boehnerEvent.id,
          title: boehnerEvent.title,
          speakers: boehnerEvent.speakers,
          speakerInfo: boehnerEvent.speakerInfo
        } : 'NOT FOUND'
      });
      
      localStorage.setItem('kn_cached_sessions', JSON.stringify(cacheData));
      console.log('✅ [SESSION-HOOK] Successfully saved kn_cached_sessions to localStorage');
    }
  }, [sessions, diningOptions, allEvents, currentSession, nextSession, lastUpdated, enableOfflineMode]);

  // Handle online/offline status changes - event-driven approach
  useEffect(() => {
    const handleOnline = () => {
      // Use proper setter method
      pwaDataSyncService.setOnlineStatus(true);
      if (autoRefresh && isAuthenticated) {
        loadSessionData();
      }
    };

    const handleOffline = () => {
      // Use proper setter method
      pwaDataSyncService.setOnlineStatus(false);
    };

    // Listen for PWA service status changes via custom events
    const handlePWAStatusChange = (event) => {
      const { isOnline } = event.detail;
      setIsOffline(!isOnline);
    };

    // Standard browser events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Custom PWA service events (event-driven, no polling needed)
    window.addEventListener('pwa-status-change', handlePWAStatusChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pwa-status-change', handlePWAStatusChange);
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

  // ✅ NEW: Event-driven attendee data updates
  useEffect(() => {
    const handleAttendeeDataUpdate = (event) => {
      const { attendee, timestamp, syncVersion } = event.detail;
      console.log('🔄 Attendee data updated via event:', { timestamp, syncVersion });
      
      // Update local attendee state
      setAttendee(attendee);
      
      // Re-apply personalization with fresh attendee data
      if (allSessions.length > 0) {
        const personalizedSessions = filterSessionsForAttendee(allSessions, attendee);
        setSessions(personalizedSessions);
        
        // Update combined events with fresh personalization
        const updatedCombinedEvents = mergeAndSortEvents(
          personalizedSessions,
          diningOptions
        );
        setAllEvents(updatedCombinedEvents);
      }
      
      // Update last updated timestamp
      setLastUpdated(new Date());
    };

    // Listen for attendee data updates
    window.addEventListener('attendee-data-updated', handleAttendeeDataUpdate);
    
    return () => {
      window.removeEventListener('attendee-data-updated', handleAttendeeDataUpdate);
    };
  }, [allSessions, diningOptions]);

  // Listen for time override changes and re-evaluate session states
  useEffect(() => {
    const handleTimeOverrideChange = () => {
      // Re-evaluate event states when time override changes
      const currentTime = getCurrentTime();      
      // Find current active event (session or dining)      
      const activeEvent = allEvents.find(event => {
        if (event.type === 'dining') {
          const isActive = isDiningActive(event, currentTime);          return isActive;
        } else {
          const isActive = isSessionActive(event, currentTime);          return isActive;
        }
      });      
      // Find next upcoming event (session or dining)
      const upcomingEvent = allEvents
        .filter(event => {
          if (event.type === 'dining') {
            return isDiningUpcoming(event, currentTime);
          } else {
            return isSessionUpcoming(event, currentTime);
          }
        })
        .sort(compareEventsByTime)[0]; // Get the first (earliest) upcoming event
      
      // Update state only if changed (performance optimization)      
      setCurrentSession(prev => {
        if (prev?.id !== activeEvent?.id) {          return activeEvent || null; // ✅ Ensure null instead of undefined
        }
        return prev;
      });
      
      setNextSession(prev => {
        if (prev?.id !== upcomingEvent?.id) {          return upcomingEvent || null; // ✅ Ensure null instead of undefined
        }
        return prev;
      });
    };

    // Listen for time override changes via localStorage (cross-tab)
    const handleStorageChange = (e) => {      if (e.key === 'kn_time_override' || e.key === 'kn_time_override_start') {        handleTimeOverrideChange();
      }
    };

    // Listen for time override changes via custom event (same-tab)
    const handleTimeOverrideUpdate = () => {      handleTimeOverrideChange();
    };
    
    // Listen for session boundary crossings
    const handleBoundaryCrossing = () => {      handleTimeOverrideChange();
    };

    // Listen for dining metadata cache invalidation
    const handleDiningMetadataUpdate = () => {      // ✅ CRITICAL FIX: Force refresh of dining data from source
      getAllDiningOptions().then(response => {        setDiningOptions(response);
        // Trigger full data reload to ensure dining events are properly merged
        loadSessionData();
      }).catch(err => {        // Fallback to full reload
        loadSessionData();
      });
    };

    // Listen for agenda metadata cache invalidation
    const handleAgendaMetadataUpdate = () => {      loadSessionData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('timeOverrideChanged', handleTimeOverrideUpdate);
    window.addEventListener('timeOverrideBoundaryCrossed', handleBoundaryCrossing);
    window.addEventListener('diningMetadataUpdated', handleDiningMetadataUpdate);
    window.addEventListener('agendaMetadataUpdated', handleAgendaMetadataUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('timeOverrideChanged', handleTimeOverrideUpdate);
      window.removeEventListener('timeOverrideBoundaryCrossed', handleBoundaryCrossing);
      window.removeEventListener('diningMetadataUpdated', handleDiningMetadataUpdate);
      window.removeEventListener('agendaMetadataUpdated', handleAgendaMetadataUpdate);
    };
  }, [allEvents, loadSessionData]); // Re-run when events change to update the closure

  // Real-time update mechanism for both real time and dynamic time override
  useEffect(() => {
    // Only set up real-time updates if we have events
    if (allEvents.length === 0) {
      return;
    }

    const isOverrideActive = TimeService.isOverrideActive();
    
    // Start boundary monitoring if override is active
    if (isOverrideActive) {
      TimeService.startBoundaryMonitoring();
    }

    // Real-time updates should always run for production
    // Time override is just a dev feature

    const handleRealTimeUpdate = () => {
      const currentTime = getCurrentTime();      
      // Find current active event (session or dining)
      const activeEvent = allEvents.find(event => {
        if (event.type === 'dining') {
          const isActive = isDiningActive(event, currentTime);          return isActive;
        } else {
          const isActive = isSessionActive(event, currentTime);          return isActive;
        }
      });
      
      // Find next upcoming event (session or dining)
      const upcomingEvent = allEvents
        .filter(event => {
          if (event.type === 'dining') {
            return isDiningUpcoming(event, currentTime);
          } else {
            return isSessionUpcoming(event, currentTime);
          }
        })
        .sort(compareEventsByTime)[0]; // Get the first (earliest) upcoming event
      
      // 🔧 TEMPORARY FIX: Simplified state management to resolve midnight transition bug
      // TODO: Replace with proper state machine architecture in future iteration
      // This fixes the immediate issue where dining events don't disappear at midnight
      // due to complex callback pattern in setCurrentSession      
      // Direct state updates - eliminates callback complexity that was causing the bug
      setCurrentSession(activeEvent || null); // ✅ Ensure null instead of undefined
      setNextSession(upcomingEvent || null); // ✅ Ensure null instead of undefined
    };

    // Set up interval for real-time updates (every second)
    const interval = setInterval(handleRealTimeUpdate, 1000);

    return () => {
      clearInterval(interval);
      // Stop boundary monitoring when component unmounts or sessions change
      TimeService.stopBoundaryMonitoring();
    };
  }, [allEvents]); // Re-run when events change

  // Refresh data manually
  const refresh = useCallback(() => {
    loadSessionData();
  }, [loadSessionData]);

  return {
    sessions,
    allSessions,
    diningOptions,
    allEvents,
    currentSession,
    nextSession,
    attendee,
    seatAssignments,
    isLoading,
    isOffline,
    lastUpdated,
    error,
    diningError,
    refresh
  };
};

export default useSessionData;
