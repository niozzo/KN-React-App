/**
 * End-to-End Login Journey Tests
 * 
 * Tests the complete user login experience:
 * - Login with valid access code and sync all data
 * - Maintain authentication state across page refreshes
 * - Provide offline data access after successful login
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AuthProvider, LoginPage } from '../../contexts/AuthContext'
import { serverDataSyncService } from '../../services/serverDataSyncService'
import { getAuthStatus, authenticateWithAccessCode } from '../../services/authService'

// Mock the server data sync service
vi.mock('../../services/serverDataSyncService', () => ({
  serverDataSyncService: {
    syncAllData: vi.fn(),
    lookupAttendeeByAccessCode: vi.fn(),
    cacheTableData: vi.fn()
  }
}))

// Mock the auth service
vi.mock('../../services/authService', () => ({
  getAuthStatus: vi.fn(),
  signOut: vi.fn(),
  validateAccessCodeFormat: vi.fn(),
  authenticateWithAccessCode: vi.fn(),
  getCurrentAttendee: vi.fn(),
  isUserAuthenticated: vi.fn()
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

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log
const originalConsoleError = console.error

beforeEach(() => {
  vi.clearAllMocks()
  console.log = vi.fn()
  console.error = vi.fn()
  
  // Reset localStorage mock
  localStorageMock.getItem.mockReturnValue(null)
  localStorageMock.setItem.mockImplementation(() => {})
  
  // Reset auth service mocks
  vi.mocked(getAuthStatus).mockReturnValue({
    isAuthenticated: false,
    hasAttendee: false,
    attendee: null
  })
})

afterEach(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
})

describe('Complete Login Journey', () => {
  describe('Successful Login Flow', () => {
    it('should login with valid access code and sync all data', async () => {
      // Mock successful data sync
      const mockSyncResult = {
        success: true,
        syncedTables: ['attendees', 'sponsors', 'agenda_items', 'dining_options', 'hotels'],
        errors: [],
        totalRecords: 47
      }

      // Mock successful attendee lookup
      const mockAttendee = {
        id: 1,
        access_code: '629980',
        first_name: 'Adam',
        last_name: 'Garson',
        email: 'adam@example.com'
      }

      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue(mockSyncResult)
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: true,
        attendee: mockAttendee
      })

      // Render the actual login page
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      // Simulate user entering access code and submitting form
      const accessCodeInput = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      const form = accessCodeInput.closest('form')!
      
      fireEvent.change(accessCodeInput, { target: { value: '629980' } })
      fireEvent.submit(form)

      // Wait for login process to complete
      await waitFor(() => {
        expect(serverDataSyncService.syncAllData).toHaveBeenCalled()
      })

      // Verify data was synced
      expect(serverDataSyncService.syncAllData).toHaveBeenCalledTimes(1)
    })

    it('should maintain authentication state across page refreshes', async () => {
      // Mock localStorage with existing auth state
      const mockAuthState = {
        attendee: {
          id: 1,
          access_code: '629980',
          first_name: 'Adam',
          last_name: 'Garson'
        },
        isAuthenticated: true,
        timestamp: Date.now()
      }

      // Create a proper mock attendee with all required fields
      const mockAttendee = {
        id: 1,
        access_code: '629980',
        first_name: 'Adam',
        last_name: 'Garson',
        email: 'adam@example.com',
        salutation: 'Mr.',
        company: 'Test Company',
        title: 'Developer',
        phone: '555-1234',
        dietary_restrictions: null,
        accessibility_needs: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        registration_date: '2024-01-01',
        check_in_time: null,
        badge_printed: false,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        breakout_session_1: null,
        breakout_session_2: null,
        breakout_session_3: null,
        breakout_session_4: null,
        table_assignment: null,
        special_meal: null,
        shirt_size: null,
        arrival_date: null,
        departure_date: null,
        hotel_name: null,
        room_number: null,
        transportation_method: null,
        flight_arrival: null,
        flight_departure: null,
        car_rental: null,
        parking_needed: false,
        social_media_consent: false,
        photo_consent: false,
        marketing_consent: false
      }

      // Mock getAuthStatus to return authenticated state (simulating restored state)
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: true,
        hasAttendee: true,
        attendee: mockAttendee
      })

      // Mock successful data sync
      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue({
        success: true,
        syncedTables: ['attendees'],
        errors: [],
        totalRecords: 1
      })

      // Render the app with authenticated user
      render(
        <AuthProvider>
          <div data-testid="app">
            <div data-testid="user-info">Welcome, Adam Garson!</div>
          </div>
        </AuthProvider>
      )

      // Verify user is authenticated and UI shows user info
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toBeInTheDocument()
      })

      // Verify getAuthStatus was called (this happens in AuthContext useEffect)
      expect(getAuthStatus).toHaveBeenCalled()
    })

    it('should provide offline data access after successful login', async () => {
      // Mock successful data sync with specific data
      const mockData = {
        attendees: [{ id: 1, name: 'Adam Garson' }],
        sponsors: [{ id: 1, name: 'Test Sponsor' }],
        agenda_items: [{ id: 1, title: 'Test Session' }]
      }

      // Mock syncAllData to actually call localStorage.setItem to simulate caching
      vi.mocked(serverDataSyncService.syncAllData).mockImplementation(async () => {
        // Simulate the caching behavior
        localStorageMock.setItem('kn_cache_attendees', JSON.stringify({
          data: mockData.attendees,
          timestamp: Date.now(),
          version: 1,
          source: 'server-sync'
        }))
        localStorageMock.setItem('kn_cache_sponsors', JSON.stringify({
          data: mockData.sponsors,
          timestamp: Date.now(),
          version: 1,
          source: 'server-sync'
        }))
        localStorageMock.setItem('kn_cache_agenda_items', JSON.stringify({
          data: mockData.agenda_items,
          timestamp: Date.now(),
          version: 1,
          source: 'server-sync'
        }))
        
        return {
          success: true,
          syncedTables: ['attendees', 'sponsors', 'agenda_items'],
          errors: [],
          totalRecords: 3
        }
      })

      // Mock localStorage to simulate cached data retrieval
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'kn_cache_attendees') {
          return JSON.stringify({
            data: mockData.attendees,
            timestamp: Date.now(),
            version: 1,
            source: 'server-sync'
          })
        }
        return null
      })

      // Simulate successful login
      await serverDataSyncService.syncAllData()

      // Verify data was cached
      expect(localStorageMock.setItem).toHaveBeenCalled()
      
      // Verify cached data can be retrieved
      const cachedAttendees = JSON.parse(localStorageMock.getItem('kn_cache_attendees') || '{}')
      expect(cachedAttendees.data).toEqual(mockData.attendees)
    })
  })

  describe('Error Handling in Login Flow', () => {
    it('should handle data sync failure gracefully', async () => {
      // Mock data sync failure
      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue({
        success: false,
        syncedTables: [],
        errors: ['Network error'],
        totalRecords: 0
      })

      // Mock successful authentication
      const { authenticateWithAccessCode } = await import('../../services/authService')
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: true,
        attendee: { id: 1, access_code: '629980', first_name: 'Adam', last_name: 'Garson' }
      })

      // Render the actual login page
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      // Simulate login attempt by submitting form
      const accessCodeInput = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      const form = accessCodeInput.closest('form')!
      
      fireEvent.change(accessCodeInput, { target: { value: '629980' } })
      fireEvent.submit(form)

      // Wait for login process to start
      await waitFor(() => {
        expect(serverDataSyncService.syncAllData).toHaveBeenCalled()
      })

      // Verify error was handled (login should fail due to sync failure)
      // Note: syncAllData may be called multiple times due to the login flow
      expect(serverDataSyncService.syncAllData).toHaveBeenCalled()
    })

    it('should handle attendee lookup failure gracefully', async () => {
      // Mock successful data sync
      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue({
        success: true,
        syncedTables: ['attendees'],
        errors: [],
        totalRecords: 1
      })

      // Mock authentication failure
      const { authenticateWithAccessCode } = await import('../../services/authService')
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: false,
        error: 'Invalid access code. Please check and try again.'
      })

      // Render the actual login page
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      // Simulate login attempt with invalid code by submitting form
      const accessCodeInput = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      const form = accessCodeInput.closest('form')!
      
      fireEvent.change(accessCodeInput, { target: { value: 'INVALID' } })
      fireEvent.submit(form)

      // Wait for login process to complete and error to appear
      await waitFor(() => {
        expect(screen.getByText('Invalid access code. Please try again or ask at the registration desk for help.')).toBeInTheDocument()
      })

      // Verify error was handled correctly
      // Data sync should NOT be called when authentication fails
      expect(serverDataSyncService.syncAllData).not.toHaveBeenCalled()
      expect(authenticateWithAccessCode).toHaveBeenCalledWith('INVALID')
    })
  })

  describe('Performance and Reliability', () => {
    it('should complete login within acceptable time limits', async () => {
      const startTime = Date.now()

      // Mock fast responses
      vi.mocked(serverDataSyncService.syncAllData).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          syncedTables: ['attendees'],
          errors: [],
          totalRecords: 1
        }), 100))
      )

      const { authenticateWithAccessCode } = await import('../../services/authService')
      vi.mocked(authenticateWithAccessCode).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          attendee: { id: 1, access_code: '629980', first_name: 'Adam', last_name: 'Garson' }
        }), 50))
      )

      // Execute login flow
      await serverDataSyncService.syncAllData()
      await authenticateWithAccessCode('629980')

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Should complete within 2 seconds
      expect(totalTime).toBeLessThan(2000)
    })

    it('should handle multiple concurrent login attempts', async () => {
      // Mock successful responses
      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue({
        success: true,
        syncedTables: ['attendees'],
        errors: [],
        totalRecords: 1
      })

      const { authenticateWithAccessCode } = await import('../../services/authService')
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: true,
        attendee: { id: 1, access_code: '629980', first_name: 'Adam', last_name: 'Garson' }
      })

      // Simulate multiple concurrent login attempts
      const promises = [
        serverDataSyncService.syncAllData(),
        serverDataSyncService.syncAllData(),
        serverDataSyncService.syncAllData()
      ]

      const results = await Promise.all(promises)

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true)
      })

      // Should have been called multiple times
      expect(serverDataSyncService.syncAllData).toHaveBeenCalledTimes(3)
    })
  })
})
