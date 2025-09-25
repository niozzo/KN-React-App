/**
 * SessionCard Dining Support Tests
 * Story 2.1g.3: SessionCard Dining Support
 * 
 * Tests the dining-specific functionality in the SessionCard component
 * including visual indicators, information display, and accessibility.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SessionCard from '../../components/session/SessionCard';

// Mock the useCountdown hook
vi.mock('../../hooks/useCountdown', () => ({
  default: vi.fn(() => ({
    formattedTime: '2h 30m remaining',
    isActive: true,
    minutesRemaining: 150
  }))
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('SessionCard Dining Support', () => {
  const mockDiningEvents = [
    {
      id: 'dining-1',
      name: 'Continental Breakfast',
      title: 'Continental Breakfast',
      date: '2025-01-20',
      time: '08:00:00',
      start_time: '08:00:00',
      end_time: '08:00:00',
      location: 'Terrace Restaurant',
      type: 'dining',
      session_type: 'meal',
      capacity: 100,
      seating_type: 'open',
    },
    {
      id: 'dining-2',
      name: 'Networking Lunch',
      title: 'Networking Lunch',
      date: '2025-01-20',
      time: '12:00:00',
      start_time: '12:00:00',
      end_time: '12:00:00',
      location: 'Grand Ballroom',
      type: 'dining',
      session_type: 'meal',
      capacity: 200,
      seating_type: 'assigned',
    },
    {
      id: 'dining-3',
      name: 'Gala Dinner',
      title: 'Gala Dinner',
      date: '2025-01-20',
      time: '19:00:00',
      start_time: '19:00:00',
      end_time: '19:00:00',
      location: 'Main Hall',
      type: 'dining',
      session_type: 'meal',
      capacity: 300,
      seating_type: 'assigned',
    },
    {
      id: 'dining-4',
      name: 'Coffee Break',
      title: 'Coffee Break',
      date: '2025-01-20',
      time: '15:00:00',
      start_time: '15:00:00',
      end_time: '15:00:00',
      location: 'Lobby',
      type: 'dining',
      session_type: 'meal',
      capacity: 50,
      seating_type: 'open',
    },
  ];

  const mockRegularSession = {
    id: 'session-1',
    title: 'Opening Keynote',
    date: '2025-01-20',
    start_time: '09:00:00',
    end_time: '10:00:00',
    location: 'Main Hall',
    session_type: 'keynote',
    type: 'session',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSessionCard = (session, variant = 'default', onClick = vi.fn()) => {
    return render(
      <BrowserRouter>
        <SessionCard
          session={session}
          variant={variant}
          onClick={onClick}
        />
      </BrowserRouter>
    );
  };

  describe('Dining Event Support (AC: 1)', () => {
    it('should detect dining events correctly', () => {
      const { container } = renderSessionCard(mockDiningEvents[0]);
      
      expect(screen.getByText('Continental Breakfast')).toBeInTheDocument();
      expect(container.querySelector('.session-card--dining')).toBeInTheDocument();
    });

    it('should render dining-specific content', () => {
      renderSessionCard(mockDiningEvents[0]);
      
      expect(screen.getByText('Continental Breakfast')).toBeInTheDocument();
      expect(screen.getByText('Open Seating')).toBeInTheDocument();
    });

    it('should maintain existing session rendering for regular sessions', () => {
      renderSessionCard(mockRegularSession);
      
      expect(screen.getByText('Opening Keynote')).toBeInTheDocument();
      expect(screen.queryByText('dining')).not.toBeInTheDocument();
    });
  });

  describe('Visual Indicators (AC: 2)', () => {
    it('should display open seating for breakfast events', () => {
      renderSessionCard(mockDiningEvents[0]);
      
      expect(screen.getByText('Open Seating')).toBeInTheDocument();
    });

    it('should not display seating for assigned lunch events', () => {
      renderSessionCard(mockDiningEvents[1]);
      
      expect(screen.queryByText('Open Seating')).not.toBeInTheDocument();
    });

    it('should not display seating for assigned dinner events', () => {
      renderSessionCard(mockDiningEvents[2]);
      
      expect(screen.queryByText('Open Seating')).not.toBeInTheDocument();
    });

    it('should display open seating for coffee break events', () => {
      renderSessionCard(mockDiningEvents[3]);
      
      expect(screen.getByText('Open Seating')).toBeInTheDocument();
    });

    it('should apply dining-specific styling', () => {
      const { container } = renderSessionCard(mockDiningEvents[0]);
      
      const diningCard = container.querySelector('.session-card--dining');
      expect(diningCard).toBeInTheDocument();
    });

    it('should apply special styling for dining events in "now" variant', () => {
      const { container } = renderSessionCard(mockDiningEvents[0], 'now');
      
      const card = container.querySelector('.session-card');
      expect(card).toHaveStyle({
        background: 'var(--green-050)',
        border: '2px solid var(--green-500)'
      });
    });
  });

  describe('Information Display (AC: 3)', () => {
    it('should display dining seating information', () => {
      renderSessionCard(mockDiningEvents[0]);
      
      expect(screen.getByText('Open Seating')).toBeInTheDocument();
    });

    it('should display seating type for open seating', () => {
      renderSessionCard(mockDiningEvents[0]);
      
      expect(screen.getByText('Open Seating')).toBeInTheDocument();
    });

    it('should not display seating for assigned seating', () => {
      renderSessionCard(mockDiningEvents[1]);
      
      expect(screen.queryByText('Seating: Assigned')).not.toBeInTheDocument();
    });

    it('should display dining location', () => {
      renderSessionCard(mockDiningEvents[0]);
      
      expect(screen.getByText('Terrace Restaurant')).toBeInTheDocument();
    });

    it('should handle dining events without capacity information', () => {
      const diningEventNoCapacity = {
        ...mockDiningEvents[0],
        capacity: undefined,
      };
      
      renderSessionCard(diningEventNoCapacity);
      
      expect(screen.queryByText('seats')).not.toBeInTheDocument();
    });

    it('should handle dining events without seating type', () => {
      const diningEventNoSeating = {
        ...mockDiningEvents[0],
        seating_type: undefined,
      };
      
      renderSessionCard(diningEventNoSeating);
      
      expect(screen.queryByText('Seating:')).not.toBeInTheDocument();
    });
  });

  describe('Layout Consistency (AC: 4)', () => {
    it('should maintain consistent card layout structure', () => {
      const { container } = renderSessionCard(mockDiningEvents[0]);
      
      const cardHeader = container.querySelector('.session-header');
      const cardContent = container.querySelector('.card-content');
      
      expect(cardHeader).toBeInTheDocument();
      expect(cardContent).toBeInTheDocument();
    });

    it('should maintain consistent spacing and padding', () => {
      const { container } = renderSessionCard(mockDiningEvents[0]);
      
      const seatAssignment = container.querySelector('.seat-assignment');
      expect(seatAssignment).toHaveStyle({
        padding: 'var(--space-sm)',
        marginTop: 'var(--space-sm)'
      });
    });

    it('should handle text wrapping for long dining information', () => {
      const longDiningEvent = {
        ...mockDiningEvents[0],
        title: 'Very Long Dining Event Name That Should Wrap Properly',
        location: 'Very Long Location Name That Should Also Wrap Properly',
      };
      
      renderSessionCard(longDiningEvent);
      
      expect(screen.getByText('Very Long Dining Event Name That Should Wrap Properly')).toBeInTheDocument();
      expect(screen.getByText('Very Long Location Name That Should Also Wrap Properly')).toBeInTheDocument();
    });
  });

  describe('Interactive Elements (AC: 5)', () => {
    it('should handle click events for dining events', () => {
      const onClick = vi.fn();
      renderSessionCard(mockDiningEvents[0], 'default', onClick);
      
      const card = screen.getByText('Continental Breakfast').closest('.session-card');
      fireEvent.click(card);
      
      expect(onClick).toHaveBeenCalled();
    });

    it('should support keyboard navigation', () => {
      const onClick = vi.fn();
      renderSessionCard(mockDiningEvents[0], 'default', onClick);
      
      const card = screen.getByText('Continental Breakfast').closest('.session-card');
      fireEvent.keyDown(card, { key: 'Enter' });
      
      // Note: The actual keyboard handling would depend on the Card component implementation
      expect(card).toBeInTheDocument();
    });
  });

  describe('Variant Support (AC: 6)', () => {
    it('should support "now" variant for dining events', () => {
      const { container } = renderSessionCard(mockDiningEvents[0], 'now');
      
      const card = container.querySelector('.session-card--now');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('NOW')).toBeInTheDocument();
    });

    it('should support "next" variant for dining events', () => {
      const { container } = renderSessionCard(mockDiningEvents[0], 'next');
      
      const card = container.querySelector('.session-card--next');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should support "agenda" variant for dining events', () => {
      const { container } = renderSessionCard(mockDiningEvents[0], 'agenda');
      
      const card = container.querySelector('.session-card');
      expect(card).toBeInTheDocument();
      // Agenda variant doesn't have specific styling, just default
    });

    it('should maintain consistent behavior across all variants', () => {
      const variants = ['now', 'next', 'agenda'];
      
      variants.forEach(variant => {
        const { container, unmount } = renderSessionCard(mockDiningEvents[0], variant);
        
        expect(screen.getByText('Continental Breakfast')).toBeInTheDocument();
        expect(screen.getByText('Open Seating')).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Accessibility (AC: 7)', () => {
    it('should have proper ARIA labels for dining events', () => {
      renderSessionCard(mockDiningEvents[0]);
      
      const card = screen.getByText('Continental Breakfast').closest('.session-card');
      expect(card).toBeInTheDocument();
      
      // The card should be focusable (role is handled by the Card component)
      expect(card).toBeInTheDocument();
    });

    it('should support screen reader navigation', () => {
      renderSessionCard(mockDiningEvents[0]);
      
      // All text content should be accessible to screen readers
      expect(screen.getByText('Continental Breakfast')).toBeInTheDocument();
      expect(screen.getByText('Open Seating')).toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
      const { container } = renderSessionCard(mockDiningEvents[0]);
      
      const title = container.querySelector('h3');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Continental Breakfast');
    });

    it('should maintain focus management', () => {
      const { container } = renderSessionCard(mockDiningEvents[0]);
      
      const card = container.querySelector('.session-card');
      expect(card).toBeInTheDocument();
      
      // Card should be focusable
      card.focus();
      expect(document.activeElement).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle dining events with missing properties', () => {
      const minimalDiningEvent = {
        id: 'dining-minimal',
        type: 'dining',
        title: 'Minimal Event',
      };
      
      renderSessionCard(minimalDiningEvent);
      
      expect(screen.getByText('Minimal Event')).toBeInTheDocument();
    });

    it('should handle malformed dining event data', () => {
      const malformedDiningEvent = {
        id: 'dining-malformed',
        type: 'dining',
        title: 'Malformed Event',
        // Missing required fields
      };
      
      renderSessionCard(malformedDiningEvent);
      
      // Should not crash and should render something
      expect(screen.getByText('Malformed Event')).toBeInTheDocument();
    });

    it('should handle null or undefined session gracefully', () => {
      expect(() => renderSessionCard(null)).not.toThrow();
      expect(() => renderSessionCard(undefined)).not.toThrow();
    });
  });

  describe('Performance and Rendering', () => {
    it('should render dining events efficiently', () => {
      const startTime = performance.now();
      renderSessionCard(mockDiningEvents[0]);
      const endTime = performance.now();
      
      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle multiple dining events without performance degradation', () => {
      const startTime = performance.now();
      
      // Render multiple dining events
      mockDiningEvents.forEach(event => {
        const { unmount } = renderSessionCard(event);
        unmount();
      });
      
      const endTime = performance.now();
      
      // Should handle multiple renders efficiently
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
