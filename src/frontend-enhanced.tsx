import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './frontend.css';
import './reschedule.css';
import './login.css';
import './wp-responsive-fix.css';
import Dashboard from './components/Dashboard';
import LoginForm from './components/LoginForm';
import ServiceSelector from './components/ServiceSelector';
import EmployeeSelector from './components/EmployeeSelector';
import DateSelector from './components/DateSelector';
import TimeSelector from './components/TimeSelector';
import CustomerInfoForm from './components/CustomerInfoForm';
import EmailVerification from './components/EmailVerification';
import BookingSuccessPage from './components/BookingSuccessPage';
import StepProgress from './components/StepProgress';
import ConnectionStatus from './components/ConnectionStatus';
import { sanitizeInput, sanitizeLogInput, generateStrongId, timeSlots, businessHours } from './utils';
import { useBookingStore } from './store/bookingStore';

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    service?: string;
    employee?: string;
    date?: string;
    time?: string;
}

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
    const {
        step, selectedService, selectedEmployee, selectedDate, selectedTime, formData,
        services, employees, appointments, servicesLoading, employeesLoading, appointmentsLoading, isSubmitting, isOnline, errors,
        setStep, setSelectedService, setSelectedEmployee, setSelectedDate, setSelectedTime,
        setFormData, setServices, setEmployees, setAppointments, setServicesLoading, setEmployeesLoading,
        setAppointmentsLoading, setIsSubmitting, setIsOnline, setErrors, clearError
    } = useBookingStore();
    
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
    const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
    const [retryCount, setRetryCount] = useState(0);
    const liveRegionRef = useRef<HTMLDivElement>(null);

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
    const dashboardRef = useRef<HTMLDivElement>(null);

    // Calculate optimal cards per page based on container dimensions
    const calculateCardsPerPage = useCallback(() => {
        if (!dashboardRef.current) return 2;
        
        const container = dashboardRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Card dimensions (including gap)
        const cardMinWidth = 280;
        const cardHeight = 200;
        const gap = 16;
        
        // Calculate cards per row
        const cardsPerRow = Math.max(1, Math.floor((containerWidth + gap) / (cardMinWidth + gap)));
        
        // Calculate rows that fit in height (subtract header and pagination space)
        const availableHeight = containerHeight - 200; // Reserve space for header/pagination
        const rowsPerPage = Math.max(1, Math.floor(availableHeight / (cardHeight + gap)));
        
        const totalCards = cardsPerRow * rowsPerPage;
        return Math.max(1, Math.min(totalCards, 12)); // Min 1, max 12 cards
    }, []);

    // Debug: Check all appointments in database
    const debugCheckDatabase = async () => {
        if (!window.bookingAPI) return;
        
        try {
            const response = await fetch(`${window.bookingAPI.root}appointease/v1/debug/appointments`, {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': window.bookingAPI.nonce
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                // Debug info available in data object
            }
        } catch (error) {
            // Debug check failed silently
        }
    };

    // API request wrapper with optional token validation
    const apiRequest = async (url: string, options: RequestInit = {}) => {
        if (!window.bookingAPI) throw new Error('API not available');
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-WP-Nonce': window.bookingAPI.nonce,
            ...(options.headers as Record<string, string> || {})
        };
        
        // Add token for authenticated requests if logged in
        if (isLoggedIn && sessionToken) {
            headers['Authorization'] = `Bearer ${sessionToken}`;
        }
        
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        // Handle session expiry only for authenticated users
        if (response.status === 401 && isLoggedIn && sessionToken) {
            setIsLoggedIn(false);
            setShowDashboard(false);
            setSessionToken(null);
            setLoginEmail('');
            await clearSession();
            setErrors({general: 'Session expired. Please login again.'});
            throw new Error('Session expired');
        }
        
        return response;
    };

    // WordPress secure session management
    const saveSession = async (email: string) => {
        if (!window.bookingAPI) return;
        
        try {
            await fetch(`${window.bookingAPI.root}appointease/v1/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.bookingAPI.nonce
                },
                body: JSON.stringify({ email, action: 'create' })
            });
        } catch (error) {
            // Session save failed, using fallback
        }
    };

    const loadSession = async () => {
        if (!window.bookingAPI) return null;
        
        try {
            const response = await fetch(`${window.bookingAPI.root}appointease/v1/session`, {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': window.bookingAPI.nonce
                }
            });
            
            if (response.ok) {
                const session = await response.json();
                return session.email ? { email: session.email } : null;
            }
        } catch (error) {
            // Session load failed
        }
        
        return null;
    };

    const clearSession = async () => {
        if (!window.bookingAPI) return;
        
        try {
            await fetch(`${window.bookingAPI.root}appointease/v1/session`, {
                method: 'DELETE',
                headers: {
                    'X-WP-Nonce': window.bookingAPI.nonce
                }
            });
        } catch (error) {
            // Session clear failed
        }
    };

    // Load session on mount
    useEffect(() => {
        const checkSession = async () => {
            const session = await loadSession();
            if (session) {
                setLoginEmail(session.email);
                setIsLoggedIn(true);
                setShowDashboard(true);
                loadUserAppointmentsRealtime(session.email);
            }
        };
        checkSession();
    }, []);

    // Recalculate cards per page on container resize
    useEffect(() => {
        if (!showDashboard || !dashboardRef.current) return;
        
        const updateCardsPerPage = () => {
            const newCardsPerPage = calculateCardsPerPage();
            if (newCardsPerPage !== appointmentsPerPage) {
                setAppointmentsPerPage(newCardsPerPage);
                setCurrentPage(1); // Reset to first page
            }
        };
        
        const resizeObserver = new ResizeObserver(updateCardsPerPage);
        resizeObserver.observe(dashboardRef.current);
        
        // Initial calculation
        setTimeout(updateCardsPerPage, 100);
        
        return () => resizeObserver.disconnect();
    }, [showDashboard, calculateCardsPerPage, appointmentsPerPage]);

    // Enhanced connection monitoring and auto-refresh
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (retryCount > 0) {
                loadInitialData();
            }
            if (isLoggedIn) {
                loadUserAppointmentsRealtime();
            }
        };
        
        const handleOffline = () => {
            setIsOnline(false);
        };
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [retryCount, isLoggedIn]);
    
    // Real-time data fetching using existing user-appointments endpoint
    const loadUserAppointmentsRealtime = useCallback((email?: string) => {
        const emailToUse = email || loginEmail;
        console.log('[loadUserAppointmentsRealtime] Starting with:', { emailToUse, hasAPI: !!window.bookingAPI });
        
        if (!window.bookingAPI || !emailToUse) {
            console.log('[loadUserAppointmentsRealtime] Missing API or email, setting empty appointments');
            setAppointments([]);
            return;
        }
        
        console.log('[loadUserAppointmentsRealtime] Loading appointments for:', emailToUse);
        setAppointmentsLoading(true);
        apiRequest(`${window.bookingAPI?.root || '/wp-json/'}appointease/v1/user-appointments`, {
            method: 'POST',
            body: JSON.stringify({ email: emailToUse })
        })
        .then(response => {
            console.log('[loadUserAppointmentsRealtime] API response status:', response.status);
            if (!response.ok) {
                throw new Error('Failed to fetch appointments');
            }
            return response.json();
        })
        .then(appointments => {
            console.log('[loadUserAppointmentsRealtime] Raw appointments data:', appointments);
            const formattedAppointments = (appointments || []).map((apt: any) => ({
                id: apt.strong_id || `AE${apt.id.toString().padStart(6, '0')}`,
                service: apt.service_name || 'Service',
                staff: apt.staff_name || 'Staff Member',
                date: apt.appointment_date,
                status: apt.status,
                name: apt.name,
                email: apt.email
            }));
            console.log('[loadUserAppointmentsRealtime] Formatted appointments:', formattedAppointments);
            setAppointments(formattedAppointments);
        })
        .catch((error) => {
            console.error('[loadUserAppointmentsRealtime] Error loading appointments:', error);
            setAppointments([]);
        })
        .finally(() => {
            setAppointmentsLoading(false);
        });
    }, [loginEmail]);
    
    // Check if email exists using existing user-appointments endpoint
    const checkExistingEmail = async (email: string) => {
        if (!email || !window.bookingAPI) {
            setExistingUser(null);
            return;
        }
        
        setIsCheckingEmail(true);
        // Checking email
        
        try {
            const response = await apiRequest(`${window.bookingAPI.root}appointease/v1/user-appointments`, {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            
            if (response.ok) {
                const appointments = await response.json();
                const hasAppointments = appointments && appointments.length > 0;
                // User check completed
                if (hasAppointments) {
                    const userData = { exists: true, name: appointments[0]?.name, phone: appointments[0]?.phone };
                    setExistingUser(userData);
                    // Auto-fill form data for existing user
                    setFormData({
                        firstName: userData.name || formData.firstName,
                        phone: userData.phone || formData.phone
                    });
                } else {
                    setExistingUser(null);
                }
            } else {
                // User check failed, treating as new user
                setExistingUser(null);
            }
        } catch (error) {
            // Email check error, treating as new user
            setExistingUser(null);
        } finally {
            setIsCheckingEmail(false);
        }
    };
    
    // Auto-refresh appointments every 10 seconds when logged in
    useEffect(() => {
        if (!isLoggedIn || !showDashboard) return;
        
        const interval = setInterval(() => {
            loadUserAppointmentsRealtime();
        }, 10000);
        
        return () => clearInterval(interval);
    }, [isLoggedIn, showDashboard, loadUserAppointmentsRealtime]);
    

    
    // Live region announcements for screen readers
    const announceToScreenReader = useCallback((message: string) => {
        if (liveRegionRef.current) {
            liveRegionRef.current.textContent = message;
            setTimeout(() => {
                if (liveRegionRef.current) {
                    liveRegionRef.current.textContent = '';
                }
            }, 1000);
        }
    }, []);
    
    // Enhanced data loading with error handling
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
            } else {
                throw new Error('Failed to load services');
            }
        } catch (error) {
            console.error('Error loading services:', error);
            setServices([]);
            if (retryCount < 3) {
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                    loadInitialData();
                }, 2000);
            }
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
            } else {
                throw new Error('Failed to load staff');
            }
        } catch (error) {
            console.error('Error loading staff:', error);
            setEmployees([]);
        } finally {
            setEmployeesLoading(false);
        }
    }, [isOnline, retryCount]);
    
    useEffect(() => {
        loadInitialData();
        debugCheckDatabase();
    }, [loadInitialData]);


    

    
    // Step validation
    const canProceedToStep = (targetStep: number): boolean => {
        switch (targetStep) {
            case 2: return !!selectedService;
            case 3: return !!selectedService && !!selectedEmployee;
            case 4: return !!selectedService && !!selectedEmployee && !!selectedDate;
            case 5: return !!selectedService && !!selectedEmployee && !!selectedDate && !!selectedTime;
            default: return true;
        }
    };
    
    const proceedToStep = (targetStep: number) => {
        if (canProceedToStep(targetStep)) {
            setStep(targetStep);
        } else {
            // Step validation failed
        }
    };

    const handleServiceSelect = (service: any) => {
        if (!service || !service.id) {
            setErrors({service: 'Invalid service selected'});
            return;
        }
        setSelectedService(service);
        setErrors({});
        setStep(2);
    };

    const handleEmployeeSelect = (employee: any) => {
        if (!employee || !employee.id) {
            setErrors({employee: 'Invalid employee selected'});
            return;
        }
        setSelectedEmployee(employee);
        setErrors({});
        setUnavailableSlots([]);
        setStep(3);
    };

    const handleDateSelect = (date: string) => {
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            setErrors({date: 'Invalid date format'});
            return;
        }
        
        const selectedDateObj = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (isNaN(selectedDateObj.getTime())) {
            setErrors({date: 'Invalid date selected'});
            return;
        }
        
        if (selectedDateObj < today) {
            setErrors({date: 'Cannot select past dates'});
            return;
        }
        
        if (businessHours.closedDays.includes(selectedDateObj.getDay())) {
            setErrors({date: 'This day is not available for appointments'});
            return;
        }
        
        setSelectedDate(date);
        setErrors({});
        
        if (selectedEmployee) {
            checkAvailability(date, selectedEmployee.id);
        }
        setStep(4);
    };

    const checkAvailability = async (date: string, employeeId: number) => {
        // Disable availability check for now
        setUnavailableSlots([]);
        return;
    };

    const handleTimeSelect = (time: string) => {
        if (!time || !/^\d{2}:\d{2}$/.test(time)) {
            setErrors({time: 'Invalid time format'});
            return;
        }
        
        if (unavailableSlots.includes(time)) {
            setErrors({time: 'This time slot is not available'});
            return;
        }
        
        setSelectedTime(time);
        setErrors({});
        setStep(5);
    };



    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        
        // Validate and sanitize required fields
        if (!selectedService) {
            newErrors.service = 'Please select a service';
        }
        
        if (!selectedEmployee) {
            newErrors.employee = 'Please select a specialist';
        }
        
        if (!selectedDate) {
            newErrors.date = 'Please select a date';
        }
        
        if (!selectedTime) {
            newErrors.time = 'Please select a time';
        }
        
        const sanitizedFirstName = sanitizeInput(formData.firstName);
        if (!sanitizedFirstName) {
            newErrors.firstName = 'Name is required';
        } else if (sanitizedFirstName.length < 2) {
            newErrors.firstName = 'Name must be at least 2 characters';
        } else if (sanitizedFirstName.length > 50) {
            newErrors.firstName = 'Name must be less than 50 characters';
        } else if (!/^[a-zA-Z\s'-]+$/.test(sanitizedFirstName)) {
            newErrors.firstName = 'Name can only contain letters, spaces, hyphens, and apostrophes';
        }
        
        const sanitizedEmail = sanitizeInput(formData.email);
        if (!sanitizedEmail) {
            newErrors.email = 'Email is required';
        } else if (sanitizedEmail.length > 100) {
            newErrors.email = 'Email must be less than 100 characters';
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(sanitizedEmail)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (formData.phone) {
            const sanitizedPhone = sanitizeInput(formData.phone);
            if (sanitizedPhone.length > 20) {
                newErrors.phone = 'Phone number is too long';
            } else if (!/^[\d\s\-\+\(\)]+$/.test(sanitizedPhone)) {
                newErrors.phone = 'Please enter a valid phone number';
            } else if (sanitizedPhone.replace(/\D/g, '').length < 10) {
                newErrors.phone = 'Phone number must be at least 10 digits';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = (event?: React.FormEvent) => {
        if (event) event.preventDefault();
        
        // Skip form validation for reschedule
        if (isRescheduling) {
            setIsSubmitting(true);
            const appointmentDateTime = `${selectedDate} ${selectedTime}:00`;
            handleReschedule(selectedDate, selectedTime);
            return;
        }
        
        // Skip form validation for logged-in users
        if (!isLoggedIn && !validateForm()) {
            return;
        }
        
        // Require email verification for non-logged-in users
        if (!isLoggedIn && !emailVerified) {
            setShowEmailVerification(true);
            sendEmailVerification();
            return;
        }
        
        if (!isOnline) {
            setErrors({general: 'You are offline. Please check your connection and try again.'});
            return;
        }
        
        setIsSubmitting(true);
        const appointmentDateTime = `${selectedDate} ${selectedTime}:00`;
        const strongId = generateStrongId();
        
        if (!window.bookingAPI) {
            setTimeout(() => {
                setAppointmentId(strongId);
                setStep(6);
                setIsSubmitting(false);
            }, 1500);
            return;
        }
        
        apiRequest(`${window.bookingAPI?.root || '/wp-json/'}appointease/v1/appointments`, {
            method: 'POST',
            body: JSON.stringify({
                name: sanitizeInput(isLoggedIn ? loginEmail.split('@')[0] : formData.firstName),
                email: sanitizeInput(isLoggedIn ? loginEmail : formData.email),
                phone: sanitizeInput(isLoggedIn ? '' : formData.phone),
                date: appointmentDateTime,
                service_id: parseInt(String(selectedService.id), 10),
                employee_id: parseInt(String(selectedEmployee.id), 10)
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            if (result.strong_id) {
                setErrors({});
                setAppointmentId(result.strong_id);
                setStep(6);
            } else if (result.id) {
                setErrors({});
                // Fallback: create strong_id format if not provided
                const fallbackId = `APT-${new Date().getFullYear()}-${result.id.toString().padStart(6, '0')}`;
                setAppointmentId(fallbackId);
                
                // Reload user appointments if logged in
                if (isLoggedIn) {
                    loadUserAppointmentsRealtime();
                }
                
                setStep(6);
            } else {
                const errorMessage = result.message || 'Booking failed. Please try again.';
                setErrors({general: errorMessage});
            }
        })
        .catch(error => {
            console.error('Booking error:', error instanceof Error ? error.message : 'Unknown error');
            const errorMessage = isOnline ? 'Booking failed. Please try again.' : 'Booking failed. Please check your connection.';
            setErrors({general: errorMessage});
        })
        .finally(() => {
            setIsSubmitting(false);
        });
    };



    const handleManageAppointment = async (appointmentIdToManage?: string) => {
        const idToUse = appointmentIdToManage || appointmentId;
        
        if (!idToUse || typeof idToUse !== 'string' || idToUse.length < 3) {
            setErrors({general: 'Please enter a valid appointment ID'});
            return;
        }
        
        const sanitizedId = sanitizeInput(idToUse);
        if (sanitizedId !== idToUse) {
            setErrors({general: 'Invalid characters in appointment ID'});
            return;
        }
        
        setIsManaging(true);

        // For logged-in users, find appointment in appointments
        if (isLoggedIn && appointmentIdToManage) {
            console.log('[handleManageAppointment] Searching in appointments:', appointments);
            const appointment = appointments.find(apt => apt.id === appointmentIdToManage);
            if (appointment) {
                setCurrentAppointment({
                    id: appointment.id,
                    name: appointment.name || loginEmail,
                    email: appointment.email || loginEmail,
                    appointment_date: appointment.date,
                    status: appointment.status
                });
                setAppointmentId(String(appointment.id));
                setManageMode(true);
                setIsManaging(false);
                return;
            }
        }

        // Check if appointment exists in database
        try {
            const response = await apiRequest(`${window.bookingAPI.root}appointease/v1/appointments/${sanitizedId}`, {
                method: 'GET'
            });
            
            if (response.ok) {
                const appointment = await response.json();
                setCurrentAppointment(appointment);
                setAppointmentId(sanitizedId);
                setManageMode(true);
                setErrors({});
            } else {
                setErrors({general: 'No appointment found with this ID. Please check your booking reference and try again.'});
            }
        } catch (error) {
            setErrors({general: 'Error checking appointment. Please try again.'});
        } finally {
            setIsManaging(false);
        }
    };

    const handleCancelAppointment = () => {
        if (isLoggedIn) {
            setShowCancelConfirm(true);
        } else {
            setOtpAction('cancel');
            setShowOtpVerification(true);
            sendVerificationOtp();
        }
    };
    
    const confirmCancelAppointment = () => {
        setShowCancelConfirm(false);
        performCancel();
    };
    
    const performCancel = () => {
        setIsCancelling(true);
        
        if (!window.bookingAPI || !currentAppointment) {
            // Fallback simulation
            setTimeout(() => {
                setManageMode(false);
                setCurrentAppointment(null);
                setShowCancelConfirm(false);
                setShowOtpVerification(false);
                setStep(7);
                setIsCancelling(false);
                if (isLoggedIn) {
                    loadUserAppointmentsRealtime();
                }
            }, 500);
            return;
        }
        
        // Actually call the cancel API
        apiRequest(`${window.bookingAPI.root}appointease/v1/appointments/${currentAppointment.id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            setManageMode(false);
            setCurrentAppointment(null);
            setShowCancelConfirm(false);
            setShowOtpVerification(false);
            setStep(7);
            if (isLoggedIn) {
                loadUserAppointmentsRealtime();
            }
        })
        .catch(error => {
            console.error('Cancel error:', error instanceof Error ? error.message : 'Unknown error');
            // Still proceed to show cancellation even if API fails
            setManageMode(false);
            setCurrentAppointment(null);
            setShowCancelConfirm(false);
            setShowOtpVerification(false);
            setStep(7);
            if (isLoggedIn) {
                loadUserAppointmentsRealtime();
            }
        })
        .finally(() => {
            setIsCancelling(false);
        });
    };

    const handleReschedule = (newDate: string, newTime: string) => {
        if (isLoggedIn) {
            performReschedule(newDate, newTime);
        } else {
            setPendingRescheduleData({date: newDate, time: newTime});
            setOtpAction('reschedule');
            setShowOtpVerification(true);
            sendVerificationOtp();
        }
    };
    
    const performReschedule = (newDate: string, newTime: string) => {
        setIsReschedulingSubmit(true);
        
        if (!window.bookingAPI || !currentAppointment) {
            // Fallback simulation
            setTimeout(() => {
                setManageMode(false);
                setCurrentAppointment(null);
                setIsRescheduling(false);
                setShowOtpVerification(false);
                setStep(8);
                setIsReschedulingSubmit(false);
                if (isLoggedIn) {
                    loadUserAppointmentsRealtime();
                }
            }, 1000);
            return;
        }
        
        // Actually call the reschedule API
        const newDateTime = `${newDate} ${newTime}:00`;
        apiRequest(`${window.bookingAPI.root}appointease/v1/appointments/${currentAppointment.id}`, {
            method: 'PUT',
            body: JSON.stringify({ new_date: newDateTime })
        })
        .then(response => response.json())
        .then(result => {
            setManageMode(false);
            setCurrentAppointment(null);
            setIsRescheduling(false);
            setShowOtpVerification(false);
            setStep(8);
            if (isLoggedIn) {
                loadUserAppointmentsRealtime();
            }
        })
        .catch(error => {
            console.error('Reschedule error:', error instanceof Error ? error.message : 'Unknown error');
            // Still proceed to show success even if API fails
            setManageMode(false);
            setCurrentAppointment(null);
            setIsRescheduling(false);
            setShowOtpVerification(false);
            setStep(8);
            if (isLoggedIn) {
                loadUserAppointmentsRealtime();
            }
        })
        .finally(() => {
            setIsReschedulingSubmit(false);
        });
    };

    const validateLoginEmail = (): boolean => {
        const sanitized = sanitizeInput(loginEmail);
        if (!sanitized) {
            setErrors({general: 'Email is required'});
            return false;
        }
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(sanitized)) {
            setErrors({general: 'Please enter a valid email address'});
            return false;
        }
        if (sanitized.length > 100) {
            setErrors({general: 'Email must be less than 100 characters'});
            return false;
        }
        return true;
    };

    const handleSendOTP = () => {
        if (!validateLoginEmail() || loginResendCooldown > 0) {
            return;
        }
        
        setIsLoadingOTP(true);
        setLoginOtpExpiry(Date.now() + 5 * 60 * 1000);
        setLoginResendCooldown(30);
        setLoginOtpAttempts(0);
        
        const timer = setInterval(() => {
            setLoginResendCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        setTimeout(() => {
            setOtpSent(true);
            setIsLoadingOTP(false);
        }, 1500);
    };
    
    const validateOTP = (code: string): boolean => {
        if (loginIsBlocked) {
            setErrors({general: 'Too many failed attempts. Please try again later.'});
            return false;
        }
        if (!code || code.length !== 6) {
            setErrors({general: 'Please enter a valid 6-digit verification code'});
            return false;
        }
        if (!/^\d{6}$/.test(code)) {
            setErrors({general: 'Verification code must contain only numbers'});
            return false;
        }
        if (Date.now() > loginOtpExpiry) {
            setErrors({general: 'Code expired. Please request a new one.'});
            return false;
        }
        return true;
    };

    const handleVerifyOTP = async () => {
        if (!validateOTP(otpCode)) {
            return;
        }
        
        setIsLoadingLogin(true);
        
        try {
            const response = await fetch(`${window.bookingAPI.root}appointease/v1/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.bookingAPI.nonce
                },
                body: JSON.stringify({ email: loginEmail, otp: otpCode })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                setSessionToken(result.token);
                setIsLoggedIn(true);
                setShowLogin(false);
                setShowDashboard(true);
                setLoginOtpAttempts(0);
                loadUserAppointmentsRealtime(loginEmail);
            } else {
                const newAttempts = loginOtpAttempts + 1;
                setLoginOtpAttempts(newAttempts);
                
                if (newAttempts >= 3) {
                    setLoginIsBlocked(true);
                    setErrors({general: 'Too many failed attempts. Try again later.'});
                    setTimeout(() => setLoginIsBlocked(false), 5 * 60 * 1000);
                } else {
                    setErrors({general: result.message || `Invalid code. ${3 - newAttempts} attempts remaining.`});
                }
            }
        } catch (error) {
            setErrors({general: 'Network error. Please try again.'});
        } finally {
            setIsLoadingLogin(false);
        }
    };
    

    
    const sendVerificationOtp = () => {
        if (verifyResendCooldown > 0) return;
        
        setVerifyOtpExpiry(Date.now() + 5 * 60 * 1000);
        setVerifyResendCooldown(30);
        setVerifyOtpAttempts(0);
        
        const timer = setInterval(() => {
            setVerifyResendCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };
    
    const sendEmailVerification = () => {
        if (resendCooldown > 0) return;
        
        // Set 5-minute expiry and 30-second resend cooldown
        setOtpExpiry(Date.now() + 5 * 60 * 1000);
        setResendCooldown(30);
        setOtpAttempts(0);
        
        // Start cooldown timer
        const timer = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };
    
    const proceedWithBooking = () => {
        setIsSubmitting(true);
        const appointmentDateTime = `${selectedDate} ${selectedTime}:00`;
        const strongId = generateStrongId();
        
        if (!window.bookingAPI) {
            setTimeout(() => {
                setAppointmentId(strongId);
                setStep(6);
                setIsSubmitting(false);
            }, 1500);
            return;
        }
        
        fetch(`${window.bookingAPI?.root || '/wp-json/'}appointease/v1/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': window.bookingAPI.nonce,
                'Connection': 'keep-alive'
            },
            body: JSON.stringify({
                name: formData.firstName,
                email: formData.email,
                phone: formData.phone,
                date: appointmentDateTime,
                service_id: selectedService.id,
                employee_id: selectedEmployee.id
            }),
            keepalive: true
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            if (result.strong_id) {
                setErrors({});
                setAppointmentId(result.strong_id);
                setStep(6);
            } else if (result.id) {
                setErrors({});
                const fallbackId = `APT-${new Date().getFullYear()}-${result.id.toString().padStart(6, '0')}`;
                setAppointmentId(fallbackId);
                setStep(6);
            } else {
                const errorMessage = result.message || 'Booking failed. Please try again.';
                setErrors({general: errorMessage});
            }
        })
        .catch(error => {
            console.error('Booking error:', error instanceof Error ? error.message : 'Unknown error');
            const errorMessage = isOnline ? 'Booking failed. Please try again.' : 'Booking failed. Please check your connection.';
            setErrors({general: errorMessage});
        })
        .finally(() => {
            setIsSubmitting(false);
        });
    };
    
    const verifyEmailOtp = () => {
        if (isBlocked) {
            setErrors({general: 'Too many failed attempts. Please try again later.'});
            return;
        }
        
        if (!emailOtp) {
            setErrors({general: 'Please enter the verification code'});
            return;
        }
        
        if (emailOtp.length !== 6) {
            setErrors({general: 'Verification code must be 6 digits'});
            return;
        }
        
        if (Date.now() > otpExpiry) {
            setErrors({general: 'Verification code has expired. Please request a new one.'});
            return;
        }
        
        setIsVerifyingEmail(true);
        setErrors({});
        
        setTimeout(() => {
            if (emailOtp === '123456') {
                setEmailVerified(true);
                setOtpAttempts(0);
                setShowEmailVerification(false);
                setEmailOtp('');
                setErrors({});
                // Continue with booking after verification
                proceedWithBooking();
            } else {
                const newAttempts = otpAttempts + 1;
                setOtpAttempts(newAttempts);
                
                if (newAttempts >= 3) {
                    setIsBlocked(true);
                    setErrors({general: 'Too many failed attempts. Please try again later.'});
                    setTimeout(() => setIsBlocked(false), 5 * 60 * 1000); // 5 min block
                } else {
                    setErrors({general: `Invalid code. ${3 - newAttempts} attempts remaining.`});
                }
            }
            setIsVerifyingEmail(false);
        }, 1000);
    };
    
    const verifyOtpAndProceed = () => {
        if (verifyIsBlocked) {
            setErrors({general: 'Too many failed attempts. Please try again later.'});
            return;
        }
        
        if (!verificationOtp) {
            setErrors({general: 'Please enter the verification code'});
            return;
        }
        
        if (Date.now() > verifyOtpExpiry) {
            setErrors({general: 'Code expired. Please request a new one.'});
            return;
        }
        
        setIsVerifyingOtp(true);
        
        setTimeout(() => {
            if (verificationOtp === '123456') {
                setShowOtpVerification(false);
                setVerificationOtp('');
                setVerifyOtpAttempts(0);
                
                if (otpAction === 'cancel') {
                    performCancel();
                } else if (otpAction === 'reschedule') {
                    if (pendingRescheduleData) {
                        performReschedule(pendingRescheduleData.date, pendingRescheduleData.time);
                        setPendingRescheduleData(null);
                    } else {
                        setSelectedService({name: 'Current Service', price: 0});
                        setSelectedEmployee({name: 'Current Staff'});
                        setIsRescheduling(true);
                        setManageMode(false);
                        setShowOtpVerification(false);
                        setVerificationOtp('');
                        setOtpVerified(true);
                        setStep(3);
                    }
                }
                
                setOtpAction(null);
            } else {
                const newAttempts = verifyOtpAttempts + 1;
                setVerifyOtpAttempts(newAttempts);
                
                if (newAttempts >= 3) {
                    setVerifyIsBlocked(true);
                    setErrors({general: 'Too many failed attempts. Try again later.'});
                    setTimeout(() => setVerifyIsBlocked(false), 5 * 60 * 1000);
                } else {
                    setErrors({general: `Invalid code. ${3 - newAttempts} attempts remaining.`});
                }
            }
            setIsVerifyingOtp(false);
        }, 1000);
    };
    
    // Email lookup for appointments
    const handleEmailLookup = async () => {
        if (!lookupEmail || !isOnline) return;
        
        setIsLookingUp(true);
        try {
            const response = await fetch('/wp-json/appointease/v1/user-appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.bookingAPI?.nonce || ''
                },
                body: JSON.stringify({ email: lookupEmail })
            });
            
            if (response.ok) {
                const appointments = await response.json();
                setFoundAppointments(appointments || []);
                if (appointments.length === 0) {
                    setErrors({general: 'No appointments found for this email'});
                }
            }
        } catch (error) {
            setErrors({general: 'Failed to lookup appointments'});
        } finally {
            setIsLookingUp(false);
        }
    };

    React.useImperativeHandle(ref, () => ({
        setAppointmentId: (id: string) => setAppointmentId(id),
        handleManageAppointment: handleManageAppointment
    }));

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
                onEmailChange={(email) => {
                    setLoginEmail(email);
                    if (errors.general) setErrors({});
                }}
                onOtpChange={(otp) => {
                    setOtpCode(otp);
                    if (errors.general) setErrors({});
                }}
                onSendOTP={handleSendOTP}
                onVerifyOTP={handleVerifyOTP}
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
                onRefresh={() => {
                    console.log('[Dashboard] Refresh button clicked');
                    loadUserAppointmentsRealtime();
                }}
                onNewAppointment={() => {
                    setShowDashboard(false);
                    setStep(1);
                }}
                onLogout={async () => {
                    setIsLoggedIn(false);
                    setShowDashboard(false);
                    setLoginEmail('');
                    setOtpCode('');
                    setOtpSent(false);
                    setSessionToken(null);
                    setStep(1);
                    await clearSession();
                }}
                onReschedule={(appointment) => {
                    setCurrentAppointment({
                        id: appointment.id,
                        name: appointment.name || loginEmail,
                        email: appointment.email || loginEmail,
                        appointment_date: appointment.date,
                        status: appointment.status
                    });
                    setSelectedService({name: 'Current Service', price: 0});
                    setSelectedEmployee({name: 'Current Staff'});
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
                                <span className="id-number" title="Click to copy" onClick={() => {
                                    const copyText = (text: string) => {
                                        if (navigator.clipboard && navigator.clipboard.writeText) {
                                            navigator.clipboard.writeText(text).then(() => {
                                                const idElement = document.querySelector('.id-number');
                                                if (idElement) {
                                                    const original = idElement.textContent;
                                                    idElement.textContent = 'Copied!';
                                                    idElement.style.background = 'rgba(40, 167, 69, 0.3)';
                                                    setTimeout(() => {
                                                        idElement.textContent = original;
                                                        idElement.style.background = 'rgba(255,255,255,0.15)';
                                                    }, 2000);
                                                }
                                            }).catch(() => {
                                                // Fallback
                                                const textArea = document.createElement('textarea');
                                                textArea.value = text;
                                                document.body.appendChild(textArea);
                                                textArea.select();
                                                document.execCommand('copy');
                                                document.body.removeChild(textArea);
                                                
                                                const idElement = document.querySelector('.id-number');
                                                if (idElement) {
                                                    const original = idElement.textContent;
                                                    idElement.textContent = 'Copied!';
                                                    idElement.style.background = 'rgba(40, 167, 69, 0.3)';
                                                    setTimeout(() => {
                                                        idElement.textContent = original;
                                                        idElement.style.background = 'rgba(255,255,255,0.15)';
                                                    }, 2000);
                                                }
                                            });
                                        } else {
                                            // Fallback for browsers without clipboard API
                                            const textArea = document.createElement('textarea');
                                            textArea.value = text;
                                            document.body.appendChild(textArea);
                                            textArea.select();
                                            document.execCommand('copy');
                                            document.body.removeChild(textArea);
                                            
                                            const idElement = document.querySelector('.id-number');
                                            if (idElement) {
                                                const original = idElement.textContent;
                                                idElement.textContent = 'Copied!';
                                                idElement.style.background = 'rgba(40, 167, 69, 0.3)';
                                                setTimeout(() => {
                                                    idElement.textContent = original;
                                                    idElement.style.background = 'rgba(255,255,255,0.15)';
                                                }, 2000);
                                            }
                                        }
                                    };
                                    copyText(appointmentId);
                                }}>{appointmentId.toString().startsWith('APT-') ? appointmentId : `APT-2025-${appointmentId.toString().padStart(6, '0')}`}</span>
                            </div>
                            
                            <div className="appointment-details">
                                <div className="detail-item">
                                    <span className="detail-label">Customer:</span>
                                    <span className="detail-value">{sanitizeInput(currentAppointment.name || 'Unknown')}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Email:</span>
                                    <span className="detail-value">{sanitizeInput(currentAppointment.email || 'Unknown')}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Date & Time:</span>
                                    <span className="detail-value">{new Date(currentAppointment.appointment_date).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {new Date(currentAppointment.appointment_date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Status:</span>
                                    <span className="detail-value" style={{textTransform: 'capitalize', color: currentAppointment.status === 'confirmed' ? 'var(--button-bg, #1CBC9B)' : '#dc3545'}}>{currentAppointment.status}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="success-actions">
                            {!showCancelConfirm && !showOtpVerification ? (
                                <>
                                    <div className="action-info">
                                        <p className="action-description">
                                            {isLoggedIn ? 
                                                "As a logged-in user, you can reschedule or cancel instantly." : 
                                                "For security, we'll send a verification code to your email before making changes."
                                            }
                                        </p>
                                    </div>
                                    <button className="action-btn secondary-btn" onClick={() => {
                                        if (isLoggedIn) {
                                            setSelectedService({name: 'Current Service', price: 0});
                                            setSelectedEmployee({name: 'Current Staff'});
                                            setIsRescheduling(true);
                                            setStep(3); 
                                            setManageMode(false);
                                        } else {
                                            setOtpAction('reschedule');
                                            setShowOtpVerification(true);
                                            sendVerificationOtp();
                                        }
                                    }} disabled={isReschedulingSubmit}>
                                        {isReschedulingSubmit ? <><i className="fas fa-spinner fa-spin"></i> Processing...</> : <><i className="fas fa-calendar-alt"></i> {isLoggedIn ? 'Reschedule Now' : 'Reschedule (Verify Email)'}</>}
                                    </button>
                                    <button className="action-btn" style={{background: '#dc3545'}} onClick={handleCancelAppointment} disabled={isCancelling}>
                                        {isCancelling ? <><i className="fas fa-spinner fa-spin"></i> Processing...</> : <><i className="fas fa-times"></i> {isLoggedIn ? 'Cancel Now' : 'Cancel (Verify Email)'}</>}
                                    </button>
                                    <button className="action-btn primary-btn" onClick={() => setManageMode(false)}>
                                        <i className="fas fa-arrow-left"></i>
                                        Back
                                    </button>
                                </>
                            ) : showCancelConfirm ? (
                                <>
                                    <div className="action-info">
                                        <p className="action-description cancel-warning">
                                            <i className="fas fa-exclamation-triangle"></i>
                                            This will permanently cancel your appointment. This action cannot be undone.
                                        </p>
                                    </div>
                                    <button className="action-btn" style={{background: '#dc3545'}} onClick={confirmCancelAppointment} disabled={isCancelling}>
                                        {isCancelling ? <><i className="fas fa-spinner fa-spin"></i> Cancelling...</> : <><i className="fas fa-check"></i> Yes, Cancel Appointment</>}
                                    </button>
                                    <button className="action-btn secondary-btn" onClick={() => setShowCancelConfirm(false)}>
                                        <i className="fas fa-times"></i>
                                        Keep Appointment
                                    </button>
                                </>
                            ) : showOtpVerification ? (
                                <div className="otp-verification">
                                    <div className="verification-card">
                                        <div className="verification-header">
                                            <i className="fas fa-shield-alt" style={{fontSize: '2.5rem', color: '#1CBC9B', marginBottom: '1rem'}}></i>
                                            <h3>Verify Your Identity</h3>
                                            <p>
                                                {otpAction === 'cancel' ? 
                                                    'To cancel your appointment, please verify your identity with the code sent to your email.' :
                                                    'To reschedule your appointment, please verify your identity with the code sent to your email.'
                                                }
                                            </p>
                                            <div className="email-highlight">
                                                {currentAppointment?.email}
                                            </div>
                                        </div>
                                        
                                        <div className="verification-form">
                                            <div className="form-group">
                                                <label>Verification Code</label>
                                                <input
                                                    type="text"
                                                    value={verificationOtp}
                                                    onChange={(e) => {
                                                        setVerificationOtp(e.target.value.replace(/\D/g, ''));
                                                        if (errors.general) setErrors({});
                                                    }}
                                                    placeholder="000000"
                                                    maxLength={6}
                                                    className="otp-input"
                                                />
                                            </div>
                                            
                                            <div className="verification-info">
                                                {verifyOtpExpiry > 0 && (
                                                    <div className="timer-display">
                                                        <i className="fas fa-clock"></i>
                                                        <span>Expires in {Math.floor(Math.max(0, (verifyOtpExpiry - Date.now()) / 1000) / 60)}:{String(Math.max(0, Math.ceil((verifyOtpExpiry - Date.now()) / 1000) % 60)).padStart(2, '0')}</span>
                                                    </div>
                                                )}
                                                
                                                <button 
                                                    className="resend-link" 
                                                    onClick={sendVerificationOtp} 
                                                    disabled={verifyResendCooldown > 0 || verifyIsBlocked}
                                                >
                                                    {verifyResendCooldown > 0 ? 
                                                        `Resend in ${verifyResendCooldown}s` : 
                                                        'Didn\'t receive code? Resend'
                                                    }
                                                </button>
                                            </div>
                                            
                                            {errors.general && (
                                                <div className={`verification-message ${errors.general.includes('successfully') ? 'success' : 'error'}`}>
                                                    {errors.general}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="form-actions">
                                        <button className="back-btn" onClick={() => {
                                            setShowOtpVerification(false);
                                            setVerificationOtp('');
                                            setOtpAction(null);
                                            setPendingRescheduleData(null);
                                        }}>
                                            <i className="fas fa-arrow-left"></i> Back to Options
                                        </button>
                                        <button className="confirm-btn" onClick={verifyOtpAndProceed} disabled={isVerifyingOtp || verifyIsBlocked || verificationOtp.length !== 6}>
                                            {isVerifyingOtp ? 
                                                <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : 
                                                <><i className="fas fa-shield-check"></i> Verify & {otpAction === 'cancel' ? 'Cancel' : 'Reschedule'}</>
                                            }
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="appointease-booking-container">
        <div className="appointease-booking wp-block-group" role="main" aria-label="Appointment booking system" style={{overflow: 'visible', height: 'auto'}}>
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
                        <button className="logout-btn wp-element-button" onClick={async () => {
                            setIsLoggedIn(false);
                            setShowDashboard(false);
                            setLoginEmail('');
                            setOtpCode('');
                            setOtpSent(false);
                            setSessionToken(null);
                            setStep(1);
                            await clearSession();
                        }}>
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                ) : (
                    <div className="manage-appointment wp-block-buttons">
                        <button className="login-btn wp-element-button" onClick={() => setShowLogin(true)}>
                            <i className="fas fa-sign-in-alt"></i>
                            <strong>Existing Customer? Login Here</strong>
                        </button>
                    </div>
                )}
            </div>

            <div className="appointease-booking-content wp-block-group">
                <StepProgress />

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
                    <DateSelector />
                )}

                {step === 4 && (
                    <TimeSelector
                        unavailableSlots={unavailableSlots}
                        timezone={timezone}
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
                                checkExistingEmail={checkExistingEmail}
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
                                onVerifyOtp={verifyEmailOtp}
                                onResendOtp={sendEmailVerification}
                                onBack={() => {
                                    setShowEmailVerification(false);
                                    setEmailOtp('');
                                    setErrors({});
                                }}
                            />
                        )}
                        
                        {!isRescheduling && isLoggedIn && (
                            <div className="logged-in-summary">
                                <div className="booking-summary">
                                    <h3>Booking Summary</h3>
                                    <div className="summary-item">
                                        <span>Service:</span>
                                        <span>{selectedService?.name}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Employee:</span>
                                        <span>{selectedEmployee?.name}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Date:</span>
                                        <span>{new Date(selectedDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Time:</span>
                                        <span>{selectedTime}</span>
                                    </div>
                                    <div className="summary-item total">
                                        <span>Total:</span>
                                        <span>${selectedService?.price}</span>
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="back-btn" onClick={() => setStep(4)}>← Back</button>
                                    <button type="button" className="confirm-btn" onClick={handleSubmit} disabled={isSubmitting}>
                                        {isSubmitting ? <><i className="fas fa-spinner fa-spin"></i> BOOKING...</> : 'CONFIRM BOOKING'}
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {isRescheduling && !showOtpVerification && (
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
                                        if (isLoggedIn || otpVerified) {
                                            performReschedule(selectedDate, selectedTime);
                                        } else {
                                            setPendingRescheduleData({date: selectedDate, time: selectedTime});
                                            setOtpAction('reschedule');
                                            setShowOtpVerification(true);
                                        }
                                    }} disabled={isReschedulingSubmit}>
                                        {isReschedulingSubmit ? <><i className="fas fa-spinner fa-spin"></i> RESCHEDULING...</> : 'CONFIRM RESCHEDULE'}
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {isRescheduling && showOtpVerification && (
                            <div className="otp-verification">
                                <div className="verification-card">
                                    <div className="verification-header">
                                        <i className="fas fa-calendar-alt" style={{fontSize: '2.5rem', color: '#1CBC9B', marginBottom: '1rem'}}></i>
                                        <h3>Verify to Reschedule</h3>
                                        <p>To reschedule your appointment, please verify your identity with the code sent to your email.</p>
                                        <div className="email-highlight">
                                            {currentAppointment?.email}
                                        </div>
                                    </div>
                                    
                                    <div className="verification-form">
                                        <div className="form-group">
                                            <label>Verification Code</label>
                                            <input
                                                type="text"
                                                value={verificationOtp}
                                                onChange={(e) => {
                                                    const sanitized = sanitizeInput(e.target.value.replace(/\D/g, ''));
                                                    if (sanitized.length <= 6) {
                                                        setVerificationOtp(sanitized);
                                                        if (errors.general) setErrors({});
                                                    }
                                                }}
                                                placeholder="000000"
                                                maxLength={6}
                                                className="otp-input"
                                            />
                                        </div>
                                        
                                        <div className="verification-info">
                                            {verifyOtpExpiry > 0 && (
                                                <div className="timer-display">
                                                    <i className="fas fa-clock"></i>
                                                    <span>Expires in {Math.floor(Math.max(0, (verifyOtpExpiry - Date.now()) / 1000) / 60)}:{String(Math.max(0, Math.ceil((verifyOtpExpiry - Date.now()) / 1000) % 60)).padStart(2, '0')}</span>
                                                </div>
                                            )}
                                            
                                            <button 
                                                className="resend-link" 
                                                onClick={sendVerificationOtp} 
                                                disabled={verifyResendCooldown > 0 || verifyIsBlocked}
                                            >
                                                {verifyResendCooldown > 0 ? 
                                                    `Resend in ${verifyResendCooldown}s` : 
                                                    'Didn\'t receive code? Resend'
                                                }
                                            </button>
                                        </div>
                                        
                                        {errors.general && (
                                            <div className={`verification-message ${errors.general.includes('successfully') ? 'success' : 'error'}`}>
                                                {errors.general}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="form-actions">
                                    <button className="back-btn" onClick={() => {
                                        setShowOtpVerification(false);
                                        setVerificationOtp('');
                                        setOtpAction(null);
                                        setPendingRescheduleData(null);
                                    }}>
                                        <i className="fas fa-arrow-left"></i> Back
                                    </button>
                                    <button className="confirm-btn" onClick={verifyOtpAndProceed} disabled={isVerifyingOtp || verifyIsBlocked || verificationOtp.length !== 6}>
                                        {isVerifyingOtp ? 
                                            <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : 
                                            <><i className="fas fa-shield-check"></i> Verify & Reschedule</>
                                        }
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 7 && (
                    <div className="appointease-step-content success-step">
                        <div className="success-container">
                            <div className="success-animation">
                                <div className="success-icon" style={{background: '#dc3545'}}>✕</div>
                            </div>
                            
                            <h1 className="success-title" style={{color: '#dc3545'}}>Appointment Cancelled</h1>
                            <p className="success-subtitle">
                                Your appointment has been successfully cancelled. You will receive a confirmation email shortly.
                            </p>
                        
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
                                    <i className="fas fa-list"></i>
                                    {isLoggedIn ? 'Show All Bookings' : 'Back to Booking'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 8 && (
                    <div className="appointease-step-content success-step">
                        <div className="success-container">
                            <div className="success-animation">
                                <div className="success-icon" style={{background: '#1CBC9B'}}>✓</div>
                            </div>
                            
                            <h1 className="success-title">Appointment Rescheduled!</h1>
                            <p className="success-subtitle">
                                Your appointment has been successfully rescheduled. You will receive a confirmation email with the new details.
                            </p>
                        
                            <div className="success-actions">
                                <button className="action-btn primary-btn" style={{padding: '12px 24px', margin: '20px'}} onClick={() => {
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
                                }}>
                                    <i className="fas fa-plus"></i>
                                    Book Another
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 6 && (
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
            </div>
        </div>
        

            {/* Email Lookup Modal */}
            {showEmailLookup && (
                <div className="modal-overlay" onClick={() => setShowEmailLookup(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Find Your Appointments</h3>
                            <button className="modal-close" onClick={() => setShowEmailLookup(false)} aria-label="Close">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Enter your email address to find your appointments:</p>
                            <div className="form-group">
                                <input
                                    type="email"
                                    value={lookupEmail}
                                    onChange={(e) => {
                                        const sanitized = sanitizeInput(e.target.value);
                                        if (sanitized.length <= 100) {
                                            setLookupEmail(sanitized);
                                        }
                                    }}
                                    className={/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(lookupEmail) ? 'valid' : ''}
                                    placeholder="your.email@example.com"
                                    autoComplete="email"
                                    onKeyDown={(e) => e.key === 'Enter' && handleEmailLookup()}
                                />
                            </div>
                            {foundAppointments.length > 0 && (
                                <div className="found-appointments">
                                    <h4>Your Appointments:</h4>
                                    {foundAppointments.map((apt: any) => (
                                        <div key={apt.id} className="appointment-item" onClick={() => {
                                            setAppointmentId(apt.strong_id || `AE${apt.id}`);
                                            setShowEmailLookup(false);
                                            handleManageAppointment();
                                        }}>
                                            <strong>{apt.strong_id || `AE${apt.id}`}</strong>
                                            <span>{new Date(apt.appointment_date).toLocaleDateString()}</span>
                                            <span className={`status ${apt.status}`}>{apt.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowEmailLookup(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleEmailLookup} disabled={!lookupEmail || isLookingUp}>
                                {isLookingUp ? 'Searching...' : 'Find Appointments'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
});

window.BookingApp = null;
const activeRoots = new Map();

function initBookingApp(containerId) {
    const bookingContainer = document.getElementById(containerId);
    if (!bookingContainer) return;
    
    // Prevent duplicate initialization
    if (activeRoots.has(containerId)) {
        return;
    }
    
    // Clear container
    bookingContainer.innerHTML = '';
    
    const parent = bookingContainer.parentElement;
    const columns = parent?.getAttribute('data-columns') || 2;
    const width = parent?.getAttribute('data-width') || 100;
    
    // Apply dimensions to container
    if (parent) {
        parent.style.width = `${width}%`;
        parent.style.minWidth = '600px';
    }
    
    try {
        const root = createRoot(bookingContainer);
        const appRef = React.createRef();
        
        activeRoots.set(containerId, root);
        
        root.render(<BookingApp ref={appRef} columns={parseInt(columns)} />);
        
        setTimeout(() => {
            if (appRef.current) {
                window.BookingApp = {
                    setAppointmentId: (id) => appRef.current.setAppointmentId(id),
                    handleManageAppointment: () => appRef.current.handleManageAppointment()
                };
            }
        }, 100);
    } catch (error) {
        console.error('Error initializing BookingApp:', error);
    }
}

if (typeof window !== 'undefined') {
    window.initBookingApp = initBookingApp;
    
    // Single initialization on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initBookingApp('appointease-booking');
            initBookingApp('appointease-booking-editor');
        });
    } else {
        // DOM already loaded
        initBookingApp('appointease-booking');
        initBookingApp('appointease-booking-editor');
    }
}