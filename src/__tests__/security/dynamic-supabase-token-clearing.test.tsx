/**
 * Security Tests: Dynamic Supabase Token Clearing
 * 
 * Tests to ensure that Supabase authentication tokens with different project IDs
 * are properly cleared on logout, regardless of the project ID.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { dataClearingService } from '../../services/dataClearingService'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

describe('Dynamic Supabase Token Clearing Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Different Project IDs', () => {
    it('should clear Supabase tokens with current project ID', async () => {
      // Mock localStorage with current project ID
      mockLocalStorage.length = 3
      mockLocalStorage.key.mockImplementation((index: number) => {
        const keys = [
          'sb-iikcgdhztkrexuuqheli-auth-token', // Current project
          'kn_cache_attendees',
          'conference_auth'
        ]
        return keys[index] || null
      })

      const result = await dataClearingService.clearAllData()

      expect(result.success).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-iikcgdhztkrexuuqheli-auth-token')
    })

    it('should clear Supabase tokens with different project ID', async () => {
      // Mock localStorage with different project ID
      mockLocalStorage.length = 3
      mockLocalStorage.key.mockImplementation((index: number) => {
        const keys = [
          'sb-newproject123-auth-token', // Different project ID
          'kn_cache_attendees',
          'conference_auth'
        ]
        return keys[index] || null
      })

      const result = await dataClearingService.clearAllData()

      expect(result.success).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-newproject123-auth-token')
    })

    it('should clear Supabase tokens with any project ID pattern', async () => {
      // Mock localStorage with multiple different project IDs
      mockLocalStorage.length = 6
      mockLocalStorage.key.mockImplementation((index: number) => {
        const keys = [
          'sb-iikcgdhztkrexuuqheli-auth-token', // Current project
          'sb-newproject123-auth-token',        // Different project
          'sb-anotherproject456-auth-token',    // Another project
          'sb-xyz789-session',                  // Session token
          'kn_cache_attendees',
          'conference_auth'
        ]
        return keys[index] || null
      })

      const result = await dataClearingService.clearAllData()

      expect(result.success).toBe(true)
      
      // Should clear ALL sb-* tokens regardless of project ID
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-iikcgdhztkrexuuqheli-auth-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-newproject123-auth-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-anotherproject456-auth-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-xyz789-session')
      
      // Should also clear other confidential data
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cache_attendees')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('conference_auth')
    })

    it('should clear Supabase tokens with various naming patterns', async () => {
      // Mock localStorage with different Supabase token patterns
      mockLocalStorage.length = 8
      mockLocalStorage.key.mockImplementation((index: number) => {
        const keys = [
          'sb-project1-auth-token',           // Standard auth token
          'sb-project2-session',              // Session token
          'sb-project3-refresh-token',        // Refresh token
          'supabase-auth-token',              // Generic supabase token
          'supabase-session-data',            // Session data
          'supabase-user-preferences',        // User preferences
          'kn_cache_attendees',
          'user_preferences'                  // Non-confidential
        ]
        return keys[index] || null
      })

      const result = await dataClearingService.clearAllData()

      expect(result.success).toBe(true)
      
      // Should clear ALL sb-* tokens
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-project1-auth-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-project2-session')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-project3-refresh-token')
      
      // Should clear ALL supabase* tokens
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('supabase-auth-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('supabase-session-data')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('supabase-user-preferences')
      
      // Should clear other confidential data
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cache_attendees')
      
      // Should NOT clear non-confidential data
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('user_preferences')
    })
  })

  describe('Future-Proof Pattern Matching', () => {
    it('should handle edge cases in project ID patterns', async () => {
      // Mock localStorage with edge case project IDs
      mockLocalStorage.length = 5
      mockLocalStorage.key.mockImplementation((index: number) => {
        const keys = [
          'sb-123-auth-token',                // Numeric project ID
          'sb-abc-def-ghi-auth-token',        // Hyphenated project ID
          'sb-project_with_underscores-auth-token', // Underscores
          'kn_cache_attendees',
          'conference_auth'
        ]
        return keys[index] || null
      })

      const result = await dataClearingService.clearAllData()

      expect(result.success).toBe(true)
      
      // Should clear ALL sb-* tokens regardless of project ID format
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-123-auth-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-abc-def-ghi-auth-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-project_with_underscores-auth-token')
    })

    it('should be aggressive about clearing any sb-* keys for security', async () => {
      // Mock localStorage with various keys that start with 'sb-'
      mockLocalStorage.length = 4
      mockLocalStorage.key.mockImplementation((index: number) => {
        const keys = [
          'sb-iikcgdhztkrexuuqheli-auth-token', // Real Supabase token
          'sb-custom-key',                       // Custom key starting with sb-
          'kn_cache_attendees',
          'conference_auth'
        ]
        return keys[index] || null
      })

      const result = await dataClearingService.clearAllData()

      expect(result.success).toBe(true)
      
      // Should clear the real Supabase token
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-iikcgdhztkrexuuqheli-auth-token')
      
      // Should also clear the custom key (our pattern is sb-* which matches both)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-custom-key')
      
      // This is actually correct behavior - we want to be aggressive about clearing
      // any keys that start with 'sb-' to ensure we don't miss any Supabase tokens
    })
  })
})
