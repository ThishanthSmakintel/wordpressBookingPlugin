import React from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { STEPS } from '../../constants';

const StepProgress: React.FC = React.memo(() => {
    const { step: currentStep } = useBookingStore();
    const steps = [
        { number: 1, label: 'Service' },
        { number: 2, label: 'Employee' },
        { number: 3, label: 'Date' },
        { number: 4, label: 'Time' },
        { number: 5, label: 'Info' }
    ];

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '48px',
            padding: '0 24px'
        }}>
            {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: currentStep >= step.number ? '#10b981' : '#e5e7eb',
                            color: currentStep >= step.number ? 'white' : '#9ca3af',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            transition: 'all 0.3s ease',
                            border: currentStep === step.number ? '3px solid #10b981' : '3px solid transparent',
                            boxShadow: currentStep === step.number ? '0 0 0 4px rgba(16, 185, 129, 0.2)' : 'none'
                        }}>
                            {currentStep > step.number ? (
                                <i className="fas fa-check" style={{fontSize: '1rem'}}></i>
                            ) : (
                                step.number
                            )}
                        </div>
                        <span style={{
                            marginTop: '8px',
                            fontSize: '0.875rem',
                            fontWeight: currentStep === step.number ? '600' : '500',
                            color: currentStep >= step.number ? '#1f2937' : '#9ca3af',
                            textAlign: 'center'
                        }}>
                            {step.label}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div style={{
                            width: '60px',
                            height: '3px',
                            backgroundColor: currentStep > step.number ? '#10b981' : '#e5e7eb',
                            margin: '0 16px',
                            marginTop: '-24px',
                            transition: 'background-color 0.3s ease'
                        }}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
});

export default StepProgress;