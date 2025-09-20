import React from 'react';

interface CustomerInfoFormProps {
  isLoggedIn: boolean;
  isCheckingEmail: boolean;
  existingUser: any;
  onSubmit: (event?: React.FormEvent) => void;
  onBack: () => void;
  checkExistingEmail: () => void;
}

export const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({
  isLoggedIn,
  isCheckingEmail,
  existingUser,
  onSubmit,
  onBack,
  checkExistingEmail
}) => {
  return (
    <div className="customer-info-form">
      <h2>Your Information</h2>
      <p>Please provide your contact details</p>
      {/* Customer form logic */}
      <div className="form-actions">
        <button type="button" onClick={onBack}>← Back</button>
        <button type="button" onClick={onSubmit}>Continue</button>
      </div>
    </div>
  );
};