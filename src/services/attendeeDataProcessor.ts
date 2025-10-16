/**
 * Unified Attendee Data Processor
 * 
 * Centralized service for processing attendee data with consistent filtering logic.
 * This ensures all data sync paths apply the same business rules and privacy controls.
 * 
 * Architecture: Single Responsibility + DRY + Consistent Data Flow
 */

import { Attendee } from '../types/database';
import { logger } from '../utils/logger';

export interface ProcessingResult {
  success: boolean;
  data: Attendee[];
  originalCount: number;
  filteredCount: number;
  errors: string[];
}

export interface BusinessRuleResult {
  passed: boolean;
  reason?: string;
}

export class AttendeeDataProcessor {
  /**
   * Process attendee data with all transformations and filtering
   * This is the main entry point for all attendee data processing
   */
  static async processAttendeeData(rawData: Attendee[]): Promise<ProcessingResult> {
    const startTime = performance.now();
    const originalCount = rawData.length;
    const errors: string[] = [];

    try {
      logger.debug(`Processing ${originalCount} attendee records`, null, 'AttendeeDataProcessor');

      // Step 1: Apply schema transformations
      const transformedData = await this.applyTransformations(rawData);
      logger.debug(`Applied transformations to ${transformedData.length} records`, null, 'AttendeeDataProcessor');

      // Step 2: Apply business rules (filtering)
      const businessFilteredData = await this.applyBusinessRules(transformedData);
      logger.debug(`Applied business rules, filtered to ${businessFilteredData.length} records`, null, 'AttendeeDataProcessor');

      // Step 3: Apply privacy controls
      const privacyFilteredData = await this.applyPrivacyControls(businessFilteredData);
      logger.debug(`Applied privacy controls, final count: ${privacyFilteredData.length} records`, null, 'AttendeeDataProcessor');

      const processingTime = performance.now() - startTime;
      logger.success(`Attendee data processing completed in ${processingTime.toFixed(2)}ms`, null, 'AttendeeDataProcessor');

      return {
        success: true,
        data: privacyFilteredData,
        originalCount,
        filteredCount: privacyFilteredData.length,
        errors
      };

    } catch (error) {
      const errorMsg = `Failed to process attendee data: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg, error, 'AttendeeDataProcessor');
      
      return {
        success: false,
        data: [],
        originalCount,
        filteredCount: 0,
        errors: [errorMsg]
      };
    }
  }

  /**
   * Process a single attendee record
   */
  static async processSingleAttendee(attendee: Attendee): Promise<Attendee | null> {
    try {
      const result = await this.processAttendeeData([attendee]);
      return result.success && result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      logger.error('Failed to process single attendee', error, 'AttendeeDataProcessor');
      return null;
    }
  }

  /**
   * Apply schema transformations to attendee data
   */
  private static async applyTransformations(data: Attendee[]): Promise<Attendee[]> {
    try {
      // Import and use existing attendee transformer
      const { AttendeeTransformer } = await import('../transformers/attendeeTransformer');
      const attendeeTransformer = new AttendeeTransformer();
      
      // Apply transformations
      const transformedData = attendeeTransformer.transformArrayFromDatabase(data);
      
      logger.debug(`Applied schema transformations to ${transformedData.length} records`, null, 'AttendeeDataProcessor');
      return transformedData;
      
    } catch (error) {
      logger.error('Failed to apply transformations', error, 'AttendeeDataProcessor');
      throw error;
    }
  }

  /**
   * Apply business rules filtering
   * This is where we ensure only confirmed, active attendees are included
   */
  private static async applyBusinessRules(data: Attendee[]): Promise<Attendee[]> {
    try {
      let filteredData = data;

      // Business Rule 1: Filter active attendees
      filteredData = await this.filterActiveAttendees(filteredData);
      logger.debug(`After active filtering: ${filteredData.length} records`, null, 'AttendeeDataProcessor');

      // Business Rule 2: Filter confirmed attendees (CRITICAL for Bims issue)
      filteredData = await this.filterConfirmedAttendees(filteredData);
      logger.debug(`After confirmed filtering: ${filteredData.length} records`, null, 'AttendeeDataProcessor');

      // Business Rule 3: Handle edge cases (speakers without companies)
      filteredData = await this.handleEdgeCases(filteredData);
      logger.debug(`After edge case handling: ${filteredData.length} records`, null, 'AttendeeDataProcessor');

      return filteredData;
      
    } catch (error) {
      logger.error('Failed to apply business rules', error, 'AttendeeDataProcessor');
      throw error;
    }
  }

  /**
   * Apply privacy controls and confidential data filtering
   */
  private static async applyPrivacyControls(data: Attendee[]): Promise<Attendee[]> {
    try {
      // Use existing AttendeeCacheFilterService for privacy controls
      const { AttendeeCacheFilterService } = await import('./attendeeCacheFilterService');
      const privacyFilteredData = await AttendeeCacheFilterService.filterAttendeesArray(data);
      
      logger.debug(`Applied privacy controls to ${privacyFilteredData.length} records`, null, 'AttendeeDataProcessor');
      return privacyFilteredData;
      
    } catch (error) {
      logger.error('Failed to apply privacy controls', error, 'AttendeeDataProcessor');
      throw error;
    }
  }

  /**
   * Filter active attendees
   */
  private static async filterActiveAttendees(data: Attendee[]): Promise<Attendee[]> {
    return data.filter(attendee => {
      const isActive = attendee.is_active !== false; // Default to true if undefined
      return isActive;
    });
  }

  /**
   * Filter confirmed attendees - CRITICAL for preventing Bims from appearing
   */
  private static async filterConfirmedAttendees(data: Attendee[]): Promise<Attendee[]> {
    return data.filter(attendee => {
      const isConfirmed = attendee.registration_status === 'confirmed';
      return isConfirmed;
    });
  }

  /**
   * Handle edge cases for specific attendees
   */
  private static async handleEdgeCases(data: Attendee[]): Promise<Attendee[]> {
    // Edge case: These speakers were assigned "Apax" in the main DB but 
    // don't have a company affiliation. Clear company to prevent display.
    const ATTENDEES_WITHOUT_COMPANY = [
      'de8cb880-e6f5-425d-9267-1eb0a2817f6b',
      '21d75c80-9560-4e4c-86f0-9345ddb705a1'
    ];
    
    return data.map(attendee => {
      if (ATTENDEES_WITHOUT_COMPANY.includes(attendee.id)) {
        return { ...attendee, company: '' };
      }
      return attendee;
    });
  }

  /**
   * Validate that processed data meets business requirements
   */
  static validateProcessedData(data: Attendee[]): BusinessRuleResult {
    try {
      // Check that all attendees are confirmed
      const nonConfirmedAttendees = data.filter(attendee => attendee.registration_status !== 'confirmed');
      if (nonConfirmedAttendees.length > 0) {
        return {
          passed: false,
          reason: `Found ${nonConfirmedAttendees.length} non-confirmed attendees: ${nonConfirmedAttendees.map(a => a.first_name + ' ' + a.last_name).join(', ')}`
        };
      }

      // Check that all attendees are active
      const inactiveAttendees = data.filter(attendee => attendee.is_active === false);
      if (inactiveAttendees.length > 0) {
        return {
          passed: false,
          reason: `Found ${inactiveAttendees.length} inactive attendees: ${inactiveAttendees.map(a => a.first_name + ' ' + a.last_name).join(', ')}`
        };
      }

      return { passed: true };
      
    } catch (error) {
      return {
        passed: false,
        reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get processing statistics
   */
  static getProcessingStats(originalCount: number, filteredCount: number): string {
    const filteredOut = originalCount - filteredCount;
    const percentage = originalCount > 0 ? ((filteredOut / originalCount) * 100).toFixed(1) : '0';
    return `Processed ${originalCount} → ${filteredCount} attendees (${filteredOut} filtered out, ${percentage}%)`;
  }
}

// Export singleton instance for convenience
export const attendeeDataProcessor = new AttendeeDataProcessor();
