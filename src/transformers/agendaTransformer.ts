/**
 * Agenda Data Transformer
 * Story 1.7: Data Transformation Layer for Schema Evolution
 */

import { BaseTransformer } from './baseTransformer'
import { FieldMapping, ComputedField, ValidationRule } from '../types/transformation'
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
      { source: 'speaker', target: 'speaker_name', type: 'string', defaultValue: '' },
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
          const speaker = data.speaker
          
          // Handle different data types
          if (speaker === null || speaker === undefined) {
            return ''
          }
          
          // Handle empty object {}
          if (typeof speaker === 'object' && Object.keys(speaker).length === 0) {
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
   * Transform agenda data with schema evolution support
   */
  transformFromDatabase(dbData: any): AgendaItem {
    const evolvedData = this.handleSchemaEvolution(dbData)
    return super.transformFromDatabase(evolvedData)
  }

  /**
   * Handle database schema evolution for agenda items
   */
  private handleSchemaEvolution(dbData: any): any {
    const evolved = { ...dbData }

    // Handle field rename from type to session_type
    if (evolved.type && !evolved.session_type) {
      evolved.session_type = evolved.type
    }

    // Handle type changes for boolean fields
    if (typeof evolved.is_active === 'string') {
      evolved.is_active = evolved.is_active === 'true' || evolved.is_active === '1'
    }

    if (typeof evolved.has_seating === 'string') {
      evolved.has_seating = evolved.has_seating === 'true' || evolved.has_seating === '1'
    }

    return evolved
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
