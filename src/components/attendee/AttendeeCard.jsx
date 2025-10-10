import React, { useState, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [sharedEventsExpanded, setSharedEventsExpanded] = useState(false);
  
  const {
    first_name,
    last_name,
    title,
    company,
    photo,
    isSponsor = false,
    sharedEvents = []
  } = attendee;

  // Construct full name from first_name and last_name
  const name = `${first_name} ${last_name}`.trim();

  const handleViewBioClick = (event) => {
    event.stopPropagation();
    navigate(`/bio?id=${attendee.id}`);
    onViewBio?.(attendee);
  };

  const toggleSharedEvents = () => {
    setSharedEventsExpanded(!sharedEventsExpanded);
  };

  return (
    <Card 
      ref={ref} 
      className={`attendee-card ${className}`}
      onClick={() => {
        navigate(`/bio?id=${attendee.id}`);
        onViewBio?.(attendee);
      }}
      style={{ cursor: 'pointer' }}
    >
      <div 
        className="profile-info-section"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-lg)',
          marginBottom: 'var(--space-lg)'
        }}
      >
        <div 
          className="avatar"
          style={{
            width: '80px',
            height: '80px',
            background: 'var(--purple-100)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            color: 'var(--purple-700)',
            overflow: 'hidden'
          }}
        >
          {photo ? (
            <img
              src={photo}
              alt={`${name} headshot`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div style={{
            display: photo ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}>
            👤
          </div>
        </div>
        <div className="profile-info" style={{ flex: 1 }}>
          <h1 
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'var(--ink-900)',
              marginBottom: '4px'
            }}
          >
            {name}
          </h1>
          <div 
            className="title"
            style={{
              fontSize: '16px',
              color: 'var(--ink-600)',
              marginBottom: 'var(--space-sm)'
            }}
          >
            {title}
          </div>
          <div 
            className="company"
            style={{
              fontSize: '18px',
              color: 'var(--coral)',
              fontWeight: '500'
            }}
          >
            {company}
          </div>
        </div>
      </div>
      
      <div 
        className="contact-actions"
        style={{
          display: 'flex',
          gap: 'var(--space-md)'
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={handleViewBioClick}
          style={{
            fontSize: 'var(--text-sm)',
            whiteSpace: 'nowrap'
          }}
        >
          View Bio
        </Button>
      </div>
    </Card>
  );
});

AttendeeCard.displayName = 'AttendeeCard';

export default AttendeeCard;
