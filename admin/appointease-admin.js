// AppointEase Admin JavaScript
jQuery(document).ready(function($) {

    // Modal Functions
    window.openServiceModal = function() {
        $('#service-modal-title').text('Add Service');
        $('#service-form')[0].reset();
        $('#service-id').val('');
        $('#service-modal').addClass('show');
    };

    window.openStaffModal = function() {
        $('#staff-modal-title').text('Add Staff Member');
        $('#staff-form')[0].reset();
        $('#staff-id').val('');
        $('#staff-modal').addClass('show');
    };

    // Close modals
    $('.ae-close').click(function() {
        $(this).closest('.ae-modal').removeClass('show');
    });

    // Close modal on backdrop click
    $('.ae-modal').click(function(e) {
        if (e.target === this) {
            $(this).removeClass('show');
        }
    });

    // Service Form Submit
    $('#service-form').submit(function(e) {
        e.preventDefault();
        
        const formData = {
            action: 'save_service',
            _wpnonce: appointeaseAdmin.nonce,
            id: $('#service-id').val(),
            name: $('#service-name').val(),
            description: $('#service-description').val(),
            duration: $('#service-duration').val(),
            price: $('#service-price').val()
        };

        $.post(appointeaseAdmin.ajaxurl, formData, function(response) {
            if (response.success) {
                showNotification('Service saved successfully!', 'success');
                $('#service-modal').removeClass('show');
                location.reload();
            } else {
                showNotification('Error saving service', 'error');
            }
        });
    });

    // Staff Form Submit
    $('#staff-form').submit(function(e) {
        e.preventDefault();
        
        const formData = {
            action: 'save_staff',
            _wpnonce: appointeaseAdmin.nonce,
            id: $('#staff-id').val(),
            name: $('#staff-name').val(),
            email: $('#staff-email').val(),
            phone: $('#staff-phone').val()
        };

        $.post(appointeaseAdmin.ajaxurl, formData, function(response) {
            if (response.success) {
                showNotification('Staff member saved successfully!', 'success');
                $('#staff-modal').removeClass('show');
                location.reload();
            } else {
                showNotification('Error saving staff member', 'error');
            }
        });
    });

    // Edit Service
    window.editService = function(id) {
        $.post(appointeaseAdmin.ajaxurl, {
            action: 'get_service',
            _wpnonce: appointeaseAdmin.nonce,
            id: id
        }, function(response) {
            if (response.success) {
                const service = response.data;
                $('#service-modal-title').text('Edit Service');
                $('#service-id').val(service.id);
                $('#service-name').val(service.name);
                $('#service-description').val(service.description);
                $('#service-duration').val(service.duration);
                $('#service-price').val(service.price);
                $('#service-modal').addClass('show');
            }
        });
    };

    // Edit Staff
    window.editStaff = function(id) {
        $.post(appointeaseAdmin.ajaxurl, {
            action: 'get_staff',
            _wpnonce: appointeaseAdmin.nonce,
            id: id
        }, function(response) {
            if (response.success) {
                const staff = response.data;
                $('#staff-modal-title').text('Edit Staff Member');
                $('#staff-id').val(staff.id);
                $('#staff-name').val(staff.name);
                $('#staff-email').val(staff.email);
                $('#staff-phone').val(staff.phone);
                $('#staff-modal').addClass('show');
            }
        });
    };

    // Delete Service
    window.deleteService = function(id) {
        if (confirm('Are you sure you want to delete this service?')) {
            $.post(appointeaseAdmin.ajaxurl, {
                action: 'delete_service',
                _wpnonce: appointeaseAdmin.nonce,
                id: id
            }, function(response) {
                if (response.success) {
                    showNotification('Service deleted successfully!', 'success');
                    location.reload();
                } else {
                    showNotification('Error deleting service', 'error');
                }
            });
        }
    };

    // Delete Staff
    window.deleteStaff = function(id) {
        if (confirm('Are you sure you want to delete this staff member?')) {
            $.post(appointeaseAdmin.ajaxurl, {
                action: 'delete_staff',
                _wpnonce: appointeaseAdmin.nonce,
                id: id
            }, function(response) {
                if (response.success) {
                    showNotification('Staff member deleted successfully!', 'success');
                    location.reload();
                } else {
                    showNotification('Error deleting staff member', 'error');
                }
            });
        }
    };

    // Update Appointment Status
    window.updateAppointmentStatus = function(id, status) {
        $.post(appointeaseAdmin.ajaxurl, {
            action: 'update_appointment_status',
            _wpnonce: appointeaseAdmin.nonce,
            id: id,
            status: status
        }, function(response) {
            if (response.success) {
                showNotification('Appointment status updated!', 'success');
            } else {
                showNotification('Error updating status', 'error');
            }
        });
    };

    // Delete Appointment
    window.deleteAppointment = function(id) {
        if (confirm('Are you sure you want to delete this appointment?')) {
            $.post(appointeaseAdmin.ajaxurl, {
                action: 'delete_appointment',
                _wpnonce: appointeaseAdmin.nonce,
                id: id
            }, function(response) {
                if (response.success) {
                    showNotification('Appointment deleted successfully!', 'success');
                    location.reload();
                } else {
                    showNotification('Error deleting appointment', 'error');
                }
            });
        }
    };

    // Notification System
    function showNotification(message, type = 'success') {
        const notification = $(`
            <div class="ae-notification ${type}">
                <span>${message}</span>
                <button class="ae-notification-close">&times;</button>
            </div>
        `);

        $('body').append(notification);
        
        setTimeout(() => {
            notification.addClass('show');
        }, 100);

        setTimeout(() => {
            notification.removeClass('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        notification.find('.ae-notification-close').click(() => {
            notification.removeClass('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    // Search and Filter Functionality
    $('#appointment-search').on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        $('.ae-table tbody tr').each(function() {
            const text = $(this).text().toLowerCase();
            $(this).toggle(text.includes(searchTerm));
        });
    });

    $('#status-filter').on('change', function() {
        const filterValue = $(this).val();
        $('.ae-table tbody tr').each(function() {
            if (filterValue === '') {
                $(this).show();
            } else {
                const status = $(this).find('.status-badge').text().toLowerCase();
                $(this).toggle(status.includes(filterValue));
            }
        });
    });


});

// Add notification styles dynamically
const notificationStyles = `
<style>
.ae-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    padding: 15px 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    border-left: 4px solid #1CBC9B;
    display: flex;
    align-items: center;
    gap: 15px;
    z-index: 10000;
    transform: translateX(400px);
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 350px;
}

.ae-notification.show {
    transform: translateX(0);
    opacity: 1;
}

.ae-notification.error {
    border-left-color: #e74c3c;
}

.ae-notification-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #7f8c8d;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ae-notification-close:hover {
    color: #2c3e50;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', notificationStyles);