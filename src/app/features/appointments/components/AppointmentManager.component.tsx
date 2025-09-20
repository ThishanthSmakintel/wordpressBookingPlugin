import React from 'react';

interface AppointmentManagerProps {
  bookingState: any;
  onReschedule: () => void;
  onCancel: () => void;
  onBack: () => void;
}

export const AppointmentManager: React.FC<AppointmentManagerProps> = ({ 
  bookingState, 
  onReschedule, 
  onCancel, 
  onBack 
}) => {
  return (
    <div className="appointment-manager">
      <div className="manager-header">
        <h1>Manage Appointment</h1>
      </div>
      
      <div className="appointment-card">
        <div className="appointment-id">
          <span>Booking Reference</span>
          <span>{bookingState.appointmentId}</span>
        </div>
        
        <div className="appointment-details">
          <div className="detail-item">
            <span>Customer:</span>
            <span>{bookingState.currentAppointment?.name}</span>
          </div>
          <div className="detail-item">
            <span>Email:</span>
            <span>{bookingState.currentAppointment?.email}</span>
          </div>
          <div className="detail-item">
            <span>Date & Time:</span>
            <span>
              {bookingState.currentAppointment?.appointment_date && 
                new Date(bookingState.currentAppointment.appointment_date).toLocaleString()
              }
            </span>
          </div>
        </div>
      </div>
      
      <div className="manager-actions">
        {bookingState.showCancelConfirm ? (
          <>
            <div className="cancel-warning">
              <p>This will permanently cancel your appointment. This action cannot be undone.</p>
            </div>
            <button onClick={onCancel} disabled={bookingState.isCancelling}>
              {bookingState.isCancelling ? 'Cancelling...' : 'Yes, Cancel Appointment'}
            </button>
            <button onClick={() => bookingState.setShowCancelConfirm(false)}>
              Keep Appointment
            </button>
          </>
        ) : (
          <>
            <button onClick={onReschedule}>Reschedule</button>
            <button onClick={() => bookingState.setShowCancelConfirm(true)}>Cancel</button>
            <button onClick={onBack}>Back</button>
          </>
        )}
      </div>
    </div>
  );
};