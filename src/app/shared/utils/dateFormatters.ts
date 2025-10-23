import { format, parseISO, parse, isValid } from 'date-fns';

export const formatAppointmentDateTime = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '';
    const dateFormatted = format(date, 'EEEE, MMMM d, yyyy');
    const timeFormatted = format(date, 'h:mm a');
    return `${dateFormatted} at ${timeFormatted}`;
  } catch {
    return '';
  }
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'EEEE, MMMM d, yyyy') : '';
  } catch {
    return '';
  }
};

export const formatTime = (timeString: string) => {
  if (!timeString) return '';
  try {
    const date = parse(timeString, 'HH:mm', new Date());
    return isValid(date) ? format(date, 'h:mm a') : '';
  } catch {
    return '';
  }
};

export const formatDateForInput = (date: Date) => {
  return format(date, 'yyyy-MM-dd');
};

export const isDateInPast = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isValid(date) && date < today;
  } catch {
    return false;
  }
};