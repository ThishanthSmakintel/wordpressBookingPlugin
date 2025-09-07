import React, { useState, useEffect } from 'react';
import { useBooking } from '../contexts/BookingContext';
import { useAPI } from '../hooks/useAPI';

const DateTimeSelector: React.FC = () => {
  const { state, dispatch } = useBooking();
  const { data: availableSlots, loading: slotsLoading, request } = useAPI<string[]>();
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (selectedDate && state.selectedEmployee) {
      request(`appointease/v1/available-slots?date=${selectedDate}&staff_id=${state.selectedEmployee.id}`);
    }
  }, [selectedDate, state.selectedEmployee, request]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    dispatch({ type: 'SET_DATE', payload: date });
  };

  const handleTimeSelect = (time: string) => {
    dispatch({ type: 'SET_TIME', payload: time });
    dispatch({ type: 'SET_STEP', payload: 4 });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="datetime-selector">
      <h3>Select Date & Time</h3>
      
      <div className="date-picker">
        <label>Date:</label>
        <input
          type="date"
          min={today}
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
        />
      </div>

      {selectedDate && (
        <div className="time-slots">
          <h4>Available Times</h4>
          {slotsLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading available times...</p>
            </div>
          ) : (
            <div className="time-grid">
              {availableSlots?.map(time => (
                <button
                  key={time}
                  className={`time-slot ${state.selectedTime === time ? 'selected' : ''}`}
                  onClick={() => handleTimeSelect(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button 
        className="back-btn"
        onClick={() => dispatch({ type: 'SET_STEP', payload: 2 })}
      >
        Back
      </button>
    </div>
  );
};

export default DateTimeSelector;