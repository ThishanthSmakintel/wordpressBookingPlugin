import React from 'react';
import { formatAppointmentDateTime } from '../utils/dateFormatters';

interface SuccessPageProps {
  type: 'booking' | 'reschedule' | 'cancellation';
  appointmentId?: string;
  email: string;
  selectedDate?: string;
  selectedTime?: string;
  onPrimaryAction: () => void;
  primaryActionText: string;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({
  type,
  appointmentId,
  email,
  selectedDate,
  selectedTime,
  onPrimaryAction,
  primaryActionText
}) => {
  const getSuccessConfig = () => {
    switch (type) {
      case 'reschedule':
        return {
          title: 'Appointment Rescheduled!',
          message: 'Your appointment has been successfully rescheduled.',
          icon: '✓',
          iconBg: 'var(--button-bg, #1CBC9B)'
        };
      case 'cancellation':
        return {
          title: 'Appointment Cancelled',
          message: 'Your appointment has been successfully cancelled.',
          icon: '✕',
          iconBg: '#dc3545'
        };
      default:
        return {
          title: 'Appointment Confirmed!',
          message: 'Your appointment has been successfully booked.',
          icon: '✓',
          iconBg: 'var(--button-bg, #1CBC9B)'
        };
    }
  };

  const config = getSuccessConfig();

  return (
    <div className="appointease-step-content success-step">
      <div className="success-container">
        <div className="success-animation">
          <div className="success-icon" style={{background: config.iconBg}}>
            {config.icon}
          </div>
        </div>
        
        <h1 className="success-title" style={{color: type === 'cancellation' ? '#dc3545' : '#1f2937'}}>
          {config.title}
        </h1>
        
        <div className="success-subtitle">
          <p>{config.message}</p>
          <p>We have sent a confirmation email to:</p>
          <div className="email-display">
            <i className="ri-mail-line"></i>
            <strong>{email}</strong>
          </div>
        </div>
      
        {(type === 'reschedule' || type === 'booking') && appointmentId && (
          <div className="appointment-card">
            <div className="appointment-id">
              <span className="id-label">Your Booking Reference</span>
              <span className="id-number">{appointmentId}</span>
            </div>
            
            {selectedDate && selectedTime && (
              <div className="appointment-details">
                <div className="detail-item">
                  <span className="detail-label">
                    {type === 'reschedule' ? 'New Date and Time:' : 'Date and Time:'}
                  </span>
                  <span className="detail-value">
                    {formatAppointmentDateTime(`${selectedDate} ${selectedTime}`)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      
        <div className="success-actions">
          <button className="action-btn primary-btn" onClick={onPrimaryAction}>
            {primaryActionText}
          </button>
        </div>
      </div>
    </div>
  );
};