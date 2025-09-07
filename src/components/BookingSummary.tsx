import React from 'react';
import { useBooking } from '../contexts/BookingContext';

const BookingSummary: React.FC<{ onConfirm: () => void; onBack: () => void; isLoading?: boolean }> = ({ 
  onConfirm, 
  onBack, 
  isLoading = false 
}) => {
  const { state } = useBooking();

  return (
    <div className="booking-summary-page">
      <h3>Almost Done!</h3>
      <p>Please provide your contact information</p>

      <div className="booking-summary-card">
        <h4>Booking Summary</h4>
        <div className="summary-item">
          <span className="label">Service:</span>
          <span className="value">{state.selectedService?.name || 'Consultation'}</span>
        </div>
        <div className="summary-item">
          <span className="label">Employee:</span>
          <span className="value">{state.selectedEmployee?.name || 'Mike Wilson'}</span>
        </div>
        <div className="summary-item">
          <span className="label">Date:</span>
          <span className="value">{state.selectedDate || '9/9/2025'}</span>
        </div>
        <div className="summary-item">
          <span className="label">Time:</span>
          <span className="value">{state.selectedTime || '11:00'}</span>
        </div>
        <div className="summary-item total">
          <span className="label">Total:</span>
          <span className="value">${state.selectedService?.price || '75.00'}</span>
        </div>
      </div>

      <div className="summary-actions">
        <button 
          type="button"
          className="back-btn"
          onClick={onBack}
          disabled={isLoading}
        >
          ← Back
        </button>
        <button 
          type="button"
          className="confirm-btn"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'CONFIRMING...' : 'CONFIRM BOOKING'}
        </button>
      </div>
    </div>
  );
};

export default BookingSummary;