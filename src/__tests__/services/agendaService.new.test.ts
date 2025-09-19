/**
 * Agenda Service Tests - New Architecture
 * Testing with dependency injection and proper mocking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AgendaService } from '../../services/agendaService'
import { MockFactory } from '../mocks/MockFactory'
import { TestUtils } from '../utils/TestUtils'
import type { IServerDataSyncService } from '../../services/interfaces/IServerDataSyncService'
import type { ICacheService } from '../../services/interfaces/ICacheService'

describe('AgendaService - New Architecture', () => {
  let agendaService: AgendaService
  let mockServerDataSyncService: IServerDataSyncService
  let mockCacheService: ICacheService

  beforeEach(() => {
    TestUtils.setupTestEnvironment()
    
    // Create mocks
    mockServerDataSyncService = MockFactory.createServerDataSyncServiceMock()
    mockCacheService = MockFactory.createCacheServiceMock()
    
    // Create service with injected dependencies
    agendaService = new AgendaService(mockServerDataSyncService, mockCacheService)
    
    vi.clearAllMocks()
  })

  describe('getActiveAgendaItems - Cache First', () => {
    it('should return cached data when available', async () => {
      const sampleData = MockFactory.createSampleAgendaItems()
      
      // Setup cache to return data
      mockCacheService.get = vi.fn().mockReturnValue({
        data: sampleData,
        timestamp: new Date().toISOString(),
        version: '1.0'
      })

      const result = await agendaService.getActiveAgendaItems()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(sampleData)
      expect(result.count).toBe(3)
      
      // Verify cache was used
      expect(mockCacheService.get).toHaveBeenCalledWith('kn_cache_agenda_items')
      
      // Verify sync service was not called
      expect(mockServerDataSyncService.syncAllData).not.toHaveBeenCalled()
    })

    it('should fallback to sync service when cache is empty', async () => {
      const sampleData = MockFactory.createSampleAgendaItems()
      
      // Setup cache to return null (no cached data)
      mockCacheService.get = vi.fn().mockReturnValue(null)
      
      // Setup sync service to return success
      mockServerDataSyncService.syncAllData = vi.fn().mockResolvedValue(
        MockFactory.createSuccessfulSyncResult()
      )
      
      // Setup cache to return data after sync
      mockCacheService.get = vi.fn()
        .mockReturnValueOnce(null) // First call (no cache)
        .mockReturnValueOnce({ data: sampleData, timestamp: new Date().toISOString(), version: '1.0' }) // Second call (after sync)

      const result = await agendaService.getActiveAgendaItems()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(sampleData)
      expect(result.count).toBe(3)
      
      // Verify sync service was called
      expect(mockServerDataSyncService.syncAllData).toHaveBeenCalled()
    })

    it('should handle sync service failure gracefully', async () => {
      // Setup cache to return null (no cached data)
      mockCacheService.get = vi.fn().mockReturnValue(null)
      
      // Setup sync service to fail
      mockServerDataSyncService.syncAllData = vi.fn().mockResolvedValue(
        MockFactory.createFailedSyncResult('Network error')
      )

      const result = await agendaService.getActiveAgendaItems()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to sync data')
      expect(result.data).toEqual([])
      expect(result.count).toBe(0)
    })

    it('should filter inactive items from cached data', async () => {
      const mixedData = [
        {
          id: '1',
          title: 'Active Session',
          date: '2024-01-15',
          start_time: '09:00',
          end_time: '10:00',
          isActive: true
        },
        {
          id: '2',
          title: 'Inactive Session',
          date: '2024-01-15',
          start_time: '11:00',
          end_time: '12:00',
          isActive: false
        },
        {
          id: '3',
          title: 'Another Active Session',
          date: '2024-01-15',
          start_time: '14:00',
          end_time: '15:00',
          isActive: true
        }
      ]
      
      // Setup cache to return mixed data
      mockCacheService.get = vi.fn().mockReturnValue({
        data: mixedData,
        timestamp: new Date().toISOString(),
        version: '1.0'
      })

      const result = await agendaService.getActiveAgendaItems()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2) // Only active items
      expect(result.data[0].id).toBe('1')
      expect(result.data[1].id).toBe('3')
    })
  })

  describe('Error Handling', () => {
    it('should handle cache service errors gracefully', async () => {
      // Setup cache service to throw error
      mockCacheService.get = vi.fn().mockImplementation(() => {
        throw new Error('Cache error')
      })
      
      // Setup sync service to return success
      mockServerDataSyncService.syncAllData = vi.fn().mockResolvedValue(
        MockFactory.createSuccessfulSyncResult()
      )

      const result = await agendaService.getActiveAgendaItems()

      // Should fallback to sync service
      expect(mockServerDataSyncService.syncAllData).toHaveBeenCalled()
    })

    it('should handle sync service exceptions', async () => {
      // Setup cache to return null
      mockCacheService.get = vi.fn().mockReturnValue(null)
      
      // Setup sync service to throw exception
      mockServerDataSyncService.syncAllData = vi.fn().mockRejectedValue(
        new Error('Network timeout')
      )

      const result = await agendaService.getActiveAgendaItems()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network timeout')
    })
  })
})
