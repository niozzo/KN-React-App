/**
 * Sponsor Data Transformer
 * Story 1.7: Data Transformation Layer for Schema Evolution
 */

import { BaseTransformer } from './baseTransformer.ts'
import { FieldMapping, ComputedField, ValidationRule } from '../types/transformation.ts'
import type { Sponsor } from '../types/sponsor'

export class SponsorTransformer extends BaseTransformer<Sponsor> {
  constructor() {
    const fieldMappings: FieldMapping[] = [
      { source: 'id', target: 'id', type: 'string', required: true },
      { source: 'name', target: 'name', type: 'string', required: true },
      { source: 'logo_url', target: 'logo_url', type: 'string', defaultValue: '' },
      { source: 'website_url', target: 'website_url', type: 'string', defaultValue: '' },
      { source: 'description', target: 'description', type: 'string', defaultValue: '' },
      { source: 'sponsor_level', target: 'sponsor_level', type: 'string', defaultValue: 'bronze' },
      { source: 'display_order', target: 'display_order', type: 'number', defaultValue: 0 },
      { source: 'is_active', target: 'isActive', type: 'boolean', defaultValue: true },
      { source: 'contact_name', target: 'contact_name', type: 'string', defaultValue: '' },
      { source: 'contact_email', target: 'contact_email', type: 'string', defaultValue: '' },
      { source: 'contact_phone', target: 'contact_phone', type: 'string', defaultValue: '' },
      { source: 'created_at', target: 'created_at', type: 'date' },
      { source: 'updated_at', target: 'updated_at', type: 'date' }
    ]

    const computedFields: ComputedField[] = [
      {
        name: 'hasLogo',
        sourceFields: ['logo_url'],
        computation: (data: any) => {
          return !!(data.logo_url && data.logo_url.trim())
        },
        type: 'boolean'
      },
      {
        name: 'hasWebsite',
        sourceFields: ['website_url'],
        computation: (data: any) => {
          return !!(data.website_url && data.website_url.trim())
        },
        type: 'boolean'
      },
      {
        name: 'displayName',
        sourceFields: ['name', 'sponsor_level'],
        computation: (data: any) => {
          const name = data.name || ''
          const level = data.sponsor_level || ''
          return level ? `${name} (${level})` : name
        },
        type: 'string'
      }
    ]

    const validationRules: ValidationRule[] = [
      {
        field: 'logo_url',
        rule: (value: any) => {
          if (!value) return true // Optional field
          try {
            new URL(value)
            return true
          } catch {
            return false
          }
        },
        message: 'Invalid logo URL format'
      },
      {
        field: 'website_url',
        rule: (value: any) => {
          if (!value) return true // Optional field
          try {
            new URL(value)
            return true
          } catch {
            return false
          }
        },
        message: 'Invalid website URL format'
      },
      {
        field: 'contact_email',
        rule: (value: any) => {
          if (!value) return true // Optional field
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          return emailRegex.test(value)
        },
        message: 'Invalid contact email format'
      },
      {
        field: 'sponsor_level',
        rule: (value: any) => {
          if (!value) return true
          const validLevels = ['platinum', 'gold', 'silver', 'bronze', 'partner']
          return validLevels.includes(value.toLowerCase())
        },
        message: 'Invalid sponsor level'
      }
    ]

    super(fieldMappings, 'sponsors', 'Sponsor', '1.0.0', computedFields, validationRules)
  }

  /**
   * Transform sponsor data with schema evolution support
   */
  transformFromDatabase(dbData: any): Sponsor {
    const evolvedData = this.handleSchemaEvolution(dbData)
    return super.transformFromDatabase(evolvedData)
  }

  /**
   * Handle database schema evolution for sponsors
   */
  protected handleSchemaEvolution(dbData: any): any {
    const evolved = { ...dbData }

    // Example: Handle field rename from logo to logo_url
    if (evolved.logo && !evolved.logo_url) {
      evolved.logo_url = evolved.logo
    }

    // Example: Handle field rename from website to website_url
    if (evolved.website && !evolved.website_url) {
      evolved.website_url = evolved.website
    }

    // Example: Handle field rename from level to sponsor_level
    if (evolved.level && !evolved.sponsor_level) {
      evolved.sponsor_level = evolved.level
    }

    // Example: Handle field rename from order to display_order
    if (evolved.order !== undefined && evolved.display_order === undefined) {
      evolved.display_order = evolved.order
    }

    // Example: Handle type changes
    if (typeof evolved.is_active === 'string') {
      evolved.is_active = evolved.is_active === 'true' || evolved.is_active === '1'
    }

    if (typeof evolved.display_order === 'string') {
      const order = parseInt(evolved.display_order)
      evolved.display_order = isNaN(order) ? 0 : order
    }

    return evolved
  }

  /**
   * Get field mapping for schema evolution documentation
   */
  getSchemaEvolutionMapping(): Record<string, string> {
    return {
      'logo': 'logo_url',           // Database field -> UI field
      'website': 'website_url',
      'level': 'sponsor_level',
      'order': 'display_order',
      'active': 'isActive'
    }
  }

  /**
   * Validate sponsor-specific business rules
   */
  validateSponsor(sponsor: Sponsor): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!sponsor.name?.trim()) {
      errors.push('Sponsor name is required')
    }

    if (sponsor.logo && !this.isValidUrl(sponsor.logo)) {
      errors.push('Invalid logo URL format')
    }

    if (sponsor.website && !this.isValidUrl(sponsor.website)) {
      errors.push('Invalid website URL format')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate sponsor level
   */
  private isValidSponsorLevel(level: string): boolean {
    const validLevels = ['platinum', 'gold', 'silver', 'bronze', 'partner']
    return validLevels.includes(level.toLowerCase())
  }

  /**
   * Sort sponsors by display order and name
   */
  sortSponsors(sponsors: Sponsor[]): Sponsor[] {
    return [...sponsors].sort((a, b) => {
      // First sort by display order
      const orderA = a.display_order || 0
      const orderB = b.display_order || 0
      if (orderA !== orderB) return orderA - orderB
      
      // Then sort by name
      return (a.name || '').localeCompare(b.name || '')
    })
  }

  /**
   * Filter active sponsors
   */
  filterActiveSponsors(sponsors: Sponsor[]): Sponsor[] {
    return sponsors.filter(sponsor => sponsor.is_active !== false)
  }
}
