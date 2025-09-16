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
        session_type: 'keynote',
        speaker_name: 'John Doe',
        speaker_title: 'CEO',
        is_breakout: false,
        max_attendees: 100,
        is_active: true
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
        speaker_name: 'John Doe',
        speaker_title: 'CEO',
        isBreakout: false,
        maxAttendees: 100,
        isActive: true,
        duration: 60,
        timeRange: '09:00 - 10:00',
        speakerInfo: 'John Doe, CEO'
      })
    })

    it('should handle schema evolution - field rename', () => {
      const dbData = {
        id: '123',
        title: 'Breakout Session',
        date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        type: 'workshop', // Database renamed session_type to type
        breakout: true,   // Database renamed is_breakout to breakout
        active: true,     // Database renamed is_active to active
        max_capacity: 50  // Database renamed max_attendees to max_capacity
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result.session_type).toBe('workshop')
      expect(result.isBreakout).toBe(true)
      expect(result.isActive).toBe(true)
      expect(result.maxAttendees).toBe(50)
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

    it('should compute speakerInfo with title', () => {
      const dbData = {
        id: '123',
        title: 'Test Session',
        date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        speaker_name: 'Jane Smith',
        speaker_title: 'CTO'
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result.speakerInfo).toBe('Jane Smith, CTO')
    })

    it('should compute speakerInfo without title', () => {
      const dbData = {
        id: '123',
        title: 'Test Session',
        date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        speaker_name: 'Bob Johnson'
        // No speaker_title
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result.speakerInfo).toBe('Bob Johnson')
    })

    it('should handle type conversion for boolean fields', () => {
      const dbData = {
        id: '123',
        title: 'Test Session',
        date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        is_breakout: 'true', // String instead of boolean
        is_active: '1'       // String '1' instead of boolean
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result.isBreakout).toBe(true)
      expect(result.isActive).toBe(true)
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
        isBreakout: false,
        isActive: true
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
        isBreakout: false,
        isActive: true
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
          isBreakout: false,
          isActive: true
        },
        {
          id: '1',
          title: 'Morning Session',
          date: '2024-01-15',
          start_time: '09:00',
          end_time: '10:00',
          session_type: 'keynote',
          isBreakout: false,
          isActive: true
        },
        {
          id: '3',
          title: 'Next Day Session',
          date: '2024-01-16',
          start_time: '09:00',
          end_time: '10:00',
          session_type: 'workshop',
          isBreakout: false,
          isActive: true
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
        'breakout': 'isBreakout',
        'active': 'isActive',
        'max_capacity': 'maxAttendees'
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
})
