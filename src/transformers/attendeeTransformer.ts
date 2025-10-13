/**
 * Attendee Data Transformer
 * Story 1.7: Data Transformation Layer for Schema Evolution
 * Story 8.7: Company Name Normalization via Application-Side Transformation
 */

import { BaseTransformer, SchemaVersion } from './baseTransformer.ts'
import { FieldMapping, ComputedField, ValidationRule } from '../types/transformation.ts'
import type { Attendee } from '../types/attendee'
import type { SafeAttendeeCache } from '../services/attendeeCacheFilterService'
import { CompanyNormalizationService } from '../services/companyNormalizationService'

export class AttendeeTransformer extends BaseTransformer<Attendee> {
  constructor() {
    // Only map SAFE_FIELDS (non-confidential fields) per attendeeCacheFilterService
    // Confidential fields (email, phone, address, etc.) are excluded to avoid wasted transformation cycles
    const fieldMappings: FieldMapping[] = [
      // Core Identity (required)
      { source: 'id', target: 'id', type: 'string', required: true },
      { source: 'first_name', target: 'first_name', type: 'string', required: true },
      { source: 'last_name', target: 'last_name', type: 'string', required: true },
      
      // Public Profile Information
      { source: 'salutation', target: 'salutation', type: 'string', defaultValue: '' },
      { source: 'title', target: 'title', type: 'string', defaultValue: '' },
      { source: 'company', target: 'company', type: 'string', defaultValue: '' },
      { source: 'bio', target: 'bio', type: 'string', defaultValue: '' },
      { source: 'photo', target: 'photo', type: 'string', defaultValue: '' },
      
      // Registration Information
      { source: 'registration_status', target: 'registration_status', type: 'string', defaultValue: '' },
      { source: 'registration_id', target: 'registration_id', type: 'string', defaultValue: '' },
      
      // Event Preferences (non-confidential)
      { source: 'dining_selections', target: 'dining_selections', type: 'object', defaultValue: {} },
      { source: 'selected_breakouts', target: 'selected_breakouts', type: 'array', defaultValue: [] },
      
      // Role Attributes
      { source: 'attributes', target: 'attributes', type: 'object', defaultValue: {} },
      { source: 'is_cfo', target: 'is_cfo', type: 'boolean', defaultValue: false },
      { source: 'is_apax_ep', target: 'is_apax_ep', type: 'boolean', defaultValue: false },
      
      // System Fields
      { source: 'primary_attendee_id', target: 'primary_attendee_id', type: 'string', defaultValue: null },
      { source: 'company_name_standardized', target: 'company_name_standardized', type: 'string', defaultValue: '' },
      { source: 'last_synced_at', target: 'last_synced_at', type: 'string', defaultValue: null },
      { source: 'created_at', target: 'created_at', type: 'date' },
      { source: 'updated_at', target: 'updated_at', type: 'date' },
      
      // Business Logic Field (not cached, but used for filtering)
      { source: 'is_active', target: 'isActive', type: 'boolean', defaultValue: true }
    ]

    const computedFields: ComputedField[] = [
      {
        name: 'fullName',
        sourceFields: ['first_name', 'last_name'],
        computation: (data: any) => {
          const firstName = data.first_name || ''
          const lastName = data.last_name || ''
          return `${firstName} ${lastName}`.trim()
        },
        type: 'string'
      },
      {
        name: 'displayName',
        sourceFields: ['first_name', 'last_name', 'company'],
        computation: (data: any) => {
          const firstName = data.first_name || ''
          const lastName = data.last_name || ''
          const company = data.company || ''
          const name = `${firstName} ${lastName}`.trim()
          return company ? `${name} (${company})` : name
        },
        type: 'string'
      },
      // Story 8.7: Company Normalization Computed Fields
      // ✅ VERIFIED: Only uses safe source field (data.company)
      // ✅ VERIFIED: No confidential fields accessed or exposed
      // ✅ VERIFIED: Company reference data contains no PII
      {
        name: 'companyStandardized',
        sourceFields: ['company'],
        computation: (data: any) => {
          try {
            const service = CompanyNormalizationService.getInstance()
            return service.normalizeCompanyName(data.company)
          } catch (error) {
            console.warn('Company normalization failed:', error)
            return null
          }
        },
        type: 'object'
      },
      {
        name: 'companyDisplayName',
        sourceFields: ['company'],
        computation: (data: any) => {
          try {
            const service = CompanyNormalizationService.getInstance()
            const standardized = service.normalizeCompanyName(data.company)
            return standardized?.name || data.company || ''
          } catch (error) {
            console.warn('Company display name computation failed:', error)
            return data.company || ''
          }
        },
        type: 'string'
      },
      {
        name: 'companySector',
        sourceFields: ['company'],
        computation: (data: any) => {
          try {
            const service = CompanyNormalizationService.getInstance()
            const standardized = service.normalizeCompanyName(data.company)
            return standardized?.sector || undefined
          } catch (error) {
            console.warn('Company sector computation failed:', error)
            return undefined
          }
        },
        type: 'string'
      },
      {
        name: 'companyGeography',
        sourceFields: ['company'],
        computation: (data: any) => {
          try {
            const service = CompanyNormalizationService.getInstance()
            const standardized = service.normalizeCompanyName(data.company)
            return standardized?.geography || undefined
          } catch (error) {
            console.warn('Company geography computation failed:', error)
            return undefined
          }
        },
        type: 'string'
      }
    ]

    // No validation rules needed - confidential fields are not mapped
    const validationRules: ValidationRule[] = []

    super(fieldMappings, 'attendees', 'Attendee', '1.0.0', computedFields, validationRules)
  }

