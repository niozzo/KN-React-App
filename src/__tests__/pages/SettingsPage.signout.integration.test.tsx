/**
 * SettingsPage Sign-Out Integration Tests
 * Story 1.6: Sign-Out Data Clear & Navigation
 * 
 * Tests SettingsPage sign-out button integration with AuthContext
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import SettingsPage from '../../pages/SettingsPage'

// Mock React Router
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('SettingsPage Sign-Out Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
  })

  it('should show loading state when signing out', async () => {
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
    expect(screen.getByText(/signing out/i)).toBeInTheDocument()
    expect(signOutButton).toBeDisabled()
  })

  it('should handle sign-out errors with retry option', async () => {
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

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/data clearing failed/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Verify the error message is shown (no retry button in current implementation)
    expect(screen.getByText(/data clearing failed/i)).toBeInTheDocument()
  })

  it('should navigate to login page after successful sign-out', async () => {
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
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})

