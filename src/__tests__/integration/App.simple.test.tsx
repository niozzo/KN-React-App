/**
 * Simplified App Integration Tests
 * 
 * Tests the basic functionality that actually works
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../../App'
import { getAuthStatus } from '../../services/authService'

// Mock the auth service
vi.mock('../../services/authService', () => ({
  getAuthStatus: vi.fn()
}))

// Mock the pages to avoid complex dependencies
vi.mock('../../pages/HomePage.jsx', () => ({
  default: () => <div data-testid="home-page">Home Page Content</div>
}))

vi.mock('../../pages/MeetPage.jsx', () => ({
  default: () => <div data-testid="meet-page">Meet Page Content</div>
}))

vi.mock('../../pages/SchedulePage.jsx', () => ({
  default: () => <div data-testid="schedule-page">Schedule Page Content</div>
}))

vi.mock('../../pages/SponsorsPage.jsx', () => ({
  default: () => <div data-testid="sponsors-page">Sponsors Page Content</div>
}))

vi.mock('../../pages/SettingsPage.jsx', () => ({
  default: () => <div data-testid="settings-page">Settings Page Content</div>
}))

vi.mock('../../pages/BioPage.jsx', () => ({
  default: () => <div data-testid="bio-page">Bio Page Content</div>
}))

vi.mock('../../pages/SeatMapPage.jsx', () => ({
  default: () => <div data-testid="seat-map-page">Seat Map Page Content</div>
}))

describe('App - Basic Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial App Load', () => {
    it('should show login page when app loads without authentication', () => {
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: false,
        hasAttendee: false,
        attendee: null
      })

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      )

      expect(screen.getByText('KnowledgeNow 2025')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your access code')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('should show protected content when authenticated', () => {
      const mockAttendee = {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        company: 'Test Corp',
        access_code: 'TEST123'
      }

      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: true,
        hasAttendee: true,
        attendee: mockAttendee
      })

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      )

      expect(screen.getByTestId('home-page')).toBeInTheDocument()
      expect(screen.queryByText('KnowledgeNow 2025')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', () => {
      vi.mocked(getAuthStatus).mockImplementation(() => {
        throw new Error('Authentication check failed')
      })

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      )

      // Should show login page as fallback
      expect(screen.getByText('KnowledgeNow 2025')).toBeInTheDocument()
    })
  })
})
