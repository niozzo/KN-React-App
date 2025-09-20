/**
 * Toggle State Hook
 * Story 2.1f3: UI State Management Hook
 * 
 * Specialized hook for toggle state management with persistence
 */

import { useState, useCallback, useEffect } from 'react';

export const useToggleState = (
  initialValue: boolean = false,
  options: {
    persist?: boolean;
    storageKey?: string;
    onToggle?: (value: boolean) => void;
  } = {}
) => {
  const { persist = false, storageKey, onToggle } = options;

  const [state, setState] = useState<boolean>(() => {
    if (persist && storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : initialValue;
      } catch {
        return initialValue;
      }
    }
    return initialValue;
  });

  const toggle = useCallback(() => {
    setState(prev => {
      const newValue = !prev;
      onToggle?.(newValue);
      return newValue;
    });
  }, [onToggle]);

  const setValue = useCallback((value: boolean) => {
    setState(value);
    onToggle?.(value);
  }, [onToggle]);

  // Persist to localStorage
  useEffect(() => {
    if (persist && storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to persist toggle state:', error);
      }
    }
  }, [state, persist, storageKey]);

  return {
    value: state,
    toggle,
    setValue,
    isOn: state,
    isOff: !state
  };
};
