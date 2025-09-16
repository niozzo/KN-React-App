import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardContent } from '../common/Card';
import StatusTag from '../common/StatusTag';
import useCountdown from '../../hooks/useCountdown';

/**
 * Session Card Component
 * Displays session information with status and countdown
 * Story 2.1: Now/Next Glance Card - Enhanced with real-time countdown
 */
const SessionCard = ({
  session,
  variant = 'default', // 'now' or 'next'
  onClick,
  className = ''
}) => {
  const navigate = useNavigate();
  const {
    title,
    start_time,
    end_time,
    date,
    location,
    speaker,
    seatInfo,
    type
  } = session;

  const isNow = variant === 'now';
  const isMeal = type && ['breakfast', 'lunch', 'dinner', 'coffee_break'].includes(type.toLowerCase());
  const isCoffeeBreak = title.toLowerCase().includes('coffee') || title.toLowerCase().includes('break');
  
  // Calculate end time for countdown
  const endTime = end_time && date ? new Date(`${date}T${end_time}`) : null;
  
  // Use countdown hook for real-time updates
  const { formattedTime, isActive, minutesRemaining } = useCountdown(endTime, {
    updateInterval: 60000, // Update every minute
    enabled: isNow && isMeal // Only show countdown for meals in "Now" status
  });

  // Format time display
  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(`2000-01-01T${time}`);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatTimeRange = () => {
    if (!start_time || !end_time) return '';
    return `${formatTime(start_time)} - ${formatTime(end_time)}`;
  };

  // Determine status text and time display
  const statusText = isNow ? (isMeal && isActive ? formattedTime : 'NOW') : 'Next';
  const timeDisplay = isNow && isMeal && isActive ? null : formatTimeRange();

  return (
    <Card 
      variant={isNow ? 'now' : 'default'} 
      onClick={onClick}
      className={className}
    >
      <CardHeader className="session-header">
        <div className="session-time-container">
          {timeDisplay && (
            <div className="session-time">{timeDisplay}</div>
          )}
          {location && (
            <div className="session-location">{location}</div>
          )}
        </div>
        <StatusTag variant={isNow ? 'now' : 'next'}>
          {statusText}
        </StatusTag>
      </CardHeader>
      
      <CardContent>
        <h3 className="session-title">{title}</h3>
        
        {speaker && (
          <div className="session-details">
            <div className="session-detail">
              <a 
                href={`/bio?speaker=${encodeURIComponent(speaker)}`}
                className="speaker-link"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle navigation to bio page
                  console.log('Navigate to speaker bio:', speaker);
                }}
              >
                {speaker}
              </a>
            </div>
          </div>
        )}
        
        {seatInfo && (
          <div 
            className="seat-assignment"
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to seat map with focus on this session's seating
              navigate(`/seat-map?session=${session.id}&table=${seatInfo.table}`);
            }}
            style={{ 
              cursor: 'pointer',
              background: 'white',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-sm)',
              marginTop: 'var(--space-sm)',
              border: '1px solid var(--border-light)'
            }}
          >
            <div className="seat-label" style={{ 
              fontSize: 'var(--text-sm)', 
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-xs)'
            }}>
              Your Seat
            </div>
            <div className="seat-details" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ 
                fontSize: 'var(--text-base)', 
                fontWeight: '500',
                color: 'var(--text-primary)'
              }}>
                {seatInfo.table} • Seat {seatInfo.seat}
              </span>
              <span className="seat-map-link" style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--primary-600)',
                textDecoration: 'underline'
              }}>
                Find my seat
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionCard;
