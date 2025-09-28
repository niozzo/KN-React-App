import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import AnimatedNowNextCards from '../components/AnimatedNowNextCards';
import ConferenceEndedCard from '../components/ConferenceEndedCard';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import InstallPrompt from '../components/InstallPrompt';
import useSessionData from '../hooks/useSessionData';
import TimeOverride from '../components/dev/TimeOverride';
import TimeService from '../services/timeService';

/**
 * Home Page Component
 * Main dashboard with Now/Next cards and quick actions
 * Story 2.1: Now/Next Glance Card - Enhanced with real data integration
 */
const HomePage = () => {
  const navigate = useNavigate();
  
  // State to force re-evaluation when time override changes
  const [timeOverrideTrigger, setTimeOverrideTrigger] = useState(0);
  
  // Load real session data with offline support
  const {
    currentSession,
    nextSession,
    sessions,
    allSessions,
    diningOptions,
    allEvents,
    attendee,
    seatAssignments,
    isLoading,
    isOffline,
    error,
    diningError,
    refresh
  } = useSessionData({
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
    enableOfflineMode: true
  });

  const handleScheduleClick = () => {
    // Navigate to schedule page
    navigate('/schedule#current');
  };


  // Determine if conference has started (has any sessions in the past)
  const hasConferenceStarted = allSessions && allSessions.some(session => {
    if (!session.start_time || !session.date) return false;
    const sessionStart = new Date(`${session.date}T${session.start_time}`);
    const now = TimeService.getCurrentTime();
    return sessionStart < now;
  });

  // Determine if conference has ended (all sessions are in the past)
  const hasConferenceEnded = React.useMemo(() => {
    try {
      // Safety checks
      if (!allSessions || !Array.isArray(allSessions) || allSessions.length === 0) {
        return false;
      }

      const now = TimeService.getCurrentTime();
      
      const sessionChecks = allSessions.map(session => {
        // Validate session object
        if (!session || typeof session !== 'object') {
          return false;
        }

        // Check required fields
        if (!session.end_time || !session.date) {
          return false;
        }

        try {
          const sessionEnd = new Date(`${session.date}T${session.end_time}`);
          
          // Validate date
          if (isNaN(sessionEnd.getTime())) {
            return false;
          }

          const isPast = sessionEnd < now;
          return isPast;
        } catch (dateError) {
          return false;
        }
      });
      
      const allSessionsEnded = sessionChecks.every(check => check);
      return allSessionsEnded;
    } catch (error) {
      return false;
    }
  }, [allSessions, timeOverrideTrigger, currentSession]);

  // Listen for time override changes to re-evaluate hasConferenceEnded
  useEffect(() => {
    const handleTimeOverrideChange = () => {
      setTimeOverrideTrigger(prev => prev + 1);
    };
    
    // Listen for time override changes
    window.addEventListener('timeOverrideChanged', handleTimeOverrideChange);
    
    return () => {
      window.removeEventListener('timeOverrideChanged', handleTimeOverrideChange);
    };
  }, []);

  // Listen for session state changes to re-evaluate hasConferenceEnded
  useEffect(() => {
    // Trigger re-evaluation when currentSession changes
    if (!currentSession && hasConferenceEnded === false) {
      setTimeOverrideTrigger(prev => prev + 1);
    }
  }, [currentSession, hasConferenceEnded]);

  // Get the conference start date from the earliest event (agenda items or dining options)
  const getConferenceStartDate = () => {
    const allDates = [];
    
    // Collect dates from agenda items
    if (allSessions && allSessions.length > 0) {
      allSessions.forEach(session => {
        if (session.date) {
          allDates.push(session.date);
        }
      });
    }
    
    // Collect dates from dining options
    if (diningOptions && diningOptions.length > 0) {
      diningOptions.forEach(dining => {
        if (dining.date) {
          allDates.push(dining.date);
        }
      });
    }
    
    // If no dates found, return TBD
    if (allDates.length === 0) {
      return 'TBD';
    }
    
    // Find the earliest date
    const earliestDate = allDates.sort()[0];
    
    // Parse date without timezone conversion to avoid day shift
    const [year, month, day] = earliestDate.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Get the raw conference start date for comparison
  const getConferenceStartDateRaw = () => {
    const allDates = [];
    
    // Collect dates from agenda items
    if (allSessions && allSessions.length > 0) {
      allSessions.forEach(session => {
        if (session.date) {
          allDates.push(session.date);
        }
      });
    }
    
    // Collect dates from dining options
    if (diningOptions && diningOptions.length > 0) {
      diningOptions.forEach(dining => {
        if (dining.date) {
          allDates.push(dining.date);
        }
      });
    }
    
    // If no dates found, return null
    if (allDates.length === 0) {
      return null;
    }
    
    // Find the earliest date
    return allDates.sort()[0];
  };

  // Get the date of the events being displayed (current or next session)
  const getDisplayedEventDate = () => {
    // If there's a current session, use its date
    if (currentSession && currentSession.date) {
      return currentSession.date;
    }
    
    // If there's a next session, use its date
    if (nextSession && nextSession.date) {
      return nextSession.date;
    }
    
    // Fallback to conference start date
    return getConferenceStartDateRaw();
  };

  // Format a date string (YYYY-MM-DD) to display format
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'TBD';
    
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Determine if two sessions are on different days
  const areSessionsOnDifferentDays = (session1, session2) => {
    if (!session1?.date || !session2?.date) return false;
    return session1.date !== session2.date;
  };

  // Get the date title to display above cards
  const getDateTitle = () => {
    // If we have both current and next sessions
    if (currentSession && nextSession) {
      // Check if they're on different days
      if (areSessionsOnDifferentDays(currentSession, nextSession)) {
        // Show the current session's date above the entire section
        return formatDateForDisplay(currentSession.date);
      } else {
        // Same day - show the date above the entire section
        return formatDateForDisplay(currentSession.date);
      }
    }
    
    // If we only have a current session
    if (currentSession && !nextSession) {
      return formatDateForDisplay(currentSession.date);
    }
    
    // If we only have a next session (before conference)
    if (!currentSession && nextSession) {
      return formatDateForDisplay(nextSession.date);
    }
    
    // Fallback
    return null;
  };

  // Determine if we should show "Scheduled Start Date:" prefix or just the date
  const getDateDisplayText = () => {
    const displayedEventDate = getDisplayedEventDate();
    if (!displayedEventDate) {
      return 'TBD';
    }

    const currentTime = TimeService.getCurrentTime();
    const currentDate = currentTime.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // If current date is on or after the displayed event date, show just the date
    if (currentDate >= displayedEventDate) {
      return formatDateForDisplay(displayedEventDate);
    }
    
    // Before the displayed event date, show with prefix
    return `Scheduled Start Date: ${formatDateForDisplay(displayedEventDate)}`;
  };


  // Show loading state
  if (isLoading) {
    return (
      <PageLayout data-testid="home-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your schedule...</p>
        </div>
      </PageLayout>
    );
  }

  // Show error state
  if (error && !isOffline) {
    return (
      <PageLayout data-testid="home-page">
        <div className="error-container" style={{
          textAlign: 'center',
          padding: 'var(--space-xl)',
          background: 'var(--red-50)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--red-200)',
          margin: 'var(--space-lg)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>⚠️</div>
          <h2 style={{ color: 'var(--red-700)', marginBottom: 'var(--space-sm)' }}>
            Unable to load schedule
          </h2>
          <p style={{ color: 'var(--red-600)', marginBottom: 'var(--space-lg)' }}>
            {error}
          </p>
          <Button onClick={refresh} variant="primary">
            Try Again
          </Button>
        </div>
      </PageLayout>
    );
  }

  // Show conference ended state - when all sessions are in the past AND no current/next sessions
  if (!isLoading && attendee && hasConferenceEnded && !currentSession && !nextSession) {
    return (
      <PageLayout data-testid="home-page">
        <TimeOverride />
        
        {isOffline && (
          <div className="offline-indicator">
            <span>📱 Offline mode - showing cached data</span>
          </div>
        )}

        <section className="now-next-section">
          <div className="cards-container">
            <ConferenceEndedCard />
          </div>
        </section>
      </PageLayout>
    );
  }

  // Show no assignments state - when there are no sessions assigned to this attendee
  // But only if the conference has started (there are sessions available) AND conference hasn't ended
  if (!isLoading && attendee && (!currentSession && !nextSession) && hasConferenceStarted && !hasConferenceEnded) {
    return (
      <PageLayout data-testid="home-page">
        <TimeOverride />
        
        {isOffline && (
          <div className="offline-indicator">
            <span>📱 Offline mode - showing cached data</span>
          </div>
        )}

        <section className="now-next-section">
          <div className="cards-container">
            <Card className="no-assignments-card" style={{
              background: 'var(--blue-50)',
              border: '2px solid var(--blue-200)',
              textAlign: 'center',
              padding: 'var(--space-xl)',
              gridColumn: '1 / -1'
            }}>
              <div className="no-assignments-content">
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>📅</div>
                <h3 style={{ 
                  color: 'var(--blue-700)', 
                  marginBottom: 'var(--space-sm)',
                  fontSize: 'var(--text-xl)'
                }}>
                  No Sessions Assigned
                </h3>
                <p style={{ 
                  color: 'var(--blue-600)',
                  fontSize: 'var(--text-base)',
                  marginBottom: 'var(--space-lg)',
                  maxWidth: '400px',
                  margin: '0 auto var(--space-lg) auto'
                }}>
                  You don't have any sessions assigned for today. Check the full schedule to see all available sessions.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
                  <Button 
                    variant="primary"
                    onClick={() => navigate('/schedule')}
                  >
                    View Full Schedule
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/settings')}
                  >
                    Update Preferences
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </PageLayout>
    );
  }


  // Show data loading error state - when we have an error or no sessions due to loading failure
  if (!isLoading && attendee && (error || allSessions.length === 0)) {
    return (
      <PageLayout data-testid="home-page">
        <TimeOverride />
        
        {isOffline && (
          <div className="offline-indicator">
            <span>📱 Offline mode - showing cached data</span>
          </div>
        )}

        <section className="now-next-section">
          <div className="cards-container">
            <Card className="data-loading-error-card" style={{
              background: 'var(--red-50)',
              border: '2px solid var(--red-200)',
              textAlign: 'center',
              padding: 'var(--space-xl)',
              gridColumn: '1 / -1'
            }}>
              <div className="data-loading-error-content">
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>⚠️</div>
                <h3 style={{ 
                  color: 'var(--red-700)', 
                  marginBottom: 'var(--space-sm)',
                  fontSize: 'var(--text-xl)'
                }}>
                  Schedule Unavailable
                </h3>
                <p style={{ 
                  color: 'var(--red-600)',
                  fontSize: 'var(--text-base)',
                  marginBottom: 'var(--space-lg)',
                  maxWidth: '400px',
                  margin: '0 auto var(--space-lg) auto'
                }}>
                  {error || 'Unable to load conference schedule. Please check your connection and try again.'}
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
                  <Button 
                    variant="primary"
                    onClick={refresh}
                  >
                    Retry
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/schedule')}
                  >
                    View Full Schedule
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </PageLayout>
    );
  }

  // Show conference not started state - when there are no sessions assigned and conference hasn't started
  // Only show this state if we have successfully loaded sessions but conference hasn't started
  if (!isLoading && attendee && !error && allSessions.length > 0 && (!currentSession && !nextSession) && !hasConferenceStarted) {
    return (
      <PageLayout data-testid="home-page">
        <TimeOverride />
        
        {isOffline && (
          <div className="offline-indicator">
            <span>📱 Offline mode - showing cached data</span>
          </div>
        )}

        <section className="now-next-section">
          <div className="cards-container">
            <Card className="conference-not-started-card" style={{
              background: 'var(--blue-50)',
              border: '2px solid var(--blue-200)',
              textAlign: 'center',
              padding: 'var(--space-xl)',
              gridColumn: '1 / -1'
            }}>
              <div className="conference-not-started-content">
                <h3 style={{ 
                  color: 'var(--blue-700)', 
                  marginBottom: 'var(--space-sm)',
                  fontSize: 'var(--text-xl)'
                }}>
                  Conference Not Started
                </h3>
                <p style={{ 
                  color: 'var(--blue-600)',
                  fontSize: 'var(--text-base)',
                  marginBottom: 'var(--space-lg)',
                  maxWidth: '400px',
                  margin: '0 auto var(--space-lg) auto'
                }}>
                  The conference will begin on {getConferenceStartDate()}. Check back then for your personalized schedule.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
                  <Button 
                    variant="primary"
                    onClick={() => navigate('/schedule')}
                  >
                    View Full Schedule
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/settings')}
                  >
                    Update Preferences
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout data-testid="home-page">
      {/* Time Override (Dev/Staging Only) */}
      <TimeOverride />
      
      {/* Offline indicator */}
      {isOffline && (
        <div className="offline-indicator">
          <span>📱 Offline mode - showing cached data</span>
        </div>
      )}

      {/* Now/Next Section */}
      <section className="now-next-section">
        {getDateTitle() && (
          <h2 className="date-title" style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--ink-900)',
            marginBottom: 'var(--space-lg)',
            textAlign: 'left'
          }}>
            {getDateTitle()}
          </h2>
        )}
        <AnimatedNowNextCards
          currentSession={currentSession}
          nextSession={nextSession}
          hasConferenceStarted={hasConferenceStarted}
          hasConferenceEnded={hasConferenceEnded}
        />
      </section>

      {/* Schedule CTA */}
      <section className="schedule-cta">
        <Card 
          className="schedule-button"
          onClick={handleScheduleClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-lg)',
            background: 'var(--white)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--space-xl)',
            boxShadow: 'var(--shadow-xl)',
            transition: 'all var(--transition-slow)',
            textDecoration: 'none',
            color: 'inherit',
            border: '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          <div 
            className="cta-icon"
            style={{
              width: '48px',
              height: '48px',
              background: 'var(--purple-050)',
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-3xl)',
              flexShrink: 0
            }}
          >
            📅
          </div>
          <div className="cta-content" style={{ flex: 1, minWidth: 0 }}>
            <h3 
              className="cta-title"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--ink-900)',
                marginBottom: 'var(--space-xs)'
              }}
            >
              View Full Schedule
            </h3>
            <p 
              className="cta-description desktop-only"
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--ink-700)'
              }}
            >
              See your complete agenda
            </p>
          </div>
          <div 
            className="cta-arrow"
            style={{
              fontSize: 'var(--text-3xl)',
              color: 'var(--purple-700)',
              fontWeight: 'var(--font-semibold)',
              flexShrink: 0
            }}
          >
            →
          </div>
        </Card>
      </section>

      {/* PWA Install Button */}
      <section className="install-prompt-section">
        <InstallPrompt placement="home" />
      </section>
    </PageLayout>
  );
};

export default HomePage;
