import React, { useState, useEffect, useRef } from 'react';
import SessionCard from './session/SessionCard';
import Card from './common/Card';
import Button from './common/Button';
import { useNavigate } from 'react-router-dom';
import TimeService from '../services/timeService';

/**
 * Determine if the next session is on the next day
 * @param {Object} nextSession - The next session object
 * @returns {boolean} Whether the next session is tomorrow
 */
const isNextSessionTomorrow = (nextSession) => {
  if (!nextSession || !nextSession.date) return false;
  
  const currentTime = TimeService.getCurrentTime();
  const currentDate = currentTime.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  return nextSession.date !== currentDate;
};

/**
 * Animated Now/Next Cards Component
 * Handles smooth transitions when Now/Next sessions change
 * 
 * Animation behavior:
 * - New Now card pushes old Now card down and changes its label to Next
 * - Old Next card disappears under the full schedule card
 */
const AnimatedNowNextCards = ({
  currentSession,
  nextSession,
  hasConferenceStarted,
  onSessionClick,
  className = '',
  tomorrowOnly = false
}) => {
  const navigate = useNavigate();
  const [previousSessions, setPreviousSessions] = useState({
    current: null,
    next: null
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState('normal');
  const nowCardRef = useRef(null);
  const nextCardRef = useRef(null);

  // Track session changes for animations
  useEffect(() => {
    const currentId = currentSession?.id;
    const nextId = nextSession?.id;
    const prevCurrentId = previousSessions.current?.id;
    const prevNextId = previousSessions.next?.id;

    // Check if we need to animate a transition
    if (currentId !== prevCurrentId || nextId !== prevNextId) {
      // Special case: New Now session (old Now becomes Next)
      if (currentId !== prevCurrentId && prevCurrentId && currentId) {
        
        // Start animation immediately
        setIsTransitioning(true);
        setTransitionType('now-to-next');
        
        // After animation completes, update the sessions
        const timer = setTimeout(() => {
          setPreviousSessions({
            current: currentSession,
            next: previousSessions.current // Old Now becomes Next
          });
          setIsTransitioning(false);
          setTransitionType('normal');
        }, 800);

        return () => clearTimeout(timer);
      }
      // Special case: Next session disappears
      else if (nextId !== prevNextId && prevNextId && !nextId) {
        
        // Start animation immediately
        setIsTransitioning(true);
        setTransitionType('next-disappear');
        
        // After animation completes, update the sessions
        const timer = setTimeout(() => {
          setPreviousSessions({
            current: currentSession,
            next: nextSession
          });
          setIsTransitioning(false);
          setTransitionType('normal');
        }, 600);

        return () => clearTimeout(timer);
      }
      
      // For other changes, update immediately without animation
      setPreviousSessions({
        current: currentSession,
        next: nextSession
      });
    }
  }, [currentSession, nextSession]);

  // Render Now card
  const renderNowCard = () => {
    // In tomorrow-only mode, don't show any Now card
    if (tomorrowOnly) {
      return null;
    }
    
    // During now-to-next animation, show the new current session as Now
    if (currentSession) {
      return (
        <div 
          className="now-card-wrapper" 
          ref={nowCardRef}
          style={{
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateY(0) scale(1)',
            opacity: 1,
            zIndex: 2
          }}
        >
          <SessionCard 
            session={currentSession} 
            variant="now"
            onClick={() => onSessionClick(currentSession)}
            className="animated-session-card"
          />
        </div>
      );
    }

    // If no current session but conference has started, show "Between Sessions"
    if (hasConferenceStarted) {
      return (
        <div 
          className="now-card-wrapper" 
          ref={nowCardRef}
          style={{
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateY(0) scale(1)',
            opacity: 1,
            zIndex: 2
          }}
        >
          <Card className="no-session-card" style={{
            background: 'var(--gray-50)',
            border: '2px dashed var(--gray-300)',
            textAlign: 'center',
            padding: 'var(--space-xl)'
          }}>
            <div className="no-session-content">
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>☕</div>
              <h3 style={{ 
                color: 'var(--text-secondary)', 
                marginBottom: 'var(--space-xs)',
                fontSize: 'var(--text-lg)'
              }}>
                Between Sessions
              </h3>
              <p style={{ 
                color: 'var(--text-tertiary)',
                fontSize: 'var(--text-sm)'
              }}>
                Take a break or check your full schedule
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/schedule')}
                style={{ marginTop: 'var(--space-sm)' }}
              >
                View Schedule
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return null;
  };

  // Render Next card
  const renderNextCard = () => {

    // During now-to-next animation, show the old Now card sliding down as Next
    if (isTransitioning && transitionType === 'now-to-next' && previousSessions.current) {
      const isTomorrow = isNextSessionTomorrow(previousSessions.current);
      
      return (
        <div 
          className="next-card-wrapper" 
          ref={nextCardRef}
          style={{
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateY(0) scale(0.95)',
            opacity: 0.8,
            zIndex: 1
          }}
        >
          {isTomorrow && !tomorrowOnly && (
            <div 
              className="tomorrow-title"
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-sm)',
                textAlign: 'left'
              }}
            >
              Tomorrow
            </div>
          )}
          <SessionCard 
            session={previousSessions.current} 
            variant="next"
            onClick={() => onSessionClick(previousSessions.current)}
            className="animated-session-card"
          />
        </div>
      );
    }

    // During next-disappear animation, show the old Next card fading out
    if (isTransitioning && transitionType === 'next-disappear' && previousSessions.next) {
      const isTomorrow = isNextSessionTomorrow(previousSessions.next);
      
      return (
        <div 
          className="next-card-wrapper" 
          ref={nextCardRef}
          style={{
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateY(0) scale(0.95)',
            opacity: 0,
            zIndex: 0
          }}
        >
          {isTomorrow && !tomorrowOnly && (
            <div 
              className="tomorrow-title"
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-sm)',
                textAlign: 'left'
              }}
            >
              Tomorrow
            </div>
          )}
          <SessionCard 
            session={previousSessions.next} 
            variant="next"
            onClick={() => onSessionClick(previousSessions.next)}
            className="animated-session-card"
          />
        </div>
      );
    }
    
    // Normal state - show current next session
    if (nextSession) {
      const isTomorrow = isNextSessionTomorrow(nextSession);
      
      return (
        <div 
          className="next-card-wrapper" 
          ref={nextCardRef}
          style={{
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: tomorrowOnly ? 'translateY(0) scale(1)' : 'translateY(0) scale(1)',
            opacity: 1,
            zIndex: tomorrowOnly ? 2 : 1 // Higher z-index when it's the only card
          }}
        >
          {isTomorrow && !tomorrowOnly && (
            <div 
              className="tomorrow-title"
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-sm)',
                textAlign: 'left'
              }}
            >
              Tomorrow
            </div>
          )}
          <SessionCard 
            session={nextSession} 
            variant="next"
            onClick={() => onSessionClick(nextSession)}
            className="animated-session-card"
          />
        </div>
      );
    }

    // If no next session but conference has started, show "All Done!"
    if (hasConferenceStarted) {
      return (
        <div 
          className="next-card-wrapper" 
          ref={nextCardRef}
          style={{
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateY(0) scale(1)',
            opacity: 1,
            zIndex: 1
          }}
        >
          <Card className="no-session-card" style={{
            background: 'var(--gray-50)',
            border: '2px dashed var(--gray-300)',
            textAlign: 'center',
            padding: 'var(--space-xl)'
          }}>
            <div className="no-session-content">
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>🎉</div>
              <h3 style={{ 
                color: 'var(--text-secondary)', 
                marginBottom: 'var(--space-xs)',
                fontSize: 'var(--text-lg)'
              }}>
                All Done!
              </h3>
              <p style={{ 
                color: 'var(--text-tertiary)',
                fontSize: 'var(--text-sm)'
              }}>
                No more sessions scheduled for today
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/schedule')}
                style={{ marginTop: 'var(--space-sm)' }}
              >
                View Schedule
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`animated-now-next-cards ${className} ${isTransitioning ? transitionType : ''}`}>
      <div className="cards-container">
        {renderNowCard()}
        {renderNextCard()}
      </div>
    </div>
  );
};

export default AnimatedNowNextCards;
