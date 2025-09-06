import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './frontend.css';
import './reschedule.css';

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    service?: string;
    employee?: string;
    date?: string;
    time?: string;
}

declare global {
    interface Window {
        bookingAPI: {
            root: string;
            nonce: string;
        };
        Toastify: any;
    }
}

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    window.Toastify({
        text: message,
        duration: 3000,
        gravity: 'top',
        position: 'right',
        backgroundColor: type === 'success' ? '#1CBC9B' : '#E74C3C',
        stopOnFocus: true
    }).showToast();
};

const BookingApp = React.forwardRef((props, ref) => {
    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [formData, setFormData] = useState<FormData>({ firstName: '', lastName: '', email: '', phone: '' });
    const [services, setServices] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [appointmentId, setAppointmentId] = useState<string>('');
    const [manageMode, setManageMode] = useState(false);
    const [currentAppointment, setCurrentAppointment] = useState<any>(null);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (window.bookingAPI) {
            fetch('/wp-json/booking/v1/services')
            .then(response => response.json())
            .then(services => {
                setServices(services || []);
            })
            .catch(() => {});

            fetch('/wp-json/booking/v1/staff')
            .then(response => response.json())
            .then(staff => {
                setEmployees((staff || []).map((member: any) => ({
                    ...member,
                    avatar: member.name.split(' ').map((n: string) => n[0]).join(''),
                    rating: 4.8,
                    reviews: 50
                })));
            })
            .catch(() => {});
        }
    }, []);

    const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

    const generateStrongId = () => {
        const year = new Date().getFullYear();
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `APT-${year}-${result}`;
    };

    const handleServiceSelect = (service: any) => {
        setSelectedService(service);
        setErrors({});
        setStep(2);
    };

    const handleEmployeeSelect = (employee: any) => {
        setSelectedEmployee(employee);
        setErrors({});
        setUnavailableSlots([]);
        setStep(3);
    };

    const handleDateSelect = (date: string) => {
        const selectedDateObj = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDateObj < today) {
            showToast('Cannot select past dates', 'error');
            return;
        }
        
        if (selectedDateObj.getDay() === 0 || selectedDateObj.getDay() === 6) {
            showToast('Weekends are not available', 'error');
            return;
        }
        
        setSelectedDate(date);
        setErrors({});
        if (selectedEmployee) {
            checkAvailability(date, selectedEmployee.id);
        }
        setStep(4);
    };

    const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);

    const checkAvailability = async (date: string, employeeId: number) => {
        if (!window.bookingAPI) {
            setUnavailableSlots([]);
            return;
        }
        
        try {
            const response = await fetch('/wp-json/booking/v1/availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.bookingAPI.nonce
                },
                body: JSON.stringify({ date, employee_id: employeeId })
            });
            const result = await response.json();
            setUnavailableSlots(result.unavailable || []);
        } catch {
            setUnavailableSlots([]);
        }
    };

    const handleTimeSelect = (time: string) => {
        if (unavailableSlots.includes(time)) return;
        
        setSelectedTime(time);
        setErrors({});
        setStep(5);
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        
        // Skip form validation for reschedule
        if (isRescheduling) {
            setIsSubmitting(true);
            const appointmentDateTime = `${selectedDate} ${selectedTime}:00`;
            handleReschedule(selectedDate, selectedTime);
            return;
        }
        
        if (!validateForm()) {
            showToast('Please fix the errors below', 'error');
            return;
        }
        
        setIsSubmitting(true);
        const appointmentDateTime = `${selectedDate} ${selectedTime}:00`;
        const strongId = generateStrongId();
        
        if (!window.bookingAPI) {
            setTimeout(() => {
                showToast(`Booking confirmed! Your reference is ${strongId}`, 'success');
                setAppointmentId(strongId);
                setStep(6);
                setIsSubmitting(false);
            }, 1500);
            return;
        }
        
        fetch('/wp-json/booking/v1/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': window.bookingAPI.nonce
            },
            body: JSON.stringify({
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone,
                date: appointmentDateTime,
                service_id: selectedService.id,
                employee_id: selectedEmployee.id
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.id) {
                const strongId = result.strong_id || generateStrongId();
                showToast(`Booking confirmed! Your reference is ${strongId}`, 'success');
                setAppointmentId(strongId);
                setStep(6);
            } else {
                showToast(result.message || 'Booking failed', 'error');
            }
        })
        .catch(error => {
            showToast('Booking failed', 'error');
        })
        .finally(() => {
            setIsSubmitting(false);
        });
    };

    const generateCalendar = () => {
        const today = new Date();
        const days = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const handleManageAppointment = () => {
        if (!appointmentId) {
            showToast('Please enter your appointment token', 'error');
            return;
        }

        if (!window.bookingAPI) {
            showToast('Booking system not available', 'error');
            return;
        }

        fetch(`/wp-json/booking/v1/appointments/${appointmentId}`, {
            method: 'GET',
            headers: {
                'X-WP-Nonce': window.bookingAPI.nonce
            }
        })
        .then(response => response.json())
        .then(appointment => {
            if (appointment.id) {
                setCurrentAppointment(appointment);
                setManageMode(true);
            } else {
                showToast('Appointment not found', 'error');
            }
        })
        .catch(() => {
            showToast('Appointment not found', 'error');
        });
    };

    const handleCancelAppointment = () => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;

        if (!window.bookingAPI) {
            showToast('Booking system not available', 'error');
            return;
        }

        fetch(`/wp-json/booking/v1/appointments/${appointmentId}`, {
            method: 'DELETE',
            headers: {
                'X-WP-Nonce': window.bookingAPI.nonce
            }
        })
        .then(response => response.json())
        .then(result => {
            showToast(`Appointment ${appointmentId} cancelled successfully`, 'success');
            setManageMode(false);
            setCurrentAppointment(null);
            setAppointmentId('');
        })
        .catch(() => {
            showToast('Failed to cancel appointment', 'error');
        });
    };

    const handleReschedule = (newDate: string, newTime: string) => {
        if (!window.bookingAPI) {
            showToast('Booking system not available', 'error');
            return;
        }
        
        fetch(`/wp-json/booking/v1/appointments/${appointmentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': window.bookingAPI.nonce
            },
            body: JSON.stringify({
                new_date: `${newDate} ${newTime}:00`
            })
        })
        .then(response => response.json())
        .then(result => {
            showToast('Appointment rescheduled successfully', 'success');
            setManageMode(false);
            setCurrentAppointment(null);
            setIsRescheduling(false);
            setStep(1);
        })
        .catch(() => {
            showToast('Failed to reschedule appointment', 'error');
        });
    };

    React.useImperativeHandle(ref, () => ({
        setAppointmentId: (id: string) => setAppointmentId(id),
        handleManageAppointment: handleManageAppointment
    }));

    if (manageMode && currentAppointment) {
        return (
            <div className="appointease-booking">
                <div className="appointease-booking-header">
                    <div className="appointease-logo">
                        <span className="logo-icon">A</span>
                        <span className="logo-text">AppointEase</span>
                    </div>
                </div>
                <div className="appointease-booking-content">
                    <div className="success-container">
                        <h1 className="success-title">Manage Appointment</h1>
                        
                        <div className="appointment-card">
                            <div className="appointment-id">
                                <span className="id-label">Booking Reference</span>
                                <span className="id-number" title="Click to copy" onClick={() => {
                                    navigator.clipboard.writeText(appointmentId).then(() => {
                                        const idElement = document.querySelector('.id-number');
                                        if (idElement) {
                                            const original = idElement.textContent;
                                            idElement.textContent = 'Copied!';
                                            idElement.style.background = 'rgba(40, 167, 69, 0.3)';
                                            setTimeout(() => {
                                                idElement.textContent = original;
                                                idElement.style.background = 'rgba(255,255,255,0.15)';
                                            }, 2000);
                                        }
                                    });
                                }}>{appointmentId}</span>
                            </div>
                            
                            <div className="appointment-details">
                                <div className="detail-item">
                                    <span className="detail-label">Customer:</span>
                                    <span className="detail-value">{currentAppointment.name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Email:</span>
                                    <span className="detail-value">{currentAppointment.email}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Date & Time:</span>
                                    <span className="detail-value">{new Date(currentAppointment.appointment_date).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {new Date(currentAppointment.appointment_date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Status:</span>
                                    <span className="detail-value" style={{textTransform: 'capitalize', color: currentAppointment.status === 'confirmed' ? '#1CBC9B' : '#E74C3C'}}>{currentAppointment.status}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="success-actions">
                            <button className="action-btn secondary-btn" onClick={() => {
                                setSelectedService({name: 'Current Service', price: 0});
                                setSelectedEmployee({name: 'Current Staff'});
                                setIsRescheduling(true);
                                setStep(3); 
                                setManageMode(false);
                            }}>
                                <i className="fas fa-calendar-alt"></i>
                                Reschedule
                            </button>
                            <button className="action-btn" style={{background: '#E74C3C'}} onClick={handleCancelAppointment}>
                                <i className="fas fa-times"></i>
                                Cancel
                            </button>
                            <button className="action-btn primary-btn" onClick={() => setManageMode(false)}>
                                <i className="fas fa-arrow-left"></i>
                                Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="appointease-booking">
            <div className="appointease-booking-header">
                <div className="appointease-logo">
                    <span className="logo-icon">A</span>
                    <span className="logo-text">AppointEase</span>
                </div>
                <div className="manage-appointment">
                    <input 
                        type="text" 
                        placeholder="APT-2024-XXXXXX" 
                        value={appointmentId}
                        onChange={(e) => setAppointmentId(e.target.value)}
                    />
                    <button onClick={handleManageAppointment}>Manage</button>
                    {appointmentId && (
                        <button className="clear-btn" onClick={() => {
                            setAppointmentId('');
                            showToast('Cleared! Ready for new appointment', 'success');
                        }} title="Clear ID for new appointment">
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                </div>
            </div>

            <div className="appointease-booking-content">
                <div className="appointease-steps">
                    <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <span className="step-number">1</span>
                        <span className="step-label">Service</span>
                    </div>
                    <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        <span className="step-number">2</span>
                        <span className="step-label">Employee</span>
                    </div>
                    <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                        <span className="step-number">3</span>
                        <span className="step-label">Date</span>
                    </div>
                    <div className={`step ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
                        <span className="step-number">4</span>
                        <span className="step-label">Time</span>
                    </div>
                    <div className={`step ${step >= 5 ? 'active' : ''} ${step > 5 ? 'completed' : ''}`}>
                        <span className="step-number">5</span>
                        <span className="step-label">Info</span>
                    </div>
                </div>

                {step === 1 && (
                    <div className="appointease-step-content">
                        <h2>Choose Your Service</h2>
                        <p className="step-description">Select the service you'd like to book</p>

                        <div className="services-grid">
                            {services.map(service => (
                                <div key={service.id} className="service-card" onClick={() => handleServiceSelect(service)}>
                                    <div className="service-icon"><i className="ri-briefcase-line"></i></div>
                                    <div className="service-info">
                                        <h3>{service.name}</h3>
                                        <p>{service.description}</p>
                                        <div className="service-meta">
                                            <span className="duration"><i className="ri-time-line"></i> {service.duration} min</span>
                                            <span className="price"><i className="ri-money-dollar-circle-line"></i> ${service.price}</span>
                                        </div>
                                    </div>
                                    <div className="service-arrow"><i className="ri-arrow-right-line"></i></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="appointease-step-content">
                        <h2>Choose Your Specialist</h2>
                        <p className="step-description">Select who you'd like to work with</p>

                        <div className="employees-grid">
                            {employees.map(employee => (
                                <div key={employee.id} className="employee-card" onClick={() => handleEmployeeSelect(employee)}>
                                    <div className="employee-avatar">{employee.avatar}</div>
                                    <div className="employee-info">
                                        <h3>{employee.name}</h3>
                                        <div className="employee-rating">
                                            <span className="rating"><i className="ri-star-fill"></i> {employee.rating}</span>
                                            <span className="reviews">({employee.reviews} reviews)</span>
                                        </div>
                                    </div>
                                    <div className="employee-arrow"><i className="ri-arrow-right-line"></i></div>
                                </div>
                            ))}
                        </div>
                        <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
                    </div>
                )}

                {step === 3 && (
                    <div className="appointease-step-content">
                        <h2>Pick Your Date</h2>
                        <p className="step-description">Choose when you'd like your appointment</p>
                        <div className="calendar-grid">
                            {generateCalendar().map((date, index) => {
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                const isPast = date < new Date(new Date().setHours(0,0,0,0));
                                return (
                                    <div 
                                        key={index} 
                                        className={`calendar-day ${isWeekend || isPast ? 'disabled' : ''}`}
                                        onClick={() => !isWeekend && !isPast && handleDateSelect(date.toISOString().split('T')[0])}
                                    >
                                        <span className="day-name">{date.toLocaleDateString('en', { weekday: 'short' })}</span>
                                        <span className="day-number">{date.getDate()}</span>
                                        <span className="day-month">{date.toLocaleDateString('en', { month: 'short' })}</span>
                                        {isWeekend && <span className="unavailable">Closed</span>}
                                    </div>
                                );
                            })}
                        </div>
                        <button className="back-btn" onClick={() => setStep(2)}>← Back</button>
                    </div>
                )}

                {step === 4 && (
                    <div className="appointease-step-content">
                        <h2>Choose Your Time</h2>
                        <p className="step-description">Select your preferred time slot</p>
                        <div className="selected-info">
                            <span><i className="ri-calendar-line"></i> {new Date(selectedDate).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="time-slots">
                            {timeSlots.map(time => {
                                const isUnavailable = unavailableSlots.includes(time);
                                return (
                                    <div 
                                        key={time} 
                                        className={`time-slot ${isUnavailable ? 'unavailable' : ''}`}
                                        onClick={() => handleTimeSelect(time)}
                                    >
                                        <span className="time">{time}</span>
                                        <span className="status">{isUnavailable ? 'Unavailable' : 'Available'}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <button className="back-btn" onClick={() => setStep(3)}>← Back</button>
                    </div>
                )}

                {step === 5 && (
                    <div className="appointease-step-content">
                        {isRescheduling ? (
                            <>
                                <div className="reschedule-banner">
                                    <i className="fas fa-calendar-alt"></i>
                                    <span>Rescheduling Appointment {appointmentId}</span>
                                </div>
                                <h2>Confirm New Time</h2>
                                <p className="step-description">Review your new appointment details</p>
                            </>
                        ) : (
                            <>
                                <h2>Almost Done!</h2>
                                <p className="step-description">Please provide your contact information</p>
                            </>
                        )}
                        {!isRescheduling && <form onSubmit={handleSubmit} className="customer-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name *</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => {
                                            setFormData({...formData, firstName: e.target.value});
                                            if (errors.firstName) setErrors({...errors, firstName: undefined});
                                        }}
                                        className={errors.firstName ? 'error' : ''}
                                        placeholder="Enter your first name"
                                    />
                                    {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Last Name *</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => {
                                            setFormData({...formData, lastName: e.target.value});
                                            if (errors.lastName) setErrors({...errors, lastName: undefined});
                                        }}
                                        className={errors.lastName ? 'error' : ''}
                                        placeholder="Enter your last name"
                                    />
                                    {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => {
                                            setFormData({...formData, email: e.target.value});
                                            if (errors.email) setErrors({...errors, email: undefined});
                                        }}
                                        className={errors.email ? 'error' : ''}
                                        placeholder="Enter your email address"
                                    />
                                    {errors.email && <span className="error-message">{errors.email}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            setFormData({...formData, phone: e.target.value});
                                            if (errors.phone) setErrors({...errors, phone: undefined});
                                        }}
                                        className={errors.phone ? 'error' : ''}
                                        placeholder="Enter your phone number"
                                    />
                                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                                </div>
                            </div>
                            
                            <div className="booking-summary">
                                <h3>Booking Summary</h3>
                                <div className="summary-item">
                                    <span>Service:</span>
                                    <span>{selectedService?.name}</span>
                                </div>
                                <div className="summary-item">
                                    <span>Employee:</span>
                                    <span>{selectedEmployee?.name}</span>
                                </div>
                                <div className="summary-item">
                                    <span>Date:</span>
                                    <span>{new Date(selectedDate).toLocaleDateString()}</span>
                                </div>
                                <div className="summary-item">
                                    <span>Time:</span>
                                    <span>{selectedTime}</span>
                                </div>
                                <div className="summary-item total">
                                    <span>Total:</span>
                                    <span>${selectedService?.price}</span>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="back-btn" onClick={() => setStep(4)} disabled={isSubmitting}>← Back</button>
                                <button type="submit" className={`confirm-btn ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
                                    {isSubmitting ? 'UPDATING...' : 'CONFIRM RESCHEDULE'}
                                </button>
                            </div>
                        </form>}
                        
                        {isRescheduling && (
                            <div className="reschedule-summary">
                                <div className="booking-summary">
                                    <h3>New Appointment Time</h3>
                                    <div className="summary-item">
                                        <span>Date:</span>
                                        <span>{new Date(selectedDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Time:</span>
                                        <span>{selectedTime}</span>
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="back-btn" onClick={() => setStep(4)}>← Back</button>
                                    <button type="button" className="confirm-btn" onClick={() => handleReschedule(selectedDate, selectedTime)}>
                                        CONFIRM RESCHEDULE
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 6 && (
                    <div className="appointease-step-content success-step">
                        <div className="success-container">
                            <div className="success-animation">
                                <div className="success-icon">✓</div>
                            </div>
                            
                            <h1 className="success-title">Booking Confirmed!</h1>
                            <p className="success-subtitle">
                                Your appointment has been successfully booked. We've sent a confirmation email to <strong>{formData.email}</strong>.
                            </p>
                        
                            <div className="appointment-card">
                                <div className="appointment-id">
                                    <span className="id-label">Your Booking Reference</span>
                                    <span 
                                        className="id-number" 
                                        title="Click to copy" 
                                        onClick={() => {
                                            navigator.clipboard.writeText(appointmentId).then(() => {
                                                const idElement = document.querySelector('.id-number');
                                                if (idElement) {
                                                    const original = idElement.textContent;
                                                    idElement.textContent = 'Copied!';
                                                    idElement.style.background = 'rgba(40, 167, 69, 0.3)';
                                                    setTimeout(() => {
                                                        idElement.textContent = original;
                                                        idElement.style.background = 'rgba(255,255,255,0.15)';
                                                    }, 2000);
                                                }
                                            });
                                        }}
                                    >
                                        {appointmentId}
                                    </span>
                                </div>
                                
                                <div className="appointment-details">
                                    <div className="detail-item">
                                        <span className="detail-label">Service:</span>
                                        <span className="detail-value">{selectedService?.name}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="icon">
                                            <i className="fas fa-user-md"></i>
                                        </span>
                                        <div>
                                            <span className="label">Specialist</span>
                                            <span className="value">{selectedEmployee?.name}</span>
                                        </div>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Date & Time:</span>
                                        <span className="detail-value">
                                            {new Date(selectedDate).toLocaleDateString('en', { 
                                                weekday: 'long', 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })} at {selectedTime}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Total:</span>
                                        <span className="detail-value">${parseFloat(selectedService?.price || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        
                            <div className="info-note">
                                <i className="fas fa-info-circle"></i>
                                Save your reference for future management.
                            </div>
                        
                            <div className="success-actions">
                                <button className="action-btn primary-btn" onClick={() => {
                                    setStep(1);
                                    setSelectedService(null);
                                    setSelectedEmployee(null);
                                    setSelectedDate('');
                                    setSelectedTime('');
                                    setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                                    setAppointmentId('');
                                    setErrors({});
                                }}>
                                    <i className="fas fa-plus"></i>
                                    Book Another
                                </button>
                                
                                <button className="action-btn secondary-btn" onClick={() => {
                                    setManageMode(true);
                                    setCurrentAppointment({
                                        id: appointmentId,
                                        name: `${formData.firstName} ${formData.lastName}`,
                                        email: formData.email,
                                        appointment_date: `${selectedDate} ${selectedTime}:00`,
                                        status: 'confirmed'
                                    });
                                }}>
                                    <i className="fas fa-edit"></i>
                                    Manage
                                </button>
                            </div>
                        

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

window.BookingApp = null;

function initBookingApp(containerId) {
    const bookingContainer = document.getElementById(containerId);
    if (bookingContainer) {
        bookingContainer.innerHTML = '';
        
        const root = createRoot(bookingContainer);
        const appRef = React.createRef();
        
        root.render(<BookingApp ref={appRef} />);
        
        setTimeout(() => {
            if (appRef.current) {
                window.BookingApp = {
                    setAppointmentId: (id) => appRef.current.setAppointmentId(id),
                    handleManageAppointment: () => appRef.current.handleManageAppointment()
                };
            }
        }, 100);
    }
}

if (typeof window !== 'undefined') {
    window.initBookingApp = initBookingApp;
    
    setTimeout(() => {
        initBookingApp('appointease-booking');
        initBookingApp('appointease-booking-editor');
    }, 10);
    
    document.addEventListener('DOMContentLoaded', () => {
        initBookingApp('appointease-booking');
        initBookingApp('appointease-booking-editor');
    });
    
    window.addEventListener('load', () => {
        initBookingApp('appointease-booking');
        initBookingApp('appointease-booking-editor');
    });
}