/**
 * Dining Data Transformer
 * Story 1.7: Data Transformation Layer for Schema Evolution
 */

import { BaseTransformer, SchemaVersion } from './baseTransformer'
import { FieldMapping, ComputedField, ValidationRule } from '../types/transformation'
import type { DiningOption } from '../types/dining'

export class DiningTransformer extends BaseTransformer<DiningOption> {
  constructor() {
    const fieldMappings: FieldMapping[] = [
      { source: 'id', target: 'id', type: 'string', required: true },
      { source: 'name', target: 'name', type: 'string', required: true },
      { source: 'description', target: 'description', type: 'string', defaultValue: '' },
      { source: 'type', target: 'type', type: 'string', defaultValue: 'lunch' },
      { source: 'capacity', target: 'capacity', type: 'number', defaultValue: null },
      { source: 'price', target: 'price', type: 'number', defaultValue: 0 },
      { source: 'dietary', target: 'dietary', type: 'array', defaultValue: [] },
      { source: 'tables', target: 'tables', type: 'array', defaultValue: [] },
      { source: 'is_active', target: 'is_active', type: 'boolean', defaultValue: true },
      { source: 'display_order', target: 'display_order', type: 'number', defaultValue: 0 },
      { source: 'created_at', target: 'created_at', type: 'date' },
      { source: 'date', target: 'date', type: 'string' },
      { source: 'time', target: 'time', type: 'string' }
    ]

    const computedFields: ComputedField[] = [
      {
        name: 'displayName',
        sourceFields: ['name', 'type'],
        computation: (data: any) => {
          const name = data.name || ''
          const type = data.type || ''
          return `${name} (${type})`
        },
        type: 'string'
      },
      {
        name: 'hasCapacity',
        sourceFields: ['capacity'],
        computation: (data: any) => {
          return data.capacity !== null && data.capacity > 0
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
        sourceFields: ['dietary'],
        computation: (data: any) => {
          const options = data.dietary || []
          return Array.isArray(options) ? options.join(', ') : ''
        },
        type: 'string'
      }
    ]

    const validationRules: ValidationRule[] = [
      {
        field: 'type',
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
      },
      {
        field: 'capacity',
        rule: (value: any) => {
          if (value === null || value === undefined) return true
          return typeof value === 'number' && value >= 0
        },
        message: 'Capacity must be a non-negative number'
      }
    ]

    super(fieldMappings, 'dining_options', 'DiningOption', '1.0.0', computedFields, validationRules)
  }

  /**
   * Transform dining data with schema evolution support
   */
  transformFromDatabase(dbData: any): DiningOption {
    // Normalize date format before transformation
    if (dbData.date) {
      dbData.date = this.normalizeDateFormat(dbData.date);
    }
    
    // Normalize time format
    if (dbData.time) {
      dbData.time = this.normalizeTimeFormat(dbData.time);
    }
    
    // Schema evolution is now handled in the base class
    return super.transformFromDatabase(dbData)
  }

  /**
   * Override version detection for dining-specific schema evolution
   */
  protected inferVersion(data: any): string {
    // Detect schema version based on field presence and data types
    if (data.meal_type && !data.type) {
      return '2.0.0' // New schema with meal_type
    }
    
    if (data.max_capacity && !data.capacity) {
      return '1.5.0' // Schema with max_capacity
    }
    
    if (data.dietary_options && !data.dietary) {
      return '1.3.0' // Schema with dietary_options
    }
    
    if (data.price && typeof data.price === 'string') {
      return '1.2.0' // Schema with string price
    }
    
    if (data.is_active && typeof data.is_active === 'string') {
      return '1.1.0' // Schema with string boolean fields
    }
    
    return '1.0.0' // Legacy schema
  }

  /**
   * Handle database schema evolution for dining options with version-aware processing
   */
  protected handleSchemaEvolution(dbData: any, schemaVersion: SchemaVersion): any {
    const evolved = { ...dbData }
    
    
    switch (schemaVersion.version) {
      case '1.0.0':
        // Legacy schema - no changes needed
        break
        
      case '1.1.0':
        // Handle string boolean fields
        if (typeof evolved.is_active === 'string') {
          evolved.is_active = evolved.is_active === 'true' || evolved.is_active === '1'
        }
        break
        
      case '1.2.0':
        // Handle string price field
        if (typeof evolved.price === 'string') {
          const price = parseFloat(evolved.price)
          evolved.price = isNaN(price) ? 0 : price
        }
        break
        
      case '1.3.0':
        // Handle dietary_options field
        if (evolved.dietary_options && !evolved.dietary) {
          evolved.dietary = evolved.dietary_options
        }
        break
        
      case '1.5.0':
        // Handle max_capacity field
        if (evolved.max_capacity && !evolved.capacity) {
          evolved.capacity = evolved.max_capacity
        }
        break
        
      case '2.0.0':
        // Handle meal_type field
        if (evolved.meal_type && !evolved.type) {
          evolved.type = evolved.meal_type
        }
        break
        
      default:
        console.warn(`⚠️ Unknown dining schema version: ${schemaVersion.version}`)
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
    if (evolved.capacity === null || evolved.capacity === undefined) {
      evolved.capacity = null
    }
    
    if (evolved.price === null || evolved.price === undefined) {
      evolved.price = 0
    }
    
    // Handle empty objects
    if (evolved.tables && typeof evolved.tables === 'object' && Object.keys(evolved.tables).length === 0) {
      evolved.tables = []
    }
    
    // Handle type conversions
    if (typeof evolved.capacity === 'string') {
      const capacity = parseInt(evolved.capacity)
      evolved.capacity = isNaN(capacity) ? null : capacity
    }
    
    if (typeof evolved.price === 'string') {
      const price = parseFloat(evolved.price)
      evolved.price = isNaN(price) ? 0 : price
    }
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

    if (diningOption.capacity !== undefined && diningOption.capacity < 0) {
      errors.push('Capacity cannot be negative')
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
    return diningOptions.filter(option => option.is_active !== false)
  }

  /**
   * Normalize date format to improve confidence score
   */
  private normalizeDateFormat(dateValue: any): string {
    if (!dateValue) return '';
    
    // Handle string dates
    if (typeof dateValue === 'string') {
      // Try parsing with Date constructor
      let parsedDate = new Date(dateValue);
      
      // If invalid, try alternative format (replace dashes with slashes)
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date(dateValue.replace(/-/g, '/'));
      }
      
      // If still invalid, return original
      if (isNaN(parsedDate.getTime())) {
        console.warn('⚠️ Invalid date format:', dateValue);
        return dateValue;
      }
      
      // Return ISO date format (YYYY-MM-DD)
      return parsedDate.toISOString().split('T')[0];
    }
    
    // Handle Date objects
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }
    
    return String(dateValue);
  }

  /**
   * Normalize time format to HH:MM
   */
  private normalizeTimeFormat(timeValue: any): string {
    if (!timeValue) return '';
    
    // Ensure time is in HH:MM format
    const timeStr = String(timeValue);
    const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
    const match = timeStr.match(timeRegex);
    
    if (match) {
      const hours = match[1].padStart(2, '0');
      const minutes = match[2];
      return `${hours}:${minutes}`;
    }
    
    return timeStr;
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
