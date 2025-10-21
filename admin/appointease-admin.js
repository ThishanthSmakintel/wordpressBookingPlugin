// AppointEase Admin JavaScript

// Toastr Configuration
function initToastr() {
    if (typeof toastr !== 'undefined') {
        toastr.options = {
            closeButton: true,
            debug: false,
            newestOnTop: true,
            progressBar: true,
            positionClass: 'toast-top-right',
            preventDuplicates: false,
            onclick: null,
            showDuration: '300',
            hideDuration: '1000',
            timeOut: '5000',
            extendedTimeOut: '1000',
            showEasing: 'swing',
            hideEasing: 'linear',
            showMethod: 'fadeIn',
            hideMethod: 'fadeOut'
        };
    }
}

function showSuccessToast(title, message, actions = []) {
    if (typeof toastr !== 'undefined') {
        const toast = toastr.success(message, title);
        if (actions.length > 0) {
            addToastActions(toast, actions);
        }
    }
}

function showErrorToast(title, message, actions = []) {
    if (typeof toastr !== 'undefined') {
        const toast = toastr.error(message, title);
        if (actions.length > 0) {
            addToastActions(toast, actions);
        }
    }
}

function showWarningToast(title, message, actions = []) {
    if (typeof toastr !== 'undefined') {
        const toast = toastr.warning(message, title);
        if (actions.length > 0) {
            addToastActions(toast, actions);
        }
    }
}

function addToastActions(toast, actions) {
    if (toast && actions.length > 0) {
        setTimeout(() => {
            if (toast && toast[0]) {
                const actionsDiv = jQuery('<div class="toast-actions"></div>');
                
                actions.forEach((action, index) => {
                    const btn = jQuery(`<button class="toast-action-btn ${action.type || 'secondary'}">${action.text}</button>`);
                    btn.on('click', function() {
                        if (action.callback) {
                            action.callback();
                        }
                        toastr.clear();
                    });
                    actionsDiv.append(btn);
                });
                
                jQuery(toast[0]).append(actionsDiv);
            }
        }, 100);
    }
}

