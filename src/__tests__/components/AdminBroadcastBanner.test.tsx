/**
 * AdminBroadcastBanner Component Tests
 * Story 2.1: Now/Next Glance Card - Task 6 (Admin Broadcasts)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminBroadcastBanner from '../../components/broadcast/AdminBroadcastBanner';
import useAdminBroadcasts from '../../hooks/useAdminBroadcasts';

// Mock the useAdminBroadcasts hook
vi.mock('../../hooks/useAdminBroadcasts', () => ({
  default: vi.fn()
}));

describe('AdminBroadcastBanner Component', () => {
  const mockUseAdminBroadcasts = vi.mocked(useAdminBroadcasts);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock - no active broadcast
    mockUseAdminBroadcasts.mockReturnValue({
      activeBroadcast: null,
      dismissActiveBroadcast: vi.fn()
    });
  });

  describe('No Active Broadcast', () => {
    it('should not render when no active broadcast', () => {
      render(<AdminBroadcastBanner />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should handle empty broadcast state correctly', () => {
      mockUseAdminBroadcasts.mockReturnValue({
        activeBroadcast: null,
        dismissActiveBroadcast: vi.fn()
      });

      render(<AdminBroadcastBanner />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByText('URGENT')).not.toBeInTheDocument();
      expect(screen.queryByText('Room change')).not.toBeInTheDocument();
    });
  });

  describe('Broadcast Display', () => {
    it('should display normal priority broadcast', () => {
      const mockBroadcast = {
        id: '1',
        message: 'Coffee break extended by 15 minutes',
        type: 'info',
        priority: 'normal',
        expiresAt: null
      };

      mockUseAdminBroadcasts.mockReturnValue({
        activeBroadcast: mockBroadcast,
        dismissActiveBroadcast: vi.fn()
      });

      render(<AdminBroadcastBanner />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('ANNOUNCEMENT')).toBeInTheDocument();
      expect(screen.getByText('Coffee break extended by 15 minutes')).toBeInTheDocument();
      expect(screen.getByText('📢')).toBeInTheDocument();
    });

    it('should display high priority broadcast', () => {
      const mockBroadcast = {
        id: '1',
        message: 'Session starting in 5 minutes',
        type: 'warning',
        priority: 'high',
        expiresAt: null
      };

      mockUseAdminBroadcasts.mockReturnValue({
        activeBroadcast: mockBroadcast,
        dismissActiveBroadcast: vi.fn()
      });

      render(<AdminBroadcastBanner />);

      expect(screen.getByText('IMPORTANT')).toBeInTheDocument();
      expect(screen.getByText('Session starting in 5 minutes')).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should display critical priority broadcast', () => {
      const mockBroadcast = {
        id: '1',
        message: 'URGENT: System maintenance in 5 minutes',
        type: 'urgent',
        priority: 'critical',
        expiresAt: null
      };

      mockUseAdminBroadcasts.mockReturnValue({
        activeBroadcast: mockBroadcast,
        dismissActiveBroadcast: vi.fn()
      });

      render(<AdminBroadcastBanner />);

      expect(screen.getByText('URGENT')).toBeInTheDocument();
      expect(screen.getByText('URGENT: System maintenance in 5 minutes')).toBeInTheDocument();
      expect(screen.getByText('🚨')).toBeInTheDocument();
    });
  });

  describe('Countdown Display', () => {
    it('should display countdown when broadcast has expiration', async () => {
      const futureTime = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes from now
      const mockBroadcast = {
        id: '1',
        message: 'Session ending soon',
        type: 'countdown',
        priority: 'high',
        expiresAt: futureTime
      };

      mockUseAdminBroadcasts.mockReturnValue({
        activeBroadcast: mockBroadcast,
        dismissActiveBroadcast: vi.fn()
      });

      render(<AdminBroadcastBanner showCountdown={true} />);

      // Should show countdown (approximately 5:00)
      await waitFor(() => {
        expect(screen.getByText(/\d+:\d{2}/)).toBeInTheDocument();
      });
    });

    it('should not display countdown when showCountdown is false', () => {
      const futureTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const mockBroadcast = {
        id: '1',
        message: 'Session ending soon',
        type: 'countdown',
        priority: 'high',
        expiresAt: futureTime
      };

      mockUseAdminBroadcasts.mockReturnValue({
        activeBroadcast: mockBroadcast,
        dismissActiveBroadcast: vi.fn()
      });

      render(<AdminBroadcastBanner showCountdown={false} />);

      expect(screen.queryByText(/5:0[0-9]/)).not.toBeInTheDocument();
    });

    it('should not show countdown when expired', async () => {
      const pastTime = new Date(Date.now() - 1000).toISOString(); // 1 second ago
      const mockBroadcast = {
        id: '1',
        message: 'Session ended',
        type: 'countdown',
        priority: 'normal',
        expiresAt: pastTime
      };

      mockUseAdminBroadcasts.mockReturnValue({
        activeBroadcast: mockBroadcast,
        dismissActiveBroadcast: vi.fn()
      });

      render(<AdminBroadcastBanner showCountdown={true} />);

      // Should not show countdown when expired (timeRemaining <= 0)
      expect(screen.queryByText('0:00')).not.toBeInTheDocument();
      expect(screen.getByText('Session ended')).toBeInTheDocument();
    });
  });

  describe('Dismiss Functionality', () => {
    it('should call dismissActiveBroadcast when dismiss button is clicked', () => {
      const mockDismiss = vi.fn();
      const mockBroadcast = {
        id: '1',
        message: 'Test message',
        type: 'info',
        priority: 'normal',
        expiresAt: null
      };

      mockUseAdminBroadcasts.mockReturnValue({
        activeBroadcast: mockBroadcast,
        dismissActiveBroadcast: mockDismiss
      });

      render(<AdminBroadcastBanner />);

      const dismissButton = screen.getByLabelText('Dismiss broadcast');
      fireEvent.click(dismissButton);

      expect(mockDismiss).toHaveBeenCalled();
    });

    it('should call onDismiss callback when provided', () => {
      const mockOnDismiss = vi.fn();
      const mockDismiss = vi.fn();
      const mockBroadcast = {
        id: '1',
        message: 'Test message',
        type: 'info',
        priority: 'normal',
        expiresAt: null
      };

      mockUseAdminBroadcasts.mockReturnValue({
        activeBroadcast: mockBroadcast,
        dismissActiveBroadcast: mockDismiss
      });

      render(<AdminBroadcastBanner onDismiss={mockOnDismiss} />);

      const dismissButton = screen.getByLabelText('Dismiss broadcast');
      fireEvent.click(dismissButton);

      expect(mockDismiss).toHaveBeenCalled();
      expect(mockOnDismiss).toHaveBeenCalledWith(mockBroadcast);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const mockBroadcast = {
        id: '1',
        message: 'Test message',
        type: 'info',
        priority: 'normal',
        expiresAt: null
      };

      mockUseAdminBroadcasts.mockReturnValue({
        activeBroadcast: mockBroadcast,
        dismissActiveBroadcast: vi.fn()
      });

      render(<AdminBroadcastBanner />);

      const banner = screen.getByRole('alert');
      expect(banner).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible dismiss button', () => {
      const mockBroadcast = {
        id: '1',
        message: 'Test message',
        type: 'info',
        priority: 'normal',
        expiresAt: null
      };

      mockUseAdminBroadcasts.mockReturnValue({
        activeBroadcast: mockBroadcast,
        dismissActiveBroadcast: vi.fn()
      });

      render(<AdminBroadcastBanner />);

      const dismissButton = screen.getByLabelText('Dismiss broadcast');
      expect(dismissButton).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply different styles based on broadcast type', () => {
      const urgentBroadcast = {
        id: '1',
        message: 'Urgent message',
        type: 'urgent',
        priority: 'critical',
        expiresAt: null
      };

      mockUseAdminBroadcasts.mockReturnValue({
        activeBroadcast: urgentBroadcast,
        dismissActiveBroadcast: vi.fn()
      });

      render(<AdminBroadcastBanner />);

      const banner = screen.getByRole('alert');
      expect(banner).toBeInTheDocument();
      // Check that the banner has a background style (the exact gradient may vary)
      expect(banner.style.background).toContain('linear-gradient');
    });
  });
});
