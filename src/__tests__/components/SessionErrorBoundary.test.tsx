import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SessionErrorBoundary from '../../components/common/SessionErrorBoundary';

// Mock console.error to avoid noise in tests
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('SessionErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Boundary Functionality', () => {
    it('Test 11: Should catch rendering errors and show fallback UI', () => {
      // Component that throws an error
      const ThrowingComponent = () => {
        throw new Error('Test rendering error');
      };

      const sessionData = {
        id: 'test-session',
        title: 'Test Session',
        speaker: {},
        speakerInfo: '',
        speakers: []
      };

      render(
        <SessionErrorBoundary sessionData={sessionData}>
          <ThrowingComponent />
        </SessionErrorBoundary>
      );

      // Should show error fallback UI
      expect(screen.getByText('Session Display Issue')).toBeInTheDocument();
      expect(screen.getByText('There was a problem displaying this session.')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('Test 12: Should log error with context information', () => {
      const ThrowingComponent = () => {
        throw new Error('Test rendering error');
      };

      const sessionData = {
        id: 'test-session',
        title: 'Test Session',
        speaker: {},
        speakerInfo: '',
        speakers: []
      };

      render(
        <SessionErrorBoundary sessionData={sessionData}>
          <ThrowingComponent />
        </SessionErrorBoundary>
      );

      // Should have logged error with context
      expect(mockConsoleError).toHaveBeenCalledWith(
        '🚨 SessionErrorBoundary caught an error:',
        expect.objectContaining({
          error: 'Test rendering error',
          sessionData: expect.objectContaining({
            id: 'test-session',
            title: 'Test Session'
          })
        })
      );
    });

    it('Test 13: Should recover when valid data is provided after error', () => {
      const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error('Test rendering error');
        }
        return <div>Valid Component</div>;
      };

      const sessionData = {
        id: 'test-session',
        title: 'Test Session',
        speaker: 'Valid Speaker',
        speakerInfo: '',
        speakers: []
      };

      const { rerender } = render(
        <SessionErrorBoundary sessionData={sessionData}>
          <ThrowingComponent shouldThrow={true} />
        </SessionErrorBoundary>
      );

      // Should show error state
      expect(screen.getByText('Session Display Issue')).toBeInTheDocument();

      // Rerender with valid component
      rerender(
        <SessionErrorBoundary sessionData={sessionData}>
          <ThrowingComponent shouldThrow={false} />
        </SessionErrorBoundary>
      );

      // Should show valid component
      expect(screen.getByText('Valid Component')).toBeInTheDocument();
      expect(screen.queryByText('Session Display Issue')).not.toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('Should allow retry after error', () => {
      const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error('Test rendering error');
        }
        return <div>Recovered Component</div>;
      };

      const sessionData = {
        id: 'test-session',
        title: 'Test Session',
        speaker: {},
        speakerInfo: '',
        speakers: []
      };

      const { rerender } = render(
        <SessionErrorBoundary sessionData={sessionData}>
          <ThrowingComponent shouldThrow={true} />
        </SessionErrorBoundary>
      );

      // Should show error state
      expect(screen.getByText('Session Display Issue')).toBeInTheDocument();

      // Click retry button
      fireEvent.click(screen.getByText('Try Again'));

      // Rerender with non-throwing component
      rerender(
        <SessionErrorBoundary sessionData={sessionData}>
          <ThrowingComponent shouldThrow={false} />
        </SessionErrorBoundary>
      );

      // Should show recovered component
      expect(screen.getByText('Recovered Component')).toBeInTheDocument();
    });

    it('Should call onError callback when provided', () => {
      const mockOnError = vi.fn();
      const ThrowingComponent = () => {
        throw new Error('Test rendering error');
      };

      const sessionData = {
        id: 'test-session',
        title: 'Test Session',
        speaker: {},
        speakerInfo: '',
        speakers: []
      };

      render(
        <SessionErrorBoundary sessionData={sessionData} onError={mockOnError}>
          <ThrowingComponent />
        </SessionErrorBoundary>
      );

      // Should show report issue button
      expect(screen.getByText('Report Issue')).toBeInTheDocument();

      // Click report issue button
      fireEvent.click(screen.getByText('Report Issue'));

      // Should have called onError callback
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test rendering error'
        }),
        expect.any(Object)
      );
    });
  });

  describe('Development Mode Features', () => {
    it('Should show debug information in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const ThrowingComponent = () => {
        throw new Error('Test rendering error');
      };

      const sessionData = {
        id: 'test-session',
        title: 'Test Session',
        speaker: {},
        speakerInfo: '',
        speakers: []
      };

      render(
        <SessionErrorBoundary sessionData={sessionData}>
          <ThrowingComponent />
        </SessionErrorBoundary>
      );

      // Should show debug information
      expect(screen.getByText('Debug Information')).toBeInTheDocument();

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Normal Operation', () => {
    it('Should render children normally when no error occurs', () => {
      const sessionData = {
        id: 'test-session',
        title: 'Test Session',
        speaker: 'Valid Speaker',
        speakerInfo: '',
        speakers: []
      };

      render(
        <SessionErrorBoundary sessionData={sessionData}>
          <div>Normal Component</div>
        </SessionErrorBoundary>
      );

      // Should render children normally
      expect(screen.getByText('Normal Component')).toBeInTheDocument();
      expect(screen.queryByText('Session Display Issue')).not.toBeInTheDocument();
    });

    it('Should handle missing sessionData gracefully', () => {
      render(
        <SessionErrorBoundary>
          <div>Normal Component</div>
        </SessionErrorBoundary>
      );

      // Should render children normally
      expect(screen.getByText('Normal Component')).toBeInTheDocument();
    });
  });
});
