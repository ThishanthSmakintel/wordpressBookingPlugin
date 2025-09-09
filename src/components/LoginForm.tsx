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
        <div className="wp-block-group appointease-booking">
            <div className="wp-block-group appointease-booking-header is-layout-flex wp-block-group-is-layout-flex">
                <div className="wp-block-site-logo appointease-logo">
                    <span className="logo-icon">A</span>
                </div>
                <div className="wp-block-button">
                    <button className="wp-element-button close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div className="wp-block-group appointease-booking-content">
                <div className="wp-container login-container has-global-padding">
                    <h2 className="wp-block-heading has-text-align-center">Login to Your Account</h2>
                    <p className="has-text-align-center">Access all your appointments and book new ones</p>
                    
                    {!otpSent ? (
                        <div className="wp-block-group login-form">
                            <div className="wp-block-group form-group">
                                <label className="has-text-color">Email Address</label>
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
                                <div className="wp-block-paragraph error-message has-text-color" style={{marginTop: '0.5rem', color: '#dc3545', fontSize: '0.875rem'}}>
                                    {errors.general}
                                </div>
                            )}
                            <div className="wp-block-button">
                                <button className="wp-element-button send-otp-btn" onClick={onSendOTP} disabled={isLoadingOTP || !loginEmail}>
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
                        </div>
                    ) : (
                        <div className="wp-block-group otp-verification">
                            <div className="wp-block-group verification-card">
                                <div className="wp-block-group verification-header has-text-align-center">
                                    <i className="fas fa-sign-in-alt" style={{fontSize: '2.5rem', color: '#1CBC9B', marginBottom: '1rem'}}></i>
                                    <h3 className="wp-block-heading">Verify to Login</h3>
                                    <p className="has-text-color">We've sent a 6-digit verification code to:</p>
                                    <div className="wp-block-tag email-highlight">
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
                            
                            <div className="wp-block-buttons form-actions is-layout-flex">
                                <div className="wp-block-button is-style-outline">
                                    <button className="wp-element-button back-btn" onClick={onBack}>
                                        <i className="fas fa-arrow-left"></i> Back
                                    </button>
                                </div>
                                <div className="wp-block-button">
                                    <button className="wp-element-button confirm-btn" onClick={onVerifyOTP} disabled={isLoadingLogin || loginIsBlocked || otpCode.length !== 6}>
                                        {isLoadingLogin ? (
                                            <><i className="fas fa-spinner fa-spin"></i> Verifying...</>
                                        ) : (
                                            <><i className="fas fa-shield-check"></i> Verify & Login</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginForm;