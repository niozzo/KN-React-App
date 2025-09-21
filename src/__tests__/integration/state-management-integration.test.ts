/**
 * Integration Tests for State Management
 * Story 2.1f4: Integration & Testing
 * 
 * Comprehensive integration tests for all new state management components
 */

import { renderHook, act } from '@testing-library/react';
import { useDataLoading } from '../../hooks/useDataLoading';
import { useUIState } from '../../hooks/useUIState';
import { useAgendaData } from '../../hooks/useAgendaData';
import { UnifiedCacheService } from '../../services/unifiedCacheService';

import { vi } from 'vitest';

// Mock the unified cache service
vi.mock('../../services/unifiedCacheService', () => ({
  unifiedCacheService: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    invalidate: vi.fn(),
    clear: vi.fn(),
    getHealthStatus: vi.fn()
  }
}));

// Mock the agenda service
vi.mock('../../services/agendaService', () => ({
  agendaService: {
    getActiveAgendaItems: vi.fn()
  }
}));

import { unifiedCacheService } from '../../services/unifiedCacheService';
import { agendaService } from '../../services/agendaService';

const mockUnifiedCache = unifiedCacheService as any;
const mockAgendaService = agendaService as any;

describe('State Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Data Loading + UI State Integration', () => {
    it('should load data and update UI state correctly', async () => {
      const mockData = { data: [{ id: '1', title: 'Test Session' }], success: true };
      mockAgendaService.getActiveAgendaItems.mockResolvedValue(mockData);
      mockUnifiedCache.get.mockResolvedValue(null);

      const { result } = renderHook(() => useAgendaData());

      await act(async () => {
        await result.current.loadAgendaItems();
      });

      expect(result.current.agendaData).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle cache hits correctly', async () => {
      const mockData = { data: [{ id: '1', title: 'Test Session' }], success: true };
      mockUnifiedCache.get.mockResolvedValue(mockData);

      const { result } = renderHook(() => useAgendaData());

      await act(async () => {
        await result.current.loadAgendaItems();
      });

      expect(mockUnifiedCache.get).toHaveBeenCalledWith('kn_cache_agenda_items');
      expect(result.current.agendaData).toEqual(mockData);
      expect(mockAgendaService.getActiveAgendaItems).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Network error');
      mockAgendaService.getActiveAgendaItems.mockRejectedValue(error);
      mockUnifiedCache.get.mockResolvedValue(null);

      const { result } = renderHook(() => useAgendaData());

      await act(async () => {
        await result.current.loadAgendaItems();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.agendaData).toBeNull();
    });
  });

  describe('Cache Service Integration', () => {
    it('should integrate with unified cache service', async () => {
      const { result } = renderHook(() => useDataLoading());

      await act(async () => {
        await result.current.loadData('test-key', () => Promise.resolve('test-data'));
      });

      expect(mockUnifiedCache.set).toHaveBeenCalledWith('test-key', 'test-data', expect.any(Number));
    });

    it('should handle cache invalidation', async () => {
      const { result } = renderHook(() => useDataLoading());

      await act(async () => {
        await result.current.clearCache('test-key');
      });

      expect(mockUnifiedCache.remove).toHaveBeenCalledWith('test-key');
    });
  });

  describe('UI State Validation', () => {
    it('should validate state correctly', () => {
      const { result } = renderHook(() => useUIState(
        { sessions: [], allSessions: [] },
        {
          validate: (state) => {
            if (state.sessions.length === 0 && state.allSessions.length > 0) {
              return 'Sessions filtered but no results';
            }
            return true;
          },
          debounceMs: 0 // No debounce for testing
        }
      ));

      act(() => {
        result.current.updateState({ allSessions: [{ id: '1', title: 'Test' }] });
      });

      // Wait for validation to complete
      act(() => {
        result.current.validateState();
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.error).toBe('Sessions filtered but no results');
    });
  });

  describe('End-to-End Data Flow', () => {
    it('should complete full data loading flow', async () => {
      const mockAgendaData = {
        data: [
          { id: '1', title: 'Morning Session', isActive: true },
          { id: '2', title: 'Afternoon Session', isActive: true }
        ],
        success: true
      };

      mockUnifiedCache.get.mockResolvedValue(null);
      mockAgendaService.getActiveAgendaItems.mockResolvedValue(mockAgendaData);

      const { result } = renderHook(() => useAgendaData());

      // Load data
      await act(async () => {
        await result.current.loadAgendaItems();
      });

      expect(result.current.agendaData).toEqual(mockAgendaData);
      expect(result.current.loading).toBe(false);

      // Refresh data
      await act(async () => {
        await result.current.refreshAgendaItems();
      });

      expect(mockAgendaService.getActiveAgendaItems).toHaveBeenCalledTimes(2);

      // Clear cache
      await act(async () => {
        await result.current.clearAgendaCache();
      });

      expect(mockUnifiedCache.remove).toHaveBeenCalledWith('kn_cache_agenda_items');
    });
  });

  describe('Error Recovery', () => {
    it('should recover from cache corruption', async () => {
      // Simulate cache corruption
      mockUnifiedCache.get.mockRejectedValue(new Error('Cache corruption'));
      mockAgendaService.getActiveAgendaItems.mockResolvedValue({
        data: [{ id: '1', title: 'Recovered Session' }],
        success: true
      });

      const { result } = renderHook(() => useAgendaData());

      await act(async () => {
        await result.current.loadAgendaItems();
      });

      // Should fallback to server and recover
      expect(result.current.agendaData).toEqual({
        data: [{ id: '1', title: 'Recovered Session' }],
        success: true
      });
    });

    it('should handle network failures with retry', async () => {
      const networkError = new Error('Network error');
      mockUnifiedCache.get.mockResolvedValue(null);
      mockAgendaService.getActiveAgendaItems
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          data: [{ id: '1', title: 'Retry Success' }],
          success: true
        });

      const { result } = renderHook(() => useDataLoading());

      await act(async () => {
        await result.current.loadData(
          'test-key',
          () => mockAgendaService.getActiveAgendaItems(),
          { retries: 3, retryDelay: 100 }
        );
      });

      // Should eventually succeed after retries
      expect(result.current.data).toEqual({
        data: [{ id: '1', title: 'Retry Success' }],
        success: true
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        title: `Session ${i}`,
        isActive: true
      }));

      mockUnifiedCache.get.mockResolvedValue(null);
      mockAgendaService.getActiveAgendaItems.mockResolvedValue({
        data: largeDataset,
        success: true
      });

      const startTime = performance.now();

      const { result } = renderHook(() => useAgendaData());

      await act(async () => {
        await result.current.loadAgendaItems();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.current.agendaData?.data).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
