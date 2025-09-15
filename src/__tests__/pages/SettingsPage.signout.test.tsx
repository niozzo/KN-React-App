/**
 * SettingsPage Sign-Out Button Tests
 * Story 1.6: Sign-Out Data Clear & Navigation
 * 
 * Focused tests for SettingsPage sign-out functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SettingsPage from '../../pages/SettingsPage'
import { AuthProvider } from '../../contexts/AuthContext'

// Import test setup
import '../setup/testSetup'

// Get mock functions
import { mockNavigate } from '../setup/testSetup'

// Mock useNavigate directly in this test file
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/settings',
      search: '',
      hash: '',
      state: null,
      key: 'test-key'
    }),
    BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
    MemoryRouter: ({ children }: { children: React.ReactNode }) => children,
    Link: ({ children, to, ...props }: any) => {
      const { createElement } = require('react')
      return createElement('a', { href: to, ...props }, children)
    },
    NavLink: ({ children, to, ...props }: any) => {
      const { createElement } = require('react')
      return createElement('a', { href: to, ...props }, children)
    }
  }
})

describe('SettingsPage Sign-Out Button', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Mock the services that AuthContext depends on
    const { dataClearingService } = await import('../../services/dataClearingService')
    vi.spyOn(dataClearingService, 'clearAllData').mockResolvedValue({ 
      success: true, 
      errors: [],
      clearedData: {
        localStorage: true,
        attendeeInfo: true,
        pwaCache: true,
        indexedDB: true,
        serviceWorker: true
      },
      performanceMetrics: { 
        startTime: 0,
        endTime: 100,
        duration: 100 
      } 
    })
    
    // Mock auth service functions
    const { getAuthStatus, signOut } = await import('../../services/authService')
    vi.mocked(getAuthStatus).mockReturnValue({
      isAuthenticated: true,
      attendee: {
        id: 'test-attendee',
        first_name: 'Test',
        last_name: 'User',
        access_code: 'TEST123'
      }
    })
    vi.mocked(signOut).mockReturnValue({ success: true })
    
    // Mock the verifyDataCleared method to return true
    vi.spyOn(dataClearingService, 'verifyDataCleared').mockResolvedValue(true)
  })

  it('should render sign-out button', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </BrowserRouter>
    )

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    expect(signOutButton).toBeInTheDocument()
    expect(signOutButton).not.toBeDisabled()
  })

  it('should call logout when sign-out button is clicked', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </BrowserRouter>
    )

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(signOutButton)

    // Wait for the sign-out process to complete
    await waitFor(() => {
      expect(screen.getByText(/signing out/i)).toBeInTheDocument()
    })
  })

  it('should navigate to login page after successful logout', async () => {
    // Mock data clearing success
    const { dataClearingService } = await import('../../services/dataClearingService')
    vi.spyOn(dataClearingService, 'clearAllData').mockResolvedValue({
      success: true,
      errors: [],
      clearedData: {
        localStorage: true,
        attendeeInfo: true,
        pwaCache: true,
        indexedDB: true,
        serviceWorker: true
      },
      performanceMetrics: {
        startTime: 0,
        endTime: 100,
        duration: 100
      }
    })
    vi.spyOn(dataClearingService, 'verifyDataCleared').mockResolvedValue(true)

    // Ensure auth service signOut returns success
    const { signOut } = await import('../../services/authService')
    vi.mocked(signOut).mockReturnValue({ success: true })

    render(
      <BrowserRouter>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </BrowserRouter>
    )

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(signOutButton)

    // Wait for the sign-out process to complete and navigation to occur
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    }, { timeout: 3000 })
  })

  it('should show loading state when signing out', async () => {
    // Mock slow data clearing to test loading state
    const { dataClearingService } = await import('../../services/dataClearingService')
    vi.spyOn(dataClearingService, 'clearAllData').mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true, errors: [], performanceMetrics: { duration: 100 } }), 100))
    )
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </BrowserRouter>
    )

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(signOutButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/signing out/i)).toBeInTheDocument()
    })
    expect(signOutButton).toBeDisabled()
  })

  it('should show error message when logout fails', async () => {
    // Mock data clearing failure
    const { dataClearingService } = await import('../../services/dataClearingService')
    vi.spyOn(dataClearingService, 'clearAllData').mockRejectedValue(new Error('Data clearing failed'))

    render(
      <BrowserRouter>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </BrowserRouter>
    )

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(signOutButton)

    await waitFor(() => {
      expect(screen.getByText(/data clearing failed/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should handle logout errors gracefully', async () => {
    // Mock data clearing failure
    const { dataClearingService } = await import('../../services/dataClearingService')
    vi.spyOn(dataClearingService, 'clearAllData').mockRejectedValue(new Error('Data clearing failed'))

    render(
      <BrowserRouter>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </BrowserRouter>
    )

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(signOutButton)

    await waitFor(() => {
      expect(screen.getByText(/data clearing failed/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show error message when data clearing fails', async () => {
    // Mock data clearing failure
    const { dataClearingService } = await import('../../services/dataClearingService')
    vi.spyOn(dataClearingService, 'clearAllData').mockRejectedValue(new Error('Data clearing failed'))

    render(
      <BrowserRouter>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </BrowserRouter>
    )

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(signOutButton)

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/data clearing failed/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Should not navigate when data clearing fails
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
