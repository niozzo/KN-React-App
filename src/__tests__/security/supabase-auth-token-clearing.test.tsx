/**
 * Security Tests: Supabase Auth Token Clearing
 * 
 * Tests to ensure that Supabase authentication tokens are properly cleared on logout.
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

describe('Supabase Auth Token Clearing Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage with Supabase auth token and other data
    mockLocalStorage.length = 5
    mockLocalStorage.key.mockImplementation((index: number) => {
      const keys = [
        'sb-iikcgdhztkrexuuqheli-auth-token',
        'kn_cache_attendees',
        'conference_auth',
        'kn_cached_sessions',
        'supabase-session-data'
      ]
      return keys[index] || null
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Supabase Token Clearing', () => {
    it('should clear Supabase auth tokens on logout', async () => {
      const result = await dataClearingService.clearAllData()

      expect(result.success).toBe(true)
      expect(result.clearedData.localStorage).toBe(true)

      // Verify Supabase auth token was removed
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-iikcgdhztkrexuuqheli-auth-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('supabase-session-data')
      
      // Verify other confidential data was also removed
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cache_attendees')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('conference_auth')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cached_sessions')

      // Verify the correct number of items were removed (6 calls - includes additional internal keys)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(6)
    })

    it('should clear all Supabase-related keys', async () => {
      // Add more Supabase keys
      mockLocalStorage.length = 8
      mockLocalStorage.key.mockImplementation((index: number) => {
        const keys = [
          'sb-iikcgdhztkrexuuqheli-auth-token',
          'sb-iikcgdhztkrexuuqheli-session',
          'supabase-auth-token',
          'supabase-session-data',
          'kn_cache_attendees',
          'conference_auth',
          'kn_cached_sessions',
          'user_preferences' // Non-confidential
        ]
        return keys[index] || null
      })

      const result = await dataClearingService.clearAllData()

      expect(result.success).toBe(true)
      
      // Should remove all Supabase keys
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-iikcgdhztkrexuuqheli-auth-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-iikcgdhztkrexuuqheli-session')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('supabase-auth-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('supabase-session-data')
      
      // Should remove other confidential keys
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cache_attendees')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('conference_auth')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cached_sessions')

      // Should NOT remove non-confidential keys
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('user_preferences')
    })

    it('should handle localStorage errors gracefully when clearing Supabase tokens', async () => {
      // Mock localStorage.removeItem to throw an error for Supabase tokens
      mockLocalStorage.removeItem.mockImplementation((key: string) => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          throw new Error('Failed to remove Supabase token')
        }
      })

      const result = await dataClearingService.clearAllData()

      // Should still attempt to clear all data
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-iikcgdhztkrexuuqheli-auth-token')
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('localStorage clearing failed')
    })
  })

  describe('Data Leakage Prevention', () => {
    it('should prevent Supabase token persistence after logout', async () => {
      const result = await dataClearingService.clearAllData()

      expect(result.success).toBe(true)
      expect(result.clearedData.localStorage).toBe(true)
      
      // Should have attempted to clear all Supabase tokens
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-iikcgdhztkrexuuqheli-auth-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('supabase-session-data')
    })

    it('should verify no Supabase data remains after clearing', async () => {
      const result = await dataClearingService.clearAllData()

      expect(result.success).toBe(true)
      
      // Should have attempted to clear all Supabase-related keys
      const supabaseKeys = [
        'sb-iikcgdhztkrexuuqheli-auth-token',
        'supabase-session-data'
      ]
      
      supabaseKeys.forEach(key => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(key)
      })
    })
  })
})
