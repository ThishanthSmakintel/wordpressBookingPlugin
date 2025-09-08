import React from 'react';
import { useBookingStore } from '../store/bookingStore';

const BookingSummary: React.FC = () => {
    const { selectedService, selectedEmployee, selectedDate, selectedTime } = useBookingStore();
    return (
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
    );
};

export default BookingSummary;