import React from 'react';

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

export const EmailVerification: React.FC<EmailVerificationProps> = ({
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
  return (
    <div className="email-verification">
      <h2>Verify Your Email</h2>
      <p>Please enter the OTP sent to your email</p>
      
      <input
        type="text"
        placeholder="Enter OTP"
        value={emailOtp}
        onChange={(e) => onOtpChange(e.target.value)}
        disabled={isBlocked}
      />
      
      <div className="verification-actions">
        <button onClick={onVerifyOtp} disabled={isVerifyingEmail || isBlocked}>
          {isVerifyingEmail ? 'Verifying...' : 'Verify Email'}
        </button>
        <button onClick={onResendOtp} disabled={resendCooldown > 0 || isBlocked}>
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
        </button>
        <button onClick={onBack}>← Back</button>
      </div>
    </div>
  );
};