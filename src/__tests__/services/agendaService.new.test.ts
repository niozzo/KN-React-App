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
  let mockUnifiedCache: any

  beforeEach(() => {
    TestUtils.setupTestEnvironment()
    
    // Create mocks
    mockServerDataSyncService = MockFactory.createServerDataSyncServiceMock()
    mockCacheService = MockFactory.createCacheServiceMock()
    mockUnifiedCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined)
    }
    
    // Create service with injected dependencies including unifiedCache
    agendaService = new AgendaService(mockServerDataSyncService, mockCacheService, mockUnifiedCache)
    
    // Mock enrichment methods to return data as-is (focus tests on cache/sync behavior)
    vi.spyOn(agendaService as any, 'applyTimeOverrides').mockImplementation(async (items) => items)
    vi.spyOn(agendaService as any, 'enrichWithSpeakerData').mockImplementation(async (items) => items)
    vi.spyOn(agendaService as any, 'refreshAgendaItemsInBackground').mockImplementation(() => {})
    
    vi.clearAllMocks()
  })

  describe('getActiveAgendaItems - Cache First', () => {
    it('should return cached data when available', async () => {
      const sampleData = MockFactory.createSampleAgendaItems()
      
      // Setup cache to return data
      mockUnifiedCache.get = vi.fn().mockResolvedValue(sampleData)

      const result = await agendaService.getActiveAgendaItems()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(sampleData)
      expect(result.count).toBe(3)
      
      // Verify cache was used
      expect(mockUnifiedCache.get).toHaveBeenCalledWith('kn_cache_agenda_items')
      
      // Verify sync service was not called
      expect(mockServerDataSyncService.syncAllData).not.toHaveBeenCalled()
    })

    it('should fallback to sync service when cache is empty', async () => {
      const sampleData = MockFactory.createSampleAgendaItems()
      
      // Setup cache to return null then data after sync
      mockUnifiedCache.get = vi.fn()
        .mockResolvedValueOnce(null) // First call (no cache)
        .mockResolvedValueOnce(sampleData) // Second call (after sync)
      
      // Setup sync service to return success
      mockServerDataSyncService.syncAllData = vi.fn().mockResolvedValue(
        MockFactory.createSuccessfulSyncResult()
      )

      const result = await agendaService.getActiveAgendaItems()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(sampleData)
      expect(result.count).toBe(3)
      
      // Verify sync service was called
      expect(mockServerDataSyncService.syncAllData).toHaveBeenCalled()
    })

    it('should handle sync service failure gracefully', async () => {
      // Setup cache to return null (no cached data)
      mockUnifiedCache.get = vi.fn().mockResolvedValue(null)
      
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

    it('should return pre-filtered data from cache', async () => {
      // Cache now only contains active items (filtered by ServerDataSyncService)
      const activeOnlyData = [
        {
          id: '1',
          title: 'Active Session',
          date: '2024-01-15',
          start_time: '09:00',
          end_time: '10:00',
          isActive: true
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
      
      // Setup cache to return already-filtered data
      mockUnifiedCache.get = vi.fn().mockResolvedValue(activeOnlyData)

      const result = await agendaService.getActiveAgendaItems()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].id).toBe('1')
      expect(result.data[1].id).toBe('3')
    })
  })

  describe('Error Handling', () => {
    it('should handle cache service errors gracefully', async () => {
      // Setup cache service to throw error
      mockUnifiedCache.get = vi.fn().mockRejectedValue(new Error('Cache error'))

      const result = await agendaService.getActiveAgendaItems()

      // Service catches cache error and returns it
      expect(result.success).toBe(false)
      expect(result.error).toBe('Cache error')
    })

    it('should handle sync service exceptions', async () => {
      // Setup cache to return null
      mockUnifiedCache.get = vi.fn().mockResolvedValue(null)
      
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
