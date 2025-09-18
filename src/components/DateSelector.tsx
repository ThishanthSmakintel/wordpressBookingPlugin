import React, { useState } from 'react';
import { useBookingStore } from '../store/bookingStore';

const DateSelector: React.FC = () => {
    const { selectedDate, setSelectedDate, setStep } = useBookingStore();
    const [tempSelected, setTempSelected] = useState<string>(selectedDate || '');
    
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
    
    const generateCalendar = () => {
        const today = new Date();
        const days = [];
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push(date);
        }
        return days;
    };

    return (
        <div className="appointease-step-content">
            <h2 style={{fontSize: '2rem', fontWeight: '700', textAlign: 'center', marginBottom: '2rem', color: '#1f2937'}}>Pick Your Date</h2>
            
            <div style={{maxWidth: '800px', margin: '0 auto'}}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px'
                }}>
                    {generateCalendar().map((date, index) => {
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        const isPast = date < new Date(new Date().setHours(0,0,0,0));
                        const isDisabled = isWeekend || isPast;
                        const dateString = date.toISOString().split('T')[0];
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
                                {isDisabled && (
                                    <div style={{
                                        fontSize: '0.625rem',
                                        color: '#ef4444',
                                        marginTop: '4px',
                                        fontWeight: '500'
                                    }}>
                                        {isWeekend ? 'Closed' : 'Past'}
                                    </div>
                                )}
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
                        Next: Choose Time →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateSelector;