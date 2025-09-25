import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardContent } from '../common/Card';
import StatusTag from '../common/StatusTag';
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
  const statusText = isNow ? 'NOW' : 'Next';
  
  // Time display logic: show countdown for coffee breaks in "Now" status, otherwise show time range
  const timeDisplay = isNow && isCoffeeBreakSession && isActive ? formattedTime : formatTimeRange();

  // Build CSS classes for special styling
  const cardClassName = [
    className,
    getSessionClassName(session),
    isNow ? 'session-card--now' : 'session-card--next',
    isCoffeeBreakSession ? 'session-card--coffee-break' : '',
    isDiningEventSession ? 'session-card--dining' : '',
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
            <div className="session-location">{location}</div>
          )}
          {/* Dining Event Address */}
          {isDiningEventSession && session.address && (
            <div className="dining-address" style={{ 
              fontSize: 'var(--text-base)',
              color: 'var(--coral)',
              fontWeight: 'var(--font-medium)',
              marginTop: 'var(--space-xs)'
            }}>
              <a 
                href={`https://maps.google.com/maps?q=${encodeURIComponent(session.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: 'underline',
                  color: 'var(--coral)',
                  cursor: 'pointer'
                }}
              >
                {session.address}
              </a>
            </div>
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
              border: '1px solid var(--purple-500)'
            }}
          >
            <div className="seat-label" style={{ 
              fontSize: 'var(--text-sm)', 
              fontWeight: '600',
              color: 'var(--purple-700)',
              marginBottom: 'var(--space-xs)'
            }}>
              YOUR TABLE
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
                Open seating
              </span>
            </div>
          </div>
        )}

        {(speakers && speakers.length > 0) || speakerInfo || speaker ? (
          <div className="session-details">
            <div className="session-detail" style={{ display: 'block' }}>
              {speakers && speakers.length > 0 ? (
                // Display each speaker with name and title on separate lines
                speakers.map((speaker, index) => {
                  // DEBUG: Log speaker object before rendering for RCA
                  console.log('RCA DEBUG (SessionCard): Speaker object before rendering:', speaker);
                  
                  // Parse the speaker name to extract name and title
                  const nameParts = speaker.name.split(', ');
                  const speakerName = nameParts[0] || speaker.name;
                  const speakerTitle = nameParts.slice(1).join(', ') || '';
                  
                  // DEBUG: Log parsed name and title for RCA
                  console.log('RCA DEBUG (SessionCard): Parsed speakerName:', speakerName, 'speakerTitle:', speakerTitle);
                  
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
                        href={`/bio?speaker=${encodeURIComponent(speaker.name)}`}
                        className="speaker-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle navigation to speaker bio
                          console.log('Navigate to speaker bio:', speaker.name);
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
              ) : speakerInfo ? (
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
                      <a 
                        href={`/bio?speaker=${encodeURIComponent(speakerName.trim())}`}
                        className="speaker-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle navigation to speaker bio
                          console.log('Navigate to speaker bio:', speakerName.trim());
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
                      </a>
                    </div>
                  );
                })
              ) : (
                // Fallback for single speaker
                <div 
                  style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    width: '100%'
                  }}
                >
                  <a 
                    href={`/bio?speaker=${encodeURIComponent(speaker)}`}
                    className="speaker-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle navigation to speaker bio
                      console.log('Navigate to speaker bio:', speaker);
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
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : null}
        
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
  variant: PropTypes.oneOf(['now', 'next', 'default']),
  onClick: PropTypes.func,
  className: PropTypes.string
};

SessionCard.defaultProps = {
  variant: 'default',
  onClick: () => {},
  className: ''
};

export default SessionCard;
