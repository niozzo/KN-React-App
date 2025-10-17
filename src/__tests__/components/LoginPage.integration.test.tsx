/**
 * Integration Tests for LoginPage Component
 * 
 * Tests the ACTUAL LoginPage component from AuthContext with complete user journeys
 * Fixes critical issues:
 * 1. Test-implementation mismatch (tests real component, not mocks)
 * 2. Missing integration testing (complete user flows)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, LoginPage } from '../../contexts/AuthContext'
import { getAuthStatus, authenticateWithAccessCode } from '../../services/authService'
import { serverDataSyncService } from '../../services/serverDataSyncService'
import React from 'react'

// Mock the auth service
vi.mock('../../services/authService', () => ({
  getAuthStatus: vi.fn().mockReturnValue({
    isAuthenticated: false,
    attendee: null
  }),
  authenticateWithAccessCode: vi.fn()
}))

// Mock the server data sync service
vi.mock('../../services/serverDataSyncService', () => ({
  serverDataSyncService: {
    syncAllData: vi.fn().mockResolvedValue({
      success: true,
      syncedTables: ['attendees', 'agenda_items'],
      errors: [],
      totalRecords: 10
    })
  }
}))

// Mock attendeeInfoService
vi.mock('../../services/attendeeInfoService', () => ({
  attendeeInfoService: {
    getAttendeeName: vi.fn().mockReturnValue(null),
    extractAttendeeInfo: vi.fn(),
    storeAttendeeInfo: vi.fn()
  }
}))

// Mock dataClearingService
vi.mock('../../services/dataClearingService', () => ({
  dataClearingService: {
    clearAllData: vi.fn().mockResolvedValue({
      success: true,
      errors: [],
      performanceMetrics: { duration: 100 }
    }),
    verifyDataCleared: vi.fn().mockResolvedValue(true)
  }
}))

// Helper to render with Router context
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

// Test data constants for better maintainability
const TEST_DATA = {
  VALID_ACCESS_CODE: 'ABC123',
  INVALID_ACCESS_CODE: 'INVALI',
  MOCK_ATTENDEE: {
    id: '1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    salutation: 'Mr.',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    title: 'Developer',
    company: 'Test Corp',
    bio: '',
    photo: '',
    business_phone: '555-1234',
    mobile_phone: '555-1234',
    address1: '123 Main St',
    address2: '',
    postal_code: '12345',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    country_code: 'TC',
    check_in_date: '2024-01-01',
    check_out_date: '2024-01-02',
    hotel_selection: 'test-hotel',
    custom_hotel: '',
    room_type: 'King',
    registration_id: 'REG123',
    registration_status: 'confirmed',
    access_code: 'ABC123',
    has_spouse: false,
    spouse_details: {
      email: '',
      lastName: '',
      firstName: '',
      salutation: '',
      mobilePhone: '',
      dietaryRequirements: ''
    },
    dining_selections: {},
    selected_breakouts: [],
    dietary_requirements: '',
    attributes: {
      ceo: false,
      apaxIP: false,
      spouse: false,
      apaxOEP: false,
      speaker: false,
      cLevelExec: false,
      sponsorAttendee: false,
      otherAttendeeType: false,
      portfolioCompanyExecutive: false
    },
    is_cfo: false,
    is_apax_ep: false,
    assistant_name: '',
    assistant_email: '',
    idloom_id: '',
    last_synced_at: '2024-01-01T00:00:00Z'
  } as any
}

describe('LoginPage - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock setup
    vi.mocked(getAuthStatus).mockReturnValue({
      isAuthenticated: false,
      hasAttendee: false,
      attendee: null
    })
  })

  describe('Complete Login Flow', () => {
    it('should complete full successful login flow from input to authentication', async () => {
      // Mock successful data sync and authentication
      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue({
        success: true,
        syncedTables: ['attendees', 'standardized_companies'],
        totalRecords: 100,
        errors: []
      })
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: true,
        attendee: TEST_DATA.MOCK_ATTENDEE
      })

      // 1. Render the ACTUAL LoginPage component
      renderWithRouter(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      // 2. Verify initial state
      expect(screen.getByText('KnowledgeNow 2025')).toBeInTheDocument()
      expect(screen.getByText('Enter your 6-character access code')).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Enter your 6-character access code' })).toBeInTheDocument()

      // 3. Type access code (triggers auto-submit)
      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      await act(async () => {
        fireEvent.change(input, { target: { value: TEST_DATA.VALID_ACCESS_CODE } })
      })

      // 4. Verify loading state appears
      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      }, { timeout: 1000 })

      // 5. Verify input is dimmed during loading
      expect(input).toHaveStyle({ opacity: '0.7' })

      // 6. Verify authentication was called
      // Note: Data sync is now handled by ServiceOrchestrator
      await waitFor(() => {
        expect(vi.mocked(authenticateWithAccessCode)).toHaveBeenCalledWith(TEST_DATA.VALID_ACCESS_CODE)
      }, { timeout: 2000 })

      // 7. Verify loading spinner disappears after authentication
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should complete full failed login flow with error display', async () => {
      // Mock failed authentication - data sync should NOT be called
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: false,
        error: 'Invalid access code'
      })

      renderWithRouter(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      // Type invalid access code
      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      fireEvent.change(input, { target: { value: TEST_DATA.INVALID_ACCESS_CODE } })

      // Wait for loading state
      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      })

      // Wait for authentication to complete and error to appear
      await waitFor(() => {
        expect(screen.getByText('Invalid access code. Please try again or ask at the registration desk for help.')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verify services were called correctly
      // Data sync should NOT be called when authentication fails
      expect(vi.mocked(serverDataSyncService.syncAllData)).not.toHaveBeenCalled()
      expect(vi.mocked(authenticateWithAccessCode)).toHaveBeenCalledWith(TEST_DATA.INVALID_ACCESS_CODE)
    })

    it('should handle authentication service errors gracefully', async () => {
      // Mock data sync error
      vi.mocked(serverDataSyncService.syncAllData).mockRejectedValue(new Error('Network error'))

      renderWithRouter(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      fireEvent.change(input, { target: { value: TEST_DATA.VALID_ACCESS_CODE } })

      // Wait for error message
      // Note: The component shows a generic error message when data sync fails
      await waitFor(() => {
        expect(screen.getByText('Invalid access code. Please try again or ask at the registration desk for help.')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Auto-Submit Functionality', () => {
    it('should auto-submit when exactly 6 characters are entered', async () => {
      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue({
        success: true,
        syncedTables: ['attendees', 'standardized_companies'],
        totalRecords: 100,
        errors: []
      })
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: true,
        attendee: TEST_DATA.MOCK_ATTENDEE
      })

      renderWithRouter(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      
      // Type 5 characters - should not auto-submit
      fireEvent.change(input, { target: { value: 'ABC12' } })
      expect(vi.mocked(serverDataSyncService.syncAllData)).not.toHaveBeenCalled()
      
      // Type 6th character - should trigger auto-submit
      fireEvent.change(input, { target: { value: TEST_DATA.VALID_ACCESS_CODE } })
      
      await waitFor(() => {
        expect(vi.mocked(serverDataSyncService.syncAllData)).toHaveBeenCalled()
        expect(vi.mocked(authenticateWithAccessCode)).toHaveBeenCalledWith(TEST_DATA.VALID_ACCESS_CODE)
      }, { timeout: 2000 })
    })

    it('should not auto-submit when less than 6 characters', async () => {
      renderWithRouter(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      
      // Type 5 characters
      fireEvent.change(input, { target: { value: 'ABC12' } })
      
      // Wait a bit to ensure no auto-submit
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(vi.mocked(serverDataSyncService.syncAllData)).not.toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should show loading spinner during auto-submit', async () => {
      vi.mocked(serverDataSyncService.syncAllData).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          syncedTables: ['attendees', 'standardized_companies'],
          totalRecords: 100,
          errors: []
        }), 100))
      )
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: true,
        attendee: TEST_DATA.MOCK_ATTENDEE
      })

      renderWithRouter(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      
      // Type 6 characters to trigger auto-submit
      fireEvent.change(input, { target: { value: TEST_DATA.VALID_ACCESS_CODE } })
      
      // Should show loading spinner
      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      })
      
      // Input should be dimmed
      expect(input).toHaveStyle({ opacity: '0.7' })
    })
  })

  describe('Error Handling', () => {
    it('should display error message for invalid access code', async () => {
      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue({
        success: true,
        syncedTables: ['attendees', 'standardized_companies'],
        totalRecords: 100,
        errors: []
      })
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: false,
        error: 'Invalid access code'
      })

      renderWithRouter(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      
      // Type invalid access code
      fireEvent.change(input, { target: { value: TEST_DATA.INVALID_ACCESS_CODE } })
      
      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Invalid access code. Please try again or ask at the registration desk for help.')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should clear error when new input is entered', async () => {
      // First trigger an error
      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue({
        success: true,
        syncedTables: ['attendees', 'standardized_companies'],
        totalRecords: 100,
        errors: []
      })
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: false,
        error: 'Invalid access code'
      })

      renderWithRouter(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      
      // Trigger error
      fireEvent.change(input, { target: { value: TEST_DATA.INVALID_ACCESS_CODE } })
      
      await waitFor(() => {
        expect(screen.getByText('Invalid access code. Please try again or ask at the registration desk for help.')).toBeInTheDocument()
      })
      
      // Type new input - should clear error
      fireEvent.change(input, { target: { value: 'A' } })
      
      await waitFor(() => {
        expect(screen.queryByText('Invalid access code. Please try again or ask at the registration desk for help.')).not.toBeInTheDocument()
      })
    })
  })

  describe('Visual Styling', () => {
    it('should apply large, spaced input styling', () => {
      renderWithRouter(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      
      expect(input).toHaveStyle({ 
        textAlign: 'center',
        fontSize: '2rem',
        fontWeight: 'bold',
        letterSpacing: '0.5em',
        textTransform: 'uppercase',
        fontFamily: 'monospace'
      })
    })

    it('should convert input to uppercase', () => {
      renderWithRouter(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      
      // Type lowercase - should convert to uppercase
      fireEvent.change(input, { target: { value: 'abc123' } })
      expect(input).toHaveValue('ABC123')
    })
  })

  describe('Accessibility', () => {
    it('should have proper form accessibility attributes', () => {
      renderWithRouter(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      const label = screen.getByText('Enter your 6-character access code')

      expect(input).toHaveAttribute('type', 'text')
      expect(input).toHaveAttribute('required')
      expect(input).toHaveAttribute('maxLength', '6')
      expect(input).toHaveAttribute('id', 'accessCode')
      expect(label).toHaveAttribute('for', 'accessCode')
    })

    it('should have proper help text for users', () => {
      renderWithRouter(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      expect(screen.getByText('Ask registration for help if you can not find your access code')).toBeInTheDocument()
    })
  })
})
