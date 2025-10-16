/**
 * Data Validation Service
 * 
 * Provides architectural guards to ensure cached data meets business requirements.
 * This service validates that all attendee data in cache is properly filtered
 * and prevents filtering bypasses from persisting.
 */

import { Attendee } from '../types/database';
import { logger } from '../utils/logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  statistics: ValidationStatistics;
}

export interface ValidationStatistics {
  totalRecords: number;
  confirmedRecords: number;
  activeRecords: number;
  filteredOutRecords: number;
  complianceRate: number;
}

export interface ValidationRule {
  name: string;
  description: string;
  validate: (data: Attendee[]) => boolean;
  getViolations: (data: Attendee[]) => string[];
}

export class DataValidationService {
  private static readonly VALIDATION_RULES: ValidationRule[] = [
    {
      name: 'confirmed_attendees_only',
      description: 'All cached attendees must have confirmed registration status',
      validate: (data: Attendee[]) => data.every(attendee => attendee.registration_status === 'confirmed'),
      getViolations: (data: Attendee[]) => {
        const violations = data.filter(attendee => attendee.registration_status !== 'confirmed');
        return violations.map(attendee => `${attendee.first_name} ${attendee.last_name} (${attendee.registration_status})`);
      }
    },
    {
      name: 'active_attendees_only',
      description: 'All cached attendees must be active',
      validate: (data: Attendee[]) => data.every(attendee => attendee.is_active !== false),
      getViolations: (data: Attendee[]) => {
        const violations = data.filter(attendee => attendee.is_active === false);
        return violations.map(attendee => `${attendee.first_name} ${attendee.last_name} (inactive)`);
      }
    },
    {
      name: 'no_bims_attendee',
      description: 'Bims Daniells should never appear in cached data',
      validate: (data: Attendee[]) => !data.some(attendee => 
        attendee.first_name === 'Bims' && attendee.last_name === 'Daniells'
      ),
      getViolations: (data: Attendee[]) => {
        const violations = data.filter(attendee => 
          attendee.first_name === 'Bims' && attendee.last_name === 'Daniells'
        );
        return violations.map(attendee => `CRITICAL: ${attendee.first_name} ${attendee.last_name} found in cache`);
      }
    },
    {
      name: 'no_pending_registrations',
      description: 'No attendees with pending registration status',
      validate: (data: Attendee[]) => !data.some(attendee => attendee.registration_status === 'pending'),
      getViolations: (data: Attendee[]) => {
        const violations = data.filter(attendee => attendee.registration_status === 'pending');
        return violations.map(attendee => `${attendee.first_name} ${attendee.last_name} (pending registration)`);
      }
    }
  ];

  /**
   * Validate cached attendee data against all business rules
   */
  static validateCachedAttendees(data: Attendee[]): ValidationResult {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      logger.debug(`Validating ${data.length} cached attendee records`, null, 'DataValidationService');

      // Run all validation rules
      for (const rule of this.VALIDATION_RULES) {
        try {
          if (!rule.validate(data)) {
            const violations = rule.getViolations(data);
            errors.push(`${rule.name}: ${violations.join(', ')}`);
            logger.warn(`Validation rule failed: ${rule.name}`, violations, 'DataValidationService');
          }
        } catch (error) {
          const errorMsg = `Validation rule ${rule.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          logger.error(errorMsg, error, 'DataValidationService');
        }
      }

      // Calculate statistics
      const statistics = this.calculateStatistics(data);
      
      // Determine overall validity
      const isValid = errors.length === 0;
      
      const validationTime = performance.now() - startTime;
      logger.debug(`Validation completed in ${validationTime.toFixed(2)}ms`, null, 'DataValidationService');

      return {
        isValid,
        errors,
        warnings,
        statistics
      };

    } catch (error) {
      const errorMsg = `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg, error, 'DataValidationService');
      
      return {
        isValid: false,
        errors: [errorMsg],
        warnings: [],
        statistics: {
          totalRecords: data.length,
          confirmedRecords: 0,
          activeRecords: 0,
          filteredOutRecords: 0,
          complianceRate: 0
        }
      };
    }
  }

  /**
   * Validate specific business rules
   */
  static validateBusinessRules(data: Attendee[]): ValidationResult {
    const businessRules = this.VALIDATION_RULES.filter(rule => 
      rule.name === 'confirmed_attendees_only' || 
      rule.name === 'active_attendees_only' ||
      rule.name === 'no_pending_registrations'
    );

    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of businessRules) {
      if (!rule.validate(data)) {
        const violations = rule.getViolations(data);
        errors.push(`${rule.name}: ${violations.join(', ')}`);
      }
    }

