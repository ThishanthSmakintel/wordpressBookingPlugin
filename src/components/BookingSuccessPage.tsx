import React from 'react';

interface Service {
    name: string;
    price: number;
}

interface Employee {
    name: string;
}

interface FormData {
    email: string;
}

interface BookingSuccessPageProps {
    appointmentId: string;
    selectedService: Service | null;
    selectedEmployee: Employee | null;
    selectedDate: string;
    selectedTime: string;
    formData: FormData;
    onBookAnother: () => void;
}

const BookingSuccessPage: React.FC<BookingSuccessPageProps> = ({
    appointmentId,
    selectedService,
    selectedEmployee,
    selectedDate,
    selectedTime,
    formData,
    onBookAnother
}) => {
    const copyToClipboard = (text: string) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
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
            }).catch(() => {
                // Fallback for clipboard API failure
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
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
        } else {
            // Fallback for browsers without clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
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
        }
    };

    return (
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
                            <span className="detail-value">${parseFloat(selectedService?.price?.toString() || '0').toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            
                <div className="info-note">
                    <i className="fas fa-info-circle"></i>
                    Save your reference for future management.
                </div>
            
                <div className="success-actions">
                    <button className="action-btn primary-btn" onClick={onBookAnother}>
                        <i className="fas fa-plus"></i>
                        Book Another
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingSuccessPage;