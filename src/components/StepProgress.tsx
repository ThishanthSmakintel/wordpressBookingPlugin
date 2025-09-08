import React from 'react';

interface StepProgressProps {
    currentStep: number;
}

const StepProgress: React.FC<StepProgressProps> = ({ currentStep }) => {
    const steps = [
        { number: 1, label: 'Service' },
        { number: 2, label: 'Employee' },
        { number: 3, label: 'Date' },
        { number: 4, label: 'Time' },
        { number: 5, label: 'Info' }
    ];

    return (
        <div className="appointease-steps">
            {steps.map((step) => (
                <div 
                    key={step.number}
                    className={`step ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
                >
                    <span className="step-number">{step.number}</span>
                    <span className="step-label">{step.label}</span>
                </div>
            ))}
        </div>
    );
};

export default StepProgress;