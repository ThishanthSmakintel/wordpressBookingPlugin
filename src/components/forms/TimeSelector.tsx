import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useAppointmentStore } from '../../hooks/useAppointmentStore';
import { useBookingState } from '../../hooks/useBookingState';
import { useHeartbeat } from '../../hooks/useHeartbeat';
import { useHeartbeatSlotPolling } from '../../hooks/useHeartbeatSlotPolling';
import { SettingsService } from '../../app/shared/services/settings.service';
import { format, parseISO } from 'date-fns';

const TimeSlot = memo(({ 
    time, 
    isSelected, 
    isCurrentAppointment, 
    isBeingBooked, 
    isUnavailable, 
    isProcessing, 
    isDisabled, 
    serviceDuration, 
    onSelect 
}: {
    time: string;
    isSelected: boolean;
    isCurrentAppointment: boolean;
    isBeingBooked: boolean;
    isUnavailable: boolean;
    isProcessing: boolean;
    isDisabled: boolean;
    serviceDuration: number;
    onSelect: (time: string) => void;
}) => {
    const slotStyles = useMemo(() => 
        getTimeSlotStyles(isCurrentAppointment, isUnavailable || isProcessing, isSelected, isBeingBooked),
        [isCurrentAppointment, isUnavailable, isProcessing, isSelected, isBeingBooked]
    );
    
    return (
        <div 
            onClick={() => !isDisabled && onSelect(time)}
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
                {isSelected ? 'Your Selection' : isCurrentAppointment ? 'Current Time' : isProcessing ? 'Processing' : isUnavailable ? 'Booked' : 'Available'}
            </div>
        </div>
    );
});

