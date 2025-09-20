import React, { useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../assets/styles/frontend/index.css';

// Force load Remix Icons
if (typeof document !== 'undefined' && !document.querySelector('link[href*="remixicon"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.css';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
}

// Components
import Dashboard from '../../components/pages/Dashboard';
import LoginForm from '../../components/forms/LoginForm';
import ServiceSelector from '../../components/forms/ServiceSelector';
import EmployeeSelector from '../../components/forms/EmployeeSelector';
import DateSelector from '../../components/forms/DateSelector';
import TimeSelector from '../../components/forms/TimeSelector';
import CustomerInfoForm from '../../components/forms/CustomerInfoForm';
import EmailVerification from '../../components/forms/EmailVerification';
import BookingSuccessPage from '../../components/pages/BookingSuccessPage';
import StepProgress from '../../components/ui/StepProgress';
import ConnectionStatus from '../../components/ui/ConnectionStatus';

// Modules
import { DebugPanel } from '../../modules/DebugPanel';
import { AppointmentManager } from '../../modules/AppointmentManager';
import { BookingHeader } from '../../modules/BookingHeader';

// Hooks
import { useBookingState } from '../../hooks/useBookingState';
import { useDebugState } from '../../hooks/useDebugState';
import { useBookingActions } from '../../hooks/useBookingActions';

// Store and utilities
import { useBookingStore } from '../../store/bookingStore';
import { sanitizeInput, generateStrongId } from '../../utils';

declare global {
    interface Window {
        bookingAPI: {
            root: string;
            nonce: string;
        };
        Toastify: any;
    }
}

const BookingApp = React.forwardRef<any, any>((props, ref) => {
    // ✅ Store hooks
    const {
        step, selectedService, selectedEmployee, selectedDate, selectedTime, formData,
        services, employees, appointments, servicesLoading, employeesLoading, appointmentsLoading, 
        isSubmitting, isOnline, errors, serverDate,
        setStep, setSelectedService, setSelectedEmployee, setSelectedDate, setSelectedTime,
        setFormData, setServices, setEmployees, setAppointments, setServicesLoading, 
        setEmployeesLoading, setAppointmentsLoading, setIsSubmitting, setIsOnline, 
        setErrors, setServerDate, clearError
    } = useBookingStore();
    
    // ✅ Custom hooks for state management
    const bookingState = useBookingState();
    const debugState = useDebugState();
    
    // ✅ Refs
    const liveRegionRef = useRef<HTMLDivElement>(null);
    const loginClickedRef = useRef(false);
    const dashboardRef = useRef<HTMLDivElement>(null);
    
    // ✅ Actions hook
    const { checkAvailability, handleManageAppointment, handleSubmit, loadUserAppointmentsRealtime } = useBookingActions(bookingState);

    // ✅ Callbacks
    const calculateCardsPerPage = useCallback(() => {
        if (!dashboardRef.current) return 2;
        const container = dashboardRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const cardMinWidth = 280;
        const cardHeight = 200;
        const gap = 16;
        const cardsPerRow = Math.max(1, Math.floor((containerWidth + gap) / (cardMinWidth + gap)));
        const availableHeight = containerHeight - 200;
        const rowsPerPage = Math.max(1, Math.floor(availableHeight / (cardHeight + gap)));
        const totalCards = cardsPerRow * rowsPerPage;
        return Math.max(1, Math.min(totalCards, 12));
    }, []);

    const loadInitialData = useCallback(async () => {
        if (!window.bookingAPI && !isOnline) {
            setServicesLoading(false);
            setEmployeesLoading(false);
            return;
        }
        
        try {
            setServicesLoading(true);
            const servicesResponse = await fetch(`${window.bookingAPI?.root || '/wp-json/'}booking/v1/services`);
            if (servicesResponse.ok) {
                const servicesData = await servicesResponse.json();
                setServices(servicesData || []);
            }
        } catch (error) {
            setServices([]);
        } finally {
            setServicesLoading(false);
        }
        
        try {
            setEmployeesLoading(true);
            const staffResponse = await fetch(`${window.bookingAPI?.root || '/wp-json/'}booking/v1/staff`);
            if (staffResponse.ok) {
                const staffData = await staffResponse.json();
                setEmployees((staffData || []).map((member: any) => ({
                    ...member,
                    avatar: member.name.split(' ').map((n: string) => n[0]).join(''),
                    rating: 4.8,
                    reviews: 50
                })));
            }
        } catch (error) {
            setEmployees([]);
        } finally {
            setEmployeesLoading(false);
        }
    }, [isOnline, bookingState.retryCount]);

    // ✅ Effects
    useEffect(() => {
        const syncTime = async () => {
            try {
                const response = await fetch(`${window.bookingAPI?.root || '/wp-json/'}appointease/v1/server-date`);
                if (response.ok) {
                    const data = await response.json();
                    setServerDate(data.server_date);
                    debugState.setTimeSynced(true);
                }
            } catch (error) {
                debugState.setTimeSynced(true);
            }
        };
        syncTime();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => debugState.setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!bookingState.showDashboard || !dashboardRef.current) return;
        const updateCardsPerPage = () => {
            const newCardsPerPage = calculateCardsPerPage();
            if (newCardsPerPage !== bookingState.appointmentsPerPage) {
                bookingState.setAppointmentsPerPage(newCardsPerPage);
                bookingState.setCurrentPage(1);
            }
        };
        const resizeObserver = new ResizeObserver(updateCardsPerPage);
        resizeObserver.observe(dashboardRef.current);
        setTimeout(updateCardsPerPage, 100);
        return () => resizeObserver.disconnect();
    }, [bookingState.showDashboard, calculateCardsPerPage, bookingState.appointmentsPerPage]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (!bookingState.isLoggedIn || !bookingState.showDashboard) return;
        const interval = setInterval(() => loadUserAppointmentsRealtime(), 10000);
        return () => clearInterval(interval);
    }, [bookingState.isLoggedIn, bookingState.showDashboard, loadUserAppointmentsRealtime]);

    useEffect(() => {
        if (step === 4 && selectedDate && selectedEmployee) {
            checkAvailability(selectedDate, selectedEmployee.id);
        }
    }, [step, selectedDate, selectedEmployee]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!window.bookingAPI) return;
            try {
                const appointmentsRes = await fetch(`${window.bookingAPI.root}appointease/v1/debug/appointments`);
                if (appointmentsRes.ok) {
                    const data = await appointmentsRes.json();
                    debugState.setAllBookings(data.all_appointments || []);
                }
                
                const servicesRes = await fetch(`${window.bookingAPI.root}booking/v1/services`);
                if (servicesRes.ok) {
                    const servicesData = await servicesRes.json();
                    debugState.setDebugServices(servicesData || []);
                }
                
                const staffRes = await fetch(`${window.bookingAPI.root}booking/v1/staff`);
                if (staffRes.ok) {
                    const staffData = await staffRes.json();
                    debugState.setDebugStaff(staffData || []);
                }
                
                debugState.setWorkingDays(['1', '2', '3', '4', '5']);
                debugState.setDebugTimeSlots(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']);
                
                if (selectedEmployee && selectedDate) {
                    const availRes = await fetch(`${window.bookingAPI.root}booking/v1/availability`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({date: selectedDate, employee_id: selectedEmployee.id})
                    });
                    if (availRes.ok) {
                        const availData = await availRes.json();
                        debugState.setAvailabilityData(availData);
                    }
                }
            } catch (error) {
                console.error('Debug fetch failed:', error);
            }
        };
        
        fetchAllData();
        const interval = setInterval(fetchAllData, 2000);
        return () => clearInterval(interval);
    }, [selectedEmployee, selectedDate]);

    // ✅ useImperativeHandle
    React.useImperativeHandle(ref, () => ({
        setAppointmentId: (id: string) => bookingState.setAppointmentId(id),
        handleManageAppointment: handleManageAppointment
    }));

    // Event handlers
    const handleLogin = () => {
        if (!loginClickedRef.current && !bookingState.showLogin) {
            loginClickedRef.current = true;
            bookingState.setShowLogin(true);
            setTimeout(() => { loginClickedRef.current = false; }, 100);
        }
    };

    // Render logic
    if (bookingState.showLogin) {
        return (
            <LoginForm
                loginEmail={bookingState.loginEmail}
                otpCode={bookingState.otpCode}
                otpSent={bookingState.otpSent}
                isLoadingOTP={bookingState.isLoadingOTP}
                isLoadingLogin={bookingState.isLoadingLogin}
                loginOtpExpiry={bookingState.loginOtpExpiry}
                loginResendCooldown={bookingState.loginResendCooldown}
                loginIsBlocked={bookingState.loginIsBlocked}
                errors={errors}
                onClose={() => bookingState.setShowLogin(false)}
                onEmailChange={bookingState.setLoginEmail}
                onOtpChange={bookingState.setOtpCode}
                onSendOTP={() => {
                    bookingState.setIsLoadingOTP(true);
                    setTimeout(() => {
                        bookingState.setOtpSent(true);
                        bookingState.setIsLoadingOTP(false);
                    }, 1500);
                }}
                onVerifyOTP={() => {
                    bookingState.setIsLoggedIn(true);
                    bookingState.setShowLogin(false);
                    bookingState.setShowDashboard(true);
                    loadUserAppointmentsRealtime(bookingState.loginEmail);
                }}
                onBack={() => {
                    bookingState.setOtpSent(false);
                    bookingState.setOtpCode('');
                    setErrors({});
                }}
                sanitizeInput={sanitizeInput}
            />
        );
    }

    if (bookingState.showDashboard) {
        return (
            <Dashboard
                loginEmail={bookingState.loginEmail}
                dashboardRef={dashboardRef}
                onRefresh={() => loadUserAppointmentsRealtime()}
                onNewAppointment={() => {
                    bookingState.setShowDashboard(false);
                    setStep(1);
                }}
                onLogout={() => {
                    bookingState.setIsLoggedIn(false);
                    bookingState.setShowDashboard(false);
                    bookingState.setLoginEmail('');
                    setStep(1);
                }}
                onReschedule={(appointment) => {
                    bookingState.setCurrentAppointment({
                        id: appointment.id,
                        name: appointment.name || bookingState.loginEmail,
                        email: appointment.email || bookingState.loginEmail,
                        appointment_date: appointment.date,
                        status: appointment.status,
                        service_name: appointment.service,
                        staff_name: appointment.staff
                    });
                    setSelectedService({name: appointment.service, price: 0});
                    setSelectedEmployee({id: 1, name: appointment.staff});
                    bookingState.setIsRescheduling(true);
                    bookingState.setShowDashboard(false);
                    setStep(3);
                }}
                onCancel={(appointment) => {
                    bookingState.setCurrentAppointment({
                        id: appointment.id,
                        name: appointment.name || bookingState.loginEmail,
                        email: appointment.email || bookingState.loginEmail,
                        appointment_date: appointment.date,
                        status: appointment.status
                    });
                    bookingState.setShowCancelConfirm(true);
                    bookingState.setShowDashboard(false);
                    bookingState.setManageMode(true);
                }}
            />
        );
    }

    if (bookingState.manageMode && bookingState.currentAppointment) {
        return (
            <AppointmentManager
                bookingState={bookingState}
                onReschedule={() => {
                    setSelectedService({name: bookingState.currentAppointment?.service_name, price: 0});
                    setSelectedEmployee({id: 1, name: bookingState.currentAppointment?.staff_name});
                    bookingState.setIsRescheduling(true);
                    setStep(3); 
                    bookingState.setManageMode(false);
                }}
                onCancel={() => {
                    bookingState.setIsCancelling(true);
                    setTimeout(() => {
                        bookingState.setManageMode(false);
                        bookingState.setCurrentAppointment(null);
                        bookingState.setShowCancelConfirm(false);
                        setStep(8);
                        bookingState.setIsCancelling(false);
                    }, 500);
                }}
                onBack={() => bookingState.setManageMode(false)}
            />
        );
    }

    return (
        <>
            <DebugPanel debugState={debugState} bookingState={bookingState} />
            
            <div className="appointease-booking wp-block-group" role="main" aria-label="Appointment booking system">
                <div ref={liveRegionRef} className="live-region" aria-live="polite" aria-atomic="true"></div>
                <ConnectionStatus />
                
                <BookingHeader
                    bookingState={bookingState}
                    onLogin={handleLogin}
                    onDashboard={() => bookingState.setShowDashboard(true)}
                    onLogout={() => {
                        bookingState.setIsLoggedIn(false);
                        bookingState.setShowDashboard(false);
                        bookingState.setLoginEmail('');
                        setStep(1);
                    }}
                />

                <div className="appointease-booking-content wp-block-group">
                    {step <= 6 && step > 0 && <StepProgress />}
                    
                    {step === 1 && (
                        <ServiceSelector
                            onRetry={loadInitialData}
                            columns={props.columns || 2}
                        />
                    )}

                    {step === 2 && (
                        <EmployeeSelector onRetry={loadInitialData} />
                    )}

                    {step === 3 && (
                        <DateSelector isReschedule={bookingState.isRescheduling} />
                    )}

                    {step === 4 && (
                        <TimeSelector
                            unavailableSlots={bookingState.unavailableSlots}
                            timezone={bookingState.timezone}
                            bookingDetails={bookingState.bookingDetails}
                        />
                    )}

                    {step === 5 && (
                        <div className="appointease-step-content">
                            {bookingState.isRescheduling && (
                                <>
                                    <div className="reschedule-banner">
                                        <i className="fas fa-calendar-alt"></i>
                                        <span>Rescheduling Appointment {bookingState.appointmentId}</span>
                                    </div>
                                    <h2>Confirm New Time</h2>
                                    <p className="step-description">Review your new appointment details</p>
                                </>
                            )}
                            {!bookingState.isRescheduling && !bookingState.isLoggedIn && !bookingState.showEmailVerification && (
                                <CustomerInfoForm
                                    isLoggedIn={bookingState.isLoggedIn}
                                    isCheckingEmail={bookingState.isCheckingEmail}
                                    existingUser={bookingState.existingUser}
                                    onSubmit={handleSubmit}
                                    onBack={() => setStep(4)}
                                    checkExistingEmail={() => {}}
                                />
                            )}
                            
                            {!bookingState.isRescheduling && !bookingState.isLoggedIn && bookingState.showEmailVerification && (
                                <EmailVerification
                                    emailOtp={bookingState.emailOtp}
                                    otpExpiry={bookingState.otpExpiry}
                                    resendCooldown={bookingState.resendCooldown}
                                    isBlocked={bookingState.isBlocked}
                                    isVerifyingEmail={bookingState.isVerifyingEmail}
                                    onOtpChange={bookingState.setEmailOtp}
                                    onVerifyOtp={() => {
                                        bookingState.setEmailVerified(true);
                                        bookingState.setShowEmailVerification(false);
                                        setStep(6);
                                    }}
                                    onResendOtp={() => {}}
                                    onBack={() => {
                                        bookingState.setShowEmailVerification(false);
                                        bookingState.setEmailOtp('');
                                        setErrors({});
                                    }}
                                />
                            )}
                            
                            {bookingState.isRescheduling && (
                                <div className="reschedule-summary">
                                    <div className="booking-summary">
                                        <h3>New Appointment Time</h3>
                                        <div className="summary-item">
                                            <span>Date:</span>
                                            <span>{new Date(selectedDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span>Time:</span>
                                            <span>{selectedTime}</span>
                                        </div>
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="back-btn" onClick={() => setStep(4)}>← Back</button>
                                        <button type="button" className="confirm-btn" onClick={() => {
                                            bookingState.setIsReschedulingSubmit(true);
                                            setTimeout(() => {
                                                bookingState.setManageMode(false);
                                                bookingState.setCurrentAppointment(null);
                                                bookingState.setIsRescheduling(false);
                                                setStep(9);
                                                bookingState.setIsReschedulingSubmit(false);
                                            }, 1000);
                                        }} disabled={bookingState.isReschedulingSubmit}>
                                            {bookingState.isReschedulingSubmit ? 'RESCHEDULING...' : 'CONFIRM RESCHEDULE'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 6 && (
                        <div className="appointease-step-content">
                            <div className="review-container">
                                <h2>Review & Confirm</h2>
                                <p className="step-description">Please review your appointment details before confirming</p>
                                
                                <div className="booking-summary">
                                    <h3>Appointment Summary</h3>
                                    <div className="summary-item">
                                        <span>Service:</span>
                                        <span>{selectedService?.name}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Staff:</span>
                                        <span>{selectedEmployee?.name}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Date:</span>
                                        <span>{new Date(selectedDate).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Time:</span>
                                        <span>{selectedTime}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Customer:</span>
                                        <span>{bookingState.isLoggedIn ? bookingState.loginEmail : `${formData.firstName} (${formData.email})`}</span>
                                    </div>
                                    <div className="summary-item total">
                                        <span>Total Price:</span>
                                        <span>${selectedService?.price}</span>
                                    </div>
                                </div>
                                
                                <div className="form-actions">
                                    <button type="button" className="back-btn" onClick={() => setStep(4)}>← Edit Time</button>
                                    <button type="button" className="confirm-btn" onClick={handleSubmit} disabled={isSubmitting}>
                                        {isSubmitting ? 'BOOKING...' : 'CONFIRM BOOKING'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 7 && (
                        <BookingSuccessPage
                            appointmentId={bookingState.appointmentId}
                            onBookAnother={() => {
                                setStep(1);
                                setSelectedService(null);
                                setSelectedEmployee(null);
                                setSelectedDate('');
                                setSelectedTime('');
                                setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                                bookingState.setAppointmentId('');
                                setErrors({});
                            }}
                        />
                    )}

                    {step === 8 && (
                        <div className="appointease-step-content success-step">
                            <div className="success-container">
                                <div className="success-animation">
                                    <div className="success-icon" style={{background: '#dc3545'}}>✕</div>
                                </div>
                                
                                <h1 className="success-title" style={{color: '#dc3545'}}>Appointment Cancelled</h1>
                                <div className="success-subtitle">
                                    <p>Your appointment has been successfully cancelled.</p>
                                    <p>We've sent a confirmation email to:</p>
                                    <div className="email-display">
                                        <i className="ri-mail-line"></i>
                                        <strong>{bookingState.currentAppointment?.email || bookingState.loginEmail}</strong>
                                    </div>
                                </div>
                            
                                <div className="success-actions">
                                    <button className="action-btn primary-btn" onClick={() => {
                                        if (bookingState.isLoggedIn) {
                                            bookingState.setShowDashboard(true);
                                            loadUserAppointmentsRealtime(bookingState.loginEmail);
                                        } else {
                                            setStep(1);
                                            setSelectedService(null);
                                            setSelectedEmployee(null);
                                            setSelectedDate('');
                                            setSelectedTime('');
                                            setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                                            bookingState.setAppointmentId('');
                                            bookingState.setManageMode(false);
                                            bookingState.setCurrentAppointment(null);
                                            setErrors({});
                                        }
                                    }}>
                                        {bookingState.isLoggedIn ? 'Show All Bookings' : 'Back to Booking'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 9 && (
                        <div className="appointease-step-content success-step">
                            <div className="success-container">
                                <div className="success-animation">
                                    <div className="success-icon" style={{background: '#1CBC9B'}}>✓</div>
                                </div>
                                
                                <h1 className="success-title">Appointment Rescheduled!</h1>
                                <div className="success-subtitle">
                                    <p>Your appointment has been successfully rescheduled.</p>
                                    <div className="email-display">
                                        <i className="ri-mail-line"></i>
                                        <strong>{bookingState.currentAppointment?.email || bookingState.loginEmail}</strong>
                                    </div>
                                </div>
                            
                                <div className="appointment-card">
                                    <div className="appointment-id">
                                        <span className="id-label">Your Booking Reference</span>
                                        <span className="id-number">{bookingState.appointmentId}</span>
                                    </div>
                                    
                                    <div className="appointment-details">
                                        <div className="detail-item">
                                            <span className="detail-label">New Date & Time:</span>
                                            <span className="detail-value">
                                                {new Date(selectedDate).toLocaleDateString('en', { 
                                                    weekday: 'long', 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })} at {selectedTime}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            
                                <div className="success-actions">
                                    <button className="action-btn primary-btn" onClick={() => {
                                        if (bookingState.isLoggedIn) {
                                            bookingState.setShowDashboard(true);
                                            loadUserAppointmentsRealtime(bookingState.loginEmail);
                                        } else {
                                            setStep(1);
                                            setSelectedService(null);
                                            setSelectedEmployee(null);
                                            setSelectedDate('');
                                            setSelectedTime('');
                                            setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                                            bookingState.setAppointmentId('');
                                            bookingState.setManageMode(false);
                                            bookingState.setCurrentAppointment(null);
                                            bookingState.setIsRescheduling(false);
                                            setErrors({});
                                        }
                                    }}>
                                        {bookingState.isLoggedIn ? 'Show All Bookings' : 'Book Another'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
});

// Initialize app
window.BookingApp = null;
const activeRoots = new Map();

function initBookingApp(containerId: string) {
    const bookingContainer = document.getElementById(containerId);
    if (!bookingContainer || activeRoots.has(containerId)) return;
    
    bookingContainer.innerHTML = '';
    const root = createRoot(bookingContainer);
    const appRef = React.createRef();
    activeRoots.set(containerId, root);
    root.render(<BookingApp ref={appRef} />);
    
    setTimeout(() => {
        if (appRef.current) {
            window.BookingApp = {
                setAppointmentId: (id: string) => appRef.current.setAppointmentId(id),
                handleManageAppointment: () => appRef.current.handleManageAppointment()
            };
        }
    }, 100);
}

if (typeof window !== 'undefined') {
    window.initBookingApp = initBookingApp;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initBookingApp('appointease-booking');
            initBookingApp('appointease-booking-editor');
        });
    } else {
        initBookingApp('appointease-booking');
        initBookingApp('appointease-booking-editor');
    }
}

export default BookingApp;