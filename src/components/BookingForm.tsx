import React, { useState } from 'react';
import { useBooking } from '../contexts/BookingContext';
import { useAPI } from '../hooks/useAPI';

const BookingForm: React.FC = () => {
  const { state, dispatch } = useBooking();
  const { loading, request } = useAPI();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!state.formData.firstName.trim()) newErrors.firstName = 'First name required';
    if (!state.formData.lastName.trim()) newErrors.lastName = 'Last name required';
    if (!state.formData.email.trim()) newErrors.email = 'Email required';
    if (!state.formData.phone.trim()) newErrors.phone = 'Phone required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const result = await request('appointease/v1/book', {
        method: 'POST',
        body: JSON.stringify({
          service_id: state.selectedService.id,
          staff_id: state.selectedEmployee.id,
          date: state.selectedDate,
          time: state.selectedTime,
          ...state.formData
        })
      });

      dispatch({ type: 'SET_APPOINTMENT_ID', payload: result.appointment_id });
      dispatch({ type: 'SET_STEP', payload: 5 });
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    dispatch({ type: 'SET_FORM_DATA', payload: { [field]: value } });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="booking-form">
      <h3>Your Details</h3>
      
      <div className="booking-summary">
        <p><strong>Service:</strong> {state.selectedService?.name}</p>
        <p><strong>Staff:</strong> {state.selectedEmployee?.name}</p>
        <p><strong>Date:</strong> {state.selectedDate}</p>
        <p><strong>Time:</strong> {state.selectedTime}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            value={state.formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className={errors.firstName ? 'error' : ''}
          />
          {errors.firstName && <span className="error-text">{errors.firstName}</span>}
        </div>

        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            value={state.formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className={errors.lastName ? 'error' : ''}
          />
          {errors.lastName && <span className="error-text">{errors.lastName}</span>}
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={state.formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label>Phone *</label>
          <input
            type="tel"
            value={state.formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={errors.phone ? 'error' : ''}
          />
          {errors.phone && <span className="error-text">{errors.phone}</span>}
        </div>

        <div className="form-actions">
          <button 
            type="button"
            className="back-btn"
            onClick={() => dispatch({ type: 'SET_STEP', payload: 3 })}
          >
            Back
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;