const getTimeSlotStyles = (isCurrentAppointment: boolean, isUnavailable: boolean, isSelected: boolean, isBeingBooked: boolean) => {
    if (isCurrentAppointment) {
        return {
            backgroundColor: '#fff7ed',
            border: '2px solid #f97316',
            color: '#ea580c'
        };
    }
    if (isBeingBooked) {
        return {
            backgroundColor: '#fef3c7',
            border: '2px dashed #f59e0b',
            color: '#d97706'
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
    unavailableSlots = [],
    timezone = 'UTC',
    bookingDetails = {},
    currentAppointment,
    isRescheduling
}) => {
    const { selectedDate = '', selectedTime = '', selectedService, selectedEmployee, setSelectedTime, setStep } = useAppointmentStore();
    const [tempSelected, setTempSelected] = useState<string>(selectedTime || '');
    const selectingRef = useRef(false);
    
    const currentAppointmentTime = useMemo(() => {
        if (isRescheduling && currentAppointment?.appointment_date) {
            try {
                const aptDate = parseISO(currentAppointment.appointment_date);
                return format(aptDate, 'HH:mm');
            } catch {
                return null;
            }
        }
        return null;
    }, [isRescheduling, currentAppointment?.appointment_date]);
    
    const clientId = useMemo(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const testClientId = urlParams.get('client');
        if (testClientId) return `client_test_${testClientId}`;
        
        const key = 'appointease_client_id';
        let id = localStorage.getItem(key);
        if (!id) {
            id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(key, id);
        }
        return id;
    }, []);
    
    const { selectSlot, deselectSlot } = useHeartbeat({ enabled: true });
    const { bookedSlots: heartbeatBookedSlots, lockedSlots: heartbeatLockedSlots } = useHeartbeatSlotPolling({
        date: selectedDate,
        employeeId: selectedEmployee?.id || 0,
        enabled: !!selectedDate && !!selectedEmployee,
        clientId,
        selectedTime: tempSelected
    });
    
    const unavailableSet = useMemo(() => {
        if (unavailableSlots === 'all') return 'all';
        const set = new Set(Array.isArray(unavailableSlots) ? unavailableSlots : []);
        heartbeatBookedSlots.forEach(s => set.add(s));
        heartbeatLockedSlots.forEach(s => set.add(s));
        return set;
    }, [unavailableSlots, heartbeatBookedSlots, heartbeatLockedSlots]);
    
    const handleTimeSelect = useCallback(async (time: string) => {
        if (selectingRef.current || unavailableSet === 'all' || (unavailableSet instanceof Set && unavailableSet.has(time))) return;
        
        selectingRef.current = true;
        const prevSelected = tempSelected;
        
        try {
            setTempSelected(time);
            await selectSlot(selectedDate, time, selectedEmployee?.id || 0, clientId);
        } catch (error: any) {
            console.error('[TimeSelector] Selection failed:', error.message);
            setTempSelected(prevSelected);
        } finally {
            selectingRef.current = false;
        }
    }, [selectedDate, selectedEmployee, unavailableSet, selectSlot, clientId, tempSelected]);
    
    const handleNext = useCallback(() => {
        if (tempSelected) {
            setSelectedTime(tempSelected);
            setStep(5);
        }
    }, [tempSelected, setSelectedTime, setStep]);
    
    const handleBack = useCallback(() => setStep(3), [setStep]);
    
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(true);
    
    useEffect(() => {
        let mounted = true;
        SettingsService.getInstance().getSettings()
            .then(settings => {
                if (mounted && settings?.time_slots?.length > 0) {
                    setTimeSlots(settings.time_slots);
                }
            })
            .catch(() => {})
            .finally(() => mounted && setIsLoadingSlots(false));
        return () => { mounted = false; };
    }, []);
    
    useEffect(() => {
        return () => {
            if (tempSelected && selectedDate && selectedEmployee) {
                deselectSlot(selectedDate, tempSelected, selectedEmployee.id).catch(() => {});
            }
        };
    }, [tempSelected, selectedDate, selectedEmployee, deselectSlot]);

    return (
        <div className="appointease-step-content">
            {isRescheduling && currentAppointment && (
                <div className="reschedule-header">
                    <h2><i className="fas fa-calendar-alt"></i> Rescheduling Appointment</h2>
                    <div className="current-appointment-info">
                        <p><strong>Current Appointment:</strong></p>
                        <p>{currentAppointment?.appointment_date && 
                            (() => {
                                try {
                                    const date = parseISO(currentAppointment.appointment_date);
                                    return `${format(date, 'EEEE, MMMM d, yyyy')} at ${format(date, 'h:mm a')}`;
                                } catch {
                                    return 'Invalid date';
                                }
                            })()
                        }</p>
                    </div>
                    <p className="step-description">Select a new time for your appointment</p>
                </div>
            )}
            <h2 style={{fontSize: '2rem', fontWeight: '700', textAlign: 'center', marginBottom: '1rem', color: '#1f2937'}}>
                {isRescheduling ? 'Choose New Time' : 'Choose Your Time'}
            </h2>
            
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
                    {selectedDate ? format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy') : 'No date selected'}
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
                    <div style={{textAlign: 'center', padding: '40px', fontSize: '16px', color: '#ef4444'}}>
                        ⚠️ No time slots available
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                        gap: '12px',
                        marginBottom: '32px'
                    }}>
                    {timeSlots.map(time => {
                        const isSelected = tempSelected === time;
                        const isCurrentAppointment = currentAppointmentTime === time;
                        const isProcessing = heartbeatLockedSlots.includes(time) && !isSelected;
                        const isUnavailable = unavailableSet === 'all' || (unavailableSet instanceof Set && unavailableSet.has(time));
                        const isDisabled = (isUnavailable || isProcessing || isCurrentAppointment) && !isSelected;
                        
                        return (
                            <TimeSlot
                                key={time}
                                time={time}
                                isSelected={isSelected}
                                isCurrentAppointment={isCurrentAppointment}
                                isBeingBooked={false}
                                isUnavailable={isUnavailable}
                                isProcessing={isProcessing}
                                isDisabled={isDisabled}
                                serviceDuration={selectedService?.duration || 30}
                                onSelect={handleTimeSelect}
                            />
                        );
                    })}
                    </div>
                )}
                
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

export default memo(TimeSelector);