jQuery(document).ready(function($) {
    initToastr();

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
                showSuccessToast('Service Saved', 'Service saved successfully!', [
                    {
                        text: 'View Services',
                        type: 'primary',
                        callback: function() { window.location.href = 'admin.php?page=appointease-services'; }
                    }
                ]);
                $('#service-modal').removeClass('show');
                location.reload();
            } else {
                showErrorToast('Save Failed', 'Error saving service', [
                    {
                        text: 'Retry',
                        type: 'primary',
                        callback: function() { $('#service-form').submit(); }
                    }
                ]);
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
                showSuccessToast('Staff Saved', 'Staff member saved successfully!', [
                    {
                        text: 'View Staff',
                        type: 'primary',
                        callback: function() { window.location.href = 'admin.php?page=appointease-staff'; }
                    }
                ]);
                $('#staff-modal').removeClass('show');
                location.reload();
            } else {
                showErrorToast('Save Failed', 'Error saving staff member', [
                    {
                        text: 'Retry',
                        type: 'primary',
                        callback: function() { $('#staff-form').submit(); }
                    }
                ]);
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
        showWarningToast('Delete Service', 'This service will be permanently deleted. This action cannot be undone.', [
            {
                text: 'Delete',
                type: 'primary',
                callback: function() {
                    $.post(appointeaseAdmin.ajaxurl, {
                        action: 'delete_service',
                        _wpnonce: appointeaseAdmin.nonce,
                        id: id
                    }, function(response) {
                        if (response.success) {
                            showSuccessToast('Service Deleted', 'Service deleted successfully!');
                            location.reload();
                        } else {
                            showErrorToast('Delete Failed', 'Error deleting service');
                        }
                    });
                }
            },
            {
                text: 'Cancel',
                type: 'secondary'
            }
        ]);
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
                    showSuccessToast('Staff Deleted', 'Staff member deleted successfully!');
                    location.reload();
                } else {
                    showErrorToast('Delete Failed', 'Error deleting staff member');
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
                showSuccessToast('Status Updated', 'Appointment status updated!');
            } else {
                showErrorToast('Update Failed', 'Error updating status');
            }
        });
    };

    // Delete Appointment
    window.deleteAppointment = function(id) {
        showWarningToast('Delete Appointment', 'This appointment will be permanently deleted. This action cannot be undone.', [
            {
                text: 'Delete',
                type: 'primary',
                callback: function() {
                    $.post(appointeaseAdmin.ajaxurl, {
                        action: 'delete_appointment',
                        _wpnonce: appointeaseAdmin.nonce,
                        id: id
                    }, function(response) {
                        if (response.success) {
                            showSuccessToast('Appointment Deleted', 'Appointment deleted successfully!');
                            location.reload();
                        } else {
                            showErrorToast('Delete Failed', 'Error deleting appointment');
                        }
                    });
                }
            },
            {
                text: 'Cancel',
                type: 'secondary'
            }
        ]);
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
                showSuccessToast('Appointment Rescheduled', 'Appointment rescheduled successfully!', [
                    {
                        text: 'View Calendar',
                        type: 'primary',
                        callback: function() { window.location.href = 'admin.php?page=appointease-calendar'; }
                    }
                ]);
                $('#reschedule-modal').removeClass('show');
                location.reload();
            } else {
                showErrorToast('Reschedule Failed', 'Error rescheduling appointment', [
                    {
                        text: 'Retry',
                        type: 'primary',
                        callback: function() { $('#reschedule-form').submit(); }
                    }
                ]);
            }
        });
    });

    // Legacy notification function for backward compatibility
    function showNotification(message, type = 'success') {
        if (typeof toastr !== 'undefined') {
            if (type === 'success') {
                toastr.success(message);
            } else {
                toastr.error(message);
            }
        }
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
                    showSuccessToast('Category Deleted', 'Category deleted successfully!');
                    location.reload();
                } else {
                    showErrorToast('Delete Failed', 'Error deleting category');
                }
            });
        }
    };
    
    // Customer functions
    window.openCustomerModal = function() {
        $('#customer-modal-title').text('Add Customer');
        $('#customer-form')[0].reset();
        $('#customer-id').val('');
        $('#customer-name').prop('disabled', false);
        $('#customer-phone').prop('disabled', false);
        $('#customer-modal').addClass('show');
    };
    
    // Check customer email on blur
    $(document).on('blur', '#customer-email', function() {
        const email = $(this).val();
        const customerId = $('#customer-id').val();
        
        if (email && !customerId) {
            $.post(appointeaseAdmin.ajaxurl, {
                action: 'check_customer_email',
                _wpnonce: appointeaseAdmin.nonce,
                email: email
            }, function(response) {
                if (response.success && response.data.exists) {
                    $('#customer-name').val(response.data.name).prop('disabled', true);
                    $('#customer-phone').val(response.data.phone).prop('disabled', true);
                    showWarningToast('Existing Customer', 'This email belongs to an existing customer. Name and phone are auto-filled.');
                } else {
                    $('#customer-name').prop('disabled', false);
                    $('#customer-phone').prop('disabled', false);
                }
            });
        }
    });
    
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
                    showSuccessToast('Customer Deleted', 'Customer deleted successfully!');
                    location.reload();
                } else {
                    showErrorToast('Delete Failed', 'Error deleting customer');
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
                    showSuccessToast('Template Deleted', 'Template deleted successfully!');
                    location.reload();
                } else {
                    showErrorToast('Delete Failed', 'Error deleting template');
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
                showSuccessToast('Email Sent', 'Test email sent successfully!');
            } else {
                showErrorToast('Email Failed', 'Failed to send test email');
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
                    showSuccessToast('Holiday Deleted', 'Holiday deleted successfully!');
                    location.reload();
                } else {
                    showErrorToast('Delete Failed', 'Error deleting holiday');
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
                showSuccessToast('Holiday Saved', 'Holiday saved successfully!');
                $('#holiday-modal').removeClass('show');
                location.reload();
            } else {
                showErrorToast('Save Failed', 'Error saving holiday');
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
                showSuccessToast('Export Complete', 'Data exported successfully!');
            } else {
                showErrorToast('Export Failed', 'Export failed');
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
            showErrorToast('Selection Required', 'Please select an action and appointments');
            return;
        }
        
        const actionText = action === 'confirm' ? 'confirm' : action === 'delete' ? 'delete' : action;
        const message = `This will ${actionText} ${selectedIds.length} appointment${selectedIds.length > 1 ? 's' : ''}. This action cannot be undone.`;
        
        showWarningToast('Confirm Bulk Action', message, [
            {
                text: 'Proceed',
                type: 'primary',
                callback: function() {
                    $.post(appointeaseAdmin.ajaxurl, {
                        action: 'bulk_appointment_action',
                        _wpnonce: appointeaseAdmin.nonce,
                        bulk_action: action,
                        appointment_ids: selectedIds
                    }, function(response) {
                        if (response.success) {
                            showSuccessToast('Bulk Action Complete', `Successfully ${actionText}ed ${selectedIds.length} appointment${selectedIds.length > 1 ? 's' : ''}!`);
                            location.reload();
                        } else {
                            showErrorToast('Bulk Action Failed', 'Failed to apply bulk action');
                        }
                    });
                }
            },
            {
                text: 'Cancel',
                type: 'secondary'
            }
        ]);
    };
    
    // Select all checkbox
    $('#select-all').change(function() {
        $('.appointment-checkbox').prop('checked', $(this).prop('checked'));
    });
    
    // Select all customers checkbox
    $(document).on('change', '#select-all-customers', function() {
        $('.customer-checkbox').prop('checked', $(this).prop('checked'));
    });
    
    // Update select-all state when individual checkboxes change
    $(document).on('change', '.customer-checkbox', function() {
        const total = $('.customer-checkbox').length;
        const checked = $('.customer-checkbox:checked').length;
        $('#select-all-customers').prop('checked', total === checked);
    });
    
    // Customer bulk actions
    window.applyCustomerBulkAction = function() {
        const action = $('#customer-bulk-action').val();
        const selectedIds = $('.customer-checkbox:checked').map(function() {
            return $(this).val();
        }).get();
        
        if (!action || selectedIds.length === 0) {
            showErrorToast('Selection Required', 'Please select an action and customers');
            return;
        }
        
        if (action === 'delete') {
            const message = `This will delete ${selectedIds.length} customer${selectedIds.length > 1 ? 's' : ''}. This action cannot be undone.`;
            
            showWarningToast('Confirm Bulk Delete', message, [
                {
                    text: 'Delete',
                    type: 'primary',
                    callback: function() {
                        $.post(appointeaseAdmin.ajaxurl, {
                            action: 'bulk_customer_action',
                            _wpnonce: appointeaseAdmin.nonce,
                            bulk_action: action,
                            customer_ids: selectedIds
                        }, function(response) {
                            if (response.success) {
                                showSuccessToast('Bulk Delete Complete', response.data.message);
                                location.reload();
                            } else {
                                showErrorToast('Bulk Delete Failed', response.data || 'Failed to delete customers');
                            }
                        });
                    }
                },
                {
                    text: 'Cancel',
                    type: 'secondary'
                }
            ]);
        } else if (action === 'export') {
            $.post(appointeaseAdmin.ajaxurl, {
                action: 'bulk_customer_action',
                _wpnonce: appointeaseAdmin.nonce,
                bulk_action: action,
                customer_ids: selectedIds
            }, function(response) {
                if (response.success) {
                    const blob = new Blob([response.data.csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'customers-' + new Date().toISOString().split('T')[0] + '.csv';
                    a.click();
                    window.URL.revokeObjectURL(url);
                    showSuccessToast('Export Complete', `${selectedIds.length} customer${selectedIds.length > 1 ? 's' : ''} exported successfully!`);
                } else {
                    showErrorToast('Export Failed', 'Failed to export customers');
                }
            });
        }
    };
    
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
                showSuccessToast('Category Saved', 'Category saved successfully!');
                $('#category-modal').removeClass('show');
                location.reload();
            } else {
                showErrorToast('Save Failed', 'Error saving category');
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
                showSuccessToast('Customer Saved', 'Customer saved successfully!');
                $('#customer-modal').removeClass('show');
                location.reload();
            } else {
                showErrorToast('Save Failed', 'Error saving customer');
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
                showSuccessToast('Template Saved', 'Template saved successfully!');
                $('#template-modal').removeClass('show');
                location.reload();
            } else {
                showErrorToast('Save Failed', 'Error saving template');
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
    
    // Sync customers from appointments
    window.syncCustomers = function() {
        if (confirm('This will sync customer data from existing appointments. Continue?')) {
            $.post(appointeaseAdmin.ajaxurl, {
                action: 'sync_customers',
                _wpnonce: appointeaseAdmin.nonce
            }, function(response) {
                if (response.success) {
                    showSuccessToast('Sync Complete', 'Customers synced successfully!', [
                        {
                            text: 'View Customers',
                            type: 'primary',
                            callback: function() { window.location.href = 'admin.php?page=appointease-customers'; }
                        }
                    ]);
                    location.reload();
                } else {
                    showErrorToast('Sync Failed', 'Error syncing customers', [
                        {
                            text: 'Retry',
                            type: 'primary',
                            callback: function() { window.syncCustomers(); }
                        }
                    ]);
                }
            });
        }
    };
    
    // Webhook functions
    window.saveWebhookUrl = function() {
        const webhookUrl = $('#webhook-url').val();
        
        if (!webhookUrl) {
            showErrorToast('URL Required', 'Please enter a webhook URL');
            return;
        }
        
        // Basic URL validation
        try {
            new URL(webhookUrl);
        } catch (e) {
            showErrorToast('Invalid URL', 'Please enter a valid URL');
            return;
        }
        
        $.ajax({
            url: '/wp-json/appointease/v1/webhook/config',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': appointeaseAdmin.nonce
            },
            data: JSON.stringify({
                webhook_url: webhookUrl
            }),
            success: function(response) {
                showSuccessToast('Webhook Saved', 'Webhook URL configured successfully!', [
                    {
                        text: 'Test Webhook',
                        type: 'primary',
                        callback: function() { testWebhook(); }
                    }
                ]);
            },
            error: function(xhr) {
                const response = xhr.responseJSON;
                showErrorToast('Save Failed', response?.message || 'Failed to save webhook URL');
            }
        });
    };
    
    window.testWebhook = function() {
        $.ajax({
            url: '/wp-json/appointease/v1/webhook/test',
            method: 'POST',
            headers: {
                'X-WP-Nonce': appointeaseAdmin.nonce
            },
            success: function(response) {
                showSuccessToast('Test Sent', 'Test webhook sent successfully! Check your endpoint for the test payload.');
            },
            error: function(xhr) {
                const response = xhr.responseJSON;
                showErrorToast('Test Failed', response?.message || 'Failed to send test webhook');
            }
        });
    };
    
    // Working days validation
    $('input[name="appointease_options[working_days][]"]').change(function() {
        const dayValue = $(this).val();
        const isChecked = $(this).prop('checked');
        const checkbox = $(this);
        
        if (!isChecked) {
            // Check if this day has appointments
            $.post(appointeaseAdmin.ajaxurl, {
                action: 'check_day_appointments',
                _wpnonce: appointeaseAdmin.nonce,
                day: dayValue
            }, function(response) {
                if (response.data && response.data.count > 0) {
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const dayName = dayNames[parseInt(dayValue)];
                    
                    // Recheck the checkbox immediately
                    checkbox.prop('checked', true);
                    
                    showWarningToast(
                        'Cannot Remove Working Day',
                        `${dayName} has ${response.data.count} existing appointments. Please cancel or reschedule them first.`,
                        [
                            {
                                text: 'View Appointments',
                                type: 'primary',
                                callback: function() { window.location.href = 'admin.php?page=appointease-appointments'; }
                            },
                            {
                                text: 'Cancel',
                                type: 'secondary'
                            }
                        ]
                    );
                }
            });
        }
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