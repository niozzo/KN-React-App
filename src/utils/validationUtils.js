/**
 * Validation Utilities
 * Comprehensive input validation functions for forms and components
 * Story 2.1f: Enhanced Input Validation
 */

/**
 * Validation result object
 */
export const createValidationResult = (isValid, message = '') => ({
  isValid,
  message,
  timestamp: new Date().toISOString()
});

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  // Email validation
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Phone number (US format)
  PHONE: /^\(\d{3}\)\s\d{3}-\d{4}$/,
  
  // Passcode (6 digits)
  PASSCODE: /^\d{6}$/,
  
  // Access code (6 characters alphanumeric)
  ACCESS_CODE: /^[A-Z0-9]{6}$/,
  
  // Name (letters, spaces, hyphens, apostrophes)
  NAME: /^[a-zA-Z\s\-']+$/,
  
  // Title (letters, numbers, spaces, basic punctuation)
  TITLE: /^[a-zA-Z0-9\s\-'.,!?()]+$/,
  
  // URL validation
  URL: /^https?:\/\/.+/,
  
  // Date time local format (YYYY-MM-DDTHH:MM)
  DATETIME_LOCAL: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
};

/**
 * Validation rules
 */
export const ValidationRules = {
  // Required field validation
  required: (value, fieldName = 'Field') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return createValidationResult(false, `${fieldName} is required`);
    }
    return createValidationResult(true);
  },

  // Minimum length validation
  minLength: (value, minLength, fieldName = 'Field') => {
    if (value && value.length < minLength) {
      return createValidationResult(false, `${fieldName} must be at least ${minLength} characters`);
    }
    return createValidationResult(true);
  },

  // Maximum length validation
  maxLength: (value, maxLength, fieldName = 'Field') => {
    if (value && value.length > maxLength) {
      return createValidationResult(false, `${fieldName} must be no more than ${maxLength} characters`);
    }
    return createValidationResult(true);
  },

  // Pattern validation
  pattern: (value, pattern, message, fieldName = 'Field') => {
    if (value && !pattern.test(value)) {
      return createValidationResult(false, message || `${fieldName} format is invalid`);
    }
    return createValidationResult(true);
  },

  // Email validation
  email: (value, fieldName = 'Email') => {
    if (value && !ValidationPatterns.EMAIL.test(value)) {
      return createValidationResult(false, `${fieldName} format is invalid`);
    }
    return createValidationResult(true);
  },

  // Phone validation
  phone: (value, fieldName = 'Phone') => {
    if (value && !ValidationPatterns.PHONE.test(value)) {
      return createValidationResult(false, `${fieldName} format is invalid. Use (XXX) XXX-XXXX`);
    }
    return createValidationResult(true);
  },

  // Passcode validation
  passcode: (value, fieldName = 'Passcode') => {
    if (value && !ValidationPatterns.PASSCODE.test(value)) {
      return createValidationResult(false, `${fieldName} must be 6 digits`);
    }
    return createValidationResult(true);
  },

  // Access code validation
  accessCode: (value, fieldName = 'Access Code') => {
    if (value && !ValidationPatterns.ACCESS_CODE.test(value)) {
      return createValidationResult(false, `${fieldName} must be 6 characters (letters and numbers)`);
    }
    return createValidationResult(true);
  },

  // Name validation
  name: (value, fieldName = 'Name') => {
    if (value && !ValidationPatterns.NAME.test(value)) {
      return createValidationResult(false, `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
    }
    return createValidationResult(true);
  },

  // Title validation
  title: (value, fieldName = 'Title') => {
    if (value && !ValidationPatterns.TITLE.test(value)) {
      return createValidationResult(false, `${fieldName} contains invalid characters`);
    }
    return createValidationResult(true);
  },

  // URL validation
  url: (value, fieldName = 'URL') => {
    if (value && !ValidationPatterns.URL.test(value)) {
      return createValidationResult(false, `${fieldName} must be a valid URL starting with http:// or https://`);
    }
    return createValidationResult(true);
  },

  // Date validation
  date: (value, fieldName = 'Date') => {
    if (value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return createValidationResult(false, `${fieldName} must be a valid date`);
      }
    }
    return createValidationResult(true);
  },

  // DateTime local validation
  dateTimeLocal: (value, fieldName = 'Date & Time') => {
    if (value && !ValidationPatterns.DATETIME_LOCAL.test(value)) {
      return createValidationResult(false, `${fieldName} format is invalid`);
    }
    return createValidationResult(true);
  },

  // Number validation
  number: (value, fieldName = 'Number') => {
    if (value && isNaN(Number(value))) {
      return createValidationResult(false, `${fieldName} must be a valid number`);
    }
    return createValidationResult(true);
  },

  // Range validation
  range: (value, min, max, fieldName = 'Value') => {
    const numValue = Number(value);
    if (value && (numValue < min || numValue > max)) {
      return createValidationResult(false, `${fieldName} must be between ${min} and ${max}`);
    }
    return createValidationResult(true);
  },

  // Custom validation function
  custom: (value, validator, fieldName = 'Field') => {
    try {
      const result = validator(value);
      if (typeof result === 'boolean') {
        return createValidationResult(result, result ? '' : `${fieldName} is invalid`);
      }
      if (typeof result === 'string') {
        return createValidationResult(false, result);
      }
      if (result && typeof result === 'object' && 'isValid' in result) {
        return result;
      }
      return createValidationResult(true);
    } catch (error) {
      return createValidationResult(false, `Validation error: ${error.message}`);
    }
  }
};

