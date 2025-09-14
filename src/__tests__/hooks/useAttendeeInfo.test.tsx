/**
 * Tests for useAttendeeInfo Hook
 * 
 * Tests React hook for accessing attendee information
 * Story 1.5: Attendee Information Extraction & Easy Access
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAttendeeInfo } from '../../hooks/useAttendeeInfo'
import { attendeeInfoService } from '../../services/attendeeInfoService'

// Mock AuthContext
const mockAuthContext = {
  isAuthenticated: false,
  attendee: null,
  attendeeName: null,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  checkAuthStatus: vi.fn()
}

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}))

// Mock AttendeeInfoService
vi.mock('../../services/attendeeInfoService', () => ({
  attendeeInfoService: {
    getAttendeeName: vi.fn(),
    getFullAttendeeInfo: vi.fn(),
    hasValidAttendeeInfo: vi.fn()
  }
}))

describe('useAttendeeInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset auth context to default state
    mockAuthContext.isAuthenticated = false
    mockAuthContext.attendeeName = null
  })

  describe('when not authenticated', () => {
    it('should return null for all name methods', () => {
      const { result } = renderHook(() => useAttendeeInfo())

      expect(result.current.getFirstName()).toBe('')
      expect(result.current.getLastName()).toBe('')
      expect(result.current.getFullName()).toBe('')
      expect(result.current.getName()).toBeNull()
      expect(result.current.getFullInfo()).toBeNull()
    })

    it('should return false for hasInfo', () => {
      const { result } = renderHook(() => useAttendeeInfo())

      expect(result.current.hasInfo()).toBe(false)
    })

    it('should return false for isAuthenticated', () => {
      const { result } = renderHook(() => useAttendeeInfo())

      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('when authenticated but no attendee name in context', () => {
    beforeEach(() => {
      mockAuthContext.isAuthenticated = true
      mockAuthContext.attendeeName = null
    })

    it('should fallback to attendeeInfoService for name methods', () => {
      const mockNameInfo = {
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe'
      }

      vi.mocked(attendeeInfoService.getAttendeeName).mockReturnValue(mockNameInfo)

      const { result } = renderHook(() => useAttendeeInfo())

      expect(result.current.getFirstName()).toBe('John')
      expect(result.current.getLastName()).toBe('Doe')
      expect(result.current.getFullName()).toBe('John Doe')
      expect(result.current.getName()).toEqual(mockNameInfo)
    })

    it('should fallback to attendeeInfoService for full info', () => {
      const mockFullInfo = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corp',
        title: 'CEO'
      }

      vi.mocked(attendeeInfoService.getFullAttendeeInfo).mockReturnValue(mockFullInfo)

      const { result } = renderHook(() => useAttendeeInfo())

      expect(result.current.getFullInfo()).toEqual(mockFullInfo)
    })

    it('should use attendeeInfoService for hasInfo', () => {
      vi.mocked(attendeeInfoService.hasValidAttendeeInfo).mockReturnValue(true)

      const { result } = renderHook(() => useAttendeeInfo())

      expect(result.current.hasInfo()).toBe(true)
      expect(attendeeInfoService.hasValidAttendeeInfo).toHaveBeenCalled()
    })
  })

  describe('when authenticated with attendee name in context', () => {
    beforeEach(() => {
      mockAuthContext.isAuthenticated = true
      mockAuthContext.attendeeName = {
        first_name: 'Jane',
        last_name: 'Smith',
        full_name: 'Jane Smith'
      }
    })

    it('should use context attendee name for name methods', () => {
      const { result } = renderHook(() => useAttendeeInfo())

      expect(result.current.getFirstName()).toBe('Jane')
      expect(result.current.getLastName()).toBe('Smith')
      expect(result.current.getFullName()).toBe('Jane Smith')
      expect(result.current.getName()).toEqual({
        first_name: 'Jane',
        last_name: 'Smith',
        full_name: 'Jane Smith'
      })
    })

    it('should not call attendeeInfoService when context has name', () => {
      const { result } = renderHook(() => useAttendeeInfo())

      result.current.getName()

      expect(attendeeInfoService.getAttendeeName).not.toHaveBeenCalled()
    })

    it('should still use attendeeInfoService for full info', () => {
      const mockFullInfo = {
        id: '123',
        first_name: 'Jane',
        last_name: 'Smith',
        full_name: 'Jane Smith',
        email: 'jane.smith@example.com',
        company: 'Tech Corp',
        title: 'CTO'
      }

      vi.mocked(attendeeInfoService.getFullAttendeeInfo).mockReturnValue(mockFullInfo)

      const { result } = renderHook(() => useAttendeeInfo())

      expect(result.current.getFullInfo()).toEqual(mockFullInfo)
    })
  })

  describe('when attendeeInfoService returns null', () => {
    beforeEach(() => {
      mockAuthContext.isAuthenticated = true
      mockAuthContext.attendeeName = null
    })

    it('should return empty strings for name methods', () => {
      vi.mocked(attendeeInfoService.getAttendeeName).mockReturnValue(null)

      const { result } = renderHook(() => useAttendeeInfo())

      expect(result.current.getFirstName()).toBe('')
      expect(result.current.getLastName()).toBe('')
      expect(result.current.getFullName()).toBe('')
      expect(result.current.getName()).toBeNull()
    })

    it('should return null for getFullInfo', () => {
      vi.mocked(attendeeInfoService.getFullAttendeeInfo).mockReturnValue(null)

      const { result } = renderHook(() => useAttendeeInfo())

      expect(result.current.getFullInfo()).toBeNull()
    })
  })

  describe('when attendeeInfoService returns partial data', () => {
    beforeEach(() => {
      mockAuthContext.isAuthenticated = true
      mockAuthContext.attendeeName = null
    })

    it('should handle partial name data gracefully', () => {
      const partialNameInfo = {
        first_name: 'John',
        last_name: '',
        full_name: 'John'
      }

      vi.mocked(attendeeInfoService.getAttendeeName).mockReturnValue(partialNameInfo)

      const { result } = renderHook(() => useAttendeeInfo())

      expect(result.current.getFirstName()).toBe('John')
      expect(result.current.getLastName()).toBe('')
      expect(result.current.getFullName()).toBe('John')
    })
  })

  describe('hook return value structure', () => {
    it('should return all expected methods', () => {
      const { result } = renderHook(() => useAttendeeInfo())

      expect(result.current).toHaveProperty('getName')
      expect(result.current).toHaveProperty('getFirstName')
      expect(result.current).toHaveProperty('getLastName')
      expect(result.current).toHaveProperty('getFullName')
      expect(result.current).toHaveProperty('getFullInfo')
      expect(result.current).toHaveProperty('hasInfo')
      expect(result.current).toHaveProperty('isAuthenticated')
    })

    it('should return functions for all methods', () => {
      const { result } = renderHook(() => useAttendeeInfo())

      expect(typeof result.current.getName).toBe('function')
      expect(typeof result.current.getFirstName).toBe('function')
      expect(typeof result.current.getLastName).toBe('function')
      expect(typeof result.current.getFullName).toBe('function')
      expect(typeof result.current.getFullInfo).toBe('function')
      expect(typeof result.current.hasInfo).toBe('function')
      expect(typeof result.current.isAuthenticated).toBe('boolean')
    })
  })

  describe('integration with AuthContext changes', () => {
    it('should react to authentication state changes', () => {
      const { result, rerender } = renderHook(() => useAttendeeInfo())

      // Initially not authenticated
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.hasInfo()).toBe(false)

      // Simulate authentication
      mockAuthContext.isAuthenticated = true
      mockAuthContext.attendeeName = {
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe'
      }

      rerender()

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.getFullName()).toBe('John Doe')
    })
  })
})
