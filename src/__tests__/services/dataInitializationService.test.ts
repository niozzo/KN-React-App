/**
 * DataInitializationService Tests
 * 
 * Tests for the data initialization service that ensures data is loaded
 * before admin panel access, following authentication-first patterns.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { dataInitializationService } from '../../services/dataInitializationService';
import { getAuthStatus } from '../../services/authService';
import { serverDataSyncService } from '../../services/serverDataSyncService';

// Mock dependencies
vi.mock('../../services/authService', () => ({
  getAuthStatus: vi.fn()
}));

vi.mock('../../services/serverDataSyncService', () => ({
  serverDataSyncService: {
    syncAllData: vi.fn()
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('DataInitializationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ensureDataLoaded', () => {
    it('should return authentication required when user is not authenticated', async () => {
      // Arrange
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: false,
        attendee: null
      });

      // Act
      const result = await dataInitializationService.ensureDataLoaded();

      // Assert
      expect(result).toEqual({
        success: false,
        hasData: false,
        requiresAuthentication: true,
        error: 'Authentication required to access admin data'
      });
    });

    it('should return success when data is already cached', async () => {
      // Arrange
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: true,
        attendee: { id: '1', first_name: 'John', last_name: 'Doe' }
      });

      // Mock cached data
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify({ data: [{ id: '1', title: 'Session 1' }] })) // agenda items
        .mockReturnValueOnce(JSON.stringify({ data: [{ id: '1', first_name: 'John', last_name: 'Doe' }] })); // attendees

      // Act
      const result = await dataInitializationService.ensureDataLoaded();

      // Assert
      expect(result).toEqual({
        success: true,
        hasData: true
      });
    });

    it('should trigger sync when no cached data exists', async () => {
      // Arrange
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: true,
        attendee: { id: '1', first_name: 'John', last_name: 'Doe' }
      });

      mockLocalStorage.getItem.mockReturnValue(null); // No cached data
      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue({
        success: true,
        syncedTables: ['attendees', 'agenda_items'],
        errors: [],
        totalRecords: 10
      });

      // Act
      const result = await dataInitializationService.ensureDataLoaded();

      // Assert
      expect(serverDataSyncService.syncAllData).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        hasData: true
      });
    });

    it('should return error when sync fails', async () => {
      // Arrange
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: true,
        attendee: { id: '1', first_name: 'John', last_name: 'Doe' }
      });

      mockLocalStorage.getItem.mockReturnValue(null); // No cached data
      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue({
        success: false,
        syncedTables: [],
        errors: ['Network error'],
        totalRecords: 0
      });

      // Act
      const result = await dataInitializationService.ensureDataLoaded();

      // Assert
      expect(result).toEqual({
        success: false,
        hasData: false,
        error: 'Failed to load conference data. Please try refreshing the page.'
      });
    });

    it('should return error when sync throws exception', async () => {
      // Arrange
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: true,
        attendee: { id: '1', first_name: 'John', last_name: 'Doe' }
      });

      mockLocalStorage.getItem.mockReturnValue(null); // No cached data
      vi.mocked(serverDataSyncService.syncAllData).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await dataInitializationService.ensureDataLoaded();

      // Assert
      expect(result).toEqual({
        success: false,
        hasData: false,
        error: 'Failed to initialize data. Please check your connection and try again.'
      });
    });
  });

  describe('forceRefreshData', () => {
    it('should return authentication required when user is not authenticated', async () => {
      // Arrange
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: false,
        attendee: null
      });

      // Act
      const result = await dataInitializationService.forceRefreshData();

      // Assert
      expect(result).toEqual({
        success: false,
        hasData: false,
        requiresAuthentication: true,
        error: 'Authentication required to refresh data'
      });
    });

    it('should force sync and return success', async () => {
      // Arrange
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: true,
        attendee: { id: '1', first_name: 'John', last_name: 'Doe' }
      });

      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue({
        success: true,
        syncedTables: ['attendees', 'agenda_items'],
        errors: [],
        totalRecords: 10
      });

      // Act
      const result = await dataInitializationService.forceRefreshData();

      // Assert
      expect(serverDataSyncService.syncAllData).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        hasData: true
      });
    });

    it('should return error when force refresh fails', async () => {
      // Arrange
      vi.mocked(getAuthStatus).mockReturnValue({
        isAuthenticated: true,
        attendee: { id: '1', first_name: 'John', last_name: 'Doe' }
      });

      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue({
        success: false,
        syncedTables: [],
        errors: ['Network error'],
        totalRecords: 0
      });

      // Act
      const result = await dataInitializationService.forceRefreshData();

      // Assert
      expect(result).toEqual({
        success: false,
        hasData: false,
        error: 'Failed to refresh data. Please try again.'
      });
    });
  });
});
