/**
 * Schema Evolution Tests
 * Tests for the enhanced data transformation layer with schema version detection
 */

import { AgendaTransformer } from '../../transformers/agendaTransformer'
import { AttendeeTransformer } from '../../transformers/attendeeTransformer'
import { DiningTransformer } from '../../transformers/diningTransformer'

describe('Schema Evolution Tests', () => {
  // Helper function to create complete agenda test data
  const createAgendaTestData = (overrides: any = {}) => ({
    id: '123',
    title: 'Test Session',
    description: 'Test Description',
    date: '2024-01-15',
    start_time: '09:00',
    end_time: '10:00',
    location: 'Room A',
    type: 'presentation',
    speaker: null,
    capacity: 100,
    registered_count: 50,
    attendee_selection: 'everyone',
    selected_attendees: [],
    is_active: true,
    has_seating: false,
    seating_notes: '',
    seating_type: 'open',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides
  })

  // Helper function to create complete attendee test data
  const createAttendeeTestData = (overrides: any = {}) => ({
    id: '123',
    salutation: 'Mr.',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    title: 'CEO',
    company: 'Acme Corp',
    bio: 'Test bio',
    photo: '',
    business_phone: '555-1234',
    mobile_phone: '555-5678',
    address1: '123 Main St',
    address2: '',
    postal_code: '12345',
    city: 'Anytown',
    state: 'CA',
    country: 'USA',
    country_code: 'US',
    hotel_selection: 'hotel1',
    dining_selections: [],
    selected_breakouts: [],
    attributes: {},
    is_cfo: false,
    is_apax_ep: false,
    sponsorAttendee: false,
    assistant_name: '',
    assistant_email: '',
    idloom_id: 'idloom123',
    last_synced_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  })

  // Helper function to create complete dining test data
  const createDiningTestData = (overrides: any = {}) => ({
    id: '123',
    name: 'Test Restaurant',
    description: 'Test Description',
    type: 'dinner',
    capacity: 50,
    price: 25.00,
    dietary: ['vegetarian'],
    tables: [],
    is_active: true,
    display_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides
  })

  describe('AgendaTransformer Schema Evolution', () => {
    const transformer = new AgendaTransformer()

    it('should handle null speaker field (v1.1.0)', () => {
      const dbData = createAgendaTestData({ speaker: null })
      const result = transformer.transformFromDatabase(dbData)
      expect(result.speakerInfo).toBe('')
    })

    it('should handle empty object speaker field (v1.5.0)', () => {
      const dbData = createAgendaTestData({ speaker: {} })
      const result = transformer.transformFromDatabase(dbData)
      expect(result.speakerInfo).toBe('')
    })

    it('should handle object speaker with name property (v1.5.0)', () => {
      const dbData = createAgendaTestData({ speaker: { name: 'John Doe' } })
      const result = transformer.transformFromDatabase(dbData)
      expect(result.speakerInfo).toBe('John Doe')
    })

    it('should handle string speaker field (v1.2.0)', () => {
      const dbData = createAgendaTestData({ speaker: 'Jane Smith' })
      const result = transformer.transformFromDatabase(dbData)
      expect(result.speakerInfo).toBe('Jane Smith')
    })

    it('should handle renamed speaker field (v2.0.0)', () => {
      const dbData = createAgendaTestData({ speaker_name: 'Bob Johnson' })
      const result = transformer.transformFromDatabase(dbData)
      expect(result.speakerInfo).toBe('Bob Johnson')
    })
  })

  describe('AttendeeTransformer Schema Evolution', () => {
    const transformer = new AttendeeTransformer()

    it('should handle legacy email_address field (v1.0.0)', () => {
      const dbData = createAttendeeTestData({ email_address: 'john@example.com' })
      const result = transformer.transformFromDatabase(dbData)
      expect(result.email).toBe('john@example.com')
    })

    it('should handle legacy phone_number field (v1.1.0)', () => {
      const dbData = createAttendeeTestData({ phone_number: '555-1234' })
      const result = transformer.transformFromDatabase(dbData)
      expect(result.phone).toBe('555-1234')
    })

    it('should handle legacy company_name field (v1.2.0)', () => {
      const dbData = createAttendeeTestData({ company_name: 'Acme Corp' })
      const result = transformer.transformFromDatabase(dbData)
      expect(result.company).toBe('Acme Corp')
    })

    it('should handle string boolean fields (v1.3.0)', () => {
      const dbData = createAttendeeTestData({ is_active: 'true' })
      const result = transformer.transformFromDatabase(dbData)
      expect(result.isActive).toBe(true)
    })

    it('should handle empty objects in arrays', () => {
      const dbData = createAttendeeTestData({
        dining_selections: {},
        selected_breakouts: {},
        attributes: {}
      })
      const result = transformer.transformFromDatabase(dbData)
      expect(result.dining_selections).toEqual([])
      expect(result.selected_breakouts).toEqual([])
      expect(result.attributes).toEqual({})
    })
  })

  describe('DiningTransformer Schema Evolution', () => {
    const transformer = new DiningTransformer()

    it('should handle string boolean fields (v1.1.0)', () => {
      const dbData = createDiningTestData({ is_active: 'true' })
      const result = transformer.transformFromDatabase(dbData)
      expect(result.is_active).toBe(true)
    })

    it('should handle string price field (v1.2.0)', () => {
      const dbData = createDiningTestData({ price: '25.50' })
      const result = transformer.transformFromDatabase(dbData)
      expect(result.price).toBe(25.50)
    })

    it('should handle dietary_options field (v1.3.0)', () => {
      const dbData = createDiningTestData({ 
        dietary_options: ['vegetarian', 'vegan'],
        dietary: undefined // Remove the new field to force old schema detection
      })
      const result = transformer.transformFromDatabase(dbData)
      expect(result.dietary).toEqual(['vegetarian', 'vegan'])
    })

    it('should handle max_capacity field (v1.5.0)', () => {
      const dbData = createDiningTestData({ 
        max_capacity: 100,
        capacity: undefined // Remove the new field to force old schema detection
      })
      const result = transformer.transformFromDatabase(dbData)
      expect(result.capacity).toBe(100)
    })

    it('should handle meal_type field (v2.0.0)', () => {
      const dbData = createDiningTestData({ meal_type: 'dinner' })
      const result = transformer.transformFromDatabase(dbData)
      expect(result.type).toBe('dinner')
    })

    it('should handle type conversions', () => {
      const dbData = createDiningTestData({ capacity: '50', price: '15.99' })
      const result = transformer.transformFromDatabase(dbData)
      expect(result.capacity).toBe(50)
      expect(result.price).toBe(15.99)
    })
  })

  describe('Schema Version Detection', () => {
    const agendaTransformer = new AgendaTransformer()

    it('should detect correct schema versions', () => {
      // Test null speaker
      const nullSpeaker = { speaker: null }
      expect(agendaTransformer['inferVersion'](nullSpeaker)).toBe('1.1.0')

      // Test string speaker
      const stringSpeaker = { speaker: 'John Doe' }
      expect(agendaTransformer['inferVersion'](stringSpeaker)).toBe('1.2.0')

      // Test object speaker
      const objectSpeaker = { speaker: {} }
      expect(agendaTransformer['inferVersion'](objectSpeaker)).toBe('1.5.0')

      // Test renamed speaker
      const renamedSpeaker = { speaker_name: 'Jane Smith' }
      expect(agendaTransformer['inferVersion'](renamedSpeaker)).toBe('2.0.0')
    })
  })

  describe('Error Handling', () => {
    const transformer = new AgendaTransformer()

    it('should handle malformed data gracefully', () => {
      const malformedData = {
        id: '123',
        title: 'Test Session',
        // Missing required fields
      }

      expect(() => {
        transformer.transformFromDatabase(malformedData)
      }).toThrow()
    })

    it('should handle completely invalid data', () => {
      expect(() => {
        transformer.transformFromDatabase(null)
      }).toThrow()

      expect(() => {
        transformer.transformFromDatabase(undefined)
      }).toThrow()
    })
  })

  describe('Performance', () => {
    const transformer = new AgendaTransformer()

    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => 
        createAgendaTestData({
          id: `item-${i}`,
          title: `Session ${i}`,
          speaker: i % 2 === 0 ? null : `Speaker ${i}`
        })
      )

      const start = Date.now()
      const results = transformer.transformArrayFromDatabase(largeDataset)
      const end = Date.now()

      expect(results).toHaveLength(1000)
      expect(end - start).toBeLessThan(1000) // Should complete in under 1 second
    })
  })
})
