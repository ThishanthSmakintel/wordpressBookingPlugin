import React from 'react';
import { useBooking } from '../contexts/BookingContext';

const ProgressIndicator: React.FC = () => {
  const { state } = useBooking();
  
  const steps = [
    { number: 1, label: 'Service', completed: state.step > 1 },
    { number: 2, label: 'Staff', completed: state.step > 2 },
    { number: 3, label: 'Date & Time', completed: state.step > 3 },
    { number: 4, label: 'Details', completed: state.step > 4 },
    { number: 5, label: 'Confirmation', completed: state.step === 5 }
  ];

  return (
    <div className="progress-indicator">
      {steps.map((step, index) => (
        <div key={step.number} className="progress-step">
          <div className={`step-circle ${
            state.step === step.number ? 'active' : 
            step.completed ? 'completed' : 'pending'
          }`}>
            {step.completed ? '✓' : step.number}
          </div>
          <span className="step-label">{step.label}</span>
          {index < steps.length - 1 && (
            <div className={`step-connector ${step.completed ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default ProgressIndicator;