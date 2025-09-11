import React, { useState } from 'react';
import Card, { CardHeader, CardContent } from '../common/Card';
import Button from '../common/Button';
import StatusTag from '../common/StatusTag';

/**
 * Attendee Card Component
 * Displays attendee information with actions and shared events
 */
const AttendeeCard = ({
  attendee,
  isInMeetList = false,
  onAddToMeetList,
  onRemoveFromMeetList,
  onViewBio,
  onEmail,
  className = ''
}) => {
  const [sharedEventsExpanded, setSharedEventsExpanded] = useState(false);
  
  const {
    name,
    title,
    company,
    email,
    isSponsor = false,
    sharedEvents = []
  } = attendee;

  const handleActionClick = () => {
    if (isInMeetList) {
      onRemoveFromMeetList?.(attendee);
    } else {
      onAddToMeetList?.(attendee);
    }
  };

  const toggleSharedEvents = () => {
    setSharedEventsExpanded(!sharedEventsExpanded);
  };

  return (
    <Card className={className}>
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
            <Button
              variant={isInMeetList ? 'danger' : 'secondary'}
              size="sm"
              onClick={handleActionClick}
              style={{
                fontSize: 'var(--text-sm)',
                whiteSpace: 'nowrap',
                marginLeft: 'var(--space-sm)',
                flexShrink: 0
              }}
            >
              {isInMeetList ? 'Remove' : 'Add to Meet List'}
            </Button>
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
              <a
                href={`mailto:${email}`}
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--purple-700)',
                  textDecoration: 'underline',
                  marginLeft: 'var(--space-sm)',
                  flexShrink: 0,
                  transition: 'color var(--transition-normal)'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEmail?.(attendee);
                }}
              >
                Email
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
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--white)',
                color: 'var(--ink-900)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
                padding: 'var(--space-xs) var(--space-sm)',
                borderRadius: 'var(--radius-md)',
                marginTop: 'var(--space-xs)',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)',
                border: '1px solid var(--green-700)',
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
            <div style={{
              marginTop: 0,
              padding: 'var(--space-sm)',
              background: 'var(--white)',
              border: '1px solid var(--green-700)',
              borderTop: 'none',
              borderBottomLeftRadius: 'var(--radius-md)',
              borderBottomRightRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
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
};

export default AttendeeCard;
