import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './frontend.css';

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
        booking_ajax: {
            ajax_url: string;
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
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        // Load services
        fetch(window.booking_ajax.ajax_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_services'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                setServices(result.data);
            }
        });

        // Load staff
        fetch(window.booking_ajax.ajax_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_staff'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                setEmployees(result.data.map((staff: any) => ({
                    ...staff,
                    avatar: staff.name.split(' ').map((n: string) => n[0]).join(''),
                    rating: 4.8,
                    reviews: 50
                })));
            }
        });
    }, []);

    const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

    const handleServiceSelect = (service: any) => {
        setSelectedService(service);
        setErrors({});
        setStep(2);
    };

    const handleEmployeeSelect = (employee: any) => {
        setSelectedEmployee(employee);
        setErrors({});
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
        setStep(4);
    };

    const handleTimeSelect = (time: string) => {
        if (!selectedEmployee) {
            showToast('Please select an employee first', 'error');
            return;
        }
        
        const data = new FormData();
        data.append('action', 'check_availability');
        data.append('nonce', window.booking_ajax.nonce);
        data.append('date', selectedDate);
        data.append('time', time);
        data.append('employee_id', selectedEmployee.id);
        
        fetch(window.booking_ajax.ajax_url, {
            method: 'POST',
            body: data
        })
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data.available) {
                setSelectedTime(time);
                setErrors({});
                setStep(5);
            } else {
                showToast('This time slot is not available', 'error');
            }
        });
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
        
        if (!validateForm()) {
            showToast('Please fix the errors below', 'error');
            return;
        }
        
        setIsSubmitting(true);
        const appointmentDateTime = `${selectedDate} ${selectedTime}:00`;
        const data = new FormData();
        data.append('action', 'book_appointment');
        data.append('nonce', window.booking_ajax.nonce);
        data.append('name', `${formData.firstName} ${formData.lastName}`);
        data.append('email', formData.email);
        data.append('phone', formData.phone);
        data.append('date', appointmentDateTime);
        data.append('service_id', selectedService.id);
        data.append('employee_id', selectedEmployee.id);

        fetch(window.booking_ajax.ajax_url, {
            method: 'POST',
            body: data
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showToast(`Booking confirmed! Your appointment ID is ${result.data.id}`, 'success');
                setAppointmentId(result.data.id.toString());
                setStep(6);
            } else {
                showToast(result.data, 'error');
            }
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
            showToast('Please enter your appointment ID', 'error');
            return;
        }

        const data = new FormData();
        data.append('action', 'get_appointment');
        data.append('nonce', window.booking_ajax.nonce);
        data.append('id', appointmentId);

        fetch(window.booking_ajax.ajax_url, {
            method: 'POST',
            body: data
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                setCurrentAppointment(result.data);
                setManageMode(true);
            } else {
                showToast('Appointment not found', 'error');
            }
        });
    };

    const handleCancelAppointment = () => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;

        const data = new FormData();
        data.append('action', 'cancel_appointment');
        data.append('nonce', window.booking_ajax.nonce);
        data.append('id', appointmentId);

        fetch(window.booking_ajax.ajax_url, {
            method: 'POST',
            body: data
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showToast('Appointment cancelled successfully', 'success');
                setManageMode(false);
                setCurrentAppointment(null);
            } else {
                showToast(result.data, 'error');
            }
        });
    };

    const handleReschedule = (newDate: string, newTime: string) => {
        const data = new FormData();
        data.append('action', 'reschedule_appointment');
        data.append('nonce', window.booking_ajax.nonce);
        data.append('id', appointmentId);
        data.append('new_date', `${newDate} ${newTime}:00`);

        fetch(window.booking_ajax.ajax_url, {
            method: 'POST',
            body: data
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showToast('Appointment rescheduled successfully', 'success');
                setManageMode(false);
                setCurrentAppointment(null);
            } else {
                showToast(result.data, 'error');
            }
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
                    <div className="appointment-details">
                        <h2>Manage Appointment #{appointmentId}</h2>
                        <div className="appointment-info">
                            <p><strong>Name:</strong> {currentAppointment.name}</p>
                            <p><strong>Email:</strong> {currentAppointment.email}</p>
                            <p><strong>Date:</strong> {new Date(currentAppointment.appointment_date).toLocaleString()}</p>
                            <p><strong>Status:</strong> {currentAppointment.status}</p>
                        </div>
                        <div className="appointment-actions">
                            <button className="cancel-btn" onClick={handleCancelAppointment}>Cancel Appointment</button>
                            <button className="reschedule-btn" onClick={() => {setStep(3); setManageMode(false);}}>Reschedule</button>
                            <button className="back-btn" onClick={() => setManageMode(false)}>← Back</button>
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
                        placeholder="Enter Appointment ID" 
                        value={appointmentId}
                        onChange={(e) => setAppointmentId(e.target.value)}
                    />
                    <button onClick={handleManageAppointment}>Manage</button>
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
                        {services.length === 0 ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Loading services...</p>
                            </div>
                        ) : (
                            <div className="services-grid">
                                {services.map(service => (
                                    <div key={service.id} className="service-card" onClick={() => handleServiceSelect(service)}>
                                        <div className="service-icon">💼</div>
                                        <div className="service-info">
                                            <h3>{service.name}</h3>
                                            <p>{service.description}</p>
                                            <div className="service-meta">
                                                <span className="duration">⏱️ {service.duration} min</span>
                                                <span className="price">💰 ${service.price}</span>
                                            </div>
                                        </div>
                                        <div className="service-arrow">→</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="appointease-step-content">
                        <h2>Choose Your Specialist</h2>
                        <p className="step-description">Select who you'd like to work with</p>
                        {employees.length === 0 ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Loading specialists...</p>
                            </div>
                        ) : (
                            <div className="employees-grid">
                                {employees.map(employee => (
                                    <div key={employee.id} className="employee-card" onClick={() => handleEmployeeSelect(employee)}>
                                        <div className="employee-avatar">{employee.avatar}</div>
                                        <div className="employee-info">
                                            <h3>{employee.name}</h3>
                                            <div className="employee-rating">
                                                <span className="rating">⭐ {employee.rating}</span>
                                                <span className="reviews">({employee.reviews} reviews)</span>
                                            </div>
                                        </div>
                                        <div className="employee-arrow">→</div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                            <span>📅 {new Date(selectedDate).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="time-slots">
                            {timeSlots.map(time => (
                                <div key={time} className="time-slot" onClick={() => handleTimeSelect(time)}>
                                    <span className="time">{time}</span>
                                    <span className="available">Available</span>
                                </div>
                            ))}
                        </div>
                        <button className="back-btn" onClick={() => setStep(3)}>← Back</button>
                    </div>
                )}

                {step === 5 && (
                    <div className="appointease-step-content">
                        <h2>Almost Done!</h2>
                        <p className="step-description">Please provide your contact information</p>
                        <form onSubmit={handleSubmit} className="customer-form">
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
                                    {isSubmitting ? 'BOOKING...' : 'CONFIRM BOOKING'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {step === 6 && (
                    <div className="appointease-step-content success-step">
                        <div className="success-animation">
                            <div className="success-icon">✓</div>
                        </div>
                        <h2>Booking Confirmed!</h2>
                        <p className="success-message">Your appointment has been successfully booked. We've sent a confirmation email to {formData.email}.</p>
                        
                        <div className="appointment-card">
                            <div className="appointment-id">
                                <span className="id-label">Your Appointment ID</span>
                                <span className="id-number">#{appointmentId}</span>
                            </div>
                            
                            <div className="appointment-details">
                                <div className="detail-row">
                                    <span className="icon">💼</span>
                                    <div>
                                        <span className="label">Service</span>
                                        <span className="value">{selectedService?.name}</span>
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <span className="icon">👨‍⚕️</span>
                                    <div>
                                        <span className="label">Specialist</span>
                                        <span className="value">{selectedEmployee?.name}</span>
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <span className="icon">📅</span>
                                    <div>
                                        <span className="label">Date & Time</span>
                                        <span className="value">{new Date(selectedDate).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {selectedTime}</span>
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <span className="icon">💰</span>
                                    <div>
                                        <span className="label">Total</span>
                                        <span className="value">${selectedService?.price}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="important-note">
                            <span className="note-icon">⚠️</span>
                            <p>Please save your appointment ID <strong>#{appointmentId}</strong> to manage your booking later.</p>
                        </div>
                        
                        <div className="success-actions">
                            <button className="new-booking-btn" onClick={() => {
                                setStep(1);
                                setSelectedService(null);
                                setSelectedEmployee(null);
                                setSelectedDate('');
                                setSelectedTime('');
                                setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                                setAppointmentId('');
                                setErrors({});
                            }}>
                                Book Another Appointment
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

// Global reference for external access
window.BookingApp = null;

document.addEventListener('DOMContentLoaded', () => {
    const bookingContainer = document.getElementById('appointease-booking');
    if (bookingContainer) {
        // Hide initial loading
        const loadingEl = bookingContainer.querySelector('.loading-initial');
        if (loadingEl) loadingEl.style.display = 'none';
        
        const root = createRoot(bookingContainer);
        const appRef = React.createRef();
        
        root.render(<BookingApp ref={appRef} />);
        
        // Expose methods globally
        setTimeout(() => {
            if (appRef.current) {
                window.BookingApp = {
                    setAppointmentId: (id) => appRef.current.setAppointmentId(id),
                    handleManageAppointment: () => appRef.current.handleManageAppointment()
                };
            }
        }, 100);
    }
});