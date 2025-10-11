/**
 * Agenda Data Transformer
 * Story 1.7: Data Transformation Layer for Schema Evolution
 */

import { BaseTransformer, SchemaVersion } from './baseTransformer.ts'
import { FieldMapping, ComputedField, ValidationRule } from '../types/transformation.ts'
import type { AgendaItem } from '../types/agenda'

export class AgendaTransformer extends BaseTransformer<AgendaItem> {
  constructor() {
    const fieldMappings: FieldMapping[] = [
      { source: 'id', target: 'id', type: 'string', required: true },
      { source: 'title', target: 'title', type: 'string', required: true },
      { source: 'description', target: 'description', type: 'string', defaultValue: '' },
      { source: 'date', target: 'date', type: 'string', required: true },
      { source: 'start_time', target: 'start_time', type: 'string', required: true },
      { source: 'end_time', target: 'end_time', type: 'string', required: true },
      { source: 'location', target: 'location', type: 'string', defaultValue: '' },
      { source: 'type', target: 'session_type', type: 'string', defaultValue: 'general' },
      { source: 'speaker', target: 'speaker', type: 'any', defaultValue: null },
      { source: 'capacity', target: 'capacity', type: 'number', defaultValue: null },
      { source: 'registered_count', target: 'registered_count', type: 'number', defaultValue: 0 },
      { source: 'attendee_selection', target: 'attendee_selection', type: 'string', defaultValue: 'everyone' },
      { source: 'selected_attendees', target: 'selected_attendees', type: 'array', defaultValue: [] },
      { source: 'is_active', target: 'isActive', type: 'boolean', defaultValue: true },
      { source: 'has_seating', target: 'has_seating', type: 'boolean', defaultValue: false },
      { source: 'seating_notes', target: 'seating_notes', type: 'string', defaultValue: '' },
      { source: 'seating_type', target: 'seating_type', type: 'string', defaultValue: 'open' },
      { source: 'created_at', target: 'created_at', type: 'date' },
      { source: 'updated_at', target: 'updated_at', type: 'date' }
    ]

    const computedFields: ComputedField[] = [
      {
        name: 'duration',
        sourceFields: ['start_time', 'end_time'],
        computation: (data: any) => {
          const start = data.start_time
          const end = data.end_time
          if (!start || !end) return null
          
          try {
            const startTime = new Date(`2000-01-01T${start}`)
            const endTime = new Date(`2000-01-01T${end}`)
            const diffMs = endTime.getTime() - startTime.getTime()
            const diffMinutes = Math.round(diffMs / (1000 * 60))
            return diffMinutes
          } catch (error) {
            return null
          }
        },
        type: 'number'
      },
      {
        name: 'timeRange',
        sourceFields: ['start_time', 'end_time'],
        computation: (data: any) => {
          const start = data.start_time
          const end = data.end_time
          if (!start || !end) return ''
          return `${start} - ${end}`
        },
        type: 'string'
      },
      {
        name: 'speakerInfo',
        sourceFields: ['speaker'],
        computation: (data: any) => {
          // Check the speaker field
          const speaker = data.speaker

          // Handle different data types
          if (speaker === null || speaker === undefined) {
            return ''
          }

          // Handle empty object {} - this is the main cause of React Error #31
          if (typeof speaker === 'object' && speaker !== null && Object.keys(speaker).length === 0) {
            return ''
          }

          // Handle string values
          if (typeof speaker === 'string' && speaker.trim()) {
            return speaker.trim()
          }

          // Handle object with name property (in case it's structured data)
          if (typeof speaker === 'object' && speaker.name) {
            return speaker.name
          }

          // Handle object with value property (new structure)
          if (typeof speaker === 'object' && speaker.value) {
            return speaker.value
          }

          // Handle unexpected speaker data types silently
          if (speaker !== null && speaker !== undefined) {
            // Silent handling of unexpected data types
          }

          return ''
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
        field: 'speaker',
        rule: (value: any) => {
          // Allow null, undefined, empty string, or valid string
          if (value === null || value === undefined || value === '') {
            return true
          }
          // Allow valid string
          if (typeof value === 'string' && value.trim()) {
            return true
          }
          // Allow valid object with name or value property
          if (typeof value === 'object' && value !== null && 
              (value.name || value.value || Object.keys(value).length === 0)) {
            return true
          }
          return false
        },
        message: 'Invalid speaker field - must be string, valid object, or empty'
      },
      {
        field: 'start_time',
        rule: (value: any) => {
          if (!value) return false
          // Accept both HH:MM and HH:MM:SS formats
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/
          return timeRegex.test(value)
        },
        message: 'Invalid start time format (HH:MM or HH:MM:SS)'
      },
      {
        field: 'end_time',
        rule: (value: any) => {
          if (!value) return false
          // Accept both HH:MM and HH:MM:SS formats
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/
          return timeRegex.test(value)
        },
        message: 'Invalid end time format (HH:MM or HH:MM:SS)'
      }
    ]

    super(fieldMappings, 'agenda_items', 'AgendaItem', '1.0.0', computedFields, validationRules)
  }

  /**
   * Override version detection for agenda-specific schema evolution
   */
  protected inferVersion(data: any): string {
    // Detect schema version based on speaker field characteristics
    if (data.speaker_name && !data.speaker) {
      return '2.0.0' // New schema with renamed speaker field
    }
    
    if (data.speaker && typeof data.speaker === 'object' && data.speaker !== null) {
      return '1.5.0' // Schema with object-based speaker field
    }
    
    if (data.speaker && typeof data.speaker === 'string') {
      return '1.2.0' // Schema with string speaker field
    }
    
    if (data.speaker === null || data.speaker === undefined) {
      return '1.1.0' // Schema with null speaker field
    }
    
    return '1.0.0' // Legacy schema
  }

  /**
   * Handle schema evolution for agenda items
   */
  protected handleSchemaEvolution(dbData: any, schemaVersion: SchemaVersion): any {
    const evolved = { ...dbData }
    
    
    switch (schemaVersion.version) {
      case '1.0.0':
        // Legacy schema - no changes needed
        break
        
      case '1.1.0':
        // Handle null speaker field - already handled by computed field
        break
        
      case '1.2.0':
        // Handle string speaker field - already handled by computed field
        break
        
      case '1.5.0':
        // Handle object-based speaker field
        if (evolved.speaker && typeof evolved.speaker === 'object' && evolved.speaker !== null) {
          // Extract speaker name from object if it has a name property
          if (evolved.speaker.name) {
            evolved.speaker = evolved.speaker.name
          }
          // Leave empty objects as-is for computed field to handle
        }
        break
        
      case '2.0.0':
        // Handle renamed speaker field
        if (evolved.speaker_name && !evolved.speaker) {
          // Handle both string and object formats
          if (typeof evolved.speaker_name === 'string') {
            evolved.speaker = evolved.speaker_name
          } else if (typeof evolved.speaker_name === 'object' && evolved.speaker_name.value) {
            evolved.speaker = evolved.speaker_name.value
          }
        }
        break
        
      default:
        console.warn(`⚠️ Unknown agenda schema version: ${schemaVersion.version}`)
    }
    
    return evolved
  }

  /**
   * Transform agenda data with schema evolution support
   */
  transformFromDatabase(dbData: any): AgendaItem {
    // Schema evolution is now handled in the base class
    return super.transformFromDatabase(dbData)
  }

  /**
   * Transform agenda data with time override support
   */
  async transformFromDatabaseWithTimeOverrides(dbData: any, timeOverrides?: Map<string, any>): Promise<AgendaItem> {
    // First apply standard transformation
    const transformedItem = this.transformFromDatabase(dbData)
    
    // Check if time overrides exist for this item
    if (timeOverrides && timeOverrides.has(transformedItem.id)) {
      const override = timeOverrides.get(transformedItem.id)
      if (override.time_override_enabled) {
        // Apply time overrides while preserving original times as fallback
        transformedItem.start_time = override.start_time || transformedItem.start_time
        transformedItem.end_time = override.end_time || transformedItem.end_time
        
        // Recalculate computed fields with override times
        transformedItem.duration = this.calculateDuration(transformedItem.start_time, transformedItem.end_time)
        transformedItem.timeRange = `${transformedItem.start_time} - ${transformedItem.end_time}`
      }
    }
    
    return transformedItem
  }

  /**
   * Transform array of agenda items with time overrides
   */
  async transformArrayFromDatabaseWithTimeOverrides(dbDataArray: any[], timeOverrides?: Map<string, any>): Promise<AgendaItem[]> {
    const transformedItems = []
    
    for (const dbData of dbDataArray) {
      const transformedItem = await this.transformFromDatabaseWithTimeOverrides(dbData, timeOverrides)
      transformedItems.push(transformedItem)
    }
    
    return transformedItems
  }

  /**
   * Helper method to calculate duration
   */
  private calculateDuration(startTime: string, endTime: string): number | null {
    if (!startTime || !endTime) return null
    
    try {
      const start = new Date(`2000-01-01T${startTime}`)
      const end = new Date(`2000-01-01T${endTime}`)
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return null
      }
      
      const diffMs = end.getTime() - start.getTime()
      const diffMinutes = Math.round(diffMs / (1000 * 60))
      
      // Return null for invalid results
      return isNaN(diffMinutes) ? null : diffMinutes
    } catch (error) {
      return null
    }
  }

