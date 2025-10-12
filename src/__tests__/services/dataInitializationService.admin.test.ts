/**
 * Data Initialization Service - Admin Access Tests
 * Tests for admin-specific data loading (no user authentication required)
 * 
 * Test Categories:
 * - Admin Data Loading: ensureDataLoadedForAdmin() functionality
 * - User Data Loading: Verify original ensureDataLoaded() unchanged
 * - Security Boundaries: Ensure correct authentication requirements
 * - Error Handling: Handle sync failures gracefully
 * 
 * Related: ADR-005 (Admin Authentication Pattern)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { dataInitializationService } from '../../services/dataInitializationService';

// Mock dependencies
vi.mock('../../services/serverDataSyncService', () => ({
  serverDataSyncService: {
    syncAllData: vi.fn()
  }
}));

vi.mock('../../services/authService', () => ({
  getAuthStatus: vi.fn()
}));

vi.mock('../../services/unifiedCacheService', () => ({
  unifiedCacheService: {
    get: vi.fn()
  }
}));

vi.mock('../../services/pwaDataSyncService', () => ({
  pwaDataSyncService: {
    getCachedTableData: vi.fn(),
    syncApplicationTable: vi.fn()
  }
}));

describe('DataInitializationService - Admin Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureDataLoadedForAdmin', () => {
    it('should load data for admin without user authentication check', async () => {
      // Arrange
      const mockCachedData = { data: [{ id: '1', title: 'Session 1' }] };
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      const { getAuthStatus } = await import('../../services/authService');
      
      unifiedCacheService.get.mockResolvedValue(mockCachedData);
      pwaDataSyncService.getCachedTableData.mockResolvedValue([{ id: '1' }]);

      // Act
      const result = await dataInitializationService.ensureDataLoadedForAdmin();

      // Assert
      expect(result.success).toBe(true);
      expect(result.hasData).toBe(true);
      expect(getAuthStatus).not.toHaveBeenCalled(); // No user auth check
    });

    it('should use cached data if available (fast path)', async () => {
      // Arrange
      const mockAgendaData = { data: [{ id: '1', title: 'Session 1' }] };
      const mockAttendeeData = { data: [{ id: '1', name: 'John Doe' }] };
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      const { serverDataSyncService } = await import('../../services/serverDataSyncService');
      
      // Mock hasCachedData to return true (both agenda and attendee data exists)
      unifiedCacheService.get
        .mockResolvedValueOnce(mockAgendaData) // First call for agenda_items
        .mockResolvedValueOnce(mockAttendeeData); // Second call for attendees
      
      pwaDataSyncService.getCachedTableData.mockResolvedValue([{ id: '1' }]);

      // Act
      const result = await dataInitializationService.ensureDataLoadedForAdmin();

      // Assert
      expect(result.success).toBe(true);
      expect(result.hasData).toBe(true);
      expect(serverDataSyncService.syncAllData).not.toHaveBeenCalled();
    });

    it('should sync fresh data if cache is empty', async () => {
      // Arrange
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      const { serverDataSyncService } = await import('../../services/serverDataSyncService');
      
      // Mock no cached data
      unifiedCacheService.get.mockResolvedValue(null);
      pwaDataSyncService.getCachedTableData.mockResolvedValue([]);
      
      // Mock successful sync
      serverDataSyncService.syncAllData.mockResolvedValue({
        success: true,
        syncedTables: ['attendees', 'agenda_items'],
        errors: [],
        totalRecords: 100
      });
      
      pwaDataSyncService.syncApplicationTable.mockResolvedValue(undefined);

      // Act
      const result = await dataInitializationService.ensureDataLoadedForAdmin();

      // Assert
      expect(result.success).toBe(true);
      expect(result.hasData).toBe(true);
      expect(serverDataSyncService.syncAllData).toHaveBeenCalled();
      expect(pwaDataSyncService.syncApplicationTable).toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      // Arrange
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      const { serverDataSyncService } = await import('../../services/serverDataSyncService');
      
      unifiedCacheService.get.mockResolvedValue(null);
      pwaDataSyncService.getCachedTableData.mockResolvedValue([]);
      
      // Mock sync failure
      serverDataSyncService.syncAllData.mockResolvedValue({
        success: false,
        syncedTables: [],
        errors: ['Network error'],
        totalRecords: 0
      });

      // Act
      const result = await dataInitializationService.ensureDataLoadedForAdmin();

      // Assert
      expect(result.success).toBe(false);
      expect(result.hasData).toBe(false);
      expect(result.error).toContain('Failed to load conference data');
    });

    it('should log admin data access attempts', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      
      const mockData = { data: [{ id: '1' }] };
      unifiedCacheService.get.mockResolvedValue(mockData);
      pwaDataSyncService.getCachedTableData.mockResolvedValue([{ id: '1' }]);

      // Act
      await dataInitializationService.ensureDataLoadedForAdmin();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Admin data access')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle network errors during sync', async () => {
      // Arrange
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      const { serverDataSyncService } = await import('../../services/serverDataSyncService');
      
      unifiedCacheService.get.mockResolvedValue(null);
      pwaDataSyncService.getCachedTableData.mockResolvedValue([]);
      
      // Mock network error
      serverDataSyncService.syncAllData.mockRejectedValue(
        new Error('Network error')
      );

      // Act
      const result = await dataInitializationService.ensureDataLoadedForAdmin();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('ensureDataLoaded (user/attendee)', () => {
    it('should still require user authentication', async () => {
      // Arrange
      const { getAuthStatus } = await import('../../services/authService');
      getAuthStatus.mockReturnValue({ isAuthenticated: false });

      // Act
      const result = await dataInitializationService.ensureDataLoaded();

      // Assert
      expect(result.success).toBe(false);
      expect(result.requiresAuthentication).toBe(true);
      expect(getAuthStatus).toHaveBeenCalled(); // User auth check required
    });

    it('should load data when user is authenticated', async () => {
      // Arrange
      const { getAuthStatus } = await import('../../services/authService');
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      
      getAuthStatus.mockReturnValue({
        isAuthenticated: true,
        attendee: { id: 'attendee-1' }
      });
      
      const mockData = { data: [{ id: '1' }] };
      unifiedCacheService.get.mockResolvedValue(mockData);
      pwaDataSyncService.getCachedTableData.mockResolvedValue([{ id: '1' }]);

      // Act
      const result = await dataInitializationService.ensureDataLoaded();

      // Assert
      expect(result.success).toBe(true);
      expect(result.hasData).toBe(true);
    });
  });
});

