import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './frontend.css';
import './reschedule.css';
import './login.css';

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

// Enhanced notification system
const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', title?: string) => {
    // Simple console log for now
    console.log(`${type.toUpperCase()}: ${message}`);
};

const createNotificationContainer = () => {
    const container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
};

const removeNotification = (notification: HTMLElement) => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
};

const showToast = () => {}; // Disabled

const BookingApp = React.forwardRef((props: any, ref) => {
    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [formData, setFormData] = useState<FormData>({ firstName: '', lastName: '', email: '', phone: '' });
    const [services, setServices] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [appointmentId, setAppointmentId] = useState<string>('');
    const [manageMode, setManageMode] = useState(false);
    const [currentAppointment, setCurrentAppointment] = useState<any>(null);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userAppointments, setUserAppointments] = useState<any[]>([]);
    const [showDashboard, setShowDashboard] = useState(false);
    const [isLoadingOTP, setIsLoadingOTP] = useState(false);
    const [isLoadingLogin, setIsLoadingLogin] = useState(false);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [employeesLoading, setEmployeesLoading] = useState(true);
    const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
    const [retryCount, setRetryCount] = useState(0);
    const liveRegionRef = useRef<HTMLDivElement>(null);
    const [formDataPersisted, setFormDataPersisted] = useState<FormData>({ firstName: '', lastName: '', email: '', phone: '' });
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [businessHours] = useState({ start: '09:00', end: '17:00', closedDays: [0, 6] });
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

    // Enhanced connection monitoring
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (retryCount > 0) {
                loadInitialData();
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
    }, [retryCount]);
    
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
    }, [loadInitialData]);

    const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

    const generateStrongId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const year = new Date().getFullYear();
        return `APT-${year}-${result}`;
    };
    

    
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
        setSelectedService(service);
        setErrors({});
        // Service selected
        setStep(2);
    };

    const handleEmployeeSelect = (employee: any) => {
        setSelectedEmployee(employee);
        setErrors({});
        setUnavailableSlots([]);
        // Employee selected
        setStep(3);
    };

    const handleDateSelect = (date: string) => {
        const selectedDateObj = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDateObj < today) {
            setErrors({general: 'Cannot select past dates'});
            return;
        }
        
        // Use business hours instead of hardcoded weekends
        if (businessHours.closedDays.includes(selectedDateObj.getDay())) {
            setErrors({general: 'This day is not available for appointments'});
            return;
        }
        
        setSelectedDate(date);
        setErrors({});
        const formattedDate = selectedDateObj.toLocaleDateString('en', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        // Date selected
        
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
        if (unavailableSlots.includes(time)) {
            setErrors({general: 'This time slot is not available'});
            return;
        }
        
        setSelectedTime(time);
        setErrors({});
        // Time selected
        
        setStep(5);
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'Name is required';
        } else if (formData.firstName.trim().length < 2) {
            newErrors.firstName = 'Name must be at least 2 characters';
        }
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        } else if (formData.phone && formData.phone.replace(/\D/g, '').length < 10) {
            newErrors.phone = 'Phone number must be at least 10 digits';
        }
        
        setErrors(newErrors);
        
        // Form validation complete
        
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
        
        fetch(`${window.bookingAPI?.root || '/wp-json/'}appointease/v1/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': window.bookingAPI.nonce,
                'Connection': 'keep-alive'
            },
            body: JSON.stringify({
                name: isLoggedIn ? loginEmail.split('@')[0] : formData.firstName,
                email: isLoggedIn ? loginEmail : formData.email,
                phone: isLoggedIn ? '' : formData.phone,
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
            } else if (result.id) {
                setErrors({});
                // Fallback: create strong_id format if not provided
                const fallbackId = `APT-${new Date().getFullYear()}-${result.id.toString().padStart(6, '0')}`;
                setAppointmentId(fallbackId);
                
                // Reload user appointments if logged in
                if (isLoggedIn) {
                    loadUserAppointments();
                }
                
                setStep(6);
            } else {
                const errorMessage = result.message || 'Booking failed. Please try again.';
                setErrors({general: errorMessage});
            }
        })
        .catch(error => {
            console.error('Booking error:', error);
            const errorMessage = isOnline ? 'Booking failed. Please try again.' : 'Booking failed. Please check your connection.';
            setErrors({general: errorMessage});
        })
        .finally(() => {
            setIsSubmitting(false);
        });
    };

    const generateCalendar = () => {
        const today = new Date();
        const days = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const handleManageAppointment = (appointmentIdToManage?: string) => {
        const idToUse = appointmentIdToManage || appointmentId;
        
        if (!idToUse || typeof idToUse !== 'string') {
            return;
        }
        
        setIsManaging(true);

        // For logged-in users, find appointment in userAppointments
        if (isLoggedIn && appointmentIdToManage) {
            const appointment = userAppointments.find(apt => apt.id === appointmentIdToManage);
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
                return;
            }
        }

        // Simulate search locally
        setTimeout(() => {
            setErrors({general: 'No appointment found with this ID. Please check your booking reference and try again.'});
            setIsManaging(false);
        }, 500);
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
        
        // Show spinner for 500ms then complete
        setTimeout(() => {
            setManageMode(false);
            setCurrentAppointment(null);
            setShowCancelConfirm(false);
            setShowOtpVerification(false);
            setStep(7); // Show cancellation confirmation
            setIsCancelling(false);
            if (isLoggedIn) {
                loadUserAppointments();
            }
        }, 500);
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
        
        // Simulate reschedule without API call
        setTimeout(() => {
            setManageMode(false);
            setCurrentAppointment(null);
            setIsRescheduling(false);
            setShowOtpVerification(false);
            setStep(8); // Show reschedule confirmation
            setIsReschedulingSubmit(false);
            if (isLoggedIn) {
                loadUserAppointments();
            }
        }, 1000);
    };

    const handleSendOTP = () => {
        if (!loginEmail || loginResendCooldown > 0) {
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
    
    const handleVerifyOTP = () => {
        if (loginIsBlocked) {
            setErrors({general: 'Too many failed attempts. Please try again later.'});
            return;
        }
        
        if (!otpCode) {
            setErrors({general: 'Please enter the verification code'});
            return;
        }
        
        if (Date.now() > loginOtpExpiry) {
            setErrors({general: 'Code expired. Please request a new one.'});
            return;
        }
        
        setIsLoadingLogin(true);
        setTimeout(() => {
            if (otpCode === '123456') {
                setIsLoggedIn(true);
                setShowLogin(false);
                setShowDashboard(true);
                setIsLoadingLogin(false);
                setLoginOtpAttempts(0);
                loadUserAppointments();
            } else {
                const newAttempts = loginOtpAttempts + 1;
                setLoginOtpAttempts(newAttempts);
                
                if (newAttempts >= 3) {
                    setLoginIsBlocked(true);
                    setErrors({general: 'Too many failed attempts. Try again later.'});
                    setTimeout(() => setLoginIsBlocked(false), 5 * 60 * 1000);
                } else {
                    setErrors({general: `Invalid code. ${3 - newAttempts} attempts remaining.`});
                }
                setIsLoadingLogin(false);
            }
        }, 1000);
    };
    
    const loadUserAppointments = () => {
        if (!window.bookingAPI) {
            setUserAppointments([]);
            return;
        }
        
        setIsLoadingAppointments(true);
        fetch(`${window.bookingAPI?.root || '/wp-json/'}appointease/v1/user-appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': window.bookingAPI.nonce
            },
            body: JSON.stringify({ email: loginEmail })
        })
        .then(response => response.json())
        .then(appointments => {
            const formattedAppointments = appointments.map((apt: any) => ({
                id: apt.strong_id || `AE${apt.id.toString().padStart(6, '0')}`,
                service: 'Service',
                staff: 'Staff Member',
                date: apt.appointment_date,
                status: apt.status,
                name: apt.name,
                email: apt.email
            }));
            setUserAppointments(formattedAppointments);
            setIsLoadingAppointments(false);
        })
        .catch(() => {
            setUserAppointments([]);
            setIsLoadingAppointments(false);
        });
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
            console.error('Booking error:', error);
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
                setErrors({general: 'Email verified successfully!'});
                setTimeout(() => {
                    setShowEmailVerification(false);
                    setEmailOtp('');
                    setErrors({});
                    // Continue with booking after verification
                    proceedWithBooking();
                }, 1500);
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
            <div className="appointease-booking">
                <div className="appointease-booking-header">
                    <div className="appointease-logo">
                        <span className="logo-icon">A</span>
                    </div>
                    <button className="close-btn" onClick={() => setShowLogin(false)}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="appointease-booking-content">
                    <div className="login-container">
                        <h2>Login to Your Account</h2>
                        <p>Access all your appointments and book new ones</p>
                        
                        {!otpSent ? (
                            <div className="login-form">
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        placeholder="Enter your email"
                                    />
                                </div>
                                <button className="send-otp-btn" onClick={handleSendOTP} disabled={isLoadingOTP}>
                                    {isLoadingOTP ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            Sending verification code...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-paper-plane"></i>
                                            Send Verification Code
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="otp-verification">
                                <div className="verification-card">
                                    <div className="verification-header">
                                        <i className="fas fa-sign-in-alt" style={{fontSize: '2.5rem', color: '#1CBC9B', marginBottom: '1rem'}}></i>
                                        <h3>Verify to Login</h3>
                                        <p>We've sent a 6-digit verification code to:</p>
                                        <div className="email-highlight">
                                            {loginEmail}
                                        </div>
                                    </div>
                                    
                                    <div className="verification-form">
                                        <div className="form-group">
                                            <label>Verification Code</label>
                                            <input
                                                type="text"
                                                value={otpCode}
                                                onChange={(e) => {
                                                    setOtpCode(e.target.value.replace(/\D/g, ''));
                                                    if (errors.general) setErrors({});
                                                }}
                                                placeholder="000000"
                                                maxLength={6}
                                                className="otp-input"
                                            />
                                        </div>
                                        
                                        <div className="verification-info">
                                            {loginOtpExpiry > 0 && (
                                                <div className="timer-display">
                                                    <i className="fas fa-clock"></i>
                                                    <span>Expires in {Math.floor(Math.max(0, (loginOtpExpiry - Date.now()) / 1000) / 60)}:{String(Math.max(0, Math.ceil((loginOtpExpiry - Date.now()) / 1000) % 60)).padStart(2, '0')}</span>
                                                </div>
                                            )}
                                            
                                            <button 
                                                className="resend-link" 
                                                onClick={handleSendOTP} 
                                                disabled={loginResendCooldown > 0 || loginIsBlocked}
                                            >
                                                {loginResendCooldown > 0 ? 
                                                    `Resend in ${loginResendCooldown}s` : 
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
                                        setOtpSent(false);
                                        setOtpCode('');
                                        setErrors({});
                                    }}>
                                        <i className="fas fa-arrow-left"></i> Back
                                    </button>
                                    <button className="confirm-btn" onClick={handleVerifyOTP} disabled={isLoadingLogin || loginIsBlocked || otpCode.length !== 6}>
                                        {isLoadingLogin ? (
                                            <><i className="fas fa-spinner fa-spin"></i> Verifying...</>
                                        ) : (
                                            <><i className="fas fa-shield-check"></i> Verify & Login</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    
    if (showDashboard) {
        return (
            <div className="appointease-booking">
                <div className="appointease-booking-header">
                    <div className="appointease-logo">
                        <span className="logo-icon">A</span>
                    </div>
                    <div className="user-menu">
                        <button className="logout-btn" onClick={() => {
                            setIsLoggedIn(false);
                            setShowDashboard(false);
                            setLoginEmail('');
                            setOtpCode('');
                            setOtpSent(false);
                            setStep(1);
                            // Logged out
                        }}>
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>
                <div className="appointease-booking-content">
                    <div className="dashboard-container">
                        <div className="dashboard-header">
                            <div className="dashboard-title-section">
                                <h2>My Appointments</h2>
                                <span className="dashboard-email" style={{color: 'black'}}>{loginEmail}</span>
                            </div>
                            <button className="new-appointment-btn" onClick={() => {
                                setShowDashboard(false);
                                setStep(1);
                            }}>
                                <i className="fas fa-plus"></i>
                                <div className="btn-content">
                                    <span className="btn-title">New Appointment</span>
                                    <span className="btn-desc">Book another appointment</span>
                                </div>
                            </button>
                        </div>
                        
                        <div className="appointments-grid">
                            {isLoadingAppointments ? (
                                <div className="loading-appointments">
                                    <div className="spinner"></div>
                                    <span>Loading your appointments...</span>
                                </div>
                            ) : userAppointments.length === 0 ? (
                                <div className="no-appointments">
                                    <i className="fas fa-calendar-times"></i>
                                    <span>No appointments found</span>
                                </div>
                            ) : (
                                userAppointments.map(appointment => (
                                <div key={appointment.id} className="appointment-card-mini">
                                    <div className="appointment-id-mini">
                                        <span className="id-text">{appointment.id}</span>
                                        <span className={`status-badge ${appointment.status}`}>
                                            {appointment.status === 'confirmed' && <><i className="fas fa-check"></i> Confirmed</>}
                                            {appointment.status === 'cancelled' && <><i className="fas fa-times"></i> Cancelled</>}
                                            {appointment.status === 'rescheduled' && <><i className="fas fa-calendar-alt"></i> Rescheduled</>}
                                            {appointment.status === 'created' && <><i className="fas fa-plus"></i> Created</>}
                                        </span>
                                    </div>
                                    <div className="appointment-info">
                                        <div className="info-row">
                                            <i className="fas fa-briefcase"></i>
                                            <span>{appointment.service}</span>
                                        </div>
                                        <div className="info-row">
                                            <i className="fas fa-user-md"></i>
                                            <span>{appointment.staff}</span>
                                        </div>
                                        <div className="info-row">
                                            <i className="fas fa-calendar"></i>
                                            <span>{new Date(appointment.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="info-row">
                                            <i className="fas fa-clock"></i>
                                            <span>{new Date(appointment.date).toLocaleTimeString('en', {hour: '2-digit', minute: '2-digit'})}</span>
                                        </div>
                                    </div>
                                    <div className="appointment-actions-mini">
                                        <button className="manage-mini-btn" onClick={() => {
                                            setShowDashboard(false);
                                            handleManageAppointment(appointment.id);
                                        }} disabled={isManaging}>
                                            {isManaging ? <><i className="fas fa-spinner fa-spin"></i> Loading...</> : 'Manage'}
                                        </button>
                                    </div>
                                </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
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
                                    <span className="detail-value">{currentAppointment.name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Email:</span>
                                    <span className="detail-value">{currentAppointment.email}</span>
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
        <div className="appointease-booking" role="main" aria-label="Appointment booking system" style={{overflow: 'visible', height: 'auto'}}>
            <div ref={liveRegionRef} className="live-region" aria-live="polite" aria-atomic="true"></div>
            {!isOnline && (
                <div className="connection-status show" role="alert">
                    <i className="fas fa-wifi"></i>
                    You are offline
                </div>
            )}
            <div className="appointease-booking-header">
                <div className="appointease-logo">
                    <span className="logo-icon">A</span>
                </div>
                {isLoggedIn ? (
                    <div className="user-menu">
                        <button className="dashboard-btn" onClick={() => setShowDashboard(true)}>
                            <i className="fas fa-th-large"></i>
                            <div className="dashboard-btn-content">
                                <span>My Appointments</span>
                                <span className="dashboard-btn-email">{loginEmail}</span>
                            </div>
                        </button>
                        <button className="logout-btn" onClick={() => {
                            setIsLoggedIn(false);
                            setShowDashboard(false);
                            setLoginEmail('');
                            setOtpCode('');
                            setOtpSent(false);
                            setStep(1);
                            // Logged out
                        }}>
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                ) : (
                    <div className="manage-appointment">
                        <button className="login-btn" onClick={() => setShowLogin(true)}>
                            <i className="fas fa-sign-in-alt"></i>
                            <strong>Existing Customer? Login Here</strong>
                        </button>
                    </div>
                )}
            </div>

            <div className="appointease-booking-content">
                <div className="appointease-steps">
                    <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <span className="step-number">1</span>
                        <span className="step-label">Service</span>
                    </div>
                    <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        <span className="step-number">2</span>
                        <span className="step-label">Employee</span>
                    </div>
                    <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                        <span className="step-number">3</span>
                        <span className="step-label">Date</span>
                    </div>
                    <div className={`step ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
                        <span className="step-number">4</span>
                        <span className="step-label">Time</span>
                    </div>
                    <div className={`step ${step >= 5 ? 'active' : ''} ${step > 5 ? 'completed' : ''}`}>
                        <span className="step-number">5</span>
                        <span className="step-label">Info</span>
                    </div>
                </div>

                {step === 1 && (
                    <div className="appointease-step-content">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{width: '20%'}}></div>
                        </div>
                        <h2>Choose Your Service</h2>
                        <p className="step-description">Select the service you'd like to book</p>
                        
                        {!isOnline && (
                            <div className="offline-banner">
                                <i className="fas fa-wifi"></i>
                                You are offline. Limited functionality available.
                            </div>
                        )}

                        <div className="services-grid" style={{gridTemplateColumns: `repeat(${props.columns || 2}, 1fr)`}} role="grid" aria-label="Available services">
                            {servicesLoading ? (
                                // Loading skeleton
                                Array.from({length: 4}).map((_, index) => (
                                    <div key={index} className="service-card skeleton skeleton-card" aria-hidden="true">
                                        <div className="skeleton-text short"></div>
                                        <div className="skeleton-text medium"></div>
                                        <div className="skeleton-text long"></div>
                                    </div>
                                ))
                            ) : services.length === 0 ? (
                                // Empty state
                                <div className="empty-state" role="status">
                                    <i className="fas fa-briefcase" aria-hidden="true"></i>
                                    <h3>No Services Available</h3>
                                    <p>Please try again later or contact support.</p>
                                    <button className="retry-btn" onClick={() => loadInitialData()}>
                                        <i className="fas fa-redo"></i> Retry
                                    </button>
                                </div>
                            ) : (
                                services.map(service => (
                                    <div 
                                        key={service.id} 
                                        className="service-card" 
                                        onClick={() => handleServiceSelect(service)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleServiceSelect(service)}
                                        tabIndex={0}
                                        role="button"
                                        aria-label={`Select ${service.name} service, ${service.duration} minutes, $${service.price}`}
                                    >
                                        <div className="service-icon" aria-hidden="true"><i className="ri-briefcase-line"></i></div>
                                        <div className="service-info">
                                            <h3>{service.name}</h3>
                                            <p>{service.description}</p>
                                            <div className="service-meta">
                                                <span className="duration"><i className="ri-time-line" aria-hidden="true"></i> {service.duration} min</span>
                                                <span className="price"><i className="ri-money-dollar-circle-line" aria-hidden="true"></i> ${service.price}</span>
                                            </div>
                                        </div>
                                        <div className="service-arrow" aria-hidden="true"><i className="ri-arrow-right-line"></i></div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="appointease-step-content">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{width: '40%'}}></div>
                        </div>
                        <h2>Choose Your Specialist</h2>
                        <p className="step-description">Select who you'd like to work with</p>

                        <div className="employees-grid" role="grid" aria-label="Available specialists">
                            {employeesLoading ? (
                                Array.from({length: 3}).map((_, index) => (
                                    <div key={index} className="employee-card skeleton skeleton-card" aria-hidden="true">
                                        <div className="skeleton-text short"></div>
                                        <div className="skeleton-text medium"></div>
                                    </div>
                                ))
                            ) : employees.length === 0 ? (
                                <div className="empty-state" role="status">
                                    <i className="fas fa-user-md" aria-hidden="true"></i>
                                    <h3>No Specialists Available</h3>
                                    <p>Please try again later or contact support.</p>
                                    <button className="retry-btn" onClick={() => loadInitialData()}>
                                        <i className="fas fa-redo"></i> Retry
                                    </button>
                                </div>
                            ) : (
                                employees.map(employee => (
                                    <div 
                                        key={employee.id} 
                                        className="employee-card" 
                                        onClick={() => handleEmployeeSelect(employee)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleEmployeeSelect(employee)}
                                        tabIndex={0}
                                        role="button"
                                        aria-label={`Select ${employee.name}, rated ${employee.rating} stars with ${employee.reviews} reviews`}
                                    >
                                        <div className="employee-avatar" aria-hidden="true">{employee.avatar}</div>
                                        <div className="employee-info">
                                            <h3>{employee.name}</h3>
                                            <div className="employee-rating">
                                                <span className="rating"><i className="ri-star-fill" aria-hidden="true"></i> {employee.rating}</span>
                                                <span className="reviews">({employee.reviews} reviews)</span>
                                            </div>
                                        </div>
                                        <div className="employee-arrow" aria-hidden="true"><i className="ri-arrow-right-line"></i></div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="form-actions">
                            <button className="back-btn" onClick={() => setStep(1)} aria-label="Go back to service selection">
                                <i className="fas fa-arrow-left" aria-hidden="true"></i> Back
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="appointease-step-content">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{width: '60%'}}></div>
                        </div>
                        <h2>Pick Your Date</h2>
                        <p className="step-description">Choose when you'd like your appointment</p>
                        <div className="calendar-grid" role="grid" aria-label="Calendar for date selection">
                            {generateCalendar().map((date, index) => {
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                const isPast = date < new Date(new Date().setHours(0,0,0,0));
                                const isDisabled = isWeekend || isPast;
                                const dateString = date.toISOString().split('T')[0];
                                const formattedDate = date.toLocaleDateString('en', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                });
                                
                                return (
                                    <div 
                                        key={index} 
                                        className={`calendar-day ${isDisabled ? 'disabled' : ''}`}
                                        onClick={() => !isDisabled && handleDateSelect(dateString)}
                                        onKeyDown={(e) => e.key === 'Enter' && !isDisabled && handleDateSelect(dateString)}
                                        tabIndex={isDisabled ? -1 : 0}
                                        role="button"
                                        aria-label={isDisabled ? `${formattedDate} - unavailable` : `Select ${formattedDate}`}
                                        aria-disabled={isDisabled}
                                    >
                                        <span className="day-name">{date.toLocaleDateString('en', { weekday: 'short' })}</span>
                                        <span className="day-number">{date.getDate()}</span>
                                        <span className="day-month">{date.toLocaleDateString('en', { month: 'short' })}</span>
                                        {isWeekend && <span className="unavailable">Closed</span>}
                                        {isPast && !isWeekend && <span className="unavailable">Past</span>}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="form-actions">
                            <button className="back-btn" onClick={() => setStep(2)} aria-label="Go back to specialist selection">
                                <i className="fas fa-arrow-left" aria-hidden="true"></i> Back
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="appointease-step-content">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{width: '80%'}}></div>
                        </div>
                        <h2>Choose Your Time</h2>
                        <p className="step-description">Select your preferred time slot</p>
                        <div className="selected-info" role="status">
                            <span><i className="ri-calendar-line" aria-hidden="true"></i> {new Date(selectedDate).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="timezone-info" role="status">
                            <i className="fas fa-clock" aria-hidden="true"></i>
                            All times shown in {timezone}
                        </div>
                        <div className="time-slots" role="grid" aria-label="Available time slots">
                            {timeSlots.map(time => {
                                const isUnavailable = unavailableSlots.includes(time);
                                const serviceDuration = selectedService?.duration || 30;
                                return (
                                    <div 
                                        key={time} 
                                        className={`time-slot ${isUnavailable ? 'unavailable' : ''}`}
                                        onClick={() => handleTimeSelect(time)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleTimeSelect(time)}
                                        tabIndex={isUnavailable ? -1 : 0}
                                        role="button"
                                        aria-label={`${time} for ${serviceDuration} minutes - ${isUnavailable ? 'unavailable' : 'available'}`}
                                        aria-disabled={isUnavailable}
                                    >
                                        <div className="time-info">
                                            <span className="time">{time}</span>
                                            <span className="duration">{serviceDuration} min</span>
                                        </div>
                                        <span className="status">{isUnavailable ? 'Unavailable' : 'Available'}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="form-actions">
                            <button className="back-btn" onClick={() => setStep(3)} aria-label="Go back to date selection">
                                <i className="fas fa-arrow-left" aria-hidden="true"></i> Back
                            </button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="appointease-step-content">
                        {isRescheduling ? (
                            <>
                                <div className="reschedule-banner">
                                    <i className="fas fa-calendar-alt"></i>
                                    <span>Rescheduling Appointment {appointmentId}</span>
                                </div>
                                <h2>Confirm New Time</h2>
                                <p className="step-description">Review your new appointment details</p>
                            </>
                        ) : (
                            <>
                                <h2>Almost Done!</h2>
                                <p className="step-description">Please provide your contact information</p>
                            </>
                        )}
                        {!isRescheduling && !isLoggedIn && !showEmailVerification && <form onSubmit={handleSubmit} className="customer-form" noValidate>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">Name *</label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => {
                                            setFormData({...formData, firstName: e.target.value});
                                            if (errors.firstName) setErrors({...errors, firstName: undefined});
                                        }}
                                        className={errors.firstName ? 'error' : formData.firstName.length >= 2 ? 'valid' : ''}
                                        placeholder="Enter your name"
                                        aria-describedby={errors.firstName ? 'name-error' : undefined}
                                        aria-invalid={!!errors.firstName}
                                        autoComplete="name"
                                        required
                                    />

                                    {errors.firstName && (
                                        <span className="validation-icon invalid" aria-hidden="true">✕</span>
                                    )}
                                    {errors.firstName && <span id="name-error" className="error-message" role="alert">{errors.firstName}</span>}
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="email">Email *</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => {
                                            setFormData({...formData, email: e.target.value});
                                            if (errors.email) setErrors({...errors, email: undefined});
                                        }}
                                        className={errors.email ? 'error' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'valid' : ''}
                                        placeholder="Enter your email address"
                                        aria-describedby={errors.email ? 'email-error' : undefined}
                                        aria-invalid={!!errors.email}
                                        autoComplete="email"
                                        required
                                    />

                                    {errors.email && (
                                        <span className="validation-icon invalid" aria-hidden="true">✕</span>
                                    )}
                                    {errors.email && <span id="email-error" className="error-message" role="alert">{errors.email}</span>}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phone">Phone (optional)</label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            // Auto-format phone number
                                            let value = e.target.value.replace(/\D/g, '');
                                            if (value.length >= 6) {
                                                value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                                            } else if (value.length >= 3) {
                                                value = value.replace(/(\d{3})(\d+)/, '($1) $2');
                                            }
                                            setFormData({...formData, phone: value});
                                            if (errors.phone) setErrors({...errors, phone: undefined});
                                        }}
                                        className={errors.phone ? 'error' : formData.phone && /^[\d\s\-\+\(\)]+$/.test(formData.phone) && formData.phone.replace(/\D/g, '').length >= 10 ? 'valid' : ''}
                                        placeholder="(555) 123-4567"
                                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                                        aria-invalid={!!errors.phone}
                                        autoComplete="tel"
                                    />

                                    {errors.phone && (
                                        <span className="validation-icon invalid" aria-hidden="true">✕</span>
                                    )}
                                    {errors.phone && <span id="phone-error" className="error-message" role="alert">{errors.phone}</span>}
                                </div>
                            </div>
                            
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
                                <button type="button" className="btn btn-secondary" onClick={() => setStep(4)} disabled={isSubmitting} aria-label="Go back to time selection">
                                    <i className="fas fa-arrow-left" aria-hidden="true"></i> Back
                                </button>
                                <button type="submit" className={`confirm-btn ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting} aria-describedby="booking-status">
                                    {isSubmitting ? (
                                        <>
                                            <span className="sr-only">Booking in progress</span>
                                            <span aria-hidden="true">BOOKING...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-check" aria-hidden="true"></i>
                                            CONFIRM BOOKING
                                        </>
                                    )}
                                </button>
                            </div>
                            <div id="booking-status" className="sr-only" aria-live="polite" aria-atomic="true">
                                {isSubmitting ? 'Booking your appointment, please wait...' : ''}
                            </div>
                        </form>}
                        
                        {!isRescheduling && !isLoggedIn && showEmailVerification && (
                            <div className="email-verification">
                                <div className="verification-card">
                                    <div className="verification-header">
                                        <i className="fas fa-envelope-open" style={{fontSize: '2.5rem', color: '#1CBC9B', marginBottom: '1rem'}}></i>
                                        <h3>Check Your Email</h3>
                                        <p>We've sent a 6-digit verification code to:</p>
                                        <div className="email-highlight">
                                            {formData.email}
                                        </div>
                                    </div>
                                    
                                    <div className="verification-form">
                                        <div className="form-group">
                                            <label>Verification Code</label>
                                            <input
                                                type="text"
                                                value={emailOtp}
                                                onChange={(e) => {
                                                    setEmailOtp(e.target.value.replace(/\D/g, ''));
                                                    if (errors.general) setErrors({});
                                                }}
                                                placeholder="000000"
                                                maxLength={6}
                                                className="otp-input"
                                            />
                                        </div>
                                        
                                        <div className="verification-info">
                                            {otpExpiry > 0 && (
                                                <div className="timer-display">
                                                    <i className="fas fa-clock"></i>
                                                    <span>Expires in {Math.floor(Math.max(0, (otpExpiry - Date.now()) / 1000) / 60)}:{String(Math.max(0, Math.ceil((otpExpiry - Date.now()) / 1000) % 60)).padStart(2, '0')}</span>
                                                </div>
                                            )}
                                            
                                            <button 
                                                className="resend-link" 
                                                onClick={sendEmailVerification} 
                                                disabled={resendCooldown > 0 || isBlocked}
                                            >
                                                {resendCooldown > 0 ? 
                                                    `Resend in ${resendCooldown}s` : 
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
                                        setShowEmailVerification(false);
                                        setEmailOtp('');
                                        setErrors({});
                                    }}>
                                        <i className="fas fa-arrow-left"></i> Back to Form
                                    </button>
                                    <button className="confirm-btn" onClick={verifyEmailOtp} disabled={isVerifyingEmail || isBlocked || emailOtp.length !== 6}>
                                        {isVerifyingEmail ? 
                                            <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : 
                                            <><i className="fas fa-shield-check"></i> Verify & Book</>
                                        }
                                    </button>
                                </div>
                            </div>
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
                                    <button type="button" className="confirm-btn" onClick={handleSubmit}>
                                        CONFIRM BOOKING
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
                                }}>
                                    <i className="fas fa-plus"></i>
                                    Book New Appointment
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
                                <button className="action-btn primary-btn" onClick={() => {
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
                    <div className="appointease-step-content success-step">
                        <div className="success-container">
                            <div className="success-animation">
                                <div className="success-icon">✓</div>
                            </div>
                            
                            <h1 className="success-title">Booking Confirmed!</h1>
                            <p className="success-subtitle">
                                Your appointment has been successfully booked. We've sent a confirmation email to <strong>{formData.email}</strong>.
                            </p>
                        
                            <div className="appointment-card">
                                <div className="appointment-id">
                                    <span className="id-label">Your Booking Reference</span>
                                    <span 
                                        className="id-number" 
                                        title="Click to copy" 
                                        onClick={() => {
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
                                                        // Fallback for clipboard API failure
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
                                        }}
                                    >
                                        {appointmentId}
                                    </span>
                                </div>
                                
                                <div className="appointment-details">
                                    <div className="detail-item">
                                        <span className="detail-label">Service:</span>
                                        <span className="detail-value">{selectedService?.name}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="icon">
                                            <i className="fas fa-user-md"></i>
                                        </span>
                                        <div>
                                            <span className="label">Specialist</span>
                                            <span className="value">{selectedEmployee?.name}</span>
                                        </div>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Date & Time:</span>
                                        <span className="detail-value">
                                            {new Date(selectedDate).toLocaleDateString('en', { 
                                                weekday: 'long', 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })} at {selectedTime}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Total:</span>
                                        <span className="detail-value">${parseFloat(selectedService?.price || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        
                            <div className="info-note">
                                <i className="fas fa-info-circle"></i>
                                Save your reference for future management.
                            </div>
                        
                            <div className="success-actions">
                                <button className="action-btn primary-btn" onClick={() => {
                                    setStep(1);
                                    setSelectedService(null);
                                    setSelectedEmployee(null);
                                    setSelectedDate('');
                                    setSelectedTime('');
                                    setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                                    setAppointmentId('');
                                    setErrors({});
                                }}>
                                    <i className="fas fa-plus"></i>
                                    Book Another
                                </button>
                                
                                <button className="action-btn secondary-btn" onClick={() => {
                                    setManageMode(true);
                                    setCurrentAppointment({
                                        id: appointmentId,
                                        name: isLoggedIn ? loginEmail.split('@')[0] : formData.firstName,
                                        email: isLoggedIn ? loginEmail : formData.email,
                                        appointment_date: `${selectedDate} ${selectedTime}:00`,
                                        status: 'confirmed'
                                    });
                                }}>
                                    <i className="fas fa-edit"></i>
                                    Manage
                                </button>
                            </div>
                        

                        </div>
                    </div>
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
                                    onChange={(e) => setLookupEmail(e.target.value)}
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
        </>
    );
});

window.BookingApp = null;

function initBookingApp(containerId) {
    const bookingContainer = document.getElementById(containerId);
    if (bookingContainer) {
        bookingContainer.innerHTML = '';
        
        const parent = bookingContainer.parentElement;
        const columns = parent?.getAttribute('data-columns') || 2;
        const width = parent?.getAttribute('data-width') || 100;
        const height = parent?.getAttribute('data-height') || 600;
        
        // Apply dimensions to container
        if (parent) {
            parent.style.width = `${width}%`;
            parent.style.minWidth = '600px';
        }
        
        const root = createRoot(bookingContainer);
        const appRef = React.createRef();
        
        root.render(<BookingApp ref={appRef} columns={parseInt(columns)} />);
        
        setTimeout(() => {
            if (appRef.current) {
                window.BookingApp = {
                    setAppointmentId: (id) => appRef.current.setAppointmentId(id),
                    handleManageAppointment: () => appRef.current.handleManageAppointment()
                };
            }
        }, 100);
    }
}

if (typeof window !== 'undefined') {
    window.initBookingApp = initBookingApp;
    
    setTimeout(() => {
        initBookingApp('appointease-booking');
        initBookingApp('appointease-booking-editor');
    }, 10);
    
    document.addEventListener('DOMContentLoaded', () => {
        initBookingApp('appointease-booking');
        initBookingApp('appointease-booking-editor');
    });
    
    window.addEventListener('load', () => {
        initBookingApp('appointease-booking');
        initBookingApp('appointease-booking-editor');
    });
}