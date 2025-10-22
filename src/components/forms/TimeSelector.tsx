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
    
    // BOOKING DEBUG - API Testing
    console.log('=== BOOKING DEBUG - API TESTING ===');
    console.log('[TimeSelector] Props received:', {
        unavailableSlots,
        timezone,
        bookingDetails,
        selectedDate,
        isRescheduling,
        currentAppointment
    });
    console.log('[TimeSelector] Current appointment time:', currentAppointmentTime);
    console.log('[TimeSelector] window.bookingAPI available:', !!(window as any).bookingAPI);
    if ((window as any).bookingAPI) {
        console.log('[TimeSelector] API root:', (window as any).bookingAPI.root);
    }
    
    // Test all available API endpoints
    React.useEffect(() => {
        const testAllAPIs = async () => {
            console.log('=== BOOKING DEBUG - TESTING ALL APIs ===');
            const baseUrl = window.location.origin;
            const endpoints = [
                '/wp-json/appointease/v1/settings',
                '/wp-json/appointease/v1/time-slots', 
                '/wp-json/appointease/v1/business-hours',
                '/wp-json/booking/v1/services',
                '/wp-json/booking/v1/staff',
                '/wp-json/booking/v1/availability',
                '/wp-json/appointease/v1/server-date'
            ];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(`${baseUrl}${endpoint}`);
                    console.log(`API TEST ${endpoint}: ${response.status}`);
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`  SUCCESS:`, data);
                    } else {
                        const error = await response.text();
                        console.log(`  ERROR:`, error);
                    }
                } catch (e) {
                    console.log(`API TEST ${endpoint}: FAILED -`, e.message);
                }
            }
            console.log('=== END API TESTING ===');
        };
        
        testAllAPIs();
    }, []);
    
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
    const [errorDetails, setErrorDetails] = useState<string>('');
    
    // Load time slots from settings API
    useEffect(() => {
        const loadTimeSlots = async () => {
            try {
                console.log('[TimeSelector] Loading time slots from API...');
                
                console.log('=== BOOKING DEBUG - LOADING TIME SLOTS ===');
                
                // Check API availability first
                const settingsService = SettingsService.getInstance();
                const apiAvailable = await settingsService.checkAPIAvailability();
                
                console.log('[TimeSelector] API availability check result:', apiAvailable);
                
                const settings = await settingsService.getSettings();
                console.log('[TimeSelector] Settings loaded:', settings);
                
                if (settings.time_slots && settings.time_slots.length > 0) {
                    setTimeSlots(settings.time_slots);
                    console.log('[TimeSelector] Time slots set:', settings.time_slots);
                } else {
                    console.error('[TimeSelector] No time slots in settings response');
                    setTimeSlots([]);
                }
            } catch (error) {
                console.error('[TimeSelector] API Error Details:');
                console.error('Error object:', error);
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
                if (error.response) {
                    console.error('Response status:', error.response.status);
                    console.error('Response data:', error.response.data);
                }
                
                // Capture error details for display
                console.log('=== BOOKING DEBUG - ERROR OCCURRED ===');
                console.log('Full error object:', error);
                const errorMsg = `Error: ${error.message}\nType: ${typeof error}\nStack: ${error.stack?.substring(0, 200) || 'No stack trace'}`;
                setErrorDetails(errorMsg);
                setTimeSlots([]);
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
            
            <div style={{maxWidth: '100%', margin: '0 auto', padding: '0 20px'}}>
                {isLoadingSlots ? (
                    <div style={{textAlign: 'center', padding: '40px'}}>
                        <div style={{fontSize: '16px', color: '#666'}}>Loading available times...</div>
                    </div>
                ) : timeSlots.length === 0 ? (
                    <div style={{textAlign: 'center', padding: '40px'}}>
                        <div style={{fontSize: '16px', color: '#ef4444', marginBottom: '16px'}}>⚠️ Time Slots Not Available</div>
                        <div style={{fontSize: '14px', color: '#666', marginBottom: '16px'}}>API Error: Unable to load time slots from server</div>
                        <div style={{fontSize: '12px', color: '#999', marginBottom: '16px'}}>Error Details:</div>
                        <div style={{fontSize: '11px', color: '#666', marginBottom: '16px', fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px', textAlign: 'left', maxHeight: '100px', overflow: 'auto', whiteSpace: 'pre-wrap'}}>
                            {errorDetails || 'No error details captured yet'}
                        </div>
                        <button 
                            onClick={() => {
                                setIsLoadingSlots(true);
                                const settingsService = SettingsService.getInstance();
                                settingsService.clearCache();
                                // Trigger reload
                                window.location.reload();
                            }}
                            style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Retry Loading
                        </button>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                        gap: '12px',
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