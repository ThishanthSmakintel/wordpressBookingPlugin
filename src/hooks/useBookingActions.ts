import { useCallback } from 'react';
import { useAppointmentStore as useBookingStore } from '../hooks/useAppointmentStore';
import { sanitizeInput, generateStrongId } from '../utils';

export const useBookingActions = (bookingState: any) => {
    const {
        step, selectedService, selectedEmployee, selectedDate, selectedTime, formData,
        setStep, setAppointments, setAppointmentsLoading, setErrors, setIsSubmitting,
        setUnavailableSlots, setBookingDetails
    } = useBookingStore();

    const checkAvailability = useCallback(async (date: string, employeeId: number) => {
        console.log('[checkAvailability] Called with:', { date, employeeId, isRescheduling: bookingState.isRescheduling, currentAppointmentId: bookingState.currentAppointment?.id });
        
        if (!window.bookingAPI || !date || !employeeId) {
            console.log('[checkAvailability] Missing required data, setting empty unavailable slots');
            setUnavailableSlots([]);
            return;
        }
        
        try {
            const requestBody: any = {
                date: date,
                employee_id: employeeId
            };
            
            // Use different endpoint for rescheduling
            let endpoint = `${window.bookingAPI.root}booking/v1/availability`;
            
            if (bookingState.isRescheduling && bookingState.currentAppointment?.id) {
                endpoint = `${window.bookingAPI.root}appointease/v1/reschedule-availability`;
                requestBody.exclude_appointment_id = bookingState.currentAppointment.id;
            }
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.bookingAPI.nonce
                },
                body: JSON.stringify(requestBody)
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('[checkAvailability] API Response:', data);
                console.log('[checkAvailability] Endpoint used:', endpoint);
                console.log('[checkAvailability] Request body:', requestBody);
                
                if (data.unavailable === 'all') {
                    setUnavailableSlots('all');
                    setBookingDetails({});
                } else if (Array.isArray(data.unavailable)) {
                    console.log('[checkAvailability] Setting unavailable slots:', data.unavailable);
                    setUnavailableSlots(data.unavailable);
                    setBookingDetails(data.booking_details || {});
                } else {
                    console.log('[checkAvailability] No unavailable slots found, setting empty array');
                    setUnavailableSlots([]);
                    setBookingDetails({});
                }
            } else {
                console.error('[checkAvailability] API request failed:', response.status, response.statusText);
            }
        } catch (error) {
            setUnavailableSlots([]);
        }
    }, [bookingState]);

    const handleManageAppointment = useCallback(async (appointmentIdToManage?: string) => {
        const idToUse = appointmentIdToManage || bookingState.appointmentId;
        if (!idToUse) return;
        
        bookingState.setIsManaging(true);
        try {
            const response = await fetch(`${window.bookingAPI.root}appointease/v1/appointments/${idToUse}`, {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': window.bookingAPI.nonce
                }
            });
            
            if (response.ok) {
                const appointment = await response.json();
                bookingState.setCurrentAppointment(appointment);
                bookingState.setAppointmentId(idToUse);
                bookingState.setManageMode(true);
                setErrors({});
            } else {
                setErrors({general: 'No appointment found with this ID.'});
            }
        } catch (error) {
            setErrors({general: 'Error checking appointment.'});
        } finally {
            bookingState.setIsManaging(false);
        }
    }, [bookingState, setErrors]);

    const handleSubmit = useCallback((event?: React.FormEvent) => {
        console.log('[handleSubmit] Called with event:', event);
        if (event) event.preventDefault();
        
        console.log('[handleSubmit] Starting submission');
        console.log('[handleSubmit] Form data:', formData);
        console.log('[handleSubmit] Selected service:', selectedService);
        console.log('[handleSubmit] Selected employee:', selectedEmployee);
        console.log('[handleSubmit] Selected date:', selectedDate);
        console.log('[handleSubmit] Selected time:', selectedTime);
        console.log('[handleSubmit] Is logged in:', bookingState.isLoggedIn);
        console.log('[handleSubmit] Login email:', bookingState.loginEmail);
        
        setIsSubmitting(true);
        const appointmentDateTime = `${selectedDate} ${selectedTime}:00`;
        
        if (!window.bookingAPI) {
            setTimeout(() => {
                bookingState.setAppointmentId(generateStrongId());
                setStep(bookingState.isRescheduling ? 9 : 7);
                setIsSubmitting(false);
            }, 1500);
            return;
        }
        
        // Use different endpoint and method for reschedule
        const isReschedule = bookingState.isRescheduling && bookingState.currentAppointment?.id;
        const endpoint = isReschedule 
            ? `${window.bookingAPI.root}appointease/v1/appointments/${bookingState.currentAppointment.id}`
            : `${window.bookingAPI.root}appointease/v1/appointments`;
        const method = isReschedule ? 'PUT' : 'POST';
        
        const requestBody = isReschedule 
            ? {
                new_date: appointmentDateTime,
                reason: 'User requested reschedule'
              }
            : {
                name: sanitizeInput(formData.firstName || bookingState.loginEmail.split('@')[0]),
                email: sanitizeInput(formData.email || bookingState.loginEmail),
                phone: sanitizeInput(formData.phone || ''),
                date: appointmentDateTime,
                service_id: parseInt(String(selectedService.id), 10),
                employee_id: parseInt(String(selectedEmployee.id), 10)
              };
        
        console.log('[handleSubmit] API Request:', { endpoint, method, requestBody });
        
        fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': window.bookingAPI.nonce
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => {
            console.log('[handleSubmit] API Response status:', response.status);
            return response.json();
        })
        .then(result => {
            console.log('[handleSubmit] API Result:', result);
            if (result.success || result.strong_id || result.id) {
                setErrors({});
                if (isReschedule) {
                    setStep(9); // Reschedule success page
                } else {
                    bookingState.setAppointmentId(result.strong_id || `APT-${new Date().getFullYear()}-${result.id.toString().padStart(6, '0')}`);
                    setStep(7); // Booking success page
                }
            } else {
                setErrors({general: result.message || (isReschedule ? 'Reschedule failed. Please try again.' : 'Booking failed. Please try again.')});
            }
        })
        .catch(error => {
            setErrors({general: isReschedule ? 'Reschedule failed. Please try again.' : 'Booking failed. Please try again.'});
        })
        .finally(() => {
            setIsSubmitting(false);
        });
    }, [bookingState, selectedDate, selectedTime, selectedService, selectedEmployee, formData, setStep, setErrors, setIsSubmitting]);

    const loadUserAppointmentsRealtime = useCallback((email?: string) => {
        const emailToUse = email || bookingState.loginEmail;
        if (!window.bookingAPI || !emailToUse) {
            setAppointments([]);
            return;
        }
        setAppointmentsLoading(true);
        fetch(`${window.bookingAPI?.root || '/wp-json/'}appointease/v1/user-appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': window.bookingAPI.nonce
            },
            body: JSON.stringify({ email: emailToUse })
        })
        .then(response => response.json())
        .then(appointments => {
            const formattedAppointments = (appointments || []).map((apt: any) => ({
                id: apt.strong_id || `AE${apt.id.toString().padStart(6, '0')}`,
                service: apt.service_name || 'Service',
                staff: apt.staff_name || 'Staff Member',
                date: apt.appointment_date,
                status: apt.status,
                name: apt.name,
                email: apt.email
            }));
            setAppointments(formattedAppointments);
        })
        .catch(() => setAppointments([]))
        .finally(() => setAppointmentsLoading(false));
    }, [bookingState.loginEmail, setAppointments, setAppointmentsLoading]);

    return {
        checkAvailability,
        handleManageAppointment,
        handleSubmit,
        loadUserAppointmentsRealtime
    };
};
