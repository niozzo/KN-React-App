/**
 * Agenda Transformer Tests
 * Story 1.7: Data Transformation Layer for Schema Evolution
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AgendaTransformer } from '../../transformers/agendaTransformer'
import type { AgendaItem } from '../../types/agenda'

describe('AgendaTransformer', () => {
  let transformer: AgendaTransformer

  beforeEach(() => {
    transformer = new AgendaTransformer()
  })

  describe('transformFromDatabase', () => {
    it('should transform basic agenda item data correctly', () => {
      const dbData = {
        id: '123',
        title: 'Welcome Session',
        description: 'Opening remarks and introductions',
        date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        location: 'Main Hall',
        type: 'keynote',
        speaker: 'John Doe',
        capacity: 100,
        registered_count: 0,
        attendee_selection: 'everyone',
        selected_attendees: [],
        is_active: true,
        has_seating: false,
        seating_notes: '',
        seating_type: 'open',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result).toEqual({
        id: '123',
        title: 'Welcome Session',
        description: 'Opening remarks and introductions',
        date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        location: 'Main Hall',
        session_type: 'keynote',
        speaker: 'John Doe',
        capacity: 100,
        registered_count: 0,
        attendee_selection: 'everyone',
        selected_attendees: [],
        isActive: true,
        has_seating: false,
        seating_notes: '',
        seating_type: 'open',
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        duration: 60,
        timeRange: '09:00 - 10:00',
        speakerInfo: 'John Doe'
      })
    })

    it('should handle schema evolution - field rename', () => {
      const dbData = {
        id: '123',
        title: 'Breakout Session',
        date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        type: 'workshop', // Database field name
        is_active: 'true', // String boolean conversion
        has_seating: '1'   // String boolean conversion
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result.session_type).toBe('workshop')
      expect(result.isActive).toBe(true)
      expect(result.has_seating).toBe(true)
    })

    it('should compute duration correctly', () => {
      const dbData = {
        id: '123',
        title: 'Test Session',
        date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:30'
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result.duration).toBe(90) // 1.5 hours = 90 minutes
    })

    it('should compute timeRange correctly', () => {
      const dbData = {
        id: '123',
        title: 'Test Session',
        date: '2024-01-15',
        start_time: '14:00',
        end_time: '15:00'
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result.timeRange).toBe('14:00 - 15:00')
    })

    it('should compute speakerInfo with speaker name', () => {
      const dbData = {
        id: '123',
        title: 'Test Session',
        date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        speaker: 'Jane Smith'
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result.speakerInfo).toBe('Jane Smith')
    })

    it('should compute speakerInfo without speaker name', () => {
      const dbData = {
        id: '123',
        title: 'Test Session',
        date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00'
        // No speaker
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result.speakerInfo).toBe('')
    })

    it('should handle type conversion for boolean fields', () => {
      const dbData = {
        id: '123',
        title: 'Test Session',
        date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        is_active: 'true', // String instead of boolean
        has_seating: '1'   // String '1' instead of boolean
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result.isActive).toBe(true)
      expect(result.has_seating).toBe(true)
    })
  })

  describe('validateAgendaItem', () => {
    it('should validate correct agenda item data', () => {
      const agendaItem: AgendaItem = {
        id: '123',
        title: 'Test Session',
        date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        session_type: 'workshop',
        isActive: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        description: '',
        location: '',
        speaker_name: null,
        capacity: 0,
        registered_count: 0,
        attendee_selection: 'everyone',
        selected_attendees: [],
        has_seating: false,
        seating_notes: '',
        seating_type: 'open'
      }

      const result = transformer.validateAgendaItem(agendaItem)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing required fields', () => {
      const agendaItem: Partial<AgendaItem> = {
        id: '123'
        // Missing title, date, start_time, end_time
      }

      const result = transformer.validateAgendaItem(agendaItem as AgendaItem)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Title is required')
      expect(result.errors).toContain('Date is required')
      expect(result.errors).toContain('Start time is required')
      expect(result.errors).toContain('End time is required')
    })

    it('should detect invalid time logic', () => {
      const agendaItem: AgendaItem = {
        id: '123',
        title: 'Test Session',
        date: '2024-01-15',
        start_time: '10:00',
        end_time: '09:00', // End time before start time
        session_type: 'workshop',
        isActive: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        description: '',
        location: '',
        speaker_name: null,
        capacity: 0,
        registered_count: 0,
        attendee_selection: 'everyone',
        selected_attendees: [],
        has_seating: false,
        seating_notes: '',
        seating_type: 'open'
      }

      const result = transformer.validateAgendaItem(agendaItem)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('End time must be after start time')
    })
  })

  describe('sortAgendaItems', () => {
    it('should sort agenda items by date and time', () => {
      const agendaItems: AgendaItem[] = [
        {
          id: '2',
          title: 'Afternoon Session',
          date: '2024-01-15',
          start_time: '14:00',
          end_time: '15:00',
          session_type: 'workshop',
          isActive: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          description: '',
          location: '',
          speaker_name: null,
          capacity: 0,
          registered_count: 0,
          attendee_selection: 'everyone',
          selected_attendees: [],
          has_seating: false,
          seating_notes: '',
          seating_type: 'open'
        },
        {
          id: '1',
          title: 'Morning Session',
          date: '2024-01-15',
          start_time: '09:00',
          end_time: '10:00',
          session_type: 'keynote',
          isActive: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          description: '',
          location: '',
          speaker_name: null,
          capacity: 0,
          registered_count: 0,
          attendee_selection: 'everyone',
          selected_attendees: [],
          has_seating: false,
          seating_notes: '',
          seating_type: 'open'
        },
        {
          id: '3',
          title: 'Next Day Session',
          date: '2024-01-16',
          start_time: '09:00',
          end_time: '10:00',
          session_type: 'workshop',
          isActive: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          description: '',
          location: '',
          speaker_name: null,
          capacity: 0,
          registered_count: 0,
          attendee_selection: 'everyone',
          selected_attendees: [],
          has_seating: false,
          seating_notes: '',
          seating_type: 'open'
        }
      ]

      const result = transformer.sortAgendaItems(agendaItems)

      expect(result[0].id).toBe('1') // Morning session first
      expect(result[1].id).toBe('2') // Afternoon session second
      expect(result[2].id).toBe('3') // Next day session last
    })
  })

  describe('getSchemaEvolutionMapping', () => {
    it('should return correct field mappings', () => {
      const mapping = transformer.getSchemaEvolutionMapping()

      expect(mapping).toEqual({
        'type': 'session_type',
        'is_active': 'isActive',
        'has_seating': 'has_seating'
      })
    })
  })

  describe('transformArrayFromDatabase', () => {
    it('should transform array of agenda item data', () => {
      const dbDataArray = [
        {
          id: '1',
          title: 'Session 1',
          date: '2024-01-15',
          start_time: '09:00',
          end_time: '10:00'
        },
        {
          id: '2',
          title: 'Session 2',
          date: '2024-01-15',
          start_time: '10:00',
          end_time: '11:00'
        }
      ]

      const result = transformer.transformArrayFromDatabase(dbDataArray)

      expect(result).toHaveLength(2)
      expect(result[0].duration).toBe(60)
      expect(result[1].duration).toBe(60)
    })
  })

  describe('error handling', () => {
    it('should handle null database data', () => {
      expect(() => {
        transformer.transformFromDatabase(null)
      }).toThrow()
    })

    it('should handle undefined database data', () => {
      expect(() => {
        transformer.transformFromDatabase(undefined)
      }).toThrow()
    })
  })

  describe('filterActiveAgendaItems', () => {
    it('should filter out inactive items', () => {
      const items: AgendaItem[] = [
        { id: '1', isActive: true, title: 'Active Session', description: '', date: '2024-01-15', start_time: '09:00', end_time: '10:00', location: '', type: 'session' } as AgendaItem,
        { id: '2', isActive: false, title: 'Inactive Session', description: '', date: '2024-01-15', start_time: '10:00', end_time: '11:00', location: '', type: 'session' } as AgendaItem,
        { id: '3', isActive: true, title: 'Another Active', description: '', date: '2024-01-15', start_time: '11:00', end_time: '12:00', location: '', type: 'session' } as AgendaItem
      ]

      const filtered = transformer.filterActiveAgendaItems(items)
      
      expect(filtered).toHaveLength(2)
      expect(filtered[0].id).toBe('1')
      expect(filtered[1].id).toBe('3')
    })

    it('should treat undefined isActive as active', () => {
      const items: AgendaItem[] = [
        { id: '1', title: 'No Active Field', description: '', date: '2024-01-15', start_time: '09:00', end_time: '10:00', location: '', type: 'session' } as AgendaItem
      ]

      const filtered = transformer.filterActiveAgendaItems(items)
      
      expect(filtered).toHaveLength(1)
    })

    it('should return empty array for empty input', () => {
      const filtered = transformer.filterActiveAgendaItems([])
      expect(filtered).toHaveLength(0)
    })

    it('should return all items when all are active', () => {
      const items: AgendaItem[] = [
        { id: '1', isActive: true, title: 'Active 1', description: '', date: '2024-01-15', start_time: '09:00', end_time: '10:00', location: '', type: 'session' } as AgendaItem,
        { id: '2', isActive: true, title: 'Active 2', description: '', date: '2024-01-15', start_time: '10:00', end_time: '11:00', location: '', type: 'session' } as AgendaItem
      ]

      const filtered = transformer.filterActiveAgendaItems(items)
      
      expect(filtered).toHaveLength(2)
    })
  })
})
