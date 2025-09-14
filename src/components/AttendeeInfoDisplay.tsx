/**
 * AttendeeInfoDisplay Component
 * 
 * Example component demonstrating how to use the new attendee information service
 * Shows the logged-in attendee's name information
 */

import React from 'react';
import { useAttendeeInfo } from '../hooks/useAttendeeInfo';

interface AttendeeInfoDisplayProps {
  showFullInfo?: boolean;
  className?: string;
}

export const AttendeeInfoDisplay: React.FC<AttendeeInfoDisplayProps> = ({ 
  showFullInfo = false, 
  className = '' 
}) => {
  const { 
    getFirstName, 
    getLastName, 
    getFullName, 
    getFullInfo, 
    hasInfo, 
    isAuthenticated 
  } = useAttendeeInfo();

  if (!isAuthenticated) {
    return (
      <div className={`attendee-info ${className}`}>
        <p>Not authenticated</p>
      </div>
    );
  }

  if (!hasInfo()) {
    return (
      <div className={`attendee-info ${className}`}>
        <p>Loading attendee information...</p>
      </div>
    );
  }

  const fullInfo = getFullInfo();

  return (
    <div className={`attendee-info ${className}`}>
      <h3>Welcome, {getFullName()}!</h3>
      
      {showFullInfo && fullInfo && (
        <div className="attendee-details">
          <p><strong>Name:</strong> {fullInfo.first_name} {fullInfo.last_name}</p>
          <p><strong>Email:</strong> {fullInfo.email}</p>
          <p><strong>Company:</strong> {fullInfo.company}</p>
          <p><strong>Title:</strong> {fullInfo.title}</p>
        </div>
      )}
      
      <div className="attendee-name-only">
        <p>First Name: {getFirstName()}</p>
        <p>Last Name: {getLastName()}</p>
        <p>Full Name: {getFullName()}</p>
      </div>
    </div>
  );
};

export default AttendeeInfoDisplay;
