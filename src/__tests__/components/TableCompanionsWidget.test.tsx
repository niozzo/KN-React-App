/**
 * Table Companions Widget Component Tests
 * Tests for table companions widget functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TableCompanionsWidget from '../../components/tableCompanions/TableCompanionsWidget';

// Mock the table companions service
vi.mock('../../services/tableCompanionsService', () => ({
  tableCompanionsService: {
    getTableCompanions: vi.fn()
  }
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: ''
  },
  writable: true
});

describe('TableCompanionsWidget - Basic Functionality', () => {
  const defaultProps = {
    diningEventId: 'dining-event-1',
    tableName: 'Table 1',
    attendeeId: 'attendee-1'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display', () => {
    it('should render collapsed widget by default', () => {
      render(<TableCompanionsWidget {...defaultProps} />);
      
      expect(screen.getByText('Who am I sitting with?')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });

    it('should show loading state when loading', async () => {
      const { tableCompanionsService } = await import('../../services/tableCompanionsService');
      vi.mocked(tableCompanionsService.getTableCompanions).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );
      
      render(<TableCompanionsWidget {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should expand when clicked', async () => {
      const { tableCompanionsService } = await import('../../services/tableCompanionsService');
      vi.mocked(tableCompanionsService.getTableCompanions).mockResolvedValue([]);
      
      render(<TableCompanionsWidget {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should load companions when expanded', async () => {
      const mockCompanions = [
        {
          attendee_id: 'attendee-2',
          first_name: 'Jane',
          last_name: 'Smith',
          seat_number: 2,
          assignment_type: 'manual' as const
        }
      ];
      
      const { tableCompanionsService } = await import('../../services/tableCompanionsService');
      vi.mocked(tableCompanionsService.getTableCompanions).mockResolvedValue(mockCompanions);
      
      render(<TableCompanionsWidget {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(tableCompanionsService.getTableCompanions).toHaveBeenCalledWith('Table 1', 'dining-event-1');
      });
    });

    it('should filter out current attendee', async () => {
      const mockCompanions = [
        {
          attendee_id: 'attendee-1', // Same as current attendee
          first_name: 'Current',
          last_name: 'User',
          seat_number: 1,
          assignment_type: 'manual' as const
        },
        {
          attendee_id: 'attendee-2',
          first_name: 'Jane',
          last_name: 'Smith',
          seat_number: 2,
          assignment_type: 'manual' as const
        }
      ];
      
      const { tableCompanionsService } = await import('../../services/tableCompanionsService');
      vi.mocked(tableCompanionsService.getTableCompanions).mockResolvedValue(mockCompanions);
      
      render(<TableCompanionsWidget {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('Current User')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading fails', async () => {
      const { tableCompanionsService } = await import('../../services/tableCompanionsService');
      vi.mocked(tableCompanionsService.getTableCompanions).mockRejectedValue(new Error('Network error'));
      
      render(<TableCompanionsWidget {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Unable to load companions. Please try again.')).toBeInTheDocument();
      });
    });

    it('should show no companions message when empty', async () => {
      const { tableCompanionsService } = await import('../../services/tableCompanionsService');
      vi.mocked(tableCompanionsService.getTableCompanions).mockResolvedValue([]);
      
      render(<TableCompanionsWidget {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('No other companions found at this table.')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Navigation', () => {
    it('should navigate to profile page when companion name is clicked', async () => {
      const mockCompanions = [
        {
          attendee_id: 'attendee-2',
          first_name: 'Jane',
          last_name: 'Smith',
          seat_number: 2,
          assignment_type: 'manual' as const
        }
      ];
      
      const { tableCompanionsService } = await import('../../services/tableCompanionsService');
      vi.mocked(tableCompanionsService.getTableCompanions).mockResolvedValue(mockCompanions);
      
      render(<TableCompanionsWidget {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const profileLink = screen.getByText('Jane Smith');
        expect(profileLink).toHaveAttribute('href', '/bio?id=attendee-2');
      });
    });

    it('should handle profile link click', async () => {
      const mockCompanions = [
        {
          attendee_id: 'attendee-2',
          first_name: 'Jane',
          last_name: 'Smith',
          seat_number: 2,
          assignment_type: 'manual' as const
        }
      ];
      
      const { tableCompanionsService } = await import('../../services/tableCompanionsService');
      vi.mocked(tableCompanionsService.getTableCompanions).mockResolvedValue(mockCompanions);
      
      render(<TableCompanionsWidget {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const profileLink = screen.getByText('Jane Smith');
        fireEvent.click(profileLink);
        
        expect(window.location.href).toBe('/bio?id=attendee-2');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<TableCompanionsWidget {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update ARIA attributes when expanded', async () => {
      const { tableCompanionsService } = await import('../../services/tableCompanionsService');
      vi.mocked(tableCompanionsService.getTableCompanions).mockResolvedValue([]);
      
      render(<TableCompanionsWidget {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <TableCompanionsWidget {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should have proper button styling', () => {
      render(<TableCompanionsWidget {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        width: '100%',
        padding: 'var(--space-md)',
        border: '2px solid var(--purple-200)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--white)',
        color: 'var(--ink-900)'
      });
    });
  });
});
