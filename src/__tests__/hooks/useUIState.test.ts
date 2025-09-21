/**
 * Tests for useUIState Hook
 * Story 2.1f3: UI State Management Hook
 */

import { renderHook, act } from '@testing-library/react';
import { useUIState } from '../../hooks/useUIState';
import { vi } from 'vitest';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('useUIState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useUIState({ count: 0 }));

    expect(result.current.state).toEqual({ count: 0 });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isValid).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should update state correctly', () => {
    const { result } = renderHook(() => useUIState({ count: 0 }));

    act(() => {
      result.current.setState({ count: 5 });
    });

    expect(result.current.state).toEqual({ count: 5 });
    expect(result.current.isDirty).toBe(true);
  });

  it('should update state with function', () => {
    const { result } = renderHook(() => useUIState({ count: 0 }));

    act(() => {
      result.current.setState(prev => ({ count: prev.count + 1 }));
    });

    expect(result.current.state).toEqual({ count: 1 });
    expect(result.current.isDirty).toBe(true);
  });

  it('should update partial state', () => {
    const { result } = renderHook(() => useUIState({ count: 0, name: 'test' }));

    act(() => {
      result.current.updateState({ count: 5 });
    });

    expect(result.current.state).toEqual({ count: 5, name: 'test' });
    expect(result.current.isDirty).toBe(true);
  });

  it('should reset state', () => {
    const { result } = renderHook(() => useUIState({ count: 0 }));

    act(() => {
      result.current.setState({ count: 5 });
    });

    expect(result.current.state).toEqual({ count: 5 });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.resetState();
    });

    expect(result.current.state).toEqual({ count: 0 });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should validate state correctly with immediate feedback', () => {
    const validate = (state: { count: number }) => {
      if (state.count < 0) return 'Count must be positive';
      if (state.count > 10) return 'Count must be less than 10';
      return true;
    };

    const { result } = renderHook(() => useUIState({ count: 0 }, { validate, debounceMs: 0 }));

    act(() => {
      result.current.setState({ count: -1 });
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toBe('Count must be positive');

    act(() => {
      result.current.setState({ count: 5 });
    });

    expect(result.current.isValid).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should persist state to localStorage', () => {
    const { result } = renderHook(() => 
      useUIState({ count: 0 }, { persist: true, storageKey: 'test-key' })
    );

    act(() => {
      result.current.setState({ count: 5 });
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify({ count: 5 }));
  });

  it('should load state from localStorage on initialization', () => {
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ count: 10 }));

    const { result } = renderHook(() => 
      useUIState({ count: 0 }, { persist: true, storageKey: 'test-key' })
    );

    expect(result.current.state).toEqual({ count: 10 });
  });

  it('should handle localStorage errors gracefully', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const { result } = renderHook(() => 
      useUIState({ count: 0 }, { persist: true, storageKey: 'test-key' })
    );

    expect(result.current.state).toEqual({ count: 0 });
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useUIState({ count: 0 }));

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should debounce validation for rapid state changes', async () => {
    const validate = (state: { count: number }) => {
      // Simple validation that always passes
      return state.count >= 0;
    };
    
    const { result } = renderHook(() => 
      useUIState({ count: 0 }, { validate, debounceMs: 100 })
    );

    // Rapid state changes
    act(() => {
      result.current.setState({ count: 1 });
      result.current.setState({ count: 2 });
      result.current.setState({ count: 3 });
    });

    // State should be updated immediately
    expect(result.current.state.count).toBe(3);
    expect(result.current.isDirty).toBe(true);

    // Wait for debounced validation to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Final validation state should be correct
    expect(result.current.isValid).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
