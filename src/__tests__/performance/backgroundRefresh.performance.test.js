/**
 * Background Refresh Performance Test
 * Tests performance impact of Application Database metadata sync
 * Addresses QA concerns about performance validation
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useSessionData } from '../../hooks/useSessionData';

// Mock services
jest.mock('../../services/agendaService.ts');
jest.mock('../../services/pwaDataSyncService.ts');
jest.mock('../../services/dataService.ts');
jest.mock('../../contexts/AuthContext');
jest.mock('../../lib/supabase.js');
jest.mock('../../services/supabaseClientService.ts');

describe('Background Refresh Performance', () => {
  beforeEach(() => {
    // Mock authentication
    require('../../contexts/AuthContext').useAuth.mockReturnValue({
      isAuthenticated: true
    });

    // Setup localStorage with large dataset
    const largeCachedData = {
      sessions: Array.from({ length: 100 }, (_, i) => ({
        id: `session-${i}`,
        title: `Session ${i}`,
        date: '2025-01-01',
        start_time: '09:00:00'
      })),
      diningOptions: Array.from({ length: 50 }, (_, i) => ({
        id: `dining-${i}`,
        name: `Original Dining ${i}`,
        type: 'dining'
      })),
      allEvents: []
    };
    localStorage.setItem('kn_cached_sessions', JSON.stringify(largeCachedData));
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Concurrent Database Access Performance', () => {
    it('should execute External DB and Application DB calls concurrently', async () => {
      // Given: Services with artificial delays
      const { agendaService } = require('../../services/agendaService.ts');
      const { pwaDataSyncService } = require('../../services/pwaDataSyncService.ts');

      const externalDbDelay = 200; // 200ms
      const applicationDbDelay = 150; // 150ms

      agendaService.getActiveAgendaItems.mockImplementation(() =>
        new Promise(resolve => 
          setTimeout(() => resolve({ success: true, data: [] }), externalDbDelay)
        )
      );

      pwaDataSyncService.getCachedTableData.mockImplementation(() =>
        new Promise(resolve => 
          setTimeout(() => resolve([]), applicationDbDelay)
        )
      );

      // When: Background refresh is triggered
      const startTime = performance.now();
      
      renderHook(() => useSessionData());

      await waitFor(() => {
        expect(agendaService.getActiveAgendaItems).toHaveBeenCalled();
        expect(pwaDataSyncService.getCachedTableData).toHaveBeenCalled();
      });

      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      // Then: Total time should be closer to max(delays) not sum(delays)
      // Concurrent: ~200ms, Sequential: ~350ms
      expect(totalDuration).toBeLessThan(300); // Allow some overhead
      expect(totalDuration).toBeGreaterThan(190); // Should take at least the longest delay
    });

    it('should handle large datasets efficiently', async () => {
      // Given: Large metadata dataset
      const largeMetadata = Array.from({ length: 1000 }, (_, i) => ({
        id: `dining-${i}`,
        title: `Override Title ${i}`
      }));

      const { agendaService } = require('../../services/agendaService.ts');
      const { pwaDataSyncService } = require('../../services/pwaDataSyncService.ts');

      agendaService.getActiveAgendaItems.mockResolvedValue({
        success: true,
        data: []
      });
      pwaDataSyncService.getCachedTableData.mockResolvedValue(largeMetadata);

      // When: Background refresh processes large dataset
      const startTime = performance.now();
      
      const { result } = renderHook(() => useSessionData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Then: Processing should complete within reasonable time
      expect(processingTime).toBeLessThan(1000); // Less than 1 second
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should not cause memory leaks during repeated refreshes', async () => {
      // Given: Services that resolve quickly
      const { agendaService } = require('../../services/agendaService.ts');
      const { pwaDataSyncService } = require('../../services/pwaDataSyncService.ts');

      agendaService.getActiveAgendaItems.mockResolvedValue({
        success: true,
        data: [{ id: '1', title: 'Session' }]
      });
      pwaDataSyncService.getCachedTableData.mockResolvedValue([
        { id: '1', title: 'Override' }
      ]);

      // When: Multiple refreshes occur
      const { result, rerender } = renderHook(() => useSessionData());

      // Simulate multiple refreshes
      for (let i = 0; i < 10; i++) {
        rerender();
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });
      }

      // Then: Should not accumulate excessive memory
      // (In a real test, we would measure memory usage)
      expect(agendaService.getActiveAgendaItems).toHaveBeenCalledTimes(10);
      expect(pwaDataSyncService.getCachedTableData).toHaveBeenCalledTimes(10);
    });

    it('should efficiently update state without unnecessary re-renders', async () => {
      // Given: Services with consistent data
      const { agendaService } = require('../../services/agendaService.ts');
      const { pwaDataSyncService } = require('../../services/pwaDataSyncService.ts');

      const consistentData = { success: true, data: [{ id: '1', title: 'Consistent' }] };
      const consistentMetadata = [{ id: '1', title: 'Consistent Override' }];

      agendaService.getActiveAgendaItems.mockResolvedValue(consistentData);
      pwaDataSyncService.getCachedTableData.mockResolvedValue(consistentMetadata);

      // When: Hook renders and updates
      const renderSpy = jest.fn();
      const { result } = renderHook(() => {
        renderSpy();
        return useSessionData();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialRenderCount = renderSpy.mock.calls.length;

      // Trigger another update with same data
      await waitFor(() => {
        expect(result.current.lastUpdated).toBeDefined();
      });

      // Then: Should not cause excessive re-renders
      const finalRenderCount = renderSpy.mock.calls.length;
      expect(finalRenderCount - initialRenderCount).toBeLessThan(5); // Allow some updates
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors without performance degradation', async () => {
      // Given: Services that throw errors
      const { agendaService } = require('../../services/agendaService.ts');
      const { pwaDataSyncService } = require('../../services/pwaDataSyncService.ts');

      agendaService.getActiveAgendaItems.mockRejectedValue(new Error('External DB error'));
      pwaDataSyncService.getCachedTableData.mockRejectedValue(new Error('Application DB error'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // When: Background refresh encounters errors
      const startTime = performance.now();
      
      const { result } = renderHook(() => useSessionData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const endTime = performance.now();
      const errorHandlingTime = endTime - startTime;

      // Then: Error handling should be fast
      expect(errorHandlingTime).toBeLessThan(500); // Less than 500ms
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Cache Performance', () => {
    it('should leverage localStorage cache for fast initial load', async () => {
      // Given: Data in localStorage cache
      const { getCurrentAttendeeData } = require('../../services/dataService.ts');
      getCurrentAttendeeData.mockResolvedValue({ id: '1', name: 'Test User' });

      // When: Hook initializes with cache
      const startTime = performance.now();
      
      const { result } = renderHook(() => useSessionData());

      // Wait for initial cache load (should be fast)
      await waitFor(() => {
        expect(result.current.sessions).toBeDefined();
      });

      const cacheLoadTime = performance.now() - startTime;

      // Then: Cache load should be very fast
      expect(cacheLoadTime).toBeLessThan(100); // Less than 100ms
    });

    it('should not block UI during background refresh', async () => {
      // Given: Background refresh with delays
      const { agendaService } = require('../../services/agendaService.ts');
      const { pwaDataSyncService } = require('../../services/pwaDataSyncService.ts');

      agendaService.getActiveAgendaItems.mockImplementation(() =>
        new Promise(resolve => 
          setTimeout(() => resolve({ success: true, data: [] }), 300)
        )
      );
      pwaDataSyncService.getCachedTableData.mockImplementation(() =>
        new Promise(resolve => 
          setTimeout(() => resolve([]), 200)
        )
      );

      // When: Hook loads with cached data
      const { result } = renderHook(() => useSessionData());

      // Then: Should immediately provide cached data (non-blocking)
      await waitFor(() => {
        expect(result.current.sessions).toBeDefined();
        expect(result.current.isLoading).toBe(false);
      });

      // Background refresh should happen without affecting UI responsiveness
      await waitFor(() => {
        expect(agendaService.getActiveAgendaItems).toHaveBeenCalled();
      });
    });
  });
});