    const statistics = this.calculateStatistics(data);
    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      statistics
    };
  }

  /**
   * Detect filtering bypasses (critical for Bims issue)
   */
  static detectFilteringBypasses(data: Attendee[]): boolean {
    // Check for specific known issues
    const hasBims = data.some(attendee => 
      attendee.first_name === 'Bims' && attendee.last_name === 'Daniells'
    );
    
    const hasPendingRegistrations = data.some(attendee => 
      attendee.registration_status === 'pending'
    );
    
    const hasInactiveAttendees = data.some(attendee => 
      attendee.is_active === false
    );

    const bypassDetected = hasBims || hasPendingRegistrations || hasInactiveAttendees;
    
    if (bypassDetected) {
      logger.error('CRITICAL: Filtering bypass detected in cached data', {
        hasBims,
        hasPendingRegistrations,
        hasInactiveAttendees,
        totalRecords: data.length
      }, 'DataValidationService');
    }

    return bypassDetected;
  }

  /**
   * Calculate validation statistics
   */
  private static calculateStatistics(data: Attendee[]): ValidationStatistics {
    const totalRecords = data.length;
    const confirmedRecords = data.filter(attendee => attendee.registration_status === 'confirmed').length;
    const activeRecords = data.filter(attendee => attendee.is_active !== false).length;
    const filteredOutRecords = totalRecords - confirmedRecords;
    const complianceRate = totalRecords > 0 ? (confirmedRecords / totalRecords) * 100 : 100;

    return {
      totalRecords,
      confirmedRecords,
      activeRecords,
      filteredOutRecords,
      complianceRate
    };
  }

  /**
   * Get validation report for monitoring
   */
  static getValidationReport(data: Attendee[]): string {
    const result = this.validateCachedAttendees(data);
    const stats = result.statistics;
    
    let report = `Data Validation Report:\n`;
    report += `- Total Records: ${stats.totalRecords}\n`;
    report += `- Confirmed Records: ${stats.confirmedRecords}\n`;
    report += `- Active Records: ${stats.activeRecords}\n`;
    report += `- Compliance Rate: ${stats.complianceRate.toFixed(1)}%\n`;
    report += `- Validation Status: ${result.isValid ? 'PASS' : 'FAIL'}\n`;
    
    if (result.errors.length > 0) {
      report += `- Errors: ${result.errors.length}\n`;
      result.errors.forEach(error => {
        report += `  * ${error}\n`;
      });
    }
    
    if (result.warnings.length > 0) {
      report += `- Warnings: ${result.warnings.length}\n`;
      result.warnings.forEach(warning => {
        report += `  * ${warning}\n`;
      });
    }

    return report;
  }

  /**
   * Validate data before caching (preventive validation)
   */
  static validateBeforeCaching(data: Attendee[]): ValidationResult {
    logger.debug(`Pre-caching validation for ${data.length} records`, null, 'DataValidationService');
    
    const result = this.validateCachedAttendees(data);
    
    if (!result.isValid) {
      logger.error('CRITICAL: Invalid data detected before caching', result.errors, 'DataValidationService');
      throw new Error(`Data validation failed before caching: ${result.errors.join(', ')}`);
    }
    
    return result;
  }

  /**
   * Validate data after retrieval (detective validation)
   */
  static validateAfterRetrieval(data: Attendee[]): ValidationResult {
    logger.debug(`Post-retrieval validation for ${data.length} records`, null, 'DataValidationService');
    
    const result = this.validateCachedAttendees(data);
    
    if (!result.isValid) {
      logger.error('CRITICAL: Invalid data detected after retrieval', result.errors, 'DataValidationService');
      
      // Alert monitoring systems
      this.alertFilteringBypass(result.errors);
    }
    
    return result;
  }

  /**
   * Alert monitoring systems about filtering bypasses
   */
  private static alertFilteringBypass(errors: string[]): void {
    // In a production environment, this would integrate with monitoring systems
    // For now, we'll use console.error and logger for visibility
    
    const alertMessage = `FILTERING BYPASS ALERT: ${errors.join('; ')}`;
    console.error(`🚨 ${alertMessage}`);
    
    logger.error(alertMessage, null, 'DataValidationService');
    
    // TODO: Integrate with monitoring systems like:
    // - Sentry for error tracking
    // - DataDog for metrics
    // - Slack notifications for critical issues
    // - Email alerts for data integrity issues
  }

  /**
   * Get all validation rules for documentation
   */
  static getValidationRules(): ValidationRule[] {
    return [...this.VALIDATION_RULES];
  }

  /**
   * Add custom validation rule
   */
  static addValidationRule(rule: ValidationRule): void {
    this.VALIDATION_RULES.push(rule);
    logger.debug(`Added custom validation rule: ${rule.name}`, null, 'DataValidationService');
  }
}

// Export singleton instance for convenience
export const dataValidationService = new DataValidationService();
