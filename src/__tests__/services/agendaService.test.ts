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
global.fetch = vi.fn()

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
})
