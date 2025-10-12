/**
 * SessionCard Component - Dining Seat Assignment Display Tests
 * Story 2.1g.3.1: Dining Seat Assignment Display
 * 
 * Test Categories:
 * - Dining seat assignment display
 * - Pending assignment message
 * - Navigation to seat map
 * - Visual consistency
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SessionCard from '../../../components/session/SessionCard'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock useCountdown
vi.mock('../../../hooks/useCountdown', () => ({
  default: () => ({
    formattedTime: '45 minutes',
    isActive: true,
    minutesRemaining: 45
  })
}))

// Helper function to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('SessionCard - Dining Seat Assignment Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Dining Seat Assignment Display', () => {
    it('should display dining seat assignment when available', () => {
      // Arrange
      const session = {
        id: 'dining-1',
        title: 'Gala Dinner',
        type: 'dining',
        date: '2025-10-15',
        start_time: '18:00:00',
        end_time: '20:00:00',
        location: 'Grand Ballroom',
        seating_type: 'assigned',
        seatInfo: {
          table: 'Table 5',
          seat: 12,
          position: { x: 100, y: 200 }
        }
      }

      // Act
      renderWithRouter(<SessionCard session={session} variant="default" />)

      // Assert
      expect(screen.getByText('Your Seat')).toBeInTheDocument()
      expect(screen.getByText(/Table 5.*Seat 12/)).toBeInTheDocument()
      expect(screen.getByText('Find my seat')).toBeInTheDocument()
    })

    it('should display pending message for assigned seating without seat assignment', () => {
      // Arrange
      const session = {
        id: 'dining-2',
        title: 'Breakfast',
        type: 'dining',
        date: '2025-10-15',
        start_time: '08:00:00',
        end_time: '09:00:00',
        location: 'Restaurant',
        seating_type: 'assigned',
        seatInfo: null // No assignment yet
      }

      // Act
      renderWithRouter(<SessionCard session={session} variant="default" />)

      // Assert
      expect(screen.getByText('Seat Assignment')).toBeInTheDocument()
      expect(screen.getByText('Assignment pending')).toBeInTheDocument()
    })

    it('should NOT display seat info for open seating dining events', () => {
      // Arrange
      const session = {
        id: 'dining-3',
        title: 'Lunch Buffet',
        type: 'dining',
        date: '2025-10-15',
        start_time: '12:00:00',
        end_time: '13:00:00',
        location: 'Cafeteria',
        seating_type: 'open',
        seatInfo: null
      }

      // Act
      renderWithRouter(<SessionCard session={session} variant="default" />)

      // Assert
      expect(screen.queryByText('Your Seat')).not.toBeInTheDocument()
      expect(screen.queryByText('Seat Assignment')).not.toBeInTheDocument()
      expect(screen.queryByText('Assignment pending')).not.toBeInTheDocument()
    })
  })

  describe('Visual Consistency with Agenda Items', () => {
    it('should use same styling for dining seat assignments as agenda items', () => {
      // Arrange
      const diningSession = {
        id: 'dining-1',
        title: 'Dinner',
        type: 'dining',
        date: '2025-10-15',
        start_time: '19:00:00',
        seating_type: 'assigned',
        seatInfo: {
          table: 'Table 10',
          seat: 5
        }
      }

      const agendaSession = {
        id: 'agenda-1',
        title: 'Keynote',
        type: 'keynote',
        date: '2025-10-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        seating_type: 'assigned',
        seatInfo: {
          table: 'Table 3',
          seat: 8
        }
      }

      // Act - Render both
      const { container: diningContainer } = renderWithRouter(
        <SessionCard session={diningSession} variant="default" />
      )
      const { container: agendaContainer } = renderWithRouter(
        <SessionCard session={agendaSession} variant="default" />
      )

      // Assert - Both should have seat-assignment class
      const diningSeatDiv = diningContainer.querySelector('.seat-assignment')
      const agendaSeatDiv = agendaContainer.querySelector('.seat-assignment')
      
      expect(diningSeatDiv).toBeInTheDocument()
      expect(agendaSeatDiv).toBeInTheDocument()
      
      // Both should have similar structure
      expect(diningSeatDiv.querySelector('.seat-label')).toBeInTheDocument()
      expect(agendaSeatDiv.querySelector('.seat-label')).toBeInTheDocument()
    })
  })

  describe('Seat Map Navigation', () => {
    it('should navigate to seat map when clicking dining seat assignment', () => {
      // Arrange
      const session = {
        id: 'dining-1',
        title: 'Gala Dinner',
        type: 'dining',
        date: '2025-10-15',
        start_time: '18:00:00',
        location: 'Grand Ballroom',
        seating_type: 'assigned',
        seatInfo: {
          table: 'Table 5',
          seat: 12
        }
      }

      // Act
      renderWithRouter(<SessionCard session={session} variant="default" />)
      const seatAssignment = screen.getByText('Find my seat').closest('div')
      fireEvent.click(seatAssignment)

      // Assert
      expect(mockNavigate).toHaveBeenCalled()
      const navigationCall = mockNavigate.mock.calls[0][0]
      expect(navigationCall).toContain('seat-map')
      expect(navigationCall).toContain('dining-1')
      expect(navigationCall).toContain('Table 5')
    })

    it('should NOT navigate when clicking pending assignment message', () => {
      // Arrange
      const session = {
        id: 'dining-2',
        title: 'Breakfast',
        type: 'dining',
        date: '2025-10-15',
        start_time: '08:00:00',
        seating_type: 'assigned',
        seatInfo: null // No assignment
      }

      // Act
      renderWithRouter(<SessionCard session={session} variant="default" />)
      const pendingMessage = screen.getByText('Assignment pending')
      fireEvent.click(pendingMessage)

      // Assert
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should pass correct location information for dining events', () => {
      // Arrange
      const session = {
        id: 'dining-1',
        title: 'Awards Dinner',
        type: 'dining',
        date: '2025-10-15',
        start_time: '19:30:00',
        location: 'Crystal Ballroom',
        seating_type: 'assigned',
        seatInfo: {
          table: 'Table 8',
          seat: 3
        }
      }

      // Act
      renderWithRouter(<SessionCard session={session} variant="default" />)
      const seatAssignment = screen.getByText('Find my seat').closest('div')
      fireEvent.click(seatAssignment)

      // Assert
      expect(mockNavigate).toHaveBeenCalled()
      // Location should be passed in navigation
      const navigationCall = mockNavigate.mock.calls[0][0]
      expect(navigationCall).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle dining event without location', () => {
      // Arrange
      const session = {
        id: 'dining-1',
        title: 'Dinner',
        type: 'dining',
        date: '2025-10-15',
        start_time: '18:00:00',
        seating_type: 'assigned',
        location: null,
        seatInfo: {
          table: 'Table 1',
          seat: 1
        }
      }

      // Act & Assert - Should not crash
      expect(() => {
        renderWithRouter(<SessionCard session={session} variant="default" />)
      }).not.toThrow()
    })

    it('should handle missing seating_type field', () => {
      // Arrange
      const session = {
        id: 'dining-1',
        title: 'Reception',
        type: 'dining',
        date: '2025-10-15',
        start_time: '17:00:00',
        seatInfo: null
        // seating_type is missing
      }

      // Act & Assert - Should not crash
      expect(() => {
        renderWithRouter(<SessionCard session={session} variant="default" />)
      }).not.toThrow()

      // Should not show pending message without seating_type
      expect(screen.queryByText('Assignment pending')).not.toBeInTheDocument()
    })

    it('should handle incomplete seatInfo object', () => {
      // Arrange
      const session = {
        id: 'dining-1',
        title: 'Dinner',
        type: 'dining',
        date: '2025-10-15',
        start_time: '18:00:00',
        seating_type: 'assigned',
        seatInfo: {
          table: 'Table 5'
          // seat number missing
        }
      }

      // Act & Assert - Should not crash
      expect(() => {
        renderWithRouter(<SessionCard session={session} variant="default" />)
      }).not.toThrow()
    })
  })

  describe('Regression Tests - Agenda Item Seats', () => {
    it('should still display agenda item seat assignments correctly', () => {
      // Arrange
      const session = {
        id: 'agenda-1',
        title: 'Panel Discussion',
        type: 'panel-discussion',
        date: '2025-10-15',
        start_time: '14:00:00',
        end_time: '15:00:00',
        location: 'Conference Hall',
        seating_type: 'assigned',
        seatInfo: {
          table: 'Row 3',
          seat: 15
        }
      }

      // Act
      renderWithRouter(<SessionCard session={session} variant="default" />)

      // Assert
      expect(screen.getByText('Your Seat')).toBeInTheDocument()
      expect(screen.getByText(/Row 3.*Seat 15/)).toBeInTheDocument()
    })

    it('should NOT show pending message for agenda items without seatInfo', () => {
      // Arrange
      const session = {
        id: 'agenda-1',
        title: 'Workshop',
        type: 'workshop',
        date: '2025-10-15',
        start_time: '10:00:00',
        end_time: '11:00:00',
        seating_type: 'assigned',
        seatInfo: null
      }

      // Act
      renderWithRouter(<SessionCard session={session} variant="default" />)

      // Assert - Pending message is ONLY for dining events
      expect(screen.queryByText('Assignment pending')).not.toBeInTheDocument()
    })
  })

  describe('Multiple Variants', () => {
    it('should display seat info in "now" variant', () => {
      // Arrange
      const session = {
        id: 'dining-1',
        title: 'Dinner',
        type: 'dining',
        date: '2025-10-15',
        start_time: '18:00:00',
        end_time: '20:00:00',
        seating_type: 'assigned',
        seatInfo: {
          table: 'Table 7',
          seat: 9
        }
      }

      // Act
      renderWithRouter(<SessionCard session={session} variant="now" />)

      // Assert
      expect(screen.getByText(/Table 7.*Seat 9/)).toBeInTheDocument()
    })

    it('should display seat info in "next" variant', () => {
      // Arrange
      const session = {
        id: 'dining-1',
        title: 'Dinner',
        type: 'dining',
        date: '2025-10-15',
        start_time: '18:00:00',
        seating_type: 'assigned',
        seatInfo: {
          table: 'Table 2',
          seat: 4
        }
      }

      // Act
      renderWithRouter(<SessionCard session={session} variant="next" />)

      // Assert
      expect(screen.getByText(/Table 2.*Seat 4/)).toBeInTheDocument()
    })

    it('should display seat info in "agenda" variant', () => {
      // Arrange
      const session = {
        id: 'dining-1',
        title: 'Dinner',
        type: 'dining',
        date: '2025-10-15',
        start_time: '18:00:00',
        seating_type: 'assigned',
        seatInfo: {
          table: 'Table 11',
          seat: 6
        }
      }

      // Act
      renderWithRouter(<SessionCard session={session} variant="agenda" />)

      // Assert
      expect(screen.getByText(/Table 11.*Seat 6/)).toBeInTheDocument()
    })
  })
})

