import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import DayHeader from './DayHeader';
import SessionCard from './session/SessionCard';

/**
 * Schedule View Container Component
 * Displays personalized schedule with day grouping and session cards
 * Story 2.2: Personalized Schedule View - Task 3
 */
const ScheduleView = ({
  sessions = [],
  className = '',
  onSessionClick,
  ...props
}) => {
  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const groups = {};
    
    sessions.forEach(session => {
      const date = session.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(session);
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
  }, [sessions]);

  // Handle session click
  const handleSessionClick = (session) => {
    if (onSessionClick) {
      onSessionClick(session);
    }
  };

  if (sessions.length === 0) {
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
  sessions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    start_time: PropTypes.string,
    end_time: PropTypes.string,
    location: PropTypes.string,
    speaker: PropTypes.string,
    type: PropTypes.string,
    seatInfo: PropTypes.object
  })),
  className: PropTypes.string,
  onSessionClick: PropTypes.func
};

ScheduleView.defaultProps = {
  sessions: [],
  className: '',
  onSessionClick: null
};

export default ScheduleView;
