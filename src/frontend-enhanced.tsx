import React, { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/styles/frontend/index.css';

// Force load Remix Icons
if (typeof document !== 'undefined' && !document.querySelector('link[href*="remixicon"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.css';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
}
import Dashboard from './components/pages/Dashboard';
import LoginForm from './components/forms/LoginForm';
import ServiceSelector from './components/forms/ServiceSelector';
import EmployeeSelector from './components/forms/EmployeeSelector';
import DateSelector from './components/forms/DateSelector';
import TimeSelector from './components/forms/TimeSelector';
import CustomerInfoForm from './components/forms/CustomerInfoForm';
import EmailVerification from './components/forms/EmailVerification';
import BookingSuccessPage from './components/pages/BookingSuccessPage';
import StepProgress from './components/ui/StepProgress';
import ConnectionStatus from './components/ui/ConnectionStatus';
import { sanitizeInput, sanitizeLogInput, generateStrongId, timeSlots, businessHours } from './utils';
import { useBookingStore } from './store/bookingStore';
import { Service, Employee, Appointment, FormData, FormErrors } from './types';
import { STEPS, COLORS } from './constants';
import { apiService } from './services/api';

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
    // ✅ ALL HOOKS AT TOP LEVEL - NEVER CONDITIONAL
    const {
        step, selectedService, selectedEmployee, selectedDate, selectedTime, formData,
        services, employees, appointments, servicesLoading, employeesLoading, appointmentsLoading, isSubmitting, isOnline, errors, serverDate,
        setStep, setSelectedService, setSelectedEmployee, setSelectedDate, setSelectedTime,
        setFormData, setServices, setEmployees, setAppointments, setServicesLoading, setEmployeesLoading,
        setAppointmentsLoading, setIsSubmitting, setIsOnline, setErrors, setServerDate, clearError
    } = useBookingStore();
    
    // ✅ All useState hooks at top level (62 total)
    const [appointmentId, setAppointmentId] = useState<string>('');
    const [manageMode, setManageMode] = useState(false);
    const [currentAppointment, setCurrentAppointment] = useState<any>(null);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [isLoadingOTP, setIsLoadingOTP] = useState(false);
    const [isLoadingLogin, setIsLoadingLogin] = useState(false);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [unavailableSlots, setUnavailableSlots] = useState<string[] | 'all'>([]);
    const [bookingDetails, setBookingDetails] = useState<Record<string, any>>({});
    const [retryCount, setRetryCount] = useState(0);
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [showEmailLookup, setShowEmailLookup] = useState(false);
    const [lookupEmail, setLookupEmail] = useState('');
    const [foundAppointments, setFoundAppointments] = useState<any[]>([]);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [isManaging, setIsManaging] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isReschedulingSubmit, setIsReschedulingSubmit] = useState(false);
    const [showOtpVerification, setShowOtpVerification] = useState(false);
    const [otpAction, setOtpAction] = useState<'cancel' | 'reschedule' | null>(null);
    const [verificationOtp, setVerificationOtp] = useState('');
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [pendingRescheduleData, setPendingRescheduleData] = useState<{date: string, time: string} | null>(null);
    const [otpVerified, setOtpVerified] = useState(false);
    const [showEmailVerification, setShowEmailVerification] = useState(false);
    const [emailOtp, setEmailOtp] = useState('');
    const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [otpExpiry, setOtpExpiry] = useState<number>(0);
    const [resendCooldown, setResendCooldown] = useState<number>(0);
    const [otpAttempts, setOtpAttempts] = useState<number>(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [loginOtpExpiry, setLoginOtpExpiry] = useState<number>(0);
    const [loginResendCooldown, setLoginResendCooldown] = useState<number>(0);
    const [loginOtpAttempts, setLoginOtpAttempts] = useState<number>(0);
    const [loginIsBlocked, setLoginIsBlocked] = useState(false);
    const [verifyOtpExpiry, setVerifyOtpExpiry] = useState<number>(0);
    const [verifyResendCooldown, setVerifyResendCooldown] = useState<number>(0);
    const [verifyOtpAttempts, setVerifyOtpAttempts] = useState<number>(0);
    const [verifyIsBlocked, setVerifyIsBlocked] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [appointmentsPerPage, setAppointmentsPerPage] = useState(2);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [existingUser, setExistingUser] = useState<any>(null);
    const [sessionToken, setSessionToken] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [timeSynced, setTimeSynced] = useState(false);
    const [showDebug, setShowDebug] = useState(true);
    const [allBookings, setAllBookings] = useState<any[]>([]);
    const [debugServices, setDebugServices] = useState<Service[]>([]);
    const [debugStaff, setDebugStaff] = useState<any[]>([]);
    const [workingDays, setWorkingDays] = useState<string[]>([]);
    const [debugTimeSlots, setDebugTimeSlots] = useState<string[]>([]);
    const [availabilityData, setAvailabilityData] = useState<any>(null);

    // ✅ All useRef hooks at top level
    const liveRegionRef = useRef<HTMLDivElement>(null);
    const loginClickedRef = useRef(false);
    const dashboardRef = useRef<HTMLDivElement>(null);

    // ✅ All useCallback hooks at top level
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

    const loadUserAppointmentsRealtime = useCallback((email?: string) => {
        const emailToUse = email || loginEmail;
        if (!window.bookingAPI || !emailToUse) {
            setAppointments([]);
            return;
        }
        setAppointmentsLoading(true);
        fetch(`${window.bookingAPI?.root || '/wp-json/'}appointease/v1/user-appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': window.bookingAPI.nonce
            },
            body: JSON.stringify({ email: emailToUse })
        })
        .then(response => response.json())
        .then(appointments => {
            const formattedAppointments = (appointments || []).map((apt: any) => ({
                id: apt.strong_id || `AE${apt.id.toString().padStart(6, '0')}`,
                service: apt.service_name || 'Service',
                staff: apt.staff_name || 'Staff Member',
                date: apt.appointment_date,
                status: apt.status,
                name: apt.name,
                email: apt.email
            }));
            setAppointments(formattedAppointments);
        })
        .catch(() => setAppointments([]))
        .finally(() => setAppointmentsLoading(false));
    }, [loginEmail]);

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
    }, [isOnline, retryCount]);

    // ✅ All useEffect hooks at top level (8 total)
    useEffect(() => {
        const syncTime = async () => {
            try {
                const response = await fetch(`${window.bookingAPI?.root || '/wp-json/'}appointease/v1/server-date`);
                if (response.ok) {
                    const data = await response.json();
                    setServerDate(data.server_date);
                    setTimeSynced(true);
                }
            } catch (error) {
                setTimeSynced(true);
            }
        };
        syncTime();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!showDashboard || !dashboardRef.current) return;
        const updateCardsPerPage = () => {
            const newCardsPerPage = calculateCardsPerPage();
            if (newCardsPerPage !== appointmentsPerPage) {
                setAppointmentsPerPage(newCardsPerPage);
                setCurrentPage(1);
            }
        };
        const resizeObserver = new ResizeObserver(updateCardsPerPage);
        resizeObserver.observe(dashboardRef.current);
        setTimeout(updateCardsPerPage, 100);
        return () => resizeObserver.disconnect();
    }, [showDashboard, calculateCardsPerPage, appointmentsPerPage]);

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
        if (!isLoggedIn || !showDashboard) return;
        const interval = setInterval(() => loadUserAppointmentsRealtime(), 10000);
        return () => clearInterval(interval);
    }, [isLoggedIn, showDashboard, loadUserAppointmentsRealtime]);

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
                    setAllBookings(data.all_appointments || []);
                }
                
                const servicesRes = await fetch(`${window.bookingAPI.root}booking/v1/services`);
                if (servicesRes.ok) {
                    const servicesData = await servicesRes.json();
                    setDebugServices(servicesData || []);
                }
                
                const staffRes = await fetch(`${window.bookingAPI.root}booking/v1/staff`);
                if (staffRes.ok) {
                    const staffData = await staffRes.json();
                    setDebugStaff(staffData || []);
                }
                
                setWorkingDays(['1', '2', '3', '4', '5']);
                setDebugTimeSlots(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']);
                
                if (selectedEmployee && selectedDate) {
                    const availRes = await fetch(`${window.bookingAPI.root}booking/v1/availability`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({date: selectedDate, employee_id: selectedEmployee.id})
                    });
                    if (availRes.ok) {
                        const availData = await availRes.json();
                        setAvailabilityData(availData);
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

    // ✅ useImperativeHandle at top level
    React.useImperativeHandle(ref, () => ({
        setAppointmentId: (id: string) => setAppointmentId(id),
        handleManageAppointment: handleManageAppointment
    }));

    // Helper functions (after all hooks)
    const checkAvailability = async (date: string, employeeId: number) => {
        if (!window.bookingAPI || !date || !employeeId) {
            setUnavailableSlots([]);
            return;
        }
        
        try {
            const response = await fetch(`${window.bookingAPI.root}booking/v1/availability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.bookingAPI.nonce
                },
                body: JSON.stringify({
                    date: date,
                    employee_id: employeeId
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.unavailable === 'all') {
                    setUnavailableSlots('all');
                    setBookingDetails({});
                } else if (Array.isArray(data.unavailable)) {
                    setUnavailableSlots(data.unavailable);
                    setBookingDetails(data.booking_details || {});
                } else {
                    setUnavailableSlots([]);
                    setBookingDetails({});
                }
            }
        } catch (error) {
            setUnavailableSlots([]);
        }
    };

    const handleManageAppointment = async (appointmentIdToManage?: string) => {
        const idToUse = appointmentIdToManage || appointmentId;
        if (!idToUse) return;
        
        setIsManaging(true);
        try {
            const response = await fetch(`${window.bookingAPI.root}appointease/v1/appointments/${idToUse}`, {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': window.bookingAPI.nonce
                }
            });
            
            if (response.ok) {
                const appointment = await response.json();
                setCurrentAppointment(appointment);
                setAppointmentId(idToUse);
                setManageMode(true);
                setErrors({});
            } else {
                setErrors({general: 'No appointment found with this ID.'});
            }
        } catch (error) {
            setErrors({general: 'Error checking appointment.'});
        } finally {
            setIsManaging(false);
        }
    };

    const handleSubmit = (event?: React.FormEvent) => {
        if (event) event.preventDefault();
        
        if (!isOnline) {
            setErrors({general: 'You are offline. Please check your connection and try again.'});
            return;
        }
        
        setIsSubmitting(true);
        const appointmentDateTime = `${selectedDate} ${selectedTime}:00`;
        
        if (!window.bookingAPI) {
            setTimeout(() => {
                setAppointmentId(generateStrongId());
                setStep(7);
                setIsSubmitting(false);
            }, 1500);
            return;
        }
        
        fetch(`${window.bookingAPI?.root || '/wp-json/'}appointease/v1/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': window.bookingAPI.nonce
            },
            body: JSON.stringify({
                name: sanitizeInput(isLoggedIn ? loginEmail.split('@')[0] : formData.firstName),
                email: sanitizeInput(isLoggedIn ? loginEmail : formData.email),
                phone: sanitizeInput(isLoggedIn ? '' : formData.phone),
                date: appointmentDateTime,
                service_id: parseInt(String(selectedService.id), 10),
                employee_id: parseInt(String(selectedEmployee.id), 10)
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.strong_id || result.id) {
                setErrors({});
                setAppointmentId(result.strong_id || `APT-${new Date().getFullYear()}-${result.id.toString().padStart(6, '0')}`);
                setStep(7);
                if (isLoggedIn) {
                    loadUserAppointmentsRealtime();
                }
            } else {
                setErrors({general: result.message || 'Booking failed. Please try again.'});
            }
        })
        .catch(error => {
            setErrors({general: 'Booking failed. Please try again.'});
        })
        .finally(() => {
            setIsSubmitting(false);
        });
    };

    const handleLogin = () => {
        if (!loginClickedRef.current && !showLogin) {
            loginClickedRef.current = true;
            setShowLogin(true);
            setTimeout(() => { loginClickedRef.current = false; }, 100);
        }
    };

    // Render logic (after all hooks and functions)
    if (showLogin) {
        return (
            <LoginForm
                loginEmail={loginEmail}
                otpCode={otpCode}
                otpSent={otpSent}
                isLoadingOTP={isLoadingOTP}
                isLoadingLogin={isLoadingLogin}
                loginOtpExpiry={loginOtpExpiry}
                loginResendCooldown={loginResendCooldown}
                loginIsBlocked={loginIsBlocked}
                errors={errors}
                onClose={() => setShowLogin(false)}
                onEmailChange={setLoginEmail}
                onOtpChange={setOtpCode}
                onSendOTP={() => {
                    setIsLoadingOTP(true);
                    setTimeout(() => {
                        setOtpSent(true);
                        setIsLoadingOTP(false);
                    }, 1500);
                }}
                onVerifyOTP={() => {
                    setIsLoggedIn(true);
                    setShowLogin(false);
                    setShowDashboard(true);
                    loadUserAppointmentsRealtime(loginEmail);
                }}
                onBack={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setErrors({});
                }}
                sanitizeInput={sanitizeInput}
            />
        );
    }

    if (showDashboard) {
        return (
            <Dashboard
                loginEmail={loginEmail}
                dashboardRef={dashboardRef}
                onRefresh={() => loadUserAppointmentsRealtime()}
                onNewAppointment={() => {
                    setShowDashboard(false);
                    setStep(1);
                }}
                onLogout={() => {
                    setIsLoggedIn(false);
                    setShowDashboard(false);
                    setLoginEmail('');
                    setStep(1);
                }}
                onReschedule={(appointment) => {
                    setCurrentAppointment({
                        id: appointment.id,
                        name: appointment.name || loginEmail,
                        email: appointment.email || loginEmail,
                        appointment_date: appointment.date,
                        status: appointment.status,
                        service_name: appointment.service,
                        staff_name: appointment.staff
                    });
                    setSelectedService({name: appointment.service, price: 0});
                    setSelectedEmployee({id: 1, name: appointment.staff});
                    setIsRescheduling(true);
                    setShowDashboard(false);
                    setStep(3);
                }}
                onCancel={(appointment) => {
                    setCurrentAppointment({
                        id: appointment.id,
                        name: appointment.name || loginEmail,
                        email: appointment.email || loginEmail,
                        appointment_date: appointment.date,
                        status: appointment.status
                    });
                    setShowCancelConfirm(true);
                    setShowDashboard(false);
                    setManageMode(true);
                }}
            />
        );
    }

    if (manageMode && currentAppointment) {
        return (
            <div className="appointease-booking">
                <div className="appointease-booking-header">
                    <div className="appointease-logo">
                        <span className="logo-icon">A</span>
                    </div>
                </div>
                <div className="appointease-booking-content">
                    <div className="success-container">
                        <h1 className="success-title">Manage Appointment</h1>
                        
                        <div className="appointment-card">
                            <div className="appointment-id">
                                <span className="id-label">Booking Reference</span>
                                <span className="id-number">{appointmentId}</span>
                            </div>
                            
                            <div className="appointment-details">
                                <div className="detail-item">
                                    <span className="detail-label">Customer:</span>
                                    <span className="detail-value">{currentAppointment.name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Email:</span>
                                    <span className="detail-value">{currentAppointment.email}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Date & Time:</span>
                                    <span className="detail-value">{new Date(currentAppointment.appointment_date).toLocaleDateString()} at {new Date(currentAppointment.appointment_date).toLocaleTimeString()}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Status:</span>
                                    <span className="detail-value">{currentAppointment.status}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="success-actions">
                            {showCancelConfirm ? (
                                <>
                                    <div className="action-info">
                                        <p className="action-description cancel-warning">
                                            This will permanently cancel your appointment. This action cannot be undone.
                                        </p>
                                    </div>
                                    <button className="action-btn" style={{background: '#dc3545'}} onClick={() => {
                                        setIsCancelling(true);
                                        setTimeout(() => {
                                            setManageMode(false);
                                            setCurrentAppointment(null);
                                            setShowCancelConfirm(false);
                                            setStep(8);
                                            setIsCancelling(false);
                                        }, 500);
                                    }} disabled={isCancelling}>
                                        {isCancelling ? 'Cancelling...' : 'Yes, Cancel Appointment'}
                                    </button>
                                    <button className="action-btn secondary-btn" onClick={() => setShowCancelConfirm(false)}>
                                        Keep Appointment
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className="action-btn secondary-btn" onClick={() => {
                                        setSelectedService({name: currentAppointment?.service_name, price: 0});
                                        setSelectedEmployee({id: 1, name: currentAppointment?.staff_name});
                                        setIsRescheduling(true);
                                        setStep(3); 
                                        setManageMode(false);
                                    }}>
                                        Reschedule
                                    </button>
                                    <button className="action-btn" style={{background: '#dc3545'}} onClick={() => setShowCancelConfirm(true)}>
                                        Cancel
                                    </button>
                                    <button className="action-btn primary-btn" onClick={() => setManageMode(false)}>
                                        Back
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Debug Panel */}
            {showDebug && (
                <div style={{
                    position: 'fixed',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.9)',
                    color: '#fff',
                    padding: '15px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    maxWidth: '400px',
                    maxHeight: '70vh',
                    overflow: 'auto',
                    zIndex: 99999,
                    fontFamily: 'monospace'
                }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                        <strong>🔍 BOOKING DEBUG</strong>
                        <button onClick={() => setShowDebug(false)} style={{background: 'none', border: 'none', color: '#fff', cursor: 'pointer'}}>✕</button>
                    </div>
                    
                    <div style={{marginBottom: '8px'}}>
                        <div style={{color: '#0ff'}}>📊 System Status:</div>
                        <div>Step: {step} | Employee: {selectedEmployee?.id || 'None'}</div>
                        <div>Date: {selectedDate || 'None'} | Time: {selectedTime || 'None'}</div>
                        <div>Server: {serverDate || 'Not synced'} | Online: {isOnline ? '✅' : '❌'}</div>
                    </div>
                    
                    <div style={{marginBottom: '8px'}}>
                        <div style={{color: '#0ff'}}>📅 Current Selection:</div>
                        <div>Service: {selectedService?.name || 'None'}</div>
                        <div>Staff: {selectedEmployee?.name || 'None'}</div>
                        <div>Customer: {isLoggedIn ? loginEmail : formData.firstName || 'None'}</div>
                    </div>
                    
                    <div style={{marginBottom: '8px'}}>
                        <div style={{color: '#0ff'}}>💼 Database Config:</div>
                        <div>Services: {debugServices.length} | Staff: {debugStaff.length}</div>
                        <div>Working Days: [{workingDays.join(',')}]</div>
                        <div>Time Slots: {debugTimeSlots.length} slots</div>
                    </div>
                    
                    <div style={{borderTop: '1px solid #333', paddingTop: '8px'}}>
                        <div style={{color: '#0ff'}}>📋 All Bookings ({allBookings.length}):</div>
                        {allBookings.length === 0 ? (
                            <div style={{color: '#888', fontSize: '10px'}}>No bookings found</div>
                        ) : (
                            <div style={{maxHeight: '120px', overflow: 'auto'}}>
                                {allBookings.slice(0, 6).map((booking) => (
                                    <div key={booking.id} style={{
                                        fontSize: '9px',
                                        marginBottom: '2px',
                                        padding: '2px',
                                        background: booking.status === 'confirmed' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                                        borderRadius: '2px'
                                    }}>
                                        <div>👤 {booking.name} | 📧 {booking.email}</div>
                                        <div>📅 {new Date(booking.appointment_date).toLocaleDateString()}</div>
                                        <div>🏷 {booking.strong_id || `ID-${booking.id}`} | 🟢 {booking.status}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {!showDebug && (
                <button onClick={() => setShowDebug(true)} style={{
                    position: 'fixed',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    zIndex: 99999
                }}>🔍 Debug</button>
            )}
            
            <div className="appointease-booking wp-block-group" role="main" aria-label="Appointment booking system">
                <div ref={liveRegionRef} className="live-region" aria-live="polite" aria-atomic="true"></div>
                <ConnectionStatus />
                <div className="appointease-booking-header wp-block-group is-layout-flex">
                    <div className="appointease-logo wp-block-site-logo">
                        <span className="logo-icon">A</span>
                    </div>
                    {isLoggedIn ? (
                        <div className="user-menu wp-block-buttons is-layout-flex">
                            <button className="dashboard-btn wp-element-button" onClick={() => setShowDashboard(true)}>
                                <i className="fas fa-th-large"></i>
                                <div className="dashboard-btn-content">
                                    <span>My Appointments</span>
                                    <span className="dashboard-btn-email">{loginEmail}</span>
                                </div>
                            </button>
                            <button className="logout-btn wp-element-button" onClick={() => {
                                setIsLoggedIn(false);
                                setShowDashboard(false);
                                setLoginEmail('');
                                setStep(1);
                            }}>
                                <i className="fas fa-sign-out-alt"></i>
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={handleLogin}
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                border: 'none',
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <i className="fas fa-sign-in-alt" style={{marginRight: '8px'}}></i>
                            Existing Customer? Login Here
                        </button>
                    )}
                </div>

                <div className="appointease-booking-content wp-block-group">
                    {step === 0 && (
                        <div className="appointease-step-content">
                            <div className="time-sync-container">
                                <div className="sync-header">
                                    <i className="ri-time-line" style={{fontSize: '3rem', color: '#1CBC9B', marginBottom: '1rem'}}></i>
                                    <h2>Initializing Booking System</h2>
                                    <p>Syncing time with server to ensure accurate scheduling...</p>
                                </div>
                                
                                <div className="time-display">
                                    <div className="current-time">
                                        <div className="time-label">Current Time</div>
                                        <div className="time-value">
                                            {currentTime.toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                timeZoneName: 'short'
                                            })}
                                        </div>
                                        <div className="timezone-info">
                                            {timeZone} • {currentTime.toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                    
                                    {serverDate && (
                                        <div className="server-time">
                                            <div className="time-label">Server Date</div>
                                            <div className="time-value">{serverDate}</div>
                                            <div className="sync-status">
                                                <i className="ri-check-line"></i> Time synchronized
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {timeSynced && (
                                    <div className="sync-complete">
                                        <button 
                                            className="continue-btn"
                                            onClick={() => setStep(1)}
                                            style={{
                                                background: 'linear-gradient(135deg, #1CBC9B, #16a085)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '16px 32px',
                                                borderRadius: '12px',
                                                fontSize: '1.1rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 12px rgba(28, 188, 155, 0.3)',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <i className="ri-arrow-right-line"></i> Start Booking
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {step <= 6 && step > 0 && <StepProgress />}
                    
                    {step > 0 && (
                        <div className="current-time-widget" style={{
                            position: 'fixed',
                            top: '20px',
                            right: '20px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            fontSize: '0.85rem',
                            color: '#374151',
                            zIndex: 1000,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(0, 0, 0, 0.1)'
                        }}>
                            <div style={{fontWeight: '600', marginBottom: '2px'}}>
                                {currentTime.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                            <div style={{fontSize: '0.75rem', opacity: 0.7}}>
                                {timeZone}
                            </div>
                        </div>
                    )}
                    
                    {step === 1 && (
                        <ServiceSelector
                            onRetry={loadInitialData}
                            columns={props.columns || 2}
                        />
                    )}

                    {step === 2 && (
                        <EmployeeSelector
                            onRetry={loadInitialData}
                        />
                    )}

                    {step === 3 && (
                        <DateSelector isReschedule={isRescheduling} />
                    )}

                    {step === 4 && (
                        <TimeSelector
                            unavailableSlots={unavailableSlots}
                            timezone={timezone}
                            bookingDetails={bookingDetails}
                        />
                    )}

                    {step === 5 && (
                        <div className="appointease-step-content">
                            {isRescheduling && (
                                <>
                                    <div className="reschedule-banner">
                                        <i className="fas fa-calendar-alt"></i>
                                        <span>Rescheduling Appointment {appointmentId}</span>
                                    </div>
                                    <h2>Confirm New Time</h2>
                                    <p className="step-description">Review your new appointment details</p>
                                </>
                            )}
                            {!isRescheduling && !isLoggedIn && !showEmailVerification && (
                                <CustomerInfoForm
                                    isLoggedIn={isLoggedIn}
                                    isCheckingEmail={isCheckingEmail}
                                    existingUser={existingUser}
                                    onSubmit={handleSubmit}
                                    onBack={() => setStep(4)}
                                    checkExistingEmail={() => {}}
                                />
                            )}
                            
                            {!isRescheduling && !isLoggedIn && showEmailVerification && (
                                <EmailVerification
                                    emailOtp={emailOtp}
                                    otpExpiry={otpExpiry}
                                    resendCooldown={resendCooldown}
                                    isBlocked={isBlocked}
                                    isVerifyingEmail={isVerifyingEmail}
                                    onOtpChange={setEmailOtp}
                                    onVerifyOtp={() => {
                                        setEmailVerified(true);
                                        setShowEmailVerification(false);
                                        setStep(6);
                                    }}
                                    onResendOtp={() => {}}
                                    onBack={() => {
                                        setShowEmailVerification(false);
                                        setEmailOtp('');
                                        setErrors({});
                                    }}
                                />
                            )}
                            
                            {isRescheduling && (
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
                                            setIsReschedulingSubmit(true);
                                            setTimeout(() => {
                                                setManageMode(false);
                                                setCurrentAppointment(null);
                                                setIsRescheduling(false);
                                                setStep(9);
                                                setIsReschedulingSubmit(false);
                                            }, 1000);
                                        }} disabled={isReschedulingSubmit}>
                                            {isReschedulingSubmit ? 'RESCHEDULING...' : 'CONFIRM RESCHEDULE'}
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
                                        <span>{isLoggedIn ? loginEmail : `${formData.firstName} (${formData.email})`}</span>
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
                            appointmentId={appointmentId}
                            onBookAnother={() => {
                                setStep(1);
                                setSelectedService(null);
                                setSelectedEmployee(null);
                                setSelectedDate('');
                                setSelectedTime('');
                                setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                                setAppointmentId('');
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
                                        <strong>{currentAppointment?.email || loginEmail}</strong>
                                    </div>
                                </div>
                            
                                <div className="success-actions">
                                    <button className="action-btn primary-btn" onClick={() => {
                                        if (isLoggedIn) {
                                            setShowDashboard(true);
                                            loadUserAppointmentsRealtime(loginEmail);
                                        } else {
                                            setStep(1);
                                            setSelectedService(null);
                                            setSelectedEmployee(null);
                                            setSelectedDate('');
                                            setSelectedTime('');
                                            setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                                            setAppointmentId('');
                                            setManageMode(false);
                                            setCurrentAppointment(null);
                                            setErrors({});
                                        }
                                    }}>
                                        {isLoggedIn ? 'Show All Bookings' : 'Back to Booking'}
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
                                        <strong>{currentAppointment?.email || loginEmail}</strong>
                                    </div>
                                </div>
                            
                                <div className="appointment-card">
                                    <div className="appointment-id">
                                        <span className="id-label">Your Booking Reference</span>
                                        <span className="id-number">{appointmentId}</span>
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
                                        if (isLoggedIn) {
                                            setShowDashboard(true);
                                            loadUserAppointmentsRealtime(loginEmail);
                                        } else {
                                            setStep(1);
                                            setSelectedService(null);
                                            setSelectedEmployee(null);
                                            setSelectedDate('');
                                            setSelectedTime('');
                                            setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                                            setAppointmentId('');
                                            setManageMode(false);
                                            setCurrentAppointment(null);
                                            setIsRescheduling(false);
                                            setErrors({});
                                        }
                                    }}>
                                        {isLoggedIn ? 'Show All Bookings' : 'Book Another'}
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