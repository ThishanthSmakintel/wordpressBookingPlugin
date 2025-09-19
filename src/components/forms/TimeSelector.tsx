import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { TIME_SLOTS } from '../../constants';

interface TimeSelectorProps {
    unavailableSlots: string[];
    timezone: string;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
    unavailableSlots,
    timezone
}) => {
    const { selectedDate, selectedTime, selectedService, setSelectedTime, setStep } = useBookingStore();
    const [tempSelected, setTempSelected] = useState<string>(selectedTime || '');
    
    const handleTimeSelect = (time: string) => {
        if (!unavailableSlots.includes(time)) {
            setTempSelected(time);
        }
    };
    
    const handleNext = () => {
        if (tempSelected) {
            setSelectedTime(tempSelected);
            setStep(5);
        }
    };
    
    const handleBack = () => {
        setStep(3);
    };
    
    const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

    return (
        <div className="appointease-step-content">
            <h2 style={{fontSize: '2rem', fontWeight: '700', textAlign: 'center', marginBottom: '1rem', color: '#1f2937'}}>Choose Your Time</h2>
            
            {/* Selected Date Info */}
            <div style={{
                textAlign: 'center',
                marginBottom: '2rem',
                padding: '16px',
                backgroundColor: '#f0fdf4',
                borderRadius: '12px',
                border: '1px solid #bbf7d0'
            }}>
                <div style={{fontSize: '1.1rem', fontWeight: '600', color: '#166534', marginBottom: '4px'}}>
                    <i className="fas fa-calendar" style={{marginRight: '8px'}}></i>
                    {new Date(selectedDate).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div style={{fontSize: '0.875rem', color: '#16a34a'}}>
                    <i className="fas fa-clock" style={{marginRight: '6px'}}></i>
                    All times shown in {timezone}
                </div>
            </div>
            
            <div style={{maxWidth: '600px', margin: '0 auto'}}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px'
                }}>
                    {timeSlots.map(time => {
                        const isUnavailable = unavailableSlots.includes(time);
                        const serviceDuration = selectedService?.duration || 30;
                        const isSelected = tempSelected === time;
                        
                        return (
                            <div 
                                key={time}
                                onClick={() => handleTimeSelect(time)}
                                style={{
                                    padding: '20px 16px',
                                    backgroundColor: isUnavailable ? '#fef2f2' : 'white',
                                    border: isSelected ? '3px solid #10b981' : isUnavailable ? '2px solid #fecaca' : '2px solid #e5e7eb',
                                    borderRadius: '12px',
                                    textAlign: 'center',
                                    cursor: isUnavailable ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    opacity: isUnavailable ? 0.6 : 1,
                                    boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isUnavailable && !isSelected) {
                                        e.currentTarget.style.borderColor = '#d1d5db';
                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isUnavailable && !isSelected) {
                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                                    }
                                }}
                            >
                                <div style={{
                                    fontSize: '1.25rem',
                                    fontWeight: '700',
                                    color: isUnavailable ? '#ef4444' : isSelected ? '#10b981' : '#1f2937',
                                    marginBottom: '8px'
                                }}>
                                    {time}
                                </div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: isUnavailable ? '#ef4444' : '#6b7280',
                                    marginBottom: '4px'
                                }}>
                                    {serviceDuration} minutes
                                </div>
                                <div style={{
                                    fontSize: '0.625rem',
                                    fontWeight: '500',
                                    color: isUnavailable ? '#ef4444' : '#10b981',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {isUnavailable ? 'Unavailable' : 'Available'}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Action Buttons */}
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <button 
                        onClick={handleBack}
                        style={{
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '500'
                        }}
                    >
                        ← Back
                    </button>
                    <button 
                        onClick={handleNext}
                        disabled={!tempSelected}
                        style={{
                            backgroundColor: tempSelected ? '#10b981' : '#d1d5db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '16px 32px',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            cursor: tempSelected ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Next: Confirm Booking →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimeSelector;