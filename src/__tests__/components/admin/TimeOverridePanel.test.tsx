/**
 * Time Override Panel Component Tests
 * Story 2.2.2: Breakout Session Time Override
 * 
 * Tests for the admin time override panel component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TimeOverridePanel from '../../../components/admin/TimeOverridePanel';

// Mock the application database service
vi.mock('../../../services/applicationDatabaseService', () => ({
  applicationDatabaseService: {
    getAgendaItemTimeOverrides: vi.fn(),
    updateAgendaItemTimes: vi.fn()
  }
}));

describe('TimeOverridePanel - Basic Functionality', () => {
  const defaultProps = {
    agendaItemId: 'test-session-1',
    currentStartTime: '09:00',
    currentEndTime: '12:00',
    currentTitle: 'Test Breakout Session'
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked service
    const { applicationDatabaseService } = await import('../../../services/applicationDatabaseService');
    vi.mocked(applicationDatabaseService.getAgendaItemTimeOverrides).mockResolvedValue([]);
    vi.mocked(applicationDatabaseService.updateAgendaItemTimes).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Display', () => {
    it('should display session title and original times', async () => {
      // Arrange & Act
      render(<TimeOverridePanel {...defaultProps} />);

      // Assert
      expect(screen.getByText('Time Override - Test Breakout Session')).toBeInTheDocument();
      expect(screen.getByText('Original Times')).toBeInTheDocument();
      expect(screen.getByText('Start: 09:00')).toBeInTheDocument();
      expect(screen.getByText('End: 12:00')).toBeInTheDocument();
    });

    it('should display enable/disable toggle', () => {
      // Arrange & Act
      render(<TimeOverridePanel {...defaultProps} />);

      // Assert
      const checkbox = screen.getByRole('checkbox', { name: /enable time override/i });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should show time inputs when override is enabled', async () => {
      // Arrange
      render(<TimeOverridePanel {...defaultProps} />);

      // Act
      const checkbox = screen.getByRole('checkbox', { name: /enable time override/i });
      fireEvent.click(checkbox);

      // Assert
      expect(screen.getByLabelText('Start Time')).toBeInTheDocument();
      expect(screen.getByLabelText('End Time')).toBeInTheDocument();
    });

    it('should hide time inputs when override is disabled', () => {
      // Arrange & Act
      render(<TimeOverridePanel {...defaultProps} />);

      // Assert
      expect(screen.queryByLabelText('Start Time')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('End Time')).not.toBeInTheDocument();
    });

    it('should display close button when onClose prop is provided', () => {
      // Arrange
      const mockOnClose = vi.fn();

      // Act
      render(<TimeOverridePanel {...defaultProps} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should enable time override when checkbox is clicked', async () => {
      // Arrange
      render(<TimeOverridePanel {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox', { name: /enable time override/i });

      // Act
      fireEvent.click(checkbox);

      // Assert
      expect(checkbox).toBeChecked();
      expect(screen.getByLabelText('Start Time')).toBeInTheDocument();
      expect(screen.getByLabelText('End Time')).toBeInTheDocument();
    });

    it('should update start time when input changes', async () => {
      // Arrange
      render(<TimeOverridePanel {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox', { name: /enable time override/i });
      fireEvent.click(checkbox);

      // Act
      const startTimeInput = screen.getByLabelText('Start Time');
      fireEvent.change(startTimeInput, { target: { value: '10:00' } });

      // Assert
      expect(startTimeInput).toHaveValue('10:00');
    });

    it('should update end time when input changes', async () => {
      // Arrange
      render(<TimeOverridePanel {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox', { name: /enable time override/i });
      fireEvent.click(checkbox);

      // Act
      const endTimeInput = screen.getByLabelText('End Time');
      fireEvent.change(endTimeInput, { target: { value: '13:00' } });

      // Assert
      expect(endTimeInput).toHaveValue('13:00');
    });

    it('should call onClose when close button is clicked', () => {
      // Arrange
      const mockOnClose = vi.fn();
      render(<TimeOverridePanel {...defaultProps} onClose={mockOnClose} />);

      // Act
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Validation', () => {
    it('should show error for invalid start time format', async () => {
      // Arrange
      render(<TimeOverridePanel {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox', { name: /enable time override/i });
      fireEvent.click(checkbox);

      // Act
      const startTimeInput = screen.getByLabelText('Start Time');
      fireEvent.change(startTimeInput, { target: { value: '25:00' } });
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/invalid start time format/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid end time format', async () => {
      // Arrange
      render(<TimeOverridePanel {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox', { name: /enable time override/i });
      fireEvent.click(checkbox);

      // Act
      const endTimeInput = screen.getByLabelText('End Time');
      fireEvent.change(endTimeInput, { target: { value: '25:00' } });
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/invalid end time format/i)).toBeInTheDocument();
      });
    });

    it('should show error when end time is before start time', async () => {
      // Arrange
      render(<TimeOverridePanel {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox', { name: /enable time override/i });
      fireEvent.click(checkbox);

      // Act
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');
      
      fireEvent.change(startTimeInput, { target: { value: '14:00' } });
      fireEvent.change(endTimeInput, { target: { value: '12:00' } });
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/end time must be after start time/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence', () => {
    it('should save time override when form is submitted', async () => {
      // Arrange
      render(<TimeOverridePanel {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox', { name: /enable time override/i });
      fireEvent.click(checkbox);

      // Act
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');
      
      fireEvent.change(startTimeInput, { target: { value: '10:00' } });
      fireEvent.change(endTimeInput, { target: { value: '13:00' } });
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      // Assert
      await waitFor(async () => {
        const { applicationDatabaseService } = await import('../../../services/applicationDatabaseService');
        expect(applicationDatabaseService.updateAgendaItemTimes).toHaveBeenCalledWith(
          'test-session-1',
          '10:00',
          '13:00',
          true
        );
      });
    });

    it('should call onTimeUpdate callback when save is successful', async () => {
      // Arrange
      const mockOnTimeUpdate = vi.fn();
      render(<TimeOverridePanel {...defaultProps} onTimeUpdate={mockOnTimeUpdate} />);
      
      const checkbox = screen.getByRole('checkbox', { name: /enable time override/i });
      fireEvent.click(checkbox);

      // Act
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');
      
      fireEvent.change(startTimeInput, { target: { value: '10:00' } });
      fireEvent.change(endTimeInput, { target: { value: '13:00' } });
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      // Assert
      await waitFor(() => {
        expect(mockOnTimeUpdate).toHaveBeenCalledWith('10:00', '13:00', true);
      });
    });

    it('should show success message after successful save', async () => {
      // Arrange
      render(<TimeOverridePanel {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox', { name: /enable time override/i });
      fireEvent.click(checkbox);

      // Act
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');
      
      fireEvent.change(startTimeInput, { target: { value: '10:00' } });
      fireEvent.change(endTimeInput, { target: { value: '13:00' } });
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/time override saved successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle save errors gracefully', async () => {
      // Arrange
      const { applicationDatabaseService } = await import('../../../services/applicationDatabaseService');
      vi.mocked(applicationDatabaseService.updateAgendaItemTimes).mockRejectedValue(
        new Error('Database error')
      );
      
      render(<TimeOverridePanel {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox', { name: /enable time override/i });
      fireEvent.click(checkbox);

      // Act
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/failed to save time override/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading Existing Overrides', () => {
    it('should load existing time overrides on mount', async () => {
      // Arrange
      const existingOverrides = [
        {
          id: 'test-session-1',
          title: 'Test Session',
          start_time: '10:30:00',
          end_time: '13:30:00',
          time_override_enabled: true,
          last_synced: '2025-01-27T10:00:00Z'
        }
      ];
      
      const { applicationDatabaseService } = await import('../../../services/applicationDatabaseService');
      vi.mocked(applicationDatabaseService.getAgendaItemTimeOverrides).mockResolvedValue(existingOverrides);

      // Act
      render(<TimeOverridePanel {...defaultProps} />);

      // Assert
      await waitFor(() => {
        expect(applicationDatabaseService.getAgendaItemTimeOverrides).toHaveBeenCalled();
      });
    });

    it('should display existing override times when loaded', async () => {
      // Arrange
      const existingOverrides = [
        {
          id: 'test-session-1',
          title: 'Test Session',
          start_time: '10:30',
          end_time: '13:30',
          time_override_enabled: true,
          last_synced: '2025-01-27T10:00:00Z'
        }
      ];
      
      const { applicationDatabaseService } = await import('../../../services/applicationDatabaseService');
      vi.mocked(applicationDatabaseService.getAgendaItemTimeOverrides).mockResolvedValue(existingOverrides);

      // Act
      render(<TimeOverridePanel {...defaultProps} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Override Times')).toBeInTheDocument();
        expect(screen.getByText('Start: 10:30')).toBeInTheDocument();
        expect(screen.getByText('End: 13:30')).toBeInTheDocument();
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset form to original values when reset button is clicked', async () => {
      // Arrange
      render(<TimeOverridePanel {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox', { name: /enable time override/i });
      fireEvent.click(checkbox);

      // Act - Make changes
      const startTimeInput = screen.getByLabelText('Start Time');
      fireEvent.change(startTimeInput, { target: { value: '10:00' } });

      // Act - Reset
      const resetButton = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetButton);

      // Assert
      expect(checkbox).not.toBeChecked();
      expect(screen.queryByLabelText('Start Time')).not.toBeInTheDocument();
    });
  });
});
