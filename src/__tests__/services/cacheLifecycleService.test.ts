/**
 * Cache Lifecycle Service Tests
 * Tests for cache lifecycle validation and management
 * 
 * Test Categories:
 * - Clean State Validation: Tests for clean cache state validation
 * - Populated State Validation: Tests for populated cache state validation
 * - Cache State Debugging: Tests for cache state debugging functionality
 * - Force Clean Operations: Tests for force clean cache operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CacheLifecycleService } from '../../services/cacheLifecycleService'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

describe('CacheLifecycleService - Clean State Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.localStorage = mockLocalStorage as any
    mockLocalStorage.length = 0
    mockLocalStorage.key.mockReturnValue(null)
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Clean State Validation', () => {
    it('should validate clean state when no cache entries exist', () => {
      // Arrange
      mockLocalStorage.length = 0
      mockLocalStorage.key.mockReturnValue(null)
      mockLocalStorage.getItem.mockReturnValue(null)

      // Act
      const result = CacheLifecycleService.getInstance().validateCleanState()

      // Assert
      expect(result.isClean).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('should detect cache entries in clean state', () => {
      // Arrange
      mockLocalStorage.length = 2
      mockLocalStorage.key
        .mockReturnValueOnce('kn_cache_agenda_items')
        .mockReturnValueOnce('kn_cache_attendees')
        .mockReturnValue(null)
      mockLocalStorage.getItem.mockReturnValue(null)

      // Act
      const result = CacheLifecycleService.getInstance().validateCleanState()

      // Assert
      expect(result.isClean).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0]).toContain('Found 2 cache entries in clean state')
    })

    it('should detect authentication state in clean state', () => {
      // Arrange
      mockLocalStorage.length = 0
      mockLocalStorage.key.mockReturnValue(null)
      mockLocalStorage.getItem.mockReturnValue('{"user": "test"}') // conference_auth

      // Act
      const result = CacheLifecycleService.getInstance().validateCleanState()

      // Assert
      expect(result.isClean).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0]).toContain('Found authentication state in clean state')
    })

    it('should handle localStorage errors gracefully', () => {
      // Arrange
      mockLocalStorage.length = 0
      mockLocalStorage.key.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      // Act
      const result = CacheLifecycleService.getInstance().validateCleanState()

      // Assert
      expect(result.isClean).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0]).toContain('Cache validation failed')
    })
  })

  describe('Populated State Validation', () => {
    it('should validate populated state when required keys exist', () => {
      // Arrange
      mockLocalStorage.getItem
        .mockReturnValueOnce('{"data": []}') // kn_cache_agenda_items
        .mockReturnValueOnce('{"data": []}') // kn_cache_attendees

      // Act
      const result = CacheLifecycleService.getInstance().validatePopulatedState()

      // Assert
      expect(result.isPopulated).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('should detect missing required cache keys', () => {
      // Arrange
      mockLocalStorage.getItem
        .mockReturnValueOnce('{"data": []}') // kn_cache_agenda_items
        .mockReturnValueOnce(null) // kn_cache_attendees missing

      // Act
      const result = CacheLifecycleService.getInstance().validatePopulatedState()

      // Assert
      expect(result.isPopulated).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0]).toContain('Missing required cache key: kn_cache_attendees')
    })

    it('should detect multiple missing cache keys', () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue(null)

      // Act
      const result = CacheLifecycleService.getInstance().validatePopulatedState()

      // Assert
      expect(result.isPopulated).toBe(false)
      expect(result.issues).toHaveLength(2)
      expect(result.issues[0]).toContain('kn_cache_agenda_items')
      expect(result.issues[1]).toContain('kn_cache_attendees')
    })

    it('should handle localStorage errors gracefully', () => {
      // Arrange
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      // Act
      const result = CacheLifecycleService.getInstance().validatePopulatedState()

      // Assert
      expect(result.isPopulated).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0]).toContain('Cache validation failed')
    })
  })

  describe('Cache State Debugging', () => {
    it('should provide comprehensive cache state', () => {
      // Arrange
      mockLocalStorage.length = 2
      mockLocalStorage.key
        .mockReturnValueOnce('kn_cache_agenda_items')
        .mockReturnValueOnce('kn_cache_attendees')
        .mockReturnValue(null)
      mockLocalStorage.getItem
        .mockReturnValueOnce('{"data": []}') // kn_cache_agenda_items
        .mockReturnValueOnce('{"data": []}') // kn_cache_attendees
        .mockReturnValueOnce('{"user": "test"}') // conference_auth

      // Act
      const result = CacheLifecycleService.getInstance().getCacheState()

      // Assert
      expect(result.isClean).toBe(false) // Has cache entries
      expect(result.isPopulated).toBe(true) // Has required keys
      expect(result.authState).toBe(true) // Has auth state
      expect(result.cacheKeys).toHaveLength(2)
      expect(result.cacheKeys).toContain('kn_cache_agenda_items')
      expect(result.cacheKeys).toContain('kn_cache_attendees')
    })

    it('should handle errors in cache state validation', () => {
      // Arrange
      mockLocalStorage.length = 0
      mockLocalStorage.key.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      // Act
      const result = CacheLifecycleService.getInstance().getCacheState()

      // Assert
      expect(result.isClean).toBe(false)
      expect(result.isPopulated).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0]).toContain('Cache state validation failed')
      expect(result.cacheKeys).toHaveLength(0)
      expect(result.authState).toBe(false)
    })
  })

  describe('Force Clean Operations', () => {
    it('should successfully clear all cache entries', () => {
      // Arrange
      mockLocalStorage.length = 3
      mockLocalStorage.key
        .mockReturnValueOnce('kn_cache_agenda_items')
        .mockReturnValueOnce('kn_cache_attendees')
        .mockReturnValueOnce('kn_sync_status')
        .mockReturnValue(null)

      // Act
      const result = CacheLifecycleService.getInstance().forceCleanCache()

      // Assert
      expect(result.success).toBe(true)
      expect(result.clearedKeys).toHaveLength(3)
      expect(result.clearedKeys).toContain('kn_cache_agenda_items')
      expect(result.clearedKeys).toContain('kn_cache_attendees')
      expect(result.clearedKeys).toContain('kn_sync_status')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(4) // 3 cache + conference_auth
    })

    it('should handle errors during force clean', () => {
      // Arrange
      mockLocalStorage.length = 1
      mockLocalStorage.key.mockReturnValue('kn_cache_test')
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('removeItem error')
      })

      // Act
      const result = CacheLifecycleService.getInstance().forceCleanCache()

      // Assert
      expect(result.success).toBe(false)
      expect(result.clearedKeys).toHaveLength(0)
    })
  })

  describe('Logging Operations', () => {
    it('should log cache state without errors', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      mockLocalStorage.length = 1
      mockLocalStorage.key.mockReturnValueOnce('kn_cache_test').mockReturnValue(null)
      mockLocalStorage.getItem.mockReturnValue('{"data": []}')

      // Act
      CacheLifecycleService.getInstance().logCacheState()

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('📊 Cache State Debug Info:')
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Clean:'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Populated:'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Auth State:'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cache Keys:'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Issues:'))

      consoleSpy.mockRestore()
    })
  })
})
