/**
 * Attendee Data Transformer
 * Story 1.7: Data Transformation Layer for Schema Evolution
 */

import { BaseTransformer, SchemaVersion } from './baseTransformer'
import { FieldMapping, ComputedField, ValidationRule } from '../types/transformation'
import type { Attendee } from '../types/attendee'

export class AttendeeTransformer extends BaseTransformer<Attendee> {
  constructor() {
    const fieldMappings: FieldMapping[] = [
      { source: 'id', target: 'id', type: 'string', required: true },
      { source: 'first_name', target: 'first_name', type: 'string', required: true },
      { source: 'last_name', target: 'last_name', type: 'string', required: true },
      { source: 'email', target: 'email', type: 'string', required: true },
      { source: 'phone', target: 'phone', type: 'string', defaultValue: null },
      { source: 'company', target: 'company', type: 'string', defaultValue: '' },
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
        sourceFields: ['first_name', 'last_name', 'company_name'],
        computation: (data: any) => {
          const firstName = data.first_name || ''
          const lastName = data.last_name || ''
          const company = data.company_name || ''
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
   * Handle database schema evolution with version-aware processing
   */
  protected handleSchemaEvolution(dbData: any, schemaVersion: SchemaVersion): any {
    const evolved = { ...dbData }
    
    console.log(`🔄 Attendee schema evolution: ${schemaVersion.version} (confidence: ${schemaVersion.confidence})`)
    
    switch (schemaVersion.version) {
      case '1.0.0':
        // Handle field rename from email_address to email
        if (evolved.email_address && !evolved.email) {
          evolved.email = evolved.email_address
        }
        break
        
      case '1.1.0':
        // Handle field rename from phone_number to phone
        if (evolved.phone_number && !evolved.phone) {
          evolved.phone = evolved.phone_number
        }
        break
        
      case '1.2.0':
        // Handle field rename from company_name to company
        if (evolved.company_name && !evolved.company) {
          evolved.company = evolved.company_name
        }
        break
        
      case '1.3.0':
        // Handle string boolean fields
        if (typeof evolved.is_active === 'string') {
          evolved.is_active = evolved.is_active === 'true' || evolved.is_active === '1'
        }
        break
        
      case '2.0.0':
        // Current schema - no changes needed
        break
        
      default:
        console.warn(`⚠️ Unknown attendee schema version: ${schemaVersion.version}`)
    }
    
    // Handle common data type issues
    this.handleCommonDataTypes(evolved)
    
    return evolved
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
    
    // Handle empty objects
    if (evolved.dining_selections && typeof evolved.dining_selections === 'object' && Object.keys(evolved.dining_selections).length === 0) {
      evolved.dining_selections = []
    }
    
    if (evolved.selected_breakouts && typeof evolved.selected_breakouts === 'object' && Object.keys(evolved.selected_breakouts).length === 0) {
      evolved.selected_breakouts = []
    }
    
    if (evolved.attributes && typeof evolved.attributes === 'object' && Object.keys(evolved.attributes).length === 0) {
      evolved.attributes = {}
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

    if (attendee.phone && !this.isValidPhone(attendee.phone)) {
      errors.push('Invalid phone number format')
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
}
