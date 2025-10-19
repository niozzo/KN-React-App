import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardContent } from '../common/Card';
import StatusTag from '../common/StatusTag';
import SessionErrorBoundary from '../common/SessionErrorBoundary';
import useCountdown from '../../hooks/useCountdown';
import { 
  isCoffeeBreak, 
  isMeal, 
  isDiningEvent,
  getDiningEventType,
  getDiningEventIcon,
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
const SessionCard = React.memo(({
  session,
  variant = 'default', // 'now' or 'next'
  onClick,
  className = ''
}) => {
  const navigate = useNavigate();
  
  // Handle null or undefined session
  if (!session) {
    return null;
  }
  
  const {
    title,
    start_time,
    end_time,
    date,
    location,
    speakers,
    speakerInfo,
    speaker, // Support both speakerInfo and speaker for backward compatibility
    seatInfo,
    type
  } = session;

  const isNow = variant === 'now';
  const isNext = variant === 'next';
  const isAgenda = variant === 'agenda';
  
  // Use utility functions for session type detection
  const isCoffeeBreakSession = isCoffeeBreak(session);
  const isMealSession = isMeal(session);
  const isDiningEventSession = isDiningEvent(session);
  const diningEventType = getDiningEventType(session);
  const diningEventIcon = getDiningEventIcon(session);
  const sessionCategory = getSessionCategory(session);
  const shouldShowCountdownForSession = shouldShowCountdown(session);
  const countdownPriority = getCountdownPriority(session);
  const sessionIcon = getSessionIcon(session);
  const hasSpecialStylingForSession = hasSpecialStyling(session);
  
  // Calculate start and end times for countdown
  // ✅ FIX: Parse date without timezone conversion to avoid day shift
  const startTime = start_time && date ? (() => {
    const [year, month, day] = date.split('-').map(Number);
    const [hour, min, sec] = start_time.split(':').map(Number);
    return new Date(year, month - 1, day, hour, min, sec || 0);
  })() : null;
  
  const endTime = end_time && date ? (() => {
    const [year, month, day] = date.split('-').map(Number);
    const [hour, min, sec] = end_time.split(':').map(Number);
    return new Date(year, month - 1, day, hour, min, sec || 0);
  })() : null;
  
  // Use countdown hook for real-time updates
  // Coffee breaks and meals show countdown when in "Now" status
  // Disable countdown for agenda variant
  const { formattedTime, isActive, minutesRemaining } = useCountdown(endTime, {
    updateInterval: 60000, // Update every minute
    enabled: isNow && shouldShowCountdownForSession && !isAgenda,
    isCoffeeBreak: isCoffeeBreakSession, // Special handling for coffee breaks
    startTime: startTime // Pass start time for smart countdown logic
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
    if (!start_time) return '';
    
    // For dining events, only show start time
    if (isDiningEventSession) {
      return formatTime(start_time);
    }
    
    // For regular sessions, show time range
    if (!end_time) return formatTime(start_time);
    return `${formatTime(start_time)} - ${formatTime(end_time)}`;
  };

  // Determine status text and time display
  // Coffee breaks show countdown in time area, not status badge
  // Remove NOW/NEXT labels for agenda variant
  const statusText = isAgenda ? '' : (isNow ? 'NOW' : 'Next');
  
  // Time display logic: show countdown for coffee breaks in "Now" status, otherwise show time range
  const timeDisplay = isNow && isCoffeeBreakSession && isActive ? formattedTime : formatTimeRange();

  // Build CSS classes for special styling
  const cardClassName = [
    className,
    getSessionClassName(session),
    isNow ? 'session-card--now' : isNext ? 'session-card--next' : isAgenda ? 'session-card--agenda' : '',
    isCoffeeBreakSession ? 'session-card--coffee-break' : '',
    isDiningEventSession ? 'session-card--dining' : '',
    hasSpecialStylingForSession ? 'session-card--special' : ''
  ].filter(Boolean).join(' ');

  return (
    <SessionErrorBoundary 
      sessionData={session}
      onError={(error, errorInfo) => {
        console.error('SessionCard rendering error:', error, errorInfo);
        // Additional error handling can be added here
      }}
    >
      <Card 
        variant={isNow ? 'now' : 'default'} 
        onClick={onClick}
        className={cardClassName}
        style={isCoffeeBreakSession && isNow ? {
          // Special styling for coffee breaks in "Now" status
          background: 'var(--purple-050)',
          border: '2px solid var(--purple-500)',
          boxShadow: '0 4px 12px rgba(124, 76, 196, 0.15)'
        } : isDiningEventSession && isNow ? {
          // Special styling for dining events in "Now" status
          background: 'var(--green-050)',
          border: '2px solid var(--green-500)',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)'
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
            <div className="session-location">
              {isDiningEventSession && session.address ? (
                <>
                  <a 
                    href={`https://maps.google.com/maps/dir/?api=1&destination=${encodeURIComponent(session.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      // Try to open Google Maps app first on mobile
                      if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                        const appUrl = `comgooglemaps://?daddr=${encodeURIComponent(session.address)}&directionsmode=driving`;
                        const webUrl = `https://maps.google.com/maps/dir/?api=1&destination=${encodeURIComponent(session.address)}`;
                        
                        // Try to open the app, fallback to web if it fails
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        iframe.src = appUrl;
                        document.body.appendChild(iframe);
                        
                        // Fallback to web after a short delay if app doesn't open
                        setTimeout(() => {
                          document.body.removeChild(iframe);
                          window.open(webUrl, '_blank');
                        }, 1000);
                        
                        e.preventDefault();
                      }
                    }}
                    style={{
                      textDecoration: 'underline',
                      color: 'var(--coral)',
                      cursor: 'pointer'
                    }}
                  >
                    {location}
                  </a> <span style={{ textDecoration: 'none !important', color: 'var(--coral)' }}>⧉</span>
                </>
              ) : (
                location
              )}
            </div>
          )}
        </div>
        {!isAgenda && (
          <StatusTag variant={isNow ? 'now' : 'next'}>
            {statusText}
          </StatusTag>
        )}
      </CardHeader>
      
      <CardContent>
        <h3 className="session-title">
          {formatSessionTitle(session)}
        </h3>
        
        
        {/* Dining Event Seating Information */}
        {isDiningEventSession && session.seating_type === 'open' && (
          <div 
            className="seat-assignment"
            style={{ 
              cursor: 'default',
              background: 'white',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-sm)',
              marginTop: 'var(--space-sm)',
              border: '1px solid var(--purple-500)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span style={{ 
              fontSize: 'var(--text-base)', 
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              Open seating
            </span>
          </div>
        )}

        {(speakers && speakers.length > 0) || (speakerInfo && typeof speakerInfo === 'string' && speakerInfo.trim()) || (speaker && typeof speaker === 'string' && speaker.trim()) ? (
          <div className="session-details">
            <div className="session-detail" style={{ display: 'block' }}>
              {speakers && speakers.length > 0 ? (
                // Display each speaker with name and title on separate lines
                speakers.map((speaker, index) => {
                  
                  // Parse the speaker name to extract name and title
                  const nameParts = speaker.name.split(', ');
                  const speakerName = nameParts[0] || speaker.name;
                  const speakerTitle = nameParts.slice(1).join(', ') || '';
                  
                  
                  return (
                    <div 
                      key={speaker.id || index}
                      style={{ 
                        display: 'block', 
                        marginBottom: speakers.length > 1 ? '16px' : '8px',
                        width: '100%'
                      }}
                    >
                      <a 
                        href={speaker.attendee_id ? `/bio?id=${speaker.attendee_id}` : '#'}
                        className="speaker-link"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (speaker.attendee_id) {
                            navigate(`/bio?id=${speaker.attendee_id}`);
                          }
                        }}
                        style={{ 
                          display: 'block', 
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
                        <div style={{
                          fontWeight: '600',
                          fontSize: '16px',
                          color: 'var(--purple-700)',
                          marginBottom: '2px'
                        }}>
                          {speakerName}
                        </div>
                        {speakerTitle && (
                          <div style={{
                            fontWeight: '400',
                            fontSize: '14px',
                            color: 'var(--ink-600)',
                            lineHeight: '1.3',
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            overflow: 'visible'
                          }}>
                            {speakerTitle}
                          </div>
                        )}
                      </a>
                    </div>
                  );
                })
              ) : (speakerInfo && typeof speakerInfo === 'string' && speakerInfo.trim()) ? (
                // Fallback to speakerInfo if speakers array not available
                speakerInfo.split(', ').map((speakerName, index) => {
                  // Parse the speaker name to extract name and title
                  const nameParts = speakerName.trim().split(', ');
                  const speakerNameOnly = nameParts[0] || speakerName.trim();
                  const speakerTitle = nameParts.slice(1).join(', ') || '';
                  
                  return (
                    <div 
                      key={index}
                      style={{ 
                        display: 'block', 
                        marginBottom: speakerInfo.split(', ').length > 1 ? '16px' : '8px',
                        width: '100%'
                      }}
                    >
                      <div 
                        className="speaker-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Legacy speakerInfo format - no attendee_id available
                          console.warn('Speaker click disabled: no attendee_id in legacy speakerInfo format');
                        }}
                        style={{ 
                          display: 'block', 
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
                        <div style={{
                          fontWeight: '600',
                          fontSize: '16px',
                          color: 'var(--purple-700)',
                          marginBottom: '2px'
                        }}>
                          {speakerNameOnly}
                        </div>
                        {speakerTitle && (
                          <div style={{
                            fontWeight: '400',
                            fontSize: '14px',
                            color: 'var(--ink-600)',
                            lineHeight: '1.3',
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            overflow: 'visible'
                          }}>
                            {speakerTitle}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (speaker && typeof speaker === 'string' && speaker.trim()) ? (
                // Fallback for single speaker - only render if speaker is a valid string
                <div 
                  style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    width: '100%'
                  }}
                >
                  <div 
                    className="speaker-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Legacy speaker string format - no attendee_id available
                      console.warn('Speaker click disabled: no attendee_id in legacy speaker format');
                    }}
                    style={{ 
                      display: 'block',
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    <div style={{
                      fontWeight: '600',
                      fontSize: '16px',
                      color: 'var(--purple-700)',
                      marginBottom: '2px'
                    }}>
                      {speaker}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        
        {seatInfo && (
          <div 
            className="seat-assignment"
            style={{ 
              cursor: 'default',
              background: 'white',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-sm)',
              marginTop: 'var(--space-sm)',
              border: '1px solid var(--purple-500)'
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
            <div className="seat-details">
              <span style={{ 
                fontSize: 'var(--text-base)', 
                fontWeight: '500',
                color: 'var(--text-primary)'
              }}>
                {/* Support both table/seat format (dining) and row/column format (theater seating) */}
                {seatInfo.row && seatInfo.column ? (
                  `Row ${seatInfo.row} • Seat ${seatInfo.column}` // Data is already 1-indexed
                ) : seatInfo.table ? (
                  isDiningEventSession 
                    ? seatInfo.table  // Dining: Just "Table 1" (no seat number)
                    : seatInfo.table  // Table name for other events
                ) : seatInfo.seat ? (
                  `Seat ${seatInfo.seat}` // Seat number only
                ) : (
                  'Seat assigned'
                )}
              </span>
            </div>
          </div>
        )}
        
        {/* Show pending message for sessions with assigned seating but no seat assignment yet */}
        {session.seating_type === 'assigned' && !seatInfo && (
          <div 
            className="seat-assignment pending"
            style={{ 
              cursor: 'default',
              background: 'white',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-sm)',
              marginTop: 'var(--space-sm)',
              border: '1px solid var(--purple-500)',
              opacity: 0.8
            }}
          >
            <span style={{ 
              fontSize: 'var(--text-base)', 
              color: 'var(--text-secondary)',
              fontStyle: 'italic'
            }}>
              Seat assignment pending
            </span>
          </div>
        )}
      </CardContent>
      </Card>
    </SessionErrorBoundary>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return (
    prevProps.session.id === nextProps.session.id &&
    prevProps.variant === nextProps.variant &&
    prevProps.className === nextProps.className
  );
});

SessionCard.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    start_time: PropTypes.string,
    end_time: PropTypes.string,
    description: PropTypes.string,
    speaker: PropTypes.string,
    location: PropTypes.string,
    isActive: PropTypes.bool,
    isCoffeeBreak: PropTypes.bool,
    isMeal: PropTypes.bool,
    category: PropTypes.string,
    priority: PropTypes.number
  }).isRequired,
  variant: PropTypes.oneOf(['now', 'next', 'default', 'agenda']),
  onClick: PropTypes.func,
  className: PropTypes.string
};

SessionCard.defaultProps = {
  variant: 'default',
  onClick: () => {},
  className: ''
};

export default SessionCard;
