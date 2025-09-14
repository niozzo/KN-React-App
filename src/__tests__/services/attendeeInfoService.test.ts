/**
 * Tests for AttendeeInfoService
 * 
 * Tests attendee information extraction, caching, and access methods
 * Story 1.5: Attendee Information Extraction & Easy Access
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AttendeeInfoService, type AttendeeInfo, type CachedAttendeeInfo } from '../../services/attendeeInfoService'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('AttendeeInfoService', () => {
  let service: AttendeeInfoService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new AttendeeInfoService()
  })

  afterEach(() => {
    // Clear any cached data between tests
    localStorageMock.clear()
  })

  describe('extractAttendeeInfo', () => {
    it('should extract attendee information from full attendee data', () => {
      const mockAttendee = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corp',
        title: 'CEO',
        access_code: 'ABC123'
      }

      const result = service.extractAttendeeInfo(mockAttendee)

      expect(result).toEqual({
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corp',
        title: 'CEO',
        access_code: 'ABC123'
      })
    })

    it('should handle missing optional fields gracefully', () => {
      const mockAttendee = {
        id: '123',
        first_name: 'Jane',
        last_name: 'Smith',
        access_code: 'XYZ789'
        // Missing email, company, title
      }

      const result = service.extractAttendeeInfo(mockAttendee)

      expect(result).toEqual({
        id: '123',
        first_name: 'Jane',
        last_name: 'Smith',
        full_name: 'Jane Smith',
        email: '',
        company: '',
        title: '',
        access_code: 'XYZ789'
      })
    })

    it('should handle empty names correctly', () => {
      const mockAttendee = {
        id: '123',
        first_name: '',
        last_name: '',
        access_code: 'DEF456'
      }

      const result = service.extractAttendeeInfo(mockAttendee)

      expect(result.full_name).toBe('')
    })

    it('should throw error for null attendee data', () => {
      expect(() => service.extractAttendeeInfo(null)).toThrow('Attendee data is required')
    })

    it('should throw error for undefined attendee data', () => {
      expect(() => service.extractAttendeeInfo(undefined)).toThrow('Attendee data is required')
    })
  })

  describe('storeAttendeeInfo', () => {
    it('should store sanitized attendee info in localStorage', () => {
      const attendeeInfo: AttendeeInfo = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corp',
        title: 'CEO',
        access_code: 'ABC123'
      }

      service.storeAttendeeInfo(attendeeInfo)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kn_current_attendee_info',
        expect.stringContaining('"id":"123"')
      )

      // Verify access_code is not stored
      const storedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(storedData.data).not.toHaveProperty('access_code')
    })

    it('should include metadata in stored data', () => {
      const attendeeInfo: AttendeeInfo = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corp',
        title: 'CEO',
        access_code: 'ABC123'
      }

      service.storeAttendeeInfo(attendeeInfo)

      const storedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(storedData).toHaveProperty('timestamp')
      expect(storedData).toHaveProperty('version', 1)
      expect(storedData).toHaveProperty('source', 'attendee-info-service')
    })

    it('should handle storage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const attendeeInfo: AttendeeInfo = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corp',
        title: 'CEO',
        access_code: 'ABC123'
      }

      expect(() => service.storeAttendeeInfo(attendeeInfo)).toThrow('Storage quota exceeded')
    })
  })

  describe('getCachedAttendeeInfo', () => {
    it('should return cached attendee info when available', () => {
      const mockCachedData = {
        data: {
          id: '123',
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'John Doe',
          email: 'john.doe@example.com',
          company: 'Acme Corp',
          title: 'CEO'
        },
        timestamp: Date.now(),
        version: 1,
        source: 'attendee-info-service'
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockCachedData))

      const result = service.getCachedAttendeeInfo()

      expect(result).toEqual(mockCachedData.data)
    })

    it('should return null when no cached data exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = service.getCachedAttendeeInfo()

      expect(result).toBeNull()
    })

    it('should return null when cache is expired', () => {
      const expiredData = {
        data: {
          id: '123',
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'John Doe',
          email: 'john.doe@example.com',
          company: 'Acme Corp',
          title: 'CEO'
        },
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        version: 1,
        source: 'attendee-info-service'
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredData))

      const result = service.getCachedAttendeeInfo()

      expect(result).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_current_attendee_info')
    })

    it('should handle malformed JSON gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      const result = service.getCachedAttendeeInfo()

      expect(result).toBeNull()
    })
  })

  describe('getAttendeeName', () => {
    it('should return name information from cache', () => {
      const mockCachedData = {
        data: {
          id: '123',
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'John Doe',
          email: 'john.doe@example.com',
          company: 'Acme Corp',
          title: 'CEO'
        },
        timestamp: Date.now(),
        version: 1,
        source: 'attendee-info-service'
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockCachedData))

      const result = service.getAttendeeName()

      expect(result).toEqual({
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe'
      })
    })

    it('should return null when no cached data exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = service.getAttendeeName()

      expect(result).toBeNull()
    })
  })

  describe('getFullAttendeeInfo', () => {
    it('should return full attendee information from cache', () => {
      const mockCachedData = {
        data: {
          id: '123',
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'John Doe',
          email: 'john.doe@example.com',
          company: 'Acme Corp',
          title: 'CEO'
        },
        timestamp: Date.now(),
        version: 1,
        source: 'attendee-info-service'
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockCachedData))

      const result = service.getFullAttendeeInfo()

      expect(result).toEqual(mockCachedData.data)
    })
  })

  describe('clearAttendeeInfo', () => {
    it('should remove attendee info from localStorage', () => {
      service.clearAttendeeInfo()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_current_attendee_info')
    })

    it('should handle removal errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      service.clearAttendeeInfo()
      
      expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to clear attendee info cache:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('hasValidAttendeeInfo', () => {
    it('should return true when valid cached data exists', () => {
      const mockCachedData = {
        data: {
          id: '123',
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'John Doe',
          email: 'john.doe@example.com',
          company: 'Acme Corp',
          title: 'CEO'
        },
        timestamp: Date.now(),
        version: 1,
        source: 'attendee-info-service'
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockCachedData))

      const result = service.hasValidAttendeeInfo()

      expect(result).toBe(true)
    })

    it('should return false when no cached data exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = service.hasValidAttendeeInfo()

      expect(result).toBe(false)
    })

    it('should return false when cached data is invalid', () => {
      const invalidData = {
        data: {
          id: '123',
          first_name: '',
          last_name: '',
          // Missing required fields
        },
        timestamp: Date.now(),
        version: 1,
        source: 'attendee-info-service'
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidData))

      const result = service.hasValidAttendeeInfo()

      expect(result).toBe(false)
    })
  })

  describe('updateAttendeeInfo', () => {
    it('should update existing attendee info', () => {
      // Reset the mock to not throw errors
      localStorageMock.setItem.mockImplementation(() => {})
      
      const existingInfo = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corp',
        title: 'CEO'
      }

      const mockCachedData = {
        data: existingInfo,
        timestamp: Date.now(),
        version: 1,
        source: 'attendee-info-service'
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockCachedData))

      const updates = {
        first_name: 'Jane',
        last_name: 'Smith'
      }

      service.updateAttendeeInfo(updates)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kn_current_attendee_info',
        expect.stringContaining('"first_name":"Jane"')
      )

      const storedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(storedData.data.full_name).toBe('Jane Smith')
    })

    it('should throw error when no cached data exists to update', () => {
      localStorageMock.getItem.mockReturnValue(null)

      expect(() => service.updateAttendeeInfo({ first_name: 'Jane' })).toThrow(
        'No cached attendee info to update'
      )
    })
  })
})
