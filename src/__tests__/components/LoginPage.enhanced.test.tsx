/**
 * Enhanced Tests for LoginPage Component
 * 
 * Tests the new auto-submit, loading states, error handling, and visual styling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AuthProvider, LoginPage } from '../../contexts/AuthContext'
import { getAuthStatus, authenticateWithAccessCode } from '../../services/authService'
import React from 'react'

// Mock the auth service
vi.mock('../../services/authService', () => ({
  getAuthStatus: vi.fn(),
  authenticateWithAccessCode: vi.fn()
}))

// Mock the data sync service
vi.mock('../../services/serverDataSyncService', () => ({
  serverDataSyncService: {
    lookupAttendeeByAccessCode: vi.fn(),
    syncAllData: vi.fn().mockResolvedValue({
      success: true,
      syncedTables: ['attendees', 'sponsors', 'agenda_items'],
      errors: [],
      totalRecords: 10
    })
  }
}))

describe('LoginPage - Enhanced Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Auto-Submit Functionality', () => {
    it('should auto-submit when 6th character is entered', async () => {
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: false,
        hasAttendee: false,
        attendee: null
      })

      // Mock the auth service that the AuthContext actually uses
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: true,
        attendee: {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          company: 'Test Corp',
          access_code: 'ABC123'
        }
      })

      // Render the actual LoginPage component
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      
      // Type 5 characters - should not auto-submit
      fireEvent.change(input, { target: { value: 'ABC12' } })
      expect(input).toHaveValue('ABC12')
      
      // Type 6th character - should trigger auto-submit
      fireEvent.change(input, { target: { value: 'ABC123' } })
      
      // Wait for auto-submit to trigger (with longer timeout for the 500ms delay)
      await waitFor(() => {
        expect(authenticateWithAccessCode).toHaveBeenCalledWith('ABC123')
      }, { timeout: 2000 })
      
      // Verify the authentication flow completed successfully
      await waitFor(() => {
        expect(screen.queryByText('Invalid access code')).not.toBeInTheDocument()
      }, { timeout: 1000 })
      
      // After auto-submit, the input should be cleared
      await waitFor(() => {
        expect(input).toHaveValue('')
      }, { timeout: 1000 })
    })

    it('should not auto-submit when less than 6 characters', async () => {
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: false,
        hasAttendee: false,
        attendee: null
      })

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      
      // Type 5 characters - should not auto-submit
      fireEvent.change(input, { target: { value: 'ABC12' } })
      expect(input).toHaveValue('ABC12')
      
      // Wait a bit to ensure no auto-submit
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Should not have called submit
      expect(authenticateWithAccessCode).not.toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should show loading spinner during auto-submit', async () => {
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: false,
        hasAttendee: false,
        attendee: null
      })

      // Mock a delayed response to test loading state
      vi.mocked(authenticateWithAccessCode).mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              attendee: { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', company: 'Test Corp', access_code: 'ABC123' }
            })
          }, 1000) // 1 second delay to ensure loading state is visible
        })
      )

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      
      // Type 6 characters to trigger auto-submit
      fireEvent.change(input, { target: { value: 'ABC123' } })
      
      // Should show loading spinner
      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      })
      
      // Input should be dimmed
      expect(input).toHaveStyle({ opacity: '0.7' })
      
      // Wait for the async operation to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Error Display', () => {
    it('should display error message for invalid access code', async () => {
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: false,
        hasAttendee: false,
        attendee: null
      })

      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: false,
        error: 'Invalid access code. Please try again or ask at the registration desk for help.'
      })

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      
      // Type invalid access code (6 characters)
      fireEvent.change(input, { target: { value: 'INVALI' } })
      
      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Invalid access code. Please try again or ask at the registration desk for help.')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should clear error when new input is entered', async () => {
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: false,
        hasAttendee: false,
        attendee: null
      })

      // First trigger an error with invalid code
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: false,
        error: 'Invalid access code. Please try again or ask at the registration desk for help.'
      })

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      
      // Trigger error with invalid 6-character code
      fireEvent.change(input, { target: { value: 'INVALI' } })
      
      // Wait for error to appear (with longer timeout for auto-submit)
      await waitFor(() => {
        expect(screen.getByText('Invalid access code. Please try again or ask at the registration desk for help.')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      // Type new input - should clear error
      fireEvent.change(input, { target: { value: 'A' } })
      
      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Invalid access code. Please try again or ask at the registration desk for help.')).not.toBeInTheDocument()
      })
    })
  })

  describe('Visual Styling', () => {
    it('should apply large, spaced input styling', () => {
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: false,
        hasAttendee: false,
        attendee: null
      })

      render(
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
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: false,
        hasAttendee: false,
        attendee: null
      })

      render(
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

  describe('Real Authentication Flow Integration', () => {
    it('should complete full authentication flow with real component', async () => {
      // Start with unauthenticated state
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: false,
        hasAttendee: false,
        attendee: null
      })

      // Mock successful authentication
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: true,
        attendee: {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          company: 'Test Corp',
          access_code: 'ABC123'
        }
      })

      // Mock successful data sync
      const { serverDataSyncService } = await import('../../services/serverDataSyncService')
      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue({
        success: true,
        syncedTables: ['attendees', 'sponsors', 'agenda_items'],
        errors: [],
        totalRecords: 10
      })

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      )

      const input = screen.getByRole('textbox', { name: 'Enter your 6-character access code' })
      
      // Enter valid access code
      fireEvent.change(input, { target: { value: 'ABC123' } })
      
      // Verify authentication service was called
      await waitFor(() => {
        expect(authenticateWithAccessCode).toHaveBeenCalledWith('ABC123')
      }, { timeout: 2000 })
      
      // Verify data sync was called
      await waitFor(() => {
        expect(serverDataSyncService.syncAllData).toHaveBeenCalled()
      }, { timeout: 2000 })
      
      // Verify no error messages are shown
      await waitFor(() => {
        expect(screen.queryByText('Invalid access code')).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })
})
