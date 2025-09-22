import React, { useState, useEffect, useMemo } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { useBookingState } from '../../hooks/useBookingState';
import { SettingsService } from '../../app/shared/services/settings.service';

// Helper function to get time slot styles
const getTimeSlotStyles = (isCurrentAppointment: boolean, isUnavailable: boolean, isSelected: boolean) => {
    if (isCurrentAppointment) {
        return {
            backgroundColor: '#fff7ed',
            border: '2px solid #f97316',
            color: '#ea580c'
        };
    }
    if (isUnavailable) {
        return {
            backgroundColor: '#fef2f2',
            border: '2px solid #fecaca',
            color: '#ef4444'
        };
    }
    if (isSelected) {
        return {
            backgroundColor: 'white',
            border: '3px solid #10b981',
            color: '#10b981'
        };
    }
    return {
        backgroundColor: 'white',
        border: '2px solid #e5e7eb',
        color: '#1f2937'
    };
};

interface TimeSelectorProps {
    unavailableSlots: string[] | 'all';
    timezone: string;
    bookingDetails?: Record<string, any>;
    currentAppointment?: any;
    isRescheduling?: boolean;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
    unavailableSlots,
    timezone,
    bookingDetails = {},
    currentAppointment,
    isRescheduling
}) => {
    const { selectedDate, selectedTime, selectedService, setSelectedTime, setStep } = useBookingStore();
    const bookingState = useBookingState();
    const [tempSelected, setTempSelected] = useState<string>(selectedTime || '');
    
    // Memoize current appointment time calculation
    const currentAppointmentTime = useMemo(() => {
        if (isRescheduling && currentAppointment?.appointment_date) {
            const aptDate = new Date(currentAppointment.appointment_date);
            return `${aptDate.getHours().toString().padStart(2, '0')}:${aptDate.getMinutes().toString().padStart(2, '0')}`;
        }
        return null;
    }, [isRescheduling, currentAppointment?.appointment_date]);
    
    // Debug logging
    console.log('[TimeSelector] Props received:', {
        unavailableSlots,
        timezone,
        bookingDetails,
        selectedDate
    });
    
    const handleTimeSelect = (time: string) => {
        if (unavailableSlots !== 'all' && (!Array.isArray(unavailableSlots) || !unavailableSlots.includes(time))) {
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
    
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(true);
    
    // Load time slots from settings API
    useEffect(() => {
        const loadTimeSlots = async () => {
            try {
                const settingsService = SettingsService.getInstance();
                const settings = await settingsService.getSettings();
                setTimeSlots(settings.time_slots);
            } catch (error) {
                console.error('Failed to load time slots:', error);
                // Fallback to default slots
                setTimeSlots(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']);
            } finally {
                setIsLoadingSlots(false);
            }
        };
        
        loadTimeSlots();
    }, []);

    return (
        <div className="appointease-step-content">
            {isRescheduling && currentAppointment && (
                <div className="reschedule-header">
                    <h2><i className="fas fa-calendar-alt"></i> Rescheduling Appointment</h2>
                    <div className="current-appointment-info">
                        <p><strong>Current Appointment:</strong></p>
                        <p>{currentAppointment?.appointment_date && 
                            new Date(currentAppointment.appointment_date).toLocaleDateString('en', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })} at {currentAppointment?.appointment_date && 
                            new Date(currentAppointment.appointment_date).toLocaleTimeString('en', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                        </p>
                    </div>
                    <p className="step-description">Select a new time for your appointment</p>
                </div>
            )}
            <h2 style={{fontSize: '2rem', fontWeight: '700', textAlign: 'center', marginBottom: '1rem', color: '#1f2937'}}>
                {isRescheduling ? 'Choose New Time' : 'Choose Your Time'}
            </h2>
            
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
                {isLoadingSlots ? (
                    <div style={{textAlign: 'center', padding: '40px'}}>
                        <div style={{fontSize: '16px', color: '#666'}}>Loading available times...</div>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '16px',
                        marginBottom: '32px'
                    }}>
                    {timeSlots.map(time => {
                        const isUnavailable = unavailableSlots === 'all' || (Array.isArray(unavailableSlots) && unavailableSlots.includes(time));
                        const serviceDuration = selectedService?.duration || 30;
                        const isSelected = tempSelected === time;
                        const isCurrentAppointment = currentAppointmentTime === time;
                        const isDisabled = isUnavailable || isCurrentAppointment;
                        
                        const slotStyles = getTimeSlotStyles(isCurrentAppointment, isUnavailable, isSelected);
                        
                        return (
                            <div 
                                key={time}
                                onClick={() => !isDisabled && handleTimeSelect(time)}
                                style={{
                                    padding: '20px 16px',
                                    ...slotStyles,
                                    borderRadius: '12px',
                                    textAlign: 'center',
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    opacity: isDisabled ? 0.6 : 1,
                                    boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isDisabled && !isSelected) {
                                        e.currentTarget.style.borderColor = '#d1d5db';
                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isDisabled && !isSelected) {
                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                                    }
                                }}
                            >
                                <div style={{
                                    fontSize: '1.25rem',
                                    fontWeight: '700',
                                    color: slotStyles.color,
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
                                    color: slotStyles.color,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {isCurrentAppointment ? 'Your Current Time' : isUnavailable ? 'Booked' : 'Available'}
                                </div>
                            </div>
                        );
                    })}
                    </div>
                )}
                
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