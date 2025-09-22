import React from 'react';
import { formatAppointmentDateTime } from '../utils/dateFormatters';

interface RescheduleHeaderProps {
  currentAppointment?: any;
  stepDescription: string;
}

export const RescheduleHeader: React.FC<RescheduleHeaderProps> = ({ 
  currentAppointment, 
  stepDescription 
}) => (
  <div className="reschedule-header">
    <h2><i className="fas fa-calendar-alt"></i> Rescheduling Appointment</h2>
    <div className="current-appointment-info">
      <p><strong>Current Appointment:</strong></p>
      <p>{formatAppointmentDateTime(currentAppointment?.appointment_date)}</p>
    </div>
    <p className="step-description">{stepDescription}</p>
  </div>
);