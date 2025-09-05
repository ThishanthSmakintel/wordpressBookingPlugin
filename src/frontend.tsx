import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './frontend.css';

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
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

const BookingApp: React.FC = () => {
    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [formData, setFormData] = useState<FormData>({ firstName: '', lastName: '', email: '', phone: '' });

    const services = [
        { id: 1, name: 'Consultation', duration: 30, price: 75, description: 'Initial consultation session', category: 'General' },
        { id: 2, name: 'Premium Service', duration: 60, price: 150, description: 'Extended premium service', category: 'Premium' },
        { id: 3, name: 'Quick Service', duration: 15, price: 35, description: 'Fast service option', category: 'Express' },
        { id: 4, name: 'Deluxe Package', duration: 90, price: 200, description: 'Complete deluxe experience', category: 'Premium' }
    ];

    const employees = [
        { id: 1, name: 'Sarah Johnson', avatar: 'SJ', rating: 4.9, reviews: 127 },
        { id: 2, name: 'Mike Wilson', avatar: 'MW', rating: 4.8, reviews: 98 },
        { id: 3, name: 'Emma Davis', avatar: 'ED', rating: 5.0, reviews: 156 }
    ];

    const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

    const handleServiceSelect = (service: any) => {
        setSelectedService(service);
        setStep(2);
    };

    const handleEmployeeSelect = (employee: any) => {
        setSelectedEmployee(employee);
        setStep(3);
    };

    const handleDateSelect = (date: string) => {
        setSelectedDate(date);
        setStep(4);
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
        setStep(5);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        
        const appointmentDateTime = `${selectedDate} ${selectedTime}:00`;
        const data = new FormData();
        data.append('action', 'book_appointment');
        data.append('nonce', window.booking_ajax.nonce);
        data.append('name', `${formData.firstName} ${formData.lastName}`);
        data.append('email', formData.email);
        data.append('phone', formData.phone);
        data.append('date', appointmentDateTime);

        fetch(window.booking_ajax.ajax_url, {
            method: 'POST',
            body: data
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showToast(`Appointment booked successfully! ID: ${result.data.id}`, 'success');
                setStep(6);
            } else {
                showToast(result.data, 'error');
            }
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

    return (
        <div className="amelia-booking">
            <div className="amelia-booking-header">
                <div className="amelia-logo">
                    <span className="logo-icon">A</span>
                    <span className="logo-text">AppointEase</span>
                </div>
            </div>

            <div className="amelia-booking-content">
                <div className="amelia-steps">
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
                    <div className="amelia-step-content">
                        <h2>Select Service</h2>
                        <div className="services-grid">
                            {services.map(service => (
                                <div key={service.id} className="service-card" onClick={() => handleServiceSelect(service)}>
                                    <div className="service-info">
                                        <h3>{service.name}</h3>
                                        <p>{service.description}</p>
                                        <div className="service-meta">
                                            <span className="duration">{service.duration} min</span>
                                            <span className="price">${service.price}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="amelia-step-content">
                        <h2>Select Employee</h2>
                        <div className="employees-grid">
                            {employees.map(employee => (
                                <div key={employee.id} className="employee-card" onClick={() => handleEmployeeSelect(employee)}>
                                    <div className="employee-avatar">{employee.avatar}</div>
                                    <div className="employee-info">
                                        <h3>{employee.name}</h3>
                                        <div className="employee-rating">
                                            <span className="rating">★ {employee.rating}</span>
                                            <span className="reviews">({employee.reviews} reviews)</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
                    </div>
                )}

                {step === 3 && (
                    <div className="amelia-step-content">
                        <h2>Select Date</h2>
                        <div className="calendar-grid">
                            {generateCalendar().map((date, index) => (
                                <div 
                                    key={index} 
                                    className="calendar-day"
                                    onClick={() => handleDateSelect(date.toISOString().split('T')[0])}
                                >
                                    <span className="day-name">{date.toLocaleDateString('en', { weekday: 'short' })}</span>
                                    <span className="day-number">{date.getDate()}</span>
                                    <span className="day-month">{date.toLocaleDateString('en', { month: 'short' })}</span>
                                </div>
                            ))}
                        </div>
                        <button className="back-btn" onClick={() => setStep(2)}>← Back</button>
                    </div>
                )}

                {step === 4 && (
                    <div className="amelia-step-content">
                        <h2>Select Time</h2>
                        <div className="time-slots">
                            {timeSlots.map(time => (
                                <div key={time} className="time-slot" onClick={() => handleTimeSelect(time)}>
                                    {time}
                                </div>
                            ))}
                        </div>
                        <button className="back-btn" onClick={() => setStep(3)}>← Back</button>
                    </div>
                )}

                {step === 5 && (
                    <div className="amelia-step-content">
                        <h2>Your Information</h2>
                        <form onSubmit={handleSubmit} className="customer-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name *</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name *</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
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
                                <button type="button" className="back-btn" onClick={() => setStep(4)}>← Back</button>
                                <button type="submit" className="confirm-btn">CONFIRM BOOKING</button>
                            </div>
                        </form>
                    </div>
                )}

                {step === 6 && (
                    <div className="amelia-step-content success-step">
                        <div className="success-icon">✓</div>
                        <h2>Booking Confirmed!</h2>
                        <p>Your appointment has been successfully booked.</p>
                        <div className="success-details">
                            <div className="detail-item">
                                <span>Service:</span>
                                <span>{selectedService?.name}</span>
                            </div>
                            <div className="detail-item">
                                <span>Employee:</span>
                                <span>{selectedEmployee?.name}</span>
                            </div>
                            <div className="detail-item">
                                <span>Date & Time:</span>
                                <span>{new Date(selectedDate).toLocaleDateString()} at {selectedTime}</span>
                            </div>
                        </div>
                        <button className="new-booking-btn" onClick={() => {
                            setStep(1);
                            setSelectedService(null);
                            setSelectedEmployee(null);
                            setSelectedDate('');
                            setSelectedTime('');
                            setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                        }}>
                            BOOK ANOTHER APPOINTMENT
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

document.addEventListener('DOMContentLoaded', () => {
    const bookingContainer = document.getElementById('appointease-booking');
    if (bookingContainer) {
        const root = createRoot(bookingContainer);
        root.render(<BookingApp />);
    }
});