/**
 * Tests for AttendeeInfoDisplay Component
 * 
 * Tests example component demonstrating attendee information usage
 * Story 1.5: Attendee Information Extraction & Easy Access
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AttendeeInfoDisplay } from '../../components/AttendeeInfoDisplay'
import { useAttendeeInfo } from '../../hooks/useAttendeeInfo'

// Mock useAttendeeInfo hook
const mockUseAttendeeInfo = {
  getFirstName: vi.fn(),
  getLastName: vi.fn(),
  getFullName: vi.fn(),
  getFullInfo: vi.fn(),
  hasInfo: vi.fn(),
  isAuthenticated: false
}

vi.mock('../../hooks/useAttendeeInfo', () => ({
  useAttendeeInfo: () => mockUseAttendeeInfo
}))

describe('AttendeeInfoDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to default state
    mockUseAttendeeInfo.isAuthenticated = false
    mockUseAttendeeInfo.hasInfo.mockReturnValue(false)
  })

  describe('when not authenticated', () => {
    it('should display not authenticated message', () => {
      render(<AttendeeInfoDisplay />)

      expect(screen.getByText('Not authenticated')).toBeInTheDocument()
    })

    it('should not display attendee information', () => {
      render(<AttendeeInfoDisplay />)

      expect(screen.queryByText(/Welcome/)).not.toBeInTheDocument()
      expect(screen.queryByText(/First Name/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Last Name/)).not.toBeInTheDocument()
    })
  })

  describe('when authenticated but no info available', () => {
    beforeEach(() => {
      mockUseAttendeeInfo.isAuthenticated = true
      mockUseAttendeeInfo.hasInfo.mockReturnValue(false)
    })

    it('should display loading message', () => {
      render(<AttendeeInfoDisplay />)

      expect(screen.getByText('Loading attendee information...')).toBeInTheDocument()
    })

    it('should not display attendee information', () => {
      render(<AttendeeInfoDisplay />)

      expect(screen.queryByText(/Welcome/)).not.toBeInTheDocument()
    })
  })

  describe('when authenticated with basic info', () => {
    beforeEach(() => {
      mockUseAttendeeInfo.isAuthenticated = true
      mockUseAttendeeInfo.hasInfo.mockReturnValue(true)
      mockUseAttendeeInfo.getFullName.mockReturnValue('John Doe')
      mockUseAttendeeInfo.getFirstName.mockReturnValue('John')
      mockUseAttendeeInfo.getLastName.mockReturnValue('Doe')
    })

    it('should display welcome message with full name', () => {
      render(<AttendeeInfoDisplay />)

      expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument()
    })

    it('should display basic name information', () => {
      render(<AttendeeInfoDisplay />)

      expect(screen.getByText('First Name: John')).toBeInTheDocument()
      expect(screen.getByText('Last Name: Doe')).toBeInTheDocument()
      expect(screen.getByText('Full Name: John Doe')).toBeInTheDocument()
    })

    it('should not display full info by default', () => {
      render(<AttendeeInfoDisplay />)

      expect(screen.queryByText(/Email/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Company/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Title/)).not.toBeInTheDocument()
    })
  })

  describe('when showFullInfo is true', () => {
    beforeEach(() => {
      mockUseAttendeeInfo.isAuthenticated = true
      mockUseAttendeeInfo.hasInfo.mockReturnValue(true)
      mockUseAttendeeInfo.getFullName.mockReturnValue('Jane Smith')
      mockUseAttendeeInfo.getFirstName.mockReturnValue('Jane')
      mockUseAttendeeInfo.getLastName.mockReturnValue('Smith')
      mockUseAttendeeInfo.getFullInfo.mockReturnValue({
        id: '123',
        first_name: 'Jane',
        last_name: 'Smith',
        full_name: 'Jane Smith',
        email: 'jane.smith@example.com',
        company: 'Tech Corp',
        title: 'CTO'
      })
    })

    it('should display full attendee details', () => {
      render(<AttendeeInfoDisplay showFullInfo={true} />)

      expect(screen.getByText('Welcome, Jane Smith!')).toBeInTheDocument()
      expect(screen.getByText(/Name:\s*Jane\s*Smith/)).toBeInTheDocument()
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'Email: jane.smith@example.com' || false
      })).toBeInTheDocument()
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'Company: Tech Corp' || false
      })).toBeInTheDocument()
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'Title: CTO' || false
      })).toBeInTheDocument()
    })

    it('should still display basic name information', () => {
      render(<AttendeeInfoDisplay showFullInfo={true} />)

      expect(screen.getByText('First Name: Jane')).toBeInTheDocument()
      expect(screen.getByText('Last Name: Smith')).toBeInTheDocument()
      expect(screen.getByText('Full Name: Jane Smith')).toBeInTheDocument()
    })
  })

  describe('when getFullInfo returns null', () => {
    beforeEach(() => {
      mockUseAttendeeInfo.isAuthenticated = true
      mockUseAttendeeInfo.hasInfo.mockReturnValue(true)
      mockUseAttendeeInfo.getFullName.mockReturnValue('John Doe')
      mockUseAttendeeInfo.getFullInfo.mockReturnValue(null)
    })

    it('should not display full info details', () => {
      render(<AttendeeInfoDisplay showFullInfo={true} />)

      expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument()
      expect(screen.queryByText(/Email/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Company/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Title/)).not.toBeInTheDocument()
    })
  })

  describe('with custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(<AttendeeInfoDisplay className="custom-class" />)

      expect(container.firstChild).toHaveClass('attendee-info', 'custom-class')
    })

    it('should work without className prop', () => {
      const { container } = render(<AttendeeInfoDisplay />)

      expect(container.firstChild).toHaveClass('attendee-info')
    })
  })

  describe('with empty names', () => {
    beforeEach(() => {
      mockUseAttendeeInfo.isAuthenticated = true
      mockUseAttendeeInfo.hasInfo.mockReturnValue(true)
      mockUseAttendeeInfo.getFullName.mockReturnValue('')
      mockUseAttendeeInfo.getFirstName.mockReturnValue('')
      mockUseAttendeeInfo.getLastName.mockReturnValue('')
    })

    it('should handle empty names gracefully', () => {
      render(<AttendeeInfoDisplay />)

      expect(screen.getByText('Welcome, !')).toBeInTheDocument()
      expect(screen.getByText('First Name:')).toBeInTheDocument()
      expect(screen.getByText('Last Name:')).toBeInTheDocument()
      expect(screen.getByText('Full Name:')).toBeInTheDocument()
    })
  })

  describe('component structure', () => {
    it('should render with correct structure', () => {
      mockUseAttendeeInfo.isAuthenticated = true
      mockUseAttendeeInfo.hasInfo.mockReturnValue(true)
      mockUseAttendeeInfo.getFullName.mockReturnValue('John Doe')

      const { container } = render(<AttendeeInfoDisplay />)

      expect(container.firstChild).toHaveClass('attendee-info')
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
    })

    it('should render attendee-details section when showFullInfo is true', () => {
      mockUseAttendeeInfo.isAuthenticated = true
      mockUseAttendeeInfo.hasInfo.mockReturnValue(true)
      mockUseAttendeeInfo.getFullName.mockReturnValue('John Doe')
      mockUseAttendeeInfo.getFullInfo.mockReturnValue({
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        title: 'CEO'
      })

      render(<AttendeeInfoDisplay showFullInfo={true} />)

      expect(screen.getByText(/Name:\s*John\s*Doe/)).toBeInTheDocument()
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'Email: john@example.com' || false
      })).toBeInTheDocument()
    })
  })
})
