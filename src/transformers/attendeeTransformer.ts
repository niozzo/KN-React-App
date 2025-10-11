/**
 * Attendee Data Transformer
 * Story 1.7: Data Transformation Layer for Schema Evolution
 */

import { BaseTransformer, SchemaVersion } from './baseTransformer.ts'
import { FieldMapping, ComputedField, ValidationRule } from '../types/transformation.ts'
import type { Attendee } from '../types/attendee'
import type { SafeAttendeeCache } from '../services/attendeeCacheFilterService'

export class AttendeeTransformer extends BaseTransformer<Attendee> {
  constructor() {
    const fieldMappings: FieldMapping[] = [
      { source: 'id', target: 'id', type: 'string', required: true },
      { source: 'first_name', target: 'first_name', type: 'string', required: true },
      { source: 'last_name', target: 'last_name', type: 'string', required: true },
      // Database field names as primary sources
      { source: 'email_address', target: 'email', type: 'string', required: true },
      { source: 'phone_number', target: 'phone', type: 'string', defaultValue: null },
      { source: 'company_name', target: 'company', type: 'string', defaultValue: '' },
      { source: 'is_active', target: 'isActive', type: 'boolean', defaultValue: true },
      { source: 'created_at', target: 'created_at', type: 'date' },
      { source: 'updated_at', target: 'updated_at', type: 'date' },
      { source: 'selected_breakouts', target: 'selected_breakouts', type: 'array', defaultValue: [] },
      { source: 'hotel_selection', target: 'hotel_selection', type: 'string', defaultValue: null },
      { source: 'dining_selections', target: 'dining_selections', type: 'array', defaultValue: [] },
      { source: 'attributes', target: 'attributes', type: 'object', defaultValue: {} }
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
      }
    ]

    const validationRules: ValidationRule[] = [
      {
        field: 'email',
        rule: (value: any) => {
          if (!value) return false
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          return emailRegex.test(value)
        },
        message: 'Invalid email format'
      },
      {
        field: 'phone',
        rule: (value: any) => {
          if (!value) return true // Optional field
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
          return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))
        },
        message: 'Invalid phone number format'
      }
    ]

    super(fieldMappings, 'attendees', 'Attendee', '1.0.0', computedFields, validationRules)
  }

  /**
   * Transform attendee data with schema evolution support
   * Handles cases where database schema changes but UI model stays stable
   */
  transformFromDatabase(dbData: any): Attendee {
    // Schema evolution is now handled in the base class
    return super.transformFromDatabase(dbData)
  }

  /**
   * Override version detection for attendee-specific schema evolution
   */
  protected inferVersion(data: any): string {
    // Detect schema version based on field presence and data types
    if (data.email_address && !data.email) {
      return '1.0.0' // Legacy schema with email_address
    }
    
    if (data.phone_number && !data.phone) {
      return '1.1.0' // Schema with phone_number
    }
    
    if (data.company_name && !data.company) {
      return '1.2.0' // Schema with company_name
    }
    
    if (data.is_active && typeof data.is_active === 'string') {
      return '1.3.0' // Schema with string boolean fields
    }
    
    return '2.0.0' // Current schema
  }


  /**
   * Handle common data type issues across all versions
   */
  private handleCommonDataTypes(evolved: any): void {
    // Handle null/undefined values
    if (evolved.phone === null || evolved.phone === undefined) {
      evolved.phone = null
    }
    
    if (evolved.company === null || evolved.company === undefined) {
      evolved.company = ''
    }
    
    // Handle empty objects - convert to empty arrays
    if (evolved.dining_selections && typeof evolved.dining_selections === 'object' && !Array.isArray(evolved.dining_selections) && Object.keys(evolved.dining_selections).length === 0) {
      evolved.dining_selections = []
    }
    
    if (evolved.selected_breakouts && typeof evolved.selected_breakouts === 'object' && !Array.isArray(evolved.selected_breakouts) && Object.keys(evolved.selected_breakouts).length === 0) {
      evolved.selected_breakouts = []
    }
    
    if (evolved.attributes && typeof evolved.attributes === 'object' && Object.keys(evolved.attributes).length === 0) {
      evolved.attributes = {}
    }
    
    // Filter empty objects from arrays
    if (Array.isArray(evolved.dining_selections)) {
      evolved.dining_selections = evolved.dining_selections.filter((item: any) => 
        item !== null && item !== undefined && 
        (typeof item !== 'object' || Object.keys(item).length > 0)
      )
    }
    
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
      'email_address': 'email',  // Database field -> UI field
      'phone_number': 'phone',
      'company_name': 'company',
      'is_active': 'isActive'
    }
  }

  /**
   * Handle schema evolution for field name changes
   */
  protected handleSchemaEvolution(dbData: any, schemaVersion: SchemaVersion): any {
    const evolvedData = { ...dbData }
    
    // Handle field name evolution
    if (evolvedData.email && !evolvedData.email_address) {
      // New schema: email field exists, map to email_address for consistency
      evolvedData.email_address = evolvedData.email
    }
    
    if (evolvedData.phone && !evolvedData.phone_number) {
      // New schema: phone field exists, map to phone_number for consistency
      evolvedData.phone_number = evolvedData.phone
    }
    
    if (evolvedData.company && !evolvedData.company_name) {
      // New schema: company field exists, map to company_name for consistency
      evolvedData.company_name = evolvedData.company
    }
    
    return evolvedData
  }

  /**
   * Validate attendee-specific business rules
   */
  validateAttendee(attendee: Attendee): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!attendee.first_name?.trim()) {
      errors.push('First name is required')
    }

    if (!attendee.last_name?.trim()) {
      errors.push('Last name is required')
    }

    if (!attendee.email?.trim()) {
      errors.push('Email is required')
    }

    if (attendee.business_phone && !this.isValidPhone(attendee.business_phone)) {
      errors.push('Invalid business phone number format')
    }
    
    if (attendee.mobile_phone && !this.isValidPhone(attendee.mobile_phone)) {
      errors.push('Invalid mobile phone number format')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate phone number format
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
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
}
