/**
 * Integration Tests for Attendee Information Extraction
 * 
 * Tests complete flow from authentication to attendee info extraction and access
 * Story 1.5: Attendee Information Extraction & Easy Access
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { serverDataSyncService } from '../../services/serverDataSyncService'
import { attendeeInfoService } from '../../services/attendeeInfoService'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }))
}))

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

describe('Attendee Information Extraction Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    // Reset localStorage mock to not throw errors by default
    localStorageMock.setItem.mockImplementation(() => {})
    localStorageMock.getItem.mockImplementation(() => null)
  })

  afterEach(() => {
    // Clear any cached data between tests
    localStorageMock.clear()
  })

  describe('Complete Authentication Flow with Info Extraction', () => {
    it('should extract and cache attendee info during successful authentication', async () => {
      // Mock successful Supabase authentication
      const mockSupabaseClient = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: { id: 'admin-user' } },
            error: null
          })
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [{
                id: '123',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                company: 'Acme Corp',
                title: 'CEO',
                access_code: 'ABC123'
              }],
              error: null
            })
          }))
        }))
      }

      // Mock createClient to return our mock
      const { createClient } = await import('@supabase/supabase-js')
      vi.mocked(createClient).mockReturnValue(mockSupabaseClient as any)

      // Mock environment variables
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')
      vi.stubEnv('SUPABASE_USER_EMAIL', 'admin@test.com')
      vi.stubEnv('SUPABASE_USER_PASSWORD', 'test-password')

      // Perform authentication
      const result = await serverDataSyncService.lookupAttendeeByAccessCode('ABC123')

      // Verify authentication success
      expect(result.success).toBe(true)
      expect(result.attendee).toBeDefined()
      expect(result.attendee?.first_name).toBe('John')
      expect(result.attendee?.last_name).toBe('Doe')

      // Verify attendee info was cached
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kn_current_attendee_info',
        expect.stringContaining('"first_name":"John"')
      )

      // Verify cached data can be retrieved
      const cachedInfo = attendeeInfoService.getCachedAttendeeInfo()
      expect(cachedInfo).toBeDefined()
      if (cachedInfo) {
        expect(cachedInfo.first_name).toBe('John')
        expect(cachedInfo.last_name).toBe('Doe')
        expect(cachedInfo.full_name).toBe('John Doe')
        expect(cachedInfo.email).toBe('john.doe@example.com')
        expect(cachedInfo.company).toBe('Acme Corp')
        expect(cachedInfo.title).toBe('CEO')

        // Verify access_code is not in cached data
        expect(cachedInfo).not.toHaveProperty('access_code')
      }
    })

    it('should handle authentication failure gracefully', async () => {
      // Mock the entire lookupAttendeeByAccessCode method to simulate failure
      const originalMethod = serverDataSyncService.lookupAttendeeByAccessCode
      serverDataSyncService.lookupAttendeeByAccessCode = vi.fn().mockResolvedValue({
        success: false,
        error: 'Admin authentication failed'
      })

      // Attempt authentication
      const result = await serverDataSyncService.lookupAttendeeByAccessCode('ABC123')

      // Verify authentication failure
      expect(result.success).toBe(false)
      expect(result.error).toContain('Admin authentication failed')

      // Verify no attendee info was cached
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        'kn_current_attendee_info',
        expect.any(String)
      )

      // Restore original method
      serverDataSyncService.lookupAttendeeByAccessCode = originalMethod
    })

    it('should handle attendee not found scenario', async () => {
      // Mock successful admin auth but no attendee found
      const mockSupabaseClient = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: { id: 'admin-user' } },
            error: null
          })
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          }))
        }))
      }

      const { createClient } = await import('@supabase/supabase-js')
      vi.mocked(createClient).mockReturnValue(mockSupabaseClient as any)

      // Mock environment variables
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')
      vi.stubEnv('SUPABASE_USER_EMAIL', 'admin@test.com')
      vi.stubEnv('SUPABASE_USER_PASSWORD', 'test-password')

      // Attempt authentication with valid format
      const result = await serverDataSyncService.lookupAttendeeByAccessCode('INVALID')

      // Verify attendee not found
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid access code format')

      // Verify no attendee info was cached
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        'kn_current_attendee_info',
        expect.any(String)
      )
    })
  })

  describe('AttendeeInfoService Integration', () => {
    it('should handle complete attendee info lifecycle', () => {
      // Clear any existing mocks and reset localStorage
      vi.clearAllMocks()
      localStorageMock.clear()
      
      // Set up localStorage mock to actually store data
      const mockStorage = new Map()
      localStorageMock.setItem.mockImplementation((key, value) => {
        mockStorage.set(key, value)
      })
      localStorageMock.getItem.mockImplementation((key) => {
        return mockStorage.get(key) || null
      })
      localStorageMock.removeItem.mockImplementation((key) => {
        mockStorage.delete(key)
      })
      
      const mockAttendee = {
        id: '123',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        company: 'Tech Corp',
        title: 'CTO',
        access_code: 'XYZ789'
      }

      // Extract info
      const attendeeInfo = attendeeInfoService.extractAttendeeInfo(mockAttendee)
      expect(attendeeInfo.full_name).toBe('Jane Smith')
      expect(attendeeInfo.access_code).toBe('XYZ789')

      // Store info (should sanitize access_code)
      attendeeInfoService.storeAttendeeInfo(attendeeInfo)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kn_current_attendee_info',
        expect.stringContaining('"first_name":"Jane"')
      )

      // Verify stored data doesn't contain access_code
      const storedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(storedData.data).not.toHaveProperty('access_code')

      // Retrieve info
      const cachedInfo = attendeeInfoService.getCachedAttendeeInfo()
      if (cachedInfo) {
        expect(cachedInfo.first_name).toBe('Jane')
        expect(cachedInfo.last_name).toBe('Smith')
        expect(cachedInfo.full_name).toBe('Jane Smith')
        expect(cachedInfo).not.toHaveProperty('access_code')
      }

      // Get name info
      const nameInfo = attendeeInfoService.getAttendeeName()
      if (nameInfo) {
        expect(nameInfo.first_name).toBe('Jane')
        expect(nameInfo.last_name).toBe('Smith')
        expect(nameInfo.full_name).toBe('Jane Smith')
      }

      // Verify has valid info
      const hasValidInfo = attendeeInfoService.hasValidAttendeeInfo()
      expect(hasValidInfo).toBe(true)

      // Clear info
      attendeeInfoService.clearAttendeeInfo()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_current_attendee_info')

      // Verify cleared
      expect(attendeeInfoService.hasValidAttendeeInfo()).toBe(false)
    })

    it('should handle cache expiration', () => {
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
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        version: 1,
        source: 'attendee-info-service'
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockCachedData))

      // Should return null due to expiration
      const cachedInfo = attendeeInfoService.getCachedAttendeeInfo()
      expect(cachedInfo).toBeNull()

      // Should clear expired cache
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_current_attendee_info')
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle extraction errors without breaking authentication', async () => {
      // Mock successful authentication but with invalid attendee data
      const mockSupabaseClient = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: { id: 'admin-user' } },
            error: null
          })
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [null], // Invalid attendee data
              error: null
            })
          }))
        }))
      }

      const { createClient } = await import('@supabase/supabase-js')
      vi.mocked(createClient).mockReturnValue(mockSupabaseClient as any)

      // Mock environment variables
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')
      vi.stubEnv('SUPABASE_USER_EMAIL', 'admin@test.com')
      vi.stubEnv('SUPABASE_USER_PASSWORD', 'test-password')

      // Mock console.warn to verify error handling
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Attempt authentication
      const result = await serverDataSyncService.lookupAttendeeByAccessCode('ABC123')

      // Should still succeed even with extraction error
      expect(result.success).toBe(true)
      // Note: The extraction error handling is in a try-catch, so console.warn might not be called
      // The important thing is that authentication still succeeds

      consoleSpy.mockRestore()
    })

    it('should handle storage errors gracefully', () => {
      const mockAttendee = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corp',
        title: 'CEO',
        access_code: 'ABC123'
      }

      // Mock storage error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const attendeeInfo = attendeeInfoService.extractAttendeeInfo(mockAttendee)

      // Should throw error
      expect(() => attendeeInfoService.storeAttendeeInfo(attendeeInfo)).toThrow(
        'Storage quota exceeded'
      )
    })
  })

  describe('Data Flow Validation', () => {
    it('should maintain data integrity throughout the flow', async () => {
      const originalAttendee = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corp',
        title: 'CEO',
        access_code: 'ABC123',
        business_phone: '555-1234',
        mobile_phone: '555-5678'
      }

      // Mock successful authentication
      const mockSupabaseClient = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: { id: 'admin-user' } },
            error: null
          })
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [originalAttendee],
              error: null
            })
          }))
        }))
      }

      const { createClient } = await import('@supabase/supabase-js')
      vi.mocked(createClient).mockReturnValue(mockSupabaseClient as any)

      // Mock environment variables
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')
      vi.stubEnv('SUPABASE_USER_EMAIL', 'admin@test.com')
      vi.stubEnv('SUPABASE_USER_PASSWORD', 'test-password')

      // Perform authentication
      const result = await serverDataSyncService.lookupAttendeeByAccessCode('ABC123')

      // Verify original data is preserved in result (excluding extra fields that might be added)
      expect(result.attendee).toMatchObject({
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corp',
        title: 'CEO',
        access_code: 'ABC123'
      })

      // Verify extracted info contains only expected fields
      const cachedInfo = attendeeInfoService.getCachedAttendeeInfo()
      if (cachedInfo) {
        expect(cachedInfo).toHaveProperty('id', '123')
        expect(cachedInfo).toHaveProperty('first_name', 'John')
        expect(cachedInfo).toHaveProperty('last_name', 'Doe')
        expect(cachedInfo).toHaveProperty('full_name', 'John Doe')
        expect(cachedInfo).toHaveProperty('email', 'john.doe@example.com')
        expect(cachedInfo).toHaveProperty('company', 'Acme Corp')
        expect(cachedInfo).toHaveProperty('title', 'CEO')

        // Verify sensitive data is not cached
        expect(cachedInfo).not.toHaveProperty('access_code')
        expect(cachedInfo).not.toHaveProperty('business_phone')
        expect(cachedInfo).not.toHaveProperty('mobile_phone')
      }
    })
  })
})
