/**
 * useAttendeeInfo Hook
 * 
 * Provides easy access to logged-in attendee's basic information
 * Uses the attendeeInfoService for cached data access
 */

import { useAuth } from '../contexts/AuthContext';
import { attendeeInfoService } from '../services/attendeeInfoService';

export const useAttendeeInfo = () => {
  const { isAuthenticated, attendeeName } = useAuth();

  // Get attendee name information
  const getName = () => {
    if (!isAuthenticated) {
      return null;
    }
    return attendeeName || attendeeInfoService.getAttendeeName();
  };

  // Get full attendee information
  const getFullInfo = () => {
    if (!isAuthenticated) {
      return null;
    }
    return attendeeInfoService.getFullAttendeeInfo();
  };

  // Check if attendee info is available
  const hasInfo = () => {
    return isAuthenticated && attendeeInfoService.hasValidAttendeeInfo();
  };

  // Get first name only
  const getFirstName = () => {
    const name = getName();
    return name?.first_name || '';
  };

  // Get last name only
  const getLastName = () => {
    const name = getName();
    return name?.last_name || '';
  };

  // Get full name
  const getFullName = () => {
    const name = getName();
    return name?.full_name || '';
  };

  return {
    // Name access methods
    getName,
    getFirstName,
    getLastName,
    getFullName,
    
    // Full info access
    getFullInfo,
    
    // Status methods
    hasInfo,
    isAuthenticated
  };
};
