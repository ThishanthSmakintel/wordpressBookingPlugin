import React, { useState } from 'react';

interface CalendarProps {
    selectedDate: string;
    onDateSelect: (date: string) => void;
}

const SimpleCalendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };
    
    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };
    
    const formatDate = (year: number, month: number, day: number) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };
    
    const isToday = (year: number, month: number, day: number) => {
        const today = new Date();
        return today.getFullYear() === year && 
               today.getMonth() === month && 
               today.getDate() === day;
    };
    
    const isPast = (year: number, month: number, day: number) => {
        const today = new Date();
        const checkDate = new Date(year, month, day);
        return checkDate < today;
    };
    
    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        
        const days = [];
        
        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = formatDate(year, month, day);
            const isSelected = selectedDate === dateStr;
            const isTodayDate = isToday(year, month, day);
            const isPastDate = isPast(year, month, day);
            
            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''} ${isPastDate ? 'past' : ''}`}
                    onClick={() => !isPastDate && onDateSelect(dateStr)}
                >
                    {day}
                </div>
            );
        }
        
        return days;
    };
    
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };
    
    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };
    
    return (
        <div className="simple-calendar">
            <div className="calendar-header">
                <button onClick={prevMonth} className="nav-btn">‹</button>
                <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                <button onClick={nextMonth} className="nav-btn">›</button>
            </div>
            <div className="calendar-weekdays">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
            </div>
            <div className="calendar-grid">
                {renderCalendar()}
            </div>
        </div>
    );
};

export default SimpleCalendar;