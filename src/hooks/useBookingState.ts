import { useState } from 'react';

export const useBookingState = () => {
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
    const [isCheckingSession, setIsCheckingSession] = useState(false);

    return {
        appointmentId, setAppointmentId,
        manageMode, setManageMode,
        currentAppointment, setCurrentAppointment,
        isRescheduling, setIsRescheduling,
        showLogin, setShowLogin,
        loginEmail, setLoginEmail,
        otpCode, setOtpCode,
        otpSent, setOtpSent,
        isLoggedIn, setIsLoggedIn,
        showDashboard, setShowDashboard,
        isLoadingOTP, setIsLoadingOTP,
        isLoadingLogin, setIsLoadingLogin,
        isLoadingAppointments, setIsLoadingAppointments,
        showCancelConfirm, setShowCancelConfirm,
        unavailableSlots, setUnavailableSlots,
        bookingDetails, setBookingDetails,
        retryCount, setRetryCount,
        timezone, setTimezone,
        showEmailLookup, setShowEmailLookup,
        lookupEmail, setLookupEmail,
        foundAppointments, setFoundAppointments,
        isLookingUp, setIsLookingUp,
        isManaging, setIsManaging,
        isCancelling, setIsCancelling,
        isReschedulingSubmit, setIsReschedulingSubmit,
        showOtpVerification, setShowOtpVerification,
        otpAction, setOtpAction,
        verificationOtp, setVerificationOtp,
        isVerifyingOtp, setIsVerifyingOtp,
        pendingRescheduleData, setPendingRescheduleData,
        otpVerified, setOtpVerified,
        showEmailVerification, setShowEmailVerification,
        emailOtp, setEmailOtp,
        isVerifyingEmail, setIsVerifyingEmail,
        emailVerified, setEmailVerified,
        otpExpiry, setOtpExpiry,
        resendCooldown, setResendCooldown,
        otpAttempts, setOtpAttempts,
        isBlocked, setIsBlocked,
        loginOtpExpiry, setLoginOtpExpiry,
        loginResendCooldown, setLoginResendCooldown,
        loginOtpAttempts, setLoginOtpAttempts,
        loginIsBlocked, setLoginIsBlocked,
        verifyOtpExpiry, setVerifyOtpExpiry,
        verifyResendCooldown, setVerifyResendCooldown,
        verifyOtpAttempts, setVerifyOtpAttempts,
        verifyIsBlocked, setVerifyIsBlocked,
        currentPage, setCurrentPage,
        appointmentsPerPage, setAppointmentsPerPage,
        isCheckingEmail, setIsCheckingEmail,
        existingUser, setExistingUser,
        sessionToken, setSessionToken,
        isCheckingSession, setIsCheckingSession
    };
};