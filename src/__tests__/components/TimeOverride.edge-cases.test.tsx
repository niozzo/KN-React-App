/**
 * TimeOverride Component Edge Cases Tests
 * Tests for time override component behavior and time display issues
 * 
 * Edge Cases Covered:
 * 1. Time display not updating when override is active
 * 2. Override state transitions
 * 3. Time display consistency
 * 4. Component behavior in different environments
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TimeOverride from '../../components/dev/TimeOverride';
import TimeService from '../../services/timeService';

// Mock TimeService
vi.mock('../../services/timeService', () => ({
  default: {
    isOverrideActive: vi.fn(),
    getCurrentTime: vi.fn(),
    getOverrideTime: vi.fn(),
    setOverrideTime: vi.fn(),
    clearOverrideTime: vi.fn(),
    getOverrideStartTime: vi.fn()
  }
}));

describe('TimeOverride Component Edge Cases', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };

    // Set development environment
    process.env.NODE_ENV = 'development';

    // Default TimeService mocks
    vi.mocked(TimeService.isOverrideActive).mockReturnValue(false);
    vi.mocked(TimeService.getCurrentTime).mockReturnValue(new Date());
    vi.mocked(TimeService.getOverrideTime).mockReturnValue(null);
    vi.mocked(TimeService.setOverrideTime).mockImplementation(() => {});
    vi.mocked(TimeService.clearOverrideTime).mockImplementation(() => {});
    vi.mocked(TimeService.getOverrideStartTime).mockReturnValue(null);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    global.localStorage = originalLocalStorage;
    vi.clearAllMocks();
  });

  describe('Time Display Not Updating When Override Active', () => {
    it('should display static override time when override is active', () => {
      const overrideTime = new Date('2024-12-19T09:05:00');
      
      // Mock TimeService to return override time
      vi.mocked(TimeService.isOverrideActive).mockReturnValue(true);
      vi.mocked(TimeService.getCurrentTime).mockReturnValue(overrideTime);
      vi.mocked(TimeService.getOverrideTime).mockReturnValue(overrideTime);

      render(<TimeOverride />);

      const timeDisplay = screen.getByText(overrideTime.toLocaleString());
      expect(timeDisplay).toBeInTheDocument();
    });

    it('should not update time display when override is active', async () => {
      const overrideTime = new Date('2024-12-19T09:05:00');
      
      // Mock TimeService to return override time
      vi.mocked(TimeService.isOverrideActive).mockReturnValue(true);
      vi.mocked(TimeService.getCurrentTime).mockReturnValue(overrideTime);
      vi.mocked(TimeService.getOverrideTime).mockReturnValue(overrideTime);

      render(<TimeOverride />);

      const timeDisplay = screen.getByText(overrideTime.toLocaleString());
      const initialTime = timeDisplay.textContent;

      // Wait for potential updates
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Time should remain the same (static override time)
      expect(timeDisplay.textContent).toBe(initialTime);
    });

    it('should show real time when override is not active', () => {
      const realTime = new Date('2024-12-19T10:00:00');
      
      // Mock TimeService to return real time
      vi.mocked(TimeService.isOverrideActive).mockReturnValue(false);
      vi.mocked(TimeService.getCurrentTime).mockReturnValue(realTime);

      render(<TimeOverride />);

      // Should show real time (will be current time)
      const timeDisplay = screen.getByTestId('current-time-display');
      expect(timeDisplay).toBeInTheDocument();
    });

    it('should update real time display when override is not active', async () => {
      const initialTime = new Date('2024-12-19T10:00:00');
      const updatedTime = new Date('2024-12-19T10:00:01');
      
      // Mock TimeService to return real time
      vi.mocked(TimeService.isOverrideActive).mockReturnValue(false);
      vi.mocked(TimeService.getCurrentTime)
        .mockReturnValueOnce(initialTime)
        .mockReturnValue(updatedTime);

      render(<TimeOverride />);

      const timeDisplay = screen.getByTestId('current-time-display');
      const initialTimeText = timeDisplay.textContent;

      // Wait for time to update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for next second
      });

      // Time should have updated (real time)
      expect(timeDisplay.textContent).not.toBe(initialTimeText);
    });
  });

  describe('Override State Transitions', () => {
    it('should switch from real time to override time when override is set', async () => {
      // Start without override
      global.localStorage.getItem.mockReturnValue(null);

      const { rerender } = render(<TimeOverride />);

      // Should show real time
      const timeDisplay = screen.getByTestId('current-time-display');
      expect(timeDisplay).toBeInTheDocument();

      // Set override
      const overrideTime = new Date('2024-12-19T09:05:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      // Re-render to simulate override being set
      rerender(<TimeOverride />);

      // Should now show override time
      expect(screen.getByText(overrideTime.toLocaleString())).toBeInTheDocument();
    });

    it('should switch from override time to real time when override is cleared', async () => {
      // Start with override
      const overrideTime = new Date('2024-12-19T09:05:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      const { rerender } = render(<TimeOverride />);

      // Should show override time
      expect(screen.getByText(overrideTime.toLocaleString())).toBeInTheDocument();

      // Clear override
      global.localStorage.getItem.mockReturnValue(null);

      // Re-render to simulate override being cleared
      rerender(<TimeOverride />);

      // Should now show real time
      const timeDisplay = screen.getByTestId('current-time-display');
      expect(timeDisplay).toBeInTheDocument();
    });
  });

  describe('Time Display Consistency', () => {
    it('should maintain consistent override time display across re-renders', () => {
      const overrideTime = new Date('2024-12-19T09:05:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      const { rerender } = render(<TimeOverride />);

      const timeDisplay1 = screen.getByText(overrideTime.toLocaleString());

      // Re-render
      rerender(<TimeOverride />);

      const timeDisplay2 = screen.getByText(overrideTime.toLocaleString());

      // Should show the same time
      expect(timeDisplay1.textContent).toBe(timeDisplay2.textContent);
    });

    it('should handle multiple rapid override changes', async () => {
      const overrideTime1 = new Date('2024-12-19T09:05:00');
      const overrideTime2 = new Date('2024-12-19T10:15:00');
      const overrideTime3 = new Date('2024-12-19T11:30:00');

      // Start with first override
      global.localStorage.getItem.mockReturnValue(overrideTime1.toISOString());

      const { rerender } = render(<TimeOverride />);

      expect(screen.getByText(overrideTime1.toLocaleString())).toBeInTheDocument();

      // Change to second override
      global.localStorage.getItem.mockReturnValue(overrideTime2.toISOString());
      rerender(<TimeOverride />);

      expect(screen.getByText(overrideTime2.toLocaleString())).toBeInTheDocument();

      // Change to third override
      global.localStorage.getItem.mockReturnValue(overrideTime3.toISOString());
      rerender(<TimeOverride />);

      expect(screen.getByText(overrideTime3.toLocaleString())).toBeInTheDocument();
    });
  });

  describe('Component Behavior in Different Environments', () => {
    it('should not render in production environment', () => {
      process.env.NODE_ENV = 'production';

      const { container } = render(<TimeOverride />);

      expect(container.firstChild).toBeNull();
    });

    it('should render in development environment', () => {
      process.env.NODE_ENV = 'development';

      render(<TimeOverride />);

      expect(screen.getByText('Set Time Override')).toBeInTheDocument();
    });

    it('should render in test environment', () => {
      process.env.NODE_ENV = 'test';

      render(<TimeOverride />);

      expect(screen.getByText('Set Time Override')).toBeInTheDocument();
    });
  });

  describe('Override Panel Functionality', () => {
    it('should open override panel when toggle button is clicked', () => {
      render(<TimeOverride />);

      const toggleButton = screen.getByText('Set Time Override');
      fireEvent.click(toggleButton);

      expect(screen.getByText('Set Override Time')).toBeInTheDocument();
    });

    it('should close override panel when toggle button is clicked again', () => {
      render(<TimeOverride />);

      const toggleButton = screen.getByText('Set Time Override');
      
      // Open panel
      fireEvent.click(toggleButton);
      expect(screen.getByText('Set Override Time')).toBeInTheDocument();

      // Close panel
      fireEvent.click(toggleButton);
      expect(screen.queryByText('Set Override Time')).not.toBeInTheDocument();
    });

    it('should show active state when override is active', () => {
      const overrideTime = new Date('2024-12-19T09:05:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      render(<TimeOverride />);

      const toggleButton = screen.getByText('Override Active');
      expect(toggleButton).toHaveClass('active');
    });

    it('should show inactive state when override is not active', () => {
      global.localStorage.getItem.mockReturnValue(null);

      render(<TimeOverride />);

      const toggleButton = screen.getByText('Set Time Override');
      expect(toggleButton).not.toHaveClass('active');
    });
  });

  describe('Time Formatting Edge Cases', () => {
    it('should handle different time formats correctly', () => {
      const testTimes = [
        new Date('2024-12-19T00:00:00'), // Midnight
        new Date('2024-12-19T12:00:00'), // Noon
        new Date('2024-12-19T23:59:59'), // End of day
        new Date('2024-12-19T09:05:30'), // With seconds
      ];

      testTimes.forEach((testTime, index) => {
        global.localStorage.getItem.mockReturnValue(testTime.toISOString());

        const { rerender } = render(<TimeOverride />);

        expect(screen.getByText(testTime.toLocaleString())).toBeInTheDocument();

        // Clean up for next iteration
        rerender(<div />);
      });
    });

    it('should handle timezone differences correctly', () => {
      // Test with UTC time
      const utcTime = new Date('2024-12-19T09:05:00.000Z');
      global.localStorage.getItem.mockReturnValue(utcTime.toISOString());

      render(<TimeOverride />);

      // Should display in local timezone
      expect(screen.getByText(utcTime.toLocaleString())).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid override time gracefully', () => {
      global.localStorage.getItem.mockReturnValue('invalid-date');

      // Should not throw error
      expect(() => render(<TimeOverride />)).not.toThrow();

      // Should fall back to real time
      expect(screen.getByTestId('current-time-display')).toBeInTheDocument();
    });

    it('should handle localStorage errors gracefully', () => {
      global.localStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw error
      expect(() => render(<TimeOverride />)).not.toThrow();

      // Should fall back to real time
      expect(screen.getByTestId('current-time-display')).toBeInTheDocument();
    });
  });

  describe('Performance and Memory', () => {
    it('should not cause memory leaks with time intervals', () => {
      global.localStorage.getItem.mockReturnValue(null);

      const { unmount } = render(<TimeOverride />);

      // Should not throw when unmounting
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid state changes efficiently', () => {
      const overrideTime = new Date('2024-12-19T09:05:00');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      const { rerender } = render(<TimeOverride />);

      // Rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender(<TimeOverride />);
      }

      // Should still work correctly
      expect(screen.getByText(overrideTime.toLocaleString())).toBeInTheDocument();
    });
  });
});
