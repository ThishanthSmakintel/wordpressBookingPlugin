/**
 * WordPress Data Store for AppointEase
 * Following @wordpress/data patterns
 */
import { createReduxStore, register } from '@wordpress/data';

interface AppointmentState {
    // Core booking flow
    step: number;
    selectedService: any | null;
    selectedEmployee: any | null;
    selectedDate: string;
    selectedTime: string;
    formData: Record<string, any>;
    
    // Data collections
    services: any[];
    employees: any[];
    appointments: any[];
    
    // Loading states
    servicesLoading: boolean;
    employeesLoading: boolean;
    appointmentsLoading: boolean;
    isSubmitting: boolean;
    
    // System state
    isOnline: boolean;
    errors: Record<string, string>;
    serverDate: string | null;
    unavailableSlots: string[] | 'all';
    bookingDetails: Record<string, any>;
    
    // Debug state
    showDebug: boolean;
    allBookings: any[];
    debugServices: any[];
    debugStaff: any[];
    workingDays: string[];
    debugTimeSlots: any[];
    availabilityData: any | null;
    currentTime: Date;
    timeSynced: boolean;
    connectionMode: string;
}

const DEFAULT_STATE: AppointmentState = {
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
    serverDate: null,
    unavailableSlots: [],
    bookingDetails: {},
    showDebug: localStorage.getItem('appointease_debug_mode') === 'true',
    allBookings: [],
    debugServices: [],
    debugStaff: [],
    workingDays: ['1', '2', '3', '4', '5'],
    debugTimeSlots: [],
    availabilityData: null,
    currentTime: new Date(),
    timeSynced: false,
    connectionMode: 'disconnected',
};

const actions = {
    setStep(step: number) { return { type: 'SET_STEP', step }; },
    setSelectedService(service: any) { return { type: 'SET_SELECTED_SERVICE', service }; },
    setSelectedEmployee(employee: any) { return { type: 'SET_SELECTED_EMPLOYEE', employee }; },
    setSelectedDate(date: string) { return { type: 'SET_SELECTED_DATE', date }; },
    setSelectedTime(time: string) { return { type: 'SET_SELECTED_TIME', time }; },
    setFormData(data: Record<string, any>) { return { type: 'SET_FORM_DATA', data }; },
    setServices(services: any[]) { return { type: 'SET_SERVICES', services }; },
    setEmployees(employees: any[]) { return { type: 'SET_EMPLOYEES', employees }; },
    setAppointments(appointments: any[]) { return { type: 'SET_APPOINTMENTS', appointments }; },
    setServicesLoading(loading: boolean) { return { type: 'SET_SERVICES_LOADING', loading }; },
    setEmployeesLoading(loading: boolean) { return { type: 'SET_EMPLOYEES_LOADING', loading }; },
    setAppointmentsLoading(loading: boolean) { return { type: 'SET_APPOINTMENTS_LOADING', loading }; },
    setIsSubmitting(submitting: boolean) { return { type: 'SET_IS_SUBMITTING', submitting }; },
    setIsOnline(online: boolean) { return { type: 'SET_IS_ONLINE', online }; },
    setErrors(errors: Record<string, string>) { return { type: 'SET_ERRORS', errors }; },
    setServerDate(date: string | null) { return { type: 'SET_SERVER_DATE', date }; },
    setUnavailableSlots(slots: string[] | 'all') { return { type: 'SET_UNAVAILABLE_SLOTS', slots }; },
    setBookingDetails(details: Record<string, any>) { return { type: 'SET_BOOKING_DETAILS', details }; },
    clearError(field: string) { return { type: 'CLEAR_ERROR', field }; },
    clearErrors() { return { type: 'CLEAR_ERRORS' }; },
    updateAppointmentStatus(appointmentId: string, status: string) {
        return { type: 'UPDATE_APPOINTMENT_STATUS', appointmentId, status };
    },
    reset() { return { type: 'RESET' }; },
    
    // Debug actions
    setShowDebug(show: boolean) { return { type: 'SET_SHOW_DEBUG', show }; },
    setAllBookings(bookings: any[]) { return { type: 'SET_ALL_BOOKINGS', bookings }; },
    setDebugServices(services: any[]) { return { type: 'SET_DEBUG_SERVICES', services }; },
    setDebugStaff(staff: any[]) { return { type: 'SET_DEBUG_STAFF', staff }; },
    setWorkingDays(days: string[]) { return { type: 'SET_WORKING_DAYS', days }; },
    setDebugTimeSlots(slots: any[]) { return { type: 'SET_DEBUG_TIME_SLOTS', slots }; },
    setAvailabilityData(data: any) { return { type: 'SET_AVAILABILITY_DATA', data }; },
    setCurrentTime(time: Date) { return { type: 'SET_CURRENT_TIME', time }; },
    setTimeSynced(synced: boolean) { return { type: 'SET_TIME_SYNCED', synced }; },
    setConnectionMode(mode: string) { return { type: 'SET_CONNECTION_MODE', mode }; },
    
    *fetchAppointments(email: string) {
        yield actions.setAppointmentsLoading(true);
        
        try {
            const response = yield {
                type: 'FETCH_FROM_API',
                path: '/appointease/v1/user-appointments',
                method: 'POST',
                data: { email },
            };
            
            yield actions.setAppointments(response.appointments || response);
        } catch (error) {
            yield actions.setErrors({ appointments: 'Failed to load appointments' });
        } finally {
            yield actions.setAppointmentsLoading(false);
        }
    },
    
    *cancelAppointment(appointmentId: string, email: string) {
        yield actions.setIsSubmitting(true);
        
        try {
            yield {
                type: 'FETCH_FROM_API',
                path: `/appointease/v1/appointments/${appointmentId}`,
                method: 'DELETE',
            };
            
            // Update local state immediately
            yield actions.updateAppointmentStatus(appointmentId, 'cancelled');
            
            // Refresh appointments list
            yield actions.fetchAppointments(email);
            
            return { success: true };
        } catch (error) {
            yield actions.setErrors({ cancel: 'Failed to cancel appointment' });
            return { success: false, error };
        } finally {
            yield actions.setIsSubmitting(false);
        }
    },
};

