/**
 * Attendee Cache Filter Service
 * Story 2.2.4: Remove Confidential Attendee Information from Local Cache
 * 
 * Filters confidential fields from attendee data before caching to prevent
 * sensitive information exposure in localStorage.
 */

import type { Attendee } from '../types/attendee';

/**
 * Safe attendee cache interface - only includes non-confidential fields
 */
export interface SafeAttendeeCache {
  id: string;
  first_name: string;
  last_name: string;
  title: string;
  company: string;
  bio: string;
  photo: string;
  salutation: string;
  registration_status: string;
  registration_id: string; // Keep for functionality
  dining_selections: {
    [key: string]: {
      attending: boolean;
    };
  }; // Keep for event functionality
  selected_breakouts: string[]; // Keep for event functionality
  attributes: {
    ceo: boolean;
    apaxIP: boolean;
    speaker: boolean;
    cLevelExec: boolean;
    sponsorAttendee: boolean;
    otherAttendeeType: boolean;
    portfolioCompanyExecutive: boolean;
  };
  is_cfo: boolean;
  is_apax_ep: boolean;
  primary_attendee_id: string | null;
  company_name_standardized: string;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fields that must be removed for confidentiality
 */
const CONFIDENTIAL_FIELDS = [
  // Contact Information
  'business_phone',
  'mobile_phone',
  'email',
  
  // Travel & Accommodation
  'check_in_date',
  'check_out_date',
  'hotel_selection',
  'custom_hotel',
  'room_type',
  
  // Personal Details
  'has_spouse',
  'dietary_requirements',
  'is_spouse',
  'spouse_details',
  
  // Address Information
  'address1',
  'address2',
  'postal_code',
  'city',
  'state',
  'country',
  'country_code',
  
  // Assistant Information
  'assistant_name',
  'assistant_email',
  
  // System Identifiers
  'idloom_id',
  
  // Authentication
  'access_code' // Already filtered in AttendeeInfoService, but double-check
] as const;

/**
 * Fields that are safe to include in cache
 */
const SAFE_FIELDS = [
  'id',
  'first_name',
  'last_name',
  'title',
  'company',
  'bio',
  'photo',
  'salutation',
  'registration_status',
  'registration_id',
  'dining_selections',
  'selected_breakouts',
  'attributes',
  'is_cfo',
  'is_apax_ep',
  'primary_attendee_id',
  'company_name_standardized',
  'last_synced_at',
  'created_at',
  'updated_at'
] as const;

export class AttendeeCacheFilterService {
  /**
   * Filter confidential fields from attendee data
   * @param attendee - Full attendee object from database
   * @returns Sanitized attendee object safe for caching
   */
  static filterConfidentialFields(attendee: Attendee): SafeAttendeeCache {
    if (!attendee) {
      throw new Error('Attendee data is required for filtering');
    }

    // Create a copy to avoid mutating the original
    const filtered = { ...attendee };

    // Remove all confidential fields
    CONFIDENTIAL_FIELDS.forEach(field => {
      delete (filtered as any)[field];
    });

    // Ensure only safe fields remain
    const safeAttendee: SafeAttendeeCache = {} as SafeAttendeeCache;
    
    SAFE_FIELDS.forEach(field => {
      if (field in filtered) {
        (safeAttendee as any)[field] = (filtered as any)[field];
      }
    });

    return safeAttendee;
  }

  /**
   * Filter an array of attendees
   * @param attendees - Array of attendee objects
   * @returns Array of sanitized attendee objects
   */
  static filterAttendeesArray(attendees: Attendee[]): SafeAttendeeCache[] {
    if (!Array.isArray(attendees)) {
      throw new Error('Attendees must be an array');
    }

    return attendees.map(attendee => this.filterConfidentialFields(attendee));
  }

  /**
   * Validate that confidential fields are not present in cached data
   * @param cachedData - Data to validate
   * @returns Validation result with any issues found
   */
  static validateNoConfidentialData(cachedData: any): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!cachedData) {
      return { isValid: true, issues: [] };
    }

    // Check for confidential fields in the data
    CONFIDENTIAL_FIELDS.forEach(field => {
      if (cachedData[field] !== undefined) {
        issues.push(`Confidential field '${field}' found in cached data`);
      }
    });

    // Recursively check nested objects (like spouse_details)
    this.checkNestedConfidentialData(cachedData, issues);

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Recursively check for confidential data in nested objects
   * @param obj - Object to check
   * @param issues - Array to add issues to
   * @param path - Current path in the object
   */
  private static checkNestedConfidentialData(obj: any, issues: string[], path = ''): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    Object.keys(obj).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Check if this key matches any confidential field patterns
      if (CONFIDENTIAL_FIELDS.includes(key as any)) {
        issues.push(`Confidential field '${currentPath}' found in cached data`);
      }

      // Recursively check nested objects
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.checkNestedConfidentialData(obj[key], issues, currentPath);
      }
    });
  }

  /**
   * Get list of confidential fields for documentation/testing
   * @returns Array of confidential field names
   */
  static getConfidentialFields(): readonly string[] {
    return [...CONFIDENTIAL_FIELDS];
  }

  /**
   * Get list of safe fields for documentation/testing
   * @returns Array of safe field names
   */
  static getSafeFields(): readonly string[] {
    return [...SAFE_FIELDS];
  }

  /**
   * Check if a field is confidential
   * @param fieldName - Name of the field to check
   * @returns True if the field is confidential
   */
  static isConfidentialField(fieldName: string): boolean {
    return CONFIDENTIAL_FIELDS.includes(fieldName as any);
  }

  /**
   * Check if a field is safe for caching
   * @param fieldName - Name of the field to check
   * @returns True if the field is safe for caching
   */
  static isSafeField(fieldName: string): boolean {
    return SAFE_FIELDS.includes(fieldName as any);
  }
}

// Export singleton instance for convenience
export const attendeeCacheFilterService = new AttendeeCacheFilterService();
