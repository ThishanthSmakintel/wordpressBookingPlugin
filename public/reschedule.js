// Simple reschedule functionality for users
document.addEventListener('DOMContentLoaded', function() {
    // Add reschedule functionality to existing booking forms
    const managementSections = document.querySelectorAll('.appointment-management');
    
    managementSections.forEach(section => {
        const loadButton = section.querySelector('button');
        if (loadButton && loadButton.textContent === 'Load') {
            loadButton.addEventListener('click', function() {
                const appointmentId = section.querySelector('input[type="number"]').value;
                if (appointmentId) {
                    loadAppointmentDetails(appointmentId, section);
                }
            });
        }
    });
    
    function loadAppointmentDetails(appointmentId, container) {
        fetch(`${bookingAPI.root}appointments/${appointmentId}`, {
            method: 'GET',
            headers: {
                'X-WP-Nonce': bookingAPI.nonce,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(appointment => {
            if (appointment.id) {
                showAppointmentManagement(appointment, container);
            } else {
                showToast('Appointment not found', 'error');
            }
        })
        .catch(() => showToast('Error loading appointment', 'error'));
    }
    
    function showAppointmentManagement(appointment, container) {
        const managementHTML = `
            <div class="appointment-details">
                <h4>Appointment Details</h4>
                <p><strong>ID:</strong> ${appointment.id}</p>
                <p><strong>Name:</strong> ${appointment.name}</p>
                <p><strong>Date:</strong> ${new Date(appointment.appointment_date).toLocaleString()}</p>
                <p><strong>Status:</strong> ${appointment.status}</p>
                
                <div class="reschedule-form" style="margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    <h5>Reschedule Appointment</h5>
                    <div class="form-group">
                        <label>New Date & Time:</label>
                        <input type="datetime-local" id="new-datetime-${appointment.id}" class="form-control" />
                    </div>
                    <div class="action-buttons" style="margin-top: 10px;">
                        <button onclick="rescheduleAppointment(${appointment.id})" class="reschedule-btn" style="background: #28a745; color: white; padding: 8px 16px; border: none; border-radius: 4px; margin-right: 10px;">
                            Reschedule
                        </button>
                        <button onclick="cancelAppointment(${appointment.id})" class="cancel-btn" style="background: #dc3545; color: white; padding: 8px 16px; border: none; border-radius: 4px;">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = container.innerHTML.replace(
            /<div class="management-actions">[\s\S]*?<\/div>/,
            managementHTML
        );
    }
    
    // Global functions for button clicks
    window.rescheduleAppointment = function(appointmentId) {
        const newDateTime = document.getElementById(`new-datetime-${appointmentId}`).value;
        if (!newDateTime) {
            showToast('Please select a new date and time', 'error');
            return;
        }
        
        fetch(`${bookingAPI.root}appointments/${appointmentId}`, {
            method: 'PUT',
            headers: {
                'X-WP-Nonce': bookingAPI.nonce,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                new_date: newDateTime.replace('T', ' ') + ':00'
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.message) {
                showToast('Appointment rescheduled successfully!', 'success');
                setTimeout(() => location.reload(), 2000);
            } else {
                showToast('Failed to reschedule appointment', 'error');
            }
        })
        .catch(() => showToast('Error rescheduling appointment', 'error'));
    };
    
    window.cancelAppointment = function(appointmentId) {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;
        
        fetch(`${bookingAPI.root}appointments/${appointmentId}`, {
            method: 'DELETE',
            headers: {
                'X-WP-Nonce': bookingAPI.nonce,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.message) {
                showToast('Appointment cancelled successfully!', 'success');
                setTimeout(() => location.reload(), 2000);
            } else {
                showToast('Failed to cancel appointment', 'error');
            }
        })
        .catch(() => showToast('Error cancelling appointment', 'error'));
    };
    
    // Toast notification helper (if not already available)
    if (typeof showToast === 'undefined') {
        window.showToast = function(message, type = 'success') {
            if (window.Toastify) {
                window.Toastify({
                    text: message,
                    duration: 3000,
                    gravity: 'top',
                    position: 'right',
                    backgroundColor: type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#0073aa',
                    stopOnFocus: true
                }).showToast();
            } else {
                alert(message);
            }
        };
    }
});