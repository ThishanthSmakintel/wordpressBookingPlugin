import { useState } from 'react';

export interface BookingUIState {
  // Appointment Management
  appointmentId: string;
  manageMode: boolean;
  currentAppointment: any;
  isRescheduling: boolean;
  
  // Authentication
  showLogin: boolean;
  loginEmail: string;
  isLoggedIn: boolean;
  showDashboard: boolean;
  
  // OTP & Verification
  otpCode: string;
  otpSent: boolean;
  showEmailVerification: boolean;
  emailOtp: string;
  emailVerified: boolean;
  
  // Loading States
  isLoadingOTP: boolean;
  isLoadingLogin: boolean;
  isLoadingAppointments: boolean;
  isVerifyingEmail: boolean;
  
  // UI States
  showCancelConfirm: boolean;
  showEmailLookup: boolean;
  showOtpVerification: boolean;
  
  // Data States
  unavailableSlots: string[] | 'all';
  bookingDetails: Record<string, any>;
  foundAppointments: any[];
  lookupEmail: string;
  
  // Action States
  isLookingUp: boolean;
  isManaging: boolean;
  isCancelling: boolean;
  isReschedulingSubmit: boolean;
  isVerifyingOtp: boolean;
  isCheckingEmail: boolean;
  
  // System
  retryCount: number;
  timezone: string;
}

export const useBookingUIState = () => {
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
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

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
    isVerifyingOtp, setIsVerifyingOtp,
    showEmailVerification, setShowEmailVerification,
    emailOtp, setEmailOtp,
    isVerifyingEmail, setIsVerifyingEmail,
    emailVerified, setEmailVerified,
    isCheckingEmail, setIsCheckingEmail
  };
};