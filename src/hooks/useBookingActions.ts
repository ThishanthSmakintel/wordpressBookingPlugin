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

        
        if (!window.bookingAPI || !date || !employeeId) {

            setUnavailableSlots([]);
            return;
        }
        
        try {
            const requestBody: any = {
                date: date,
                employee_id: parseInt(String(employeeId), 10)
            };
            
            // Use different endpoint for rescheduling
            const endpoint = bookingState.isRescheduling && bookingState.currentAppointment?.id
                ? `${window.bookingAPI.root}appointease/v1/reschedule-availability`
                : `${window.bookingAPI.root}booking/v1/availability`;
            
            if (bookingState.isRescheduling && bookingState.currentAppointment?.id) {
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

                
                if (data.unavailable === 'all') {
                    setUnavailableSlots('all');
                    setBookingDetails({});
                } else if (Array.isArray(data.unavailable)) {
                    setUnavailableSlots(data.unavailable);
                    setBookingDetails(data.booking_details || {});

                } else {
                    setUnavailableSlots([]);
                    setBookingDetails({});
                }
            } else {

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
        if (event) event.preventDefault();
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
        
        fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': window.bookingAPI.nonce
            },
            body: JSON.stringify(requestBody)
        })
        .then(async response => {
            const result = await response.json();
            return { status: response.status, data: result };
        })
        .then(({ status, data }) => {
            if (status === 409) {
                // Slot taken by another user
                if (window.Toastify) {
                    window.Toastify({
                        text: "⚠️ This slot was just booked by another user. Please select a different time.",
                        duration: 5000,
                        gravity: "top",
                        position: "center",
                        style: { background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }
                    }).showToast();
                }
                // Refresh availability to disable the slot
                checkAvailability(selectedDate, selectedEmployee.id);
                // Go back to time selection
                setStep(4);
                setErrors({time: 'This slot is no longer available. Please select another time.'});
            } else if (data.success || data.strong_id || data.id) {
                setErrors({});
                if (isReschedule) {
                    setStep(9);
                } else {
                    bookingState.setAppointmentId(data.strong_id || `APT-${new Date().getFullYear()}-${data.id.toString().padStart(6, '0')}`);
                    setStep(7);
                }
            } else {
                setErrors({general: data.message || (isReschedule ? 'Reschedule failed. Please try again.' : 'Booking failed. Please try again.')});
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
                email: apt.email,
                employee_id: apt.employee_id
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
