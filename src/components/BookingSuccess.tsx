import React from 'react';
import { useBooking } from '../contexts/BookingContext';

const BookingSuccess: React.FC = () => {
  const { state, dispatch } = useBooking();

  const handleNewBooking = () => {
    dispatch({ type: 'RESET_BOOKING' });
  };

  return (
    <div className="booking-success">
      <div className="success-icon">✓</div>
      <h3>Booking Confirmed!</h3>
      
      <div className="appointment-details">
        <p><strong>Appointment ID:</strong> {state.appointmentId}</p>
        <p><strong>Service:</strong> {state.selectedService?.name}</p>
        <p><strong>Staff:</strong> {state.selectedEmployee?.name}</p>
        <p><strong>Date:</strong> {state.selectedDate}</p>
        <p><strong>Time:</strong> {state.selectedTime}</p>
        <p><strong>Name:</strong> {state.formData.firstName} {state.formData.lastName}</p>
        <p><strong>Email:</strong> {state.formData.email}</p>
      </div>

      <div className="success-actions">
        <button 
          className="primary-btn"
          onClick={handleNewBooking}
        >
          Book Another Appointment
        </button>
      </div>

      <div className="next-steps">
        <h4>What's Next?</h4>
        <ul>
          <li>You'll receive a confirmation email shortly</li>
          <li>Save your appointment ID for future reference</li>
          <li>You can reschedule or cancel using your appointment ID</li>
        </ul>
      </div>
    </div>
  );
};

export default BookingSuccess;