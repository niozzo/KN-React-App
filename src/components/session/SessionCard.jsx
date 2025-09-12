import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardContent } from '../common/Card';
import StatusTag from '../common/StatusTag';

/**
 * Session Card Component
 * Displays session information with status and countdown
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
    time,
    location,
    speaker,
    countdown,
    seatInfo
  } = session;

  const isNow = variant === 'now';
  const isCoffeeBreak = title.toLowerCase().includes('coffee') || title.toLowerCase().includes('break');
  const statusText = isNow ? 'NOW' : 'Next';

  return (
    <Card 
      variant={isNow ? 'now' : 'default'} 
      onClick={onClick}
      className={className}
    >
      <CardHeader className="session-header">
        <div className="session-time-container">
          {isNow && countdown ? (
            <div className="session-time">{countdown}</div>
          ) : !isCoffeeBreak && time ? (
            <div className="session-time">{time}</div>
          ) : null}
          {location && !isCoffeeBreak && (
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
              navigate('/seat-map');
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="seat-label">Your Table</div>
            <div className="seat-details">
              <span>{seatInfo.table}</span>
              <span className="seat-map-link">View table map</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionCard;
