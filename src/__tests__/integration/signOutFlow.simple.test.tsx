/**
 * Simplified Sign-Out Flow Integration Tests
 * Story 1.6: Sign-Out Data Clear & Navigation
 * 
 * Focused tests for core sign-out functionality without complex mocking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import SettingsPage from '../../pages/SettingsPage'

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

// Mock the data clearing service
vi.mock('../../services/dataClearingService', () => ({
  dataClearingService: {
    clearAllData: vi.fn(),
    verifyDataCleared: vi.fn()
  }
}))

describe('Sign-Out Flow Integration - Simplified', () => {
  let mockDataClearingService: any
  let mockAuthService: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get mocked services
    const { dataClearingService } = await import('../../services/dataClearingService')
    const { signOut } = await import('../../services/authService')
    
    mockDataClearingService = dataClearingService
    mockAuthService = { signOut }
    
    // Setup successful mocks
    mockDataClearingService.clearAllData.mockResolvedValue({
      success: true,
      clearedData: {
        localStorage: true,
        attendeeInfo: true,
        pwaCache: true,
        indexedDB: true,
        serviceWorkerCaches: true
      },
      errors: [],
      performanceMetrics: { duration: 100 }
    })
    
    mockDataClearingService.verifyDataCleared.mockResolvedValue(true)
    // Ensure the global mock is used
    vi.mocked(signOut).mockResolvedValue({ success: true })
  })

  it('should render SettingsPage with sign-out button', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </BrowserRouter>
    )

    // Verify page renders
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    
    // Verify sign-out button exists
    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    expect(signOutButton).toBeInTheDocument()
    expect(signOutButton).not.toBeDisabled()
  })

  it('should show loading state when sign-out button is clicked', async () => {
    // Mock slow data clearing
    mockDataClearingService.clearAllData.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        clearedData: { localStorage: true, attendeeInfo: true, pwaCache: true, indexedDB: true, serviceWorkerCaches: true },
        errors: [],
        performanceMetrics: { duration: 100 }
      }), 100))
    )

    render(
      <BrowserRouter>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </BrowserRouter>
    )

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    
    // Click sign-out button
    fireEvent.click(signOutButton)

    // Verify loading state
    expect(screen.getByText(/signing out/i)).toBeInTheDocument()
    expect(signOutButton).toBeDisabled()
  })

  it('should call data clearing service when sign-out is clicked', async () => {
    // Mock successful data clearing
    mockDataClearingService.clearAllData.mockResolvedValue({
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
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </BrowserRouter>
    )

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(signOutButton)

    // Wait for data clearing to be called
    await waitFor(() => {
      expect(mockDataClearingService.clearAllData).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('should navigate to login page after successful sign-out', async () => {
    // Mock successful data clearing
    mockDataClearingService.clearAllData.mockResolvedValue({
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
    
    // Ensure auth service signOut returns success
    vi.mocked(mockAuthService.signOut).mockReturnValue({ success: true })
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </BrowserRouter>
    )

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(signOutButton)

    // Wait for data clearing to complete
    await waitFor(() => {
      expect(mockDataClearingService.clearAllData).toHaveBeenCalled()
    }, { timeout: 3000 })

    // Verify navigation was called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    }, { timeout: 2000 })
  })

  it('should handle sign-out errors gracefully', async () => {
    // Mock data clearing failure
    mockDataClearingService.clearAllData.mockRejectedValue(new Error('Data clearing failed'))

    render(
      <BrowserRouter>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </BrowserRouter>
    )

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(signOutButton)

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText(/data clearing failed/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should verify data clearing after sign-out', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </BrowserRouter>
    )

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(signOutButton)

    // Wait for verification to be called
    await waitFor(() => {
      expect(mockDataClearingService.verifyDataCleared).toHaveBeenCalled()
    }, { timeout: 3000 })
  })
})
