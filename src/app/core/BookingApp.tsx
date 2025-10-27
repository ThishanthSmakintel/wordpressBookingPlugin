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
import { AppointmentManager } from '../../modules/AppointmentManager';
import { BookingHeader } from '../../modules/BookingHeader';

// Hooks
import { useBookingState } from '../../hooks/useBookingState';
import { useDebugState } from '../../hooks/useDebugState';
import { useBookingActions } from '../../hooks/useBookingActions';
import { useRealtime } from '../../hooks/useRealtime';

// Store and utilities
import '../../store/wordpress-store'; // Initialize WordPress store
import { useAppointmentStore as useBookingStore } from '../../hooks/useAppointmentStore';
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
    
    // ✅ Smart WebSocket - Only for critical real-time scenarios (following Calendly/Acuity patterns)
    const realtimeConfig = React.useMemo(() => {
        const email = bookingState.loginEmail;
        const root = window.bookingAPI?.root || '/wp-json/';
        const wsUrl = window.bookingAPI?.wsUrl || `ws://blog.promoplus.com:8080`;
        
        // Enable WebSocket from Step 1 - Track entire booking journey (Calendly pattern)
        const needsRealtime = (
            step >= 1 ||  // Booking flow: Track from start
            bookingState.showDashboard ||  // Dashboard: Live appointment updates
            bookingState.isRescheduling ||  // Rescheduling: Live availability
            debugState.showDebug  // Debug: Connection monitoring
        );
        
        console.log('[BookingApp] WebSocket enabled:', needsRealtime, {
            dashboard: bookingState.showDashboard,
            timeSelection: step === 4 && selectedDate && selectedEmployee,
            rescheduling: bookingState.isRescheduling,
            debug: debugState.showDebug
        });
        
        return {
            wsUrl: email ? `${wsUrl}?email=${encodeURIComponent(email)}` : wsUrl,
            pollingUrl: email ? `${root}appointease/v1/realtime/poll?email=${encodeURIComponent(email)}&last_update=${Date.now()}` : `${root}appointease/v1/realtime/poll`,
            pollingInterval: 5000,  // Faster polling for booking conflicts
            enabled: needsRealtime,
            onUpdate: (data: any) => {
                // Real-time availability updates
                if (data.data?.availability) {
                    // Update time slot availability in real-time
                    debugState.setAvailabilityData?.(data.data.availability);
                }
                // Live appointment updates for dashboard
                if (data.data?.appointments) {
                    setAppointments(data.data.appointments);
                } else if (data.appointments) {
                    setAppointments(data.appointments);
                }
                // Booking conflict notifications (Calendly-style)
                if (data.type === 'slot_taken' && step === 4) {
                    console.warn('[WebSocket] Slot conflict detected:', data.slot);
                    // Immediately disable conflicted slot
                    const conflictTime = data.time;
                    debugState.setUnavailableSlots?.(prev => [...(prev || []), conflictTime]);
                    // Show user-friendly conflict notification
                    if (selectedTime === conflictTime) {
                        setSelectedTime('');
                        setErrors({ time: 'This time slot was just booked by another user. Please select a different time.' });
                    }
                }
            },
            onConnectionChange: (mode: string) => {
                debugState.setConnectionMode?.(mode);
            }
        };
    }, [bookingState.showDashboard, step, selectedDate, selectedEmployee, bookingState.isRescheduling, debugState.showDebug, bookingState.loginEmail]);
    
    const { connectionMode, isConnected: isRealtimeConnected, subscribe, send: sendRealtimeMessage } = useRealtime(realtimeConfig);
    
    // Debug connectionMode
    useEffect(() => {
        console.log('[BookingApp] connectionMode from useRealtime:', connectionMode);
    }, [connectionMode]);
    const [wsLatency, setWsLatency] = React.useState<number>(0);
    
    React.useEffect(() => {
        const unsubscribe = subscribe('latency', (data: any) => {
            setWsLatency(data.latency);
        });
        return unsubscribe;
    }, [subscribe]);
    
    // Debug logging for form data
    useEffect(() => {
        console.log('[BookingApp] Form data changed:', formData);
        console.log('[BookingApp] Booking state:', {
            isLoggedIn: bookingState.isLoggedIn,
            loginEmail: bookingState.loginEmail,
            step
        });
    }, [formData, bookingState.isLoggedIn, bookingState.loginEmail, step]);

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

    // Note: Real-time updates now handled by useRealtime hook above
    // Keeping this as fallback for non-dashboard views
    useEffect(() => {
        if (!bookingState.isLoggedIn || bookingState.showDashboard) return;
        const interval = setInterval(() => loadUserAppointmentsRealtime(), 10000);
        return () => clearInterval(interval);
    }, [bookingState.isLoggedIn, bookingState.showDashboard, loadUserAppointmentsRealtime]);

    useEffect(() => {
        if (step === 4 && selectedDate && selectedEmployee) {
            checkAvailability(selectedDate, selectedEmployee.id);
        }
    }, [step, selectedDate, selectedEmployee, checkAvailability, bookingState.isRescheduling, bookingState.currentAppointment?.id]);

    // Start booking session from Step 1 - Track entire user journey (Calendly/Acuity pattern)
    useEffect(() => {
        if (step >= 1 && connectionMode === 'websocket') {
            console.log(`[BookingApp] 📋 Booking session active at Step ${step}`);
            sendRealtimeMessage('booking_session', {
                step,
                service: selectedService?.name,
                employee: selectedEmployee?.name,
                date: selectedDate,
                time: selectedTime
            });
        }
    }, [step, selectedService, selectedEmployee, selectedDate, selectedTime, connectionMode, sendRealtimeMessage]);

    // Lock slot at Steps 4, 5, 6 - Update DB immediately when time selected
    const previousSlotRef = useRef<{date: string, time: string, employeeId: number} | null>(null);
    
    useEffect(() => {
        if ((step === 4 || step === 5 || step === 6) && selectedDate && selectedTime && selectedEmployee && connectionMode === 'websocket') {
            const currentSlot = { date: selectedDate, time: selectedTime, employeeId: selectedEmployee.id };
            const previousSlot = previousSlotRef.current;
            
            // If user changed time selection, unlock old slot first
            if (previousSlot && (previousSlot.time !== currentSlot.time || previousSlot.date !== currentSlot.date)) {
                console.log(`[BookingApp] 🔄 Step ${step}: Unlocking old slot:`, previousSlot);
                sendRealtimeMessage('unlock_slot', {
                    date: previousSlot.date,
                    time: previousSlot.time,
                    employeeId: previousSlot.employeeId,
                    completed: false
                });
            }
            
            // Lock slot immediately in database
            console.log(`[BookingApp] 🔒 Step ${step}: LOCKING slot in DB:`, currentSlot);
            sendRealtimeMessage('lock_slot', {
                date: selectedDate,
                time: selectedTime,
                employeeId: selectedEmployee.id,
                service: selectedService?.name
            });
            
            previousSlotRef.current = currentSlot;
        }
        
        // Unlock when leaving steps 4-6 or unmounting
        return () => {
            if ((step === 4 || step === 5 || step === 6) && selectedDate && selectedTime && selectedEmployee && connectionMode === 'websocket') {
                console.log(`[BookingApp] 🔓 Step ${step}: Unlocking slot on unmount`);
                sendRealtimeMessage('unlock_slot', {
                    date: selectedDate,
                    time: selectedTime,
                    employeeId: selectedEmployee.id,
                    completed: step === 7
                });
                previousSlotRef.current = null;
            }
        };
    }, [step, selectedDate, selectedTime, selectedEmployee, selectedService, connectionMode, sendRealtimeMessage]);

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
            const [appointmentsRes, servicesRes, staffRes, settingsRes, timeSlotsRes] = await Promise.all([
                fetch(`${window.bookingAPI.root}appointease/v1/debug/appointments`),
                fetch(`${window.bookingAPI.root}booking/v1/services`),
                fetch(`${window.bookingAPI.root}booking/v1/staff`),
                fetch(`${window.bookingAPI.root}appointease/v1/business-hours`),
                fetch(`${window.bookingAPI.root}appointease/v1/time-slots`)
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
                <DebugPanel debugState={debugState} bookingState={bookingState} connectionMode={connectionMode} wsLatency={wsLatency} />
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
                <DebugPanel debugState={debugState} bookingState={bookingState} connectionMode={connectionMode} wsLatency={wsLatency} />
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
                <DebugPanel debugState={debugState} bookingState={bookingState} connectionMode={connectionMode} wsLatency={wsLatency} />
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

    return (
        <>
            <DebugPanel debugState={debugState} bookingState={bookingState} connectionMode={connectionMode} wsLatency={wsLatency} />
            
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
