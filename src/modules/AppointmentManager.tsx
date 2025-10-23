import React from 'react';

interface AppointmentManagerProps {
    bookingState: any;
    onReschedule: () => void;
    onCancel: () => void;
    onBack: () => void;
}

export const AppointmentManager: React.FC<AppointmentManagerProps> = ({ 
    bookingState, 
    onReschedule, 
    onCancel, 
    onBack 
}) => {
    const handleCancelAppointment = async () => {
        if (!bookingState.currentAppointment?.id) return;
        
        bookingState.setIsCancelling(true);
        
        try {
            const apiRoot = window.bookingAPI?.root || '/wp-json/';
            const url = `${apiRoot}appointease/v1/appointments/${bookingState.currentAppointment.id}`;
            
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };
            
            if (window.bookingAPI?.nonce) {
                headers['X-WP-Nonce'] = window.bookingAPI.nonce;
            }
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers,
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                onCancel();
            } else {
                console.error('Failed to cancel appointment:', response.status);
                bookingState.setIsCancelling(false);
            }
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            bookingState.setIsCancelling(false);
        }
    }
    
    return (
        <div className="appointease-booking">
            <div className="appointease-booking-header">
                <div className="appointease-logo">
                    <span className="logo-icon">A</span>
                </div>
            </div>
            <div className="appointease-booking-content">
                <div className="success-container">
                    <h1 className="success-title">Manage Appointment</h1>
                    
                    <div className="appointment-card">
                        <div className="appointment-id">
                            <span className="id-label">Booking Reference</span>
                            <span className="id-number">{bookingState.appointmentId}</span>
                        </div>
                        
                        <div className="appointment-details">
                            <div className="detail-item">
                                <span className="detail-label">Customer:</span>
                                <span className="detail-value">{bookingState.currentAppointment.name}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Email:</span>
                                <span className="detail-value">{bookingState.currentAppointment.email}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Date & Time:</span>
                                <span className="detail-value">
                                    {new Date(bookingState.currentAppointment.appointment_date).toLocaleDateString()} at {new Date(bookingState.currentAppointment.appointment_date).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Status:</span>
                                <span className="detail-value">{bookingState.currentAppointment.status}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="success-actions">
                        {bookingState.showCancelConfirm ? (
                            <>
                                <div className="success-animation">
                                    <div className="success-icon" style={{background: '#dc3545'}}>
                                        ⚠️
                                    </div>
                                </div>
                                
                                <h1 className="success-title" style={{color: '#dc3545'}}>
                                    Cancel Appointment?
                                </h1>
                                
                                <div className="success-subtitle">
                                    <p>This will permanently cancel your appointment.</p>
                                    <p>This action cannot be undone.</p>
                                    <div className="email-display">
                                        <i className="ri-mail-line"></i>
                                        <strong>Cancellation confirmation will be sent to: {bookingState.currentAppointment?.email}</strong>
                                    </div>
                                </div>
                                
                                <button 
                                    className="action-btn primary-btn" 
                                    style={{background: '#dc3545'}} 
                                    onClick={handleCancelAppointment}
                                    disabled={bookingState.isCancelling}
                                >
                                    {bookingState.isCancelling ? 'Cancelling...' : 'Yes, Cancel Appointment'}
                                </button>
                                <button 
                                    className="action-btn secondary-btn" 
                                    onClick={() => bookingState.setShowCancelConfirm(false)}
                                >
                                    Keep Appointment
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="action-btn secondary-btn" onClick={onReschedule}>
                                    Reschedule
                                </button>
                                <button 
                                    className="action-btn" 
                                    style={{background: '#dc3545'}} 
                                    onClick={() => bookingState.setShowCancelConfirm(true)}
                                >
                                    Cancel
                                </button>
                                <button className="action-btn primary-btn" onClick={onBack}>
                                    Back
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};