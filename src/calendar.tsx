import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Event, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface Appointment extends Event {
    id: number;
    title: string;
    start: Date;
    end: Date;
    status: 'confirmed' | 'cancelled';
}

interface BookingCalendarProps {
    appointments?: Appointment[];
    onSlotSelect?: (slotInfo: SlotInfo) => void;
    selectable?: boolean;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ 
    appointments = [], 
    onSlotSelect,
    selectable = false 
}) => {
    const [events, setEvents] = useState<Appointment[]>(appointments);

    useEffect(() => {
        setEvents(appointments);
    }, [appointments]);

    return (
        <div style={{ height: 500 }}>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                onSelectSlot={onSlotSelect}
                selectable={selectable}
                views={['month', 'week', 'day']}
                defaultView="month"
                popup
                eventPropGetter={(event: Appointment) => ({
                    style: {
                        backgroundColor: event.status === 'cancelled' ? '#dc3545' : '#007cba',
                        borderColor: event.status === 'cancelled' ? '#dc3545' : '#007cba'
                    }
                })}
            />
        </div>
    );
};

export default BookingCalendar;