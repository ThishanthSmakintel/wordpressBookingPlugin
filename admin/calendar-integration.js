// Simple Calendar Integration for AppointEase
(function() {
    'use strict';
    
    // Make initSimpleCalendar globally available
    window.initSimpleCalendar = initSimpleCalendar;
    
    // Initialize calendar when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        if (document.getElementById('appointease-calendar-root')) {
            initSimpleCalendar();
        }
    });
    
    function initSimpleCalendar() {
        const calendarRoot = document.getElementById('appointease-calendar-root');
        if (!calendarRoot) return;
        
        // Create calendar HTML structure
        const calendarHTML = `
            <div class="simple-calendar">
                <div class="calendar-header">
                    <button id="prev-month" class="ae-btn ghost">&lt;</button>
                    <h3 id="current-month"></h3>
                    <button id="next-month" class="ae-btn ghost">&gt;</button>
                </div>
                <div class="calendar-grid">
                    <div class="calendar-days">
                        <div class="day-header">Sun</div>
                        <div class="day-header">Mon</div>
                        <div class="day-header">Tue</div>
                        <div class="day-header">Wed</div>
                        <div class="day-header">Thu</div>
                        <div class="day-header">Fri</div>
                        <div class="day-header">Sat</div>
                    </div>
                    <div id="calendar-dates" class="calendar-dates"></div>
                </div>
                <div class="calendar-legend">
                    <div class="legend-item">
                        <span class="legend-color confirmed"></span>
                        <span>Confirmed Appointments</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color cancelled"></span>
                        <span>Cancelled Appointments</span>
                    </div>
                </div>
            </div>
        `;
        
        calendarRoot.innerHTML = calendarHTML;
        
        // Add calendar styles
        const calendarStyles = `
            <style>
            .simple-calendar {
                background: white;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .calendar-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            .calendar-header h3 {
                margin: 0;
                font-size: 18px;
                color: #2c3e50;
            }
            .calendar-grid {
                border: 1px solid #e1e5e9;
                border-radius: 6px;
                overflow: hidden;
            }
            .calendar-days {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                background: #f8f9fa;
            }
            .day-header {
                padding: 10px;
                text-align: center;
                font-weight: 600;
                color: #7f8c8d;
                border-right: 1px solid #e1e5e9;
            }
            .day-header:last-child {
                border-right: none;
            }
            .calendar-dates {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
            }
            .calendar-date {
                min-height: 80px;
                padding: 8px;
                border-right: 1px solid #e1e5e9;
                border-bottom: 1px solid #e1e5e9;
                position: relative;
                cursor: pointer;
                transition: background-color 0.3s ease;
            }
            .calendar-date:hover {
                background: #f8f9fa;
            }
            .calendar-date:nth-child(7n) {
                border-right: none;
            }
            .calendar-date.other-month {
                color: #bdc3c7;
                background: #f8f9fa;
            }
            .calendar-date.today {
                background: #e8f5e8;
                font-weight: 600;
            }
            .appointment-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                position: absolute;
                top: 25px;
                right: 8px;
            }
            .appointment-dot.confirmed {
                background: #1CBC9B;
            }
            .appointment-dot.cancelled {
                background: #e74c3c;
            }
            .calendar-legend {
                display: flex;
                gap: 20px;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #e1e5e9;
            }
            .legend-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: #7f8c8d;
            }
            .legend-color {
                width: 12px;
                height: 12px;
                border-radius: 50%;
            }
            .legend-color.confirmed {
                background: #1CBC9B;
            }
            .legend-color.cancelled {
                background: #e74c3c;
            }
            #appointease-calendar-root {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            .appointment-count {
                position: absolute;
                top: 2px;
                right: 2px;
                background: #1CBC9B;
                color: white;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }
            .day-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .day-modal.show {
                display: flex;
            }
            .day-modal-content {
                background: white;
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            .day-modal-header {
                padding: 20px;
                border-bottom: 1px solid #e1e5e9;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .day-modal-body {
                padding: 20px;
            }
            .appointment-item {
                padding: 15px;
                border: 1px solid #e1e5e9;
                border-radius: 6px;
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .appointment-item.confirmed {
                border-left: 4px solid #1CBC9B;
            }
            .appointment-item.cancelled {
                border-left: 4px solid #e74c3c;
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', calendarStyles);
        
        // Initialize calendar functionality
        let currentDate = new Date();
        
        function renderCalendar() {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            
            // Update header
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
            
            // Get first day of month and number of days
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const daysInPrevMonth = new Date(year, month, 0).getDate();
            
            const datesContainer = document.getElementById('calendar-dates');
            datesContainer.innerHTML = '';
            
            // Add previous month's trailing days
            for (let i = firstDay - 1; i >= 0; i--) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-date other-month';
                dayDiv.textContent = daysInPrevMonth - i;
                datesContainer.appendChild(dayDiv);
            }
            
            // Add current month's days
            const today = new Date();
            for (let day = 1; day <= daysInMonth; day++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-date';
                dayDiv.textContent = day;
                
                // Highlight today
                if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                    dayDiv.classList.add('today');
                }
                
                // Add appointment indicators and click functionality
                if (window.appointeaseCalendarData) {
                    const dayAppointments = window.appointeaseCalendarData.filter(apt => {
                        const aptDate = new Date(apt.start);
                        return aptDate.getFullYear() === year && 
                               aptDate.getMonth() === month && 
                               aptDate.getDate() === day;
                    });
                    
                    if (dayAppointments.length > 0) {
                        const dot = document.createElement('div');
                        dot.className = `appointment-dot ${dayAppointments[0].status}`;
                        dayDiv.appendChild(dot);
                        
                        // Add appointment count
                        const count = document.createElement('div');
                        count.className = 'appointment-count';
                        count.textContent = dayAppointments.length;
                        dayDiv.appendChild(count);
                    }
                    
                    // Add click event to show day details
                    dayDiv.addEventListener('click', function() {
                        showDayDetails(year, month, day, dayAppointments);
                    });
                } else {
                    // Add click event even without data for manual booking
                    dayDiv.addEventListener('click', function() {
                        showDayDetails(year, month, day, []);
                    });
                }
                
                datesContainer.appendChild(dayDiv);
            }
            
            // Add next month's leading days
            const totalCells = datesContainer.children.length;
            const remainingCells = 42 - totalCells; // 6 rows × 7 days
            for (let day = 1; day <= remainingCells; day++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-date other-month';
                dayDiv.textContent = day;
                datesContainer.appendChild(dayDiv);
            }
        }
        
        // Event listeners
        document.getElementById('prev-month').addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
        
        document.getElementById('next-month').addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
        
        // Initial render
        renderCalendar();
        
        // Update calendar when data is loaded
        if (window.appointeaseCalendarData) {
            renderCalendar();
        }
    }
    
    // Override the calendar initialization function
    window.initAppointeaseCalendar = function() {
        if (document.getElementById('appointease-calendar-root')) {
            initSimpleCalendar();
        }
    };
    
    // Day details modal functions
    function createDayModal() {
        const modal = document.createElement('div');
        modal.id = 'day-modal';
        modal.className = 'day-modal';
        modal.innerHTML = `
            <div class="day-modal-content">
                <div class="day-modal-header">
                    <h3 id="day-modal-title">Day Details</h3>
                    <button id="close-day-modal" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                <div class="day-modal-body">
                    <div id="day-appointments"></div>
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
                        <button id="add-appointment-btn" class="ae-btn primary" style="padding: 10px 20px; background: #1CBC9B; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            <i class="dashicons dashicons-plus"></i> Add Manual Booking
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('close-day-modal').addEventListener('click', closeDayModal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeDayModal();
        });
        
        document.getElementById('add-appointment-btn').addEventListener('click', function() {
            const selectedDate = modal.dataset.selectedDate;
            openManualBookingModal(selectedDate);
        });
    }
    
    function showDayDetails(year, month, day, appointments) {
        if (!document.getElementById('day-modal')) {
            createDayModal();
        }
        
        const date = new Date(year, month, day);
        const dateStr = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        document.getElementById('day-modal-title').textContent = dateStr;
        
        const appointmentsContainer = document.getElementById('day-appointments');
        
        if (appointments.length === 0) {
            appointmentsContainer.innerHTML = '<p style="color: #7f8c8d; text-align: center; padding: 20px;">No appointments scheduled for this day</p>';
        } else {
            appointmentsContainer.innerHTML = appointments.map(apt => {
                const time = new Date(apt.start).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                return `
                    <div class="appointment-item ${apt.status}">
                        <div>
                            <strong>${apt.title}</strong><br>
                            <small>${time}</small>
                        </div>
                        <div>
                            <span class="status-badge ${apt.status}">${apt.status}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        const modal = document.getElementById('day-modal');
        modal.dataset.selectedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        modal.classList.add('show');
    }
    
    function closeDayModal() {
        document.getElementById('day-modal').classList.remove('show');
    }
    
    function openManualBookingModal(selectedDate) {
        closeDayModal();
        
        if (!document.getElementById('manual-booking-modal')) {
            createManualBookingModal();
        }
        
        document.getElementById('manual-appointment-date').value = selectedDate;
        document.getElementById('manual-booking-modal').classList.add('show');
    }
    
    function createManualBookingModal() {
        const modal = document.createElement('div');
        modal.id = 'manual-booking-modal';
        modal.className = 'day-modal';
        modal.innerHTML = `
            <div class="day-modal-content">
                <div class="day-modal-header">
                    <h3>Manual Booking</h3>
                    <button id="close-manual-modal" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                <div class="day-modal-body">
                    <form id="manual-booking-form">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Customer Name *</label>
                            <input type="text" id="manual-customer-name" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Email *</label>
                            <input type="email" id="manual-customer-email" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Phone</label>
                            <input type="tel" id="manual-customer-phone" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Date *</label>
                            <input type="date" id="manual-appointment-date" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Time *</label>
                            <input type="time" id="manual-appointment-time" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                            <button type="button" id="cancel-manual-booking" style="padding: 10px 20px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">Cancel</button>
                            <button type="submit" style="padding: 10px 20px; background: #1CBC9B; color: white; border: none; border-radius: 6px; cursor: pointer;">Create Booking</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('close-manual-modal').addEventListener('click', closeManualBookingModal);
        document.getElementById('cancel-manual-booking').addEventListener('click', closeManualBookingModal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeManualBookingModal();
        });
        
        document.getElementById('manual-booking-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (typeof jQuery === 'undefined' || typeof appointeaseAdmin === 'undefined') {
                alert('Error: Required scripts not loaded');
                return;
            }
            
            const formData = {
                action: 'create_manual_booking',
                _wpnonce: appointeaseAdmin.nonce,
                name: document.getElementById('manual-customer-name').value,
                email: document.getElementById('manual-customer-email').value,
                phone: document.getElementById('manual-customer-phone').value,
                appointment_date: document.getElementById('manual-appointment-date').value + ' ' + document.getElementById('manual-appointment-time').value
            };
            
            jQuery.post(appointeaseAdmin.ajaxurl, formData, function(response) {
                if (response.success) {
                    alert('Booking created successfully!');
                    closeManualBookingModal();
                    location.reload();
                } else {
                    alert('Error creating booking: ' + (response.data || 'Unknown error'));
                }
            }).fail(function() {
                alert('Error creating booking. Please try again.');
            });
        });
    }
    
    function closeManualBookingModal() {
        document.getElementById('manual-booking-modal').classList.remove('show');
    }
    
    // Make functions globally available
    window.showDayDetails = showDayDetails;
    window.closeDayModal = closeDayModal;
    window.openManualBookingModal = openManualBookingModal;
    
})();