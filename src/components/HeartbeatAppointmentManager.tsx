import React, { useState, useEffect } from 'react';
import { useHeartbeat } from '../hooks/useHeartbeat';

interface Appointment {
  id: string;
  service_name: string;
  staff_name: string;
  appointment_date: string;
  status: string;
  name: string;
  email: string;
}

const HeartbeatAppointmentManager: React.FC<{ userEmail: string }> = ({ userEmail }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState<string | null>(null);

  const { sendHeartbeatData } = useHeartbeat((data) => {
    if (data.appointments) {
      setAppointments(data.appointments);
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
      setIsLoading(false);
      setIsCancelling(null);
      setIsRescheduling(null);
    }
  }, userEmail);

  useEffect(() => {
    // Initial load
    if (isInitialLoad) {
      sendHeartbeatData({
        action: 'get_user_data',
        user_email: userEmail
      });
    }
  }, [userEmail, sendHeartbeatData, isInitialLoad]);

  const handleRefresh = () => {
    setIsLoading(true);
    sendHeartbeatData({
      action: 'get_user_data',
      user_email: userEmail
    });
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleCancel = (appointmentId: string) => {
    setIsCancelling(appointmentId);
    sendHeartbeatData({
      action: 'cancel_appointment',
      appointment_id: appointmentId,
      user_email: userEmail
    });
    setTimeout(() => setIsCancelling(null), 3000);
  };

  const handleReschedule = (appointmentId: string, newDate: string, newTime: string) => {
    setIsRescheduling(appointmentId);
    sendHeartbeatData({
      action: 'reschedule_appointment',
      appointment_id: appointmentId,
      new_date: newDate,
      new_time: newTime,
      user_email: userEmail
    });
    setTimeout(() => setIsRescheduling(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="heartbeat-appointment-manager">
      <div className="appointments-header">
        <h3>Your Appointments</h3>
        <button 
          className="refresh-btn"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {appointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        <div className="appointments-list">
          {appointments.map(appointment => (
            <div key={appointment.id} className="appointment-card">
              <div className="appointment-header">
                <h4>{appointment.id}</h4>
                <span className={`status ${appointment.status}`}>
                  {appointment.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                </span>
              </div>
              
              <div className="appointment-details">
                <p><strong>Service:</strong> {appointment.service_name}</p>
                <p><strong>Staff:</strong> {appointment.staff_name}</p>
                <p><strong>Date:</strong> {new Date(appointment.appointment_date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {new Date(appointment.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                
                <div className="appointment-dates">
                  <p className="created-date">
                    <strong>Created:</strong> {new Date(appointment.created_at).toLocaleDateString()}
                  </p>
                  
                  {appointment.rescheduled_at && (
                    <>
                      <p className="rescheduled-tag">
                        <span className="reschedule-badge">Rescheduled</span>
                      </p>
                      <p className="rescheduled-date">
                        <strong>Rescheduled:</strong> {new Date(appointment.rescheduled_at).toLocaleDateString()}
                      </p>
                      {appointment.original_date && (
                        <p className="original-date">
                          <strong>Original Date:</strong> {new Date(appointment.original_date).toLocaleDateString()} at {new Date(appointment.original_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {appointment.status === 'confirmed' && (
                <div className="appointment-actions">
                  <button 
                    className="cancel-btn"
                    onClick={() => handleCancel(appointment.id)}
                    disabled={isCancelling === appointment.id || isRescheduling === appointment.id}
                  >
                    {isCancelling === appointment.id ? 'Cancelling...' : 'Cancel'}
                  </button>
                  <button 
                    className="reschedule-btn"
                    onClick={() => {
                      const newDate = prompt('Enter new date (YYYY-MM-DD):');
                      const newTime = prompt('Enter new time (HH:MM):');
                      if (newDate && newTime) {
                        handleReschedule(appointment.id, newDate, newTime);
                      }
                    }}
                    disabled={isCancelling === appointment.id || isRescheduling === appointment.id}
                  >
                    {isRescheduling === appointment.id ? 'Rescheduling...' : 'Manage'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeartbeatAppointmentManager;