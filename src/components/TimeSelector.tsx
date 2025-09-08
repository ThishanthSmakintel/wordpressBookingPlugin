import React from 'react';

interface Service {
    duration?: number;
}

interface TimeSelectorProps {
    selectedDate: string;
    selectedTime: string;
    selectedService: Service | null;
    unavailableSlots: string[];
    timezone: string;
    onTimeSelect: (time: string) => void;
    onBack: () => void;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
    selectedDate,
    selectedTime,
    selectedService,
    unavailableSlots,
    timezone,
    onTimeSelect,
    onBack
}) => {
    const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

    return (
        <div className="appointease-step-content">
            <div className="progress-bar">
                <div className="progress-fill" style={{width: '80%'}}></div>
            </div>
            <h2>Choose Your Time</h2>
            <p className="step-description">Select your preferred time slot</p>
            <div className="selected-info" role="status">
                <span><i className="ri-calendar-line" aria-hidden="true"></i> {new Date(selectedDate).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="timezone-info" role="status">
                <i className="fas fa-clock" aria-hidden="true"></i>
                All times shown in {timezone}
            </div>
            <div className="time-slots" role="grid" aria-label="Available time slots">
                {timeSlots.map(time => {
                    const isUnavailable = unavailableSlots.includes(time);
                    const serviceDuration = selectedService?.duration || 30;
                    return (
                        <div 
                            key={time} 
                            className={`time-slot ${isUnavailable ? 'unavailable' : ''}`}
                            onClick={() => onTimeSelect(time)}
                            onKeyDown={(e) => e.key === 'Enter' && onTimeSelect(time)}
                            tabIndex={isUnavailable ? -1 : 0}
                            role="button"
                            aria-label={`${time} for ${serviceDuration} minutes - ${isUnavailable ? 'unavailable' : 'available'}`}
                            aria-disabled={isUnavailable}
                        >
                            <div className="time-info">
                                <span className="time">{time}</span>
                                <span className="duration">{serviceDuration} min</span>
                            </div>
                            <span className="status">{isUnavailable ? 'Unavailable' : 'Available'}</span>
                        </div>
                    );
                })}
            </div>
            <div className="form-actions">
                <button className="back-btn" onClick={onBack} aria-label="Go back to date selection">
                    <i className="fas fa-arrow-left" aria-hidden="true"></i> Back
                </button>
            </div>
        </div>
    );
};

export default TimeSelector;