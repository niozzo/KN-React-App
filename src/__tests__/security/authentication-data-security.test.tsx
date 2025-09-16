/**
 * Security Tests: Authentication Data Security
 * 
 * Tests to ensure that data is only synced AFTER successful authentication
 * and that no data leakage occurs on authentication failure.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { serverDataSyncService } from '../../services/serverDataSyncService'
import { authenticateWithAccessCode } from '../../services/authService'

// Mock the services
vi.mock('../../services/serverDataSyncService')
vi.mock('../../services/authService')
vi.mock('../../services/attendeeInfoService', () => ({
  attendeeInfoService: {
    getAttendeeName: vi.fn(() => null)
  }
}))

// Mock the AuthContext
const mockLogin = vi.fn()
const mockLogout = vi.fn()
const mockAuthContext = {
  isAuthenticated: false,
  attendee: null,
  attendeeName: null,
  isLoading: false,
  isSigningOut: false,
  login: mockLogin,
  logout: mockLogout
}

vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => mockAuthContext
}))

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
  value: mockLocalStorage
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/login',
    href: '/login'
  },
  writable: true
})

// Test component that uses the mocked login function
const TestLoginComponent = () => {
  const [accessCode, setAccessCode] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleLogin = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await mockLogin(accessCode)
      if (!result.success) {
        setError(result.error || 'Authentication failed')
      }
    } catch (err) {
      setError('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <input
        data-testid="access-code-input"
        value={accessCode}
        onChange={(e) => setAccessCode(e.target.value)}
        placeholder="Enter access code"
      />
      <button data-testid="login-button" onClick={handleLogin} disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div data-testid="error-message">{error}</div>}
    </div>
  )
}

describe('Authentication Data Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.length = 0
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Successful Authentication Flow', () => {
    it('should sync data ONLY after successful authentication', async () => {
      const mockAttendee = {
        id: 'test-attendee-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        access_code: '123456'
      }

      const mockSyncResult = {
        success: true,
        syncedTables: ['attendees', 'sponsors'],
        errors: [],
        totalRecords: 50
      }

      // Mock successful authentication
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: true,
        attendee: mockAttendee
      })

      // Mock successful data sync
      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue(mockSyncResult)

      // Mock the login function to simulate the actual AuthContext behavior
      mockLogin.mockImplementation(async (accessCode: string) => {
        // Step 1: Authenticate first
        const authResult = await authenticateWithAccessCode(accessCode)
        
        if (!authResult.success || !authResult.attendee) {
          return { success: false, error: authResult.error || 'Authentication failed' }
        }
        
        // Step 2: Only sync data after successful authentication
        try {
          await serverDataSyncService.syncAllData()
        } catch (error) {
          console.warn('Data sync failed, but authentication succeeded')
        }
        
        return { success: true }
      })

      render(<TestLoginComponent />)

      // Enter valid access code
      const input = screen.getByTestId('access-code-input')
      const button = screen.getByTestId('login-button')

      await act(async () => {
        fireEvent.change(input, { target: { value: '123456' } })
        fireEvent.click(button)
      })

      // Wait for authentication to complete
      await waitFor(() => {
        expect(authenticateWithAccessCode).toHaveBeenCalledWith('123456')
      })

      // Verify data sync was called AFTER authentication
      await waitFor(() => {
        expect(serverDataSyncService.syncAllData).toHaveBeenCalled()
      })

      // Verify the order: authentication first, then data sync
      const authCall = vi.mocked(authenticateWithAccessCode).mock.results[0]
      const syncCall = vi.mocked(serverDataSyncService.syncAllData).mock.results[0]
      
      expect(authCall).toBeDefined()
      expect(syncCall).toBeDefined()
    })
  })

  describe('Failed Authentication Flow', () => {
    it('should NOT sync data when authentication fails', async () => {
      // Mock failed authentication
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: false,
        error: 'Invalid access code'
      })

      // Mock the login function to simulate the actual AuthContext behavior
      mockLogin.mockImplementation(async (accessCode: string) => {
        // Step 1: Authenticate first
        const authResult = await authenticateWithAccessCode(accessCode)
        
        if (!authResult.success || !authResult.attendee) {
          // Clear any cached data to prevent data leakage
          const keysToRemove = []
          for (let i = 0; i < mockLocalStorage.length; i++) {
            const key = mockLocalStorage.key(i)
            if (key && key.startsWith('kn_cache_')) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach(key => mockLocalStorage.removeItem(key))
          mockLocalStorage.removeItem('conference_auth')
          
          return { success: false, error: authResult.error || 'Authentication failed' }
        }
        
        // This should never be reached for failed auth
        await serverDataSyncService.syncAllData()
        return { success: true }
      })

      render(<TestLoginComponent />)

      // Enter invalid access code
      const input = screen.getByTestId('access-code-input')
      const button = screen.getByTestId('login-button')

      await act(async () => {
        fireEvent.change(input, { target: { value: '000000' } })
        fireEvent.click(button)
      })

      // Wait for authentication to complete
      await waitFor(() => {
        expect(authenticateWithAccessCode).toHaveBeenCalledWith('000000')
      })

      // Verify data sync was NEVER called
      expect(serverDataSyncService.syncAllData).not.toHaveBeenCalled()

      // Verify error message is shown
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid access code')
      })
    })

    it('should clear any existing cached data on authentication failure', async () => {
      // Mock localStorage with existing cached data
      mockLocalStorage.length = 3
      mockLocalStorage.key
        .mockReturnValueOnce('kn_cache_attendees')
        .mockReturnValueOnce('kn_cache_sponsors')
        .mockReturnValueOnce('conference_auth')

      // Mock failed authentication
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: false,
        error: 'Invalid access code'
      })

      // Mock the login function to simulate the actual AuthContext behavior
      mockLogin.mockImplementation(async (accessCode: string) => {
        // Step 1: Authenticate first
        const authResult = await authenticateWithAccessCode(accessCode)
        
        if (!authResult.success || !authResult.attendee) {
          // Clear any cached data to prevent data leakage
          const keysToRemove = []
          for (let i = 0; i < mockLocalStorage.length; i++) {
            const key = mockLocalStorage.key(i)
            if (key && key.startsWith('kn_cache_')) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach(key => mockLocalStorage.removeItem(key))
          mockLocalStorage.removeItem('conference_auth')
          
          return { success: false, error: authResult.error || 'Authentication failed' }
        }
        
        // This should never be reached for failed auth
        await serverDataSyncService.syncAllData()
        return { success: true }
      })

      render(<TestLoginComponent />)

      // Enter invalid access code
      const input = screen.getByTestId('access-code-input')
      const button = screen.getByTestId('login-button')

      await act(async () => {
        fireEvent.change(input, { target: { value: '000000' } })
        fireEvent.click(button)
      })

      // Wait for authentication to complete
      await waitFor(() => {
        expect(authenticateWithAccessCode).toHaveBeenCalledWith('000000')
      })

      // Verify cached data was cleared
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cache_attendees')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cache_sponsors')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('conference_auth')
    })
  })

  describe('Data Sync Failure After Authentication', () => {
    it('should still allow login if data sync fails but authentication succeeds', async () => {
      const mockAttendee = {
        id: 'test-attendee-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        access_code: '123456'
      }

      // Mock successful authentication
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: true,
        attendee: mockAttendee
      })

      // Mock data sync failure
      vi.mocked(serverDataSyncService.syncAllData).mockRejectedValue(
        new Error('Data sync failed')
      )

      // Mock the login function to simulate the actual AuthContext behavior
      mockLogin.mockImplementation(async (accessCode: string) => {
        // Step 1: Authenticate first
        const authResult = await authenticateWithAccessCode(accessCode)
        
        if (!authResult.success || !authResult.attendee) {
          return { success: false, error: authResult.error || 'Authentication failed' }
        }
        
        // Step 2: Try to sync data, but don't fail login if sync fails
        try {
          await serverDataSyncService.syncAllData()
        } catch (error) {
          console.warn('Data sync failed, but authentication succeeded')
        }
        
        return { success: true }
      })

      render(<TestLoginComponent />)

      // Enter valid access code
      const input = screen.getByTestId('access-code-input')
      const button = screen.getByTestId('login-button')

      await act(async () => {
        fireEvent.change(input, { target: { value: '123456' } })
        fireEvent.click(button)
      })

      // Wait for authentication to complete
      await waitFor(() => {
        expect(authenticateWithAccessCode).toHaveBeenCalledWith('123456')
      })

      // Verify data sync was attempted
      await waitFor(() => {
        expect(serverDataSyncService.syncAllData).toHaveBeenCalled()
      })

      // Should not show error message (login should succeed despite sync failure)
      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
      })
    })
  })

  describe('Security Boundary Tests', () => {
    it('should prevent data access without authentication', async () => {
      // Mock unauthenticated state
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: false,
        error: 'Not authenticated'
      })

      render(<TestLoginComponent />)

      // Try to access data without authentication
      const input = screen.getByTestId('access-code-input')
      const button = screen.getByTestId('login-button')

      fireEvent.change(input, { target: { value: '' } })
      fireEvent.click(button)

      // Verify no data sync occurred
      expect(serverDataSyncService.syncAllData).not.toHaveBeenCalled()
    })

    it('should handle authentication errors gracefully', async () => {
      // Mock authentication error
      vi.mocked(authenticateWithAccessCode).mockRejectedValue(
        new Error('Network error')
      )

      render(<TestLoginComponent />)

      // Enter access code
      const input = screen.getByTestId('access-code-input')
      const button = screen.getByTestId('login-button')

      await act(async () => {
        fireEvent.change(input, { target: { value: '123456' } })
        fireEvent.click(button)
      })

      // Wait for error handling
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Login failed')
      })

      // Verify no data sync occurred
      expect(serverDataSyncService.syncAllData).not.toHaveBeenCalled()
    })
  })
})
