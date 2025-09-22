import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminPage } from '../../components/AdminPage';
import { adminService } from '../../services/adminService';

// Mock Supabase and other dependencies first
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null }))
    }
  }
}));

jest.mock('../../services/supabaseClientService', () => ({
  supabaseClientService: {
    initialize: jest.fn(() => Promise.resolve()),
    getClient: jest.fn(() => ({
      auth: {
        onAuthStateChange: jest.fn(),
        getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null }))
      }
    }))
  }
}));

jest.mock('../../services/schemaValidationService', () => ({
  schemaValidationService: {
    initialize: jest.fn(() => Promise.resolve())
  }
}));

// Mock the admin service
jest.mock('../../services/adminService', () => ({
  adminService: {
    getAgendaItemsWithAssignments: jest.fn(),
    getDiningOptionsWithMetadata: jest.fn(),
    getAvailableAttendees: jest.fn(),
    updateDiningOptionTitle: jest.fn(),
    validateTitle: jest.fn(() => true)
  }
}));

// Mock other dependencies
jest.mock('../../services/dataInitializationService', () => ({
  dataInitializationService: {
    ensureDataLoaded: jest.fn(() => Promise.resolve({ success: true, hasData: true }))
  }
}));

jest.mock('../../services/pwaDataSyncService', () => ({
  pwaDataSyncService: {
    syncApplicationTable: jest.fn(() => Promise.resolve())
  }
}));

jest.mock('../../components/CacheHealthDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="cache-health-dashboard">Cache Health Dashboard</div>
}));

const mockAdminService = adminService as jest.Mocked<typeof adminService>;

const mockDiningOptions = [
  {
    id: 'dining-1',
    name: 'Welcome Reception',
    date: '2025-10-21',
    time: '18:00:00',
    location: 'Cloud Bar',
    capacity: 100,
    original_name: 'Welcome Reception'
  },
  {
    id: 'dining-2',
    name: 'Networking Lunch',
    date: '2025-10-22',
    time: '12:00:00',
    location: 'Main Ballroom',
    capacity: 200,
    original_name: 'Networking Lunch'
  }
];

const mockAgendaItems = [
  {
    id: 'agenda-1',
    title: 'Opening Remarks',
    speaker_assignments: []
  }
];

const mockAttendees = [
  {
    id: 'attendee-1',
    name: 'John Doe',
    email: 'john@example.com'
  }
];

const renderAdminPage = () => {
  return render(
    <BrowserRouter>
      <AdminPage onLogout={jest.fn()} />
    </BrowserRouter>
  );
};

describe('AdminPage Dining Options', () => {
  beforeEach(() => {
    mockAdminService.getAgendaItemsWithAssignments.mockResolvedValue(mockAgendaItems);
    mockAdminService.getDiningOptionsWithMetadata.mockResolvedValue(mockDiningOptions);
    mockAdminService.getAvailableAttendees.mockResolvedValue(mockAttendees);
    mockAdminService.updateDiningOptionTitle.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should load and display dining options', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Dining Options')).toBeInTheDocument();
      expect(screen.getByText('Welcome Reception')).toBeInTheDocument();
      expect(screen.getByText('Networking Lunch')).toBeInTheDocument();
    });
  });

  it('should display dining option details', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Date: 2025-10-21')).toBeInTheDocument();
      expect(screen.getByText('Time: 18:00:00')).toBeInTheDocument();
      expect(screen.getByText('Location: Cloud Bar')).toBeInTheDocument();
      expect(screen.getByText('Capacity: 100 seats')).toBeInTheDocument();
    });
  });

  it('should allow editing dining option titles', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Welcome Reception')).toBeInTheDocument();
    });

    // Click edit button
    const editButtons = screen.getAllByText('Edit Title');
    fireEvent.click(editButtons[0]);

    // Should show text field
    const textField = screen.getByDisplayValue('Welcome Reception');
    expect(textField).toBeInTheDocument();

    // Should show save and cancel buttons
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should save dining option title changes', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Welcome Reception')).toBeInTheDocument();
    });

    // Click edit button
    const editButtons = screen.getAllByText('Edit Title');
    fireEvent.click(editButtons[0]);

    // Change the title
    const textField = screen.getByDisplayValue('Welcome Reception');
    fireEvent.change(textField, { target: { value: 'Updated Reception' } });

    // Click save
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockAdminService.updateDiningOptionTitle).toHaveBeenCalledWith('dining-1', 'Updated Reception');
    });
  });

  it('should cancel dining option title editing', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Welcome Reception')).toBeInTheDocument();
    });

    // Click edit button
    const editButtons = screen.getAllByText('Edit Title');
    fireEvent.click(editButtons[0]);

    // Change the title
    const textField = screen.getByDisplayValue('Welcome Reception');
    fireEvent.change(textField, { target: { value: 'Updated Reception' } });

    // Click cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Should revert to original title
    await waitFor(() => {
      expect(screen.getByText('Welcome Reception')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Updated Reception')).not.toBeInTheDocument();
    });
  });

  it('should show original name when title is edited', async () => {
    const editedDiningOptions = [
      {
        ...mockDiningOptions[0],
        name: 'Custom Reception Title',
        original_name: 'Welcome Reception'
      }
    ];

    mockAdminService.getDiningOptionsWithMetadata.mockResolvedValue(editedDiningOptions);

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Custom Reception Title')).toBeInTheDocument();
      expect(screen.getByText('Original: Welcome Reception')).toBeInTheDocument();
    });
  });

  it('should handle empty dining options', async () => {
    mockAdminService.getDiningOptionsWithMetadata.mockResolvedValue([]);

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('No Dining Options Found')).toBeInTheDocument();
      expect(screen.getByText('No dining options are currently available for editing.')).toBeInTheDocument();
    });
  });
});
