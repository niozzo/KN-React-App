/**
 * useSessionData Hook
 * Manages session data for Now/Next cards with offline support
 * Story 2.1: Now/Next Glance Card - Task 2 & 3
 */

import { useState, useEffect, useCallback } from 'react';
import { agendaService } from '../services/agendaService.ts';
import { getCurrentAttendeeData, getAttendeeSeatAssignments, getAllDiningOptions } from '../services/dataService.ts';
import TimeService from '../services/timeService';
import { useAuth } from '../contexts/AuthContext';
import { cacheMonitoringService } from '../services/cacheMonitoringService.ts';
import { pwaDataSyncService } from '../services/pwaDataSyncService.ts';

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
  
  // Check if session has already ended
  if (session.end_time) {
    const end = new Date(`${session.date}T${session.end_time}`);
    // Session is upcoming if it starts in the future AND hasn't ended yet
    return start > currentTime && end > currentTime;
  }
  
  // If no end time, check if it's on a future day or same day but future time
  const currentDateString = currentTime.toISOString().split('T')[0]; // YYYY-MM-DD
  const sessionDateString = session.date; // Already in YYYY-MM-DD format
  
  // If it's a future day, it's upcoming
  if (sessionDateString > currentDateString) {
    return true;
  }
  
  // If it's the same day, only upcoming if start time is in the future
  if (sessionDateString === currentDateString) {
    return start > currentTime;
  }
  
  // If it's a past day, it's not upcoming
  return false;
};

/**
 * Determine if a dining event is currently active
 * @param {Object} dining - Dining event data
 * @param {Date} currentTime - Current time
 * @returns {boolean} Whether dining event is active
 */
const isDiningActive = (dining, currentTime) => {
  if (!dining.time || !dining.date) return false;
  
  const start = new Date(`${dining.date}T${dining.time}`);
  
  // Check if current time is before the start time
  if (currentTime < start) return false;
  
  // Check if current time is on the same day as the dining event
  // Use date strings for comparison to avoid timezone issues
  const currentDateString = currentTime.toISOString().split('T')[0]; // YYYY-MM-DD
  const diningDateString = dining.date; // Already in YYYY-MM-DD format
  
  // If we're on the same day, the dining event is still active
  // If we've crossed to the next day, the dining event is no longer active
  return currentDateString === diningDateString;
};

/**
 * Determine if a dining event is upcoming
 * @param {Object} dining - Dining event data
 * @param {Date} currentTime - Current time
 * @returns {boolean} Whether dining event is upcoming
 */
