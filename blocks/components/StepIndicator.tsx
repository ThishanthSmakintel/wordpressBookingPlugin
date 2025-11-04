import { createElement, Fragment } from '@wordpress/element';

interface Step {
    number: number;
    label: string;
}

interface StepIndicatorProps {
    currentStep?: number;
}

const STEPS: Step[] = [
    { number: 1, label: 'Service' },
    { number: 2, label: 'Employee' },
    { number: 3, label: 'Date' },
    { number: 4, label: 'Time' },
    { number: 5, label: 'Info' }
];

export const StepIndicator = ({ currentStep = 1 }: StepIndicatorProps) => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '48px',
        padding: '24px',
        background: '#ffffff'
    }}>
        {STEPS.map((step, index) => (
            <Fragment key={step.number}>
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
                        backgroundColor: currentStep >= step.number ? '#1CBC9B' : '#e5e7eb',
                        color: currentStep >= step.number ? '#ffffff' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        transition: 'all 0.3s ease',
                        border: currentStep === step.number ? '3px solid #1CBC9B' : '3px solid transparent',
                        boxShadow: currentStep === step.number ? '0 0 0 4px rgba(28, 188, 155, 0.2)' : 'none'
                    }}>
                        {currentStep > step.number ? (
                            <i className="fas fa-check" style={{ fontSize: '1rem' }}></i>
                        ) : (
                            step.number
                        )}
                    </div>
                    <span style={{
                        marginTop: '8px',
                        fontSize: '0.875rem',
                        fontWeight: currentStep === step.number ? '600' : '500',
                        color: currentStep >= step.number ? '#1f2937' : '#9ca3af',
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                    }}>
                        {step.label}
                    </span>
                </div>
                {index < STEPS.length - 1 && (
                    <div style={{
                        width: '60px',
                        height: '3px',
                        backgroundColor: currentStep > step.number ? '#1CBC9B' : '#e5e7eb',
                        margin: '0 16px',
                        marginTop: '-24px',
                        transition: 'background-color 0.3s ease'
                    }}></div>
                )}
            </Fragment>
        ))}
    </div>
);
