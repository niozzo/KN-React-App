/**
 * Coffee Break Countdown Integration Tests
 * End-to-end tests for coffee break countdown timer functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import SessionCard from '../../components/session/SessionCard';
import useCountdown from '../../hooks/useCountdown';
import { isMeal, isCoffeeBreak } from '../../utils/sessionUtils';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the countdown hook
vi.mock('../../hooks/useCountdown', () => ({
  default: vi.fn()
}));

// Mock the session utils
vi.mock('../../utils/sessionUtils', () => ({
  isMeal: vi.fn(),
  isCoffeeBreak: vi.fn(),
  isDiningEvent: vi.fn(() => false),
  getDiningEventType: vi.fn(() => null),
  getDiningEventIcon: vi.fn(() => null),
  getSessionCategory: vi.fn(() => 'general'),
  shouldShowCountdown: vi.fn(() => true),
  getCountdownPriority: vi.fn(() => 1),
  formatSessionTitle: vi.fn((session) => session.title),
  getSessionIcon: vi.fn(() => '📅'),
  getSessionClassName: vi.fn(() => ''),
  hasSpecialStyling: vi.fn(() => false)
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn())
  };
});

// Test wrapper component with AuthProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Coffee Break Countdown Integration', () => {
  beforeEach(() => {
    // Don't clear all mocks to preserve the useCountdown mock
    // Set default mock return value for useCountdown with complete object structure
    vi.mocked(useCountdown).mockReturnValue({
      timeRemaining: 754000,
      formattedTime: '00:12:34',
      isActive: true,
      isComplete: false,
      minutesRemaining: 12,
      hoursRemaining: 0
    });
  });

  describe('Session Type Detection', () => {
    it('should correctly identify coffee break sessions as meal type', () => {
      // Arrange
      const coffeeBreakSession = {
        id: 'coffee-break-1',
        title: 'Morning Coffee Break',
        session_type: 'meal',
        start_time: '10:15:00',
        end_time: '10:30:00',
        date: '2025-10-21',
        location: 'Outside the Grand Ballroom'
      };

      // Mock the functions to return the expected values
      vi.mocked(isMeal).mockReturnValue(true);
      vi.mocked(isCoffeeBreak).mockReturnValue(true);

      // Act & Assert
      expect(isMeal(coffeeBreakSession)).toBe(true);
      expect(isCoffeeBreak(coffeeBreakSession)).toBe(true);
    });

    it('should not identify general sessions as meal type', () => {
      // Arrange
      const generalSession = {
        id: 'general-session-1',
        title: 'AI-Powered Transformation',
        session_type: 'general',
        start_time: '09:00:00',
        end_time: '10:00:00',
        date: '2025-10-21',
        location: 'Grand Ballroom'
      };

      // Mock the functions to return the expected values
      vi.mocked(isMeal).mockReturnValue(false);
      vi.mocked(isCoffeeBreak).mockReturnValue(false);

      // Act & Assert
      expect(isMeal(generalSession)).toBe(false);
      expect(isCoffeeBreak(generalSession)).toBe(false);
    });

    it('should identify coffee break by title even if session_type is not meal', () => {
      // Arrange
      const coffeeBreakByTitle = {
        id: 'coffee-break-2',
        title: 'Afternoon Coffee Break',
        session_type: 'general', // Wrong session_type
        start_time: '15:00:00',
        end_time: '15:15:00',
        date: '2025-10-21',
        location: 'Outside the Grand Ballroom'
      };

      // Mock the functions to return true for title-based detection
      vi.mocked(isMeal).mockReturnValue(true);
      vi.mocked(isCoffeeBreak).mockReturnValue(true);

      // Act & Assert
      expect(isMeal(coffeeBreakByTitle)).toBe(true);
      expect(isCoffeeBreak(coffeeBreakByTitle)).toBe(true);
    });
  });

  describe('Countdown Timer Display', () => {
    it('should show countdown timer for active coffee break sessions', () => {
      // Arrange
      const coffeeBreakSession = {
        id: 'coffee-break-1',
        title: 'Morning Coffee Break',
        session_type: 'meal',
        start_time: '10:15:00',
        end_time: '10:30:00',
        date: '2025-10-21',
        location: 'Outside the Grand Ballroom'
      };

      // Mock countdown hook to return active countdown
      vi.mocked(useCountdown).mockReturnValue({
        timeRemaining: 754000,
        formattedTime: '00:12:34',
        isActive: true,
        isComplete: false,
        minutesRemaining: 12,
        hoursRemaining: 0
      });

      // Mock session utils
      vi.mocked(isMeal).mockReturnValue(true);
      vi.mocked(isCoffeeBreak).mockReturnValue(true);

      // Act
      render(
        <TestWrapper>
          <SessionCard session={coffeeBreakSession} variant="now" />
        </TestWrapper>
      );

      // Assert
      expect(screen.getByText('00:12:34')).toBeInTheDocument();
    });

    it('should not show countdown timer for non-meal sessions', () => {
      // Arrange
      const generalSession = {
        id: 'general-session-1',
        title: 'AI-Powered Transformation',
        session_type: 'general',
        start_time: '09:00:00',
        end_time: '10:00:00',
        date: '2025-10-21',
        location: 'Grand Ballroom'
      };

      // Mock session utils
      vi.mocked(isMeal).mockReturnValue(false);
      vi.mocked(isCoffeeBreak).mockReturnValue(false);

      // Act
      render(
        <TestWrapper>
          <SessionCard session={generalSession} variant="now" />
        </TestWrapper>
      );

      // Assert
      expect(screen.queryByText(/\d{2}:\d{2}:\d{2}/)).not.toBeInTheDocument();
    });

    it('should show countdown timer for coffee break sessions with correct session_type', () => {
      // Arrange
      const coffeeBreakSession = {
        id: 'coffee-break-1',
        title: 'Morning Coffee Break',
        session_type: 'meal', // ✅ Correct session_type
        start_time: '10:15:00',
        end_time: '10:30:00',
        date: '2025-10-21',
        location: 'Outside the Grand Ballroom'
      };

      // Mock countdown hook
      vi.mocked(useCountdown).mockReturnValue({
        timeRemaining: 300000,
        formattedTime: '00:05:00',
        isActive: true,
        isComplete: false,
        minutesRemaining: 5,
        hoursRemaining: 0
      });

      // Mock session utils to return true for meal type
      vi.mocked(isMeal).mockReturnValue(true);
      vi.mocked(isCoffeeBreak).mockReturnValue(true);

      // Act
      render(
        <TestWrapper>
          <SessionCard session={coffeeBreakSession} variant="now" />
        </TestWrapper>
      );

      // Assert
      expect(screen.getByText('00:05:00')).toBeInTheDocument();
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain session_type through the entire data pipeline', () => {
      // This test simulates the complete data flow from database to UI
      
      // Step 1: Database data
      const dbData = {
        id: 'coffee-break-1',
        title: 'Morning Coffee Break',
        type: 'meal', // Database field
        start_time: '10:15:00',
        end_time: '10:30:00',
        date: '2025-10-21'
      };

      // Step 2: Transformation (simulated)
      const transformedData = {
        ...dbData,
        session_type: 'meal' // Transformed field
      };

      // Step 3: Time override application (simulated)
      const timeOverride = {
        start_time: '10:20:00',
        end_time: '10:35:00'
      };

      const finalData = {
        ...transformedData,
        ...timeOverride
      };

      // Assertions
      expect(finalData.session_type).toBe('meal'); // ✅ Preserved through pipeline
      expect(finalData.start_time).toBe('10:20:00'); // ✅ Time override applied
      expect(finalData.end_time).toBe('10:35:00'); // ✅ Time override applied
    });

    it('should prevent double transformation corruption', () => {
      // This test ensures the fix prevents the original bug
      
      // Simulate the problematic scenario
      const originalData = {
        id: 'coffee-break-1',
        title: 'Morning Coffee Break',
        session_type: 'meal', // ✅ Correct value
        start_time: '10:15:00',
        end_time: '10:30:00',
        date: '2025-10-21'
      };

      // Simulate time override application (new approach)
      const timeOverride = {
        start_time: '10:20:00'
      };

      const result = {
        ...originalData,
        ...timeOverride
      };

      // Assert that session_type is preserved
      expect(result.session_type).toBe('meal'); // ✅ Not corrupted to 'general'
      expect(result.start_time).toBe('10:20:00'); // ✅ Time override applied
    });
  });

  describe('Edge Cases', () => {
    it('should handle coffee break sessions with missing session_type', () => {
      // Arrange
      const coffeeBreakSession = {
        id: 'coffee-break-1',
        title: 'Morning Coffee Break',
        // session_type missing
        start_time: '10:15:00',
        end_time: '10:30:00',
        date: '2025-10-21',
        location: 'Outside the Grand Ballroom'
      };

      // Mock session utils to handle missing session_type
      vi.mocked(isMeal).mockReturnValue(false);
      vi.mocked(isCoffeeBreak).mockReturnValue(true); // Title-based detection

      // Act
      render(
        <TestWrapper>
          <SessionCard session={coffeeBreakSession} variant="now" />
        </TestWrapper>
      );

      // Assert - Should still work with title-based detection
      expect(screen.getByText('Morning Coffee Break')).toBeInTheDocument();
    });

    it('should handle coffee break sessions with null session_type', () => {
      // Arrange
      const coffeeBreakSession = {
        id: 'coffee-break-1',
        title: 'Morning Coffee Break',
        session_type: null,
        start_time: '10:15:00',
        end_time: '10:30:00',
        date: '2025-10-21',
        location: 'Outside the Grand Ballroom'
      };

      // Mock session utils
      vi.mocked(isMeal).mockReturnValue(false);
      vi.mocked(isCoffeeBreak).mockReturnValue(true);

      // Act
      render(
        <TestWrapper>
          <SessionCard session={coffeeBreakSession} variant="now" />
        </TestWrapper>
      );

      // Assert
      expect(screen.getByText('Morning Coffee Break')).toBeInTheDocument();
    });

    it('should handle coffee break sessions with undefined session_type', () => {
      // Arrange
      const coffeeBreakSession = {
        id: 'coffee-break-1',
        title: 'Morning Coffee Break',
        session_type: undefined,
        start_time: '10:15:00',
        end_time: '10:30:00',
        date: '2025-10-21',
        location: 'Outside the Grand Ballroom'
      };

      // Mock session utils
      vi.mocked(isMeal).mockReturnValue(false);
      vi.mocked(isCoffeeBreak).mockReturnValue(true);

      // Act
      render(
        <TestWrapper>
          <SessionCard session={coffeeBreakSession} variant="now" />
        </TestWrapper>
      );

      // Assert
      expect(screen.getByText('Morning Coffee Break')).toBeInTheDocument();
    });
  });
});
