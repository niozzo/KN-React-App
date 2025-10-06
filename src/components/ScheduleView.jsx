import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import DayHeader from './DayHeader';
import SessionCard from './session/SessionCard';
import useSessionData from '../hooks/useSessionData';

/**
 * Schedule View Container Component
 * Displays personalized schedule with day grouping and session cards
 * Story 2.2: Personalized Schedule View - Task 3
 * Refactored to use useSessionData directly following architectural patterns
 */
const ScheduleView = ({
  className = '',
  onSessionClick,
  ...props
}) => {
  // Use useSessionData directly - following established architectural patterns
  const { allEvents, isLoading, error, isOffline } = useSessionData();

  // Group sessions by date - view-specific logic in component
  const groupedSessions = useMemo(() => {
    if (!allEvents || allEvents.length === 0) {
      return [];
    }

    const groups = {};
    
    allEvents.forEach(event => {
      const date = event.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });
    
    // Sort sessions within each day by start time
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => {
        if (!a.start_time || !b.start_time) return 0;
        return a.start_time.localeCompare(b.start_time);
      });
    });
    
    // Sort days chronologically
    const sortedDates = Object.keys(groups).sort((a, b) => {
      return new Date(a) - new Date(b);
    });
    
    return sortedDates.map(date => ({
      date,
      sessions: groups[date]
    }));
  }, [allEvents]);

  // Handle session click
  const handleSessionClick = (session) => {
    if (onSessionClick) {
      onSessionClick(session);
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className={`schedule-view schedule-view--loading ${className}`} {...props}>
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-xl)',
          color: 'var(--text-secondary)'
        }}>
          <h3>Loading your schedule...</h3>
          <p>Please wait while we fetch your personalized schedule.</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={`schedule-view schedule-view--error ${className}`} {...props}>
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-xl)',
          color: 'var(--text-error)'
        }}>
          <h3>Unable to load schedule</h3>
          <p>There was an error loading your schedule. Please try again later.</p>
          {isOffline && <p><em>You appear to be offline.</em></p>}
        </div>
      </div>
    );
  }

  // Handle empty state
  if (groupedSessions.length === 0) {
    return (
      <div className={`schedule-view schedule-view--empty ${className}`} {...props}>
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-xl)',
          color: 'var(--text-secondary)'
        }}>
          <h3>No sessions scheduled</h3>
          <p>Your personalized schedule will appear here once sessions are assigned.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`schedule-view ${className}`} {...props}>
      {groupedSessions.map(({ date, sessions: daySessions }) => (
        <div key={date} className="schedule-day-group">
          <DayHeader 
            date={date} 
            sessionCount={daySessions.length}
          />
          
          <div className="schedule-day-sessions">
            {daySessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                variant="agenda"
                onClick={() => handleSessionClick(session)}
                className="schedule-session-card"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

ScheduleView.propTypes = {
  className: PropTypes.string,
  onSessionClick: PropTypes.func
};

ScheduleView.defaultProps = {
  className: '',
  onSessionClick: null
};

export default ScheduleView;
