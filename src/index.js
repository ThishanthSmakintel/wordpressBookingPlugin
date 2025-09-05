import { createRoot } from '@wordpress/element';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './style.scss';

const localizer = momentLocalizer(moment);

function BookingCalendar() {
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [formData, setFormData] = React.useState({ name: '', email: '', phone: '' });
    const [selectedTime, setSelectedTime] = React.useState('09:00');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const appointmentDateTime = new Date(selectedDate);
        const [hours, minutes] = selectedTime.split(':');
        appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

        const data = new FormData();
        data.append('action', 'book_appointment');
        data.append('nonce', bookingAjax.nonce);
        data.append('name', formData.name);
        data.append('email', formData.email);
        data.append('phone', formData.phone);
        data.append('date', appointmentDateTime.toISOString().slice(0, 19).replace('T', ' '));

        fetch(bookingAjax.ajaxUrl, {
            method: 'POST',
            body: data
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert(`${result.data.message} Your appointment ID is: ${result.data.id}`);
                setFormData({ name: '', email: '', phone: '' });
            } else {
                alert(result.data);
            }
        });
    };

    return (
        <div className="booking-app">
            <h3>Book an Appointment</h3>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Name:</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label>Phone:</label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
                
                <div className="form-group">
                    <label>Select Date:</label>
                    <Calendar
                        localizer={localizer}
                        events={[]}
                        startAccessor="start"
                        endAccessor="end"
                        onSelectSlot={(slotInfo) => setSelectedDate(slotInfo.start)}
                        selectable
                        views={{ month: true }}
                        defaultView="month"
                        style={{ height: 400 }}
                    />
                </div>
                
                <div className="form-group">
                    <label>Select Time:</label>
                    <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                    </select>
                </div>
                
                <button type="submit">Book Appointment</button>
            </form>
        </div>
    );
}

// Initialize React app
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('booking-form');
    if (container) {
        const root = createRoot(container);
        root.render(<BookingCalendar />);
    }
});