import React from 'react';
import { FormErrors } from '../../types';
import { useBookingStore } from '../../store/bookingStore';
import { sanitizeInput } from '../../utils';

interface EmailVerificationProps {
    emailOtp: string;
    otpExpiry: number;
    resendCooldown: number;
    isBlocked: boolean;
    isVerifyingEmail: boolean;
    onOtpChange: (otp: string) => void;
    onVerifyOtp: () => void;
    onResendOtp: () => void;
    onBack: () => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({
    emailOtp,
    otpExpiry,
    resendCooldown,
    isBlocked,
    isVerifyingEmail,
    onOtpChange,
    onVerifyOtp,
    onResendOtp,
    onBack
}) => {
    const { formData, errors, setErrors } = useBookingStore();
    return (
        <div className="email-verification">
            <div className="verification-card">
                <div className="verification-header">
                    <i className="fas fa-envelope-open" style={{fontSize: '2.5rem', color: '#1CBC9B', marginBottom: '1rem'}}></i>
                    <h3>Check Your Email</h3>
                    <p>We've sent a 6-digit verification code to:</p>
                    <div className="email-highlight">
                        {formData?.email}
                    </div>
                </div>
                
                <div className="verification-form">
                    <div className="form-group">
                        <label>Verification Code</label>
                        <input
                            type="text"
                            value={emailOtp}
                            onChange={(e) => {
                                const sanitized = sanitizeInput(e.target.value.replace(/\D/g, ''));
                                if (sanitized.length <= 6) {
                                    onOtpChange(sanitized);
                                    if (errors.general) setErrors({});
                                }
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
                            onClick={onResendOtp} 
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
                <button className="back-btn" onClick={onBack}>
                    <i className="fas fa-arrow-left"></i> Back to Form
                </button>
                <button className="confirm-btn" onClick={onVerifyOtp} disabled={isVerifyingEmail || isBlocked || emailOtp.length !== 6}>
                    {isVerifyingEmail ? 
                        <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : 
                        <><i className="fas fa-shield-check"></i> Verify & Book</>
                    }
                </button>
            </div>
        </div>
    );
};

export default EmailVerification;