export const STEPS = {
  SERVICE: 1,
  EMPLOYEE: 2,
  DATE: 3,
  TIME: 4,
  INFO: 5,
  SUCCESS: 6,
  CANCELLED: 7,
  RESCHEDULED: 8,
} as const;

export const APPOINTMENT_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
  CREATED: 'created',
} as const;

export const COLORS = {
  PRIMARY: '#5344F4',
  SUCCESS: '#10b981',
  DANGER: '#dc3545',
  WARNING: '#ffc107',
  INFO: '#3b82f6',
} as const;

export const BUSINESS_HOURS = {
  start: '09:00',
  end: '17:00',
  closedDays: [0, 6], // Sunday and Saturday
} as const;

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00'
] as const;