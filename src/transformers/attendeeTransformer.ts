/**
 * Attendee Data Transformer
 * Story 1.7: Data Transformation Layer for Schema Evolution
 */

import { BaseTransformer } from './baseTransformer'
import { FieldMapping, ComputedField, ValidationRule } from '../types/transformation'
import type { Attendee } from '../types/attendee'

export class AttendeeTransformer extends BaseTransformer<Attendee> {
  constructor() {
    const fieldMappings: FieldMapping[] = [
      { source: 'id', target: 'id', type: 'string', required: true },
      { source: 'first_name', target: 'first_name', type: 'string', required: true },
      { source: 'last_name', target: 'last_name', type: 'string', required: true },
      { source: 'email_address', target: 'email', type: 'string', required: true },
      { source: 'phone_number', target: 'phone', type: 'string', defaultValue: null },
      { source: 'company_name', target: 'company', type: 'string', defaultValue: '' },
      { source: 'is_active', target: 'isActive', type: 'boolean', defaultValue: true },
      { source: 'created_at', target: 'created_at', type: 'date' },
      { source: 'updated_at', target: 'updated_at', type: 'date' },
      { source: 'selected_breakouts', target: 'selected_breakouts', type: 'array', defaultValue: [] },
      { source: 'hotel_selection', target: 'hotel_selection', type: 'string', defaultValue: null },
      { source: 'dining_selections', target: 'dining_selections', type: 'array', defaultValue: [] }
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
    // Handle schema evolution scenarios
    const evolvedData = this.handleSchemaEvolution(dbData)
    return super.transformFromDatabase(evolvedData)
  }

  /**
   * Handle database schema evolution
   * This method can be updated when database schema changes
   */
  private handleSchemaEvolution(dbData: any): any {
    const evolved = { ...dbData }

    // Example: Handle field rename from email_address to email
    if (evolved.email && !evolved.email_address) {
      evolved.email_address = evolved.email
    }

    // Example: Handle field addition (new fields are ignored by UI)
    // Database might add internal_notes, audit_trail, etc.
    // These are automatically ignored by field mapping

    // Example: Handle field removal with default values
    if (!evolved.phone_number && !evolved.phone) {
      evolved.phone_number = null // Will be mapped to phone with defaultValue
    }

    // Example: Handle type changes
    if (typeof evolved.is_active === 'string') {
      evolved.is_active = evolved.is_active === 'true' || evolved.is_active === '1'
    }

    return evolved
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
