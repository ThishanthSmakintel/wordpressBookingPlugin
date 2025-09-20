import React from 'react';

interface AppointmentDashboardProps {
  loginEmail: string;
  dashboardRef: React.RefObject<HTMLDivElement>;
  onRefresh: () => void;
  onNewAppointment: () => void;
  onLogout: () => void;
  onReschedule: (appointment: any) => void;
  onCancel: (appointment: any) => void;
}

export const AppointmentDashboard: React.FC<AppointmentDashboardProps> = ({
  loginEmail,
  dashboardRef,
  onRefresh,
  onNewAppointment,
  onLogout,
  onReschedule,
  onCancel
}) => {
  return (
    <div className="appointment-dashboard" ref={dashboardRef}>
      <div className="dashboard-header">
        <h1>My Appointments</h1>
        <div className="dashboard-actions">
          <button onClick={onRefresh}>Refresh</button>
          <button onClick={onNewAppointment}>New Appointment</button>
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>
      
      <div className="appointments-grid">
        {/* Appointments list */}
      </div>
    </div>
  );
};