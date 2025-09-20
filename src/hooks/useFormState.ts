/**
 * Form State Hook
 * Story 2.1f3: UI State Management Hook
 * 
 * Specialized hook for form state management with validation
 */

import { useState, useCallback, useMemo } from 'react';

export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export const useFormState = <T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: Record<keyof T, (value: any) => string | null>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field
    if (validationSchema?.[field]) {
      const error = validationSchema[field](value);
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }
  }, [validationSchema]);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
    setTouched(prev => ({ ...prev, ...Object.keys(newValues).reduce((acc, key) => ({ ...acc, [key]: true }), {}) }));
  }, []);

  const validateField = useCallback((field: keyof T) => {
    if (validationSchema?.[field]) {
      const error = validationSchema[field](values[field]);
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
      return !error;
    }
    return true;
  }, [values, validationSchema]);

  const validateForm = useCallback(() => {
    if (!validationSchema) return true;
    
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationSchema).forEach(field => {
      const error = validationSchema[field as keyof T](values[field as keyof T]);
      if (error) {
        newErrors[field as keyof T] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationSchema]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const isDirty = useMemo(() => {
    return Object.keys(values).some(key => 
      values[key as keyof T] !== initialValues[key as keyof T]
    );
  }, [values, initialValues]);

  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error);
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    setValue,
    setValues,
    validateField,
    validateForm,
    resetForm,
    setIsSubmitting
  };
};
