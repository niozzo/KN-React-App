import React from 'react';
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
  
  // Load real session data with offline support
  const {
    currentSession,
    nextSession,
    sessions,
    allSessions,
    attendee,
    seatAssignments,
    isLoading,
    isOffline,
    error,
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

  const handleSessionClick = (session) => {
    if (session) {
      // Navigate to schedule page with session focus
      navigate(`/schedule#session-${session.id}`);
    }
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
        console.log('🔍 hasConferenceEnded: No sessions available');
        return false;
      }

      const now = TimeService.getCurrentTime();
      console.log('🔍 hasConferenceEnded: Current time:', now.toISOString());
      
      const sessionChecks = allSessions.map(session => {
        // Validate session object
        if (!session || typeof session !== 'object') {
          console.warn('Invalid session object:', session);
          return false;
        }

        // Check required fields
        if (!session.end_time || !session.date) {
          console.warn('Session missing end_time or date:', session);
          return false;
        }

        try {
          const sessionEnd = new Date(`${session.date}T${session.end_time}`);
          
          // Validate date
          if (isNaN(sessionEnd.getTime())) {
            console.warn('Invalid session end date:', session.end_time, session.date);
            return false;
          }

          const isPast = sessionEnd < now;
          console.log(`🔍 Session "${session.title}": end=${sessionEnd.toISOString()}, isPast=${isPast}`);
          return isPast;
        } catch (dateError) {
          console.warn('Error parsing session date:', dateError, session);
          return false;
        }
      });
      
      const allSessionsEnded = sessionChecks.every(check => check);
      console.log('🔍 hasConferenceEnded result:', allSessionsEnded);
      return allSessionsEnded;
    } catch (error) {
      console.error('Error checking if conference has ended:', error);
      return false;
    }
  }, [allSessions]);

  // Get the conference start date from the first agenda item
  const getConferenceStartDate = () => {
    if (!allSessions || allSessions.length === 0) {
      return 'TBD';
    }
    
    const firstSession = allSessions[0];
    if (!firstSession.date) {
      return 'TBD';
    }
    
    // Parse date without timezone conversion to avoid day shift
    const [year, month, day] = firstSession.date.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Determine if next session is tomorrow
  const isNextSessionTomorrow = () => {
    if (!nextSession || !nextSession.date) return false;
    
    const currentTime = TimeService.getCurrentTime();
    const currentDate = currentTime.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Calculate tomorrow's date
    const tomorrow = new Date(currentTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    return nextSession.date === tomorrowDate;
  };

  // Determine if we should show tomorrow-only mode
  const shouldShowTomorrowOnly = () => {
    return hasConferenceStarted && !currentSession && nextSession && isNextSessionTomorrow();
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
  console.log('🔍 HomePage Debug:', {
    isLoading,
    hasAttendee: !!attendee,
    hasConferenceEnded,
    allSessionsCount: allSessions?.length || 0,
    currentSession: !!currentSession,
    nextSession: !!nextSession,
    hasConferenceStarted
  });
  
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
          <h2 className="section-title">
            Thank you for attending!
          </h2>
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
          <h2 className="section-title">Now & Next</h2>
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
          <h2 className="section-title">Unable to Load Schedule</h2>
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
          <h2 className="section-title">
            Conference schedule to start on {getConferenceStartDate()}
          </h2>
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
        <h2 className="section-title">
          {hasConferenceEnded
            ? 'Thank you for attending!'
            : shouldShowTomorrowOnly() 
              ? 'Tomorrow' 
              : hasConferenceStarted 
                ? 'Now & Next' 
                : `Scheduled Start Date: ${getConferenceStartDate()}`
          }
        </h2>
        <AnimatedNowNextCards
          currentSession={currentSession}
          nextSession={nextSession}
          hasConferenceStarted={hasConferenceStarted}
          hasConferenceEnded={hasConferenceEnded}
          onSessionClick={handleSessionClick}
          tomorrowOnly={shouldShowTomorrowOnly()}
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
