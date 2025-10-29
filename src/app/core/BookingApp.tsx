import React, { useEffect, useCallback, useRef } from 'react';
import '../../utils/consoleLogger';
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

// New Modular Components
import { BookingFlow } from '../features/booking/components/BookingFlow';
import { SuccessPage } from '../shared/components/SuccessPage';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';

// Legacy Components (to be migrated)
import Dashboard from '../../components/pages/Dashboard';
import LoginForm from '../../components/forms/LoginForm';
import BookingSuccessPage from '../../components/pages/BookingSuccessPage';
import ConnectionStatus from '../../components/ui/ConnectionStatus';

// Modules
import { DebugPanel } from '../../modules/DebugPanel';
import HeartbeatTest from '../../components/HeartbeatTest';
import { AppointmentManager } from '../../modules/AppointmentManager';
import { BookingHeader } from '../../modules/BookingHeader';

// Hooks
import { useBookingState } from '../../hooks/useBookingState';
import { useDebugState } from '../../hooks/useDebugState';
import { useBookingActions } from '../../hooks/useBookingActions';
import { useHeartbeat } from '../../hooks/useHeartbeat';

// Store and utilities
import '../../store/wordpress-store'; // Initialize WordPress store
import { useAppointmentStore as useBookingStore } from '../../hooks/useAppointmentStore';
import { sanitizeInput, generateStrongId } from '../../utils';
import { checkCustomer } from '../../services/api';
import { sessionService } from '../../services/sessionService';
import { createRedisDataService } from '../../services/redisDataService';

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
    
    // ✅ WordPress Heartbeat - Real-time updates via WordPress native API
    const heartbeatPollData = React.useMemo(() => {
        const email = bookingState.loginEmail;
        const needsRealtime = (
            step >= 1 ||
            bookingState.showDashboard ||
            bookingState.isRescheduling ||
            debugState.showDebug
        );
        
        if (!needsRealtime) return null;
        
        return {
            email: email || null,
            step,
            date: selectedDate || null,
            time: selectedTime || null,
            employee_id: selectedEmployee?.id || null
        };
    }, [bookingState.loginEmail, step, selectedDate, selectedTime, selectedEmployee, bookingState.showDashboard, bookingState.isRescheduling, debugState.showDebug]);
    
    const { isConnected: isHeartbeatConnected, storageMode, latency: heartbeatLatency, redisOps, redisStats, send: sendHeartbeat } = useHeartbeat({
        enabled: step !== 4,
        pollData: heartbeatPollData,
        onPoll: (data: any) => {
            if (data.appointease_active_selections) {
                debugState.setActiveSelections?.(data.appointease_active_selections);
            }
            if (data.appointease_booked_slots) {
                debugState.setUnavailableSlots?.(data.appointease_booked_slots);
            }
            if (data.appointease_locked_slots) {
                debugState.setLockedSlots?.(data.appointease_locked_slots);
            }
            if (data.appointments) {
                setAppointments(data.appointments);
            }
        }
    });
    
    // Initialize Redis-primary service
    React.useEffect(() => {
        createRedisDataService({
            heartbeatEnabled: true,
            onDataUpdate: (data) => {
                console.log('[Redis] Storage mode:', storageMode);
            }
        });
    }, [storageMode]);
    
    const connectionMode = isHeartbeatConnected ? 'polling' : 'disconnected';
    const [wsLatency, setWsLatency] = React.useState<number>(0);
    


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
                    avatar: member.name?.split(' ').map((n: string) => n[0]).join('') || '?'
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

    // Listen for availability refresh requests from TimeSelector
    useEffect(() => {
        const handleRefreshAvailability = (event: CustomEvent) => {
            const { date, employeeId } = event.detail;
            if (date && employeeId) {
                checkAvailability(date, employeeId);
            }
        };
        
        window.addEventListener('refreshAvailability', handleRefreshAvailability as EventListener);
        return () => window.removeEventListener('refreshAvailability', handleRefreshAvailability as EventListener);
    }, [checkAvailability]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // Scroll to top when step changes
    useEffect(() => {
        if (appContainerRef.current) {
            appContainerRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [step]);

    const fetchDebugData = useCallback(async () => {
        if (!window.bookingAPI || !debugState.showDebug) return;
        
        try {
            const [appointmentsRes, servicesRes, staffRes, settingsRes, timeSlotsRes, selectionsRes, locksRes] = await Promise.all([
                fetch(`${window.bookingAPI.root}appointease/v1/debug/appointments`),
                fetch(`${window.bookingAPI.root}booking/v1/services`),
                fetch(`${window.bookingAPI.root}booking/v1/staff`),
                fetch(`${window.bookingAPI.root}appointease/v1/business-hours`),
                fetch(`${window.bookingAPI.root}appointease/v1/time-slots`),
                fetch(`${window.bookingAPI.root}appointease/v1/debug/selections`),
                fetch(`${window.bookingAPI.root}appointease/v1/debug/locks`)
            ]);
            
            if (appointmentsRes.ok) {
                const data = await appointmentsRes.json();
                debugState.setAllBookings(data.all_appointments || []);
            }
            
            if (servicesRes.ok) {
                const servicesData = await servicesRes.json();
                debugState.setDebugServices(servicesData || []);
            }
            
            if (staffRes.ok) {
                const staffData = await staffRes.json();
                debugState.setDebugStaff(staffData || []);
            }
            
            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                debugState.setWorkingDays(settingsData.working_days || ['1', '2', '3', '4', '5']);
            }
            
            if (timeSlotsRes.ok) {
                const timeSlotsData = await timeSlotsRes.json();
                debugState.setDebugTimeSlots(timeSlotsData.time_slots || []);
            }
            
            if (selectionsRes.ok) {
                const selectionsData = await selectionsRes.json();
                debugState.setActiveSelections(selectionsData.selections || []);
            }
            
            if (locksRes.ok) {
                const locksData = await locksRes.json();
                debugState.setLockedSlots(locksData.locks || []);
            }
            
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
            // Debug fetch failed
        }
    }, [selectedEmployee, selectedDate, debugState.showDebug]);
    
    useEffect(() => {
        if (!debugState.showDebug) return;
        
        fetchDebugData();
        const interval = setInterval(fetchDebugData, 5000); // Reduced frequency
        return () => clearInterval(interval);
    }, [fetchDebugData, debugState.showDebug]);

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
            <>
                <DebugPanel debugState={debugState} bookingState={bookingState} connectionMode={connectionMode} wsLatency={wsLatency} storageMode={storageMode} redisHealth={storageMode === 'redis'} heartbeatLatency={heartbeatLatency} redisOps={redisOps} redisStats={redisStats} tempSelected={selectedTime} />
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
            </>
        );
    }

    if (bookingState.showDashboard) {
        return (
            <>
                <DebugPanel debugState={debugState} bookingState={bookingState} connectionMode={connectionMode} wsLatency={wsLatency} storageMode={storageMode} redisHealth={storageMode === 'redis'} heartbeatLatency={heartbeatLatency} redisOps={redisOps} redisStats={redisStats} tempSelected={selectedTime} />
                <Dashboard
                loginEmail={bookingState.loginEmail}
                dashboardRef={dashboardRef}
                currentAppointmentId={bookingState.currentAppointment?.id}
                isRescheduling={bookingState.isRescheduling}
                onRefresh={() => loadUserAppointmentsRealtime()}
                onNewAppointment={() => {
                    bookingState.setShowDashboard(false);
                    bookingState.setExistingUser({ exists: false });
                    setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                    setErrors({});
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
                    // Fetch actual employee ID from staff list
                    const matchingEmployee = employees.find(emp => emp.name === appointment.staff);
                    setSelectedEmployee(matchingEmployee || {id: 1, name: appointment.staff});
                    // For logged-in users, keep their info; for others, clear it
                    if (bookingState.isLoggedIn) {
                        setFormData({
                            firstName: appointment.name || bookingState.loginEmail.split('@')[0],
                            email: bookingState.loginEmail,
                            phone: appointment.phone || ''
                        });
                    } else {
                        setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                    }
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
            </>
        );
    }

    if (bookingState.manageMode && bookingState.currentAppointment) {
        return (
            <>
                <DebugPanel debugState={debugState} bookingState={bookingState} connectionMode={connectionMode} wsLatency={wsLatency} storageMode={storageMode} redisHealth={storageMode === 'redis'} heartbeatLatency={heartbeatLatency} redisOps={redisOps} redisStats={redisStats} tempSelected={selectedTime} />
                <AppointmentManager
                bookingState={bookingState}
                onReschedule={() => {
                    setSelectedService({name: bookingState.currentAppointment?.service_name, price: 0});
                    // Match employee by name from staff list
                    const matchingEmployee = employees.find(emp => emp.name === bookingState.currentAppointment?.staff_name);
                    setSelectedEmployee(matchingEmployee || {id: 1, name: bookingState.currentAppointment?.staff_name || 'Staff Member'});
                    // For logged-in users, keep their info; for others, clear it
                    if (bookingState.isLoggedIn) {
                        setFormData({
                            firstName: bookingState.currentAppointment?.name || bookingState.loginEmail.split('@')[0],
                            email: bookingState.loginEmail,
                            phone: bookingState.currentAppointment?.phone || ''
                        });
                    } else {
                        setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                    }
                    bookingState.setIsRescheduling(true);
                    setStep(3); 
                    bookingState.setManageMode(false);
                }}
                onCancel={async () => {
                    bookingState.setIsCancelling(true);
                    // Reload appointments to get updated status
                    await loadUserAppointmentsRealtime(bookingState.loginEmail);
                    setTimeout(() => {
                        bookingState.setManageMode(false);
                        bookingState.setCurrentAppointment(null);
                        bookingState.setShowCancelConfirm(false);
                        bookingState.setShowDashboard(true);
                        setStep(8);
                        bookingState.setIsCancelling(false);
                    }, 500);
                }}
                onBack={() => bookingState.setManageMode(false)}
                />
            </>
        );
    }

    // Show test if URL has ?test=heartbeat
    const showTest = new URLSearchParams(window.location.search).get('test') === 'heartbeat';
    
    if (showTest) {
        return <HeartbeatTest />;
    }
    
    return (
        <>
            <DebugPanel debugState={debugState} bookingState={bookingState} connectionMode={connectionMode} wsLatency={wsLatency} storageMode={storageMode} redisHealth={storageMode === 'redis'} heartbeatLatency={heartbeatLatency} redisOps={redisOps} redisStats={redisStats} tempSelected={selectedTime} />
            
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

                <BookingFlow
                    loadInitialData={loadInitialData}
                    handleSubmit={handleSubmit}
                    checkCustomer={checkCustomer}
                    setFormData={setFormData}
                    setStep={setStep}
                    setErrors={setErrors}
                    formData={formData}
                    columns={props.columns}
                    isSubmitting={isSubmitting}
                    loadUserAppointmentsRealtime={loadUserAppointmentsRealtime}
                    bookingState={bookingState}
                />
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
    root.render(
        <ErrorBoundary>
            <BookingApp ref={appRef} />
        </ErrorBoundary>
    );
    
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
