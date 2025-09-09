import React from 'react';
import { useBookingStore } from '../store/bookingStore';

const BookingSummary: React.FC = () => {
    const { selectedService, selectedEmployee, selectedDate, selectedTime } = useBookingStore();
    return (
        <div className="wp-block-group booking-summary">
            <h3 className="wp-block-heading">Booking Summary</h3>
            <div className="wp-block-group summary-item">
                <span className="has-text-color">Service:</span>
                <span className="has-text-color">{selectedService?.name}</span>
            </div>
            <div className="wp-block-group summary-item">
                <span className="has-text-color">Employee:</span>
                <span className="has-text-color">{selectedEmployee?.name}</span>
            </div>
            <div className="wp-block-group summary-item">
                <span className="has-text-color">Date:</span>
                <span className="has-text-color">{new Date(selectedDate).toLocaleDateString()}</span>
            </div>
            <div className="wp-block-group summary-item">
                <span className="has-text-color">Time:</span>
                <span className="has-text-color">{selectedTime}</span>
            </div>
            <div className="wp-block-group summary-item total">
                <span className="has-text-color">Total:</span>
                <span className="has-text-color">${selectedService?.price}</span>
            </div>
        </div>
    );
};

export default BookingSummary;