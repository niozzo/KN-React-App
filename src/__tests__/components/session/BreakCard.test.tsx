/**
 * BreakCard Component Tests
 * Story 2.2.1: Breakout Session Filtering
 */

import { render, screen } from '@testing-library/react';
import BreakCard from '../../../components/session/BreakCard';

describe('BreakCard Component', () => {
  // AC 4: No Breakout Fallback
  it('should render break card when no breakouts assigned', () => {
    // Given: No breakout sessions assigned
    // When: Rendering break card
    render(<BreakCard />);

    // Then: BreakCard should be displayed
    expect(screen.getByText('Break')).toBeInTheDocument();
    expect(screen.getByText('Break Time')).toBeInTheDocument();
    expect(screen.getByText('Enjoy your break')).toBeInTheDocument();
  });

  // AC 8: Break Card Design
  it('should follow same visual pattern as SessionCard', () => {
    // Given: Break card component
    // When: Rendering with default props
    const { container } = render(<BreakCard />);

    // Then: Should have proper card structure
    expect(container.querySelector('.break-card')).toBeInTheDocument();
    expect(container.querySelector('.card-header')).toBeInTheDocument();
    expect(container.querySelector('.card-content')).toBeInTheDocument();
  });

  it('should display appropriate break messaging', () => {
    // Given: Break card component
    // When: Rendering
    render(<BreakCard />);

    // Then: Should display break-specific content
    expect(screen.getByText('Enjoy your break')).toBeInTheDocument();
    expect(screen.getByText('Take this time to network, grab refreshments, or prepare for your next session.')).toBeInTheDocument();
  });

  it('should display break icon and indicator', () => {
    // Given: Break card component
    // When: Rendering
    render(<BreakCard />);

    // Then: Should display break icon and text
    expect(screen.getByText('☕')).toBeInTheDocument();
    expect(screen.getByText('Break')).toBeInTheDocument();
  });

  it('should display time slot when provided', () => {
    // Given: Break card with time slot
    const timeSlot = '10:00 AM - 11:00 AM';
    
    // When: Rendering with time slot
    render(<BreakCard timeSlot={timeSlot} />);

    // Then: Should display time information
    expect(screen.getByText('Break Time:')).toBeInTheDocument();
    expect(screen.getByText(timeSlot)).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    // Given: Break card with custom className
    const customClass = 'custom-break-card';
    
    // When: Rendering with custom class
    const { container } = render(<BreakCard className={customClass} />);

    // Then: Should apply custom class
    expect(container.querySelector('.break-card')).toHaveClass(customClass);
  });

  it('should accept variant prop', () => {
    // Given: Break card with variant
    // When: Rendering with variant
    const { container } = render(<BreakCard variant="now" />);

    // Then: Should apply variant class
    expect(container.querySelector('.break-card')).toBeInTheDocument();
  });

  it('should render without time slot', () => {
    // Given: Break card without time slot
    // When: Rendering
    render(<BreakCard />);

    // Then: Should not display time information
    expect(screen.queryByText('Break Time:')).not.toBeInTheDocument();
  });
});
