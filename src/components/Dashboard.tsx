import React from 'react';

interface DashboardProps {
    loginEmail: string;
    userAppointments: any[];
    isLoadingAppointments: boolean;
    currentPage: number;
    appointmentsPerPage: number;
    dashboardRef: React.RefObject<HTMLDivElement>;
    onRefresh: () => void;
    onNewAppointment: () => void;
    onLogout: () => void;
    onReschedule: (appointment: any) => void;
    onCancel: (appointment: any) => void;
    setCurrentPage: (page: number) => void;
    sanitizeInput: (input: string) => string;
}

const Dashboard: React.FC<DashboardProps> = ({
    loginEmail,
    userAppointments,
    isLoadingAppointments,
    currentPage,
    appointmentsPerPage,
    dashboardRef,
    onRefresh,
    onNewAppointment,
    onLogout,
    onReschedule,
    onCancel,
    setCurrentPage,
    sanitizeInput
}) => {
    return (
        <div className="appointease-booking">
            <div className="appointease-booking-header">
                <div className="appointease-logo">
                    <span className="logo-icon">A</span>
                </div>
                <div className="user-menu">
                    <button className="logout-btn" onClick={onLogout}>
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
            <div className="appointease-booking-content">
                <div className="dashboard-container" ref={dashboardRef}>
                    <div className="dashboard-header">
                        <div className="dashboard-title-section">
                            <div className="dashboard-welcome">
                                <h2>Welcome back!</h2>
                                <div className="user-info">
                                    <div className="user-avatar">
                                        <i className="fas fa-user"></i>
                                    </div>
                                    <div className="user-details">
                                        <span className="user-email">{loginEmail}</span>
                                        <span className="user-status">
                                            <i className="fas fa-circle online-indicator"></i>
                                            Online
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="dashboard-stats">
                                <div className="stat-card">
                                    <div className="stat-number">{userAppointments.length}</div>
                                    <div className="stat-label">Total Appointments</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-number">
                                        {userAppointments.filter(apt => apt.status === 'confirmed').length}
                                    </div>
                                    <div className="stat-label">Active</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-number">
                                        {userAppointments.filter(apt => {
                                            const aptDate = new Date(apt.date);
                                            const today = new Date();
                                            return aptDate > today && apt.status === 'confirmed';
                                        }).length}
                                    </div>
                                    <div className="stat-label">Upcoming</div>
                                </div>
                            </div>
                        </div>
                        <div className="dashboard-actions">
                            <button className="refresh-btn" onClick={onRefresh} disabled={isLoadingAppointments}>
                                <i className={`fas fa-sync-alt ${isLoadingAppointments ? 'fa-spin' : ''}`}></i>
                                <span className="btn-text">{isLoadingAppointments ? 'Refreshing...' : 'Refresh'}</span>
                            </button>
                            <button className="new-appointment-btn" onClick={onNewAppointment}>
                                <i className="fas fa-plus"></i>
                                <div className="btn-content">
                                    <span className="btn-title">New Appointment</span>
                                    <span className="btn-desc">Book another appointment</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    <div className="appointments-section">
                        <div className="section-header">
                            <h3>Your Appointments</h3>
                            <div className="view-options">
                                <button className="view-btn active" title="Grid View">
                                    <i className="fas fa-th-large"></i>
                                </button>
                                <button className="view-btn" title="List View">
                                    <i className="fas fa-list"></i>
                                </button>
                            </div>
                        </div>
                        
                        {userAppointments.length === 0 ? (
                            <div className="no-appointments">
                                <div className="empty-state-icon">
                                    <i className="fas fa-calendar-times"></i>
                                </div>
                                <h4>No appointments yet</h4>
                                <p>You haven't booked any appointments. Start by booking your first one!</p>
                                <button className="empty-state-btn" onClick={onNewAppointment}>
                                    <i className="fas fa-plus"></i>
                                    Book Your First Appointment
                                </button>
                            </div>
                        ) : (
                            <div className="appointments-grid">
                                {userAppointments
                                    .slice((currentPage - 1) * appointmentsPerPage, currentPage * appointmentsPerPage)
                                    .map(appointment => {
                                        const appointmentDate = new Date(appointment.date);
                                        const isUpcoming = appointmentDate > new Date() && appointment.status === 'confirmed';
                                        const isPast = appointmentDate < new Date();
                                        const timeUntil = isUpcoming ? Math.ceil((appointmentDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                                        
                                        return (
                                            <div key={appointment.id} className={`appointment-card-enhanced ${isUpcoming ? 'upcoming' : ''} ${isPast ? 'past' : ''}`}>
                                                <div className="card-header">
                                                    <div className="appointment-id-badge">
                                                        <span className="id-text">{appointment.id}</span>
                                                    </div>
                                                    <span className={`status-badge ${appointment.status}`}>
                                                        {appointment.status === 'confirmed' && <><i className="fas fa-check-circle"></i> Confirmed</>}
                                                        {appointment.status === 'cancelled' && <><i className="fas fa-times-circle"></i> Cancelled</>}
                                                        {appointment.status === 'rescheduled' && <><i className="fas fa-calendar-alt"></i> Rescheduled</>}
                                                        {appointment.status === 'created' && <><i className="fas fa-plus-circle"></i> Created</>}
                                                    </span>
                                                </div>
                                                
                                                <div className="card-body">
                                                    <div className="appointment-main-info">
                                                        <div className="service-info">
                                                            <h4 className="service-name">
                                                                <i className="fas fa-briefcase"></i>
                                                                {sanitizeInput(appointment.service || 'General Consultation')}
                                                            </h4>
                                                            <div className="staff-info">
                                                                <i className="fas fa-user-md"></i>
                                                                <span>with {sanitizeInput(appointment.staff || 'Dr. Smith')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="appointment-datetime">
                                                        <div className="date-info">
                                                            <div className="date-primary">
                                                                <i className="fas fa-calendar"></i>
                                                                <span className="date-text">
                                                                    {appointmentDate.toLocaleDateString('en-US', { 
                                                                        weekday: 'long', 
                                                                        month: 'short', 
                                                                        day: 'numeric',
                                                                        year: 'numeric'
                                                                    })}
                                                                </span>
                                                            </div>
                                                            <div className="time-info">
                                                                <i className="fas fa-clock"></i>
                                                                <span className="time-text">
                                                                    {appointmentDate.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: true})}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isUpcoming && timeUntil && (
                                                            <div className="countdown-badge">
                                                                <i className="fas fa-hourglass-half"></i>
                                                                {timeUntil === 1 ? 'Tomorrow' : `In ${timeUntil} days`}
                                                            </div>
                                                        )}
                                                        {isPast && appointment.status !== 'cancelled' && (
                                                            <div className="past-badge">
                                                                <i className="fas fa-check"></i>
                                                                Completed
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="card-actions">
                                                    {appointment.status !== 'cancelled' && !isPast && (
                                                        <>
                                                            <button 
                                                                className="action-btn reschedule-btn" 
                                                                onClick={() => onReschedule(appointment)}
                                                                title="Reschedule this appointment"
                                                            >
                                                                <i className="fas fa-calendar-alt"></i>
                                                                <span>Reschedule</span>
                                                            </button>
                                                            <button 
                                                                className="action-btn cancel-btn" 
                                                                onClick={() => onCancel(appointment)}
                                                                title="Cancel this appointment"
                                                            >
                                                                <i className="fas fa-times"></i>
                                                                <span>Cancel</span>
                                                            </button>
                                                        </>
                                                    )}
                                                    {(appointment.status === 'cancelled' || isPast) && (
                                                        <div className="disabled-actions">
                                                            <span className="disabled-text">
                                                                {appointment.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                    
                    {userAppointments.length > appointmentsPerPage && (
                        <div className="pagination">
                            <button 
                                className="pagination-btn" 
                                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                <i className="fas fa-chevron-left"></i> Previous
                            </button>
                            <span className="pagination-info">
                                Page {currentPage} of {Math.ceil(userAppointments.length / appointmentsPerPage)}
                            </span>
                            <button 
                                className="pagination-btn" 
                                onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(userAppointments.length / appointmentsPerPage)))}
                                disabled={currentPage === Math.ceil(userAppointments.length / appointmentsPerPage)}
                            >
                                Next <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;