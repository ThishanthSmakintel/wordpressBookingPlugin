import React, { useState, useEffect, useMemo } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { useBookingState } from '../../hooks/useBookingState';
import { checkAvailability, checkRescheduleAvailability } from '../../services/api';

// Date utility functions
const createDate = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    // Ensure we're working with local dates, not UTC
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Ensure Remix Icons is loaded
if (!document.querySelector('link[href*="remixicon"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.css';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
}

interface DateSelectorProps {
    isReschedule?: boolean;
}

interface DateStatus {
    isAvailable: boolean;
    reason?: string;
    isLoading: boolean;
    bookingCount?: number;
}

const DateSelector: React.FC<DateSelectorProps> = ({ isReschedule = false }) => {
    const { selectedDate, setSelectedDate, setStep, selectedEmployee, serverDate, refreshTrigger } = useBookingStore();
    const bookingState = useBookingState();
    const [tempSelected, setTempSelected] = useState<string>(selectedDate || '');
    const [dateStatuses, setDateStatuses] = useState<Map<string, DateStatus>>(new Map());
    const [currentMonth, setCurrentMonth] = useState(0);
    
    const handleDateSelect = (date: string) => {
        setTempSelected(date);
    };
    
    const handleNext = () => {
        if (tempSelected) {
            setSelectedDate(tempSelected);
            setStep(4);
        }
    };
    
    const handleBack = () => {
        setStep(2);
    };
    
    const generateCalendar = useMemo(() => {
        const serverToday = serverDate ? new Date(serverDate) : new Date('2025-09-20');
        const targetYear = serverToday.getFullYear();
        const targetMonth = serverToday.getMonth() + currentMonth;
        
        // Get the last day of the target month
        const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
        const days = [];
        
        // For current month, start from today; for future months, start from day 1
        const startDay = currentMonth === 0 ? Math.max(serverToday.getDate(), 1) : 1;
        
        for (let day = startDay; day <= lastDay; day++) {
            const date = createDate(targetYear, targetMonth, day);
            days.push(date);
        }
        
        return days;
    }, [serverDate, currentMonth]);
    
    const getMonthName = () => {
        const date = serverDate ? new Date(serverDate) : new Date('2025-09-20');
        date.setMonth(date.getMonth() + currentMonth);
        return date.toLocaleDateString('en', { month: 'long', year: 'numeric' });
    };
    
    const canGoNext = () => currentMonth < 3;
    const canGoPrev = () => currentMonth > 0;
    
    // Check availability for all dates when employee, month, or refresh trigger changes
    useEffect(() => {
        if (!selectedEmployee) {
            setDateStatuses(new Map());
            return;
        }
        
        const employeeId = typeof selectedEmployee === 'object' ? selectedEmployee.id : selectedEmployee;
        if (!employeeId) return;
        
        const dates = generateCalendar;
        
        // Set all dates to loading initially
        const newStatuses = new Map<string, DateStatus>();
        dates.forEach(date => {
            const dateString = formatDateString(date);
            newStatuses.set(dateString, { isAvailable: false, isLoading: true });
        });
        setDateStatuses(newStatuses);
        
        // Debug log for rescheduling
        console.log('[DateSelector] Checking availability - isReschedule:', isReschedule, 'currentAppointment:', bookingState.currentAppointment?.id, 'employeeId:', employeeId);
        
        // Check each date
        const checkDates = async () => {
            for (const date of dates) {
                const dateString = formatDateString(date);
                
                try {
                    let response;
                    
                    if (isReschedule && bookingState.currentAppointment?.id) {
                        // Use reschedule endpoint that excludes current appointment
                        response = await checkRescheduleAvailability({
                            date: dateString,
                            employee_id: employeeId,
                            exclude_appointment_id: bookingState.currentAppointment.id
                        });
                    } else {
                        // Use regular availability endpoint
                        response = await checkAvailability({
                            date: dateString,
                            employee_id: employeeId
                        });
                    }
                    
                    console.log(`[DateSelector] ${dateString} response:`, response);
                    console.log(`[DateSelector] API endpoint used:`, isReschedule ? 'reschedule-availability' : 'availability');
                    console.log(`[DateSelector] Exclude appointment ID:`, isReschedule ? bookingState.currentAppointment?.id : 'none');
                    
                    const isAvailable = response.unavailable !== 'all';
                    const reason = response.reason;
                    let bookingCount = 0;
                    
                    // Get actual booking count from API response
                    if (Array.isArray(response.unavailable)) {
                        bookingCount = response.unavailable.length;
                    } else if (response.booking_details && typeof response.booking_details === 'object') {
                        bookingCount = Object.keys(response.booking_details).length;
                    }
                    
                    // Debug: Log the actual counts
                    console.log(`[DateSelector] ${dateString} - Raw bookingCount: ${bookingCount}, unavailable:`, response.unavailable, 'booking_details:', response.booking_details);
                    console.log(`[DateSelector] ${dateString} - Reschedule mode:`, isReschedule, 'Current appointment:', bookingState.currentAppointment?.id);
                    
                    console.log(`[DateSelector] ${dateString} - Available: ${isAvailable}, Count: ${bookingCount}, Rescheduling: ${isReschedule}, Response:`, response);
                    
                    setDateStatuses(prev => {
                        const updated = new Map(prev);
                        updated.set(dateString, {
                            isAvailable,
                            reason: isAvailable ? undefined : reason,
                            isLoading: false,
                            bookingCount
                        });
                        return updated;
                    });
                } catch (error) {
                    setDateStatuses(prev => {
                        const updated = new Map(prev);
                        updated.set(dateString, {
                            isAvailable: false,
                            reason: 'error',
                            isLoading: false
                        });
                        return updated;
                    });
                }
            }
        };
        
        checkDates();
    }, [selectedEmployee, currentMonth, refreshTrigger, isReschedule, bookingState.currentAppointment?.id]);

    const renderDateStatus = (dateString: string, date: Date) => {
        const status = dateStatuses.get(dateString);
        const isPast = date < new Date(new Date().setHours(0,0,0,0));
        
        if (isPast) {
            return (
                <div style={{ fontSize: '0.625rem', color: '#6c757d', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    <span>🕐</span><span>Past</span>
                </div>
            );
        }
        
        if (!status || status.isLoading) {
            return (
                <div style={{ fontSize: '0.625rem', color: '#6b7280', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    <span>⏳</span><span>Checking...</span>
                </div>
            );
        }
        
        if (status.isAvailable) {
            const bookingCount = status.bookingCount || 0;
            const totalSlots = 12; // Total available slots per day
            const availableSlots = totalSlots - bookingCount;
            return (
                <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '4px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    <span>✅</span><span>{availableSlots} available</span>
                </div>
            );
        }
        
        // Unavailable - show reason
        const getReasonDisplay = (reason?: string) => {
            switch (reason) {
                case 'non_working_day': return { icon: '❌', text: 'Non-working day' };
                case 'blackout_date': return { icon: '🚫', text: 'Holiday' };
                case 'too_far_advance': return { icon: '📅', text: 'Too far ahead' };
                case 'past_date': return { icon: '🕐', text: 'Past date' };
                case 'error': return { icon: '⚠️', text: 'Error' };
                default: return { icon: '❌', text: 'Closed' };
            }
        };
        
        const { icon, text } = getReasonDisplay(status.reason);
        return (
            <div style={{ fontSize: '0.625rem', color: '#ef4444', marginTop: '4px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                <span>{icon}</span><span>{text}</span>
            </div>
        );
    };

    return (
        <div className="appointease-step-content">
            {isReschedule && bookingState.currentAppointment && (
                <div className="reschedule-header">
                    <h2><i className="fas fa-calendar-alt"></i> Rescheduling Appointment</h2>
                    <div className="current-appointment-info">
                        <p><strong>Current Appointment:</strong></p>
                        <p>{bookingState.currentAppointment?.appointment_date && 
                            new Date(bookingState.currentAppointment.appointment_date).toLocaleDateString('en', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })} at {bookingState.currentAppointment?.appointment_date && 
                            new Date(bookingState.currentAppointment.appointment_date).toLocaleTimeString('en', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                        </p>
                    </div>
                    <p className="step-description">Select a new date for your appointment</p>
                </div>
            )}
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', gap: '20px'}}>
                <button 
                    onClick={() => setCurrentMonth(currentMonth - 1)}
                    disabled={!canGoPrev()}
                    style={{
                        backgroundColor: canGoPrev() ? '#f3f4f6' : '#e5e7eb',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px',
                        cursor: canGoPrev() ? 'pointer' : 'not-allowed',
                        opacity: canGoPrev() ? 1 : 0.5,
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <i className="ri-arrow-left-s-line"></i>
                </button>
                <h2 style={{fontSize: '2rem', fontWeight: '700', color: '#1f2937', margin: 0}}>
                    {getMonthName()}
                </h2>
                <button 
                    onClick={() => setCurrentMonth(currentMonth + 1)}
                    disabled={!canGoNext()}
                    style={{
                        backgroundColor: canGoNext() ? '#f3f4f6' : '#e5e7eb',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px',
                        cursor: canGoNext() ? 'pointer' : 'not-allowed',
                        opacity: canGoNext() ? 1 : 0.5,
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <i className="ri-arrow-right-s-line"></i>
                </button>
            </div>
            
            <div style={{maxWidth: '800px', margin: '0 auto'}}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px'
                }}>
                    {generateCalendar.map((date: Date, index: number) => {
                        const dateString = formatDateString(date);
                        const status = dateStatuses.get(dateString);
                        const isPast = date < new Date(new Date().setHours(0,0,0,0));
                        const isDisabled = isPast || (status && !status.isAvailable && !status.isLoading);
                        const isSelected = tempSelected === dateString;
                        
                        return (
                            <div 
                                key={index}
                                onClick={() => !isDisabled && handleDateSelect(dateString)}
                                style={{
                                    padding: '20px 16px',
                                    backgroundColor: isDisabled ? '#f9fafb' : 'white',
                                    border: isSelected ? '3px solid #10b981' : isDisabled ? '2px solid #f3f4f6' : '2px solid #e5e7eb',
                                    borderRadius: '12px',
                                    textAlign: 'center',
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    opacity: isDisabled ? 0.5 : 1,
                                    boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                                }}
                            >
                                <div style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    color: isDisabled ? '#9ca3af' : '#6b7280',
                                    marginBottom: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {date.toLocaleDateString('en', { weekday: 'short' })}
                                </div>
                                <div style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: isDisabled ? '#9ca3af' : isSelected ? '#10b981' : '#1f2937',
                                    marginBottom: '4px'
                                }}>
                                    {date.getDate()}
                                </div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: isDisabled ? '#9ca3af' : '#6b7280'
                                }}>
                                    {date.toLocaleDateString('en', { month: 'short' })}
                                </div>
                                {renderDateStatus(dateString, date)}
                            </div>
                        );
                    })}
                </div>
                
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
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <i className="ri-arrow-left-line"></i> Back
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
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        Next: Choose Time <i className="ri-arrow-right-line"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateSelector;