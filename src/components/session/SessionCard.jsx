import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardContent } from '../common/Card';
import StatusTag from '../common/StatusTag';
import useCountdown from '../../hooks/useCountdown';
import { 
  isCoffeeBreak, 
  isMeal, 
  getSessionCategory, 
  shouldShowCountdown, 
  getCountdownPriority,
  formatSessionTitle,
  getSessionIcon,
  getSessionClassName,
  hasSpecialStyling
} from '../../utils/sessionUtils';

/**
 * Session Card Component
 * Displays session information with status and countdown
 * Story 2.1: Now/Next Glance Card - Enhanced with real-time countdown
 * Story 2.2: Coffee Break Treatment - Special countdown and styling for coffee breaks
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
  
  // Use utility functions for session type detection
  const isCoffeeBreakSession = isCoffeeBreak(session);
  const isMealSession = isMeal(session);
  const sessionCategory = getSessionCategory(session);
  const shouldShowCountdownForSession = shouldShowCountdown(session);
  const countdownPriority = getCountdownPriority(session);
  const sessionIcon = getSessionIcon(session);
  const hasSpecialStylingForSession = hasSpecialStyling(session);
  
  // Calculate end time for countdown
  const endTime = end_time && date ? new Date(`${date}T${end_time}`) : null;
  
  // Use countdown hook for real-time updates
  // Coffee breaks and meals show countdown when in "Now" status
  const { formattedTime, isActive, minutesRemaining } = useCountdown(endTime, {
    updateInterval: 60000, // Update every minute
    enabled: isNow && shouldShowCountdownForSession,
    isCoffeeBreak: isCoffeeBreakSession // Special handling for coffee breaks
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
  // Coffee breaks show countdown in time area, not status badge
  const statusText = isNow ? 'NOW' : 'Next';
  
  // Time display logic: show countdown for coffee breaks in "Now" status, otherwise show time range
  const timeDisplay = isNow && isCoffeeBreakSession && isActive ? formattedTime : formatTimeRange();

  // Build CSS classes for special styling
  const cardClassName = [
    className,
    getSessionClassName(session),
    isNow ? 'session-card--now' : 'session-card--next',
    isCoffeeBreakSession ? 'session-card--coffee-break' : '',
    hasSpecialStylingForSession ? 'session-card--special' : ''
  ].filter(Boolean).join(' ');

  return (
    <Card 
      variant={isNow ? 'now' : 'default'} 
      onClick={onClick}
      className={cardClassName}
      style={isCoffeeBreakSession && isNow ? {
        // Special styling for coffee breaks in "Now" status
        background: 'var(--purple-050)',
        border: '2px solid var(--purple-500)',
        boxShadow: '0 4px 12px rgba(124, 76, 196, 0.15)'
      } : undefined}
    >
      <CardHeader className="session-header">
        <div className="session-time-container">
          {timeDisplay && (
            <div className="session-time">
              {timeDisplay}
            </div>
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
        <h3 className="session-title">
          {formatSessionTitle(session)}
        </h3>
        
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