  /**
   * Transform attendee data with schema evolution support
   * Handles cases where database schema changes but UI model stays stable
   * Story 8.7: Replace company field with normalized canonical name
   */
  transformFromDatabase(dbData: any): Attendee {
    // Schema evolution is now handled in the base class
    const result = super.transformFromDatabase(dbData)
    
    // Story 8.7: Replace company field with normalized canonical name
    // This way, no UI changes are needed - the company field already displays everywhere
    if (result.companyDisplayName && result.companyDisplayName !== result.company) {
      console.log(`🏢 Company normalized: "${result.company}" → "${result.companyDisplayName}"`)
      result.company = result.companyDisplayName
    }
    
    return result
  }

  /**
   * Override version detection for attendee-specific schema evolution
   */
  protected inferVersion(data: any): string {
    // Simple version detection based on boolean field types
    if (data.is_active && typeof data.is_active === 'string') {
      return '1.0.0' // Legacy schema with string boolean fields
    }
    
    return '2.0.0' // Current schema
  }


  /**
   * Handle common data type issues across all versions
   * Note: Only handles non-confidential fields that are mapped
   */
  private handleCommonDataTypes(evolved: any): void {
    // Handle null/undefined values for safe fields
    if (evolved.company === null || evolved.company === undefined) {
      evolved.company = ''
    }
    
    // Handle empty objects - convert to appropriate types
    if (evolved.attributes && typeof evolved.attributes === 'object' && Object.keys(evolved.attributes).length === 0) {
      evolved.attributes = {}
    }
    
    // Filter empty objects from arrays
    if (Array.isArray(evolved.selected_breakouts)) {
      evolved.selected_breakouts = evolved.selected_breakouts.filter((item: any) => 
        item !== null && item !== undefined && 
        (typeof item !== 'object' || Object.keys(item).length > 0)
      )
    }
  }

  /**
   * Get field mapping for schema evolution documentation
   */
  getSchemaEvolutionMapping(): Record<string, string> {
    return {
      'is_active': 'isActive'
    }
  }

  /**
   * Handle schema evolution for field name changes
   */
  protected handleSchemaEvolution(dbData: any, schemaVersion: SchemaVersion): any {
    // No field name evolution needed - using direct field mappings
    return dbData
  }

  /**
   * Validate attendee-specific business rules
   * Note: Only validates non-confidential fields that are mapped
   */
  validateAttendee(attendee: Attendee): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!attendee.first_name?.trim()) {
      errors.push('First name is required')
    }

    if (!attendee.last_name?.trim()) {
      errors.push('Last name is required')
    }

    // Confidential fields (email, phone) are not validated here
    // as they are not mapped in the transformer

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Transform filtered attendee data from cache
   * Story 2.2.4: Handle filtered attendee data that has confidential fields removed
   */
  transformFromFilteredCache(filteredData: SafeAttendeeCache): Attendee {
    // Convert SafeAttendeeCache back to Attendee format
    // Note: Confidential fields will be undefined/null in the result
    const attendee: Attendee = {
      ...filteredData,
      // Add undefined for all confidential fields
      business_phone: undefined as any,
      mobile_phone: undefined as any,
      check_in_date: undefined as any,
      check_out_date: undefined as any,
      hotel_selection: undefined as any,
      custom_hotel: undefined as any,
      room_type: undefined as any,
      has_spouse: undefined as any,
      dietary_requirements: undefined as any,
      is_spouse: undefined as any,
      spouse_details: undefined as any,
      address1: undefined as any,
      address2: undefined as any,
      postal_code: undefined as any,
      city: undefined as any,
      state: undefined as any,
      country: undefined as any,
      country_code: undefined as any,
      assistant_name: undefined as any,
      assistant_email: undefined as any,
      idloom_id: undefined as any,
      access_code: undefined as any
    };

    return attendee;
  }

  /**
   * Check if attendee data is filtered (missing confidential fields)
   */
  isFilteredAttendeeData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check if confidential fields are missing (indicating filtered data)
    const confidentialFields = [
      'business_phone', 'mobile_phone', 'check_in_date', 'check_out_date',
      'hotel_selection', 'custom_hotel', 'room_type', 'has_spouse',
      'dietary_requirements', 'is_spouse', 'spouse_details', 'address1',
      'address2', 'postal_code', 'city', 'state', 'country', 'country_code',
      'assistant_name', 'assistant_email', 'idloom_id', 'access_code'
    ];

    // If all confidential fields are missing, data is likely filtered
    return confidentialFields.every(field => data[field] === undefined);
  }

  /**
   * Filter active attendees (isActive !== false)
   * Treats undefined/null as active (default behavior)
   */
  filterActiveAttendees(attendees: Attendee[]): Attendee[] {
    return attendees.filter(attendee => attendee.isActive !== false)
  }
}
