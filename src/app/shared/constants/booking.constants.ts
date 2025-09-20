export const BOOKING_STEPS = {
  TIME_SYNC: 0,
  SERVICE_SELECTION: 1,
  STAFF_SELECTION: 2,
  DATE_SELECTION: 3,
  TIME_SELECTION: 4,
  CUSTOMER_INFO: 5,
  CONFIRMATION: 6,
  SUCCESS: 7,
  CANCELLED: 8,
  RESCHEDULED: 9,
} as const;

export const APPOINTMENT_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
  CREATED: 'created',
} as const;

export const UI_COLORS = {
  PRIMARY: '#5344F4',
  SUCCESS: '#10b981',
  DANGER: '#dc3545',
  WARNING: '#ffc107',
  INFO: '#3b82f6',
  ACCENT: '#1CBC9B',
} as const;

export const BUSINESS_CONFIG = {
  HOURS: {
    START: '09:00',
    END: '17:00',
  },
  CLOSED_DAYS: [0, 6], // Sunday and Saturday
  SLOT_DURATION: 30, // minutes
  MAX_ADVANCE_DAYS: 30,
} as const;

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00'
] as const;