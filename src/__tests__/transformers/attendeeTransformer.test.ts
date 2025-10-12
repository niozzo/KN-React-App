/**
 * Attendee Transformer Tests
 * Story 1.7: Data Transformation Layer for Schema Evolution
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AttendeeTransformer } from '../../transformers/attendeeTransformer'
import type { Attendee } from '../../types/attendee'

describe('AttendeeTransformer', () => {
  let transformer: AttendeeTransformer

  beforeEach(() => {
    transformer = new AttendeeTransformer()
  })

  describe('transformFromDatabase', () => {
    it('should transform basic attendee data correctly', () => {
      const dbData = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        email_address: 'john.doe@example.com',
        phone_number: '555-1234',
        company_name: 'Acme Corp',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result).toEqual({
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-1234',
        company: 'Acme Corp',
        isActive: true,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: undefined,
        selected_breakouts: [],
        hotel_selection: null,
        dining_selections: [],
        fullName: 'John Doe',
        displayName: 'John Doe (Acme Corp)',
        attributes: {}
      })
    })

    it('should handle schema evolution - field rename', () => {
      const dbData = {
        id: '123',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com', // Database renamed email_address to email
        phone_number: '555-5678',
        company_name: 'Tech Inc',
        is_active: true
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result.email).toBe('jane.smith@example.com')
      expect(result.fullName).toBe('Jane Smith')
    })

    it('should handle missing optional fields with defaults', () => {
      const dbData = {
        id: '123',
        first_name: 'Bob',
        last_name: 'Johnson',
        email_address: 'bob@example.com'
        // phone_number and company_name missing
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result.phone).toBeNull()
      expect(result.company).toBe('')
      expect(result.isActive).toBe(true)
    })

    it('should handle type conversion for boolean fields', () => {
      const dbData = {
        id: '123',
        first_name: 'Alice',
        last_name: 'Brown',
        email_address: 'alice@example.com',
        is_active: 'true' // String instead of boolean
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result.isActive).toBe(true)
    })

    it('should compute fullName correctly', () => {
      const dbData = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        email_address: 'john@example.com'
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result.fullName).toBe('John Doe')
    })

    it('should compute displayName with company', () => {
      const dbData = {
        id: '123',
        first_name: 'Jane',
        last_name: 'Smith',
        email_address: 'jane@example.com',
        company_name: 'Tech Corp'
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result.displayName).toBe('Jane Smith (Tech Corp)')
    })

    it('should compute displayName without company', () => {
      const dbData = {
        id: '123',
        first_name: 'Bob',
        last_name: 'Johnson',
        email_address: 'bob@example.com'
        // No company
      }

      const result = transformer.transformFromDatabase(dbData)

      expect(result.displayName).toBe('Bob Johnson')
    })
  })

  describe('transformToDatabase', () => {
    it('should transform UI data back to database format', () => {
      const uiData: Attendee = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-1234',
        company: 'Acme Corp',
        isActive: true,
        created_at: new Date('2024-01-01T00:00:00Z'),
        fullName: 'John Doe',
        displayName: 'John Doe (Acme Corp)'
      }

      const result = transformer.transformToDatabase(uiData)

      expect(result).toEqual({
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        email_address: 'john.doe@example.com',
        phone_number: '555-1234',
        company_name: 'Acme Corp',
        is_active: true,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: undefined,
        selected_breakouts: [],
        hotel_selection: null,
        dining_selections: [],
        attributes: {}
      })
    })
  })

  describe('validateAttendee', () => {
    it('should validate correct attendee data', () => {
      const attendee: Attendee = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-1234',
        company: 'Acme Corp',
        isActive: true
      }

      const result = transformer.validateAttendee(attendee)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing required fields', () => {
      const attendee: Partial<Attendee> = {
        id: '123',
        // Missing first_name, last_name, email
        phone: '555-1234'
      }

      const result = transformer.validateAttendee(attendee as Attendee)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('First name is required')
      expect(result.errors).toContain('Last name is required')
      expect(result.errors).toContain('Email is required')
    })

    it('should detect invalid phone number', () => {
      const attendee: Attendee = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        business_phone: 'invalid-phone',
        company: 'Acme Corp',
        isActive: true
      }

      const result = transformer.validateAttendee(attendee)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid business phone number format')
    })
  })

  describe('getSchemaEvolutionMapping', () => {
    it('should return correct field mappings', () => {
      const mapping = transformer.getSchemaEvolutionMapping()

      expect(mapping).toEqual({
        'email_address': 'email',
        'phone_number': 'phone',
        'company_name': 'company',
        'is_active': 'isActive'
      })
    })
  })

  describe('transformArrayFromDatabase', () => {
    it('should transform array of attendee data', () => {
      const dbDataArray = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          email_address: 'john@example.com'
        },
        {
          id: '2',
          first_name: 'Jane',
          last_name: 'Smith',
          email_address: 'jane@example.com'
        }
      ]

      const result = transformer.transformArrayFromDatabase(dbDataArray)

      expect(result).toHaveLength(2)
      expect(result[0].fullName).toBe('John Doe')
      expect(result[1].fullName).toBe('Jane Smith')
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

  describe('filterActiveAttendees', () => {
    it('should filter out inactive attendees', () => {
      const attendees = [
        { id: '1', firstName: 'John', lastName: 'Doe', isActive: true } as any,
        { id: '2', firstName: 'Jane', lastName: 'Smith', isActive: false } as any,
        { id: '3', firstName: 'Bob', lastName: 'Johnson', isActive: true } as any
      ]

      const filtered = transformer.filterActiveAttendees(attendees)
      
      expect(filtered).toHaveLength(2)
      expect(filtered[0].id).toBe('1')
      expect(filtered[1].id).toBe('3')
    })

    it('should treat undefined isActive as active', () => {
      const attendees = [
        { id: '1', firstName: 'John', lastName: 'Doe' } as any
      ]

      const filtered = transformer.filterActiveAttendees(attendees)
      
      expect(filtered).toHaveLength(1)
    })

    it('should return empty array for empty input', () => {
      const filtered = transformer.filterActiveAttendees([])
      expect(filtered).toHaveLength(0)
    })

    it('should return all attendees when all are active', () => {
      const attendees = [
        { id: '1', firstName: 'John', lastName: 'Doe', isActive: true } as any,
        { id: '2', firstName: 'Jane', lastName: 'Smith', isActive: true } as any
      ]

      const filtered = transformer.filterActiveAttendees(attendees)
      
      expect(filtered).toHaveLength(2)
    })
  })
})
