import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Event, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import { useBookingStore } from './store/bookingStore';
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
    onSlotSelect?: (slotInfo: SlotInfo) => void;
    selectable?: boolean;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ 
    onSlotSelect,
    selectable = false 
}) => {
    const { appointments } = useBookingStore();
    const [events, setEvents] = useState<Appointment[]>([]);

    useEffect(() => {
        const formattedEvents = appointments.map(apt => ({
            id: parseInt(apt.id),
            title: apt.service,
            start: new Date(apt.date),
            end: new Date(new Date(apt.date).getTime() + 60 * 60 * 1000), // 1 hour duration
            status: apt.status as 'confirmed' | 'cancelled'
        }));
        setEvents(formattedEvents);
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