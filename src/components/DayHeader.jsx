import React from 'react';
import PropTypes from 'prop-types';

/**
 * Day Header Component
 * Displays day information with purple styling and session count
 * Story 2.2: Personalized Schedule View - Task 2
 */
const DayHeader = ({
  date,
  sessionCount = 0,
  className = '',
  ...props
}) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // ✅ FIX: Parse date without timezone conversion to avoid day shift
    // Split YYYY-MM-DD and create date in local timezone
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Format session count
  const formatSessionCount = (count) => {
    if (count === 0) return 'No sessions';
    if (count === 1) return '1 session';
    return `${count} sessions`;
  };

  return (
    <div 
      className={`day-header ${className}`}
      style={{
        background: 'var(--purple-500)',
        color: 'white',
        padding: 'var(--space-md) var(--space-lg)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        borderBottom: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
      {...props}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-sm)'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--font-semibold)',
          lineHeight: '1.2'
        }}>
          {formatDate(date)}
        </h2>
        
        <span style={{
          fontSize: 'var(--text-sm)',
          opacity: 0.9,
          fontWeight: 'var(--font-medium)'
        }}>
          {formatSessionCount(sessionCount)}
        </span>
      </div>
    </div>
  );
};

DayHeader.propTypes = {
  date: PropTypes.string.isRequired,
  sessionCount: PropTypes.number,
  className: PropTypes.string
};

DayHeader.defaultProps = {
  sessionCount: 0,
  className: ''
};

export default DayHeader;
