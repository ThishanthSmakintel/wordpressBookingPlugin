export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizeLogInput = (input: string): string => {
  return input.replace(/[\r\n\t]/g, ' ').substring(0, 100);
};

export const generateStrongId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `APT-${new Date().getFullYear()}-${timestamp}-${random}`.toUpperCase();
};

export const formatDateTime = (date: string, time: string): string => {
  return `${date} ${time}:00`;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/[\s\-\(\)]/g, '');
};