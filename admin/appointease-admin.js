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
    
    // Reschedule Appointment
    window.rescheduleAppointment = function(id) {
        $('#reschedule-appointment-id').val(id);
        $('#reschedule-modal').addClass('show');
    };
    
    // Reschedule Form Submit
    $('#reschedule-form').submit(function(e) {
        e.preventDefault();
        
        const formData = {
            action: 'reschedule_appointment',
            _wpnonce: appointeaseAdmin.nonce,
            id: $('#reschedule-appointment-id').val(),
            new_datetime: $('#reschedule-datetime').val()
        };

        $.post(appointeaseAdmin.ajaxurl, formData, function(response) {
            if (response.success) {
                showNotification('Appointment rescheduled successfully!', 'success');
                $('#reschedule-modal').removeClass('show');
                location.reload();
            } else {
                showNotification('Error rescheduling appointment', 'error');
            }
        });
    });

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
    
    // Calendar initialization
    window.initAppointeaseCalendar = function() {
        if (window.appointeaseCalendarData && document.getElementById('appointease-calendar-root')) {
            const calendarEl = document.getElementById('appointease-calendar-root');
            calendarEl.innerHTML = '<div style="padding: 20px; text-align: center;">Calendar view with ' + window.appointeaseCalendarData.length + ' appointments loaded</div>';
        }
    };
    
    // Category functions
    window.openCategoryModal = function() {
        $('#category-modal-title').text('Add Category');
        $('#category-form')[0].reset();
        $('#category-id').val('');
        $('#category-modal').addClass('show');
    };
    
    window.editCategory = function(id) {
        $('#category-modal-title').text('Edit Category');
        $('#category-id').val(id);
        $('#category-modal').addClass('show');
    };
    
    window.deleteCategory = function(id) {
        if (confirm('Are you sure you want to delete this category?')) {
            $.post(appointeaseAdmin.ajaxurl, {
                action: 'delete_category',
                _wpnonce: appointeaseAdmin.nonce,
                id: id
            }, function(response) {
                if (response.success) {
                    showNotification('Category deleted successfully!', 'success');
                    location.reload();
                } else {
                    showNotification('Error deleting category', 'error');
                }
            });
        }
    };
    
    // Customer functions
    window.openCustomerModal = function() {
        $('#customer-modal-title').text('Add Customer');
        $('#customer-form')[0].reset();
        $('#customer-id').val('');
        $('#customer-modal').addClass('show');
    };
    
    window.editCustomer = function(id) {
        $('#customer-modal-title').text('Edit Customer');
        $('#customer-id').val(id);
        $('#customer-modal').addClass('show');
    };
    
    window.deleteCustomer = function(id) {
        if (confirm('Are you sure you want to delete this customer?')) {
            $.post(appointeaseAdmin.ajaxurl, {
                action: 'delete_customer',
                _wpnonce: appointeaseAdmin.nonce,
                id: id
            }, function(response) {
                if (response.success) {
                    showNotification('Customer deleted successfully!', 'success');
                    location.reload();
                } else {
                    showNotification('Error deleting customer', 'error');
                }
            });
        }
    };
    
    // Email template functions
    window.openTemplateModal = function() {
        $('#template-modal-title').text('Add Email Template');
        $('#template-form')[0].reset();
        $('#template-id').val('');
        $('#template-modal').addClass('show');
    };
    
    window.editTemplate = function(id) {
        $('#template-modal-title').text('Edit Email Template');
        $('#template-id').val(id);
        $('#template-modal').addClass('show');
    };
    
    window.deleteTemplate = function(id) {
        if (confirm('Are you sure you want to delete this template?')) {
            $.post(appointeaseAdmin.ajaxurl, {
                action: 'delete_email_template',
                _wpnonce: appointeaseAdmin.nonce,
                id: id
            }, function(response) {
                if (response.success) {
                    showNotification('Template deleted successfully!', 'success');
                    location.reload();
                } else {
                    showNotification('Error deleting template', 'error');
                }
            });
        }
    };
    
    window.testEmail = function() {
        $.post(appointeaseAdmin.ajaxurl, {
            action: 'test_email',
            _wpnonce: appointeaseAdmin.nonce
        }, function(response) {
            if (response.success) {
                showNotification('Test email sent successfully!', 'success');
            } else {
                showNotification('Failed to send test email', 'error');
            }
        });
    };
    
    window.previewTemplate = function(id) {
        $.post(appointeaseAdmin.ajaxurl, {
            action: 'preview_email_template',
            _wpnonce: appointeaseAdmin.nonce,
            id: id
        }, function(response) {
            if (response.success) {
                const preview = window.open('', '_blank', 'width=600,height=400');
                preview.document.write('<h3>' + response.data.subject + '</h3><hr><pre>' + response.data.body + '</pre>');
            }
        });
    };
    
    // Holiday functions
    window.openHolidayModal = function() {
        $('#holiday-modal-title').text('Add Holiday');
        $('#holiday-form')[0].reset();
        $('#holiday-id').val('');
        $('#holiday-modal').addClass('show');
    };
    
    window.editHoliday = function(id) {
        $('#holiday-modal-title').text('Edit Holiday');
        $('#holiday-id').val(id);
        $('#holiday-modal').addClass('show');
    };
    
    window.deleteHoliday = function(id) {
        if (confirm('Are you sure you want to delete this holiday?')) {
            $.post(appointeaseAdmin.ajaxurl, {
                action: 'delete_holiday',
                _wpnonce: appointeaseAdmin.nonce,
                id: id
            }, function(response) {
                if (response.success) {
                    showNotification('Holiday deleted successfully!', 'success');
                    location.reload();
                } else {
                    showNotification('Error deleting holiday', 'error');
                }
            });
        }
    };
    
    $('#holiday-form').submit(function(e) {
        e.preventDefault();
        const formData = {
            action: 'save_holiday',
            _wpnonce: appointeaseAdmin.nonce,
            id: $('#holiday-id').val(),
            name: $('#holiday-name').val(),
            start_date: $('#holiday-start').val(),
            end_date: $('#holiday-end').val()
        };
        
        $.post(appointeaseAdmin.ajaxurl, formData, function(response) {
            if (response.success) {
                showNotification('Holiday saved successfully!', 'success');
                $('#holiday-modal').removeClass('show');
                location.reload();
            } else {
                showNotification('Error saving holiday', 'error');
            }
        });
    });
    
    // Export function
    window.exportAppointments = function() {
        $.post(appointeaseAdmin.ajaxurl, {
            action: 'export_appointments',
            _wpnonce: appointeaseAdmin.nonce
        }, function(response) {
            if (response.success) {
                const blob = new Blob([response.data.csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'appointments-' + new Date().toISOString().split('T')[0] + '.csv';
                a.click();
                window.URL.revokeObjectURL(url);
                showNotification('Data exported successfully!', 'success');
            } else {
                showNotification('Export failed', 'error');
            }
        });
    };
    
    // Bulk actions
    window.applyBulkAction = function() {
        const action = $('#bulk-action').val();
        const selectedIds = $('.appointment-checkbox:checked').map(function() {
            return $(this).val();
        }).get();
        
        if (!action || selectedIds.length === 0) {
            showNotification('Please select an action and appointments', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to apply this action to ' + selectedIds.length + ' appointments?')) {
            $.post(appointeaseAdmin.ajaxurl, {
                action: 'bulk_appointment_action',
                _wpnonce: appointeaseAdmin.nonce,
                bulk_action: action,
                appointment_ids: selectedIds
            }, function(response) {
                if (response.success) {
                    showNotification('Bulk action applied successfully!', 'success');
                    location.reload();
                } else {
                    showNotification('Bulk action failed', 'error');
                }
            });
        }
    };
    
    // Select all checkbox
    $('#select-all').change(function() {
        $('.appointment-checkbox').prop('checked', $(this).prop('checked'));
    });
    
    // Form submissions
    $('#category-form').submit(function(e) {
        e.preventDefault();
        const formData = {
            action: 'save_category',
            _wpnonce: appointeaseAdmin.nonce,
            id: $('#category-id').val(),
            name: $('#category-name').val(),
            description: $('#category-description').val(),
            color: $('#category-color').val()
        };
        
        $.post(appointeaseAdmin.ajaxurl, formData, function(response) {
            if (response.success) {
                showNotification('Category saved successfully!', 'success');
                $('#category-modal').removeClass('show');
                location.reload();
            } else {
                showNotification('Error saving category', 'error');
            }
        });
    });
    
    $('#customer-form').submit(function(e) {
        e.preventDefault();
        const formData = {
            action: 'save_customer',
            _wpnonce: appointeaseAdmin.nonce,
            id: $('#customer-id').val(),
            name: $('#customer-name').val(),
            email: $('#customer-email').val(),
            phone: $('#customer-phone').val(),
            notes: $('#customer-notes').val()
        };
        
        $.post(appointeaseAdmin.ajaxurl, formData, function(response) {
            if (response.success) {
                showNotification('Customer saved successfully!', 'success');
                $('#customer-modal').removeClass('show');
                location.reload();
            } else {
                showNotification('Error saving customer', 'error');
            }
        });
    });
    
    $('#template-form').submit(function(e) {
        e.preventDefault();
        const formData = {
            action: 'save_email_template',
            _wpnonce: appointeaseAdmin.nonce,
            id: $('#template-id').val(),
            name: $('#template-name').val(),
            type: $('#template-type').val(),
            subject: $('#template-subject').val(),
            body: $('#template-body').val()
        };
        
        $.post(appointeaseAdmin.ajaxurl, formData, function(response) {
            if (response.success) {
                showNotification('Template saved successfully!', 'success');
                $('#template-modal').removeClass('show');
                location.reload();
            } else {
                showNotification('Error saving template', 'error');
            }
        });
    });
    
    window.setHolidayPreset = function(name, monthDay) {
        const currentYear = new Date().getFullYear();
        const date = currentYear + '-' + monthDay;
        $('#holiday-name').val(name);
        $('#holiday-start').val(date);
        $('#holiday-end').val(date);
    };

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