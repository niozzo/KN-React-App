/**
 * Tests for useLazyImage Hook
 * Lazy loading images using Intersection Observer API
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLazyImage } from '../../hooks/useLazyImage';
import React from 'react';

describe('useLazyImage', () => {
  let mockIntersectionObserver: any;
  let mockObserve: any;
  let mockDisconnect: any;
  let mockUnobserve: any;
  let intersectionCallback: any;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create mock functions
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();
    mockUnobserve = vi.fn();

    // Mock IntersectionObserver
    mockIntersectionObserver = vi.fn((callback, options) => {
      intersectionCallback = callback;
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: mockUnobserve,
        root: null,
        rootMargin: options?.rootMargin || '0px',
        thresholds: [options?.threshold || 0],
        takeRecords: () => [],
      };
    });

    // Set up global IntersectionObserver
    global.IntersectionObserver = mockIntersectionObserver as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useLazyImage());

      expect(result.current.ref).toBeDefined();
      expect(result.current.isVisible).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasLoaded).toBe(false);
      expect(result.current.onLoad).toBeInstanceOf(Function);
    });

    it('should create IntersectionObserver with default options', () => {
      renderHook(() => {
        const hook = useLazyImage();
        const element = document.createElement('div');
        (hook.ref as any).current = element;
        return hook;
      });

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          rootMargin: '200px',
          threshold: 0.01
        })
      );
    });

    it('should create IntersectionObserver with custom options', () => {
      renderHook(() => {
        const hook = useLazyImage({
          rootMargin: '100px',
          threshold: 0.5
        });
        const element = document.createElement('div');
        (hook.ref as any).current = element;
        return hook;
      });

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          rootMargin: '100px',
          threshold: 0.5
        })
      );
    });
  });

  describe('Intersection Observer Behavior', () => {
    it('should set isVisible when element intersects', async () => {
      const { result } = renderHook(() => {
        const hook = useLazyImage();
        const element = document.createElement('div');
        (hook.ref as any).current = element;
        return hook;
      });

      // Simulate intersection
      act(() => {
        const element = document.createElement('div');
        intersectionCallback([
          {
            isIntersecting: true,
            target: element,
            intersectionRatio: 0.5
          }
        ]);
      });

      await waitFor(() => {
        expect(result.current.isVisible).toBe(true);
        expect(result.current.isLoading).toBe(true);
      });
    });

    it('should disconnect observer after element becomes visible', async () => {
      const { result } = renderHook(() => {
        const hook = useLazyImage();
        const element = document.createElement('div');
        (hook.ref as any).current = element;
        return hook;
      });

      // Simulate intersection
      act(() => {
        intersectionCallback([
          {
            isIntersecting: true,
            target: document.createElement('div')
          }
        ]);
      });

      await waitFor(() => {
        expect(mockDisconnect).toHaveBeenCalled();
      });
    });

    it('should not set isVisible when element does not intersect', () => {
      const { result } = renderHook(() => {
        const hook = useLazyImage();
        const element = document.createElement('div');
        (hook.ref as any).current = element;
        return hook;
      });

      // Simulate no intersection
      act(() => {
        intersectionCallback([
          {
            isIntersecting: false,
            target: document.createElement('div')
          }
        ]);
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should only trigger visibility once', async () => {
      const { result } = renderHook(() => {
        const hook = useLazyImage();
        const element = document.createElement('div');
        (hook.ref as any).current = element;
        return hook;
      });

      // First intersection
      act(() => {
        intersectionCallback([{ isIntersecting: true, target: document.createElement('div') }]);
      });

      await waitFor(() => {
        expect(result.current.isVisible).toBe(true);
      });

      const firstVisibleState = result.current.isVisible;

      // Try to trigger again (shouldn't change)
      act(() => {
        intersectionCallback([{ isIntersecting: true, target: document.createElement('div') }]);
      });

      expect(result.current.isVisible).toBe(firstVisibleState);
      // Disconnect should be called at least once (may be called in cleanup too)
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('onLoad callback', () => {
    it('should update hasLoaded state when onLoad is called', async () => {
      const { result } = renderHook(() => useLazyImage());

      expect(result.current.hasLoaded).toBe(false);

      act(() => {
        result.current.onLoad();
      });

      expect(result.current.hasLoaded).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle multiple onLoad calls gracefully', () => {
      const { result } = renderHook(() => useLazyImage());

      act(() => {
        result.current.onLoad();
        result.current.onLoad();
        result.current.onLoad();
      });

      expect(result.current.hasLoaded).toBe(true);
    });
  });

  describe('Fallback behavior', () => {
    it('should fallback to immediate loading when IntersectionObserver is not supported', async () => {
      // Remove IntersectionObserver
      const originalIO = global.IntersectionObserver;
      delete (global as any).IntersectionObserver;

      const { result } = renderHook(() => {
        const hook = useLazyImage({ fallbackToImmediate: true });
        const element = document.createElement('div');
        (hook.ref as any).current = element;
        return hook;
      });

      // Wait for useEffect to run and set visible
      await waitFor(() => {
        expect(result.current.isVisible).toBe(true);
      });

      // Restore
      global.IntersectionObserver = originalIO;
    });

    it('should not fallback when fallbackToImmediate is false', () => {
      const originalIO = global.IntersectionObserver;
      delete (global as any).IntersectionObserver;

      const { result } = renderHook(() =>
        useLazyImage({ fallbackToImmediate: false })
      );

      expect(result.current.isVisible).toBe(false);

      global.IntersectionObserver = originalIO;
    });

    it('should handle IntersectionObserver constructor errors gracefully', async () => {
      // Mock console.error to suppress error output
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Make IntersectionObserver throw an error
      global.IntersectionObserver = vi.fn(() => {
        throw new Error('IntersectionObserver error');
      }) as any;

      const { result } = renderHook(() => {
        const hook = useLazyImage({ fallbackToImmediate: true });
        const element = document.createElement('div');
        (hook.ref as any).current = element;
        return hook;
      });

      // Should fallback to immediate loading
      expect(result.current.isVisible).toBe(true);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should disconnect observer on unmount', () => {
      const { unmount } = renderHook(() => {
        const hook = useLazyImage();
        const element = document.createElement('div');
        (hook.ref as any).current = element;
        return hook;
      });

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should handle unmount before ref is attached', () => {
      const { unmount } = renderHook(() => useLazyImage());

      // Should not throw error
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Loading states', () => {
    it('should track loading state correctly during image lifecycle', async () => {
      const { result } = renderHook(() => {
        const hook = useLazyImage();
        const element = document.createElement('div');
        (hook.ref as any).current = element;
        return hook;
      });

      // Initial state
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasLoaded).toBe(false);

      // Simulate intersection
      act(() => {
        intersectionCallback([{ isIntersecting: true, target: document.createElement('div') }]);
      });

      // Loading state
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        expect(result.current.hasLoaded).toBe(false);
      });

      // Image loaded
      act(() => {
        result.current.onLoad();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasLoaded).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid ref changes', () => {
      const { result } = renderHook(() => useLazyImage());

      for (let i = 0; i < 10; i++) {
        const element = document.createElement('div');
        (result.current.ref as any).current = element;
      }

      // Should not crash
      expect(result.current.isVisible).toBe(false);
    });
  });
});
