import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import SchedulePage from '../../pages/SchedulePage';

// Mock the ScheduleView component
vi.mock('../../components/ScheduleView', () => ({
  default: ({ onSessionClick, className }) => (
    <div data-testid="schedule-view" className={className}>
      <div>Mock ScheduleView Component</div>
      <button onClick={() => onSessionClick?.({ id: 'test-session' })}>
        Test Session Click
      </button>
    </div>
  )
}));

// Mock PageLayout
vi.mock('../../components/layout/PageLayout', () => ({
  default: ({ children }) => (
    <div data-testid="page-layout">
      {children}
    </div>
  )
}));

describe('SchedulePage', () => {
  const renderSchedulePage = () => {
    return render(
      <BrowserRouter>
        <SchedulePage />
      </BrowserRouter>
    );
  };

  it('renders page title', () => {
    renderSchedulePage();
    
    expect(screen.getByText('My Schedule')).toBeInTheDocument();
  });

  it('renders ScheduleView component', () => {
    renderSchedulePage();
    
    expect(screen.getByTestId('schedule-view')).toBeInTheDocument();
    expect(screen.getByText('Mock ScheduleView Component')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    renderSchedulePage();
    
    const scheduleView = screen.getByTestId('schedule-view');
    expect(scheduleView).toHaveClass('schedule-page-content');
  });

  it('handles session click events', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    renderSchedulePage();
    
    const sessionButton = screen.getByText('Test Session Click');
    sessionButton.click();
    
    expect(consoleSpy).toHaveBeenCalledWith('Session clicked:', { id: 'test-session' });
    
    consoleSpy.mockRestore();
  });

  it('wraps content in PageLayout', () => {
    renderSchedulePage();
    
    expect(screen.getByTestId('page-layout')).toBeInTheDocument();
  });
});