const selectors = {
    getStep(state: AppointmentState) { return state.step; },
    getSelectedService(state: AppointmentState) { return state.selectedService; },
    getSelectedEmployee(state: AppointmentState) { return state.selectedEmployee; },
    getSelectedDate(state: AppointmentState) { return state.selectedDate; },
    getSelectedTime(state: AppointmentState) { return state.selectedTime; },
    getFormData(state: AppointmentState) { return state.formData; },
    getServices(state: AppointmentState) { return state.services; },
    getEmployees(state: AppointmentState) { return state.employees; },
    getAppointments(state: AppointmentState) { return state.appointments; },
    getServicesLoading(state: AppointmentState) { return state.servicesLoading; },
    getEmployeesLoading(state: AppointmentState) { return state.employeesLoading; },
    getAppointmentsLoading(state: AppointmentState) { return state.appointmentsLoading; },
    getIsSubmitting(state: AppointmentState) { return state.isSubmitting; },
    getIsOnline(state: AppointmentState) { return state.isOnline; },
    getErrors(state: AppointmentState) { return state.errors; },
    getServerDate(state: AppointmentState) { return state.serverDate; },
    getUnavailableSlots(state: AppointmentState) { return state.unavailableSlots; },
    getBookingDetails(state: AppointmentState) { return state.bookingDetails; },
    getUpcomingAppointments(state: AppointmentState) {
        if (!state.appointments?.length) return [];
        const now = new Date();
        return state.appointments.filter(apt => {
            if (apt.status === 'cancelled') return false;
            const dateStr = apt.date || apt.appointment_date;
            if (!dateStr) return false;
            try {
                const aptDate = new Date(dateStr);
                return aptDate > now;
            } catch {
                return false;
            }
        });
    },
    
    // Debug selectors
    getShowDebug(state: AppointmentState) { return state.showDebug; },
    getAllBookings(state: AppointmentState) { return state.allBookings; },
    getDebugServices(state: AppointmentState) { return state.debugServices; },
    getDebugStaff(state: AppointmentState) { return state.debugStaff; },
    getWorkingDays(state: AppointmentState) { return state.workingDays; },
    getDebugTimeSlots(state: AppointmentState) { return state.debugTimeSlots; },
    getAvailabilityData(state: AppointmentState) { return state.availabilityData; },
    getCurrentTime(state: AppointmentState) { return state.currentTime; },
    getTimeSynced(state: AppointmentState) { return state.timeSynced; },
    getConnectionMode(state: AppointmentState) { return state.connectionMode; },
};

