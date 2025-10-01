/**
 * Attendee Sync Fallback Service
 * 
 * Provides fallback mechanisms when attendee data synchronization fails.
 * Ensures personalization continues to work even when sync operations fail.
 */

import type { Attendee } from '../types/attendee';

export class AttendeeSyncFallback {
  /**
   * Get fallback attendee data when sync fails
   */
  static getFallbackAttendeeData(): Attendee | null {
    try {
      // Try to get from conference_auth first
      const authData = localStorage.getItem('conference_auth');
      if (authData) {
        const auth = JSON.parse(authData);
        if (auth.attendee) {
          console.log('🔄 Using fallback attendee data from conference_auth');
          return auth.attendee;
        }
      }
      
      // Try to get from cache
      const cachedData = localStorage.getItem('kn_cache_attendees');
      if (cachedData) {
        const cache = JSON.parse(cachedData);
        const attendees = cache.data || cache;
        if (Array.isArray(attendees) && attendees.length > 0) {
          console.log('🔄 Using fallback attendee data from cache');
          return attendees[0]; // Use first attendee as fallback
        }
      }
      
      console.warn('⚠️ No fallback attendee data available');
      return null;
    } catch (error) {
      console.error('❌ Failed to get fallback attendee data:', error);
      return null;
    }
  }
  
  /**
   * Check if fallback data is stale
   */
  static isFallbackDataStale(maxAgeMinutes: number = 60): boolean {
    try {
      const authData = localStorage.getItem('conference_auth');
      if (!authData) return true;
      
      const auth = JSON.parse(authData);
      const lastUpdated = auth.lastUpdated || 0;
      const maxAgeMs = maxAgeMinutes * 60 * 1000;
      
      return (Date.now() - lastUpdated) > maxAgeMs;
    } catch (error) {
      console.warn('⚠️ Failed to check fallback data staleness:', error);
      return true;
    }
  }

  /**
   * Validate fallback data quality
   */
  static validateFallbackData(attendeeData: Attendee | null): boolean {
    if (!attendeeData) return false;
    
    // Check for required fields
    const requiredFields = ['id', 'first_name', 'last_name'];
    const hasRequiredFields = requiredFields.every(field => 
      attendeeData[field as keyof Attendee] !== undefined && 
      attendeeData[field as keyof Attendee] !== null
    );
    
    if (!hasRequiredFields) {
      console.warn('⚠️ Fallback data missing required fields');
      return false;
    }
    
    // Check for reasonable data freshness (not older than 24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const dataAge = Date.now() - (attendeeData.updated_at || 0);
    
    if (dataAge > maxAge) {
      console.warn('⚠️ Fallback data is very stale (>24 hours)');
      return false;
    }
    
    return true;
  }
}
