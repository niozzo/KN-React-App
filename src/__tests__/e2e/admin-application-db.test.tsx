/**
 * Admin Application Database E2E Tests
 * Story 2.1a Enhancement: Application Database Data Caching
 * 
 * End-to-end tests for admin functionality with application database integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock authentication context
const mockAuthContext = {
  isAuthenticated: true,
  attendee: { id: 'test-attendee', first_name: 'Test', last_name: 'User' },
  attendeeName: { first_name: 'Test', last_name: 'User', full_name: 'Test User' },
  isLoading: false,
  isSigningOut: false,
  login: vi.fn(),
  logout: vi.fn(),
  checkAuthStatus: vi.fn()
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

// Mock application database service
const mockApplicationDbService = {
  getSpeakerAssignments: vi.fn(),
  assignSpeaker: vi.fn(),
  removeSpeakerAssignment: vi.fn(),
  syncAgendaItemMetadata: vi.fn()
};

vi.mock('../../services/applicationDatabaseService', () => ({
  applicationDbService: mockApplicationDbService
}));

// Mock PWA sync service
const mockPwaDataSyncService = {
  getCachedTableData: vi.fn(),
  cacheTableData: vi.fn(),
  syncAllData: vi.fn()
};

vi.mock('../../services/pwaDataSyncService', () => ({
  pwaDataSyncService: mockPwaDataSyncService
}));

// Mock data clearing service
const mockDataClearingService = {
  clearAllData: vi.fn()
};

vi.mock('../../services/dataClearingService', () => ({
  dataClearingService: mockDataClearingService
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

// Import components after mocks
import { AdminApp } from '../../components/AdminApp';

// Helper function to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Admin Application Database E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage data
    localStorageMock.getItem.mockImplementation((key: string) => {
      switch (key) {
        case 'kn_cache_agenda_items':
          return JSON.stringify({
            data: [
              { id: 'item-1', title: 'Opening Keynote', start_time: '2025-01-16T09:00:00Z' },
              { id: 'item-2', title: 'Coffee Break', start_time: '2025-01-16T10:00:00Z' }
            ],
            timestamp: Date.now(),
            version: 1
          });
        case 'kn_cache_attendees':
          return JSON.stringify({
            data: [
              { id: 'attendee-1', first_name: 'John', last_name: 'Doe', name: 'John Doe' },
              { id: 'attendee-2', first_name: 'Jane', last_name: 'Smith', name: 'Jane Smith' }
            ],
            timestamp: Date.now(),
            version: 1
          });
        default:
          return null;
      }
    });

    // Mock PWA sync service responses
    mockPwaDataSyncService.getCachedTableData.mockResolvedValue([]);
    mockPwaDataSyncService.cacheTableData.mockResolvedValue(undefined);
    mockPwaDataSyncService.syncAllData.mockResolvedValue({
      success: true,
      syncedTables: ['speaker_assignments', 'agenda_item_metadata', 'attendee_metadata'],
      errors: []
    });

    // Mock application database service responses
    mockApplicationDbService.getSpeakerAssignments.mockResolvedValue([]);
    mockApplicationDbService.assignSpeaker.mockResolvedValue({
      id: 'assign-1',
      agenda_item_id: 'item-1',
      attendee_id: 'attendee-1',
      role: 'presenter',
      created_at: '2025-01-16T10:00:00Z',
      updated_at: '2025-01-16T10:00:00Z'
    });
    mockApplicationDbService.removeSpeakerAssignment.mockResolvedValue(undefined);
    mockApplicationDbService.syncAgendaItemMetadata.mockResolvedValue(undefined);

    // Mock data clearing service
    mockDataClearingService.clearAllData.mockResolvedValue({
      success: true,
      clearedData: {
        localStorage: true,
        attendeeInfo: true,
        pwaCache: true,
        indexedDB: true,
        serviceWorkerCaches: true
      },
      errors: [],
      performanceMetrics: {
        startTime: 0,
        endTime: 100,
        duration: 100
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('2.1a-E2E-001: should complete admin speaker assignment workflow', async () => {
    // Render admin app
    renderWithRouter(<AdminApp />);

    // Wait for admin page to load
    await waitFor(() => {
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    // Verify agenda items are displayed
    expect(screen.getByText('Opening Keynote')).toBeInTheDocument();
    expect(screen.getByText('Coffee Break')).toBeInTheDocument();

    // Find the speaker assignment component for the first agenda item
    const speakerAssignmentComponents = screen.getAllByText('Speaker Assignments');
    expect(speakerAssignmentComponents).toHaveLength(2);

    // Click on the type-ahead input for the first agenda item
    const typeAheadInputs = screen.getAllByPlaceholderText('Type at least 2 characters');
    expect(typeAheadInputs).toHaveLength(2);

    // Type in the type-ahead to search for attendees
    fireEvent.change(typeAheadInputs[0], { target: { value: 'John' } });

    // Wait for attendee options to appear
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on John Doe to select him
    fireEvent.click(screen.getByText('John Doe'));

    // Click the add button
    const addButtons = screen.getAllByRole('button', { name: /add/i });
    fireEvent.click(addButtons[0]);

    // Wait for assignment to be processed
    await waitFor(() => {
      expect(mockApplicationDbService.assignSpeaker).toHaveBeenCalledWith(
        'item-1',
        'attendee-1',
        'presenter'
      );
    });

    // Verify local storage was updated
    expect(mockPwaDataSyncService.cacheTableData).toHaveBeenCalledWith(
      'speaker_assignments',
      expect.arrayContaining([
        expect.objectContaining({
          agenda_item_id: 'item-1',
          attendee_id: 'attendee-1',
          role: 'presenter'
        })
      ])
    );

    // Verify the assignment appears in the UI
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('2.1a-E2E-002: should work offline with local storage', async () => {
    // Mock offline scenario - database fails but local storage works
    mockApplicationDbService.assignSpeaker.mockRejectedValue(new Error('Network error'));

    renderWithRouter(<AdminApp />);

    // Wait for admin page to load
    await waitFor(() => {
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    // Find the type-ahead input
    const typeAheadInputs = screen.getAllByPlaceholderText('Type at least 2 characters');
    
    // Type in the type-ahead
    fireEvent.change(typeAheadInputs[0], { target: { value: 'Jane' } });

    // Wait for attendee options to appear
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Click on Jane Smith
    fireEvent.click(screen.getByText('Jane Smith'));

    // Click the add button
    const addButtons = screen.getAllByRole('button', { name: /add/i });
    fireEvent.click(addButtons[0]);

    // Wait for assignment to be processed (should fallback to local storage)
    await waitFor(() => {
      expect(mockPwaDataSyncService.cacheTableData).toHaveBeenCalled();
    });

    // Verify local storage was updated despite database failure
    expect(mockPwaDataSyncService.cacheTableData).toHaveBeenCalledWith(
      'speaker_assignments',
      expect.arrayContaining([
        expect.objectContaining({
          agenda_item_id: 'item-1',
          attendee_id: 'attendee-2',
          role: 'presenter'
        })
      ])
    );
  });

  it('2.1a-E2E-003: should sync data in background', async () => {
    // Mock background sync with updated data
    const updatedSpeakerAssignments = [
      {
        id: 'assign-1',
        agenda_item_id: 'item-1',
        attendee_id: 'attendee-1',
        role: 'presenter',
        created_at: '2025-01-16T10:00:00Z',
        updated_at: '2025-01-16T10:00:00Z'
      }
    ];

    // Initially return empty assignments
    mockPwaDataSyncService.getCachedTableData.mockResolvedValueOnce([]);

    renderWithRouter(<AdminApp />);

    // Wait for admin page to load
    await waitFor(() => {
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    // Simulate background sync updating local storage
    mockPwaDataSyncService.getCachedTableData.mockResolvedValue(updatedSpeakerAssignments);

    // Trigger a re-render (simulating background sync completion)
    fireEvent.click(screen.getByText('Admin Panel'));

    // Verify that background sync was called
    expect(mockPwaDataSyncService.syncAllData).toHaveBeenCalled();
  });

  it('2.1a-E2E-004: should clear application database data on logout', async () => {
    renderWithRouter(<AdminApp />);

    // Wait for admin page to load
    await waitFor(() => {
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    // Click logout button
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    // Wait for logout process to complete
    await waitFor(() => {
      expect(mockDataClearingService.clearAllData).toHaveBeenCalled();
    });

    // Verify that data clearing service was called
    expect(mockDataClearingService.clearAllData).toHaveBeenCalled();

    // Verify that the logout function was called
    expect(mockAuthContext.logout).toHaveBeenCalled();
  });

  it('should handle passcode authentication', async () => {
    // Mock unauthenticated state initially
    const unauthenticatedContext = {
      ...mockAuthContext,
      isAuthenticated: false
    };

    vi.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue(unauthenticatedContext);

    renderWithRouter(<AdminApp />);

    // Should show passcode screen
    expect(screen.getByText('Admin Access')).toBeInTheDocument();
    expect(screen.getByLabelText('Passcode')).toBeInTheDocument();

    // Enter correct passcode
    const passcodeInput = screen.getByLabelText('Passcode');
    fireEvent.change(passcodeInput, { target: { value: '616161' } });

    // Click access button
    const accessButton = screen.getByText('Access Admin Panel');
    fireEvent.click(accessButton);

    // Should proceed to admin panel (this would be handled by the passcode validation)
    // Note: The actual navigation would be handled by the component's internal state
  });

  it('should handle empty data scenarios gracefully', async () => {
    // Mock empty data
    localStorageMock.getItem.mockReturnValue(null);
    mockPwaDataSyncService.getCachedTableData.mockResolvedValue([]);

    renderWithRouter(<AdminApp />);

    // Should show no agenda items message
    await waitFor(() => {
      expect(screen.getByText('No Agenda Items Found')).toBeInTheDocument();
    });

    // Should show go to home page button
    expect(screen.getByText('Go to Home Page')).toBeInTheDocument();
  });
});
