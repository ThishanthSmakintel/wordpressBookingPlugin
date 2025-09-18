import React from 'react';
import { useBookingStore } from '../store/bookingStore';
import { sanitizeInput } from '../utils';

interface CustomerInfoFormProps {
    isLoggedIn: boolean;
    isCheckingEmail: boolean;
    existingUser: any;
    onSubmit: (e: React.FormEvent) => void;
    onBack: () => void;
    checkExistingEmail: (email: string) => void;
}

const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({
    isLoggedIn,
    isCheckingEmail,
    existingUser,
    onSubmit,
    onBack,
    checkExistingEmail
}) => {
    const { 
        formData, 
        errors, 
        selectedService, 
        selectedEmployee, 
        selectedDate, 
        selectedTime, 
        isSubmitting,
        setFormData,
        setErrors,
        clearError
    } = useBookingStore();
    return (
        <div className="appointease-step-content">
            <div className="card shadow-sm" style={{border: '1px solid #dee2e6', borderRadius: '8px', padding: '24px'}}>
                <h2>Almost Done!</h2>
                <p className="step-description">Please provide your contact information</p>
                <form onSubmit={onSubmit} className="customer-form" noValidate>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="email">Email *</label>
                        <div className="email-input-container">
                            <input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => {
                                    const sanitized = sanitizeInput(e.target.value);
                                    setFormData({ email: sanitized });
                                    if (errors.email) clearError('email');
                                    
                                    if (sanitized && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
                                        setTimeout(() => checkExistingEmail(sanitized), 500);
                                    }
                                }}
                                className={errors.email ? 'error' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'valid' : ''}
                                placeholder="Enter your email address"
                                aria-describedby={errors.email ? 'email-error' : undefined}
                                aria-invalid={!!errors.email}
                                autoComplete="email"
                                required
                                disabled={existingUser && existingUser.exists}
                            />
                            {isCheckingEmail && (
                                <div className="email-checking">
                                    <i className="fas fa-spinner fa-spin"></i>
                                </div>
                            )}
                            {existingUser && existingUser.exists && (
                                <div className="existing-user-badge">
                                    <i className="fas fa-user-check"></i>
                                    Welcome back{existingUser.name ? `, ${existingUser.name}` : ''}!
                                </div>
                            )}
                        </div>
                        {errors.email && (
                            <span className="validation-icon invalid" aria-hidden="true">✕</span>
                        )}
                        {errors.email && <span id="email-error" className="error-message" role="alert">{errors.email}</span>}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="name">Name *</label>
                        <input
                            id="name"
                            type="text"
                            value={formData.firstName || ''}
                            onChange={(e) => {
                                if (!formData.email && !(existingUser && existingUser.exists)) {
                                    setErrors({ ...errors, firstName: 'Please enter your email first' });
                                    return;
                                }
                                const sanitized = sanitizeInput(e.target.value);
                                setFormData({ firstName: sanitized });
                                if (errors.firstName) clearError('firstName');
                            }}
                            className={errors.firstName ? 'error' : formData.firstName && formData.firstName.length >= 2 ? 'valid' : ''}
                            placeholder="Enter your name"
                            aria-describedby={errors.firstName ? 'name-error' : undefined}
                            aria-invalid={!!errors.firstName}
                            autoComplete="name"
                            required
                            disabled={existingUser && existingUser.exists}
                        />
                        {errors.firstName && (
                            <span className="validation-icon invalid" aria-hidden="true">✕</span>
                        )}
                        {errors.firstName && <span id="name-error" className="error-message" role="alert">{errors.firstName}</span>}
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="phone">Phone (optional)</label>
                        <input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => {
                                if (!formData.email && !(existingUser && existingUser.exists)) {
                                    setErrors({ ...errors, phone: 'Please enter your email first' });
                                    return;
                                }
                                let value = sanitizeInput(e.target.value).replace(/\D/g, '');
                                if (value.length > 15) value = value.slice(0, 15);
                                if (value.length >= 6) {
                                    value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                                } else if (value.length >= 3) {
                                    value = value.replace(/(\d{3})(\d+)/, '($1) $2');
                                }
                                setFormData({ phone: value });
                                if (errors.phone) clearError('phone');
                            }}
                            className={errors.phone ? 'error' : formData.phone && /^[\d\s\-\+\(\)]+$/.test(formData.phone) && formData.phone.replace(/\D/g, '').length >= 10 ? 'valid' : ''}
                            placeholder="(555) 123-4567"
                            aria-describedby={errors.phone ? 'phone-error' : undefined}
                            aria-invalid={!!errors.phone}
                            autoComplete="tel"
                            disabled={existingUser && existingUser.exists}
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
                    <button type="button" className="btn btn-secondary" onClick={onBack} disabled={isSubmitting} aria-label="Go back to time selection">
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
                </form>
            </div>
        </div>
    );
};

export default CustomerInfoForm;