  /**
   * Get field mapping for schema evolution documentation
   */
  getSchemaEvolutionMapping(): Record<string, string> {
    return {
      'type': 'session_type',           // Database field -> UI field
      'is_active': 'isActive',
      'has_seating': 'has_seating'
    }
  }

  /**
   * Validate agenda item-specific business rules
   */
  validateAgendaItem(agendaItem: AgendaItem): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!agendaItem.title?.trim()) {
      errors.push('Title is required')
    }

    if (!agendaItem.date?.trim()) {
      errors.push('Date is required')
    }

    if (!agendaItem.start_time?.trim()) {
      errors.push('Start time is required')
    }

    if (!agendaItem.end_time?.trim()) {
      errors.push('End time is required')
    }

    // Validate time logic
    if (agendaItem.start_time && agendaItem.end_time) {
      try {
        const startTime = new Date(`2000-01-01T${agendaItem.start_time}`)
        const endTime = new Date(`2000-01-01T${agendaItem.end_time}`)
        
        if (startTime >= endTime) {
          errors.push('End time must be after start time')
        }
      } catch (error) {
        errors.push('Invalid time format')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Sort agenda items by date and time
   */
  sortAgendaItems(agendaItems: AgendaItem[]): AgendaItem[] {
    return [...agendaItems].sort((a, b) => {
      // First sort by date
      const dateComparison = (a.date || '').localeCompare(b.date || '')
      if (dateComparison !== 0) return dateComparison
      
      // Then sort by start time
      return (a.start_time || '').localeCompare(b.start_time || '')
    })
  }
}