const reducer = (state = DEFAULT_STATE, action: any): AppointmentState => {
    switch (action.type) {
        case 'SET_STEP': return { ...state, step: action.step };
        case 'SET_SELECTED_SERVICE': return { ...state, selectedService: action.service };
        case 'SET_SELECTED_EMPLOYEE': return { ...state, selectedEmployee: action.employee };
        case 'SET_SELECTED_DATE': return { ...state, selectedDate: action.date };
        case 'SET_SELECTED_TIME': return { ...state, selectedTime: action.time };
        case 'SET_FORM_DATA': 

            return { ...state, formData: { ...state.formData, ...action.data } };
        case 'SET_SERVICES': return { ...state, services: action.services };
        case 'SET_EMPLOYEES': return { ...state, employees: action.employees };
        case 'SET_APPOINTMENTS': return { ...state, appointments: action.appointments };
        case 'SET_SERVICES_LOADING': return { ...state, servicesLoading: action.loading };
        case 'SET_EMPLOYEES_LOADING': return { ...state, employeesLoading: action.loading };
        case 'SET_APPOINTMENTS_LOADING': return { ...state, appointmentsLoading: action.loading };
        case 'SET_IS_SUBMITTING': return { ...state, isSubmitting: action.submitting };
        case 'SET_IS_ONLINE': return { ...state, isOnline: action.online };
        case 'SET_ERRORS': return { ...state, errors: action.errors };
        case 'SET_SERVER_DATE': return { ...state, serverDate: action.date };
        case 'SET_UNAVAILABLE_SLOTS': return { ...state, unavailableSlots: action.slots };
        case 'SET_BOOKING_DETAILS': return { ...state, bookingDetails: action.details };
        case 'CLEAR_ERROR':
            const { [action.field]: removed, ...remainingErrors } = state.errors;
            return { ...state, errors: remainingErrors };
        case 'CLEAR_ERRORS': return { ...state, errors: {} };
        case 'UPDATE_APPOINTMENT_STATUS':
            const appointmentIndex = state.appointments.findIndex(apt => 
                apt.id === action.appointmentId || apt.strong_id === action.appointmentId
            );
            if (appointmentIndex === -1) return state;
            
            const updatedAppointments = [...state.appointments];
            updatedAppointments[appointmentIndex] = {
                ...updatedAppointments[appointmentIndex],
                status: action.status
            };
            return { ...state, appointments: updatedAppointments };
        case 'RESET': return DEFAULT_STATE;
        
        // Debug reducers
        case 'SET_SHOW_DEBUG': return { ...state, showDebug: action.show };
        case 'SET_ALL_BOOKINGS': return { ...state, allBookings: action.bookings };
        case 'SET_DEBUG_SERVICES': return { ...state, debugServices: action.services };
        case 'SET_DEBUG_STAFF': return { ...state, debugStaff: action.staff };
        case 'SET_WORKING_DAYS': return { ...state, workingDays: action.days };
        case 'SET_DEBUG_TIME_SLOTS': return { ...state, debugTimeSlots: action.slots };
        case 'SET_AVAILABILITY_DATA': return { ...state, availabilityData: action.data };
        case 'SET_CURRENT_TIME': return { ...state, currentTime: action.time };
        case 'SET_TIME_SYNCED': return { ...state, timeSynced: action.synced };
        case 'SET_CONNECTION_MODE': return { ...state, connectionMode: action.mode };
        
        default: return state;
    }
};

const controls = {
    FETCH_FROM_API(action: any) {
        const { path, method = 'GET', data } = action;
        
        // Validate API configuration
        if (!window.bookingAPI?.root) {
            console.error('[Store] API root not configured');
            return Promise.reject(new Error('API configuration not available'));
        }
        
        if (!window.bookingAPI?.nonce) {
            console.error('[Store] Authentication nonce not available');
            return Promise.reject(new Error('Authentication token not available'));
        }
        
        const url = `${window.bookingAPI.root}${path.replace(/^\//, '')}`;
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-WP-Nonce': window.bookingAPI.nonce,
        };
        
        const options: RequestInit = {
            method,
            headers,
            credentials: 'same-origin',
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        return fetch(url, options).then(response => {
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            return response.json();
        });
    },
};

export const store = createReduxStore('appointease/booking', {
    reducer,
    actions,
    selectors,
    controls,
});

// Register store with error handling
try {
    register(store);
    console.log('[Store] WordPress data store registered successfully');
} catch (error) {
    console.error('[Store] Failed to register WordPress data store:', error);
}

export default store;
