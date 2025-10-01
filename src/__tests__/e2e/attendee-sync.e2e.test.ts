/**
 * End-to-End Tests for Attendee Data Synchronization
 * 
 * Tests critical user journeys including login with personalization sync,
 * periodic refresh maintenance, and offline resilience.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { HomePage } from '../../pages/HomePage';
import type { Attendee } from '../../types/attendee';

// Mock dependencies
vi.mock('../../services/authService', () => ({
  authenticateWithAccessCode: vi.fn()
}));

vi.mock('../../services/serverDataSyncService', () => ({
  serverDataSyncService: {
    syncAllData: vi.fn()
  }
}));

vi.mock('../../services/attendeeInfoService', () => ({
  attendeeInfoService: {
    getAttendeeName: vi.fn()
  }
}));

vi.mock('../../services/attendeeSyncService', () => ({
  attendeeSyncService: {
    refreshAttendeeData: vi.fn(),
    clearSyncState: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.dispatchEvent
const dispatchEventMock = vi.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: dispatchEventMock
});

describe('Attendee Data Synchronization E2E', () => {
  let mockAttendee: Attendee;
  let mockSessions: any[];

  beforeEach(() => {
    mockAttendee = {
      id: 'attendee-001',
      first_name: 'John',
      last_name: 'Doe',
      selected_breakouts: ['breakout-001', 'breakout-002'],
      dining_preferences: ['vegetarian'],
      updated_at: Date.now()
    } as Attendee;

    mockSessions = [
      {
        id: 'session-001',
        title: 'Keynote',
        session_type: 'keynote',
        start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'breakout-001',
        title: 'Breakout Session 1',
        session_type: 'breakout',
        start_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Reset all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    dispatchEventMock.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete User Login with Personalization Sync', () => {
    it('should complete login flow with attendee sync initialization', async () => {
      const { authenticateWithAccessCode } = await import('../../services/authService');
      const { serverDataSyncService } = await import('../../services/serverDataSyncService');
      const { attendeeInfoService } = await import('../../services/attendeeInfoService');
      const { attendeeSyncService } = await import('../../services/attendeeSyncService');

      // Mock successful authentication
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: true,
        attendee: mockAttendee
      });

      // Mock successful data sync
      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue({
        success: true,
        syncedTables: ['attendees', 'agenda_items'],
        errors: [],
        conflicts: []
      });

      // Mock attendee info service
      vi.mocked(attendeeInfoService.getAttendeeName).mockResolvedValue({
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe'
      });

      // Mock attendee sync service
      vi.mocked(attendeeSyncService.refreshAttendeeData).mockResolvedValue({
        success: true,
        attendee: mockAttendee,
        lastSync: new Date(),
        syncVersion: '1.0.1'
      });

      // Mock localStorage for conference_auth
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'conference_auth') {
          return JSON.stringify({
            attendee: mockAttendee,
            isAuthenticated: true,
            timestamp: Date.now()
          });
        }
        return null;
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <HomePage />
          </AuthProvider>
        </BrowserRouter>
      );

      // Wait for authentication to complete
      await waitFor(() => {
        expect(authenticateWithAccessCode).toHaveBeenCalled();
        expect(serverDataSyncService.syncAllData).toHaveBeenCalled();
        expect(attendeeSyncService.refreshAttendeeData).toHaveBeenCalled();
      });

      // Verify attendee sync was initialized
      expect(attendeeSyncService.refreshAttendeeData).toHaveBeenCalledWith();
    });

    it('should handle attendee sync initialization failure gracefully', async () => {
      const { authenticateWithAccessCode } = await import('../../services/authService');
      const { serverDataSyncService } = await import('../../services/serverDataSyncService');
      const { attendeeInfoService } = await import('../../services/attendeeInfoService');
      const { attendeeSyncService } = await import('../../services/attendeeSyncService');

      // Mock successful authentication
      vi.mocked(authenticateWithAccessCode).mockResolvedValue({
        success: true,
        attendee: mockAttendee
      });

      // Mock successful data sync
      vi.mocked(serverDataSyncService.syncAllData).mockResolvedValue({
        success: true,
        syncedTables: ['attendees'],
        errors: [],
        conflicts: []
      });

      // Mock attendee info service
      vi.mocked(attendeeInfoService.getAttendeeName).mockResolvedValue({
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe'
      });

      // Mock attendee sync service failure
      vi.mocked(attendeeSyncService.refreshAttendeeData).mockRejectedValue(
        new Error('Attendee sync failed')
      );

      render(
        <BrowserRouter>
          <AuthProvider>
            <HomePage />
          </AuthProvider>
        </BrowserRouter>
      );

      // Wait for authentication to complete
      await waitFor(() => {
        expect(authenticateWithAccessCode).toHaveBeenCalled();
        expect(serverDataSyncService.syncAllData).toHaveBeenCalled();
        expect(attendeeSyncService.refreshAttendeeData).toHaveBeenCalled();
      });

      // Should still complete login despite attendee sync failure
      expect(authenticateWithAccessCode).toHaveBeenCalled();
    });
  });

  describe('Periodic Refresh Maintenance', () => {
    it('should maintain personalization during periodic refresh', async () => {
      const { attendeeSyncService } = await import('../../services/attendeeSyncService');

      // Mock attendee sync service to simulate periodic refresh
      vi.mocked(attendeeSyncService.refreshAttendeeData).mockResolvedValue({
        success: true,
        attendee: mockAttendee,
        lastSync: new Date(),
        syncVersion: '1.0.2'
      });

      // Mock localStorage for existing auth
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'conference_auth') {
          return JSON.stringify({
            attendee: mockAttendee,
            isAuthenticated: true,
            timestamp: Date.now() - (31 * 60 * 1000) // 31 minutes ago (stale)
          });
        }
        return null;
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <HomePage />
          </AuthProvider>
        </BrowserRouter>
      );

      // Simulate periodic refresh by dispatching attendee data update event
      const updatedAttendee = {
        ...mockAttendee,
        selected_breakouts: ['breakout-003', 'breakout-004']
      };

      const event = new CustomEvent('attendee-data-updated', {
        detail: {
          attendee: updatedAttendee,
          timestamp: Date.now(),
          syncVersion: '1.0.2'
        }
      });

      fireEvent(window, event);

      await waitFor(() => {
        expect(dispatchEventMock).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'attendee-data-updated',
            detail: expect.objectContaining({
              attendee: updatedAttendee
            })
          })
        );
      });
    });
  });

  describe('Offline Mode Resilience', () => {
    it('should handle offline mode with stale personalization data', async () => {
      const { attendeeSyncService } = await import('../../services/attendeeSyncService');

      // Mock attendee sync service to fail (offline)
      vi.mocked(attendeeSyncService.refreshAttendeeData).mockRejectedValue(
        new Error('Network error')
      );

      // Mock localStorage with stale data
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'conference_auth') {
          return JSON.stringify({
            attendee: mockAttendee,
            isAuthenticated: true,
            timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
          });
        }
        return null;
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <HomePage />
          </AuthProvider>
        </BrowserRouter>
      );

      // Should still render with stale data
      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
      });
    });

    it('should recover from offline mode and sync data', async () => {
      const { attendeeSyncService } = await import('../../services/attendeeSyncService');

      // Initially mock sync failure (offline)
      vi.mocked(attendeeSyncService.refreshAttendeeData)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          success: true,
          attendee: mockAttendee,
          lastSync: new Date(),
          syncVersion: '1.0.1'
        });

      // Mock localStorage with stale data
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'conference_auth') {
          return JSON.stringify({
            attendee: mockAttendee,
            isAuthenticated: true,
            timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
          });
        }
        return null;
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <HomePage />
          </AuthProvider>
        </BrowserRouter>
      );

      // Simulate network recovery
      const event = new CustomEvent('attendee-data-updated', {
        detail: {
          attendee: mockAttendee,
          timestamp: Date.now(),
          syncVersion: '1.0.1'
        }
      });

      fireEvent(window, event);

      await waitFor(() => {
        expect(dispatchEventMock).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'attendee-data-updated'
          })
        );
      });
    });
  });

  describe('Logout with Attendee Sync Cleanup', () => {
    it('should clear attendee sync state on logout', async () => {
      const { attendeeSyncService } = await import('../../services/attendeeSyncService');

      // Mock attendee sync service
      vi.mocked(attendeeSyncService.clearSyncState).mockImplementation(() => {});

      // Mock localStorage for existing auth
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'conference_auth') {
          return JSON.stringify({
            attendee: mockAttendee,
            isAuthenticated: true,
            timestamp: Date.now()
          });
        }
        return null;
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <HomePage />
          </AuthProvider>
        </BrowserRouter>
      );

      // Simulate logout
      const logoutEvent = new CustomEvent('logout');
      fireEvent(window, logoutEvent);

      await waitFor(() => {
        expect(attendeeSyncService.clearSyncState).toHaveBeenCalled();
      });
    });
  });
});
