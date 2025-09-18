import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../store/bookingStore';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { useValidation } from '../hooks/useValidation';
import BookingSummary from './BookingSummary';

const HeartbeatBookingForm: React.FC = () => {
  const { 
    selectedService, selectedEmployee, selectedDate, selectedTime, formData,
    setFormData, setStep
  } = useBookingStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  const validationSchema = {
    firstName: { required: true, minLength: 2, maxLength: 50 },
    lastName: { required: true, minLength: 2, maxLength: 50 },
    email: { required: true, email: true },
    phone: { required: true, phone: true }
  };

  const { errors, validateForm, clearError } = useValidation(validationSchema);
  const { setErrors } = useBookingStore();

  const { sendHeartbeatData } = useHeartbeat((data) => {
    if (data.validation_errors) {
      setErrors(data.validation_errors);
      setIsSubmitting(false);
    }
    
    if (data.available_slots) {
      setAvailableSlots(data.available_slots);
    }

    if (data.booking_confirmed && data.appointment_id) {
      setStep(5);
      setIsSubmitting(false);
    }

    if (data.error) {
      setErrors({ general: data.error });
      setIsSubmitting(false);
    }
  });

  // Real-time availability check
  useEffect(() => {
    if (selectedDate && selectedEmployee) {
      sendHeartbeatData({
        action: 'check_availability',
        date: selectedDate,
        staff_id: selectedEmployee.id
      });
    }
  }, [selectedDate, selectedEmployee, sendHeartbeatData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ [field]: value });
    clearError(field);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) return;
    setShowSummary(true);
  };

  const handleConfirmBooking = () => {
    setIsSubmitting(true);

    // Send booking confirmation via heartbeat
    sendHeartbeatData({
      action: 'confirm_booking',
      service_id: selectedService?.id,
      staff_id: selectedEmployee?.id,
      date: selectedDate,
      time: selectedTime,
      ...formData
    });

    // Fallback timeout
    setTimeout(() => {
      if (isSubmitting) {
        setIsSubmitting(false);
        setErrors({ general: 'Booking timeout. Please try again.' });
      }
    }, 10000);
  };

  if (showSummary) {
    return <BookingSummary />;
  }

  return (
    <div className="heartbeat-booking-form">

      
      <div className="booking-summary">
        <p><strong>Service:</strong> {selectedService?.name}</p>
        <p><strong>Staff:</strong> {selectedEmployee?.name}</p>
        <p><strong>Date:</strong> {selectedDate}</p>
        <p><strong>Time:</strong> {selectedTime}</p>
        {availableSlots.length > 0 ? (
          <p className="availability-status">✓ Time slot available</p>
        ) : (
          <div className="inline-loading">Checking availability...</div>
        )}
      </div>

      <form onSubmit={handleFormSubmit}>
        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className={errors.firstName ? 'error' : ''}
            maxLength={50}
          />
          {errors.firstName && <span className="error-text">{errors.firstName}</span>}
        </div>

        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className={errors.lastName ? 'error' : ''}
            maxLength={50}
          />
          {errors.lastName && <span className="error-text">{errors.lastName}</span>}
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label>Phone *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={errors.phone ? 'error' : ''}
          />
          {errors.phone && <span className="error-text">{errors.phone}</span>}
        </div>

        {errors.general && (
          <div className="error-message">{errors.general}</div>
        )}

        <div className="form-actions">
          <button 
            type="button"
            className="back-btn"
            onClick={() => setStep(3)}
          >
            Back
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={availableSlots.length === 0}
          >
            Continue to Summary
          </button>
        </div>
      </form>
    </div>
  );
};

export default HeartbeatBookingForm;