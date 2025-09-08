import React from 'react';

interface DateSelectorProps {
    selectedDate: string;
    onDateSelect: (date: string) => void;
    onBack: () => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({
    selectedDate,
    onDateSelect,
    onBack
}) => {
    const generateCalendar = () => {
        const today = new Date();
        const days = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push(date);
        }
        return days;
    };

    return (
        <div className="appointease-step-content">
            <div className="progress-bar">
                <div className="progress-fill" style={{width: '60%'}}></div>
            </div>
            <h2>Pick Your Date</h2>
            <p className="step-description">Choose when you'd like your appointment</p>
            <div className="calendar-grid" role="grid" aria-label="Calendar for date selection">
                {generateCalendar().map((date, index) => {
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isPast = date < new Date(new Date().setHours(0,0,0,0));
                    const isDisabled = isWeekend || isPast;
                    const dateString = date.toISOString().split('T')[0];
                    const formattedDate = date.toLocaleDateString('en', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    });
                    
                    return (
                        <div 
                            key={index} 
                            className={`calendar-day ${isDisabled ? 'disabled' : ''}`}
                            onClick={() => !isDisabled && onDateSelect(dateString)}
                            onKeyDown={(e) => e.key === 'Enter' && !isDisabled && onDateSelect(dateString)}
                            tabIndex={isDisabled ? -1 : 0}
                            role="button"
                            aria-label={isDisabled ? `${formattedDate} - unavailable` : `Select ${formattedDate}`}
                            aria-disabled={isDisabled}
                        >
                            <span className="day-name">{date.toLocaleDateString('en', { weekday: 'short' })}</span>
                            <span className="day-number">{date.getDate()}</span>
                            <span className="day-month">{date.toLocaleDateString('en', { month: 'short' })}</span>
                            {isWeekend && <span className="unavailable">Closed</span>}
                            {isPast && !isWeekend && <span className="unavailable">Past</span>}
                        </div>
                    );
                })}
            </div>
            <div className="form-actions">
                <button className="back-btn" onClick={onBack} aria-label="Go back to specialist selection">
                    <i className="fas fa-arrow-left" aria-hidden="true"></i> Back
                </button>
            </div>
        </div>
    );
};

export default DateSelector;