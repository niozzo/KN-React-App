/**
 * Tests for Data Service
 * 
 * Tests data fetching with READ-ONLY database access and authentication requirements
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

// Mock fetch for API-based data access
const mockFetch = () => {
  const original = globalThis.fetch
  const fetchMock = vi.fn()
  // @ts-expect-error override global in tests
  globalThis.fetch = fetchMock
  return { fetchMock, restore: () => { globalThis.fetch = original } }
}

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

  afterEach(() => {
    // Ensure we restore fetch if we changed it in a test
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
      const { fetchMock, restore } = mockFetch()
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: mockAttendees }) })
      const result = await getAllAttendees()
      expect(result).toEqual(mockAttendees)
      restore()
    })

    it('should handle database errors', async () => {
      const { fetchMock, restore } = mockFetch()
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error', json: async () => ({}) })
      await expect(getAllAttendees()).rejects.toThrow(DataServiceError)
      await expect(getAllAttendees()).rejects.toThrow('Failed to fetch attendees')
      restore()
    })
  })

  describe('getAllAgendaItems', () => {
    it('should fetch all agenda items when authenticated', async () => {
      const mockAgendaItems = [
        { id: '1', title: 'Opening Session', date: '2024-01-01', start_time: '09:00:00' },
        { id: '2', title: 'Breakout Session', date: '2024-01-01', start_time: '10:00:00' }
      ]
      const { fetchMock, restore } = mockFetch()
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: mockAgendaItems }) })
      const result = await getAllAgendaItems()
      expect(result).toEqual(mockAgendaItems)
      restore()
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
      const { fetchMock, restore } = mockFetch()
      // First call: /api/attendees/:id
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: mockAttendee }) })
      // Second call: /api/agenda-items
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: mockAgendaItems }) })
      const result = await getAttendeeSelectedAgendaItems('test-attendee-id')
      expect(result).toEqual(mockAgendaItems)
      restore()
    })

    it('should return empty array when no selections', async () => {
      const { fetchMock, restore } = mockFetch()
      // First call: attendee record without selections
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { id: 'test-attendee-id', selected_breakouts: null } }) })
      const result = await getAttendeeSelectedAgendaItems('test-attendee-id')
      expect(result).toEqual([])
      restore()
    })
  })

  describe('testDatabaseConnection', () => {
    it('should test database connection and return table counts', async () => {
      const { fetchMock, restore } = mockFetch()
      // Mock table-count responses for a few tables
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true, count: 10 }) })

      const result = await testDatabaseConnection()
      expect(result.success).toBe(true)
      restore()
    })

    it('should handle connection errors gracefully', async () => {
      const { fetchMock, restore } = mockFetch()
      fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error', json: async () => ({}) })

      const result = await testDatabaseConnection()
      expect(result.success).toBe(true) // The function handles errors gracefully and returns success
      expect(result.tableCounts).toBeDefined()
      restore()
    })
  })
})
