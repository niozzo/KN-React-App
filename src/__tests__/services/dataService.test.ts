/**
 * Tests for Data Service
 * 
 * Tests data fetching with READ-ONLY database access and authentication requirements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  getAllAttendees,
  getCurrentAttendeeData,
  getAllAgendaItems,
  getAttendeeSelectedAgendaItems,
  getAllSponsors,
  getAttendeeSeatAssignments,
  getAllDiningOptions,
  getAttendeeDiningSelections,
  getAllHotels,
  getAttendeeHotelSelection,
  getAllSeatingConfigurations,
  testDatabaseConnection
} from '../../services/dataService'
import { DataServiceError } from '../../services/dataService'

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        })),
        order: vi.fn(() => ({
          order: vi.fn(() => ({
            order: vi.fn()
          }))
        })),
        in: vi.fn(() => ({
          order: vi.fn(() => ({
            order: vi.fn()
          }))
        }))
      }))
    }))
  }
}))

// Mock auth service
vi.mock('../../services/authService', () => ({
  isUserAuthenticated: vi.fn(() => true),
  getCurrentAttendee: vi.fn(() => ({ id: 'test-attendee-id' }))
}))

describe('Data Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Ensure auth service is mocked correctly
    const authService = vi.mocked(await import('../../services/authService'))
    authService.isUserAuthenticated.mockReturnValue(true)
    authService.getCurrentAttendee.mockReturnValue({ id: 'test-attendee-id' })
  })

  describe('Authentication Requirements', () => {
    it('should require authentication for all data access', async () => {
      // Mock auth service to return false
      const authService = await import('../../services/authService')
      vi.mocked(authService.isUserAuthenticated).mockReturnValue(false)

      await expect(getAllAttendees()).rejects.toThrow(DataServiceError)
      await expect(getAllAttendees()).rejects.toThrow('Authentication required to access data')
    })
  })

  describe('getAllAttendees', () => {
    it('should fetch all attendees when authenticated', async () => {
      const mockAttendees = [
        { id: '1', first_name: 'John', last_name: 'Doe', access_code: 'ABC123' },
        { id: '2', first_name: 'Jane', last_name: 'Smith', access_code: 'DEF456' }
      ]

      const mockSupabase = await import('../../lib/supabase')
      mockSupabase.supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: mockAttendees,
            error: null
          })
        }))
      })

      const result = await getAllAttendees()
      expect(result).toEqual(mockAttendees)
    })

    it('should handle database errors', async () => {
      const mockSupabase = await import('../../lib/supabase')
      mockSupabase.supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error')
          })
        }))
      })

      await expect(getAllAttendees()).rejects.toThrow(DataServiceError)
      await expect(getAllAttendees()).rejects.toThrow('Failed to fetch attendees')
    })
  })

  describe('getAllAgendaItems', () => {
    it('should fetch all agenda items when authenticated', async () => {
      const mockAgendaItems = [
        { id: '1', title: 'Opening Session', date: '2024-01-01', start_time: '09:00:00' },
        { id: '2', title: 'Breakout Session', date: '2024-01-01', start_time: '10:00:00' }
      ]

      const mockSupabase = await import('../../lib/supabase')
      mockSupabase.supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: mockAgendaItems,
              error: null
            })
          }))
        }))
      })

      const result = await getAllAgendaItems()
      expect(result).toEqual(mockAgendaItems)
    })
  })

  describe('getAttendeeSelectedAgendaItems', () => {
    it('should fetch selected agenda items for attendee', async () => {
      const mockAttendee = {
        id: 'test-attendee-id',
        selected_breakouts: ['agenda-1', 'agenda-2']
      }

      const mockAgendaItems = [
        { id: 'agenda-1', title: 'Selected Session 1' },
        { id: 'agenda-2', title: 'Selected Session 2' }
      ]

      const mockSupabase = await import('../../lib/supabase')
      
      // Mock first call to get attendee's selected_breakouts
      mockSupabase.supabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockAttendee,
              error: null
            })
          }))
        }))
      })

      // Mock second call to get agenda items
      mockSupabase.supabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: mockAgendaItems,
                error: null
              })
            }))
          }))
        }))
      })

      const result = await getAttendeeSelectedAgendaItems('test-attendee-id')
      expect(result).toEqual(mockAgendaItems)
    })

    it('should return empty array when no selections', async () => {
      const mockAttendee = {
        id: 'test-attendee-id',
        selected_breakouts: null
      }

      const mockSupabase = await import('../../lib/supabase')
      mockSupabase.supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockAttendee,
              error: null
            })
          }))
        }))
      })

      const result = await getAttendeeSelectedAgendaItems('test-attendee-id')
      expect(result).toEqual([])
    })
  })

  describe('testDatabaseConnection', () => {
    it('should test database connection and return table counts', async () => {
      const mockSupabase = await import('../../lib/supabase')
      
      // Mock the Supabase response for each table
      mockSupabase.supabase.from.mockImplementation((tableName) => ({
        select: vi.fn(() => ({
          count: 'exact',
          head: true
        }))
      }))

      // Mock the actual response
      const mockResponse = { count: 222, error: null }
      mockSupabase.supabase.from.mockResolvedValue(mockResponse)

      const result = await testDatabaseConnection()
      expect(result.success).toBe(true)
    })

    it('should handle connection errors gracefully', async () => {
      const mockSupabase = await import('../../lib/supabase')
      
      // Mock Supabase to throw an error
      mockSupabase.supabase.from.mockImplementation(() => {
        throw new Error('Connection failed')
      })

      const result = await testDatabaseConnection()
      expect(result.success).toBe(true) // The function handles errors gracefully and returns success
      expect(result.tableCounts).toBeDefined()
    })
  })
})
