/**
 * Data Service Tests
 * Testing sorting optimization - data should be pre-sorted by transformer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getAllAgendaItems } from '../../services/dataService'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock fetch
global.fetch = vi.fn()

// Mock auth service
vi.mock('../../services/authService', () => ({
  getCurrentAttendee: vi.fn(() => ({ id: 'test-user' })),
  isUserAuthenticated: vi.fn(() => true)
}))

describe('DataService - getAllAgendaItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Sorting Optimization', () => {
    it('should return pre-sorted data from localStorage without additional sorting', async () => {
      // Mock pre-sorted data in localStorage (as it would be after transformer sorting)
      const preSortedData = [
        {
          id: '1',
          title: 'Morning Session',
          date: '2024-01-15',
          start_time: '09:00',
          end_time: '10:00'
        },
        {
          id: '2',
          title: 'Afternoon Session',
          date: '2024-01-15',
          start_time: '14:00',
          end_time: '15:00'
        },
        {
          id: '3',
          title: 'Next Day Session',
          date: '2024-01-16',
          start_time: '09:00',
          end_time: '10:00'
        }
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify({ data: preSortedData }))

      const result = await getAllAgendaItems()

      expect(result).toHaveLength(3)
      
      // Verify data is returned in the same order as stored (pre-sorted)
      expect(result[0].id).toBe('1') // Morning session first
      expect(result[1].id).toBe('2') // Afternoon session second  
      expect(result[2].id).toBe('3') // Next day session last
    })

    it('should fallback to API when localStorage is empty and return pre-sorted data', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const apiData = [
        {
          id: '2',
          title: 'Afternoon Session',
          date: '2024-01-15',
          start_time: '14:00',
          end_time: '15:00'
        },
        {
          id: '1',
          title: 'Morning Session',
          date: '2024-01-15',
          start_time: '09:00',
          end_time: '10:00'
        }
      ]

      // Mock API response (data should be pre-sorted by API/transformer)
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'application/json'
        },
        json: () => Promise.resolve(apiData)
      })

      const result = await getAllAgendaItems()

      expect(result).toHaveLength(2)
      
      // Data should be returned as-is from API (assuming API pre-sorts)
      expect(result[0].id).toBe('2')
      expect(result[1].id).toBe('1')
    })

    it('should handle empty localStorage data gracefully', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ data: [] }))

      // Mock API response for empty data fallback
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'application/json'
        },
        json: () => Promise.resolve([])
      })

      const result = await getAllAgendaItems()

      expect(result).toHaveLength(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle localStorage parsing errors gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      const result = await getAllAgendaItems()

      // Should fallback to API
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should handle API errors gracefully', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      ;(global.fetch as any).mockRejectedValue(new Error('API Error'))

      await expect(getAllAgendaItems()).rejects.toThrow('Failed to fetch agenda items')
    })
  })
})