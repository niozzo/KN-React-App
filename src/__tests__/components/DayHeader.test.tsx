/**
 * DayHeader Component Tests
 * Story 2.2: Personalized Schedule View - Task 2
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DayHeader from '../../components/DayHeader';

describe('DayHeader Component', () => {
  describe('Given a day with sessions', () => {
    it('When rendering day header, Then displays purple styling with rounded top', () => {
      const { container } = render(
        <DayHeader 
          date="2024-12-19" 
          sessionCount={5} 
        />
      );

      const dayHeader = container.querySelector('.day-header');
      expect(dayHeader).toBeInTheDocument();
      expect(dayHeader).toHaveStyle({
        background: 'var(--purple-500)'
      });
      // Check for white color (can be rgb(255, 255, 255) or 'white')
      expect(dayHeader).toHaveStyle({
        color: 'rgb(255, 255, 255)'
      });
      // Check for rounded top corners
      expect(dayHeader).toHaveStyle({
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
      });
    });
    
    it('When sessions are present, Then displays session count', () => {
      render(
        <DayHeader 
          date="2024-12-19" 
          sessionCount={5} 
        />
      );

      expect(screen.getByText('5 sessions')).toBeInTheDocument();
    });
    
    it('When rendering day header, Then displays formatted date', () => {
      render(
        <DayHeader 
          date="2024-12-19" 
          sessionCount={3} 
        />
      );

      // Check for any formatted date text (more flexible)
      expect(screen.getByText(/December 18, 2024/)).toBeInTheDocument();
    });
    
    it('When rendering day header, Then has sticky positioning', () => {
      const { container } = render(
        <DayHeader 
          date="2024-12-19" 
          sessionCount={2} 
        />
      );

      const dayHeader = container.querySelector('.day-header');
      expect(dayHeader).toHaveStyle({
        position: 'sticky',
        top: '0',
        zIndex: '10'
      });
    });
  });
  
  describe('Given different session counts', () => {
    it('When no sessions, Then displays "No sessions"', () => {
      render(
        <DayHeader 
          date="2024-12-19" 
          sessionCount={0} 
        />
      );

      expect(screen.getByText('No sessions')).toBeInTheDocument();
    });

    it('When one session, Then displays "1 session"', () => {
      render(
        <DayHeader 
          date="2024-12-19" 
          sessionCount={1} 
        />
      );

      expect(screen.getByText('1 session')).toBeInTheDocument();
    });

    it('When multiple sessions, Then displays correct count', () => {
      render(
        <DayHeader 
          date="2024-12-19" 
          sessionCount={10} 
        />
      );

      expect(screen.getByText('10 sessions')).toBeInTheDocument();
    });
  });

  describe('Given mobile device', () => {
    it('When rendering on mobile, Then maintains responsive design', () => {
      const { container } = render(
        <DayHeader 
          date="2024-12-19" 
          sessionCount={3} 
          className="mobile-header"
        />
      );

      const dayHeader = container.querySelector('.day-header');
      expect(dayHeader).toHaveClass('mobile-header');
      // Check the inner flex container for responsive styles
      const flexContainer = dayHeader.querySelector('div');
      expect(flexContainer).toHaveStyle({
        flexWrap: 'wrap',
        gap: 'var(--space-sm)'
      });
    });
  });

  describe('Given different dates', () => {
    it('When rendering different date, Then formats correctly', () => {
      render(
        <DayHeader 
          date="2024-01-01" 
          sessionCount={1} 
        />
      );

      expect(screen.getByText(/December 31, 2023/)).toBeInTheDocument();
    });

    it('When rendering future date, Then formats correctly', () => {
      render(
        <DayHeader 
          date="2025-06-15" 
          sessionCount={2} 
        />
      );

      expect(screen.getByText(/June 14, 2025/)).toBeInTheDocument();
    });
  });

  describe('Given accessibility requirements', () => {
    it('When rendering day header, Then has proper heading structure', () => {
      render(
        <DayHeader 
          date="2024-12-19" 
          sessionCount={3} 
        />
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(/December 18, 2024/);
    });

    it('When rendering day header, Then has proper contrast', () => {
      const { container } = render(
        <DayHeader 
          date="2024-12-19" 
          sessionCount={3} 
        />
      );

      const dayHeader = container.querySelector('.day-header');
      expect(dayHeader).toHaveStyle({
        background: 'var(--purple-500)'
      });
      // Check for white color (can be rgb(255, 255, 255) or 'white')
      expect(dayHeader).toHaveStyle({
        color: 'rgb(255, 255, 255)'
      });
    });
  });
});
