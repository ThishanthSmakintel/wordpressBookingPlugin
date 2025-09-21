import { useCallback } from 'react';
import { useBookingStore } from '../store/bookingStore';
import { sanitizeInput, generateStrongId } from '../utils';

export const useBookingActions = (bookingState: any) => {
    const {
        step, selectedService, selectedEmployee, selectedDate, selectedTime, formData,
        setStep, setAppointments, setAppointmentsLoading, setErrors, setIsSubmitting
    } = useBookingStore();

    const checkAvailability = useCallback(async (date: string, employeeId: number) => {
        if (!window.bookingAPI || !date || !employeeId) {
            bookingState.setUnavailableSlots([]);
            return;
        }
        
        try {
            const requestBody: any = {
                date: date,
                employee_id: employeeId
            };
            
            // When rescheduling, exclude current appointment from unavailable slots
            if (bookingState.isRescheduling && bookingState.currentAppointment?.id) {
                requestBody.exclude_appointment_id = bookingState.currentAppointment.id;
            }
            
            const response = await fetch(`${window.bookingAPI.root}booking/v1/availability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.bookingAPI.nonce
                },
                body: JSON.stringify(requestBody)
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.unavailable === 'all') {
                    bookingState.setUnavailableSlots('all');
                    bookingState.setBookingDetails({});
                } else if (Array.isArray(data.unavailable)) {
                    bookingState.setUnavailableSlots(data.unavailable);
                    bookingState.setBookingDetails(data.booking_details || {});
                } else {
                    bookingState.setUnavailableSlots([]);
                    bookingState.setBookingDetails({});
                }
            }
        } catch (error) {
            bookingState.setUnavailableSlots([]);
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
        if (event) event.preventDefault();
        
        setIsSubmitting(true);
        const appointmentDateTime = `${selectedDate} ${selectedTime}:00`;
        
        if (!window.bookingAPI) {
            setTimeout(() => {
                bookingState.setAppointmentId(generateStrongId());
                setStep(7);
                setIsSubmitting(false);
            }, 1500);
            return;
        }
        
        fetch(`${window.bookingAPI?.root || '/wp-json/'}appointease/v1/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': window.bookingAPI.nonce
            },
            body: JSON.stringify({
                name: sanitizeInput(bookingState.isLoggedIn ? bookingState.loginEmail.split('@')[0] : formData.firstName),
                email: sanitizeInput(bookingState.isLoggedIn ? bookingState.loginEmail : formData.email),
                phone: sanitizeInput(bookingState.isLoggedIn ? '' : formData.phone),
                date: appointmentDateTime,
                service_id: parseInt(String(selectedService.id), 10),
                employee_id: parseInt(String(selectedEmployee.id), 10)
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.strong_id || result.id) {
                setErrors({});
                bookingState.setAppointmentId(result.strong_id || `APT-${new Date().getFullYear()}-${result.id.toString().padStart(6, '0')}`);
                setStep(7);
            } else {
                setErrors({general: result.message || 'Booking failed. Please try again.'});
            }
        })
        .catch(error => {
            setErrors({general: 'Booking failed. Please try again.'});
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