/**
 * Validate multiple fields
 */
export const validateFields = (fields, rules) => {
  const results = {};
  let isValid = true;

  for (const [fieldName, value] of Object.entries(fields)) {
    const fieldRules = rules[fieldName] || [];
    const fieldResults = [];

    for (const rule of fieldRules) {
      let result;
      if (typeof rule === 'function') {
        result = rule(value, fieldName);
      } else if (typeof rule === 'object' && rule.validator) {
        result = rule.validator(value, fieldName);
      } else {
        continue;
      }

      fieldResults.push(result);
      if (!result.isValid) {
        isValid = false;
        break; // Stop at first error for this field
      }
    }

    results[fieldName] = {
      isValid: fieldResults.every(r => r.isValid),
      errors: fieldResults.filter(r => !r.isValid).map(r => r.message),
      firstError: fieldResults.find(r => !r.isValid)?.message || ''
    };
  }

  return {
    isValid,
    fields: results,
    hasErrors: Object.values(results).some(field => !field.isValid)
  };
};

/**
 * Real-time validation with debouncing
 */
export const createDebouncedValidator = (validator, delay = 300) => {
  let timeoutId;
  
  return (value, callback) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validator(value);
      callback(result);
    }, delay);
  };
};

/**
 * Form validation hook
 */
export const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const [isValid, setIsValid] = React.useState(false);

  // Validate all fields
  const validateAll = React.useCallback(() => {
    const validation = validateFields(values, validationRules);
    setErrors(validation.fields);
    setIsValid(validation.isValid);
    return validation;
  }, [values, validationRules]);

  // Validate single field
  const validateField = React.useCallback((fieldName, value) => {
    const fieldRules = validationRules[fieldName] || [];
    const fieldResults = [];

    for (const rule of fieldRules) {
      let result;
      if (typeof rule === 'function') {
        result = rule(value, fieldName);
      } else if (typeof rule === 'object' && rule.validator) {
        result = rule.validator(value, fieldName);
      } else {
        continue;
      }

      fieldResults.push(result);
      if (!result.isValid) {
        break;
      }
    }

    const fieldValidation = {
      isValid: fieldResults.every(r => r.isValid),
      errors: fieldResults.filter(r => !r.isValid).map(r => r.message),
      firstError: fieldResults.find(r => !r.isValid)?.message || ''
    };

    setErrors(prev => ({
      ...prev,
      [fieldName]: fieldValidation
    }));

    return fieldValidation;
  }, [validationRules]);

  // Update field value
  const setValue = React.useCallback((fieldName, value) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Validate field if it's been touched
    if (touched[fieldName]) {
      validateField(fieldName, value);
    }
  }, [touched, validateField]);

  // Mark field as touched
  const setTouchedField = React.useCallback((fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
    
    // Validate field when touched
    validateField(fieldName, values[fieldName]);
  }, [values, validateField]);

  // Reset form
  const reset = React.useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValid(false);
  }, [initialValues]);

  // Validate on mount and when values change
  React.useEffect(() => {
    validateAll();
  }, [validateAll]);

  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setTouchedField,
    validateField,
    validateAll,
    reset
  };
};

/**
 * Input validation component props
 */
export const createInputProps = (fieldName, validation, options = {}) => {
  const {
    showErrors = true,
    errorClassName = 'error',
    successClassName = 'success'
  } = options;

  const fieldError = validation.errors[fieldName];
  const hasError = fieldError && !fieldError.isValid;
  const hasSuccess = fieldError && fieldError.isValid;

  return {
    className: hasError ? errorClassName : hasSuccess ? successClassName : '',
    'data-invalid': hasError,
    'data-valid': hasSuccess,
    'aria-invalid': hasError,
    'aria-describedby': hasError ? `${fieldName}-error` : undefined
  };
};

/**
 * Error message component props
 */
export const createErrorProps = (fieldName, validation) => {
  const fieldError = validation.errors[fieldName];
  const hasError = fieldError && !fieldError.isValid;

  return {
    id: `${fieldName}-error`,
    className: 'error-message',
    'aria-live': 'polite',
    style: {
      display: hasError ? 'block' : 'none',
      color: '#dc2626',
      fontSize: '0.875rem',
      marginTop: '0.25rem'
    }
  };
};

export default {
  ValidationPatterns,
  ValidationRules,
  validateFields,
  createDebouncedValidator,
  useFormValidation,
  createInputProps,
  createErrorProps,
  createValidationResult
};
