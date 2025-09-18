export interface Service {
  id: number;
  name: string;
  price: number;
  duration?: number;
  description?: string;
}

export interface Employee {
  id: number;
  name: string;
  avatar?: string;
  rating?: number;
  reviews?: number;
}

export interface Appointment {
  id: string;
  service: string;
  staff: string;
  date: string;
  status: 'confirmed' | 'cancelled' | 'rescheduled' | 'created';
  name: string;
  email: string;
}

export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  service?: string;
  employee?: string;
  date?: string;
  time?: string;
  general?: string;
}

export interface BookingState {
  step: number;
  selectedService: Service | null;
  selectedEmployee: Employee | null;
  selectedDate: string;
  selectedTime: string;
  formData: FormData;
  services: Service[];
  employees: Employee[];
  appointments: Appointment[];
  servicesLoading: boolean;
  employeesLoading: boolean;
  appointmentsLoading: boolean;
  isSubmitting: boolean;
  isOnline: boolean;
  errors: FormErrors;
}