document.addEventListener('DOMContentLoaded', function() {
    const bookingContainer = document.getElementById('booking-form');
    if (!bookingContainer) return;

    const { useState, createElement: e } = React;
    const { Calendar, momentLocalizer } = window.BigCalendar;
    const localizer = momentLocalizer(window.moment);
    
    // Toast notification helper
    const showToast = (message, type = 'success') => {
        window.Toastify({
            text: message,
            duration: 3000,
            gravity: 'top',
            position: 'right',
            backgroundColor: type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#0073aa',
            stopOnFocus: true
        }).showToast();
    };

    function BookingApp() {
        const [selectedDate, setSelectedDate] = useState(new Date());
        const [selectedTime, setSelectedTime] = useState('09:00');
        const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
        const [message, setMessage] = useState('');
        const [appointmentId, setAppointmentId] = useState('');
        const [showManagement, setShowManagement] = useState(false);

        const handleSubmit = (event) => {
            event.preventDefault();
            
            const appointmentDateTime = new Date(selectedDate);
            const [hours, minutes] = selectedTime.split(':');
            appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

            const data = new FormData();
            data.append('action', 'book_appointment');
            data.append('nonce', booking_ajax.nonce);
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('phone', formData.phone);
            data.append('date', appointmentDateTime.toISOString().slice(0, 19).replace('T', ' '));

            fetch(booking_ajax.ajax_url, {
                method: 'POST',
                body: data
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showToast(`${result.data.message} Your appointment ID is: ${result.data.id}`, 'success');
                    setFormData({ name: '', email: '', phone: '' });
                    setMessage('');
                } else {
                    showToast(result.data, 'error');
                    setMessage('');
                }
            });
        };

        const handleCancel = () => {
            const data = new FormData();
            data.append('action', 'cancel_appointment');
            data.append('nonce', booking_ajax.nonce);
            data.append('id', appointmentId);

            fetch(booking_ajax.ajax_url, { method: 'POST', body: data })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showToast('Appointment cancelled successfully!', 'success');
                    setShowManagement(false);
                } else {
                    showToast('Failed to cancel appointment', 'error');
                }
            });
        };

        return e('div', { className: 'booking-app' }, [
            e('h3', { key: 'title' }, 'Book an Appointment'),
            
            e('form', { key: 'form', onSubmit: handleSubmit }, [
                e('div', { key: 'name', className: 'form-group' }, [
                    e('label', null, 'Name:'),
                    e('input', {
                        type: 'text',
                        value: formData.name,
                        onChange: (e) => setFormData({...formData, name: e.target.value}),
                        required: true
                    })
                ]),
                
                e('div', { key: 'email', className: 'form-group' }, [
                    e('label', null, 'Email:'),
                    e('input', {
                        type: 'email',
                        value: formData.email,
                        onChange: (e) => setFormData({...formData, email: e.target.value}),
                        required: true
                    })
                ]),
                
                e('div', { key: 'phone', className: 'form-group' }, [
                    e('label', null, 'Phone:'),
                    e('input', {
                        type: 'tel',
                        value: formData.phone,
                        onChange: (e) => setFormData({...formData, phone: e.target.value})
                    })
                ]),
                
                e('div', { key: 'calendar', className: 'form-group' }, [
                    e('label', null, 'Select Date:'),
                    e('div', { style: { height: 400 } },
                        e(Calendar, {
                            localizer: localizer,
                            events: [],
                            startAccessor: 'start',
                            endAccessor: 'end',
                            onSelectSlot: (slotInfo) => setSelectedDate(slotInfo.start),
                            selectable: true,
                            views: { month: true },
                            defaultView: 'month',
                            style: { height: 400 }
                        })
                    )
                ]),
                
                e('div', { key: 'time', className: 'form-group' }, [
                    e('label', null, 'Select Time:'),
                    e('select', {
                        value: selectedTime,
                        onChange: (e) => setSelectedTime(e.target.value)
                    }, [
                        e('option', { key: '09', value: '09:00' }, '9:00 AM'),
                        e('option', { key: '10', value: '10:00' }, '10:00 AM'),
                        e('option', { key: '11', value: '11:00' }, '11:00 AM'),
                        e('option', { key: '14', value: '14:00' }, '2:00 PM'),
                        e('option', { key: '15', value: '15:00' }, '3:00 PM'),
                        e('option', { key: '16', value: '16:00' }, '4:00 PM')
                    ])
                ]),
                
                e('button', { key: 'submit', type: 'submit' }, 'Book Appointment')
            ]),
            
            message && e('div', { key: 'message', className: 'message' }, message),
            
            e('div', { key: 'management', className: 'appointment-management' }, [
                e('h4', null, 'Manage Appointment'),
                e('input', {
                    type: 'number',
                    placeholder: 'Enter Appointment ID',
                    value: appointmentId,
                    onChange: (e) => setAppointmentId(e.target.value)
                }),
                e('button', {
                    onClick: () => setShowManagement(true)
                }, 'Load'),
                
                showManagement && appointmentId && e('div', { className: 'management-actions' }, [
                    e('p', null, `Managing Appointment #${appointmentId}`),
                    e('button', { onClick: handleCancel }, 'Cancel Appointment')
                ])
            ])
        ]);
    }

    ReactDOM.render(e(BookingApp), bookingContainer);

    // Add CSS
    const style = document.createElement('style');
    style.textContent = `
        .booking-app { max-width: 600px; margin: 20px 0; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input, .form-group select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .booking-app button { background: #0073aa; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
        .booking-app button:hover { background: #005a87; }
        .message { padding: 10px; margin: 10px 0; border-radius: 4px; background: #f0f8ff; }
        .appointment-management { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        .rbc-calendar { border: 1px solid #ddd; border-radius: 4px; }
        .rbc-header { background: #f8f9fa; color: #333; font-weight: 600; }
        .rbc-toolbar { background: #f8f9fa; padding: 10px; border-bottom: 1px solid #ddd; }
        .rbc-toolbar button { background: #0073aa; color: white; border: none; padding: 5px 10px; margin: 0 2px; border-radius: 3px; }
        .rbc-toolbar button:hover { background: #005a87; }
        .rbc-date-cell { padding: 8px; }
        .rbc-date-cell:hover { background: #f0f6fc; }
        .rbc-selected { background: #0073aa !important; color: white !important; }
    `;
    document.head.appendChild(style);
});

