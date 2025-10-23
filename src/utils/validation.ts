/**
 * Comprehensive validation utilities for AppointEase
 */

// Validation rules
export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z\s\-\.]+$/,
    MESSAGE: 'Name must contain only letters, spaces, hyphens, and dots'
  },
  EMAIL: {
    MAX_LENGTH: 100,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address'
  },
  PHONE: {
    MIN_DIGITS: 10,
    MAX_DIGITS: 15,
    PATTERN: /^[\d\s\-\+\(\)]+$/,
    MESSAGE: 'Phone must be 10-15 digits'
  },
  OTP: {
    LENGTH: 6,
    PATTERN: /^\d{6}$/,
    MESSAGE: 'OTP must be 6 digits'
  }
};

/**
 * Sanitize and trim string input
 */
export const sanitizeString = (value: string): string => {
  if (!value) return '';
  return value.trim().replace(/\s+/g, ' ');
};

/**
 * Validate name field
 */
export const validateName = (name: string): { valid: boolean; error?: string } => {
  const trimmed = sanitizeString(name);
  
  if (!trimmed) {
    return { valid: false, error: 'Name is required' };
  }
  
  if (trimmed.length < VALIDATION_RULES.NAME.MIN_LENGTH) {
    return { valid: false, error: `Name must be at least ${VALIDATION_RULES.NAME.MIN_LENGTH} characters` };
  }
  
  if (trimmed.length > VALIDATION_RULES.NAME.MAX_LENGTH) {
    return { valid: false, error: `Name must not exceed ${VALIDATION_RULES.NAME.MAX_LENGTH} characters` };
  }
  
  if (!VALIDATION_RULES.NAME.PATTERN.test(trimmed)) {
    return { valid: false, error: VALIDATION_RULES.NAME.MESSAGE };
  }
  
  return { valid: true };
};

/**
 * Validate email field
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  const trimmed = sanitizeString(email);
  
  if (!trimmed) {
    return { valid: false, error: 'Email is required' };
  }
  
  if (trimmed.length > VALIDATION_RULES.EMAIL.MAX_LENGTH) {
    return { valid: false, error: `Email must not exceed ${VALIDATION_RULES.EMAIL.MAX_LENGTH} characters` };
  }
  
  if (!VALIDATION_RULES.EMAIL.PATTERN.test(trimmed)) {
    return { valid: false, error: VALIDATION_RULES.EMAIL.MESSAGE };
  }
  
  return { valid: true };
};

/**
 * Validate and format phone number
 */
export const validatePhone = (phone: string): { valid: boolean; error?: string; formatted?: string } => {
  if (!phone) {
    return { valid: true }; // Phone is optional
  }
  
  const trimmed = sanitizeString(phone);
  const digitsOnly = trimmed.replace(/\D/g, '');
  
  if (digitsOnly.length < VALIDATION_RULES.PHONE.MIN_DIGITS) {
    return { valid: false, error: `Phone must have at least ${VALIDATION_RULES.PHONE.MIN_DIGITS} digits` };
  }
  
  if (digitsOnly.length > VALIDATION_RULES.PHONE.MAX_DIGITS) {
    return { valid: false, error: `Phone must not exceed ${VALIDATION_RULES.PHONE.MAX_DIGITS} digits` };
  }
  
  // Format as (XXX) XXX-XXXX for US numbers
  let formatted = trimmed;
  if (digitsOnly.length === 10) {
    formatted = digitsOnly.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
  
  return { valid: true, formatted };
};

/**
 * Validate OTP code
 */
export const validateOTP = (otp: string): { valid: boolean; error?: string } => {
  const trimmed = otp.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'OTP is required' };
  }
  
  if (!VALIDATION_RULES.OTP.PATTERN.test(trimmed)) {
    return { valid: false, error: VALIDATION_RULES.OTP.MESSAGE };
  }
  
  return { valid: true };
};

/**
 * Validate date (must be future date)
 */
export const validateDate = (date: string): { valid: boolean; error?: string } => {
  if (!date) {
    return { valid: false, error: 'Date is required' };
  }
  
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    return { valid: false, error: 'Date must be in the future' };
  }
  
  return { valid: true };
};

/**
 * Validate time slot
 */
export const validateTime = (time: string): { valid: boolean; error?: string } => {
  if (!time) {
    return { valid: false, error: 'Time is required' };
  }
  
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timePattern.test(time)) {
    return { valid: false, error: 'Invalid time format' };
  }
  
  return { valid: true };
};

/**
 * Comprehensive form validation
 */
export const validateBookingForm = (formData: {
  firstName?: string;
  email?: string;
  phone?: string;
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Validate name
  const nameValidation = validateName(formData.firstName || '');
  if (!nameValidation.valid) {
    errors.firstName = nameValidation.error!;
  }
  
  // Validate email
  const emailValidation = validateEmail(formData.email || '');
  if (!emailValidation.valid) {
    errors.email = emailValidation.error!;
  }
  
  // Validate phone (optional)
  if (formData.phone) {
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.valid) {
      errors.phone = phoneValidation.error!;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitize form data before submission
 */
export const sanitizeFormData = (formData: {
  firstName?: string;
  email?: string;
  phone?: string;
}): { firstName: string; email: string; phone: string } => {
  return {
    firstName: sanitizeString(formData.firstName || ''),
    email: sanitizeString(formData.email || '').toLowerCase(),
    phone: sanitizeString(formData.phone || '')
  };
};
