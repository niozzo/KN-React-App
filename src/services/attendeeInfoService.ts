/**
 * Attendee Information Service
 * 
 * Manages extraction and storage of attendee information from kn_cache_attendees
 * Provides easy access to logged-in attendee's basic information
 */

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
  storeAttendeeInfo(attendeeInfo: AttendeeInfo): void {
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

      const cacheData = {
        data: sanitizedInfo,
        timestamp: Date.now(),
        version: 1,
        source: 'attendee-info-service'
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      console.log('✅ Attendee info cached:', sanitizedInfo.full_name);
    } catch (error) {
      console.error('❌ Failed to cache attendee info:', error);
      throw error;
    }
  }

  /**
   * Get cached attendee information
   */
  getCachedAttendeeInfo(): CachedAttendeeInfo | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) {
        return null;
      }

      const cacheData = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - cacheData.timestamp > this.CACHE_EXPIRY) {
        console.log('⚠️ Attendee info cache expired, clearing...');
        this.clearAttendeeInfo();
        return null;
      }

      return cacheData.data || null;
    } catch (error) {
      console.error('❌ Failed to get cached attendee info:', error);
      return null;
    }
  }

  /**
   * Get attendee name (first and last name)
   */
  getAttendeeName(): { first_name: string; last_name: string; full_name: string } | null {
    const info = this.getCachedAttendeeInfo();
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
  clearAttendeeInfo(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
      console.log('🗑️ Attendee info cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear attendee info cache:', error);
    }
  }

  /**
   * Check if attendee info is cached and valid
   */
  hasValidAttendeeInfo(): boolean {
    const info = this.getCachedAttendeeInfo();
    return info !== null && !!info.id && !!info.first_name && !!info.last_name;
  }

  /**
   * Update attendee information (useful for profile updates)
   */
  updateAttendeeInfo(updates: Partial<CachedAttendeeInfo>): void {
    const currentInfo = this.getCachedAttendeeInfo();
    if (!currentInfo) {
      throw new Error('No cached attendee info to update');
    }

    const updatedInfo: CachedAttendeeInfo = {
      ...currentInfo,
      ...updates,
      full_name: updates.first_name && updates.last_name 
        ? `${updates.first_name} ${updates.last_name}`.trim()
        : currentInfo.full_name
    };

    this.storeAttendeeInfo(updatedInfo as AttendeeInfo);
  }
}

// Export singleton instance
export const attendeeInfoService = new AttendeeInfoService();
