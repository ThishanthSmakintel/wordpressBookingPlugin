/**
 * React Hook for WordPress Data Store
 * Following @wordpress/data patterns
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from 'react';
import { stateLogger } from '../utils/stateLogger';

export const useAppointmentStore = () => {
    const state = useSelect((select: any) => {
        try {
            const store = select('appointease/booking');
            const stateData = store ? {
                step: store.getStep?.() ?? 1,
                selectedService: store.getSelectedService?.() ?? null,
                selectedEmployee: store.getSelectedEmployee?.() ?? null,
                selectedDate: store.getSelectedDate?.() ?? '',
                selectedTime: store.getSelectedTime?.() ?? '',
                formData: store.getFormData?.() ?? { firstName: '', lastName: '', email: '', phone: '' },
                services: store.getServices?.() ?? [],
                employees: store.getEmployees?.() ?? [],
                appointments: store.getAppointments?.() ?? [],
                servicesLoading: store.getServicesLoading?.() ?? false,
                employeesLoading: store.getEmployeesLoading?.() ?? false,
                appointmentsLoading: store.getAppointmentsLoading?.() ?? false,
                isSubmitting: store.getIsSubmitting?.() ?? false,
                isOnline: store.getIsOnline?.() ?? true,
                errors: store.getErrors?.() ?? {},
                serverDate: store.getServerDate?.() ?? null,
                unavailableSlots: store.getUnavailableSlots?.() ?? [],
                bookingDetails: store.getBookingDetails?.() ?? {},
                upcomingAppointments: store.getUpcomingAppointments?.() ?? [],
            } : {
                step: 1, selectedService: null, selectedEmployee: null, selectedDate: '', selectedTime: '',
                formData: { firstName: '', lastName: '', email: '', phone: '' }, services: [], employees: [],
                appointments: [], servicesLoading: false, employeesLoading: false, appointmentsLoading: false,
                isSubmitting: false, isOnline: true, errors: {}, serverDate: null, unavailableSlots: [],
                bookingDetails: {}, upcomingAppointments: []
            };
            
            stateLogger.log('STATE_READ', { storeExists: !!store, stateKeys: Object.keys(stateData) });
            return stateData;
        } catch (error) {
            stateLogger.log('STATE_error', { error: error.message });
            return {
                step: 1, selectedService: null, selectedEmployee: null, selectedDate: '', selectedTime: '',
                formData: { firstName: '', lastName: '', email: '', phone: '' }, services: [], employees: [],
                appointments: [], servicesLoading: false, employeesLoading: false, appointmentsLoading: false,
                isSubmitting: false, isOnline: true, errors: {}, serverDate: null, unavailableSlots: [],
                bookingDetails: {}, upcomingAppointments: []
            };
        }
    }, []);

    const dispatch = useDispatch('appointease/booking');

    return {
        ...state,
        setStep: useCallback((step: number) => { stateLogger.log('setStep', step); return dispatch?.setStep?.(step); }, [dispatch]),
        setSelectedService: useCallback((service: any) => { stateLogger.log('setSelectedService', service?.name || service); return dispatch?.setSelectedService?.(service); }, [dispatch]),
        setSelectedEmployee: useCallback((employee: any) => { stateLogger.log('setSelectedEmployee', employee?.name || employee); return dispatch?.setSelectedEmployee?.(employee); }, [dispatch]),
        setSelectedDate: useCallback((date: string) => { stateLogger.log('setSelectedDate', date); return dispatch?.setSelectedDate?.(date); }, [dispatch]),
        setSelectedTime: useCallback((time: string) => { stateLogger.log('setSelectedTime', time); return dispatch?.setSelectedTime?.(time); }, [dispatch]),
        setFormData: useCallback((data: Record<string, any>) => dispatch?.setFormData?.(data), [dispatch]),
        setServices: useCallback((services: any[]) => dispatch?.setServices?.(services), [dispatch]),
        setEmployees: useCallback((employees: any[]) => dispatch?.setEmployees?.(employees), [dispatch]),
        setAppointments: useCallback((appointments: any[]) => dispatch?.setAppointments?.(appointments), [dispatch]),
        setServicesLoading: useCallback((loading: boolean) => dispatch?.setServicesLoading?.(loading), [dispatch]),
        setEmployeesLoading: useCallback((loading: boolean) => dispatch?.setEmployeesLoading?.(loading), [dispatch]),
        setAppointmentsLoading: useCallback((loading: boolean) => dispatch?.setAppointmentsLoading?.(loading), [dispatch]),
        setIsSubmitting: useCallback((submitting: boolean) => dispatch?.setIsSubmitting?.(submitting), [dispatch]),
        setIsOnline: useCallback((online: boolean) => dispatch?.setIsOnline?.(online), [dispatch]),
        setErrors: useCallback((errors: Record<string, string>) => dispatch?.setErrors?.(errors), [dispatch]),
        setServerDate: useCallback((date: string | null) => dispatch?.setServerDate?.(date), [dispatch]),
        setUnavailableSlots: useCallback((slots: string[] | 'all') => dispatch?.setUnavailableSlots?.(slots), [dispatch]),
        setBookingDetails: useCallback((details: Record<string, any>) => dispatch?.setBookingDetails?.(details), [dispatch]),
        clearError: useCallback((field: string) => dispatch?.clearError?.(field), [dispatch]),
        clearErrors: useCallback(() => dispatch?.clearErrors?.(), [dispatch]),
        updateAppointmentStatus: useCallback((id: string, status: string) => dispatch?.updateAppointmentStatus?.(id, status), [dispatch]),
        fetchAppointments: useCallback((email: string) => dispatch?.fetchAppointments?.(email), [dispatch]),
        cancelAppointment: useCallback((id: string, email: string) => dispatch?.cancelAppointment?.(id, email), [dispatch]),
        reset: useCallback(() => dispatch?.reset?.(), [dispatch]),
    };
};

export default useAppointmentStore;
