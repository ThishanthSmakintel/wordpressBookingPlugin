import React from 'react';
import { RescheduleHeader } from './RescheduleHeader';

interface StepWrapperProps {
  isReschedule?: boolean;
  currentAppointment?: any;
  stepDescription?: string;
  children: React.ReactNode;
}

export const StepWrapper: React.FC<StepWrapperProps> = ({ 
  isReschedule, 
  currentAppointment, 
  stepDescription, 
  children 
}) => (
  <div className="appointease-step-content">
    {isReschedule && currentAppointment && (
      <RescheduleHeader 
        currentAppointment={currentAppointment} 
        stepDescription={stepDescription || ''} 
      />
    )}
    {children}
  </div>
);