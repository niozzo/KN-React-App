/**
 * Attendee Card Component
 * Story 3.1: Attendee Search & Discovery
 * 
 * Individual attendee profile card with contact information
 */

import React from 'react';
import { Attendee } from '../../types/database';
import './AttendeeCard.css';

interface AttendeeCardProps {
  attendee: Attendee;
  onClick?: () => void;
  className?: string;
}

const AttendeeCard: React.FC<AttendeeCardProps> = ({
  attendee,
  onClick,
  className = ''
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Format attendee name
  const getFullName = (): string => {
    const parts = [attendee.salutation, attendee.first_name, attendee.last_name]
      .filter(Boolean);
    return parts.join(' ');
  };

  // Get attendee photo or fallback
  const getPhotoUrl = (): string => {
    if (attendee.photo) return attendee.photo;
    
    // Generate initials for fallback
    const initials = [attendee.first_name, attendee.last_name]
      .map(name => name?.charAt(0))
      .filter(Boolean)
      .join('')
      .toUpperCase();
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=64`;
  };

  // Check if attendee has sponsor context
  const hasSponsorContext = (attendee as any).sponsorContext;

  return (
    <div
      className={`attendee-card ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View profile for ${getFullName()}`}
    >
      {/* Photo */}
      <div className="attendee-photo">
        <img
          src={getPhotoUrl()}
          alt={`${getFullName()}`}
          className="photo-image"
          loading="lazy"
        />
        {hasSponsorContext && (
          <div className="sponsor-badge" title="Sponsor Attendee">
            🏢
          </div>
        )}
      </div>

      {/* Content */}
      <div className="attendee-content">
        <div className="attendee-name">
          {getFullName()}
        </div>
        
        {attendee.title && (
          <div className="attendee-title">
            {attendee.title}
          </div>
        )}
        
        {attendee.company && (
          <div className="attendee-company">
            {attendee.company}
          </div>
        )}

        {attendee.bio && (
          <div className="attendee-bio">
            {attendee.bio.length > 100 
              ? `${attendee.bio.substring(0, 100)}...` 
              : attendee.bio
            }
          </div>
        )}

        {/* Contact Information */}
        <div className="attendee-contact">
          {attendee.email && (
            <div className="contact-item">
              <span className="contact-label">Email:</span>
              <span className="contact-value">{attendee.email}</span>
            </div>
          )}
          
          {attendee.business_phone && (
            <div className="contact-item">
              <span className="contact-label">Phone:</span>
              <span className="contact-value">{attendee.business_phone}</span>
            </div>
          )}
        </div>

        {/* Attributes */}
        {attendee.attributes && (
          <div className="attendee-attributes">
            {Object.entries(attendee.attributes)
              .filter(([_, value]) => value === true)
              .map(([key, _]) => (
                <span key={key} className="attribute-tag">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendeeCard;
