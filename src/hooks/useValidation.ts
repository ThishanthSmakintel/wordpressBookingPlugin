import { useState, useCallback } from 'react';

interface ValidationRules {
  required?: boolean;
  email?: boolean;
  phone?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface ValidationSchema {
  [key: string]: ValidationRules;
}

export const useValidation = (schema: ValidationSchema) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: string, value: string): string | null => {
    const rules = schema[field];
    if (!rules) return null;

    if (rules.required && !value.trim()) {
      return `${field} is required`;
    }

    if (value && rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Invalid email format';
    }

    if (value && rules.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/\s/g, ''))) {
      return 'Invalid phone format';
    }

    if (value && rules.minLength && value.length < rules.minLength) {
      return `Minimum ${rules.minLength} characters required`;
    }

    if (value && rules.maxLength && value.length > rules.maxLength) {
      return `Maximum ${rules.maxLength} characters allowed`;
    }

    if (value && rules.pattern && !rules.pattern.test(value)) {
      return 'Invalid format';
    }

    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, [schema]);

  const validateForm = useCallback((data: Record<string, string>) => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(schema).forEach(field => {
      const error = validateField(field, data[field] || '');
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [schema, validateField]);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearError,
    setErrors
  };
};