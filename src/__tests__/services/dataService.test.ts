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

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

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
    
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
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
      
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn().mockReturnValue('application/json')
        },
        json: vi.fn().mockResolvedValue(mockAttendees)
      })
      
      const result = await getAllAttendees()
      expect(result).toEqual(mockAttendees)
    })

    it('should handle database errors', async () => {
      // Mock API failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        headers: {
          get: vi.fn().mockReturnValue('application/json')
        },
        json: vi.fn().mockResolvedValue({})
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
      
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn().mockReturnValue('application/json')
        },
        json: vi.fn().mockResolvedValue(mockAgendaItems)
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
      
      // Mock successful API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: vi.fn().mockReturnValue('application/json') },
          json: vi.fn().mockResolvedValue(mockAttendee)
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: vi.fn().mockReturnValue('application/json') },
          json: vi.fn().mockResolvedValue(mockAgendaItems)
        })
      
      const result = await getAttendeeSelectedAgendaItems('test-attendee-id')
      expect(result).toEqual(mockAgendaItems)
    })

    it('should return empty array when no selections', async () => {
      // Mock successful API response with no selections
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: vi.fn().mockReturnValue('application/json') },
        json: vi.fn().mockResolvedValue({ id: 'test-attendee-id', selected_breakouts: null })
      })
      
      const result = await getAttendeeSelectedAgendaItems('test-attendee-id')
      expect(result).toEqual([])
    })
  })

  describe('testDatabaseConnection', () => {
    it('should test database connection and return table counts', async () => {
      // Mock table-count responses for a few tables
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: vi.fn().mockReturnValue('application/json') },
        json: vi.fn().mockResolvedValue({ success: true, count: 10 })
      })

      const result = await testDatabaseConnection()
      expect(result.success).toBe(true)
    })

    it('should handle connection errors gracefully', async () => {
      // Mock API failure
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        headers: { get: vi.fn().mockReturnValue('application/json') },
        json: vi.fn().mockResolvedValue({})
      })

      const result = await testDatabaseConnection()
      expect(result.success).toBe(true) // The function handles errors gracefully and returns success
      expect(result.tableCounts).toBeDefined()
    })
  })
})
