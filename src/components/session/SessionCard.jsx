import React from 'react';
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
  const {
    title,
    time,
    location,
    speaker,
    countdown,
    seatInfo
  } = session;

  const isNow = variant === 'now';
  const statusText = isNow ? countdown : 'Next';

  return (
    <Card 
      variant={isNow ? 'now' : 'default'} 
      onClick={onClick}
      className={className}
    >
      <CardHeader>
        <div className="session-time" style={{ 
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--ink-900)'
        }}>
          {time}
        </div>
        <StatusTag variant={isNow ? 'now' : 'next'}>
          {statusText}
        </StatusTag>
      </CardHeader>
      
      <CardContent>
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--ink-800)',
          marginBottom: 'var(--space-xs)'
        }}>
          {title}
        </h3>
        
        {(location || speaker) && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-xs)',
            marginBottom: 'var(--space-sm)'
          }}>
            {location && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                fontSize: 'var(--text-base)',
                color: 'var(--ink-700)'
              }}>
                <span style={{ opacity: 0.7 }}>📍</span>
                <span>{location}</span>
              </div>
            )}
            {speaker && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                fontSize: 'var(--text-base)',
                color: 'var(--ink-700)'
              }}>
                <span style={{ opacity: 0.7 }}>👤</span>
                <span>{speaker}</span>
              </div>
            )}
          </div>
        )}
        
        {seatInfo && (
          <a 
            href={seatInfo.href || '#'}
            className="seat-info"
            style={{
              background: 'var(--white)',
              border: '1px solid var(--purple-500)',
              padding: 'var(--space-sm)',
              borderRadius: 'var(--radius-lg)',
              marginTop: 'var(--space-sm)',
              cursor: 'pointer',
              transition: 'all var(--transition-normal)',
              textDecoration: 'none',
              color: 'inherit',
              display: 'block'
            }}
            onClick={(e) => {
              e.stopPropagation();
              seatInfo.onClick?.(e);
            }}
          >
            <div style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--purple-700)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px'
            }}>
              Your Table
            </div>
            <div style={{
              fontSize: 'var(--text-base)',
              color: 'var(--ink-900)',
              fontWeight: 'var(--font-medium)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'nowrap',
              minWidth: 0
            }}>
              <span>{seatInfo.table}</span>
              <span style={{
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--purple-700)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                View table map
              </span>
            </div>
          </a>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionCard;
