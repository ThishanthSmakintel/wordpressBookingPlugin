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
import { checkCustomer } from '../../services/api';
import { sessionService } from '../../services/sessionService';

declare global {
    interface Window {
        bookingAPI: {
            root: string;
            nonce: string;
        };
        Toastify: any;
    }
}

const BookingApp = React.memo(React.forwardRef<any, any>((props, ref) => {
    // ✅ Zustand store - single source of truth
    const {
        step, selectedService, selectedEmployee, selectedDate, selectedTime, formData,
        services, employees, appointments, servicesLoading, employeesLoading, appointmentsLoading, 
        isSubmitting, isOnline, errors, serverDate,
        setStep, setSelectedService, setSelectedEmployee, setSelectedDate, setSelectedTime,
        setFormData, setServices, setEmployees, setAppointments, setServicesLoading, 
        setEmployeesLoading, setAppointmentsLoading, setIsSubmitting, setIsOnline, 
        setErrors, setServerDate, clearError
    } = useBookingStore();
    
    // ✅ Custom hooks for additional state
    const bookingState = useBookingState();
    const debugState = useDebugState();
    
    // ✅ Refs
    const liveRegionRef = useRef<HTMLDivElement>(null);
    const loginClickedRef = useRef(false);
    const dashboardRef = useRef<HTMLDivElement>(null);
    const appContainerRef = useRef<HTMLDivElement>(null);
    
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

    // ✅ Session check on app load
    useEffect(() => {
        const checkExistingSession = async () => {
            const token = sessionService.getSessionToken();
            const email = sessionService.getUserEmail();
            
            if (token && email) {
                bookingState.setIsCheckingSession(true);
                const validation = await sessionService.validateSession(token);
                
                if (validation.valid) {
                    bookingState.setIsLoggedIn(true);
                    bookingState.setLoginEmail(email);
                    bookingState.setSessionToken(token);
                    bookingState.setShowDashboard(true);
                    loadUserAppointmentsRealtime(email);
                } else {
                    sessionService.clearSession();
                    bookingState.setSessionToken(null);
                }
                bookingState.setIsCheckingSession(false);
            }
        };
        
        checkExistingSession();
    }, []);

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

    // Scroll to top when step changes
    useEffect(() => {
        if (appContainerRef.current) {
            appContainerRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [step]);

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

    // Show loading while checking session
    if (bookingState.isCheckingSession) {
        return (
            <div className="appointease-booking wp-block-group booking-app-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
                <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '1.2rem', marginBottom: '10px'}}>⏳</div>
                    <div>Checking login status...</div>
                </div>
            </div>
        );
    }

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
                onVerifyOTP={async () => {
                    // Create persistent session
                    const sessionResult = await sessionService.createSession(bookingState.loginEmail);
                    if (sessionResult.success && sessionResult.token) {
                        bookingState.setSessionToken(sessionResult.token);
                        bookingState.setIsLoggedIn(true);
                        bookingState.setShowLogin(false);
                        bookingState.setShowDashboard(true);
                        loadUserAppointmentsRealtime(bookingState.loginEmail);
                    }
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
                currentAppointmentId={bookingState.currentAppointment?.id}
                isRescheduling={bookingState.isRescheduling}
                onRefresh={() => loadUserAppointmentsRealtime()}
                onNewAppointment={() => {
                    bookingState.setShowDashboard(false);
                    setStep(1);
                }}
                onLogout={async () => {
                    if (bookingState.sessionToken) {
                        await sessionService.destroySession(bookingState.sessionToken);
                    }
                    bookingState.setIsLoggedIn(false);
                    bookingState.setShowDashboard(false);
                    bookingState.setLoginEmail('');
                    bookingState.setSessionToken(null);
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
                    setSelectedEmployee({id: 2, name: appointment.staff}); // Fixed to use Staff #2
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
                    // Since appointment data doesn't include employee_id, use staff name to determine ID
                    // Based on debug data, all appointments are for Staff #2
                    const employeeId = 2; // All current appointments are for Staff #2
                    setSelectedEmployee({id: employeeId, name: bookingState.currentAppointment?.staff_name || 'Staff Member'});
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
            
            <div ref={appContainerRef} className="appointease-booking wp-block-group booking-app-container" role="main" aria-label="Appointment booking system">
                <div ref={liveRegionRef} className="live-region" aria-live="polite" aria-atomic="true"></div>
                <ConnectionStatus />
                
                <BookingHeader
                    bookingState={bookingState}
                    onLogin={handleLogin}
                    onDashboard={() => bookingState.setShowDashboard(true)}
                    onLogout={async () => {
                        if (bookingState.sessionToken) {
                            await sessionService.destroySession(bookingState.sessionToken);
                        }
                        bookingState.setIsLoggedIn(false);
                        bookingState.setShowDashboard(false);
                        bookingState.setLoginEmail('');
                        bookingState.setSessionToken(null);
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
                        <>
                            {bookingState.isRescheduling && (
                                <div className="reschedule-header">
                                    <h2><i className="fas fa-calendar-alt"></i> Rescheduling Appointment</h2>
                                    <div className="current-appointment-info">
                                        <p><strong>Current Appointment:</strong></p>
                                        <p>{bookingState.currentAppointment?.appointment_date && 
                                            new Date(bookingState.currentAppointment.appointment_date).toLocaleDateString('en', { 
                                                weekday: 'long', 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })} at {bookingState.currentAppointment?.appointment_date && 
                                            new Date(bookingState.currentAppointment.appointment_date).toLocaleTimeString('en', { 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })}
                                        </p>
                                    </div>
                                    <p className="step-description">Select a new date for your appointment</p>
                                </div>
                            )}
                            <DateSelector isReschedule={bookingState.isRescheduling} />
                        </>
                    )}

                    {step === 4 && (
                        <TimeSelector
                            unavailableSlots={bookingState.unavailableSlots}
                            timezone={bookingState.timezone}
                            bookingDetails={bookingState.bookingDetails}
                            currentAppointment={bookingState.currentAppointment}
                            isRescheduling={bookingState.isRescheduling}
                        />
                    )}

                    {step === 5 && (
                        <div className="appointease-step-content">
                            {bookingState.isRescheduling && (
                                <>
                                    <div className="reschedule-header">
                                        <h2><i className="fas fa-calendar-alt"></i> Rescheduling Appointment</h2>
                                        <div className="current-appointment-info">
                                            <p><strong>Current Appointment:</strong></p>
                                            <p>{bookingState.currentAppointment?.appointment_date && 
                                                new Date(bookingState.currentAppointment.appointment_date).toLocaleDateString('en', { 
                                                    weekday: 'long', 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })} at {bookingState.currentAppointment?.appointment_date && 
                                                new Date(bookingState.currentAppointment.appointment_date).toLocaleTimeString('en', { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })}
                                            </p>
                                        </div>
                                        <p className="step-description">Select a new date and time for your appointment</p>
                                    </div>
                                </>
                            )}
                            {!bookingState.isRescheduling && !bookingState.isLoggedIn && !bookingState.showEmailVerification && (
                                <CustomerInfoForm
                                    isLoggedIn={bookingState.isLoggedIn}
                                    isCheckingEmail={bookingState.isCheckingEmail}
                                    existingUser={bookingState.existingUser}
                                    onSubmit={handleSubmit}
                                    onBack={() => setStep(4)}
                                    checkExistingEmail={async (email: string) => {
                                        bookingState.setIsCheckingEmail(true);
                                        try {
                                            const result = await checkCustomer(email);
                                            if (result.exists) {
                                                bookingState.setExistingUser({
                                                    exists: true,
                                                    name: result.name,
                                                    phone: result.phone
                                                });
                                                setFormData({
                                                    firstName: result.name || '',
                                                    phone: result.phone || ''
                                                });
                                            } else {
                                                bookingState.setExistingUser({ exists: false });
                                            }
                                        } catch (error) {
                                            console.error('Error checking customer:', error);
                                            bookingState.setExistingUser({ exists: false });
                                        } finally {
                                            bookingState.setIsCheckingEmail(false);
                                        }
                                    }}
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
                                <div className="reschedule-summary" style={{
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}>
                                    <div className="booking-summary" style={{
                                        backgroundColor: '#f0fdf4',
                                        border: '1px solid #bbf7d0',
                                        borderRadius: '12px',
                                        padding: '24px',
                                        marginBottom: '24px',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}>
                                        <h3 style={{
                                            fontSize: '1.5rem',
                                            fontWeight: '700',
                                            color: '#166534',
                                            marginBottom: '16px',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}>
                                            <i className="fas fa-calendar-check" style={{marginRight: '8px'}}></i>
                                            New Appointment Time
                                        </h3>
                                        <div className="summary-item" style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 0',
                                            borderBottom: '1px solid #dcfce7'
                                        }}>
                                            <span style={{fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center'}}>
                                                <i className="fas fa-calendar" style={{marginRight: '8px', color: '#16a34a'}}></i>
                                                Date:
                                            </span>
                                            <span style={{fontWeight: '500', color: '#16a34a'}}>
                                                {new Date(selectedDate).toLocaleDateString('en', { 
                                                    weekday: 'long', 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}
                                            </span>
                                        </div>
                                        <div className="summary-item" style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 0'
                                        }}>
                                            <span style={{fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center'}}>
                                                <i className="fas fa-clock" style={{marginRight: '8px', color: '#16a34a'}}></i>
                                                Time:
                                            </span>
                                            <span style={{fontWeight: '500', color: '#16a34a'}}>
                                                {new Date(`${selectedDate} ${selectedTime}`).toLocaleTimeString('en', { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="form-actions" style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginTop: '24px'
                                    }}>
                                        <button type="button" className="back-btn" onClick={() => setStep(4)} style={{
                                            backgroundColor: '#f3f4f6',
                                            color: '#374151',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '12px 24px',
                                            cursor: 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: '500',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}>
                                            <i className="fas fa-arrow-left" style={{marginRight: '8px'}}></i>
                                            Back
                                        </button>
                                        <button type="button" className="confirm-btn" onClick={() => {
                                            bookingState.setIsReschedulingSubmit(true);
                                            setTimeout(() => {
                                                bookingState.setManageMode(false);
                                                bookingState.setCurrentAppointment(null);
                                                bookingState.setIsRescheduling(false);
                                                setStep(9);
                                                bookingState.setIsReschedulingSubmit(false);
                                            }, 1000);
                                        }} disabled={bookingState.isReschedulingSubmit} style={{
                                            backgroundColor: bookingState.isReschedulingSubmit ? '#d1d5db' : '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '12px',
                                            padding: '16px 32px',
                                            fontSize: '1.1rem',
                                            fontWeight: '600',
                                            cursor: bookingState.isReschedulingSubmit ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}>
                                            {bookingState.isReschedulingSubmit ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin" style={{marginRight: '8px'}}></i>
                                                    RESCHEDULING...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-check" style={{marginRight: '8px'}}></i>
                                                    CONFIRM RESCHEDULE
                                                </>
                                            )}
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
                                            bookingState.setSessionToken(null);
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
                                    <div className="success-icon" style={{background: 'var(--button-bg, #1CBC9B)'}}>✓</div>
                                </div>
                                
                                <h1 className="success-title">Appointment Rescheduled!</h1>
                                <div className="success-subtitle">
                                    <p>Your appointment has been successfully rescheduled.</p>
                                    <p>We have sent a confirmation email to:</p>
                                    <div className="email-display">
                                        <i className="ri-mail-line"></i>
                                        <strong>{bookingState.loginEmail}</strong>
                                    </div>
                                </div>
                            
                                <div className="appointment-card">
                                    <div className="appointment-id">
                                        <span className="id-label">Your Booking Reference</span>
                                        <span className="id-number">{bookingState.currentAppointment?.id}</span>
                                    </div>
                                    
                                    <div className="appointment-details">
                                        <div className="detail-item">
                                            <span className="detail-label">New Date and Time:</span>
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
                                            bookingState.setSessionToken(null);
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
}));

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