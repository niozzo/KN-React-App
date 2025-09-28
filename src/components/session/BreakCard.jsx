import React from 'react';
import PropTypes from 'prop-types';
import Card, { CardHeader, CardContent } from '../common/Card';
import StatusTag from '../common/StatusTag';

/**
 * Break Card Component
 * Displays break time information when attendee has no breakout sessions
 * Story 2.2.1: Breakout Session Filtering - AC 4, 8
 */
const BreakCard = ({
  timeSlot,
  className = '',
  variant = 'default'
}) => {
  return (
    <Card className={`break-card ${className}`} variant={variant}>
      <CardHeader>
        <div className="break-indicator">
          <span className="break-icon">☕</span>
          <span className="break-text">Break</span>
        </div>
        <StatusTag variant="break">Break Time</StatusTag>
      </CardHeader>
      
      <CardContent>
        <h3 className="break-title">Enjoy your break</h3>
        <p className="break-description">
          Take this time to network, grab refreshments, or prepare for your next session.
        </p>
        
        {timeSlot && (
          <div className="break-time-info">
            <span className="break-time-label">Break Time:</span>
            <span className="break-time-value">{timeSlot}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

BreakCard.propTypes = {
  timeSlot: PropTypes.string,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'now', 'next'])
};

export default BreakCard;
