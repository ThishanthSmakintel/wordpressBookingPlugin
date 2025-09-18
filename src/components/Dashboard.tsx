import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
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
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
    const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
    const appointmentsPerPage = 6;
    
    // Memoized calculations for better performance
    const { upcomingAppointments, completedAppointments, filteredAppointments, totalPages } = useMemo(() => {
        const today = new Date();
        const upcoming = appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate > today && apt.status !== 'cancelled';
        });
        const completed = appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate <= today && apt.status !== 'cancelled';
        });
        
        let filtered = appointments;
        if (selectedFilter === 'upcoming') {
            filtered = upcoming;
        } else if (selectedFilter === 'completed') {
            filtered = completed;
        }
        
        // Sort by date (newest first)
        filtered = filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return {
            upcomingAppointments: upcoming,
            completedAppointments: completed,
            filteredAppointments: filtered,
            totalPages: Math.ceil(filtered.length / appointmentsPerPage)
        };
    }, [appointments, selectedFilter, appointmentsPerPage]);
    
    const paginatedAppointments = useMemo(() => {
        return filteredAppointments.slice((currentPage - 1) * appointmentsPerPage, currentPage * appointmentsPerPage);
    }, [filteredAppointments, currentPage, appointmentsPerPage]);
    
    console.log('[Dashboard] Component rendered with:', {
        loginEmail,
        appointments: appointments?.length || 0,
        appointmentsLoading,
        appointmentsData: appointments
    });
    return (
        <div className="wp-block-group appointease-booking">
            {/* Single Cohesive Header */}
            <div style={{
                backgroundColor: '#5344F4',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                {/* Left: Logo */}
                <div className="d-flex align-items-center">
                    <span style={{
                        backgroundColor: 'white',
                        color: '#5344F4',
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        marginRight: '16px'
                    }}>A</span>
                </div>
                
                {/* Center: Welcome Message */}
                <div style={{
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '500'
                }}>
                    Welcome back, {loginEmail}
                </div>
                
                {/* Right: Actions */}
                <div className="d-flex align-items-center gap-2">
                    <button 
                        onClick={onLogout}
                        title="Logout"
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'white',
                            width: '40px',
                            height: '40px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                    <button 
                        onClick={() => {
                            console.log('[Dashboard] Refresh clicked, current loading state:', appointmentsLoading);
                            onRefresh();
                        }} 
                        disabled={appointmentsLoading}
                        title="Refresh appointments"
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'white',
                            width: '40px',
                            height: '40px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        <i className={`fas fa-sync-alt ${appointmentsLoading ? 'fa-spin' : ''}`}></i>
                    </button>
                    <Button 
                        onClick={onNewAppointment}
                        style={{
                            backgroundColor: '#28a745',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            fontWeight: '600',
                            fontSize: '14px',
                            color: 'white'
                        }}
                    >
                        <i className="fas fa-plus me-2"></i>
                        New Appointment
                    </Button>
                </div>
            </div>
            
            <div className="dashboard-container" ref={dashboardRef} style={{padding: '24px'}}>
                    
                    <div className="appointments-section">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h3 className="h5 mb-0">Your Appointments</h3>
                            <div className="btn-group d-none d-md-flex" role="group">
                                <Button 
                                    variant={viewMode === 'cards' ? 'primary' : 'secondary'} 
                                    size="sm" 
                                    onClick={() => setViewMode('cards')}
                                    title="Card View"
                                >
                                    <i className="fas fa-th-large"></i>
                                </Button>
                                <Button 
                                    variant={viewMode === 'list' ? 'primary' : 'secondary'} 
                                    size="sm" 
                                    onClick={() => setViewMode('list')}
                                    title="List View"
                                >
                                    <i className="fas fa-list"></i>
                                </Button>
                            </div>
                        </div>
                        
                        {filteredAppointments.length === 0 ? (
                            <Card className="text-center p-5">
                                <Card.Body>
                                    <div className="empty-state-icon mb-3">
                                        <i className="fas fa-calendar-times fa-3x text-muted"></i>
                                    </div>
                                    <h4>
                                        {selectedFilter === 'all' ? 'No appointments yet' : 
                                         selectedFilter === 'upcoming' ? 'No upcoming appointments' : 
                                         'No completed appointments'}
                                    </h4>
                                    <p className="text-muted">
                                        {selectedFilter === 'all' ? "You haven't booked any appointments. Start by booking your first one!" :
                                         selectedFilter === 'upcoming' ? 'You have no upcoming appointments. Book a new one!' :
                                         'You have no completed appointments yet.'}
                                    </p>
                                    <Button variant="primary" onClick={onNewAppointment}>
                                        <i className="fas fa-plus me-2"></i>
                                        Book Your First Appointment
                                    </Button>
                                </Card.Body>
                            </Card>
                        ) : viewMode === 'list' ? (
                            <div className="list-view" style={{backgroundColor: 'white', borderRadius: '8px', border: '1px solid #dee2e6'}}>
                                {paginatedAppointments.map((appointment, index) => {
                                    const appointmentDate = new Date(appointment.date);
                                    const isUpcoming = appointmentDate > new Date() && appointment.status === 'confirmed';
                                    const isPast = appointmentDate < new Date();
                                    
                                    return (
                                        <div key={appointment.id} className="p-3" style={{borderBottom: index < paginatedAppointments.length - 1 ? '1px solid #f8f9fa' : 'none'}}>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="d-flex align-items-center">
                                                    <Badge bg="secondary" className="small me-2">
                                                        {appointment.id}
                                                    </Badge>
                                                    <div className="fw-bold d-flex align-items-center" style={{color: isPast ? '#6c757d' : '#212529'}}>
                                                        <i className="fas fa-briefcase me-2 text-primary" style={{fontSize: '0.8rem'}}></i>
                                                        {sanitizeInput(appointment.service || 'General Consultation')}
                                                    </div>
                                                </div>
                                                <Badge bg={appointment.status === 'confirmed' ? 'success' : appointment.status === 'cancelled' ? 'danger' : 'warning'} className="small">
                                                    <i className={`fas ${
                                                        appointment.status === 'confirmed' ? 'fa-check-circle' :
                                                        appointment.status === 'cancelled' ? 'fa-times-circle' :
                                                        appointment.status === 'rescheduled' ? 'fa-calendar-alt' :
                                                        'fa-plus-circle'
                                                    } me-1`}></i>
                                                    <span className="d-none d-sm-inline">
                                                        {appointment.status === 'confirmed' && 'Confirmed'}
                                                        {appointment.status === 'cancelled' && 'Cancelled'}
                                                        {appointment.status === 'rescheduled' && 'Rescheduled'}
                                                        {appointment.status === 'created' && 'Created'}
                                                    </span>
                                                </Badge>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center text-muted small">
                                                    <i className="fas fa-calendar me-2" style={{fontSize: '0.7rem'}}></i>
                                                    <span className="me-3">
                                                        {appointmentDate.toLocaleDateString('en-US', { 
                                                            weekday: 'short',
                                                            month: 'short', 
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                    <i className="fas fa-clock me-2" style={{fontSize: '0.7rem'}}></i>
                                                    <span className="me-3">
                                                        {appointmentDate.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: true})}
                                                    </span>
                                                    <i className="fas fa-user-md me-2" style={{fontSize: '0.7rem'}}></i>
                                                    <span>{sanitizeInput(appointment.staff || 'Dr. Smith')}</span>
                                                </div>
                                                <div className="d-flex gap-1">
                                                    <Button variant="success" size="sm" disabled={isPast} onClick={() => onReschedule(appointment)} style={{fontSize: '0.7rem', padding: '0.25rem 0.5rem'}}>
                                                        <i className="fas fa-calendar-alt"></i>
                                                        <span className="d-none d-lg-inline ms-1">Reschedule</span>
                                                    </Button>
                                                    <Button variant="danger" size="sm" disabled={isPast} onClick={() => onCancel(appointment)} style={{fontSize: '0.7rem', padding: '0.25rem 0.5rem'}}>
                                                        <i className="fas fa-times"></i>
                                                        <span className="d-none d-lg-inline ms-1">Cancel</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <Row className="g-2 g-md-3 align-items-stretch">
                                {paginatedAppointments.map(appointment => {
                                        const appointmentDate = new Date(appointment.date);
                                        const isUpcoming = appointmentDate > new Date() && appointment.status === 'confirmed';
                                        const isPast = appointmentDate < new Date();
                                        const timeUntil = isUpcoming ? Math.ceil((appointmentDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                                        
                                        return (
                                            <Col key={appointment.id} xs={12} md={6} className="mb-2 mb-md-3 d-flex">
                                                <Card className={`appointment-card border shadow-sm d-flex flex-column h-100 ${isUpcoming ? 'border-start border-success border-3' : ''} ${isPast ? 'opacity-75 border-secondary' : ''}`} style={{boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', border: '1px solid #dee2e6'}}>
                                                <Card.Header className="d-flex justify-content-between align-items-center p-3 bg-light">
                                                    <Badge bg="secondary" className="small">
                                                        {appointment.id}
                                                    </Badge>
                                                    <Badge bg={appointment.status === 'confirmed' ? 'success' : appointment.status === 'cancelled' ? 'danger' : 'warning'} className="small">
                                                        <i className={`fas ${
                                                            appointment.status === 'confirmed' ? 'fa-check-circle' :
                                                            appointment.status === 'cancelled' ? 'fa-times-circle' :
                                                            appointment.status === 'rescheduled' ? 'fa-calendar-alt' :
                                                            'fa-plus-circle'
                                                        } me-1`}></i>
                                                        <span className="d-none d-sm-inline">
                                                            {appointment.status === 'confirmed' && 'Confirmed'}
                                                            {appointment.status === 'cancelled' && 'Cancelled'}
                                                            {appointment.status === 'rescheduled' && 'Rescheduled'}
                                                            {appointment.status === 'created' && 'Created'}
                                                        </span>
                                                    </Badge>
                                                </Card.Header>
                                                
                                                <Card.Body className="p-3 flex-grow-1">
                                                    <div className="mb-2">
                                                        <h6 className="card-title d-flex align-items-center mb-1">
                                                            <i className="fas fa-briefcase me-2 text-primary" style={{fontSize: '0.8rem'}}></i>
                                                            <span className="text-truncate">{sanitizeInput(appointment.service || 'General Consultation')}</span>
                                                        </h6>
                                                        <p className="card-text text-muted small d-flex align-items-center mb-0">
                                                            <i className="fas fa-user-md me-2" style={{fontSize: '0.7rem'}}></i>
                                                            <span className="text-truncate">with {sanitizeInput(appointment.staff || 'Dr. Smith')}</span>
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="appointment-datetime">
                                                        <div className="d-flex flex-column gap-1 mb-2">
                                                            <div className="d-flex align-items-center">
                                                                <i className="fas fa-calendar me-2 text-primary" style={{fontSize: '0.7rem'}}></i>
                                                                <small className="text-truncate">
                                                                    {appointmentDate.toLocaleDateString('en-US', { 
                                                                        weekday: 'short', 
                                                                        month: 'short', 
                                                                        day: 'numeric'
                                                                    })}
                                                                </small>
                                                            </div>
                                                            <div className="d-flex align-items-center">
                                                                <i className="fas fa-clock me-2 text-info" style={{fontSize: '0.7rem'}}></i>
                                                                <small>
                                                                    {appointmentDate.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: true})}
                                                                </small>
                                                            </div>
                                                        </div>
                                                        {isUpcoming && timeUntil && (
                                                            <Badge bg="success" className="small">
                                                                <i className="fas fa-hourglass-half me-1"></i>
                                                                {timeUntil === 1 ? 'Tomorrow' : `${timeUntil}d`}
                                                            </Badge>
                                                        )}
                                                        {isPast && appointment.status !== 'cancelled' && (
                                                            <Badge bg="secondary" className="small">
                                                                <i className="fas fa-check me-1"></i>
                                                                Done
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </Card.Body>
                                                
                                                <Card.Footer className="p-3 bg-light">
                                                    <div className="d-flex gap-1">
                                                        <Button 
                                                            variant="success" 
                                                            size="sm"
                                                            disabled={isPast}
                                                            onClick={() => onReschedule(appointment)}
                                                            title="Reschedule this appointment"
                                                            className="flex-fill"
                                                            style={{fontSize: '0.7rem', padding: '0.25rem 0.5rem'}}
                                                        >
                                                            <i className="fas fa-calendar-alt"></i>
                                                            <span className="d-none d-lg-inline ms-1">Reschedule</span>
                                                        </Button>
                                                        <Button 
                                                            variant="danger" 
                                                            size="sm"
                                                            disabled={isPast}
                                                            onClick={() => onCancel(appointment)}
                                                            title="Cancel this appointment"
                                                            className="flex-fill"
                                                            style={{fontSize: '0.7rem', padding: '0.25rem 0.5rem'}}
                                                        >
                                                            <i className="fas fa-times"></i>
                                                            <span className="d-none d-lg-inline ms-1">Cancel</span>
                                                        </Button>
                                                    </div>
                                                </Card.Footer>
                                                </Card>
                                            </Col>
                                        );
                                    })}
                            </Row>
                        )}
                    </div>
                    
                    {filteredAppointments.length > appointmentsPerPage && (
                        <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
                            <Button 
                                variant="outline-primary"
                                size="sm"
                                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                <i className="fas fa-chevron-left"></i>
                                <span className="d-none d-sm-inline ms-1">Previous</span>
                            </Button>
                            <span className="text-muted small px-2">
                                {currentPage} / {totalPages}
                            </span>
                            <Button 
                                variant="outline-primary"
                                size="sm"
                                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                <span className="d-none d-sm-inline me-1">Next</span>
                                <i className="fas fa-chevron-right"></i>
                            </Button>
                        </div>
                    )}
            </div>
        </div>
    );
};

export default Dashboard;