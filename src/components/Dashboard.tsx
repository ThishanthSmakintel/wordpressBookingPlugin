import React, { useState } from 'react';
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
    const appointmentsPerPage = 6;
    
    // Calculate stats correctly
    const totalAppointments = appointments.length;
    const upcomingAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        const today = new Date();
        return aptDate > today && apt.status !== 'cancelled';
    });
    const completedAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        const today = new Date();
        return aptDate <= today && apt.status !== 'cancelled';
    });
    
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
                <Container fluid className="dashboard-container" ref={dashboardRef}>
                    <Card className="dashboard-header mb-4">
                        <Card.Body className="p-3">
                            <Row className="align-items-md-center g-3">
                                {/* Welcome Section */}
                                <Col xs={12} md={3}>
                                    <div>
                                        <h2 className="mb-1 h5">Welcome back!</h2>
                                        <div className="d-flex align-items-center">
                                            <div className="user-avatar me-2">
                                                <i className="fas fa-user"></i>
                                            </div>
                                            <div>
                                                <div className="user-email small fw-medium text-truncate">{loginEmail}</div>
                                                <Badge bg="success" size="sm" className="user-status">
                                                    <i className="fas fa-circle me-1" style={{fontSize: '0.6em'}}></i>
                                                    Online
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                                
                                {/* Stats Section */}
                                <Col xs={12} md={6}>
                                    <Row className="g-2">
                                        <Col xs={12} sm={4}>
                                            <div className="stat-card text-center">
                                                <div className="stat-number h6 mb-0">{totalAppointments}</div>
                                                <div className="stat-label small text-muted">Total</div>
                                            </div>
                                        </Col>
                                        <Col xs={12} sm={4}>
                                            <div className="stat-card text-center">
                                                <div className="stat-number h6 mb-0 text-primary">{upcomingAppointments.length}</div>
                                                <div className="stat-label small text-muted">Upcoming</div>
                                            </div>
                                        </Col>
                                        <Col xs={12} sm={4}>
                                            <div className="stat-card text-center">
                                                <div className="stat-number h6 mb-0 text-success">{completedAppointments.length}</div>
                                                <div className="stat-label small text-muted">Completed</div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Col>
                                
                                {/* Action Buttons */}
                                <Col xs={12} md={3}>
                                    <div className="d-flex flex-column flex-md-row gap-2">
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm"
                                            onClick={() => {
                                                console.log('[Dashboard] Refresh clicked, current loading state:', appointmentsLoading);
                                                onRefresh();
                                            }} 
                                            disabled={appointmentsLoading}
                                            title="Refresh appointments"
                                            className="flex-fill"
                                        >
                                            <i className={`fas fa-sync-alt ${appointmentsLoading ? 'fa-spin' : ''} me-1`}></i>
                                            <span className="d-none d-lg-inline">{appointmentsLoading ? 'Refreshing...' : 'Refresh'}</span>
                                        </Button>
                                        <Button 
                                            variant="primary" 
                                            size="sm"
                                            onClick={onNewAppointment}
                                            className="flex-fill"
                                        >
                                            <i className="fas fa-plus me-1"></i>
                                            <span className="d-none d-lg-inline">New</span>
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                    
                    <div className="appointments-section">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h3 className="h5 mb-0">Your Appointments</h3>
                            <div className="btn-group d-none d-md-flex" role="group">
                                <Button variant="outline-secondary" size="sm" className="active" title="Grid View">
                                    <i className="fas fa-th-large"></i>
                                </Button>
                                <Button variant="outline-secondary" size="sm" title="List View">
                                    <i className="fas fa-list"></i>
                                </Button>
                            </div>
                        </div>
                        
                        {(() => {
                            let filteredAppointments = appointments;
                            if (selectedFilter === 'upcoming') {
                                filteredAppointments = upcomingAppointments;
                            } else if (selectedFilter === 'completed') {
                                filteredAppointments = completedAppointments;
                            }
                            return filteredAppointments;
                        })().length === 0 ? (
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
                        ) : (
                            <Row className="g-2 g-md-3">
                                {(() => {
                                    let filteredAppointments = appointments;
                                    if (selectedFilter === 'upcoming') {
                                        filteredAppointments = upcomingAppointments;
                                    } else if (selectedFilter === 'completed') {
                                        filteredAppointments = completedAppointments;
                                    }
                                    return filteredAppointments.slice((currentPage - 1) * appointmentsPerPage, currentPage * appointmentsPerPage);
                                })()
                                    .map(appointment => {
                                        const appointmentDate = new Date(appointment.date);
                                        const isUpcoming = appointmentDate > new Date() && appointment.status === 'confirmed';
                                        const isPast = appointmentDate < new Date();
                                        const timeUntil = isUpcoming ? Math.ceil((appointmentDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                                        
                                        return (
                                            <Col key={appointment.id} xs={12} sm={6} lg={4} className="mb-2 mb-md-3">
                                                <Card className={`appointment-card h-100 border-0 shadow-sm ${isUpcoming ? 'border-start border-success border-3' : ''} ${isPast ? 'opacity-75' : ''}`}>
                                                <Card.Header className="d-flex justify-content-between align-items-center p-2 bg-light">
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
                                                
                                                <Card.Body className="p-2 p-md-3">
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
                                                
                                                <Card.Footer className="p-2 bg-light">
                                                    {appointment.status !== 'cancelled' && !isPast && (
                                                        <div className="d-flex gap-1">
                                                            <Button 
                                                                variant="outline-primary" 
                                                                size="sm"
                                                                onClick={() => onReschedule(appointment)}
                                                                title="Reschedule this appointment"
                                                                className="flex-fill"
                                                            >
                                                                <i className="fas fa-calendar-alt"></i>
                                                                <span className="d-none d-sm-inline ms-1">Reschedule</span>
                                                            </Button>
                                                            <Button 
                                                                variant="outline-danger" 
                                                                size="sm"
                                                                onClick={() => onCancel(appointment)}
                                                                title="Cancel this appointment"
                                                                className="flex-fill"
                                                            >
                                                                <i className="fas fa-times"></i>
                                                                <span className="d-none d-sm-inline ms-1">Cancel</span>
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {(appointment.status === 'cancelled' || isPast) && (
                                                        <div className="text-center">
                                                            <small className="text-muted fst-italic">
                                                                {appointment.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                                                            </small>
                                                        </div>
                                                    )}
                                                </Card.Footer>
                                                </Card>
                                            </Col>
                                        );
                                    })}
                            </Row>
                        )}
                    </div>
                    
                    {(() => {
                        let filteredAppointments = appointments;
                        if (selectedFilter === 'upcoming') {
                            filteredAppointments = upcomingAppointments;
                        } else if (selectedFilter === 'completed') {
                            filteredAppointments = completedAppointments;
                        }
                        return filteredAppointments.length > appointmentsPerPage;
                    })() && (
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
                                {currentPage} / {(() => {
                                    let filteredAppointments = appointments;
                                    if (selectedFilter === 'upcoming') {
                                        filteredAppointments = upcomingAppointments;
                                    } else if (selectedFilter === 'completed') {
                                        filteredAppointments = completedAppointments;
                                    }
                                    return Math.ceil(filteredAppointments.length / appointmentsPerPage);
                                })()}
                            </span>
                            <Button 
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                    let filteredAppointments = appointments;
                                    if (selectedFilter === 'upcoming') {
                                        filteredAppointments = upcomingAppointments;
                                    } else if (selectedFilter === 'completed') {
                                        filteredAppointments = completedAppointments;
                                    }
                                    setCurrentPage(Math.min(currentPage + 1, Math.ceil(filteredAppointments.length / appointmentsPerPage)));
                                }}
                                disabled={(() => {
                                    let filteredAppointments = appointments;
                                    if (selectedFilter === 'upcoming') {
                                        filteredAppointments = upcomingAppointments;
                                    } else if (selectedFilter === 'completed') {
                                        filteredAppointments = completedAppointments;
                                    }
                                    return currentPage === Math.ceil(filteredAppointments.length / appointmentsPerPage);
                                })()}
                            >
                                <span className="d-none d-sm-inline me-1">Next</span>
                                <i className="fas fa-chevron-right"></i>
                            </Button>
                        </div>
                    )}
                </Container>
            </div>
        </div>
    );
};

export default Dashboard;