import React from 'react';

interface BookingConfirmationProps {
  appointmentId: string;
  onBookAnother: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  appointmentId,
  onBookAnother
}) => {
  return (
    <div className="booking-confirmation">
      <div className="success-animation">
        <div className="success-icon">✓</div>
      </div>
      
      <h1>Booking Confirmed!</h1>
      <div className="appointment-id">
        <span>Your Booking Reference</span>
        <span>{appointmentId}</span>
      </div>
      
      <div className="success-actions">
        <button onClick={onBookAnother}>Book Another</button>
      </div>
    </div>
  );
};