import React, { useEffect } from 'react';
import { useAppointmentStore as useBookingStore } from '../../hooks/useAppointmentStore';
import { useBookingState } from '../../hooks/useBookingState';
import { sanitizeInput } from '../../utils';
import { FormData, FormErrors, Service, Employee } from '../../types';
import { checkCustomer } from '../../services/api';

interface CustomerInfoFormProps {
    isLoggedIn: boolean;
    isCheckingEmail: boolean;
    existingUser: any;
    onSubmit: (e: React.FormEvent) => void;
    onBack: () => void;
    checkExistingEmail: (email: string) => void;
    bookingState: any;
}

const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({
    isLoggedIn,
    isCheckingEmail,
    existingUser,
    onSubmit,
    onBack,
    checkExistingEmail,
    bookingState
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
    
    console.log('[CustomerInfoForm] Render with props:', {
        isLoggedIn,
        loginEmail: bookingState.loginEmail,
        formData,
        isRescheduling: bookingState.isRescheduling
    });
    
    const validateForm = () => {
        const newErrors: any = {};
        
        if (!formData?.email?.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (!formData?.firstName?.trim()) {
            newErrors.firstName = 'Name is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (validateForm()) {
            onSubmit(e);
        }
    };
    
    // Ensure form fields are editable during reschedule
    const isFieldDisabled = (fieldName: string) => {
        // Only disable if user exists AND it's not a reschedule flow
        return existingUser?.exists && !bookingState.isRescheduling;
    };
    return (
        <div className="appointease-step-content">
            <h2 style={{fontSize: '2rem', fontWeight: '700', textAlign: 'center', marginBottom: '1rem', color: '#1f2937'}}>Almost Done!</h2>
            {!isLoggedIn && <p style={{textAlign: 'center', color: '#6b7280', marginBottom: '2rem', fontSize: '1.1rem'}}>Please provide your contact information</p>}
            
            <div style={{maxWidth: '600px', margin: '0 auto'}}>
                <form onSubmit={handleFormSubmit} noValidate>
                    <div style={{marginBottom: '24px'}}>
                        <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px'}}>Email *</label>
                        <div style={{position: 'relative'}}>
                            <input
                                type="email"
                                value={formData?.email || ''}
                                onChange={(e) => {
                                    const sanitized = sanitizeInput(e.target.value);
                                    setFormData({ email: sanitized });
                                    if (errors.email) clearError('email');
                                    
                                    if (sanitized && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
                                        const timeoutId = setTimeout(() => checkExistingEmail(sanitized), 800);
                                        return () => clearTimeout(timeoutId);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: errors.email ? '2px solid #ef4444' : '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.2s ease',
                                    backgroundColor: existingUser?.exists ? '#f9fafb' : 'white'
                                }}
                                placeholder="Enter your email address"
                                disabled={isFieldDisabled('email')}
                                onFocus={(e) => {
                                    if (!errors.email) e.target.style.borderColor = '#3b82f6';
                                }}
                                onBlur={(e) => {
                                    if (!errors.email) e.target.style.borderColor = '#e5e7eb';
                                }}
                            />
                            {isCheckingEmail && (
                                <div style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)'}}>
                                    <i className="fas fa-spinner fa-spin" style={{color: '#6b7280'}}></i>
                                </div>
                            )}

                        </div>
                        {errors.email && <div style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{errors.email}</div>}
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px'}}>
                        <div>
                            <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px'}}>Name *</label>
                            <input
                                type="text"
                                value={formData?.firstName || ''}
                                onChange={(e) => {
                                    const sanitized = sanitizeInput(e.target.value);
                                    setFormData({ firstName: sanitized });
                                    if (errors.firstName) clearError('firstName');
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: errors.firstName ? '2px solid #ef4444' : '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.2s ease',
                                    backgroundColor: existingUser?.exists ? '#f9fafb' : 'white'
                                }}
                                placeholder="Enter your name"
                                disabled={isFieldDisabled('firstName')}
                                onFocus={(e) => {
                                    if (!errors.firstName) e.target.style.borderColor = '#3b82f6';
                                }}
                                onBlur={(e) => {
                                    if (!errors.firstName) e.target.style.borderColor = '#e5e7eb';
                                }}
                            />
                            {errors.firstName && <div style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{errors.firstName}</div>}
                        </div>
                        
                        <div>
                            <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px'}}>Phone (optional)</label>
                            <input
                                type="tel"
                                value={formData?.phone || ''}
                                onChange={(e) => {
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
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: errors.phone ? '2px solid #ef4444' : '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.2s ease',
                                    backgroundColor: existingUser?.exists ? '#f9fafb' : 'white'
                                }}
                                placeholder="(555) 123-4567"
                                disabled={isFieldDisabled('phone')}
                                onFocus={(e) => {
                                    if (!errors.phone) e.target.style.borderColor = '#3b82f6';
                                }}
                                onBlur={(e) => {
                                    if (!errors.phone) e.target.style.borderColor = '#e5e7eb';
                                }}
                            />
                            {errors.phone && <div style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{errors.phone}</div>}
                        </div>
                    </div>
                
                    <div style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '24px',
                        marginBottom: '32px'
                    }}>
                        <h3 style={{fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '16px'}}>Booking Summary</h3>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <span style={{color: '#6b7280'}}>Service:</span>
                                <span style={{fontWeight: '600', color: '#1f2937'}}>{selectedService?.name}</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <span style={{color: '#6b7280'}}>Employee:</span>
                                <span style={{fontWeight: '600', color: '#1f2937'}}>{selectedEmployee?.name}</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <span style={{color: '#6b7280'}}>Date:</span>
                                <span style={{fontWeight: '600', color: '#1f2937'}}>{new Date(selectedDate).toLocaleDateString()}</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <span style={{color: '#6b7280'}}>Time:</span>
                                <span style={{fontWeight: '600', color: '#1f2937'}}>{selectedTime}</span>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingTop: '12px',
                                borderTop: '1px solid #e2e8f0',
                                marginTop: '8px'
                            }}>
                                <span style={{fontSize: '1.1rem', fontWeight: '600', color: '#1f2937'}}>Total:</span>
                                <span style={{fontSize: '1.25rem', fontWeight: '700', color: '#10b981'}}>
                                    {bookingState.isRescheduling ? 'No additional charge' : `$${selectedService?.price || 0}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <button 
                            type="button"
                            onClick={onBack}
                            disabled={isSubmitting}
                            style={{
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                fontSize: '1rem',
                                fontWeight: '500',
                                opacity: isSubmitting ? 0.6 : 1
                            }}
                        >
                            ← Back
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                backgroundColor: isSubmitting ? '#9ca3af' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '16px 32px',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    {bookingState.isRescheduling ? 'RESCHEDULING...' : 'BOOKING...'}
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check"></i>
                                    {bookingState.isRescheduling ? 'RESCHEDULE APPOINTMENT' : 'CONFIRM BOOKING'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerInfoForm;
