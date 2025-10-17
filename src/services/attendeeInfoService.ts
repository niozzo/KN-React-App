/**
 * Attendee Information Service
 * 
 * Manages extraction and storage of attendee information from kn_cache_attendees
 * Provides easy access to logged-in attendee's basic information
 */

import { simplifiedDataService } from './simplifiedDataService.ts';

export interface AttendeeInfo {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  company: string;
  title: string;
  access_code: string; // Only available during server-side extraction
}

export interface CachedAttendeeInfo {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  company: string;
  title: string;
  // Note: access_code is not stored in cache for security
}

export class AttendeeInfoService {
  private readonly CACHE_KEY = 'kn_current_attendee_info';
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Extract attendee information from full attendee data (server-side)
   * This should be called before sanitizing the attendee data
   */
  extractAttendeeInfo(attendee: any): AttendeeInfo {
    if (!attendee) {
      throw new Error('Attendee data is required');
    }

    const fullName = `${attendee.first_name || ''} ${attendee.last_name || ''}`.trim();

    return {
      id: attendee.id,
      first_name: attendee.first_name || '',
      last_name: attendee.last_name || '',
      full_name: fullName,
      email: attendee.email || '',
      company: attendee.company || '',
      title: attendee.title || '',
      access_code: attendee.access_code || ''
    };
  }

  /**
   * Store attendee information in cache (sanitized version)
   * This removes sensitive information like access_code
   */
  async storeAttendeeInfo(attendeeInfo: AttendeeInfo): Promise<void> {
    try {
      const sanitizedInfo: CachedAttendeeInfo = {
        id: attendeeInfo.id,
        first_name: attendeeInfo.first_name,
        last_name: attendeeInfo.last_name,
        full_name: attendeeInfo.full_name,
        email: attendeeInfo.email,
        company: attendeeInfo.company,
        title: attendeeInfo.title
      };

      // Use localStorage for simplified caching
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(sanitizedInfo));
      console.log('✅ Attendee info cached:', sanitizedInfo.full_name);
    } catch (error) {
      console.error('❌ Failed to cache attendee info:', error);
      throw error;
    }
  }

  /**
   * Get cached attendee information
   */
  async getCachedAttendeeInfo(): Promise<CachedAttendeeInfo | null> {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) {
        return null;
      }

      // Parse the cached data
      return JSON.parse(cached);
    } catch (error) {
      console.error('❌ Failed to get cached attendee info:', error);
      return null;
    }
  }

  /**
   * Get attendee name (first and last name)
   */
  async getAttendeeName(): Promise<{ first_name: string; last_name: string; full_name: string } | null> {
    const info = await this.getCachedAttendeeInfo();
    if (!info) {
      return null;
    }

    return {
      first_name: info.first_name,
      last_name: info.last_name,
      full_name: info.full_name
    };
  }

  /**
   * Get full attendee information
   */
  getFullAttendeeInfo(): CachedAttendeeInfo | null {
    return this.getCachedAttendeeInfo();
  }

  /**
   * Clear cached attendee information
   */
  async clearAttendeeInfo(): Promise<void> {
    try {
      localStorage.removeItem(this.CACHE_KEY);
      console.log('🗑️ Attendee info cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear attendee info cache:', error);
      throw error; // Re-throw to ensure proper error handling
    }
  }

  /**
   * Check if attendee info is cached and valid
   */
  async hasValidAttendeeInfo(): Promise<boolean> {
    const info = await this.getCachedAttendeeInfo();
    return info !== null && !!info.id && !!info.first_name && !!info.last_name;
  }

  /**
   * Update attendee information (useful for profile updates)
   */
  async updateAttendeeInfo(updates: Partial<CachedAttendeeInfo>): Promise<void> {
    const currentInfo = await this.getCachedAttendeeInfo();
    if (!currentInfo) {
      throw new Error('No cached attendee info to update');
    }

    const updatedInfo: CachedAttendeeInfo = {
      ...currentInfo,
      ...updates
    };
    
    // Calculate full_name after merging updates
    if (updates.first_name || updates.last_name) {
      const firstName = updates.first_name || currentInfo.first_name;
      const lastName = updates.last_name || currentInfo.last_name;
      updatedInfo.full_name = `${firstName} ${lastName}`.trim();
    }

    await this.storeAttendeeInfo(updatedInfo as AttendeeInfo);
  }
}

// Export singleton instance
export const attendeeInfoService = new AttendeeInfoService();
