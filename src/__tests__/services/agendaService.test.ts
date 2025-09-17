/**
 * Agenda Service Tests
 * Testing sorting optimization - data should be pre-sorted by transformer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AgendaService } from '../../services/agendaService'
import type { AgendaItem } from '../../types/database'

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
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  headers: { get: () => 'application/json' },
  json: () => Promise.resolve([])
})

describe('AgendaService', () => {
  let agendaService: AgendaService

  beforeEach(() => {
    agendaService = new AgendaService()
    vi.clearAllMocks()
  })

  describe('getActiveAgendaItems - Sorting Optimization', () => {
    it('should return pre-sorted data from localStorage without additional sorting', async () => {
      // Mock pre-sorted data in localStorage (as it would be after transformer sorting)
      const preSortedData = [
        {
          id: '1',
          title: 'Morning Session',
          date: '2024-01-15',
          start_time: '09:00',
          end_time: '10:00',
          is_active: true
        },
        {
          id: '2',
          title: 'Afternoon Session',
          date: '2024-01-15',
          start_time: '14:00',
          end_time: '15:00',
          is_active: true
        },
        {
          id: '3',
          title: 'Next Day Session',
          date: '2024-01-16',
          start_time: '09:00',
          end_time: '10:00',
          is_active: true
        }
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify({ data: preSortedData }))

      const result = await agendaService.getActiveAgendaItems()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      
      // Verify data is returned in the same order as stored (pre-sorted)
      expect(result.data[0].id).toBe('1') // Morning session first
      expect(result.data[1].id).toBe('2') // Afternoon session second  
      expect(result.data[2].id).toBe('3') // Next day session last
    })

    it('should filter inactive items but maintain chronological order', async () => {
      const mixedData = [
        {
          id: '1',
          title: 'Active Morning Session',
          date: '2024-01-15',
          start_time: '09:00',
          end_time: '10:00',
          is_active: true
        },
        {
          id: '2',
          title: 'Inactive Session',
          date: '2024-01-15',
          start_time: '11:00',
          end_time: '12:00',
          is_active: false
        },
        {
          id: '3',
          title: 'Active Afternoon Session',
          date: '2024-01-15',
          start_time: '14:00',
          end_time: '15:00',
          is_active: true
        }
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify({ data: mixedData }))

      const result = await agendaService.getActiveAgendaItems()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2) // Only active items
      expect(result.data[0].id).toBe('1') // First active item
      expect(result.data[1].id).toBe('3') // Second active item
    })

    it('should fallback to API when localStorage is empty and sort by date then time', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const apiData = [
        {
          id: '3',
          title: 'Afternoon Session',
          date: '2024-01-15',
          start_time: '14:00',
          end_time: '15:00',
          is_active: true
        },
        {
          id: '1',
          title: 'Morning Session',
          date: '2024-01-15',
          start_time: '09:00',
          end_time: '10:00',
          is_active: true
        },
        {
          id: '2',
          title: 'Next Day Session',
          date: '2024-01-16',
          start_time: '08:00',
          end_time: '09:00',
          is_active: true
        }
      ]

      // Mock API response (unsorted data from API)
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'application/json'
        },
        json: () => Promise.resolve(apiData)
      })

      const result = await agendaService.getActiveAgendaItems()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      
      
      // Data should be sorted by date first, then time
      expect(result.data[0].id).toBe('1') // Morning session on 2024-01-15
      expect(result.data[1].id).toBe('3') // Afternoon session on 2024-01-15
      expect(result.data[2].id).toBe('2') // Next day session on 2024-01-16
    })

    it('should properly sort by date first, then time (October example)', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const apiData = [
        {
          id: '3',
          title: 'Oct 22 Morning Session',
          date: '2024-10-22',
          start_time: '09:00',
          end_time: '10:00',
          is_active: true
        },
        {
          id: '1',
          title: 'Oct 21 Afternoon Session',
          date: '2024-10-21',
          start_time: '14:00',
          end_time: '15:00',
          is_active: true
        },
        {
          id: '2',
          title: 'Oct 21 Morning Session',
          date: '2024-10-21',
          start_time: '09:00',
          end_time: '10:00',
          is_active: true
        }
      ]

      // Mock API response (unsorted data from API)
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'application/json'
        },
        json: () => Promise.resolve(apiData)
      })

      const result = await agendaService.getActiveAgendaItems()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      
      // Data should be sorted by date first, then time
      expect(result.data[0].id).toBe('2') // Oct 21 Morning Session
      expect(result.data[1].id).toBe('1') // Oct 21 Afternoon Session  
      expect(result.data[2].id).toBe('3') // Oct 22 Morning Session
    })
  })

  describe('Error Handling', () => {
    it('should handle localStorage parsing errors gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      const result = await agendaService.getActiveAgendaItems()

      // Should fallback to API
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should handle API errors gracefully', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      ;(global.fetch as any).mockRejectedValue(new Error('API Error'))

      const result = await agendaService.getActiveAgendaItems()

      expect(result.success).toBe(false)
      expect(result.error).toBe('API Error')
    })
  })

  describe('Background Refresh Cache Protection', () => {
    beforeEach(() => {
      // Mock console methods to track logging
      vi.spyOn(console, 'log').mockImplementation(() => {})
      vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should preserve cache when API returns 0 items', async () => {
      // Setup: Mock localStorage with valid cached data
      const validCachedData = {
        data: [
          {
            id: '1',
            title: 'Valid Session',
            date: '2024-01-15',
            start_time: '09:00',
            end_time: '10:00',
            isActive: true
          }
        ],
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(validCachedData))
      
      // Mock API to return empty array
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve([])
      })

      // First call should use cached data and trigger background refresh
      const result1 = await agendaService.getActiveAgendaItems()
      expect(result1.success).toBe(true)
      expect(result1.data).toHaveLength(1)
      expect(result1.data[0].title).toBe('Valid Session')

      // Wait for background refresh to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Second call should still use cached data (not overwritten)
      const result2 = await agendaService.getActiveAgendaItems()
      expect(result2.success).toBe(true)
      expect(result2.data).toHaveLength(1)
      expect(result2.data[0].title).toBe('Valid Session')

      // Verify warning was logged
      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ Background refresh: API returned 0 agenda items, keeping existing cache'
      )
    })

    it('should update cache when API returns valid items', async () => {
      // Setup: Mock localStorage with valid cached data
      const validCachedData = {
        data: [
          {
            id: '1',
            title: 'Old Session',
            date: '2024-01-15',
            start_time: '09:00',
            end_time: '10:00',
            isActive: true
          }
        ],
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(validCachedData))
      
      // Mock API to return new data
      const newApiData = [
        {
          id: '2',
          title: 'New Session',
          date: '2024-01-15',
          start_time: '10:00',
          end_time: '11:00',
          isActive: true
        }
      ]
      
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(newApiData)
      })

      // First call should use cached data and trigger background refresh
      const result1 = await agendaService.getActiveAgendaItems()
      expect(result1.success).toBe(true)
      expect(result1.data).toHaveLength(1)
      expect(result1.data[0].title).toBe('Old Session')

      // Wait for background refresh to complete
      await new Promise(resolve => setTimeout(resolve, 200))

      // Clear localStorage mock to force fresh read
      localStorageMock.getItem.mockClear()
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        data: newApiData,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }))

      // Second call should use updated data
      const result2 = await agendaService.getActiveAgendaItems()
      expect(result2.success).toBe(true)
      expect(result2.data).toHaveLength(1)
      expect(result2.data[0].title).toBe('New Session')

      // Verify success was logged
      expect(console.log).toHaveBeenCalledWith(
        '🔄 Background refresh: Updated cache with', 1, 'agenda items'
      )
    })

    it('should handle API errors gracefully during background refresh', async () => {
      // Setup: Mock localStorage with valid cached data
      const validCachedData = {
        data: [
          {
            id: '1',
            title: 'Valid Session',
            date: '2024-01-15',
            start_time: '09:00',
            end_time: '10:00',
            isActive: true
          }
        ],
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(validCachedData))
      
      // Mock API to throw error
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      // First call should use cached data and trigger background refresh
      const result1 = await agendaService.getActiveAgendaItems()
      expect(result1.success).toBe(true)
      expect(result1.data).toHaveLength(1)

      // Wait for background refresh to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Second call should still use cached data (not affected by API error)
      const result2 = await agendaService.getActiveAgendaItems()
      expect(result2.success).toBe(true)
      expect(result2.data).toHaveLength(1)
      expect(result2.data[0].title).toBe('Valid Session')

      // Verify error was logged
      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ Background refresh failed:', expect.any(Error)
      )
    })

    it('should not trigger background refresh when cache is empty', async () => {
      // Setup: Mock localStorage with empty cached data
      const emptyCachedData = {
        data: [],
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(emptyCachedData))
      
      // Mock API to return valid data
      const apiData = [
        {
          id: '1',
          title: 'New Session',
          date: '2024-01-15',
          start_time: '09:00',
          end_time: '10:00',
          isActive: true
        }
      ]
      
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(apiData)
      })

      const result = await agendaService.getActiveAgendaItems()
      
      // Should fallback to API call (not background refresh)
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('New Session')
      
      // Should not log background refresh messages
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Background refresh')
      )
    })
  })
})
