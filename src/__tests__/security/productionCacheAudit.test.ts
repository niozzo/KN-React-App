/**
 * Production Cache Audit Tests
 * Scans all localStorage keys for attendee data and validates security compliance
 * 
 * Test Categories:
 * - Production Monitoring: Scan all localStorage keys for attendee data
 * - Security Compliance: Validate no confidential fields in any cached data
 * - Violation Reporting: Report any security violations found
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Attendee } from '../../types/attendee'
import { AttendeeCacheFilterService } from '../../services/attendeeCacheFilterService'

// Mock applicationDatabaseService to prevent hanging
vi.mock('../../services/applicationDatabaseService', () => ({
  applicationDatabaseService: {
    getAllAttendeePreferences: vi.fn(() => Promise.resolve([])),
    init: vi.fn(() => Promise.resolve()),
    isInitialized: true
  }
}))

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

describe('Production Cache Audit', () => {
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

  describe('Complete localStorage Audit', () => {
    it('should audit localStorage for confidential data exposure', () => {
      // QA FIX: Use filtered data to simulate PROPER production state
      // In production, data should already be filtered before caching
      const filteredAttendee = AttendeeCacheFilterService.filterConfidentialFields(confidentialAttendee)
      
      // 1. Simulate production localStorage with various cache keys
      const productionCache = {
        'kn_cache_attendees': JSON.stringify({
          data: [filteredAttendee], // Using filtered data
          timestamp: Date.now(),
          source: 'api'
        }),
        'kn_cache_attendee': JSON.stringify({
          data: filteredAttendee, // Using filtered data
          timestamp: Date.now(),
          source: 'api'
        }),
        'kn_current_attendee_info': JSON.stringify({
          data: filteredAttendee, // Using filtered data
          timestamp: Date.now(),
          source: 'user'
        }),
        'kn_cache_agenda_items': JSON.stringify({
          data: [],
          timestamp: Date.now(),
          source: 'api'
        }),
        'kn_cache_sponsors': JSON.stringify({
          data: [],
          timestamp: Date.now(),
          source: 'api'
        }),
        'kn_cache_hotels': JSON.stringify({
          data: [],
          timestamp: Date.now(),
          source: 'api'
        })
      }

      // 2. Populate mock localStorage
      Object.keys(productionCache).forEach(key => {
        mockStorage[key] = productionCache[key]
      })

      // 3. Scan all localStorage keys
      const allKeys = Object.keys(mockStorage)
      const violations: Array<{ key: string; field: string; value: any; path: string }> = []

      allKeys.forEach(key => {
        const cachedData = localStorageMock.getItem(key)
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData)
            
            // 4. Check for attendee data in any key
            if (parsedData && typeof parsedData === 'object') {
              const data = Array.isArray(parsedData.data) ? parsedData.data : [parsedData.data]
              
              data.forEach((item: any, index: number) => {
                if (item && typeof item === 'object') {
                  // 5. Check for attendee-like data (has id, first_name, last_name)
                  if (item.id && item.first_name && item.last_name) {
                    confidentialFields.forEach(field => {
                      if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
                        violations.push({
                          key,
                          field,
                          value: item[field],
                          path: `${key}[${index}].${field}`
                        })
                      }
                    })
                  }
                }
              })
            }
          } catch (error) {
            // Skip non-JSON data
          }
        }
      })

      // DEBUG: Log all violations for investigation
      console.log('\n=== SECURITY VIOLATIONS DEBUG (Test 1) ===');
      console.log(`Total violations found: ${violations.length}`);
      violations.forEach((v, i) => {
        console.log(`Violation ${i + 1}:`, {
          key: v.key,
          field: v.field,
          value: typeof v.value === 'string' ? v.value.substring(0, 50) + '...' : v.value,
          reason: v.reason
        });
      });
      console.log('==========================================\n');

      // 6. Report any security violations
      expect(violations).toHaveLength(0)
    })

    it('should identify attendee data in any localStorage key', () => {
      // QA FIX: Use filtered data for realistic production state
      const filteredAttendee = AttendeeCacheFilterService.filterConfidentialFields(confidentialAttendee)
      
      // 1. Create cache scenarios with ONLY keys that exist in production
      const cacheScenarios = {
        'kn_cache_attendees': [filteredAttendee], // Using filtered data
        'kn_cache_attendee': filteredAttendee, // Using filtered data
        'kn_current_attendee_info': filteredAttendee, // Using filtered data
        'kn_cache_agenda_items': [],
        'kn_cache_sponsors': []
      }

      // 2. Populate localStorage
      Object.keys(cacheScenarios).forEach(key => {
        mockStorage[key] = JSON.stringify({
          data: cacheScenarios[key as keyof typeof cacheScenarios],
          timestamp: Date.now()
        })
      })

      // 3. Scan for attendee data
      const allKeys = Object.keys(mockStorage)
      const attendeeKeys: string[] = []
      const violations: string[] = []

      allKeys.forEach(key => {
        const cachedData = localStorageMock.getItem(key)
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData)
            const data = Array.isArray(parsedData.data) ? parsedData.data : [parsedData.data]
            
            data.forEach((item: any, index: number) => {
              if (item && typeof item === 'object') {
                // Check if this looks like attendee data
                if (item.id && item.first_name && item.last_name) {
                  attendeeKeys.push(key)
                  
                  // Check for confidential fields
                  confidentialFields.forEach(field => {
                    if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
                      violations.push(`${key}[${index}].${field}: "${item[field]}"`)
                    }
                  })
                }
              }
            })
          } catch (error) {
            // Skip malformed data
          }
        }
      })

      // DEBUG: Log attendee keys for investigation
      console.log('\n=== ATTENDEE KEYS DEBUG (Test 2) ===');
      console.log('Attendee keys found:', attendeeKeys);
      console.log('Expected keys: kn_cache_attendees, kn_cache_attendee, kn_current_attendee_info');
      console.log('====================================\n');

      // 4. QA FIX: Verify ONLY keys that exist in production
      expect(attendeeKeys).toContain('kn_cache_attendees')
      expect(attendeeKeys).toContain('kn_cache_attendee')
      expect(attendeeKeys).toContain('kn_current_attendee_info')
      // Removed: kn_attendee_selections, kn_user_data (don't exist in production)

      // 5. Verify no violations
      expect(violations).toHaveLength(0)
    })
  })

  describe('Security Compliance Validation', () => {
    it('should validate no confidential fields in any cached data', () => {
      // QA FIX: Use filtered data for realistic production state
      const filteredAttendee = AttendeeCacheFilterService.filterConfidentialFields(confidentialAttendee)
      
      // 1. Create comprehensive cache with FILTERED attendee data
      const comprehensiveCache = {
        'kn_cache_attendees': JSON.stringify({
          data: [filteredAttendee], // Using filtered data
          timestamp: Date.now()
        }),
        'kn_cache_attendee': JSON.stringify({
          data: filteredAttendee, // Using filtered data
          timestamp: Date.now()
        }),
        'kn_current_attendee_info': JSON.stringify({
          data: filteredAttendee, // Using filtered data
          timestamp: Date.now()
        })
        // Removed: kn_attendee_selections (doesn't exist in production)
      }

      // 2. Populate localStorage
      Object.keys(comprehensiveCache).forEach(key => {
        mockStorage[key] = comprehensiveCache[key]
      })

      // 3. Audit all keys for confidential data
      const allKeys = Object.keys(mockStorage)
      const securityReport: Array<{ key: string; violations: string[] }> = []

      allKeys.forEach(key => {
        const cachedData = localStorageMock.getItem(key)
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData)
            const data = Array.isArray(parsedData.data) ? parsedData.data : [parsedData.data]
            const violations: string[] = []

            data.forEach((item: any, index: number) => {
              if (item && typeof item === 'object') {
                // Check for attendee-like data
                if (item.id && item.first_name && item.last_name) {
                  confidentialFields.forEach(field => {
                    if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
                      violations.push(`${field}: "${item[field]}"`)
                    }
                  })
                }
              }
            })

            if (violations.length > 0) {
              securityReport.push({ key, violations })
            }
          } catch (error) {
            // Skip malformed data
          }
        }
      })

      // DEBUG: Log security report for investigation
      console.log('\n=== SECURITY REPORT DEBUG (Test 3) ===');
      console.log(`Total violations in report: ${securityReport.length}`);
      securityReport.forEach((report, i) => {
        console.log(`Report ${i + 1} - Key: ${report.key}`);
        console.log(`  Violations (${report.violations.length}):`, report.violations.slice(0, 5));
      });
      console.log('======================================\n');

      // 4. Verify no security violations
      expect(securityReport).toHaveLength(0)
    })

    it('should handle nested attendee data structures', () => {
      // QA FIX: Use filtered data for realistic nested structures in production
      const filteredAttendee = AttendeeCacheFilterService.filterConfidentialFields(confidentialAttendee)
      
      // 1. Create nested data structures with FILTERED attendee data
      const nestedCache = {
        'kn_user_session': JSON.stringify({
          data: {
            user: { id: 'user-1', name: 'John' },
            attendee: filteredAttendee, // Using filtered data
            preferences: { theme: 'dark' }
          },
          timestamp: Date.now()
        }),
        'kn_event_data': JSON.stringify({
          data: {
            event: { id: 'event-1', name: 'Conference' },
            attendees: [filteredAttendee], // Using filtered data
            sponsors: []
          },
          timestamp: Date.now()
        })
      }

      // 2. Populate localStorage
      Object.keys(nestedCache).forEach(key => {
        mockStorage[key] = nestedCache[key]
      })

      // 3. Audit nested structures
      const allKeys = Object.keys(mockStorage)
      const violations: string[] = []

      allKeys.forEach(key => {
        const cachedData = localStorageMock.getItem(key)
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData)
            const data = parsedData.data

            // 4. Recursively check for attendee data
            const checkForAttendeeData = (obj: any, path: string = '') => {
              if (obj && typeof obj === 'object') {
                if (Array.isArray(obj)) {
                  obj.forEach((item, index) => {
                    checkForAttendeeData(item, `${path}[${index}]`)
                  })
                } else {
                  // Check if this is attendee data
                  if (obj.id && obj.first_name && obj.last_name) {
                    confidentialFields.forEach(field => {
                      if (obj[field] !== undefined && obj[field] !== null && obj[field] !== '') {
                        violations.push(`${key}${path}.${field}: "${obj[field]}"`)
                      }
                    })
                  }
                  
                  // Recursively check nested objects
                  Object.keys(obj).forEach(prop => {
                    if (obj[prop] && typeof obj[prop] === 'object') {
                      checkForAttendeeData(obj[prop], `${path}.${prop}`)
                    }
                  })
                }
              }
            }

            checkForAttendeeData(data)
          } catch (error) {
            // Skip malformed data
          }
        }
      })

      // DEBUG: Log nested violations for investigation
      console.log('\n=== NESTED VIOLATIONS DEBUG (Test 4) ===');
      console.log(`Total violations found: ${violations.length}`);
      violations.slice(0, 10).forEach((v, i) => {
        console.log(`Violation ${i + 1}:`, v);
      });
      if (violations.length > 10) {
        console.log(`... and ${violations.length - 10} more`);
      }
      console.log('========================================\n');

      // 5. Verify no violations in nested structures
      expect(violations).toHaveLength(0)
    })
  })

  describe('Violation Reporting', () => {
    it('should report security violations with detailed information', () => {
      // 1. Create cache with confidential data (should fail)
      const violatingCache = {
        'kn_cache_attendees': JSON.stringify({
          data: [confidentialAttendee],
          timestamp: Date.now()
        })
      }

      // 2. Populate localStorage
      Object.keys(violatingCache).forEach(key => {
        mockStorage[key] = violatingCache[key]
      })

      // 3. Perform security audit
      const allKeys = Object.keys(mockStorage)
      const securityReport: Array<{
        key: string
        violations: Array<{ field: string; value: any; path: string }>
      }> = []

      allKeys.forEach(key => {
        const cachedData = localStorageMock.getItem(key)
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData)
            const data = Array.isArray(parsedData.data) ? parsedData.data : [parsedData.data]
            const violations: Array<{ field: string; value: any; path: string }> = []

            data.forEach((item: any, index: number) => {
              if (item && typeof item === 'object') {
                if (item.id && item.first_name && item.last_name) {
                  confidentialFields.forEach(field => {
                    if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
                      violations.push({
                        field,
                        value: item[field],
                        path: `${key}[${index}].${field}`
                      })
                    }
                  })
                }
              }
            })

            if (violations.length > 0) {
              securityReport.push({ key, violations })
            }
          } catch (error) {
            // Skip malformed data
          }
        }
      })

      // 4. Verify violations are reported
      expect(securityReport).toHaveLength(1)
      expect(securityReport[0].key).toBe('kn_cache_attendees')
      expect(securityReport[0].violations.length).toBeGreaterThan(0)

      // 5. Verify violation details
      const violation = securityReport[0].violations[0]
      expect(violation.field).toBeOneOf(confidentialFields)
      expect(violation.value).toBeDefined()
      expect(violation.path).toContain('kn_cache_attendees')
    })

    it('should generate comprehensive security report', () => {
      // 1. Create mixed cache with some violations
      const mixedCache = {
        'kn_cache_attendees': JSON.stringify({
          data: [confidentialAttendee],
          timestamp: Date.now()
        }),
        'kn_cache_attendee': JSON.stringify({
          data: confidentialAttendee,
          timestamp: Date.now()
        }),
        'kn_cache_agenda_items': JSON.stringify({
          data: [],
          timestamp: Date.now()
        })
      }

      // 2. Populate localStorage
      Object.keys(mixedCache).forEach(key => {
        mockStorage[key] = mixedCache[key]
      })

      // 3. Generate comprehensive security report
      const allKeys = Object.keys(mockStorage)
      const securityReport = {
        totalKeys: allKeys.length,
        attendeeKeys: [] as string[],
        violations: [] as Array<{ key: string; field: string; value: any; path: string }>,
        summary: {
          totalViolations: 0,
          affectedKeys: 0,
          criticalFields: [] as string[]
        }
      }

      allKeys.forEach(key => {
        const cachedData = localStorageMock.getItem(key)
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData)
            const data = Array.isArray(parsedData.data) ? parsedData.data : [parsedData.data]

            data.forEach((item: any, index: number) => {
              if (item && typeof item === 'object') {
                if (item.id && item.first_name && item.last_name) {
                  securityReport.attendeeKeys.push(key)
                  
                  confidentialFields.forEach(field => {
                    if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
                      const violation = {
                        key,
                        field,
                        value: item[field],
                        path: `${key}[${index}].${field}`
                      }
                      securityReport.violations.push(violation)
                      securityReport.summary.criticalFields.push(field)
                    }
                  })
                }
              }
            })
          } catch (error) {
            // Skip malformed data
          }
        }
      })

      // 4. Calculate summary
      securityReport.summary.totalViolations = securityReport.violations.length
      securityReport.summary.affectedKeys = new Set(securityReport.violations.map(v => v.key)).size

      // 5. Verify report structure
      expect(securityReport.totalKeys).toBe(3)
      expect(securityReport.attendeeKeys).toContain('kn_cache_attendees')
      expect(securityReport.attendeeKeys).toContain('kn_cache_attendee')
      expect(securityReport.summary.totalViolations).toBeGreaterThan(0)
      expect(securityReport.summary.affectedKeys).toBeGreaterThan(0)
    })
  })
})
