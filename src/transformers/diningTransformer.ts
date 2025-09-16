/**
 * Dining Data Transformer
 * Story 1.7: Data Transformation Layer for Schema Evolution
 */

import { BaseTransformer } from './baseTransformer'
import { FieldMapping, ComputedField, ValidationRule } from '../types/transformation'
import type { DiningOption } from '../types/dining'

export class DiningTransformer extends BaseTransformer<DiningOption> {
  constructor() {
    const fieldMappings: FieldMapping[] = [
      { source: 'id', target: 'id', type: 'string', required: true },
      { source: 'name', target: 'name', type: 'string', required: true },
      { source: 'description', target: 'description', type: 'string', defaultValue: '' },
      { source: 'date', target: 'date', type: 'string', required: true },
      { source: 'time', target: 'time', type: 'string', required: true },
      { source: 'location', target: 'location', type: 'string', defaultValue: '' },
      { source: 'meal_type', target: 'meal_type', type: 'string', defaultValue: 'lunch' },
      { source: 'dietary_options', target: 'dietary_options', type: 'array', defaultValue: [] },
      { source: 'max_capacity', target: 'max_capacity', type: 'number', defaultValue: null },
      { source: 'price', target: 'price', type: 'number', defaultValue: 0 },
      { source: 'is_active', target: 'isActive', type: 'boolean', defaultValue: true },
      { source: 'created_at', target: 'created_at', type: 'date' },
      { source: 'updated_at', target: 'updated_at', type: 'date' }
    ]

    const computedFields: ComputedField[] = [
      {
        name: 'displayName',
        sourceFields: ['name', 'meal_type', 'date'],
        computation: (data: any) => {
          const name = data.name || ''
          const mealType = data.meal_type || ''
          const date = data.date || ''
          return `${name} (${mealType}) - ${date}`
        },
        type: 'string'
      },
      {
        name: 'hasCapacity',
        sourceFields: ['max_capacity'],
        computation: (data: any) => {
          return data.max_capacity !== null && data.max_capacity > 0
        },
        type: 'boolean'
      },
      {
        name: 'isFree',
        sourceFields: ['price'],
        computation: (data: any) => {
          return !data.price || data.price === 0
        },
        type: 'boolean'
      },
      {
        name: 'dietaryInfo',
        sourceFields: ['dietary_options'],
        computation: (data: any) => {
          const options = data.dietary_options || []
          return Array.isArray(options) ? options.join(', ') : ''
        },
        type: 'string'
      }
    ]

    const validationRules: ValidationRule[] = [
      {
        field: 'date',
        rule: (value: any) => {
          if (!value) return false
          const date = new Date(value)
          return !isNaN(date.getTime())
        },
        message: 'Invalid date format'
      },
      {
        field: 'time',
        rule: (value: any) => {
          if (!value) return false
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
          return timeRegex.test(value)
        },
        message: 'Invalid time format (HH:MM)'
      },
      {
        field: 'meal_type',
        rule: (value: any) => {
          if (!value) return true
          const validTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'beverage']
          return validTypes.includes(value.toLowerCase())
        },
        message: 'Invalid meal type'
      },
      {
        field: 'price',
        rule: (value: any) => {
          if (value === null || value === undefined) return true
          return typeof value === 'number' && value >= 0
        },
        message: 'Price must be a non-negative number'
      }
    ]

    super(fieldMappings, 'dining_options', 'DiningOption', '1.0.0', computedFields, validationRules)
  }

  /**
   * Transform dining data with schema evolution support
   */
  transformFromDatabase(dbData: any): DiningOption {
    const evolvedData = this.handleSchemaEvolution(dbData)
    return super.transformFromDatabase(evolvedData)
  }

  /**
   * Handle database schema evolution for dining options
   */
  private handleSchemaEvolution(dbData: any): any {
    const evolved = { ...dbData }

    // Example: Handle field rename from type to meal_type
    if (evolved.type && !evolved.meal_type) {
      evolved.meal_type = evolved.type
    }

    // Example: Handle field rename from capacity to max_capacity
    if (evolved.capacity !== undefined && evolved.max_capacity === undefined) {
      evolved.max_capacity = evolved.capacity
    }

    // Example: Handle field rename from dietary to dietary_options
    if (evolved.dietary && !evolved.dietary_options) {
      evolved.dietary_options = Array.isArray(evolved.dietary) ? evolved.dietary : [evolved.dietary]
    }

    // Example: Handle type changes
    if (typeof evolved.is_active === 'string') {
      evolved.is_active = evolved.is_active === 'true' || evolved.is_active === '1'
    }

    if (typeof evolved.price === 'string') {
      const price = parseFloat(evolved.price)
      evolved.price = isNaN(price) ? 0 : price
    }

    if (typeof evolved.max_capacity === 'string') {
      const capacity = parseInt(evolved.max_capacity)
      evolved.max_capacity = isNaN(capacity) ? null : capacity
    }

    return evolved
  }

  /**
   * Get field mapping for schema evolution documentation
   */
  getSchemaEvolutionMapping(): Record<string, string> {
    return {
      'type': 'meal_type',           // Database field -> UI field
      'capacity': 'max_capacity',
      'dietary': 'dietary_options',
      'active': 'isActive'
    }
  }

  /**
   * Validate dining option-specific business rules
   */
  validateDiningOption(diningOption: DiningOption): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!diningOption.name?.trim()) {
      errors.push('Dining option name is required')
    }

    if (!diningOption.date?.trim()) {
      errors.push('Date is required')
    }

    if (!diningOption.time?.trim()) {
      errors.push('Time is required')
    }

    if (diningOption.price !== undefined && diningOption.price < 0) {
      errors.push('Price cannot be negative')
    }

    if (diningOption.max_capacity !== null && diningOption.max_capacity !== undefined && diningOption.max_capacity < 0) {
      errors.push('Max capacity cannot be negative')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Sort dining options by date and time
   */
  sortDiningOptions(diningOptions: DiningOption[]): DiningOption[] {
    return [...diningOptions].sort((a, b) => {
      // First sort by date
      const dateComparison = (a.date || '').localeCompare(b.date || '')
      if (dateComparison !== 0) return dateComparison
      
      // Then sort by time
      return (a.time || '').localeCompare(b.time || '')
    })
  }

  /**
   * Filter active dining options
   */
  filterActiveDiningOptions(diningOptions: DiningOption[]): DiningOption[] {
    return diningOptions.filter(option => option.isActive !== false)
  }

  /**
   * Group dining options by date
   */
  groupDiningOptionsByDate(diningOptions: DiningOption[]): Record<string, DiningOption[]> {
    return diningOptions.reduce((groups, option) => {
      const date = option.date || 'Unknown'
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(option)
      return groups
    }, {} as Record<string, DiningOption[]>)
  }
}
