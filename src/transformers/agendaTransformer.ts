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
      { source: 'session_type', target: 'session_type', type: 'string', defaultValue: 'general' },
      { source: 'speaker_name', target: 'speaker_name', type: 'string', defaultValue: '' },
      { source: 'speaker_title', target: 'speaker_title', type: 'string', defaultValue: '' },
      { source: 'is_breakout', target: 'isBreakout', type: 'boolean', defaultValue: false },
      { source: 'max_attendees', target: 'maxAttendees', type: 'number', defaultValue: null },
      { source: 'is_active', target: 'isActive', type: 'boolean', defaultValue: true },
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
        sourceFields: ['speaker_name', 'speaker_title'],
        computation: (data: any) => {
          const name = data.speaker_name || ''
          const title = data.speaker_title || ''
          if (!name) return ''
          return title ? `${name}, ${title}` : name
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
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
          return timeRegex.test(value)
        },
        message: 'Invalid start time format (HH:MM)'
      },
      {
        field: 'end_time',
        rule: (value: any) => {
          if (!value) return false
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
          return timeRegex.test(value)
        },
        message: 'Invalid end time format (HH:MM)'
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

    // Example: Handle field rename from type to session_type
    if (evolved.type && !evolved.session_type) {
      evolved.session_type = evolved.type
    }

    // Example: Handle field rename from breakout to is_breakout
    if (evolved.breakout !== undefined && evolved.is_breakout === undefined) {
      evolved.is_breakout = evolved.breakout
    }

    // Example: Handle field rename from max_capacity to max_attendees
    if (evolved.max_capacity !== undefined && evolved.max_attendees === undefined) {
      evolved.max_attendees = evolved.max_capacity
    }

    // Example: Handle field addition (new fields are ignored by UI)
    // Database might add internal_notes, speaker_bio, etc.

    // Example: Handle type changes
    if (typeof evolved.is_breakout === 'string') {
      evolved.is_breakout = evolved.is_breakout === 'true' || evolved.is_breakout === '1'
    }

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
      'type': 'session_type',           // Database field -> UI field
      'breakout': 'isBreakout',
      'active': 'isActive',
      'max_capacity': 'maxAttendees'
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
