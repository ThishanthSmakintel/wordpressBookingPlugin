import { create } from 'zustand';
import { Service, Employee, Appointment, FormData, FormErrors } from '../types';

interface BookingState {
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
    apiLoading: boolean;
    apiError: string | null;
    
    setStep: (step: number) => void;
    setSelectedService: (service: Service | null) => void;
    setSelectedEmployee: (employee: Employee | null) => void;
    setSelectedDate: (date: string) => void;
    setSelectedTime: (time: string) => void;
    setFormData: (data: Partial<FormData>) => void;
    setServices: (services: Service[]) => void;
    setEmployees: (employees: Employee[]) => void;
    setAppointments: (appointments: Appointment[]) => void;
    setServicesLoading: (loading: boolean) => void;
    setEmployeesLoading: (loading: boolean) => void;
    setAppointmentsLoading: (loading: boolean) => void;
    setIsSubmitting: (submitting: boolean) => void;
    setIsOnline: (online: boolean) => void;
    setErrors: (errors: FormErrors) => void;
    setApiLoading: (loading: boolean) => void;
    setApiError: (error: string | null) => void;
    clearError: (field: string) => void;
    reset: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
    step: 1,
    selectedService: null,
    selectedEmployee: null,
    selectedDate: '',
    selectedTime: '',
    formData: { firstName: '', lastName: '', email: '', phone: '' },
    services: [],
    employees: [],
    appointments: [],
    servicesLoading: true,
    employeesLoading: true,
    appointmentsLoading: false,
    isSubmitting: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    errors: {},
    apiLoading: false,
    apiError: null,
    
    setStep: (step) => set({ step }),
    setSelectedService: (selectedService) => set({ selectedService }),
    setSelectedEmployee: (selectedEmployee) => set({ selectedEmployee }),
    setSelectedDate: (selectedDate) => set({ selectedDate }),
    setSelectedTime: (selectedTime) => set({ selectedTime }),
    setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
    setServices: (services) => set({ services }),
    setEmployees: (employees) => set({ employees }),
    setAppointments: (appointments) => set({ appointments }),
    setServicesLoading: (servicesLoading) => set({ servicesLoading }),
    setEmployeesLoading: (employeesLoading) => set({ employeesLoading }),
    setAppointmentsLoading: (appointmentsLoading) => set({ appointmentsLoading }),
    setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
    setIsOnline: (isOnline) => set({ isOnline }),
    setErrors: (errors) => set({ errors }),
    setApiLoading: (apiLoading) => set({ apiLoading }),
    setApiError: (apiError) => set({ apiError }),
    clearError: (field) => set((state) => {
        const newErrors = { ...state.errors };
        delete newErrors[field];
        return { errors: newErrors };
    }),
    reset: () => set({
        step: 1,
        selectedService: null,
        selectedEmployee: null,
        selectedDate: '',
        selectedTime: '',
        formData: { firstName: '', lastName: '', email: '', phone: '' },
        errors: {},
        apiError: null
    })
}));