/**
 * Runtime Cache Audit Tests
 * Audits actual localStorage contents to ensure no confidential data exposure
 * 
 * Test Categories:
 * - Runtime Validation: Check actual localStorage contents
 * - Security Auditing: Scan all cache keys for violations
 * - Compliance Checking: Validate security requirements
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Attendee } from '../../types/attendee'

// Mock localStorage with proper verification support
const mockStorage: Record<string, string> = {}

const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key]
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
  }),
  length: 0,
  key: vi.fn()
}

// Mock browser APIs
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

describe('Runtime Cache Audit', () => {
  // Confidential fields that must be removed
  const confidentialFields = [
    'business_phone', 'mobile_phone', 'check_in_date', 'check_out_date',
    'hotel_selection', 'custom_hotel', 'room_type', 'has_spouse',
    'dietary_requirements', 'is_spouse', 'spouse_details', 'address1',
    'address2', 'postal_code', 'city', 'state', 'country', 'country_code',
    'assistant_name', 'assistant_email', 'idloom_id', 'access_code'
  ]

  // Sample attendee with confidential data
  const confidentialAttendee: Attendee = {
    id: 'test-attendee-1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    title: 'CEO',
    company: 'Test Company',
    bio: 'Test bio',
    photo: 'https://example.com/photo.jpg',
    salutation: 'Mr',
    registration_status: 'confirmed',
    registration_id: 'REG123',
    dining_selections: {},
    selected_breakouts: [],
    attributes: {
      ceo: true,
      cfo: false,
      cmo: false,
      coo: false,
      cro: false,
      chro: false,
      apaxEP: false,
      apaxIP: false,
      spouse: false,
      apaxOEP: false,
      cto_cio: false,
      speaker: false,
      apaxOther: false,
      cLevelExec: true,
      nonCLevelExec: false,
      sponsorAttendee: false,
      otherAttendeeType: false,
      portfolioCompanyExecutive: true
    },
    is_cfo: false,
    is_apax_ep: false,
    primary_attendee_id: null,
    company_name_standardized: 'Test Company',
    last_synced_at: '2025-01-15T10:00:00Z',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    // CONFIDENTIAL FIELDS - These should be removed
    business_phone: '555-123-4567',
    mobile_phone: '555-987-6543',
    check_in_date: '2025-10-20',
    check_out_date: '2025-10-22',
    hotel_selection: 'hotel-uuid-123',
    custom_hotel: 'Custom Hotel Name',
    room_type: 'suite',
    has_spouse: true,
    dietary_requirements: 'Vegetarian',
    is_spouse: false,
    spouse_details: {
      email: 'spouse@example.com',
      mobilePhone: '555-111-2222',
      dietaryRequirements: 'Gluten-free'
    },
    address1: '123 Main Street',
    address2: 'Apt 4B',
    postal_code: '12345',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    country_code: 'US',
    assistant_name: 'Jane Assistant',
    assistant_email: 'jane.assistant@example.com',
    idloom_id: 'IDLOOM123',
    access_code: 'SECRET123'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
  })

  afterEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
  })

  describe('localStorage Content Auditing', () => {
    it('should audit localStorage for confidential data exposure', () => {
      // 1. Simulate production localStorage with confidential data
      const productionCache = {
        'kn_cache_attendees': JSON.stringify({
          data: [confidentialAttendee],
          timestamp: Date.now(),
          source: 'api'
        }),
        'kn_cache_attendee': JSON.stringify({
          data: confidentialAttendee,
          timestamp: Date.now(),
          source: 'api'
        }),
        'kn_current_attendee_info': JSON.stringify({
          data: confidentialAttendee,
          timestamp: Date.now(),
          source: 'user'
        })
      }

      // 2. Populate mock localStorage
      Object.keys(productionCache).forEach(key => {
        mockStorage[key] = productionCache[key]
      })

      // 3. Scan all localStorage keys
      const allKeys = Object.keys(mockStorage)
      const violations: string[] = []

      allKeys.forEach(key => {
        const cachedData = localStorageMock.getItem(key)
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData)
            const data = Array.isArray(parsedData.data) ? parsedData.data : [parsedData.data]

            // 4. Check each data item for confidential fields
            data.forEach((item: any, index: number) => {
              if (item && typeof item === 'object') {
                confidentialFields.forEach(field => {
                  if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
                    violations.push(`${key}[${index}].${field}: "${item[field]}"`)
                  }
                })
              }
            })
          } catch (error) {
            // Skip non-JSON data
          }
        }
      })

      // 5. Report any security violations
      expect(violations).toHaveLength(0)
    })

    it('should detect confidential data in specific cache keys', () => {
      // 1. Test specific attendee cache keys
      const attendeeCacheKeys = [
        'kn_cache_attendees',
        'kn_cache_attendee',
        'kn_current_attendee_info',
        'kn_attendee_selections'
      ]

      // 2. Populate with confidential data
      attendeeCacheKeys.forEach(key => {
        mockStorage[key] = JSON.stringify({
          data: key.includes('attendees') ? [confidentialAttendee] : confidentialAttendee,
          timestamp: Date.now()
        })
      })

      // 3. Audit each key for violations
      attendeeCacheKeys.forEach(key => {
        const cachedData = localStorageMock.getItem(key)
        const parsedData = JSON.parse(cachedData!)
        const data = Array.isArray(parsedData.data) ? parsedData.data : [parsedData.data]

        data.forEach((item: any) => {
          if (item && typeof item === 'object') {
            confidentialFields.forEach(field => {
              expect(item[field]).toBeUndefined()
            })
          }
        })
      })
    })

    it('should validate nested confidential data (spouse_details)', () => {
      // 1. Create attendee with nested confidential data
      const attendeeWithSpouse = {
        ...confidentialAttendee,
        spouse_details: {
          email: 'spouse@example.com',
          mobilePhone: '555-111-2222',
          dietaryRequirements: 'Gluten-free'
        }
      }

      // 2. Cache the data
      mockStorage['kn_cache_attendees'] = JSON.stringify({
        data: [attendeeWithSpouse],
        timestamp: Date.now()
      })

      // 3. Audit for nested confidential data
      const cachedData = localStorageMock.getItem('kn_cache_attendees')
      const parsedData = JSON.parse(cachedData!)
      const cachedAttendee = parsedData.data[0]

      // 4. Verify spouse_details is completely removed
      expect(cachedAttendee.spouse_details).toBeUndefined()

      // 5. Verify other confidential fields are also removed
      expect(cachedAttendee.business_phone).toBeUndefined()
      expect(cachedAttendee.mobile_phone).toBeUndefined()
    })
  })

  describe('Security Compliance Validation', () => {
    it('should pass security audit when no confidential data present', () => {
      // 1. Create filtered attendee data (safe)
      const safeAttendee = {
        id: confidentialAttendee.id,
        first_name: confidentialAttendee.first_name,
        last_name: confidentialAttendee.last_name,
        email: confidentialAttendee.email,
        title: confidentialAttendee.title,
        company: confidentialAttendee.company,
        bio: confidentialAttendee.bio,
        photo: confidentialAttendee.photo,
        salutation: confidentialAttendee.salutation,
        registration_status: confidentialAttendee.registration_status,
        registration_id: confidentialAttendee.registration_id,
        dining_selections: confidentialAttendee.dining_selections,
        selected_breakouts: confidentialAttendee.selected_breakouts,
        attributes: confidentialAttendee.attributes,
        is_cfo: confidentialAttendee.is_cfo,
        is_apax_ep: confidentialAttendee.is_apax_ep,
        primary_attendee_id: confidentialAttendee.primary_attendee_id,
        company_name_standardized: confidentialAttendee.company_name_standardized,
        last_synced_at: confidentialAttendee.last_synced_at,
        created_at: confidentialAttendee.created_at,
        updated_at: confidentialAttendee.updated_at
      }

      // 2. Cache the safe data
      mockStorage['kn_cache_attendees'] = JSON.stringify({
        data: [safeAttendee],
        timestamp: Date.now()
      })

      // 3. Audit for confidential data
      const cachedData = localStorageMock.getItem('kn_cache_attendees')
      const parsedData = JSON.parse(cachedData!)
      const cachedAttendee = parsedData.data[0]

      // 4. Verify no confidential fields present
      confidentialFields.forEach(field => {
        expect(cachedAttendee[field]).toBeUndefined()
      })

      // 5. Verify safe fields are present
      expect(cachedAttendee.id).toBe(safeAttendee.id)
      expect(cachedAttendee.first_name).toBe(safeAttendee.first_name)
      expect(cachedAttendee.email).toBe(safeAttendee.email)
    })

    it('should fail security audit when confidential data is present', () => {
      // 1. Cache unfiltered confidential data
      mockStorage['kn_cache_attendees'] = JSON.stringify({
        data: [confidentialAttendee],
        timestamp: Date.now()
      })

      // 2. Audit for confidential data
      const cachedData = localStorageMock.getItem('kn_cache_attendees')
      const parsedData = JSON.parse(cachedData!)
      const cachedAttendee = parsedData.data[0]

      // 3. Verify confidential fields are present (should fail)
      const foundConfidentialFields: string[] = []
      confidentialFields.forEach(field => {
        if (cachedAttendee[field] !== undefined && cachedAttendee[field] !== null && cachedAttendee[field] !== '') {
          foundConfidentialFields.push(field)
        }
      })

      // 4. This should fail the security audit
      expect(foundConfidentialFields.length).toBeGreaterThan(0)
    })
  })

  describe('Cache Key Scanning', () => {
    it('should scan all localStorage keys for attendee data', () => {
      // 1. Populate localStorage with various cache keys
      const cacheKeys = [
        'kn_cache_attendees',
        'kn_cache_attendee',
        'kn_current_attendee_info',
        'kn_attendee_selections',
        'kn_cache_agenda_items',
        'kn_cache_sponsors',
        'kn_cache_hotels'
      ]

      // 2. Add attendee data to relevant keys
      cacheKeys.forEach(key => {
        if (key.includes('attendee')) {
          mockStorage[key] = JSON.stringify({
            data: key.includes('attendees') ? [confidentialAttendee] : confidentialAttendee,
            timestamp: Date.now()
          })
        } else {
          mockStorage[key] = JSON.stringify({
            data: [],
            timestamp: Date.now()
          })
        }
      })

      // 3. Scan all keys for attendee data
      const allKeys = Object.keys(mockStorage)
      const attendeeKeys = allKeys.filter(key => key.includes('attendee'))

      // 4. Verify attendee keys are identified
      expect(attendeeKeys).toContain('kn_cache_attendees')
      expect(attendeeKeys).toContain('kn_cache_attendee')
      expect(attendeeKeys).toContain('kn_current_attendee_info')
      expect(attendeeKeys).toContain('kn_attendee_selections')

      // 5. Audit each attendee key
      attendeeKeys.forEach(key => {
        const cachedData = localStorageMock.getItem(key)
        const parsedData = JSON.parse(cachedData!)
        const data = Array.isArray(parsedData.data) ? parsedData.data : [parsedData.data]

        data.forEach((item: any) => {
          if (item && typeof item === 'object') {
            confidentialFields.forEach(field => {
              expect(item[field]).toBeUndefined()
            })
          }
        })
      })
    })

    it('should handle malformed cache data gracefully', () => {
      // 1. Add malformed data to localStorage
      mockStorage['kn_cache_attendees'] = 'invalid-json'
      mockStorage['kn_cache_attendee'] = JSON.stringify({ invalid: 'structure' })
      mockStorage['kn_other_data'] = 'not-json'

      // 2. Scan all keys
      const allKeys = Object.keys(mockStorage)
      const violations: string[] = []

      allKeys.forEach(key => {
        try {
          const cachedData = localStorageMock.getItem(key)
          if (cachedData) {
            const parsedData = JSON.parse(cachedData)
            // Process data if valid JSON
            if (parsedData && typeof parsedData === 'object') {
              // Check for attendee data
              if (key.includes('attendee')) {
                const data = Array.isArray(parsedData.data) ? parsedData.data : [parsedData.data]
                data.forEach((item: any) => {
                  if (item && typeof item === 'object') {
                    confidentialFields.forEach(field => {
                      if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
                        violations.push(`${key}.${field}`)
                      }
                    })
                  }
                })
              }
            }
          }
        } catch (error) {
          // Skip malformed data
        }
      })

      // 3. Verify no violations from malformed data
      expect(violations).toHaveLength(0)
    })
  })
})
