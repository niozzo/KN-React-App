import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter, useOutletContext } from 'react-router-dom';
import { AdminPage } from '../../../../components/AdminPage';
import { simplifiedDataService } from '../../../../services/simplifiedDataService';
import { serverDataSyncService } from '../../../../services/serverDataSyncService';
import { adminService } from '../../../../services/adminService';

// Mock React Router hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: vi.fn(),
    useNavigate: () => vi.fn()
  };
});

// Mock the services
vi.mock('../../../../services/simplifiedDataService');
vi.mock('../../../../services/serverDataSyncService');
vi.mock('../../../../services/adminService');

// Mock attendeeSyncService
vi.mock('../../../../services/attendeeSyncService', () => ({
  attendeeSyncService: {
    refreshAttendeeData: vi.fn(() => Promise.resolve({
    success: true,
    message: 'Attendee data refreshed'
    }))
  }
}));

const mockSimplifiedDataService = vi.mocked(simplifiedDataService);
const mockServerDataSyncService = vi.mocked(serverDataSyncService);
const mockAdminService = vi.mocked(adminService);

// Helper to wait for AdminPage to finish loading
async function waitForAdminPageLoad() {
  await waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  }, { timeout: 5000 });
}

describe('AdminPage - Force Sync (Simplified Integration)', () => {
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useOutletContext to provide onLogout
    vi.mocked(useOutletContext).mockReturnValue({
      onLogout: mockOnLogout
    });
    
    // Mock simplified data service
    mockSimplifiedDataService.getData.mockResolvedValue({
      success: true,
      data: [],
      fromCache: true
    });
    
    // Mock adminService methods (only the ones that actually exist)
    mockAdminService.getAgendaItemsWithAssignments.mockResolvedValue([]);
    mockAdminService.getDiningOptionsWithMetadata.mockResolvedValue([]);
    mockAdminService.getAvailableAttendees.mockResolvedValue([]);
    mockAdminService.getAllAttendeesWithAccessCodes.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Force Global Sync', () => {
    it('should clear cache and sync data', async () => {
      mockSimplifiedDataService.clearCache.mockResolvedValue(undefined);
      mockServerDataSyncService.syncAllData.mockResolvedValue({
        success: true,
        syncedTables: ['attendees', 'agenda_items'],
        errors: []
      });

      render(
        <BrowserRouter>
          <AdminPage />
        </BrowserRouter>
      );
      
      await waitForAdminPageLoad();
      
      const syncButton = await screen.findByRole('button', { name: /force global sync/i });
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(mockSimplifiedDataService.clearCache).toHaveBeenCalled();
        expect(mockServerDataSyncService.syncAllData).toHaveBeenCalled();
      });
    });

    it('should handle sync failures gracefully', async () => {
      mockSimplifiedDataService.clearCache.mockResolvedValue(undefined);
      mockServerDataSyncService.syncAllData.mockRejectedValue(new Error('Sync failed'));
      
      render(
        <BrowserRouter>
          <AdminPage />
        </BrowserRouter>
      );
      
      await waitForAdminPageLoad();
      
      const syncButton = await screen.findByRole('button', { name: /force global sync/i });
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(mockSimplifiedDataService.clearCache).toHaveBeenCalled();
        expect(mockServerDataSyncService.syncAllData).toHaveBeenCalled();
      });
    });
  });
});