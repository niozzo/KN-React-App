/**
 * Authentication Sync Service Tests
 * Tests for coordinated authentication sync operations
 * 
 * Test Categories:
 * - Successful Sync: Tests for successful sync operations
 * - Sync Failures: Tests for handling sync failures
 * - Cache Validation: Tests for cache population validation
 * - Error Handling: Tests for error handling and recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AuthenticationSyncService } from '../../services/authenticationSyncService'

// Mock external services
vi.mock('../../services/serverDataSyncService', () => ({
  serverDataSyncService: {
    syncAllData: vi.fn()
  }
}))

vi.mock('../../services/attendeeSyncService', () => ({
  attendeeSyncService: {
    refreshAttendeeData: vi.fn()
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

describe('AuthenticationSyncService - Successful Sync', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    global.localStorage = mockLocalStorage as any
    
    // Setup successful mocks
    const { serverDataSyncService } = await import('../../services/serverDataSyncService')
    const { attendeeSyncService } = await import('../../services/attendeeSyncService')
    
    serverDataSyncService.syncAllData.mockResolvedValue({
      success: true,
      syncedTables: ['agenda_items', 'attendees'],
      totalRecords: 100
    })
    
    attendeeSyncService.refreshAttendeeData.mockResolvedValue(undefined)
    
    // Mock localStorage for cache validation
    mockLocalStorage.getItem
      .mockReturnValueOnce('{"data": []}') // kn_cache_agenda_items
      .mockReturnValueOnce('{"data": []}') // kn_cache_attendees
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Successful Sync Operations', () => {
    it('should successfully sync all data after authentication', async () => {
      // Act
      const result = await AuthenticationSyncService.getInstance().syncAfterAuthentication()

      // Assert
      expect(result.success).toBe(true)
      expect(result.syncedTables).toContain('agenda_items')
      expect(result.syncedTables).toContain('attendees')
      expect(result.syncedTables).toContain('attendee_sync')
      expect(result.totalRecords).toBe(100)
      expect(result.error).toBeUndefined()
    })

    it('should handle core sync failure gracefully', async () => {
      // Arrange
      const { serverDataSyncService } = await import('../../services/serverDataSyncService')
      serverDataSyncService.syncAllData.mockResolvedValue({
        success: false,
        error: 'Core sync failed'
      })

      // Act
      const result = await AuthenticationSyncService.getInstance().syncAfterAuthentication()

      // Assert
      expect(result.success).toBe(true) // Should still succeed
      expect(result.syncedTables).toContain('attendee_sync')
      expect(result.totalRecords).toBe(0)
    })

    it('should handle attendee sync failure gracefully', async () => {
      // Arrange
      const { attendeeSyncService } = await import('../../services/attendeeSyncService')
      attendeeSyncService.refreshAttendeeData.mockRejectedValue(new Error('Attendee sync failed'))

      // Act
      const result = await AuthenticationSyncService.getInstance().syncAfterAuthentication()

      // Assert
      expect(result.success).toBe(true) // Should still succeed
      expect(result.syncedTables).toContain('agenda_items')
      expect(result.syncedTables).toContain('attendees')
      expect(result.totalRecords).toBe(100)
    })

    it('should handle cache validation failure gracefully', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue(null) // No cache data

      // Act
      const result = await AuthenticationSyncService.getInstance().syncAfterAuthentication()

      // Assert
      expect(result.success).toBe(true) // Should still succeed
      expect(result.syncedTables).toContain('agenda_items')
      expect(result.syncedTables).toContain('attendees')
      expect(result.syncedTables).toContain('attendee_sync')
    })
  })

  describe('Error Handling', () => {
    it('should handle complete sync failure', async () => {
      // Arrange
      const { serverDataSyncService } = await import('../../services/serverDataSyncService')
      const { attendeeSyncService } = await import('../../services/attendeeSyncService')
      
      serverDataSyncService.syncAllData.mockRejectedValue(new Error('Server error'))
      attendeeSyncService.refreshAttendeeData.mockRejectedValue(new Error('Attendee error'))

      // Act
      const result = await AuthenticationSyncService.getInstance().syncAfterAuthentication()

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('Server error')
      expect(result.syncedTables).toHaveLength(0)
      expect(result.totalRecords).toBe(0)
    })

    it('should handle localStorage errors during validation', async () => {
      // Arrange
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      // Act
      const result = await AuthenticationSyncService.getInstance().syncAfterAuthentication()

      // Assert
      expect(result.success).toBe(true) // Should still succeed
      expect(result.syncedTables).toContain('agenda_items')
      expect(result.syncedTables).toContain('attendees')
      expect(result.syncedTables).toContain('attendee_sync')
    })

    it('should handle unknown errors gracefully', async () => {
      // Arrange
      const { serverDataSyncService } = await import('../../services/serverDataSyncService')
      serverDataSyncService.syncAllData.mockRejectedValue('Unknown error')

      // Act
      const result = await AuthenticationSyncService.getInstance().syncAfterAuthentication()

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('Authentication sync failed')
      expect(result.syncedTables).toHaveLength(0)
      expect(result.totalRecords).toBe(0)
    })
  })

  describe('Cache Validation', () => {
    it('should validate cache population successfully', async () => {
      // Arrange
      mockLocalStorage.getItem
        .mockReturnValueOnce('{"data": []}') // kn_cache_agenda_items
        .mockReturnValueOnce('{"data": []}') // kn_cache_attendees

      // Act
      const result = await AuthenticationSyncService.getInstance().syncAfterAuthentication()

      // Assert
      expect(result.success).toBe(true)
      expect(result.syncedTables).toContain('agenda_items')
      expect(result.syncedTables).toContain('attendees')
      expect(result.syncedTables).toContain('attendee_sync')
    })

    it('should detect missing cache keys', async () => {
      // Arrange
      mockLocalStorage.getItem
        .mockReturnValueOnce('{"data": []}') // kn_cache_agenda_items
        .mockReturnValueOnce(null) // kn_cache_attendees missing

      // Act
      const result = await AuthenticationSyncService.getInstance().syncAfterAuthentication()

      // Assert
      expect(result.success).toBe(true) // Should still succeed
      expect(result.syncedTables).toContain('agenda_items')
      expect(result.syncedTables).toContain('attendee_sync')
    })

    it('should detect multiple missing cache keys', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue(null)

      // Act
      const result = await AuthenticationSyncService.getInstance().syncAfterAuthentication()

      // Assert
      expect(result.success).toBe(true) // Should still succeed
      expect(result.syncedTables).toContain('attendee_sync')
    })
  })

  describe('Service Integration', () => {
    it('should call serverDataSyncService.syncAllData', async () => {
      // Act
      await AuthenticationSyncService.getInstance().syncAfterAuthentication()

      // Assert
      const { serverDataSyncService } = await import('../../services/serverDataSyncService')
      expect(serverDataSyncService.syncAllData).toHaveBeenCalledTimes(1)
    })

    it('should call attendeeSyncService.refreshAttendeeData', async () => {
      // Act
      await AuthenticationSyncService.getInstance().syncAfterAuthentication()

      // Assert
      const { attendeeSyncService } = await import('../../services/attendeeSyncService')
      expect(attendeeSyncService.refreshAttendeeData).toHaveBeenCalledTimes(1)
    })

    it('should handle service import failures', async () => {
      // Arrange
      vi.doMock('../../services/serverDataSyncService', () => {
        throw new Error('Import error')
      })

      // Act
      const result = await AuthenticationSyncService.getInstance().syncAfterAuthentication()

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('Import error')
    })
  })
})
