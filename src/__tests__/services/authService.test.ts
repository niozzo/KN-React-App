/**
 * Tests for Authentication Service
 * 
 * Tests access code authentication with READ-ONLY database access
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Unmock the auth service to test the actual implementation
vi.unmock('../../services/authService')

import { 
  authenticateWithAccessCode, 
  getCurrentAttendee, 
  isUserAuthenticated, 
  signOut,
  validateAccessCodeFormat 
} from '../../services/authService'

// Mock Supabase client
vi.mock('../../lib/supabase', async () => {
  const actual = await vi.importActual('../../lib/supabase')
  return {
    ...actual,
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      auth: {
        signOut: vi.fn(() => Promise.resolve({ error: null }))
      }
    }
  }
})

describe('Authentication Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateAccessCodeFormat', () => {
    it('should validate 6-character alphanumeric codes', () => {
      expect(validateAccessCodeFormat('ABC123')).toBe(true)
      expect(validateAccessCodeFormat('abc123')).toBe(true)
      expect(validateAccessCodeFormat('123456')).toBe(true)
      expect(validateAccessCodeFormat('ABCDEF')).toBe(true)
    })

    it('should reject invalid formats', () => {
      console.log('Testing ABC12:', validateAccessCodeFormat('ABC12'))
      console.log('Testing ABC1234:', validateAccessCodeFormat('ABC1234'))
      console.log('Testing ABC-123:', validateAccessCodeFormat('ABC-123'))
      
      expect(validateAccessCodeFormat('ABC12')).toBe(false) // Too short
      expect(validateAccessCodeFormat('ABC1234')).toBe(false) // Too long
      expect(validateAccessCodeFormat('ABC-123')).toBe(false) // Invalid character
      expect(validateAccessCodeFormat('')).toBe(false) // Empty
      expect(validateAccessCodeFormat('ABC 123')).toBe(false) // Space
    })
  })

  describe('authenticateWithAccessCode', () => {
    it('should reject invalid access code format', async () => {
      const result = await authenticateWithAccessCode('ABC12')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid access code format. Must be 6 alphanumeric characters.')
      expect(result.attendee).toBeUndefined()
    })

    it('should reject empty access code', async () => {
      const result = await authenticateWithAccessCode('')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid access code format. Must be 6 alphanumeric characters.')
    })

    it('should handle database errors gracefully', async () => {
      // Mock Supabase to throw an error
      const mockSupabase = await import('../../lib/supabase')
      mockSupabase.supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockRejectedValue(new Error('Database error'))
          }))
        }))
      })

      const result = await authenticateWithAccessCode('ABC123')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication failed. Please try again.')
    })
  })

  describe('getCurrentAttendee', () => {
    it('should return null when not authenticated', () => {
      const attendee = getCurrentAttendee()
      expect(attendee).toBeNull()
    })
  })

  describe('isUserAuthenticated', () => {
    it('should return false when not authenticated', () => {
      const authenticated = isUserAuthenticated()
      expect(authenticated).toBe(false)
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', () => {
      const result = signOut()
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })
})
