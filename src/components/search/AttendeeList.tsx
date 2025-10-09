/**
 * Attendee List Component
 * Story 3.1: Attendee Search & Discovery
 * 
 * Displays list of attendees with profiles and contact information
 */

import React from 'react';
import { Attendee } from '../../types/database';
import AttendeeCard from './AttendeeCard';
import './AttendeeList.css';

interface AttendeeListProps {
  attendees: Attendee[];
  onAttendeeSelect?: (attendee: Attendee) => void;
  isLoading?: boolean;
}

const AttendeeList: React.FC<AttendeeListProps> = ({
  attendees,
  onAttendeeSelect,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="attendee-list">
        <div className="loading-skeleton">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="attendee-card-skeleton">
              <div className="skeleton-avatar" />
              <div className="skeleton-content">
                <div className="skeleton-name" />
                <div className="skeleton-company" />
                <div className="skeleton-title" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (attendees.length === 0) {
    return (
      <div className="attendee-list">
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">No attendees found</div>
          <div className="empty-description">
            Try adjusting your search terms or filters
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="attendee-list">
      <div className="attendee-grid">
        {attendees.map((attendee) => (
          <AttendeeCard
            key={attendee.id}
            attendee={attendee}
            onClick={() => onAttendeeSelect?.(attendee)}
          />
        ))}
      </div>
    </div>
  );
};

export default AttendeeList;
