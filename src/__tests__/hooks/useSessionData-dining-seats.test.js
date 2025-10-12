/**
 * useSessionData Hook - Dining Seat Assignment Tests
 * Story 2.1g.3.1: Dining Seat Assignment Display
 * 
 * Test Categories:
 * - Dining seat info enhancement
 * - Agenda item seat info (regression)
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import useSessionData from '../../hooks/useSessionData'

// Mock dependencies
vi.mock('../../services/dataService', () => ({
  getAllAgendaItems: vi.fn(),
  getAllDiningOptions: vi.fn(),
  getAttendeeSeatAssignments: vi.fn()
}))

vi.mock('../../services/authService', () => ({
  getCurrentUser: vi.fn()
}))

vi.mock('../../services/cacheMonitoringService', () => ({
  CacheMonitoringService: vi.fn().mockImplementation(() => ({
    logStateTransition: vi.fn(),
    logCacheCorruption: vi.fn()
  })),
  cacheMonitoringService: {
    logStateTransition: vi.fn(),
    logCacheCorruption: vi.fn()
  }
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = mockLocalStorage

describe('useSessionData - Dining Seat Enhancement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('Dining Event Seat Info Enhancement', () => {
    it('should enhance dining event with seat assignment when available', async () => {
      // Arrange
      const { dataService } = await import('../../services/dataService')
      const { authService } = await import('../../services/authService')
      
      authService.getCurrentUser.mockResolvedValue({ id: 'attendee-1' })
      
      const mockDiningEvent = {
        id: 'dining-1',
        name: 'Gala Dinner',
        type: 'dining',
        date: '2025-10-15',
        time: '18:00:00',
        seating_type: 'assigned',
        seating_configuration_id: 'config-dining-1'
      }
      
      const mockSeatAssignment = {
        id: 'seat-1',
        attendee_id: 'attendee-1',
        seating_configuration_id: 'config-dining-1',
        table_name: 'Table 5',
        seat_number: 12,
        seat_position: { x: 100, y: 200 }
      }
      
      dataService.getAllDiningOptions.mockResolvedValue([mockDiningEvent])
      dataService.getAllAgendaItems.mockResolvedValue([])
      dataService.getAttendeeSeatAssignments.mockResolvedValue([mockSeatAssignment])
      
      // Act
      const { result } = renderHook(() => useSessionData())
      
      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      // Check if dining events in allEvents have seatInfo
      const diningEventWithSeat = result.current.allEvents?.find(e => e.id === 'dining-1')
      expect(diningEventWithSeat).toBeDefined()
      if (diningEventWithSeat?.seatInfo) {
        expect(diningEventWithSeat.seatInfo).toEqual({
          table: 'Table 5',
          seat: 12,
          position: { x: 100, y: 200 }
        })
      }
    })

    it('should return dining event without seatInfo when no assignment exists', async () => {
      // Arrange
      const { dataService } = await import('../../services/dataService')
      const { authService } = await import('../../services/authService')
      
      authService.getCurrentUser.mockResolvedValue({ id: 'attendee-1' })
      
      const mockDiningEvent = {
        id: 'dining-2',
        name: 'Breakfast',
        type: 'dining',
        date: '2025-10-15',
        time: '08:00:00',
        seating_type: 'assigned',
        seating_configuration_id: 'config-dining-2'
      }
      
      dataService.getAllDiningOptions.mockResolvedValue([mockDiningEvent])
      dataService.getAllAgendaItems.mockResolvedValue([])
      dataService.getAttendeeSeatAssignments.mockResolvedValue([]) // No seat assignments
      
      // Act
      const { result } = renderHook(() => useSessionData())
      
      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      const diningEventNoSeat = result.current.allEvents?.find(e => e.id === 'dining-2')
      expect(diningEventNoSeat).toBeDefined()
      expect(diningEventNoSeat?.seatInfo).toBeNull()
    })

    it('should handle dining events with open seating (no seatInfo expected)', async () => {
      // Arrange
      const { dataService } = await import('../../services/dataService')
      const { authService } = await import('../../services/authService')
      
      authService.getCurrentUser.mockResolvedValue({ id: 'attendee-1' })
      
      const mockDiningEvent = {
        id: 'dining-3',
        name: 'Lunch Buffet',
        type: 'dining',
        date: '2025-10-15',
        time: '12:00:00',
        seating_type: 'open', // Open seating
        seating_configuration_id: null
      }
      
      dataService.getAllDiningOptions.mockResolvedValue([mockDiningEvent])
      dataService.getAllAgendaItems.mockResolvedValue([])
      dataService.getAttendeeSeatAssignments.mockResolvedValue([])
      
      // Act
      const { result } = renderHook(() => useSessionData())
      
      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      const openSeatingEvent = result.current.allEvents?.find(e => e.id === 'dining-3')
      expect(openSeatingEvent).toBeDefined()
      expect(openSeatingEvent?.seatInfo).toBeNull()
    })
  })

  describe('Agenda Item Seat Info (Regression Tests)', () => {
    it('should still enhance agenda items with seat assignments correctly', async () => {
      // Arrange
      const { dataService } = await import('../../services/dataService')
      const { authService } = await import('../../services/authService')
      
      authService.getCurrentUser.mockResolvedValue({ id: 'attendee-1' })
      
      const mockAgendaItem = {
        id: 'agenda-1',
        title: 'Keynote',
        type: 'keynote',
        date: '2025-10-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        seating_type: 'assigned',
        seating_configuration_id: 'config-agenda-1'
      }
      
      const mockSeatAssignment = {
        id: 'seat-2',
        attendee_id: 'attendee-1',
        seating_configuration_id: 'config-agenda-1',
        table_name: 'Table 10',
        seat_number: 5,
        seat_position: { x: 50, y: 100 }
      }
      
      dataService.getAllAgendaItems.mockResolvedValue([mockAgendaItem])
      dataService.getAllDiningOptions.mockResolvedValue([])
      dataService.getAttendeeSeatAssignments.mockResolvedValue([mockSeatAssignment])
      
      // Act
      const { result } = renderHook(() => useSessionData())
      
      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      const agendaWithSeat = result.current.allEvents?.find(e => e.id === 'agenda-1')
      expect(agendaWithSeat).toBeDefined()
      if (agendaWithSeat?.seatInfo) {
        expect(agendaWithSeat.seatInfo).toEqual({
          table: 'Table 10',
          seat: 5,
          position: { x: 50, y: 100 }
        })
      }
    })
  })

  describe('Mixed Events (Agenda + Dining)', () => {
    it('should enhance both agenda and dining events with their respective seat assignments', async () => {
      // Arrange
      const { dataService } = await import('../../services/dataService')
      const { authService } = await import('../../services/authService')
      
      authService.getCurrentUser.mockResolvedValue({ id: 'attendee-1' })
      
      const mockAgendaItem = {
        id: 'agenda-1',
        title: 'Panel Discussion',
        type: 'panel-discussion',
        date: '2025-10-15',
        start_time: '14:00:00',
        end_time: '15:00:00',
        seating_configuration_id: 'config-agenda-1'
      }
      
      const mockDiningEvent = {
        id: 'dining-1',
        name: 'Dinner',
        type: 'dining',
        date: '2025-10-15',
        time: '19:00:00',
        seating_configuration_id: 'config-dining-1'
      }
      
      const mockSeatAssignments = [
        {
          id: 'seat-1',
          attendee_id: 'attendee-1',
          seating_configuration_id: 'config-agenda-1',
          table_name: 'Table 3',
          seat_number: 7
        },
        {
          id: 'seat-2',
          attendee_id: 'attendee-1',
          seating_configuration_id: 'config-dining-1',
          table_name: 'Table 8',
          seat_number: 15
        }
      ]
      
      dataService.getAllAgendaItems.mockResolvedValue([mockAgendaItem])
      dataService.getAllDiningOptions.mockResolvedValue([mockDiningEvent])
      dataService.getAttendeeSeatAssignments.mockResolvedValue(mockSeatAssignments)
      
      // Act
      const { result } = renderHook(() => useSessionData())
      
      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      const agendaEvent = result.current.allEvents?.find(e => e.id === 'agenda-1')
      const diningEvent = result.current.allEvents?.find(e => e.id === 'dining-1')
      
      expect(agendaEvent?.seatInfo?.table).toBe('Table 3')
      expect(agendaEvent?.seatInfo?.seat).toBe(7)
      
      expect(diningEvent?.seatInfo?.table).toBe('Table 8')
      expect(diningEvent?.seatInfo?.seat).toBe(15)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing seating_configuration_id gracefully', async () => {
      // Arrange
      const { dataService } = await import('../../services/dataService')
      const { authService } = await import('../../services/authService')
      
      authService.getCurrentUser.mockResolvedValue({ id: 'attendee-1' })
      
      const mockDiningEvent = {
        id: 'dining-4',
        name: 'Reception',
        type: 'dining',
        date: '2025-10-15',
        time: '17:00:00',
        seating_configuration_id: null // No seating config
      }
      
      dataService.getAllDiningOptions.mockResolvedValue([mockDiningEvent])
      dataService.getAllAgendaItems.mockResolvedValue([])
      dataService.getAttendeeSeatAssignments.mockResolvedValue([])
      
      // Act
      const { result } = renderHook(() => useSessionData())
      
      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      const event = result.current.allEvents?.find(e => e.id === 'dining-4')
      expect(event).toBeDefined()
      expect(event?.seatInfo).toBeNull()
    })

    it('should handle empty seat assignments array', async () => {
      // Arrange
      const { dataService } = await import('../../services/dataService')
      const { authService } = await import('../../services/authService')
      
      authService.getCurrentUser.mockResolvedValue({ id: 'attendee-1' })
      
      const mockDiningEvent = {
        id: 'dining-5',
        name: 'Breakfast',
        type: 'dining',
        date: '2025-10-16',
        time: '07:00:00',
        seating_configuration_id: 'config-dining-5'
      }
      
      dataService.getAllDiningOptions.mockResolvedValue([mockDiningEvent])
      dataService.getAllAgendaItems.mockResolvedValue([])
      dataService.getAttendeeSeatAssignments.mockResolvedValue([]) // Empty
      
      // Act
      const { result } = renderHook(() => useSessionData())
      
      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(result.current.error).toBeNull()
    })
  })
})

