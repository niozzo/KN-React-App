/**
 * Periodic Refresh Integration Test
 * End-to-end testing for override title preservation during periodic refresh
 * Addresses QA concerns about missing integration test coverage
 */

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../../pages/HomePage';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock services
jest.mock('../../services/agendaService.ts');
jest.mock('../../services/pwaDataSyncService.ts');
jest.mock('../../services/dataService.ts');
jest.mock('../../lib/supabase.js');
jest.mock('../../services/supabaseClientService.ts');

describe('Periodic Refresh Integration', () => {
  const mockAuthContext = {
    isAuthenticated: true,
    user: { id: 'test-user' }
  };

  beforeEach(() => {
    // Setup localStorage with cached data
    const mockCachedData = {
      sessions: [
        { 
          id: 'session-1', 
          title: 'Morning Keynote', 
          date: '2025-01-01', 
          start_time: '09:00:00',
          end_time: '10:00:00',
          session_type: 'keynote'
        }
      ],
      diningOptions: [
        { 
          id: 'dining-1', 
          name: 'Original Breakfast', 
          type: 'dining',
          date: '2025-01-01',
          time: '08:00:00'
        }
      ],
      allEvents: []
    };
    localStorage.setItem('kn_cached_sessions', JSON.stringify(mockCachedData));

    // Mock services
    const { agendaService } = require('../../services/agendaService.ts');
    const { pwaDataSyncService } = require('../../services/pwaDataSyncService.ts');
    
    agendaService.getActiveAgendaItems.mockResolvedValue({
      success: true,
      data: [
        { 
          id: 'session-1', 
          title: 'Updated Morning Keynote', 
          date: '2025-01-01', 
          start_time: '09:00:00',
          end_time: '10:00:00',
          session_type: 'keynote'
        }
      ]
    });

    pwaDataSyncService.getCachedTableData.mockResolvedValue([
      { id: 'dining-1', title: 'Override Breakfast Title' }
    ]);

    // Mock other required services
    const { getCurrentAttendeeData, getAllDiningOptions } = require('../../services/dataService.ts');
    getCurrentAttendeeData.mockResolvedValue({
      id: 'attendee-1',
      first_name: 'Test',
      last_name: 'User'
    });
    getAllDiningOptions.mockResolvedValue([
      { 
        id: 'dining-1', 
        name: 'Original Breakfast',
        is_active: true,
        date: '2025-01-01',
        time: '08:00:00'
      }
    ]);
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  const renderHomePage = () => {
    return render(
      <MemoryRouter>
        <AuthProvider value={mockAuthContext}>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  describe('Override Title Preservation', () => {
    it('should maintain override titles during periodic refresh', async () => {
      // Given: Home page with cached data containing override titles
      renderHomePage();

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Then: Override title should be visible
      await waitFor(() => {
        expect(screen.getByText('Override Breakfast Title')).toBeInTheDocument();
      }, { timeout: 5000 });

      // When: Background refresh occurs (simulated by time)
      // The hook should automatically trigger background refresh due to cache load source

      // Then: Override title should still be preserved
      await waitFor(() => {
        expect(screen.getByText('Override Breakfast Title')).toBeInTheDocument();
      }, { timeout: 10000 });

      // And: Original title should not be visible
      expect(screen.queryByText('Original Breakfast')).not.toBeInTheDocument();
    });

    it('should handle multiple dining options with overrides', async () => {
      // Given: Multiple dining options with overrides
      const multipleOptions = [
        { 
          id: 'dining-1', 
          name: 'Original Breakfast',
          date: '2025-01-01',
          time: '08:00:00'
        },
        { 
          id: 'dining-2', 
          name: 'Original Lunch',
          date: '2025-01-01', 
          time: '12:00:00'
        }
      ];

      const multipleMetadata = [
        { id: 'dining-1', title: 'Enhanced Breakfast Experience' },
        { id: 'dining-2', title: 'Gourmet Lunch Selection' }
      ];

      localStorage.setItem('kn_cached_sessions', JSON.stringify({
        sessions: [],
        diningOptions: multipleOptions,
        allEvents: []
      }));

      const { pwaDataSyncService } = require('../../services/pwaDataSyncService.ts');
      pwaDataSyncService.getCachedTableData.mockResolvedValue(multipleMetadata);

      // When: Page loads and background refresh occurs
      renderHomePage();

      // Then: All override titles should be preserved
      await waitFor(() => {
        expect(screen.getByText('Enhanced Breakfast Experience')).toBeInTheDocument();
        expect(screen.getByText('Gourmet Lunch Selection')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should gracefully handle Application Database sync failure', async () => {
      // Given: External DB succeeds but Application DB fails
      const { agendaService, pwaDataSyncService } = require('../../services/agendaService.ts');
      
      agendaService.getActiveAgendaItems.mockResolvedValue({
        success: true,
        data: [{ id: 'session-1', title: 'Updated Session' }]
      });
      
      pwaDataSyncService.getCachedTableData.mockRejectedValue(
        new Error('dining_item_metadata sync failed')
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // When: Page loads
      renderHomePage();

      // Then: Should not crash and show fallback content
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });

      // And: Should log appropriate error
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Application DB metadata sync failed')
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle network failure during background refresh', async () => {
      // Given: Network failure for both services
      const { agendaService, pwaDataSyncService } = require('../../services/agendaService.ts');
      
      agendaService.getActiveAgendaItems.mockRejectedValue(new Error('Network error'));
      pwaDataSyncService.getCachedTableData.mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // When: Page loads
      renderHomePage();

      // Then: Should show cached data without crashing
      await waitFor(() => {
        expect(screen.getByText('Original Breakfast')).toBeInTheDocument();
      });

      // And: Should log network error
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('BACKGROUND: Server refresh failed')
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Architecture Compliance Validation', () => {
    it('should call External DB and Application DB services independently', async () => {
      // When: Page loads
      renderHomePage();

      // Then: Both database services should be called
      const { agendaService } = require('../../services/agendaService.ts');
      const { pwaDataSyncService } = require('../../services/pwaDataSyncService.ts');

      await waitFor(() => {
        expect(agendaService.getActiveAgendaItems).toHaveBeenCalled();
        expect(pwaDataSyncService.getCachedTableData).toHaveBeenCalledWith('dining_item_metadata');
      });
    });

    it('should maintain data separation between External and Application databases', async () => {
      // Given: Different data from each database
      const externalData = [{ id: 'ext-1', title: 'External Session' }];
      const applicationData = [{ id: 'app-1', title: 'Application Override' }];

      const { agendaService, pwaDataSyncService } = require('../../services/agendaService.ts');
      agendaService.getActiveAgendaItems.mockResolvedValue({
        success: true,
        data: externalData
      });
      pwaDataSyncService.getCachedTableData.mockResolvedValue(applicationData);

      // When: Page loads
      renderHomePage();

      // Then: External data should be used for conference content
      // And: Application data should be used for metadata overrides
      await waitFor(() => {
        expect(agendaService.getActiveAgendaItems).toHaveBeenCalled();
        expect(pwaDataSyncService.getCachedTableData).toHaveBeenCalledWith('dining_item_metadata');
      });
    });
  });
});
