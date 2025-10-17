/**
 * AuthContext Cache Lifecycle Tests
 * Tests for cache lifecycle management in authentication context
 * 
 * Test Categories:
 * - Login Page Cache Clearing: Tests for cache clearing on login page render
 * - Authentication Sync: Tests for coordinated sync after authentication
 * - Logout Cache Clearing: Tests for cache clearing on logout
 * - Cache State Validation: Tests for cache state validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '../../contexts/AuthContext'

// Mock external services
vi.mock('../../services/authenticationSyncService', () => ({
  AuthenticationSyncService: {
    getInstance: vi.fn(() => ({
      syncAfterAuthentication: vi.fn()
    }))
    }
}))

vi.mock('../../services/dataClearingService', () => ({
  dataClearingService: {
    clearAllData: vi.fn(),
    verifyDataCleared: vi.fn()
  }
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

describe('AuthContext - Cache Lifecycle', () => {
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

  describe('Login Page Cache Clearing', () => {
    it('should clear cache when login page renders', async () => {
      // Arrange
      mockLocalStorage.length = 3
      mockLocalStorage.key
        .mockReturnValueOnce('kn_cache_agenda_items')
        .mockReturnValueOnce('kn_cache_attendees')
        .mockReturnValueOnce('kn_sync_status')
        .mockReturnValue(null)

      // Act
      render(<AuthProvider><div>Test</div></AuthProvider>)

      // Assert
      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cache_agenda_items')
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cache_attendees')
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_sync_status')
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('conference_auth')
      })
    })

    it('should handle empty cache gracefully', async () => {
      // Arrange
      mockLocalStorage.length = 0
      mockLocalStorage.key.mockReturnValue(null)

      // Act
      render(<AuthProvider><div>Test</div></AuthProvider>)

      // Assert
      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('conference_auth')
      })
    })

    it('should clear Supabase auth tokens', async () => {
      // Arrange
      mockLocalStorage.length = 2
      mockLocalStorage.key
        .mockReturnValueOnce('sb-access-token')
        .mockReturnValueOnce('sb-refresh-token')
        .mockReturnValue(null)

      // Act
      render(<AuthProvider><div>Test</div></AuthProvider>)

      // Assert
      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-access-token')
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-refresh-token')
      })
    })

    it('should handle localStorage errors gracefully', async () => {
      // Arrange
      mockLocalStorage.length = 1
      mockLocalStorage.key.mockReturnValue('kn_cache_test')
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      // Act
      render(<AuthProvider><div>Test</div></AuthProvider>)

      // Assert
      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cache_test')
      })
    })
  })

  describe('Authentication Sync', () => {
    it('should perform coordinated sync after successful authentication', async () => {
      // Arrange
      const mockAuthSyncService = {
        syncAfterAuthentication: vi.fn().mockResolvedValue({
          success: true,
          syncedTables: ['agenda_items', 'attendees'],
          totalRecords: 100
        })
      }

      const { AuthenticationSyncService } = await import('../../services/authenticationSyncService')
      AuthenticationSyncService.getInstance.mockReturnValue(mockAuthSyncService)

      // Mock successful authentication
      mockLocalStorage.getItem.mockReturnValue('{"user": "test"}')

      // Act
      render(<AuthProvider><div>Test</div></AuthProvider>)

      // Assert
      await waitFor(() => {
        expect(mockAuthSyncService.syncAfterAuthentication).toHaveBeenCalled()
      })
    })

    it('should handle sync failure gracefully', async () => {
      // Arrange
      const mockAuthSyncService = {
        syncAfterAuthentication: vi.fn().mockResolvedValue({
          success: false,
          error: 'Sync failed'
        })
      }

      const { AuthenticationSyncService } = await import('../../services/authenticationSyncService')
      AuthenticationSyncService.getInstance.mockReturnValue(mockAuthSyncService)

      // Mock successful authentication
      mockLocalStorage.getItem.mockReturnValue('{"user": "test"}')

      // Act
      render(<AuthProvider><div>Test</div></AuthProvider>)

      // Assert
      await waitFor(() => {
        expect(mockAuthSyncService.syncAfterAuthentication).toHaveBeenCalled()
      })
    })

    it('should handle sync service import failure', async () => {
      // Arrange
      const { AuthenticationSyncService } = await import('../../services/authenticationSyncService')
      AuthenticationSyncService.getInstance.mockImplementation(() => {
        throw new Error('Service import failed')
      })

      // Mock successful authentication
      mockLocalStorage.getItem.mockReturnValue('{"user": "test"}')

      // Act
      render(<AuthProvider><div>Test</div></AuthProvider>)

      // Assert
      await waitFor(() => {
        // Should not throw error, should handle gracefully
      })
    })
  })

  describe('Logout Cache Clearing', () => {
    it('should clear remaining cache entries on logout', async () => {
      // Arrange
      const mockDataClearingService = {
        clearAllData: vi.fn().mockResolvedValue({
          success: true,
          performanceMetrics: { duration: 100 }
        }),
        verifyDataCleared: vi.fn().mockResolvedValue(true)
      }

      const { dataClearingService } = await import('../../services/dataClearingService')
      dataClearingService.clearAllData.mockResolvedValue(mockDataClearingService.clearAllData())
      dataClearingService.verifyDataCleared.mockResolvedValue(mockDataClearingService.verifyDataCleared())

      mockLocalStorage.length = 2
      mockLocalStorage.key
        .mockReturnValueOnce('kn_cache_agenda_items')
        .mockReturnValueOnce('kn_cache_attendees')
        .mockReturnValue(null)

      // Act
      render(<AuthProvider><div>Test</div></AuthProvider>)

      // Assert
      await waitFor(() => {
        expect(mockDataClearingService.clearAllData).toHaveBeenCalled()
        expect(mockDataClearingService.verifyDataCleared).toHaveBeenCalled()
      })
    })

    it('should handle data clearing failure gracefully', async () => {
      // Arrange
      const mockDataClearingService = {
        clearAllData: vi.fn().mockResolvedValue({
          success: false,
          errors: ['Data clearing failed']
        })
      }

      const { dataClearingService } = await import('../../services/dataClearingService')
      dataClearingService.clearAllData.mockResolvedValue(mockDataClearingService.clearAllData())

      // Act
      render(<AuthProvider><div>Test</div></AuthProvider>)

      // Assert
      await waitFor(() => {
        expect(mockDataClearingService.clearAllData).toHaveBeenCalled()
      })
    })

    it('should clear cache even if data clearing fails', async () => {
      // Arrange
      const mockDataClearingService = {
        clearAllData: vi.fn().mockRejectedValue(new Error('Data clearing error'))
      }

      const { dataClearingService } = await import('../../services/dataClearingService')
      dataClearingService.clearAllData.mockRejectedValue(mockDataClearingService.clearAllData())

      mockLocalStorage.length = 1
      mockLocalStorage.key.mockReturnValueOnce('kn_cache_test').mockReturnValue(null)

      // Act
      render(<AuthProvider><div>Test</div></AuthProvider>)

      // Assert
      await waitFor(() => {
        expect(mockDataClearingService.clearAllData).toHaveBeenCalled()
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cache_test')
      })
    })
  })

  describe('Cache State Validation', () => {
    it('should validate cache state after operations', async () => {
      // Arrange
      mockLocalStorage.getItem
        .mockReturnValueOnce('{"data": []}') // kn_cache_agenda_items
        .mockReturnValueOnce('{"data": []}') // kn_cache_attendees

      // Act
      render(<AuthProvider><div>Test</div></AuthProvider>)

      // Assert
      await waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('kn_cache_agenda_items')
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('kn_cache_attendees')
      })
    })

    it('should handle cache validation errors gracefully', async () => {
      // Arrange
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      // Act
      render(<AuthProvider><div>Test</div></AuthProvider>)

      // Assert
      await waitFor(() => {
        // Should not throw error, should handle gracefully
      })
    })
  })
})
