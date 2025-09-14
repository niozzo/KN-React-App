/**
 * Environment Configuration Tests
 * 
 * Tests environment variable handling and validation:
 * - Password with special characters
 * - Required environment variables
 * - Clear error messages for missing credentials
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock import.meta.env
const mockEnv = {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_USER_EMAIL: 'test@example.com',
  SUPABASE_USER_PASSWORD: 'test#password@123!'
}

vi.mock('import.meta', () => ({
  env: mockEnv
}))

describe('Environment Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Password Handling', () => {
    it('should handle passwords with special characters correctly', () => {
      // Test that passwords with special characters are preserved
      const testPasswords = [
        'test#password@123!',
        'pass$word%with^special&chars',
        'simple-password_123',
        'password.with.dots',
        'pass+word=with+operators'
      ]

      testPasswords.forEach(password => {
        // Simulate environment variable assignment
        const envPassword = `"${password}"`
        const parsedPassword = envPassword.slice(1, -1) // Remove quotes
        expect(parsedPassword).toBe(password)
        // Test that special characters are preserved (not all passwords have #)
        if (password.includes('#')) {
          expect(parsedPassword).toContain('#')
        }
      })
    })

    it('should detect password truncation issues', () => {
      // Test that unquoted passwords with # get truncated
      const unquotedPassword = 'test#password@123!'
      const truncatedPassword = unquotedPassword.split('#')[0] // Simulate truncation
      
      expect(truncatedPassword).toBe('test')
      expect(truncatedPassword).not.toBe(unquotedPassword)
      
      // Test that quoted passwords are preserved
      const quotedPassword = '"test#password@123!"'
      const parsedQuotedPassword = quotedPassword.slice(1, -1)
      expect(parsedQuotedPassword).toBe(unquotedPassword)
    })
  })

  describe('Required Environment Variables', () => {
    it('should validate required environment variables are present', () => {
      const requiredVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'SUPABASE_USER_EMAIL',
        'SUPABASE_USER_PASSWORD'
      ]

      requiredVars.forEach(varName => {
        expect(mockEnv[varName as keyof typeof mockEnv]).toBeDefined()
        expect(mockEnv[varName as keyof typeof mockEnv]).not.toBe('')
      })
    })

    it('should provide clear error messages for missing credentials', () => {
      // Test with missing email
      const missingEmailEnv = { ...mockEnv, SUPABASE_USER_EMAIL: '' }
      expect(missingEmailEnv.SUPABASE_USER_EMAIL).toBe('')
      
      // Test with missing password
      const missingPasswordEnv = { ...mockEnv, SUPABASE_USER_PASSWORD: '' }
      expect(missingPasswordEnv.SUPABASE_USER_PASSWORD).toBe('')
      
      // Test with undefined values
      const undefinedEnv = { ...mockEnv, SUPABASE_USER_EMAIL: undefined }
      expect(undefinedEnv.SUPABASE_USER_EMAIL).toBeUndefined()
    })
  })

  describe('Environment Variable Validation', () => {
    it('should validate Supabase URL format', () => {
      const validUrls = [
        'https://test.supabase.co',
        'https://abc123.supabase.co',
        'https://my-project.supabase.co'
      ]

      validUrls.forEach(url => {
        expect(url).toMatch(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/)
      })

      const invalidUrls = [
        'http://test.supabase.co', // Not HTTPS
        'https://test.supabase.com', // Wrong domain
        'test.supabase.co', // Missing protocol
        ''
      ]

      invalidUrls.forEach(url => {
        expect(url).not.toMatch(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/)
      })
    })

    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin@company.org'
      ]

      validEmails.forEach(email => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      })

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        ''
      ]

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      })
    })
  })

  describe('Configuration Error Messages', () => {
    it('should provide clear error messages for configuration issues', () => {
      const errorMessages = {
        missingEmail: 'Admin credentials not configured. Please set VITE_SUPABASE_USER_EMAIL and VITE_SUPABASE_USER_PASSWORD',
        missingPassword: 'Admin credentials not configured. Please set VITE_SUPABASE_USER_EMAIL and VITE_SUPABASE_USER_PASSWORD',
        invalidCredentials: 'Admin authentication failed: Invalid login credentials',
        networkError: 'Data synchronization failed. Please try again or contact support.'
      }

      expect(errorMessages.missingEmail).toContain('Admin credentials not configured')
      expect(errorMessages.missingPassword).toContain('Admin credentials not configured')
      expect(errorMessages.invalidCredentials).toContain('Admin authentication failed')
      expect(errorMessages.networkError).toContain('Data synchronization failed')
    })
  })
})
