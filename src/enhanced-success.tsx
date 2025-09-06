import React from 'react';

interface SuccessPageProps {
    appointmentId: string;
    selectedService: any;
    selectedEmployee: any;
    selectedDate: string;
    selectedTime: string;
    formData: any;
    onNewBooking: () => void;
    onManageBooking: () => void;
}



const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        const idElement = document.querySelector('.id-number');
        if (idElement) {
            const original = idElement.textContent;
            idElement.textContent = 'Copied!';
            (idElement as HTMLElement).style.background = 'rgba(40, 167, 69, 0.3)';
            
            setTimeout(() => {
                idElement.textContent = original;
                (idElement as HTMLElement).style.background = 'rgba(255,255,255,0.15)';
            }, 2000);
        }
    });
};

export const EnhancedSuccessPage: React.FC<SuccessPageProps> = ({
    appointmentId,
    selectedService,
    selectedEmployee,
    selectedDate,
    selectedTime,
    formData,
    onNewBooking,
    onManageBooking
}) => {
    return (
        <div className="appointease-step-content success-step">
            <div className="success-container">
                <div className="success-animation">
                    <div className="success-icon">
                        <i className="fas fa-check"></i>
                    </div>
                </div>
                
                <h1 className="success-title">Booking Confirmed!</h1>
                <p className="success-subtitle">
                    Your appointment has been successfully scheduled
                </p>
                
                <div className="appointment-card">
                    <div className="appointment-id">
                        <span className="id-label">Your Booking Reference</span>
                        <span 
                            className="id-number" 
                            title="Click to copy" 
                            onClick={() => copyToClipboard(appointmentId)}
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
                            <span className="detail-value">${selectedService?.price?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <div className="info-note">
                    <i className="fas fa-info-circle"></i>
                    Save your booking reference to manage your appointment later.
                </div>
                
                <div className="success-actions">
                    <button className="action-btn secondary-btn" onClick={onManageBooking}>
                        <i className="fas fa-edit"></i> Manage Booking
                    </button>
                    <button className="action-btn primary-btn" onClick={onNewBooking}>
                        <i className="fas fa-plus"></i> Book Another
                    </button>
                </div>
            </div>
        </div>
    );
};