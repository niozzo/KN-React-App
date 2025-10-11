import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AdminPage } from '../../../../components/AdminPage';
import { pwaDataSyncService } from '../../../../services/pwaDataSyncService';
import { dataInitializationService } from '../../../../services/dataInitializationService';
import { adminService } from '../../../../services/adminService';

// Mock the services
vi.mock('../../../../services/pwaDataSyncService');
vi.mock('../../../../services/dataInitializationService');
vi.mock('../../../../services/adminService');
vi.mock('../../../../services/attendeeSyncService', () => ({
  attendeeSyncService: {
    refreshAttendeeData: vi.fn().mockResolvedValue({
      success: true
    })
  }
}));

const mockPWADataSyncService = vi.mocked(pwaDataSyncService);
const mockDataInitializationService = vi.mocked(dataInitializationService);
const mockAdminService = vi.mocked(adminService);

// Helper to wait for AdminPage to finish loading
async function waitForAdminPageLoad() {
  await waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  }, { timeout: 3000 });
}

describe('Force Global Sync PWA Tests', () => {
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // FIX: Mock adminService methods to resolve loading state
    // These methods are called by AdminPage's loadData() function
    mockAdminService.getAgendaItemsWithAssignments.mockResolvedValue([]);
    mockAdminService.getDiningOptionsWithMetadata.mockResolvedValue([]);
    mockAdminService.getAvailableAttendees.mockResolvedValue([]);
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
    
    // Mock service worker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({
          unregister: vi.fn(),
        }),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Cache Clearing Scenarios', () => {
    it('should clear PWA caches during force sync', async () => {
      mockPWADataSyncService.clearCache.mockResolvedValue();
      mockPWADataSyncService.forceSync.mockResolvedValue({
        success: true,
        syncedTables: ['attendees'],
        totalRecords: 50,
        errors: []
      });
      
      mockDataInitializationService.forceRefreshData.mockResolvedValue({
        success: true,
        hasData: true
      });
      
      mockAdminService.getAgendaItemsWithAssignments.mockResolvedValue([]);
      mockAdminService.getDiningOptionsWithMetadata.mockResolvedValue([]);
      mockAdminService.getAvailableAttendees.mockResolvedValue([]);

      render(
        <BrowserRouter>
          <AdminPage onLogout={mockOnLogout} />
        </BrowserRouter>
      );
      
      await waitForAdminPageLoad();
      
      const syncButton = await screen.findByRole('button', { name: /force global sync/i });
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(mockPWADataSyncService.clearCache).toHaveBeenCalledWith();
      });
    });

    it('should handle cache clearing failures gracefully', async () => {
      mockPWADataSyncService.clearCache.mockRejectedValue(new Error('Cache clear failed'));
      
      render(
        <BrowserRouter>
          <AdminPage onLogout={mockOnLogout} />
        </BrowserRouter>
      );
      
      await waitForAdminPageLoad();
      
      const syncButton = await screen.findByRole('button', { name: /force global sync/i });
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to force global sync: Cache clear failed/i)).toBeInTheDocument();
      });
    });

    it('should clear multiple cache layers', async () => {
      // Mock multiple cache clearing operations
      mockPWADataSyncService.clearCache.mockImplementation(async () => {
        // Simulate clearing different cache layers
        console.log('Clearing PWA cache...');
        console.log('Clearing application database cache...');
        console.log('Clearing local storage cache...');
        console.log('Clearing service worker cache...');
      });
      
      mockPWADataSyncService.forceSync.mockResolvedValue({
        success: true,
        syncedTables: ['attendees'],
        totalRecords: 50,
        errors: []
      });
      
      mockDataInitializationService.forceRefreshData.mockResolvedValue({
        success: true,
        hasData: true
      });
      
      mockAdminService.getAgendaItemsWithAssignments.mockResolvedValue([]);
      mockAdminService.getDiningOptionsWithMetadata.mockResolvedValue([]);
      mockAdminService.getAvailableAttendees.mockResolvedValue([]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      render(
        <BrowserRouter>
          <AdminPage onLogout={mockOnLogout} />
        </BrowserRouter>
      );
      
      await waitForAdminPageLoad();
      
      const syncButton = await screen.findByRole('button', { name: /force global sync/i });
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Clearing PWA cache...');
        expect(consoleSpy).toHaveBeenCalledWith('Clearing application database cache...');
        expect(consoleSpy).toHaveBeenCalledWith('Clearing local storage cache...');
        expect(consoleSpy).toHaveBeenCalledWith('Clearing service worker cache...');
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Data Refresh Scenarios', () => {
    it('should force sync all data after cache clearing', async () => {
      mockPWADataSyncService.clearCache.mockResolvedValue();
      mockPWADataSyncService.forceSync.mockResolvedValue({
        success: true,
        syncedTables: ['attendees', 'agenda_items', 'sponsors'],
        totalRecords: 150,
        errors: []
      });
      
      mockDataInitializationService.forceRefreshData.mockResolvedValue({
        success: true,
        hasData: true
      });
      
      mockAdminService.getAgendaItemsWithAssignments.mockResolvedValue([]);
      mockAdminService.getDiningOptionsWithMetadata.mockResolvedValue([]);
      mockAdminService.getAvailableAttendees.mockResolvedValue([]);

      render(
        <BrowserRouter>
          <AdminPage onLogout={mockOnLogout} />
        </BrowserRouter>
      );
      
      await waitForAdminPageLoad();
      
      const syncButton = await screen.findByRole('button', { name: /force global sync/i });
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(mockPWADataSyncService.forceSync).toHaveBeenCalledWith();
      });
    });

    it('should handle data sync failures gracefully', async () => {
      mockPWADataSyncService.clearCache.mockResolvedValue();
      mockPWADataSyncService.forceSync.mockRejectedValue(new Error('Data sync failed'));
      
      render(
        <BrowserRouter>
          <AdminPage onLogout={mockOnLogout} />
        </BrowserRouter>
      );
      
      await waitForAdminPageLoad();
      
      const syncButton = await screen.findByRole('button', { name: /force global sync/i });
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to force global sync: Data sync failed/i)).toBeInTheDocument();
      });
    });

    it('should handle partial data sync results', async () => {
      mockPWADataSyncService.clearCache.mockResolvedValue();
      mockPWADataSyncService.forceSync.mockResolvedValue({
        success: true,
        syncedTables: ['attendees', 'agenda_items'], // Only 2 out of 4 tables
        totalRecords: 100,
        errors: ['Failed to sync sponsors', 'Failed to sync dining_options']
      });
      
      mockDataInitializationService.forceRefreshData.mockResolvedValue({
        success: true,
        hasData: true
      });
      
      mockAdminService.getAgendaItemsWithAssignments.mockResolvedValue([]);
      mockAdminService.getDiningOptionsWithMetadata.mockResolvedValue([]);
      mockAdminService.getAvailableAttendees.mockResolvedValue([]);

      render(
        <BrowserRouter>
          <AdminPage onLogout={mockOnLogout} />
        </BrowserRouter>
      );
      
      await waitForAdminPageLoad();
      
      // Reset mock call counts after initial load to check if called again after sync
      mockAdminService.getAgendaItemsWithAssignments.mockClear();
      
      const syncButton = await screen.findByRole('button', { name: /force global sync/i });
      fireEvent.click(syncButton);
      
      // Should still complete successfully despite partial failures
      await waitFor(() => {
        expect(mockPWADataSyncService.forceSync).toHaveBeenCalledWith();
        // After sync, loadData() is called which triggers getAgendaItemsWithAssignments
        expect(mockAdminService.getAgendaItemsWithAssignments).toHaveBeenCalled();
      }, { timeout: 5000 });
    });
  });

  describe('Offline/Online Scenarios', () => {
    it('should handle offline scenarios gracefully', async () => {
      // Mock offline scenario
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      
      mockPWADataSyncService.clearCache.mockResolvedValue();
      mockPWADataSyncService.forceSync.mockRejectedValue(new Error('Network error'));
      
      render(
        <BrowserRouter>
          <AdminPage onLogout={mockOnLogout} />
        </BrowserRouter>
      );
      
      await waitForAdminPageLoad();
      
      const syncButton = await screen.findByRole('button', { name: /force global sync/i });
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to force global sync: Network error/i)).toBeInTheDocument();
      });
    });

    it('should handle online scenarios successfully', async () => {
      // Mock online scenario
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      
      mockPWADataSyncService.clearCache.mockResolvedValue();
      mockPWADataSyncService.forceSync.mockResolvedValue({
        success: true,
        syncedTables: ['attendees'],
        totalRecords: 50,
        errors: []
      });
      
      mockDataInitializationService.forceRefreshData.mockResolvedValue({
        success: true,
        hasData: true
      });
      
      mockAdminService.getAgendaItemsWithAssignments.mockResolvedValue([]);
      mockAdminService.getDiningOptionsWithMetadata.mockResolvedValue([]);
      mockAdminService.getAvailableAttendees.mockResolvedValue([]);

      render(
        <BrowserRouter>
          <AdminPage onLogout={mockOnLogout} />
        </BrowserRouter>
      );
      
      await waitForAdminPageLoad();
      
      // Reset mock call counts after initial load to check if called again after sync
      mockAdminService.getAgendaItemsWithAssignments.mockClear();
      mockPWADataSyncService.clearCache.mockClear();
      mockPWADataSyncService.forceSync.mockClear();
      
      const syncButton = await screen.findByRole('button', { name: /force global sync/i });
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(mockPWADataSyncService.clearCache).toHaveBeenCalledWith();
        expect(mockPWADataSyncService.forceSync).toHaveBeenCalledWith();
        // After sync, loadData() is called which triggers getAgendaItemsWithAssignments
        expect(mockAdminService.getAgendaItemsWithAssignments).toHaveBeenCalled();
      }, { timeout: 5000 });
    });

    it('should handle network state changes during sync', async () => {
      // Start online, go offline during sync
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      
      mockPWADataSyncService.clearCache.mockResolvedValue();
      mockPWADataSyncService.forceSync.mockImplementation(async () => {
        // Simulate going offline during sync
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        });
        throw new Error('Network error');
      });
      
      render(
        <BrowserRouter>
          <AdminPage onLogout={mockOnLogout} />
        </BrowserRouter>
      );
      
      await waitForAdminPageLoad();
      
      const syncButton = await screen.findByRole('button', { name: /force global sync/i });
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to force global sync: Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Service Worker Integration', () => {
    it('should integrate with service worker for cache management', async () => {
      const mockServiceWorker = {
        ready: Promise.resolve({
          unregister: vi.fn(),
        }),
      };
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: mockServiceWorker,
        writable: true,
      });
      
      mockPWADataSyncService.clearCache.mockImplementation(async () => {
        // Simulate service worker cache clearing
        try {
          const sw = await navigator.serviceWorker.ready;
          console.log('Clearing service worker cache...');
        } catch (error) {
          console.log('Service worker not available, skipping cache clear...');
        }
      });
      
      mockPWADataSyncService.forceSync.mockResolvedValue({
        success: true,
        syncedTables: ['attendees'],
        totalRecords: 50,
        errors: []
      });
      
      mockDataInitializationService.forceRefreshData.mockResolvedValue({
        success: true,
        hasData: true
      });
      
      mockAdminService.getAgendaItemsWithAssignments.mockResolvedValue([]);
      mockAdminService.getDiningOptionsWithMetadata.mockResolvedValue([]);
      mockAdminService.getAvailableAttendees.mockResolvedValue([]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      render(
        <BrowserRouter>
          <AdminPage onLogout={mockOnLogout} />
        </BrowserRouter>
      );
      
      await waitForAdminPageLoad();
      
      const syncButton = await screen.findByRole('button', { name: /force global sync/i });
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Clearing service worker cache...');
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle service worker failures gracefully', async () => {
      const rejectedPromise = Promise.reject(new Error('Service worker not available'));
      // Suppress unhandled rejection warning
      rejectedPromise.catch(() => {});
      
      const mockServiceWorker = {
        ready: rejectedPromise,
      };
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: mockServiceWorker,
        writable: true,
      });
      
      mockPWADataSyncService.clearCache.mockRejectedValue(new Error('Service worker cache clear failed'));
      
      render(
        <BrowserRouter>
          <AdminPage onLogout={mockOnLogout} />
        </BrowserRouter>
      );
      
      await waitForAdminPageLoad();
      
      const syncButton = await screen.findByRole('button', { name: /force global sync/i });
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to force global sync: Service worker cache clear failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence Validation', () => {
    it('should validate data persistence after sync', async () => {
      mockPWADataSyncService.clearCache.mockResolvedValue();
      mockPWADataSyncService.forceSync.mockResolvedValue({
        success: true,
        syncedTables: ['attendees'],
        totalRecords: 50,
        errors: []
      });
      
      mockDataInitializationService.forceRefreshData.mockResolvedValue({
        success: true,
        hasData: true
      });
      
      const mockAgendaItems = [
        { id: 1, title: 'Test Session 1' },
        { id: 2, title: 'Test Session 2' }
      ];
      
      mockAdminService.getAgendaItemsWithAssignments.mockResolvedValue(mockAgendaItems);
      mockAdminService.getDiningOptionsWithMetadata.mockResolvedValue([]);
      mockAdminService.getAvailableAttendees.mockResolvedValue([]);

      render(
        <BrowserRouter>
          <AdminPage onLogout={mockOnLogout} />
        </BrowserRouter>
      );
      
      await waitForAdminPageLoad();
      
      // Reset mock call counts after initial load to check if called again after sync
      mockAdminService.getAgendaItemsWithAssignments.mockClear();
      
      const syncButton = await screen.findByRole('button', { name: /force global sync/i });
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(mockAdminService.getAgendaItemsWithAssignments).toHaveBeenCalled();
      }, { timeout: 5000 });
    });

    it('should handle data persistence failures', async () => {
      mockPWADataSyncService.clearCache.mockResolvedValue();
      mockPWADataSyncService.forceSync.mockResolvedValue({
        success: true,
        syncedTables: ['attendees'],
        totalRecords: 50,
        errors: []
      });
      
      mockDataInitializationService.forceRefreshData.mockResolvedValue({
        success: true,
        hasData: true
      });
      
      mockAdminService.getAgendaItemsWithAssignments.mockRejectedValue(new Error('Data persistence failed'));
      
      render(
        <BrowserRouter>
          <AdminPage onLogout={mockOnLogout} />
        </BrowserRouter>
      );
      
      await waitForAdminPageLoad();
      
      const syncButton = await screen.findByRole('button', { name: /force global sync/i });
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to force global sync: Data persistence failed/i)).toBeInTheDocument();
      });
    });
  });
});