const isDiningUpcoming = (dining, currentTime) => {
  if (!dining.time || !dining.date) return false;
  
  const start = new Date(`${dining.date}T${dining.time}`);
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
  
  return sessions.filter(session => {
    if (session.session_type === 'breakout-session') {
      // TEMPORARY: Hide all breakout sessions until assignment logic is implemented
      return false;
    } else {
      // Show all other session types (keynote, meal, etc.) to everyone
      return true;
    }
  });
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
          console.log('🏠 CACHE: Found dining data in unified cache:', diningOptions.length, 'records');
        }
      } catch (diningError) {
        console.warn('⚠️ Failed to parse dining cache data:', diningError);
      }
    }
    
    return { sessions, diningOptions, allEvents };
  } catch (error) {
    console.warn('⚠️ Failed to load cached data:', error);
    return { sessions: [], diningOptions: [], allEvents: [] };
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
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [diningError, setDiningError] = useState(null);

  // Load session data
  const loadSessionData = useCallback(async () => {
    const sessionId = cacheMonitoringService.getSessionId();
    
    // Don't load data if not authenticated
    if (!isAuthenticated) {
      console.log('🔄 useSessionData: Not authenticated, skipping data load');
      cacheMonitoringService.logStateTransition('useSessionData', { authenticated: false }, { authenticated: false }, 'skipped');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔄 useSessionData: Starting data load...');
      cacheMonitoringService.logStateTransition('useSessionData', { loading: false }, { loading: true }, 'start');
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

      // Progressive data loading: Try cache first, then server, then fallback
      let allSessionsData = [];
      let loadSource = 'unknown';
      let diningData = [];
      
      // Step 1: Try to load from cache first (fastest)
      try {
        const cachedData = loadFromCache();
        if (cachedData.sessions.length > 0 || cachedData.diningOptions.length > 0) {
          console.log('🏠 CACHE: Loading data from cache (progressive step 1)');
          allSessionsData = cachedData.sessions;
          if (cachedData.diningOptions.length > 0) {
            diningData = cachedData.diningOptions;
            setDiningOptions(diningData);
            console.log('🏠 CACHE: Using cached dining options from cache');
          }
          if (cachedData.allEvents.length > 0) {
            setAllEvents(cachedData.allEvents);
          }
          loadSource = 'cache';
          cacheMonitoringService.logStateTransition('useSessionData', { sessions: [] }, { sessions: allSessionsData }, 'cache-primary');
        }
      } catch (cacheError) {
        console.warn('⚠️ Cache load failed:', cacheError);
        cacheMonitoringService.logCacheCorruption('kn_cached_sessions', cacheError.message, { error: cacheError });
      }
      
      // Load dining options (try API if not loaded from cache)
      if (diningData.length === 0) {
        try {
          console.log('🍽️ DINING: Loading dining options from API...');
          const rawDiningData = await getAllDiningOptions();
          
          // Additional filtering for active status (redundant but ensures consistency)
          diningData = rawDiningData.filter(dining => {
            const isActive = dining.is_active !== false && dining.is_active !== undefined;
            if (!isActive) {
              console.log('🍽️ DINING: Filtered out inactive dining option:', dining.name);
            }
            return isActive;
          });
          
          setDiningOptions(diningData);
          setDiningError(null);
          console.log('🍽️ DINING: Successfully loaded', diningData.length, 'active dining options (filtered from', rawDiningData.length, 'total)');
        } catch (diningError) {
          console.warn('⚠️ Could not load dining options:', diningError);
          setDiningError(diningError.message);
          setDiningOptions([]);
          // Don't fail the entire data load if dining fails
        }
      }

      // Apply dining metadata overrides (title changes from admin)
      if (diningData.length > 0) {
        try {
          console.log('🍽️ DINING: Loading dining metadata for title overrides...');
          const diningItemMetadata = await pwaDataSyncService.getCachedTableData('dining_item_metadata');
          console.log('📊 DINING: Loaded dining item metadata from cache:', diningItemMetadata.length, 'records');
          
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
          
          setDiningOptions(diningData);
          console.log('🍽️ DINING: Applied metadata overrides to', diningData.length, 'dining options');
        } catch (metadataError) {
          console.warn('⚠️ Could not load dining metadata, using original titles:', metadataError);
          // Continue with original dining data if metadata fails
        }
      }
      
      // Step 2: If no cache data, try server (if cache failed or empty)
      if (allSessionsData.length === 0) {
        try {
          console.log('🌐 SERVER: Loading agenda items from server (progressive step 2)');
          const agendaResponse = await agendaService.getActiveAgendaItems();
          
          if (agendaResponse.success && agendaResponse.data && agendaResponse.data.length > 0) {
            allSessionsData = agendaResponse.data;
            loadSource = 'server';
            console.log('🌐 SERVER: Successfully loaded sessions from server');
            cacheMonitoringService.logStateTransition('useSessionData', { sessions: [] }, { sessions: allSessionsData }, 'server-success');
          } else {
            console.warn('⚠️ Server returned no data:', agendaResponse.error);
            cacheMonitoringService.logStateTransition('useSessionData', { agendaLoaded: false }, { agendaLoaded: false, error: agendaResponse.error }, 'server-empty');
          }
        } catch (serverError) {
          console.warn('⚠️ Server load failed:', serverError);
          cacheMonitoringService.logStateTransition('useSessionData', { agendaLoaded: false }, { agendaLoaded: false, error: serverError.message }, 'server-failed');
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
              loadSource = 'localStorage';
              console.log('🏠 LOCALSTORAGE: Loading sessions from localStorage fallback');
              cacheMonitoringService.logStateTransition('useSessionData', { sessions: [] }, { sessions: allSessionsData }, 'localStorage-fallback');
            }
          }
        } catch (localStorageError) {
          console.warn('⚠️ localStorage fallback failed:', localStorageError);
        }
      }
      
      // Step 4: If still no data, set error state
      if (allSessionsData.length === 0) {
        const errorMessage = 'Unable to load conference schedule from any source';
        console.error('❌ All data sources failed:', errorMessage);
        cacheMonitoringService.logStateTransition('useSessionData', { sessions: [] }, { sessions: [], error: errorMessage }, 'all-sources-failed');
        setError(errorMessage);
        setAllSessions([]);
        setSessions([]);
        setLastUpdated(new Date());
        return;
      }
      
      console.log(`✅ Progressive loading successful from ${loadSource}:`, {
        sessionsCount: allSessionsData.length,
        loadSource,
        timestamp: new Date().toISOString()
      });
      
      // Store all sessions for conference start date logic
      setAllSessions(allSessionsData);
      
      // If we loaded from cache, refresh from server in background
      if (loadSource === 'cache' || loadSource === 'localStorage') {
        console.log('🔄 BACKGROUND: Refreshing data from server in background');
        
        // ✅ ARCHITECTURE-COMPLIANT: Refresh both External DB (conference data) and Application DB (metadata)
        Promise.all([
          agendaService.getActiveAgendaItems(),
          getAllDiningOptions(), // ✅ CRITICAL FIX: Refresh dining data from source
          pwaDataSyncService.getCachedTableData('dining_item_metadata')
        ]).then(([agendaResponse, diningResponse, diningMetadata]) => {
          if (agendaResponse.success && agendaResponse.data && agendaResponse.data.length > 0) {
            console.log('🔄 BACKGROUND: Server refresh successful, updating cache');
            
            // Update conference data (External DB)
            setAllSessions(agendaResponse.data);
            setSessions(filterSessionsForAttendee(agendaResponse.data, attendeeData));
            
            // ✅ CRITICAL FIX: Update dining data from fresh source
            if (diningResponse.success && diningResponse.data && diningResponse.data.length > 0) {
              console.log('🍽️ BACKGROUND: Refreshing dining data from source');
              setDiningOptions(diningResponse.data);
              
              // ✅ CRITICAL: Re-apply Application Database metadata overrides
              if (diningMetadata && diningMetadata.length > 0) {
                console.log('🍽️ BACKGROUND: Re-applying dining metadata overrides from Application DB');
                const enrichedDiningOptions = diningResponse.data.map(option => {
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
            } else {
              console.warn('🍽️ BACKGROUND: Dining data refresh failed, keeping existing data');
            }
            
            setLastUpdated(new Date());
          }
        }).catch(err => {
          console.warn('🔄 BACKGROUND: Server refresh failed:', err);
          // ✅ ERROR HANDLING: Log specific failure types for debugging
          if (err.message?.includes('dining')) {
            console.warn('🍽️ BACKGROUND: Dining data sync failed:', err);
          }
        });
      }
      
      // Filter sessions for current attendee based on session type and breakout assignments
      let filteredSessions = filterSessionsForAttendee(allSessionsData, attendeeData);
      
      // Merge sessions and dining events (use dining data with metadata overrides)
      const combinedEvents = mergeAndSortEvents(filteredSessions, diningData);
      setAllEvents(combinedEvents);
      
      // 🔍 DEBUG: Enhanced logging for dining regression investigation
      console.log('🍽️ DINING DEBUG: Data loading analysis', {
        diningDataLength: diningData.length,
        filteredSessionsLength: filteredSessions.length,
        combinedEventsLength: combinedEvents.length,
        diningEvents: combinedEvents.filter(e => e.type === 'dining').length,
        sessionEvents: combinedEvents.filter(e => e.type !== 'dining').length,
        timestamp: new Date().toISOString(),
        loadSource: loadSource
      });
      
      // Set filtered sessions for backward compatibility
      setSessions(filteredSessions);

      // Log state transition with detailed data
      console.log('🔄 STATE TRANSITION:', {
        allSessionsCount: allSessionsData.length,
        filteredSessionsCount: filteredSessions.length,
        attendeeId: attendeeData?.id,
        timestamp: new Date().toISOString(),
        loadingSource: 'server'
      });
      
      cacheMonitoringService.logStateTransition('useSessionData', 
        { sessions: [], allSessions: [] }, 
        { sessions: filteredSessions, allSessions: allSessionsData }, 
        'server-success'
      );

      setSessions(filteredSessions);
      setLastUpdated(new Date());
      
      // Register session boundaries with TimeService for boundary detection
      TimeService.registerSessionBoundaries(filteredSessions);

      // Determine current and next events (sessions + dining)
      const currentTime = getCurrentTime();
      
      // Find current active event (session or dining)
      const activeEvent = combinedEvents.find(event => {
        if (event.type === 'dining') {
          return isDiningActive(event, currentTime);
        } else {
          return isSessionActive(event, currentTime);
        }
      });
      
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

      // Enhance events with seat assignment data (for sessions only)
      const enhanceEventWithSeatInfo = (event) => {
        if (!event || !seatAssignments.length) return event || null;
        
        // Only enhance sessions with seat info, not dining events
        if (event.type === 'dining') {
          return event;
        }
        
        // Find seat assignment for this session (if any)
        const seatAssignment = seatAssignments.find(seat => 
          seat.seating_configuration_id === event.seating_configuration_id
        );
        
        return {
          ...event,
          seatInfo: seatAssignment ? {
            table: seatAssignment.table_name,
            seat: seatAssignment.seat_number,
            position: seatAssignment.seat_position
          } : null
        };
      };

      setCurrentSession(enhanceEventWithSeatInfo(activeEvent) || null);
      setNextSession(enhanceEventWithSeatInfo(upcomingEvent) || null);
      
      // 🔍 DEBUG: Enhanced logging for current/next session determination
      console.log('🍽️ DINING DEBUG: Current/Next session analysis', {
        activeEvent: activeEvent ? {
          type: activeEvent.type,
          title: activeEvent.title || activeEvent.name,
          start_time: activeEvent.start_time,
          isDining: activeEvent.type === 'dining'
        } : null,
        upcomingEvent: upcomingEvent ? {
          type: upcomingEvent.type,
          title: upcomingEvent.title || upcomingEvent.name,
          start_time: upcomingEvent.start_time,
          isDining: upcomingEvent.type === 'dining'
        } : null,
        combinedEventsCount: combinedEvents.length,
        diningEventsCount: combinedEvents.filter(e => e.type === 'dining').length,
        timestamp: new Date().toISOString()
      });

      console.log('✅ useSessionData: Data loaded successfully', {
        allSessions: allSessionsData.length,
        filteredSessions: filteredSessions.length,
        diningOptions: diningData.length,
        allEvents: combinedEvents.length,
        currentEvent: activeEvent?.title || activeEvent?.name,
        nextEvent: upcomingEvent?.title || upcomingEvent?.name,
        attendeeId: attendeeData?.id,
        seatAssignments: seatAssignments.length
      });

    } catch (err) {
      console.error('❌ Error loading session data:', err);
      cacheMonitoringService.logStateTransition('useSessionData', { error: null }, { error: err.message }, 'error');
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
        } catch (cacheErr) {
          console.warn('⚠️ Failed to load cached data:', cacheErr);
          cacheMonitoringService.logCacheCorruption('kn_cached_sessions', cacheErr.message, { error: cacheErr });
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
      localStorage.setItem('kn_cached_sessions', JSON.stringify(cacheData));
    }
  }, [sessions, diningOptions, allEvents, currentSession, nextSession, lastUpdated, enableOfflineMode]);

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
      // Re-evaluate event states when time override changes
      const currentTime = getCurrentTime();
      
      // Find current active event (session or dining)
      const activeEvent = allEvents.find(event => {
        if (event.type === 'dining') {
          return isDiningActive(event, currentTime);
        } else {
          return isSessionActive(event, currentTime);
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
        if (prev?.id !== activeEvent?.id) {
          return activeEvent;
        }
        return prev;
      });
      
      setNextSession(prev => {
        if (prev?.id !== upcomingEvent?.id) {
          return upcomingEvent;
        }
        return prev;
      });
    };

    // Listen for time override changes via localStorage (cross-tab)
    const handleStorageChange = (e) => {
      if (e.key === 'kn_time_override' || e.key === 'kn_time_override_start') {
        handleTimeOverrideChange();
      }
    };

    // Listen for time override changes via custom event (same-tab)
    const handleTimeOverrideUpdate = () => {
      handleTimeOverrideChange();
    };
    
    // Listen for session boundary crossings
    const handleBoundaryCrossing = () => {
      console.log('🕐 Session boundary crossed, updating session states');
      handleTimeOverrideChange();
    };

    // Listen for dining metadata cache invalidation
    const handleDiningMetadataUpdate = () => {
      console.log('🍽️ Dining metadata updated, refreshing dining data');
      // ✅ CRITICAL FIX: Force refresh of dining data from source
      getAllDiningOptions().then(response => {
        console.log('🍽️ Dining data refreshed from source after metadata update');
        setDiningOptions(response);
        // Trigger full data reload to ensure dining events are properly merged
        loadSessionData();
      }).catch(err => {
        console.warn('🍽️ Failed to refresh dining data after metadata update:', err);
        // Fallback to full reload
        loadSessionData();
      });
    };

    // Listen for agenda metadata cache invalidation
    const handleAgendaMetadataUpdate = () => {
      console.log('📋 Agenda metadata updated, refreshing session data');
      loadSessionData();
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
          return isDiningActive(event, currentTime);
        } else {
          return isSessionActive(event, currentTime);
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
      // Don't clear events just because none are currently active - this causes the flash
      setCurrentSession(prev => {
        // Only update if we found an active event or if we're intentionally clearing
        if (activeEvent && prev?.id !== activeEvent?.id) {
          return activeEvent;
        }
        // Don't clear current event if no active event found - keep the last known state
        // This prevents the flash to "Conference Not Started" state
        return prev;
      });
      
      setNextSession(prev => {
        // Only update if we found an upcoming event or if we're intentionally clearing
        if (upcomingEvent && prev?.id !== upcomingEvent?.id) {
          return upcomingEvent;
        }
        // Don't clear next event if no upcoming event found - keep the last known state
        // This prevents the flash to "Conference Not Started" state
        return prev;
      });
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
