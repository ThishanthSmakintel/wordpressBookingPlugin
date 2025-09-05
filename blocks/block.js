import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { TextControl, SelectControl, Button } from '@wordpress/components';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './editor.scss';

const localizer = momentLocalizer(moment);

registerBlockType('booking/appointment-form', {
    apiVersion: 2,
    title: __('Appointment Booking', 'booking-plugin'),
    icon: 'calendar-alt',
    category: 'widgets',
    example: {},
    
    edit() {
        const blockProps = useBlockProps();
        const [selectedDate, setSelectedDate] = useState(new Date());
        const [selectedTime, setSelectedTime] = useState('09:00');
        const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
        
        const timeOptions = [
            { label: '9:00 AM', value: '09:00' },
            { label: '10:00 AM', value: '10:00' },
            { label: '11:00 AM', value: '11:00' },
            { label: '2:00 PM', value: '14:00' },
            { label: '3:00 PM', value: '15:00' },
            { label: '4:00 PM', value: '16:00' }
        ];
        
        return (
            <div {...blockProps}>
                <div className="booking-editor-preview">
                    <h3>{__('Book an Appointment', 'booking-plugin')}</h3>
                    
                    <TextControl
                        label={__('Name', 'booking-plugin')}
                        value={formData.name}
                        onChange={(value) => setFormData({...formData, name: value})}
                        placeholder={__('Enter your name', 'booking-plugin')}
                    />
                    
                    <TextControl
                        label={__('Email', 'booking-plugin')}
                        type="email"
                        value={formData.email}
                        onChange={(value) => setFormData({...formData, email: value})}
                        placeholder={__('Enter your email', 'booking-plugin')}
                    />
                    
                    <TextControl
                        label={__('Phone', 'booking-plugin')}
                        type="tel"
                        value={formData.phone}
                        onChange={(value) => setFormData({...formData, phone: value})}
                        placeholder={__('Enter your phone', 'booking-plugin')}
                    />
                    
                    <div className="calendar-section">
                        <label className="components-base-control__label">
                            {__('Select Date', 'booking-plugin')}
                        </label>
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
                    
                    <SelectControl
                        label={__('Select Time', 'booking-plugin')}
                        value={selectedTime}
                        options={timeOptions}
                        onChange={setSelectedTime}
                    />
                    
                    <Button isPrimary disabled>
                        {__('Book Appointment (Preview)', 'booking-plugin')}
                    </Button>
                    
                    <div className="editor-note">
                        <em>{__('This is a preview. The form will be functional on the frontend.', 'booking-plugin')}</em>
                    </div>
                </div>
            </div>
        );
    },
    
    save() {
        const blockProps = useBlockProps.save({
            className: 'booking-form-container',
            id: 'booking-form'
        });
        
        return <div {...blockProps}></div>;
    }
});