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

  // Debounced validation
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

  // Validate state when it changes
  useEffect(() => {
    debouncedValidate(state);
  }, [state, debouncedValidate]);

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

  const updateState = useCallback((updates: Partial<T>) => {
    setState(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  const resetState = useCallback(() => {
    setState(initialState);
    setIsDirty(false);
    setError(null);
    setValidationResult(true);
  }, [initialState]);

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
    setState,
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
