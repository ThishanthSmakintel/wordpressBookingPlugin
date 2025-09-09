import React, { useState } from 'react';
import { useBookingStore } from '../store/bookingStore';
import { sanitizeInput } from '../utils';

interface DashboardProps {
    loginEmail: string;
    dashboardRef: React.RefObject<HTMLDivElement>;
    onRefresh: () => void;
    onNewAppointment: () => void;
    onLogout: () => void;
    onReschedule: (appointment: any) => void;
    onCancel: (appointment: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
    loginEmail,
    dashboardRef,
    onRefresh,
    onNewAppointment,
    onLogout,
    onReschedule,
    onCancel
}) => {
    const { appointments, appointmentsLoading } = useBookingStore();
    const [currentPage, setCurrentPage] = useState(1);
    const appointmentsPerPage = 6;
    
    console.log('[Dashboard] Component rendered with:', {
        loginEmail,
        appointments: appointments?.length || 0,
        appointmentsLoading,
        appointmentsData: appointments
    });
    return (
        <div className="wp-block-group appointease-booking">
            <div className="wp-block-group appointease-booking-header is-layout-flex wp-block-group-is-layout-flex">
                <div className="wp-block-site-logo appointease-logo">
                    <span className="logo-icon">A</span>
                </div>
                <div className="wp-block-navigation user-menu">
                    <button className="wp-element-button logout-btn" onClick={onLogout}>
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
            <div className="wp-block-group appointease-booking-content">
                <div className="wp-container dashboard-container has-global-padding" ref={dashboardRef}>
                    <div className="wp-block-group dashboard-header">
                        <div className="wp-block-columns dashboard-title-section is-layout-flex">
                            <div className="wp-block-column dashboard-welcome">
                                <h2 className="wp-block-heading has-text-align-left">Welcome back!</h2>
                                <div className="wp-block-media-text user-info is-stacked-on-mobile">
                                    <div className="wp-block-image user-avatar">
                                        <i className="fas fa-user"></i>
                                    </div>
                                    <div className="wp-block-media-text__content user-details">
                                        <span className="has-text-color user-email">{loginEmail}</span>
                                        <span className="wp-block-tag user-status">
                                            <i className="fas fa-circle online-indicator"></i>
                                            Online
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="wp-block-columns dashboard-stats is-layout-grid">
                                <div className="wp-block-column stat-card">
                                    <div className="wp-block-heading stat-number">{appointments.length}</div>
                                    <div className="has-small-font-size stat-label">Total Appointments</div>
                                </div>
                                <div className="wp-block-column stat-card">
                                    <div className="wp-block-heading stat-number">
                                        {appointments.filter(apt => apt.status === 'confirmed').length}
                                    </div>
                                    <div className="has-small-font-size stat-label">Active</div>
                                </div>
                                <div className="wp-block-column stat-card">
                                    <div className="wp-block-heading stat-number">
                                        {appointments.filter(apt => {
                                            const aptDate = new Date(apt.date);
                                            const today = new Date();
                                            return aptDate > today && apt.status === 'confirmed';
                                        }).length}
                                    </div>
                                    <div className="has-small-font-size stat-label">Upcoming</div>
                                </div>
                            </div>
                        </div>
                        <div className="wp-block-buttons dashboard-actions is-layout-flex">
                            <div className="wp-block-button">
                                <button className="wp-element-button refresh-btn" onClick={() => {
                                    console.log('[Dashboard] Refresh clicked, current loading state:', appointmentsLoading);
                                    onRefresh();
                                }} disabled={appointmentsLoading}>
                                    <i className={`fas fa-sync-alt ${appointmentsLoading ? 'fa-spin' : ''}`}></i>
                                    <span className="btn-text">{appointmentsLoading ? 'Refreshing...' : 'Refresh'}</span>
                                </button>
                            </div>
                            <div className="wp-block-button is-style-fill">
                                <button className="wp-element-button new-appointment-btn" onClick={onNewAppointment}>
                                    <i className="fas fa-plus"></i>
                                    <div className="btn-content">
                                        <span className="btn-title">New Appointment</span>
                                        <span className="btn-desc">Book another appointment</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="wp-block-group appointments-section">
                        <div className="wp-block-group section-header is-layout-flex wp-block-group-is-layout-flex">
                            <h3 className="wp-block-heading">Your Appointments</h3>
                            <div className="wp-block-buttons view-options">
                                <div className="wp-block-button is-style-outline">
                                    <button className="wp-element-button view-btn active" title="Grid View">
                                        <i className="fas fa-th-large"></i>
                                    </button>
                                </div>
                                <div className="wp-block-button is-style-outline">
                                    <button className="wp-element-button view-btn" title="List View">
                                        <i className="fas fa-list"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {appointments.length === 0 ? (
                            <div className="wp-block-group no-appointments has-text-align-center">
                                <div className="wp-block-image empty-state-icon">
                                    <i className="fas fa-calendar-times"></i>
                                </div>
                                <h4 className="wp-block-heading">No appointments yet</h4>
                                <p className="has-text-color">You haven't booked any appointments. Start by booking your first one!</p>
                                <div className="wp-block-button">
                                    <button className="wp-element-button empty-state-btn" onClick={onNewAppointment}>
                                        <i className="fas fa-plus"></i>
                                        Book Your First Appointment
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="wp-block-columns appointments-grid is-layout-grid">
                                {appointments
                                    .slice((currentPage - 1) * appointmentsPerPage, currentPage * appointmentsPerPage)
                                    .map(appointment => {
                                        const appointmentDate = new Date(appointment.date);
                                        const isUpcoming = appointmentDate > new Date() && appointment.status === 'confirmed';
                                        const isPast = appointmentDate < new Date();
                                        const timeUntil = isUpcoming ? Math.ceil((appointmentDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                                        
                                        return (
                                            <div key={appointment.id} className={`wp-block-column appointment-card-enhanced ${isUpcoming ? 'upcoming' : ''} ${isPast ? 'past' : ''}`}>
                                                <div className="wp-block-group card-header is-layout-flex wp-block-group-is-layout-flex">
                                                    <div className="wp-block-tag appointment-id-badge">
                                                        <span className="id-text">{appointment.id}</span>
                                                    </div>
                                                    <span className={`wp-block-tag status-badge ${appointment.status}`}>
                                                        {appointment.status === 'confirmed' && <><i className="fas fa-check-circle"></i> Confirmed</>}
                                                        {appointment.status === 'cancelled' && <><i className="fas fa-times-circle"></i> Cancelled</>}
                                                        {appointment.status === 'rescheduled' && <><i className="fas fa-calendar-alt"></i> Rescheduled</>}
                                                        {appointment.status === 'created' && <><i className="fas fa-plus-circle"></i> Created</>}
                                                    </span>
                                                </div>
                                                
                                                <div className="wp-block-group card-body">
                                                    <div className="wp-block-media-text appointment-main-info">
                                                        <div className="wp-block-media-text__content service-info">
                                                            <h4 className="wp-block-heading service-name">
                                                                <i className="fas fa-briefcase"></i>
                                                                {sanitizeInput(appointment.service || 'General Consultation')}
                                                            </h4>
                                                            <div className="has-text-color staff-info">
                                                                <i className="fas fa-user-md"></i>
                                                                <span>with {sanitizeInput(appointment.staff || 'Dr. Smith')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="wp-block-group appointment-datetime">
                                                        <div className="wp-block-columns date-info is-layout-flex">
                                                            <div className="wp-block-column date-primary">
                                                                <i className="fas fa-calendar"></i>
                                                                <span className="has-text-color date-text">
                                                                    {appointmentDate.toLocaleDateString('en-US', { 
                                                                        weekday: 'long', 
                                                                        month: 'short', 
                                                                        day: 'numeric',
                                                                        year: 'numeric'
                                                                    })}
                                                                </span>
                                                            </div>
                                                            <div className="wp-block-column time-info">
                                                                <i className="fas fa-clock"></i>
                                                                <span className="has-text-color time-text">
                                                                    {appointmentDate.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: true})}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isUpcoming && timeUntil && (
                                                            <div className="wp-block-tag countdown-badge">
                                                                <i className="fas fa-hourglass-half"></i>
                                                                {timeUntil === 1 ? 'Tomorrow' : `In ${timeUntil} days`}
                                                            </div>
                                                        )}
                                                        {isPast && appointment.status !== 'cancelled' && (
                                                            <div className="wp-block-tag past-badge">
                                                                <i className="fas fa-check"></i>
                                                                Completed
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="wp-block-buttons card-actions is-layout-flex">
                                                    {appointment.status !== 'cancelled' && !isPast && (
                                                        <>
                                                            <div className="wp-block-button is-style-outline">
                                                                <button 
                                                                    className="wp-element-button action-btn reschedule-btn" 
                                                                    onClick={() => onReschedule(appointment)}
                                                                    title="Reschedule this appointment"
                                                                >
                                                                    <i className="fas fa-calendar-alt"></i>
                                                                    <span>Reschedule</span>
                                                                </button>
                                                            </div>
                                                            <div className="wp-block-button is-style-outline">
                                                                <button 
                                                                    className="wp-element-button action-btn cancel-btn" 
                                                                    onClick={() => onCancel(appointment)}
                                                                    title="Cancel this appointment"
                                                                >
                                                                    <i className="fas fa-times"></i>
                                                                    <span>Cancel</span>
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                    {(appointment.status === 'cancelled' || isPast) && (
                                                        <div className="wp-block-group disabled-actions">
                                                            <span className="has-text-color disabled-text">
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
                    
                    {appointments.length > appointmentsPerPage && (
                        <div className="wp-block-buttons pagination is-layout-flex wp-block-buttons-is-layout-flex">
                            <div className="wp-block-button is-style-outline">
                                <button 
                                    className="wp-element-button pagination-btn" 
                                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    <i className="fas fa-chevron-left"></i> Previous
                                </button>
                            </div>
                            <span className="wp-block-paragraph pagination-info has-text-align-center">
                                Page {currentPage} of {Math.ceil(appointments.length / appointmentsPerPage)}
                            </span>
                            <div className="wp-block-button is-style-outline">
                                <button 
                                    className="wp-element-button pagination-btn" 
                                    onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(appointments.length / appointmentsPerPage)))}
                                    disabled={currentPage === Math.ceil(appointments.length / appointmentsPerPage)}
                                >
                                    Next <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;