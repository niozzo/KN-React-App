/**
 * UI State Management Hook
 * Story 2.1f3: UI State Management Hook
 * 
 * Reusable hook for UI state management with validation and persistence
 */

import { useState, useCallback, useMemo, useEffect } from 'react';

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export interface UIStateOptions<T> {
  initialValue?: T;
  validate?: (state: T) => boolean | string;
  persist?: boolean;
  storageKey?: string;
  debounceMs?: number;
}

export interface UIStateResult<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  updateState: (updates: Partial<T>) => void;
  resetState: () => void;
  validateState: () => boolean | string;
  isDirty: boolean;
  isValid: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useUIState = <T>(
  initialState: T,
  options: UIStateOptions<T> = {}
): UIStateResult<T> => {
  const {
    validate,
    persist = false,
    storageKey,
    debounceMs = 300
  } = options;

  const [state, setState] = useState<T>(() => {
    if (persist && storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : initialState;
      } catch {
        return initialState;
      }
    }
    return initialState;
  });

  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<boolean | string>(true);

  // Track if state change was user-initiated to avoid double validation
  const [isUserInitiated, setIsUserInitiated] = useState(false);

  // Debounced validation for system-initiated state changes
  const debouncedValidate = useMemo(
    () => debounce((currentState: T) => {
      if (validate) {
        const result = validate(currentState);
        setValidationResult(result);
        if (typeof result === 'string') {
          setError(result);
        } else if (result === false) {
          setError('Validation failed');
        } else {
          setError(null);
        }
      }
    }, debounceMs),
    [validate, debounceMs]
  );

  // Validate state when it changes (only for system-initiated changes)
  useEffect(() => {
    if (!isUserInitiated) {
      debouncedValidate(state);
    }
    setIsUserInitiated(false); // Reset flag
  }, [state, debouncedValidate, isUserInitiated]);

  // Persist state to localStorage
  useEffect(() => {
    if (persist && storageKey && isDirty) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to persist state:', error);
      }
    }
  }, [state, persist, storageKey, isDirty]);

  const setStateWithDirty = useCallback((newState: T | ((prev: T) => T)) => {
    setIsUserInitiated(true); // Mark as user-initiated to skip debounced validation
    setState(prev => {
      const newValue = typeof newState === 'function' ? (newState as (prev: T) => T)(prev) : newState;
      // Always trigger immediate validation for user-initiated setState calls
      if (validate) {
        const result = validate(newValue);
        setValidationResult(result);
        if (typeof result === 'string') {
          setError(result);
        } else if (result === false) {
          setError('Validation failed');
        } else {
          setError(null);
        }
      }
      return newValue;
    });
    setIsDirty(true);
  }, [validate, setState]);

  const updateState = useCallback((updates: Partial<T>) => {
    setStateWithDirty(prev => ({ ...prev, ...updates }));
  }, [setStateWithDirty]);

  const resetState = useCallback(() => {
    setState(initialState);
    setIsDirty(false);
    setError(null);
    setValidationResult(true);
  }, [initialState, setState]);

  const validateState = useCallback(() => {
    if (validate) {
      const result = validate(state);
      setValidationResult(result);
      return result;
    }
    return true;
  }, [state, validate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isValid = validationResult === true;

  return {
    state,
    setState: setStateWithDirty,
    updateState,
    resetState,
    validateState,
    isDirty,
    isValid,
    error,
    setError,
    clearError
  };
};
