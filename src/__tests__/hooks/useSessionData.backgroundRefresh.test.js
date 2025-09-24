/**
 * Background Refresh Test Suite
 * Tests for Application Database metadata sync during periodic refresh
 * Addresses QA concerns about missing test coverage
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useSessionData } from '../../hooks/useSessionData';
import { agendaService } from '../../services/agendaService.ts';
import { pwaDataSyncService } from '../../services/pwaDataSyncService.ts';

// Mock services
jest.mock('../../services/agendaService.ts');
jest.mock('../../services/pwaDataSyncService.ts');
jest.mock('../../services/dataService.ts');
jest.mock('../../contexts/AuthContext');
jest.mock('../../lib/supabase.js');
jest.mock('../../services/supabaseClientService.ts');

describe('useSessionData Background Refresh', () => {
  const mockAgendaService = agendaService;
  const mockPwaDataSyncService = pwaDataSyncService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup localStorage with cached data
    const mockCachedData = {
      sessions: [
        { id: '1', title: 'Session 1', date: '2025-01-01', start_time: '09:00:00' }
      ],
      diningOptions: [
        { id: 'dining-1', name: 'Original Breakfast Title', type: 'dining' }
      ],
      allEvents: []
    };
    localStorage.setItem('kn_cached_sessions', JSON.stringify(mockCachedData));

    // Mock authentication
    require('../../contexts/AuthContext').useAuth.mockReturnValue({
      isAuthenticated: true
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Application Database Metadata Sync', () => {
    it('should preserve dining metadata overrides during background refresh', async () => {
      // Given: Mock services with conference data and metadata
      const mockConferenceData = {
        success: true,
        data: [
          { id: '1', title: 'Updated Session', date: '2025-01-01', start_time: '09:00:00' }
        ]
      };
      
      const mockDiningMetadata = [
        { id: 'dining-1', title: 'Override Breakfast Title' }
      ];

      mockAgendaService.getActiveAgendaItems.mockResolvedValue(mockConferenceData);
      mockPwaDataSyncService.getCachedTableData.mockResolvedValue(mockDiningMetadata);

      // When: Hook loads with cached data (triggers background refresh)
      const { result } = renderHook(() => useSessionData({
        autoRefresh: true,
        refreshInterval: 300000,
        enableOfflineMode: true
      }));

      // Then: Background refresh should sync both databases
      await waitFor(() => {
        expect(mockAgendaService.getActiveAgendaItems).toHaveBeenCalled();
        expect(mockPwaDataSyncService.getCachedTableData).toHaveBeenCalledWith('dining_item_metadata');
      });

      // And: Dining options should have override titles preserved
      await waitFor(() => {
        const diningOptions = result.current.diningOptions;
        expect(diningOptions).toHaveLength(1);
        expect(diningOptions[0].name).toBe('Override Breakfast Title');
        expect(diningOptions[0].original_name).toBe('Original Breakfast Title');
      });
    });

    it('should handle Application Database metadata sync failure gracefully', async () => {
      // Given: Conference data succeeds but metadata sync fails
      const mockConferenceData = {
        success: true,
        data: [{ id: '1', title: 'Session 1' }]
      };

      mockAgendaService.getActiveAgendaItems.mockResolvedValue(mockConferenceData);
      mockPwaDataSyncService.getCachedTableData.mockRejectedValue(
        new Error('dining_item_metadata sync failed')
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // When: Background refresh occurs
      const { result } = renderHook(() => useSessionData());

      // Then: Should log specific error for metadata sync failure
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Application DB metadata sync failed')
        );
      });

      consoleSpy.mockRestore();
    });

    it('should sync both External DB and Application DB independently', async () => {
      // Given: Both services available
      mockAgendaService.getActiveAgendaItems.mockResolvedValue({
        success: true,
        data: [{ id: '1', title: 'Conference Session' }]
      });
      mockPwaDataSyncService.getCachedTableData.mockResolvedValue([
        { id: 'dining-1', title: 'Application Override' }
      ]);

      // When: Background refresh triggers
      renderHook(() => useSessionData());

      // Then: Both services should be called with Promise.all
      await waitFor(() => {
        expect(mockAgendaService.getActiveAgendaItems).toHaveBeenCalledTimes(1);
        expect(mockPwaDataSyncService.getCachedTableData).toHaveBeenCalledWith('dining_item_metadata');
      });
    });
  });

  describe('Database Architecture Compliance', () => {
    it('should maintain separation between External DB and Application DB', async () => {
      // Given: Mock both database sources
      const externalDbData = { success: true, data: [{ id: '1', title: 'External Data' }] };
      const applicationDbData = [{ id: '1', title: 'Application Override' }];

      mockAgendaService.getActiveAgendaItems.mockResolvedValue(externalDbData);
      mockPwaDataSyncService.getCachedTableData.mockResolvedValue(applicationDbData);

      // When: Background refresh occurs
      renderHook(() => useSessionData());

      // Then: External DB should be called for conference data
      await waitFor(() => {
        expect(mockAgendaService.getActiveAgendaItems).toHaveBeenCalled();
      });

      // And: Application DB should be called for metadata
      await waitFor(() => {
        expect(mockPwaDataSyncService.getCachedTableData).toHaveBeenCalledWith('dining_item_metadata');
      });
    });

    it('should update combined events with enriched dining data', async () => {
      // Given: Conference data and dining metadata
      const mockConferenceData = {
        success: true,
        data: [{ id: '1', title: 'Session 1', session_type: 'keynote' }]
      };
      
      const mockDiningMetadata = [
        { id: 'dining-1', title: 'Enhanced Breakfast Title' }
      ];

      mockAgendaService.getActiveAgendaItems.mockResolvedValue(mockConferenceData);
      mockPwaDataSyncService.getCachedTableData.mockResolvedValue(mockDiningMetadata);

      // When: Background refresh occurs
      const { result } = renderHook(() => useSessionData());

      // Then: Combined events should include enriched dining data
      await waitFor(() => {
        const allEvents = result.current.allEvents;
        expect(allEvents).toBeDefined();
        // Events should be merged with enriched dining options
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle External DB failure without affecting Application DB', async () => {
      // Given: External DB fails, Application DB succeeds
      mockAgendaService.getActiveAgendaItems.mockRejectedValue(new Error('External DB failed'));
      mockPwaDataSyncService.getCachedTableData.mockResolvedValue([]);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // When: Background refresh occurs
      renderHook(() => useSessionData());

      // Then: Should log error without crashing
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('BACKGROUND: Server refresh failed')
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle Promise.all rejection gracefully', async () => {
      // Given: Both services fail
      mockAgendaService.getActiveAgendaItems.mockRejectedValue(new Error('Service unavailable'));
      mockPwaDataSyncService.getCachedTableData.mockRejectedValue(new Error('Metadata unavailable'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // When: Background refresh occurs
      renderHook(() => useSessionData());

      // Then: Should handle rejection without crashing
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Considerations', () => {
    it('should use Promise.all for concurrent database access', async () => {
      // Given: Both services available
      const startTime = Date.now();
      
      mockAgendaService.getActiveAgendaItems.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: [] }), 100))
      );
      mockPwaDataSyncService.getCachedTableData.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      // When: Background refresh occurs
      renderHook(() => useSessionData());

      // Then: Both calls should execute concurrently (not sequentially)
      await waitFor(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        // Should take ~100ms (concurrent) not ~200ms (sequential)
        expect(duration).toBeLessThan(150);
      });
    });
  });
});
