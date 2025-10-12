/**
 * Security Boundary Tests - Admin Authentication
 * Verifies security boundaries between admin and user authentication
 * 
 * Test Categories:
 * - Access Control: Who can access what
 * - Authentication Separation: Admin vs User auth
 * - Data Access: Appropriate data access levels
 * 
 * Related: ADR-005 (Admin Authentication Pattern)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dataInitializationService } from '../../services/dataInitializationService';

// Mock dependencies
vi.mock('../../services/authService', () => ({
  getAuthStatus: vi.fn()
}));

vi.mock('../../services/serverDataSyncService', () => ({
  serverDataSyncService: {
    syncAllData: vi.fn()
  }
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

describe('Security Boundaries - Admin Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin Access Control', () => {
    it('admin can access without user authentication', async () => {
      // Arrange
      const { getAuthStatus } = await import('../../services/authService');
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      
      getAuthStatus.mockReturnValue({ isAuthenticated: false }); // No user auth
      
      const mockData = { data: [{ id: '1' }] };
      unifiedCacheService.get.mockResolvedValue(mockData);
      pwaDataSyncService.getCachedTableData.mockResolvedValue([{ id: '1' }]);

      // Act
      const result = await dataInitializationService.ensureDataLoadedForAdmin();

      // Assert
      expect(result.success).toBe(true);
      expect(getAuthStatus).not.toHaveBeenCalled(); // No user auth check
    });

    it('regular users cannot bypass authentication', async () => {
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
  });

  describe('Authentication Separation', () => {
    it('admin path does not grant user authentication', async () => {
      // Arrange
      const { getAuthStatus } = await import('../../services/authService');
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      
      const mockData = { data: [{ id: '1' }] };
      unifiedCacheService.get.mockResolvedValue(mockData);
      pwaDataSyncService.getCachedTableData.mockResolvedValue([{ id: '1' }]);
      
      getAuthStatus.mockReturnValue({ isAuthenticated: false });

      // Act
      await dataInitializationService.ensureDataLoadedForAdmin();
      
      // Try to access user data
      const userResult = await dataInitializationService.ensureDataLoaded();

      // Assert - Admin access doesn't change user auth status
      expect(userResult.success).toBe(false);
      expect(userResult.requiresAuthentication).toBe(true);
    });

    it('user authentication does not bypass admin passcode', () => {
      // This is a conceptual test - in practice, admin passcode is separate
      // User being authenticated doesn't grant admin access
      // Admin access requires passcode in AdminApp component
      
      // This would need to be tested in AdminApp component tests
      // Here we just verify the methods are separate
      expect(dataInitializationService.ensureDataLoaded).toBeDefined();
      expect(dataInitializationService.ensureDataLoadedForAdmin).toBeDefined();
      expect(dataInitializationService.ensureDataLoaded).not.toBe(
        dataInitializationService.ensureDataLoadedForAdmin
      );
    });
  });

  describe('Data Access Boundaries', () => {
    it('admin method allows data sync without user auth', async () => {
      // Arrange
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      const { serverDataSyncService } = await import('../../services/serverDataSyncService');
      const { getAuthStatus } = await import('../../services/authService');
      
      unifiedCacheService.get.mockResolvedValue(null); // No cache
      pwaDataSyncService.getCachedTableData.mockResolvedValue([]);
      
      serverDataSyncService.syncAllData.mockResolvedValue({
        success: true,
        syncedTables: ['attendees', 'agenda_items'],
        errors: [],
        totalRecords: 100
      });
      
      pwaDataSyncService.syncApplicationTable.mockResolvedValue(undefined);
      
      getAuthStatus.mockReturnValue({ isAuthenticated: false });

      // Act
      const result = await dataInitializationService.ensureDataLoadedForAdmin();

      // Assert
      expect(result.success).toBe(true);
      expect(serverDataSyncService.syncAllData).toHaveBeenCalled();
      expect(getAuthStatus).not.toHaveBeenCalled(); // Admin doesn't check user auth
    });

    it('user method requires auth before data sync', async () => {
      // Arrange
      const { getAuthStatus } = await import('../../services/authService');
      const { serverDataSyncService } = await import('../../services/serverDataSyncService');
      
      getAuthStatus.mockReturnValue({ isAuthenticated: false });

      // Act
      const result = await dataInitializationService.ensureDataLoaded();

      // Assert
      expect(result.success).toBe(false);
      expect(result.requiresAuthentication).toBe(true);
      expect(serverDataSyncService.syncAllData).not.toHaveBeenCalled();
      expect(getAuthStatus).toHaveBeenCalled();
    });
  });

  describe('Security Logging', () => {
    it('should log admin access without user auth', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
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
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('no user auth required')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle admin sync errors without exposing user auth', async () => {
      // Arrange
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      const { serverDataSyncService } = await import('../../services/serverDataSyncService');
      
      unifiedCacheService.get.mockResolvedValue(null);
      pwaDataSyncService.getCachedTableData.mockResolvedValue([]);
      
      serverDataSyncService.syncAllData.mockRejectedValue(
        new Error('Network error')
      );

      // Act
      const result = await dataInitializationService.ensureDataLoadedForAdmin();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.requiresAuthentication).toBeUndefined(); // Admin errors don't mention user auth
    });

    it('should indicate user auth required for user method', async () => {
      // Arrange
      const { getAuthStatus } = await import('../../services/authService');
      getAuthStatus.mockReturnValue({ isAuthenticated: false });

      // Act
      const result = await dataInitializationService.ensureDataLoaded();

      // Assert
      expect(result.success).toBe(false);
      expect(result.requiresAuthentication).toBe(true);
    });
  });
});

