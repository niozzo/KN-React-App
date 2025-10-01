/**
 * E2E Confidential Data Security Tests
 * Tests complete data flow from API → localStorage to ensure no confidential data exposure
 * 
 * Test Categories:
 * - E2E Data Flow: Complete API to localStorage security validation
 * - Integration Security: All caching paths tested for filtering
 * - Runtime Validation: Actual localStorage contents audited
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PWADataSyncService } from '../../services/pwaDataSyncService'
import { UnifiedCacheService } from '../../services/unifiedCacheService'
import { AttendeeCacheFilterService } from '../../services/attendeeCacheFilterService'
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

describe('E2E Confidential Data Prevention', () => {
  let pwaDataSyncService: PWADataSyncService
  let unifiedCacheService: UnifiedCacheService

  // Confidential fields that must be removed
  const confidentialFields = [
    'business_phone', 'mobile_phone', 'check_in_date', 'check_out_date',
    'hotel_selection', 'custom_hotel', 'room_type', 'has_spouse',
    'dietary_requirements', 'is_spouse', 'spouse_details', 'address1',
    'address2', 'postal_code', 'city', 'state', 'country', 'country_code',
    'assistant_name', 'assistant_email', 'idloom_id', 'access_code'
  ]

  // Sample attendee data with confidential information
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
    
    // Clear mock storage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
    
    // Initialize services
    pwaDataSyncService = new PWADataSyncService()
    unifiedCacheService = new UnifiedCacheService()
  })

  afterEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
  })

  describe('Complete Data Flow Security', () => {
    it('should prevent confidential data in localStorage after full data sync', async () => {
      // 1. Trigger complete data sync via PWADataSyncService
      await pwaDataSyncService.cacheTableData('attendees', [confidentialAttendee])

      // 2. Check localStorage.getItem('kn_cache_attendees')
      const cachedData = localStorageMock.getItem('kn_cache_attendees')
      expect(cachedData).not.toBeNull()

      // 3. Parse and validate cached data
      const parsedData = JSON.parse(cachedData!)
      const cachedAttendee = parsedData.data[0]

      // 4. Verify NO confidential fields present
      confidentialFields.forEach(field => {
        expect(cachedAttendee[field]).toBeUndefined()
      })

      // 5. Verify safe fields are preserved
      expect(cachedAttendee.id).toBe(confidentialAttendee.id)
      expect(cachedAttendee.first_name).toBe(confidentialAttendee.first_name)
      expect(cachedAttendee.last_name).toBe(confidentialAttendee.last_name)
      expect(cachedAttendee.email).toBe(confidentialAttendee.email)
      expect(cachedAttendee.title).toBe(confidentialAttendee.title)
      expect(cachedAttendee.company).toBe(confidentialAttendee.company)
    })

    it('should filter confidential data through UnifiedCacheService', async () => {
      // 1. Use UnifiedCacheService to cache attendee data
      await unifiedCacheService.set('kn_cache_attendees', [confidentialAttendee])

      // 2. Retrieve and validate cached data
      const cachedData = localStorageMock.getItem('kn_cache_attendees')
      expect(cachedData).not.toBeNull()

      const parsedData = JSON.parse(cachedData!)
      const cachedAttendee = parsedData.data[0]

      // 3. Verify confidential fields are removed
      confidentialFields.forEach(field => {
        expect(cachedAttendee[field]).toBeUndefined()
      })

      // 4. Verify safe fields are preserved
      expect(cachedAttendee.id).toBe(confidentialAttendee.id)
      expect(cachedAttendee.first_name).toBe(confidentialAttendee.first_name)
    })

    it('should handle nested confidential data (spouse_details)', async () => {
      // 1. Cache attendee with nested confidential data
      await pwaDataSyncService.cacheTableData('attendees', [confidentialAttendee])

      // 2. Retrieve and validate cached data
      const cachedData = localStorageMock.getItem('kn_cache_attendees')
      const parsedData = JSON.parse(cachedData!)
      const cachedAttendee = parsedData.data[0]

      // 3. Verify spouse_details is completely removed
      expect(cachedAttendee.spouse_details).toBeUndefined()

      // 4. Verify other confidential fields are also removed
      expect(cachedAttendee.business_phone).toBeUndefined()
      expect(cachedAttendee.mobile_phone).toBeUndefined()
      expect(cachedAttendee.address1).toBeUndefined()
    })
  })

  describe('Multiple Caching Paths Security', () => {
    it('should filter data in PWADataSyncService.cacheTableData()', async () => {
      // 1. Call PWADataSyncService.cacheTableData with confidential data
      await pwaDataSyncService.cacheTableData('attendees', [confidentialAttendee])

      // 2. Verify filtering is applied before localStorage.setItem
      const cachedData = localStorageMock.getItem('kn_cache_attendees')
      const parsedData = JSON.parse(cachedData!)
      const cachedAttendee = parsedData.data[0]

      // 3. Verify AttendeeCacheFilterService filtering is applied
      confidentialFields.forEach(field => {
        expect(cachedAttendee[field]).toBeUndefined()
      })
    })

    it('should filter data in UnifiedCacheService.set()', async () => {
      // 1. Call UnifiedCacheService.set with confidential data
      await unifiedCacheService.set('kn_cache_attendees', [confidentialAttendee])

      // 2. Verify filtering is applied
      const cachedData = localStorageMock.getItem('kn_cache_attendees')
      const parsedData = JSON.parse(cachedData!)
      const cachedAttendee = parsedData.data[0]

      // 3. Verify confidential fields are removed
      confidentialFields.forEach(field => {
        expect(cachedAttendee[field]).toBeUndefined()
      })
    })

    it('should filter data in single attendee cache', async () => {
      // 1. Cache single attendee
      await unifiedCacheService.set('kn_cache_attendee', confidentialAttendee)

      // 2. Verify filtering is applied
      const cachedData = localStorageMock.getItem('kn_cache_attendee')
      const parsedData = JSON.parse(cachedData!)
      const cachedAttendee = parsedData.data

      // 3. Verify confidential fields are removed
      confidentialFields.forEach(field => {
        expect(cachedAttendee[field]).toBeUndefined()
      })
    })
  })

  describe('Runtime Security Validation', () => {
    it('should validate no confidential data in production cache', async () => {
      // 1. Simulate production cache by using the actual filtering services
      await pwaDataSyncService.cacheTableData('attendees', [confidentialAttendee])

      // 2. Check actual localStorage contents
      const cachedData = localStorageMock.getItem('kn_cache_attendees')
      expect(cachedData).not.toBeNull()

      // 3. Parse kn_cache_attendees data
      const parsedData = JSON.parse(cachedData!)
      const cachedAttendee = parsedData.data[0]

      // 4. Validate against confidential field list
      const foundConfidentialFields: string[] = []
      confidentialFields.forEach(field => {
        if (cachedAttendee[field] !== undefined && cachedAttendee[field] !== null && cachedAttendee[field] !== '') {
          foundConfidentialFields.push(field)
        }
      })

      // 5. Verify no confidential fields found (filtering should have removed them)
      expect(foundConfidentialFields).toHaveLength(0)
    })

    it('should audit all localStorage keys for attendee data', async () => {
      // 1. Simulate multiple cache keys with attendee data using actual filtering
      const cacheKeys = [
        'kn_cache_attendees',
        'kn_cache_attendee'
      ]

      // 2. Populate using actual filtering services
      await pwaDataSyncService.cacheTableData('attendees', [confidentialAttendee])
      await unifiedCacheService.set('kn_cache_attendee', confidentialAttendee)

      // 3. Scan all localStorage keys
      const allKeys = Object.keys(mockStorage)
      const attendeeKeys = allKeys.filter(key => key.includes('attendee'))

      // 4. Check for attendee data in any key
      attendeeKeys.forEach(key => {
        const cachedData = localStorageMock.getItem(key)
        expect(cachedData).not.toBeNull()
        
        const parsedData = JSON.parse(cachedData!)
        const data = Array.isArray(parsedData.data) ? parsedData.data[0] : parsedData.data

        // 5. Validate no confidential fields in any cached data
        confidentialFields.forEach(field => {
          expect(data[field]).toBeUndefined()
        })
      })
    })
  })

  describe('Security Compliance Validation', () => {
    it('should pass AttendeeCacheFilterService validation', () => {
      // 1. Test the filtering service directly
      const filteredAttendee = AttendeeCacheFilterService.filterConfidentialFields(confidentialAttendee)

      // 2. Validate no confidential fields in filtered data
      const validation = AttendeeCacheFilterService.validateNoConfidentialData(filteredAttendee)
      
      // 3. Verify validation passes
      expect(validation.isValid).toBe(true)
      expect(validation.issues).toHaveLength(0)
    })

    it('should fail validation if confidential data is present', () => {
      // 1. Test with unfiltered confidential data
      const validation = AttendeeCacheFilterService.validateNoConfidentialData(confidentialAttendee)
      
      // 2. Verify validation fails
      expect(validation.isValid).toBe(false)
      expect(validation.issues.length).toBeGreaterThan(0)
    })

    it('should handle array of attendees correctly', () => {
      // 1. Test filtering array of attendees
      const filteredArray = AttendeeCacheFilterService.filterAttendeesArray([confidentialAttendee])

      // 2. Validate each attendee in array
      filteredArray.forEach(attendee => {
        const validation = AttendeeCacheFilterService.validateNoConfidentialData(attendee)
        expect(validation.isValid).toBe(true)
        expect(validation.issues).toHaveLength(0)
      })
    })
  })
})
