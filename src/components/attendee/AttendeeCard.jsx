import React, { useState, forwardRef } from 'react';
import Card, { CardHeader, CardContent } from '../common/Card';
import Button from '../common/Button';
import StatusTag from '../common/StatusTag';

/**
 * Attendee Card Component
 * Displays attendee information with actions and shared events
 */
const AttendeeCard = forwardRef(({
  attendee,
  isInMeetList = false,
  onAddToMeetList,
  onRemoveFromMeetList,
  onViewBio,
  className = '',
  currentTab = 'all-attendees' // 'all-attendees' or 'my-meet-list'
}, ref) => {
  const [sharedEventsExpanded, setSharedEventsExpanded] = useState(false);
  
  const {
    name,
    title,
    company,
    isSponsor = false,
    sharedEvents = []
  } = attendee;

  const handleActionClick = (event) => {
    if (currentTab === 'my-meet-list') {
      // On My Meet List page, always remove
      onRemoveFromMeetList?.(attendee, event);
    } else {
      // On All Attendees page, add to meet list
      onAddToMeetList?.(attendee, event);
    }
  };

  const shouldShowButton = () => {
    if (currentTab === 'my-meet-list') {
      // On My Meet List page, always show remove button
      return true;
    } else {
      // On All Attendees page, only show button if not in meet list
      return !isInMeetList;
    }
  };

  const getButtonText = () => {
    if (currentTab === 'my-meet-list') {
      return 'Remove';
    } else {
      return '+ Add to Meet List';
    }
  };

  const getButtonVariant = () => {
    if (currentTab === 'my-meet-list') {
      return 'danger';
    } else {
      return 'secondary';
    }
  };

  const toggleSharedEvents = () => {
    setSharedEventsExpanded(!sharedEventsExpanded);
  };

  return (
    <Card ref={ref} className={`attendee-card ${className}`}>
      <CardHeader>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-sm)',
          width: '100%'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '2px',
            width: '100%'
          }}>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--ink-900)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              flex: 1,
              minWidth: 0
            }}>
              {name}
            </div>
            {shouldShowButton() ? (
              <Button
                variant={getButtonVariant()}
                size="sm"
                onClick={handleActionClick}
                style={{
                  fontSize: 'var(--text-sm)',
                  whiteSpace: 'nowrap',
                  marginLeft: 'var(--space-sm)',
                  flexShrink: 0
                }}
              >
                {getButtonText()}
              </Button>
            ) : (
              <StatusTag variant="success" style={{ marginLeft: 'var(--space-sm)', flexShrink: 0 }}>
                ✓ In My List
              </StatusTag>
            )}
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '2px',
            width: '100%'
          }}>
            <div style={{
              fontSize: 'var(--text-base)',
              color: 'var(--ink-700)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              flex: 1,
              minWidth: 0
            }}>
              {title}
            </div>
            <div style={{
              display: 'flex',
              gap: 'var(--space-sm)',
              alignItems: 'center'
            }}>
              <a
                href={`bio.html?id=${name.toLowerCase().replace(/\s+/g, '')}`}
                style={{
                  color: 'var(--purple-700)',
                  textDecoration: 'underline',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  transition: 'color var(--transition-normal)',
                  whiteSpace: 'nowrap'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewBio?.(attendee);
                }}
              >
                View Bio
              </a>
            </div>
          </div>
          
          <div style={{
            fontSize: 'var(--text-base)',
            color: 'var(--ink-500)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)'
          }}>
            {company}
            {isSponsor && <StatusTag variant="sponsor">Sponsor</StatusTag>}
          </div>
          
          {sharedEvents.length > 0 && (
            <div
              className={`shared-events-widget ${sharedEventsExpanded ? 'expanded' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--white)',
                color: 'var(--ink-900)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
                padding: 'var(--space-xs) var(--space-sm)',
                borderRadius: sharedEventsExpanded ? 'var(--radius-md) var(--radius-md) 0 0' : 'var(--radius-md)',
                marginTop: 'var(--space-xs)',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)',
                border: '1px solid var(--green-700)',
                borderBottom: sharedEventsExpanded ? '1px solid var(--green-700)' : '1px solid var(--green-700)',
                position: 'relative',
                minWidth: '140px',
                boxSizing: 'border-box'
              }}
              onClick={toggleSharedEvents}
            >
              <span style={{
                fontWeight: 'var(--font-semibold)',
                color: 'var(--green-700)'
              }}>
                {sharedEvents.length} Shared Event{sharedEvents.length !== 1 ? 's' : ''}
              </span>
              <span style={{
                transition: 'transform var(--transition-normal)',
                fontSize: 'var(--text-xs)',
                marginLeft: 'var(--space-xs)',
                color: 'var(--green-700)',
                transform: sharedEventsExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>
                ▼
              </span>
            </div>
          )}
          
          {sharedEventsExpanded && sharedEvents.length > 0 && (
            <div 
              className="shared-events-details"
              style={{
                padding: 'var(--space-sm)',
                background: 'var(--white)',
                border: '1px solid var(--green-700)',
                borderTop: 'none',
                boxShadow: '0 -1px 0 0 var(--white), var(--shadow-sm)',
                position: 'relative',
                zIndex: 1,
                marginTop: 0,
                minWidth: '140px',
                boxSizing: 'border-box'
              }}>
              {sharedEvents.map((event, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--ink-700)',
                    padding: 'var(--space-sm) 0',
                    borderBottom: index < sharedEvents.length - 1 ? '1px solid var(--gray-200)' : 'none',
                    lineHeight: 1.4
                  }}
                >
                  <div><strong>{event.dateTime}</strong></div>
                  <div>{event.title}</div>
                  <div>{event.location}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
    </Card>
  );
});

AttendeeCard.displayName = 'AttendeeCard';

export default AttendeeCard;
