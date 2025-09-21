/**
 * Cache Validation Integration Tests
 * Tests for cache validation integration across services
 * 
 * Test Categories:
 * - Service Integration: Cache validation across multiple services
 * - Data Flow: End-to-end cache validation flow
 * - Error Propagation: Error handling across service boundaries
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { UnifiedCacheService } from '../../services/unifiedCacheService'
import { PWADataSyncService } from '../../services/pwaDataSyncService'
import { AgendaService } from '../../services/agendaService'

// Mock external dependencies
vi.mock('../../services/cacheVersioningService')
vi.mock('../../services/cacheMonitoringService')
vi.mock('../../services/cacheMetricsService')
vi.mock('../../services/dataConsistencyService')
vi.mock('../../services/serverDataSyncService')

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

describe('Cache Validation Integration', () => {
  let unifiedCache: UnifiedCacheService
  let pwaDataSync: PWADataSyncService
  let agendaService: AgendaService

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup localStorage mock
    global.localStorage = mockLocalStorage as any
    
    // Initialize services
    unifiedCache = new UnifiedCacheService()
    pwaDataSync = new PWADataSyncService()
    agendaService = new AgendaService()
  })

  afterEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('End-to-End Cache Validation Flow', () => {
    it('should handle checksum corruption in agenda items cache', async () => {
      // Arrange
      const mockAgendaData = [
        { id: '1', title: 'Opening Session', start_time: '09:00:00' },
        { id: '2', title: 'Keynote', start_time: '10:00:00' }
      ]
      
      const corruptedEntry = {
        data: mockAgendaData,
        version: '2.1.0',
        timestamp: '2025-01-21T00:00:00.000Z',
        ttl: 300000,
        checksum: 'invalid_checksum'
      }
      
      const validEntry = {
        ...corruptedEntry,
        checksum: 'valid_checksum'
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(corruptedEntry))
      
      // Mock the cache versioning service
      const mockCacheVersioning = {
        validateCacheEntry: vi.fn()
          .mockReturnValueOnce({ isValid: false, issues: ['Cache data integrity check failed (checksum mismatch)'] })
          .mockReturnValueOnce({ isValid: true }),
        calculateChecksumSync: vi.fn().mockReturnValue('valid_checksum'),
        createCacheEntry: vi.fn().mockReturnValue(validEntry)
      }
      
      // Replace the cache versioning service in unified cache
      ;(unifiedCache as any).cacheVersioning = mockCacheVersioning

      // Act
      const result = await unifiedCache.get('kn_cache_agenda_items')

      // Assert
      expect(result).toEqual(mockAgendaData)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('kn_cache_agenda_items', JSON.stringify(validEntry))
    })

    it('should propagate cache validation errors through service chain', async () => {
      // Arrange
      const mockAgendaData = [
        { id: '1', title: 'Opening Session', start_time: '09:00:00' }
      ]
      
      const corruptedEntry = {
        data: mockAgendaData,
        version: '1.0.0', // Wrong version
        timestamp: '2025-01-21T00:00:00.000Z',
        ttl: 300000,
        checksum: 'valid_checksum'
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(corruptedEntry))
      
      // Mock cache versioning to return validation failure
      const mockCacheVersioning = {
        validateCacheEntry: vi.fn().mockReturnValue({
          isValid: false,
          issues: ['Cache version mismatch (expected: 2.1.0, got: 1.0.0)']
        })
      }
      
      ;(unifiedCache as any).cacheVersioning = mockCacheVersioning

      // Act
      const result = await unifiedCache.get('kn_cache_agenda_items')

      // Assert
      expect(result).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cache_agenda_items')
    })
  })

  describe('Service Integration with Cache Validation', () => {
    it('should integrate cache validation with PWA data sync', async () => {
      // Arrange
      const mockTableData = [
        { id: '1', name: 'Test Attendee' },
        { id: '2', name: 'Another Attendee' }
      ]
      
      const corruptedEntry = {
        data: mockTableData,
        version: '2.1.0',
        timestamp: '2025-01-21T00:00:00.000Z',
        ttl: 300000,
        checksum: 'invalid_checksum'
      }
      
      const validEntry = {
        ...corruptedEntry,
        checksum: 'valid_checksum'
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(corruptedEntry))
      
      // Mock cache versioning for repair
      const mockCacheVersioning = {
        validateCacheEntry: vi.fn()
          .mockReturnValueOnce({ isValid: false, issues: ['Cache data integrity check failed (checksum mismatch)'] })
          .mockReturnValueOnce({ isValid: true }),
        calculateChecksumSync: vi.fn().mockReturnValue('valid_checksum'),
        createCacheEntry: vi.fn().mockReturnValue(validEntry)
      }
      
      ;(unifiedCache as any).cacheVersioning = mockCacheVersioning

      // Act
      const result = await pwaDataSync.getCachedTableData('attendees')

      // Assert
      expect(result).toEqual(mockTableData)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('kn_cache_attendees', JSON.stringify(validEntry))
    })

    it('should handle cache validation failures in agenda service', async () => {
      // Arrange
      const corruptedEntry = {
        data: null, // Invalid data
        version: '2.1.0',
        timestamp: '2025-01-21T00:00:00.000Z',
        ttl: 300000,
        checksum: 'invalid_checksum'
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(corruptedEntry))
      
      // Mock cache versioning to return validation failure
      const mockCacheVersioning = {
        validateCacheEntry: vi.fn().mockReturnValue({
          isValid: false,
          issues: ['Cache data integrity check failed (checksum mismatch)']
        })
      }
      
      ;(unifiedCache as any).cacheVersioning = mockCacheVersioning

      // Act
      const result = await agendaService.getActiveAgendaItems()

      // Assert
      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
    })
  })

  describe('Cache Recovery Integration', () => {
    it('should integrate cache recovery across multiple services', async () => {
      // Arrange
      const mockAgendaData = [
        { id: '1', title: 'Session 1', isActive: true },
        { id: '2', title: 'Session 2', isActive: true }
      ]
      
      const corruptedEntry = {
        data: mockAgendaData,
        version: '2.1.0',
        timestamp: '2025-01-21T00:00:00.000Z',
        ttl: 300000,
        checksum: 'invalid_checksum'
      }
      
      const validEntry = {
        ...corruptedEntry,
        checksum: 'valid_checksum'
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(corruptedEntry))
      
      // Mock cache versioning for repair
      const mockCacheVersioning = {
        validateCacheEntry: vi.fn()
          .mockReturnValueOnce({ isValid: false, issues: ['Cache data integrity check failed (checksum mismatch)'] })
          .mockReturnValueOnce({ isValid: true }),
        calculateChecksumSync: vi.fn().mockReturnValue('valid_checksum'),
        createCacheEntry: vi.fn().mockReturnValue(validEntry)
      }
      
      ;(unifiedCache as any).cacheVersioning = mockCacheVersioning

      // Act
      const result = await agendaService.getActiveAgendaItems()

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockAgendaData)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('kn_cache_agenda_items', JSON.stringify(validEntry))
    })

    it('should handle multiple cache corruption scenarios', async () => {
      // Arrange
      const corruptedKeys = ['kn_cache_agenda_items', 'kn_cache_attendees', 'kn_cache_sponsors']
      
      // Mock localStorage to return corrupted data for all keys
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (corruptedKeys.includes(key)) {
          return JSON.stringify({
            data: { id: '1', name: 'Test' },
            version: '2.1.0',
            timestamp: '2025-01-21T00:00:00.000Z',
            ttl: 300000,
            checksum: 'invalid_checksum'
          })
        }
        return null
      })
      
      // Mock cache versioning for repair
      const mockCacheVersioning = {
        validateCacheEntry: vi.fn()
          .mockReturnValueOnce({ isValid: false, issues: ['Cache data integrity check failed (checksum mismatch)'] })
          .mockReturnValueOnce({ isValid: true }),
        calculateChecksumSync: vi.fn().mockReturnValue('valid_checksum'),
        createCacheEntry: vi.fn().mockImplementation((data) => ({
          data,
          version: '2.1.0',
          timestamp: new Date().toISOString(),
          ttl: 300000,
          checksum: 'valid_checksum'
        }))
      }
      
      ;(unifiedCache as any).cacheVersioning = mockCacheVersioning

      // Act
      const results = await Promise.all([
        unifiedCache.get('kn_cache_agenda_items'),
        unifiedCache.get('kn_cache_attendees'),
        unifiedCache.get('kn_cache_sponsors')
      ])

      // Assert
      expect(results).toHaveLength(3)
      expect(results.every(result => result !== null)).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(3)
    })
  })

  describe('Error Boundary Integration', () => {
    it('should handle cache validation errors without crashing the application', async () => {
      // Arrange
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied')
      })
      
      // Mock cache versioning
      const mockCacheVersioning = {
        validateCacheEntry: vi.fn().mockReturnValue({ isValid: true })
      }
      
      ;(unifiedCache as any).cacheVersioning = mockCacheVersioning

      // Act
      const result = await unifiedCache.get('kn_cache_agenda_items')

      // Assert
      expect(result).toBeNull()
      // Should not throw an error
    })

    it('should handle JSON parsing errors gracefully', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue('invalid json data')
      
      // Mock cache versioning
      const mockCacheVersioning = {
        validateCacheEntry: vi.fn().mockReturnValue({ isValid: true })
      }
      
      ;(unifiedCache as any).cacheVersioning = mockCacheVersioning

      // Act
      const result = await unifiedCache.get('kn_cache_agenda_items')

      // Assert
      expect(result).toBeNull()
      // Should not throw an error
    })
  })
})
