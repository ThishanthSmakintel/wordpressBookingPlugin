import React from 'react';

interface LoginFormProps {
    loginEmail: string;
    otpCode: string;
    otpSent: boolean;
    isLoadingOTP: boolean;
    isLoadingLogin: boolean;
    loginOtpExpiry: number;
    loginResendCooldown: number;
    loginIsBlocked: boolean;
    errors: any;
    onClose: () => void;
    onEmailChange: (email: string) => void;
    onOtpChange: (otp: string) => void;
    onSendOTP: () => void;
    onVerifyOTP: () => void;
    onBack: () => void;
    sanitizeInput: (input: string) => string;
}

const LoginForm: React.FC<LoginFormProps> = ({
    loginEmail,
    otpCode,
    otpSent,
    isLoadingOTP,
    isLoadingLogin,
    loginOtpExpiry,
    loginResendCooldown,
    loginIsBlocked,
    errors,
    onClose,
    onEmailChange,
    onOtpChange,
    onSendOTP,
    onVerifyOTP,
    onBack,
    sanitizeInput
}) => {
    return (
        <div className="appointease-booking">
            <div className="appointease-booking-header">
                <div className="appointease-logo">
                    <span className="logo-icon">A</span>
                </div>
                <button className="close-btn" onClick={onClose}>
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
                                    onChange={(e) => {
                                        const sanitized = sanitizeInput(e.target.value);
                                        if (sanitized.length <= 100) {
                                            onEmailChange(sanitized);
                                        }
                                    }}
                                    className={errors.general && errors.general.includes('email') ? 'error' : /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(loginEmail) ? 'valid' : ''}
                                    required
                                    placeholder="Enter your email"
                                />
                            </div>
                            {errors.general && (
                                <div className="error-message" style={{marginTop: '0.5rem', color: '#dc3545', fontSize: '0.875rem'}}>
                                    {errors.general}
                                </div>
                            )}
                            <button className="send-otp-btn" onClick={onSendOTP} disabled={isLoadingOTP || !loginEmail}>
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
                                                const sanitized = sanitizeInput(e.target.value.replace(/\D/g, ''));
                                                if (sanitized.length <= 6) {
                                                    onOtpChange(sanitized);
                                                }
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
                                            onClick={onSendOTP} 
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
                                <button className="back-btn" onClick={onBack}>
                                    <i className="fas fa-arrow-left"></i> Back
                                </button>
                                <button className="confirm-btn" onClick={onVerifyOTP} disabled={isLoadingLogin || loginIsBlocked || otpCode.length !== 6}>
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
};

export default LoginForm;