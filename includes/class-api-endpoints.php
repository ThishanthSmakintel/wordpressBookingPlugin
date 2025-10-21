<?php

class Booking_API_Endpoints {
    
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
        add_action('rest_api_init', array($this, 'register_webhook_routes'));
    }
    
    public function register_routes() {
        // Register appointease/v1 routes - consolidated to avoid conflicts
        register_rest_route('appointease/v1', '/appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_appointment'),
            'permission_callback' => array($this, 'verify_nonce_permission')
        ));
        
        register_rest_route('appointease/v1', '/appointments/(?P<id>[a-zA-Z0-9\-]+)', array(
            array(
                'methods' => 'GET',
                'callback' => array($this, 'get_appointment'),
                'permission_callback' => array($this, 'public_permission'),
                'args' => array(
                    'id' => array(
                        'required' => true,
                        'sanitize_callback' => 'sanitize_text_field'
                    )
                )
            ),
            array(
                'methods' => 'DELETE',
                'callback' => array($this, 'cancel_appointment'),
                'permission_callback' => array($this, 'verify_nonce_permission'),
                'args' => array(
                    'id' => array(
                        'required' => true,
                        'sanitize_callback' => 'sanitize_text_field'
                    )
                )
            ),
            array(
                'methods' => 'PUT',
                'callback' => array($this, 'reschedule_appointment'),
                'permission_callback' => array($this, 'verify_nonce_permission')
            )
        ));
        
        // Keep booking/v1 routes for compatibility
        register_rest_route('booking/v1', '/services', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_services'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        register_rest_route('booking/v1', '/staff', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_staff'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        register_rest_route('booking/v1', '/availability', array(
            'methods' => 'POST',
            'callback' => array($this, 'check_availability'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        register_rest_route('booking/v1', '/check-customer/(?P<email>[^/]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'check_customer_by_email'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        // Add appointease/v1 availability route
        register_rest_route('appointease/v1', '/availability', array(
            'methods' => 'POST',
            'callback' => array($this, 'check_availability'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        // User appointments endpoint (keeping both namespaces for backward compatibility)
        register_rest_route('appointease/v1', '/user-appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'get_user_appointments'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        register_rest_route('appointease/v1', '/check-customer/(?P<email>[^/]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'check_customer_by_email'),
            'permission_callback' => '__return_true'
        ));
        
        // Backward compatibility route
        register_rest_route('booking/v1', '/user-appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'get_user_appointments'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        // Debug endpoint to see all appointments
        register_rest_route('appointease/v1', '/debug/appointments', array(
            'methods' => 'GET',
            'callback' => array($this, 'debug_appointments'),
            'permission_callback' => function() { return current_user_can('manage_options'); }
        ));
        
        // Clear all appointments endpoint for testing
        register_rest_route('appointease/v1', '/clear-appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'clear_all_appointments'),
            'permission_callback' => function() { return current_user_can('manage_options'); }
        ));
        
        // Fix existing appointments without strong_id
        register_rest_route('appointease/v1', '/fix-appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'fix_existing_appointments'),
            'permission_callback' => function() { return current_user_can('manage_options'); }
        ));
        
        // Real-time appointments endpoint
        register_rest_route('appointease/v1', '/appointments/stream', array(
            'methods' => 'GET',
            'callback' => array($this, 'stream_appointments'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        // Secure session endpoints
        register_rest_route('appointease/v1', '/session', array(
            array(
                'methods' => 'POST',
                'callback' => array($this, 'create_secure_session'),
                'permission_callback' => '__return_true'
            ),
            array(
                'methods' => 'GET',
                'callback' => array($this, 'get_secure_session'),
                'permission_callback' => '__return_true'
            ),
            array(
                'methods' => 'DELETE',
                'callback' => array($this, 'delete_secure_session'),
                'permission_callback' => '__return_true'
            )
        ));
        
        // OTP verification endpoint
        register_rest_route('appointease/v1', '/verify-otp', array(
            'methods' => 'POST',
            'callback' => array($this, 'verify_otp_and_create_session'),
            'permission_callback' => '__return_true'
        ));
        
        // Debug working days endpoint
        register_rest_route('appointease/v1', '/debug/working-days', array(
            'methods' => 'GET',
            'callback' => array($this, 'debug_working_days'),
            'permission_callback' => function() { return current_user_can('manage_options'); }
        ));
        
        // Fix working days endpoint
        register_rest_route('appointease/v1', '/fix-working-days', array(
            'methods' => 'POST',
            'callback' => array($this, 'fix_working_days'),
            'permission_callback' => function() { return current_user_can('manage_options'); }
        ));
        
        // Server date endpoint for time sync
        register_rest_route('appointease/v1', '/server-date', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_server_date'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        // Time slots endpoint
        register_rest_route('appointease/v1', '/time-slots', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_time_slots'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        // Business hours endpoint
        register_rest_route('appointease/v1', '/business-hours', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_business_hours'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        // Check specific slot booking status
        register_rest_route('appointease/v1', '/check-slot', array(
            'methods' => 'POST',
            'callback' => array($this, 'check_slot_booking'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        // Reschedule availability check (excludes current appointment)
        register_rest_route('appointease/v1', '/reschedule-availability', array(
            'methods' => 'POST',
            'callback' => array($this, 'check_reschedule_availability'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        // Settings endpoint for dynamic configuration
        register_rest_route('appointease/v1', '/settings', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_settings'),
            'permission_callback' => '__return_true'
        ));
        
        // Backup settings endpoint with different namespace for compatibility
        register_rest_route('booking/v1', '/settings', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_settings'),
            'permission_callback' => '__return_true'
        ));
        
        // Admin calendar endpoints
        register_rest_route('appointease/v1', '/admin/appointments', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_admin_appointments'),
            'permission_callback' => function() { return current_user_can('manage_options'); }
        ));
        
        register_rest_route('appointease/v1', '/admin/appointments/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_admin_appointment'),
            'permission_callback' => function() { return current_user_can('manage_options'); }
        ));
    }
    
    public function get_services() {
        global $wpdb;
        $table = $wpdb->prefix . 'appointease_services';
        $services = $wpdb->get_results("SELECT * FROM {$table} ORDER BY name");
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
        }
        
        return rest_ensure_response($services);
    }
    
    public function get_staff() {
        global $wpdb;
        $table = $wpdb->prefix . 'appointease_staff';
        $staff = $wpdb->get_results("SELECT * FROM {$table} ORDER BY name");
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
        }
        
        return rest_ensure_response($staff);
    }
    
    public function check_availability($request) {
        global $wpdb;
        $params = $request->get_json_params();
        
        if (!isset($params['date'], $params['employee_id'])) {
            return new WP_Error('missing_params', 'Date and employee ID are required', array('status' => 400));
        }
        
        $date = sanitize_text_field($params['date']);
        $employee_id = intval($params['employee_id']);
        
        // Validate date format and ensure it's a valid date
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return new WP_Error('invalid_date', 'Invalid date format', array('status' => 400));
        }
        
        $date_parts = explode('-', $date);
        if (!checkdate($date_parts[1], $date_parts[2], $date_parts[0])) {
            return new WP_Error('invalid_date', 'Invalid date', array('status' => 400));
        }
        
        if ($employee_id <= 0) {
            return new WP_Error('invalid_employee', 'Invalid employee ID', array('status' => 400));
        }
        
        // Load options at the beginning
        $options = get_option('appointease_options', array());
        $unavailable_times = array();
        
        // Check if date is in the past
        $today = date('Y-m-d');
        if ($date < $today) {
            return rest_ensure_response(array('unavailable' => 'all', 'reason' => 'past_date'));
        }
        
        // Check if date is too far in advance
        $advance_booking_days = isset($options['advance_booking']) ? intval($options['advance_booking']) : intval(get_option('appointease_advance_booking_days', 30));
        $max_date = strtotime("+{$advance_booking_days} days");
        if (strtotime($date) > $max_date) {
            return rest_ensure_response(array('unavailable' => 'all', 'reason' => 'too_far_advance'));
        }
        
        // Check working days - get from database with proper fallback
        $working_days = get_option('appointease_working_days', ['1','2','3','4','5']);
        if (isset($options['working_days'])) {
            if (is_array($options['working_days']) && !empty($options['working_days'])) {
                $working_days = $options['working_days'];
            } elseif (is_string($options['working_days']) && !empty($options['working_days'])) {
                // Handle comma-separated string
                $working_days = explode(',', $options['working_days']);
                $working_days = array_map('trim', $working_days);
            }
        }
        $day_of_week = date('w', strtotime($date)); // 0 = Sunday, 1 = Monday, etc.
        
        if (!in_array((string)$day_of_week, $working_days)) {
            return rest_ensure_response(array('unavailable' => 'all', 'reason' => 'non_working_day'));
        }
        
        // Check blackout dates
        $blackout_table = $wpdb->prefix . 'appointease_blackout_dates';
        $blackout_count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$blackout_table} WHERE %s BETWEEN start_date AND end_date",
            $date
        ));
        
        if ($blackout_count > 0) {
            return rest_ensure_response(array('unavailable' => 'all', 'reason' => 'blackout_date'));
        }
        
        // Check existing appointments for this staff member on this date
        $appointments_table = $wpdb->prefix . 'appointments';
        
        // Build query with optional exclusion for rescheduling
        $exclude_appointment_id = isset($params['exclude_appointment_id']) ? sanitize_text_field($params['exclude_appointment_id']) : null;
        
        if ($exclude_appointment_id) {
            // Exclude current appointment when rescheduling
            if (strpos($exclude_appointment_id, 'APT-') === 0) {
                $booked_appointments = $wpdb->get_results($wpdb->prepare(
                    "SELECT TIME_FORMAT(appointment_date, '%%H:%%i') as time_slot, name, email, status, strong_id, id, appointment_date FROM {$appointments_table} WHERE employee_id = %d AND DATE(appointment_date) = %s AND status IN ('confirmed', 'created') AND strong_id != %s",
                    $employee_id, $date, $exclude_appointment_id
                ));
            } else {
                $booked_appointments = $wpdb->get_results($wpdb->prepare(
                    "SELECT TIME_FORMAT(appointment_date, '%%H:%%i') as time_slot, name, email, status, strong_id, id, appointment_date FROM {$appointments_table} WHERE employee_id = %d AND DATE(appointment_date) = %s AND status IN ('confirmed', 'created') AND id != %d",
                    $employee_id, $date, intval($exclude_appointment_id)
                ));
            }
        } else {
            $booked_appointments = $wpdb->get_results($wpdb->prepare(
                "SELECT TIME_FORMAT(appointment_date, '%%H:%%i') as time_slot, name, email, status, strong_id, id, appointment_date FROM {$appointments_table} WHERE employee_id = %d AND DATE(appointment_date) = %s AND status IN ('confirmed', 'created')",
                $employee_id, $date
            ));
        }
        
        $booked_times = array();
        $booking_details = array();
        
        foreach ($booked_appointments as $appointment) {
            $time_slot = $appointment->time_slot;
            $booked_times[] = $time_slot;
            $booking_details[$time_slot] = array(
                'customer_name' => $appointment->name,
                'customer_email' => $appointment->email,
                'status' => $appointment->status,
                'booking_id' => $appointment->strong_id ?: $appointment->id,
                'booked_at' => $time_slot
            );
        }
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
        }
        
        return rest_ensure_response(array(
            'unavailable' => $booked_times,
            'booking_details' => $booking_details
        ));
    }
    
    public function create_appointment($request) {
        global $wpdb;
        $params = $request->get_json_params();
        
        if (!isset($params['name'], $params['email'], $params['date'])) {
            return new WP_Error('missing_fields', 'Required fields missing', array('status' => 400));
        }
        
        $name = sanitize_text_field($params['name']);
        $email = sanitize_email($params['email']);
        $phone = sanitize_text_field($params['phone'] ?? '');
        $date = sanitize_text_field($params['date']);
        $service_id = intval($params['service_id'] ?? 1);
        $employee_id = intval($params['employee_id'] ?? 1);
        
        // Validate required fields
        if (empty($name) || empty($email) || empty($date)) {
            return new WP_Error('invalid_data', 'Name, email and date are required', array('status' => 400));
        }
        
        // Validate name length and characters
        if (strlen($name) > 100 || !preg_match('/^[a-zA-Z\s\-\.]+$/', $name)) {
            return new WP_Error('invalid_name', 'Invalid name format', array('status' => 400));
        }
        
        // Validate email format
        if (!is_email($email) || strlen($email) > 100) {
            return new WP_Error('invalid_email', 'Invalid email format', array('status' => 400));
        }
        
        // Validate phone if provided
        if (!empty($phone)) {
            $phone_clean = preg_replace('/[^0-9]/', '', $phone);
            if (strlen($phone_clean) < 10 || strlen($phone_clean) > 15) {
                return new WP_Error('invalid_phone', 'Phone must be 10-15 digits', array('status' => 400));
            }
            if (!preg_match('/^[\d\s\-\+\(\)]+$/', $phone)) {
                return new WP_Error('invalid_phone', 'Invalid phone format', array('status' => 400));
            }
        }
        
        // Validate IDs
        if ($service_id <= 0 || $employee_id <= 0) {
            return new WP_Error('invalid_ids', 'Invalid service or employee ID', array('status' => 400));
        }
        
        // Validate date format and ensure it's in the future
        $appointment_time = strtotime($date);
        if ($appointment_time === false || $appointment_time <= time()) {
            return new WP_Error('invalid_date', 'Invalid date or date must be in the future', array('status' => 400));
        }
        
        $table = $wpdb->prefix . 'appointments';
        
        // Insert without strong_id first
        $result = $wpdb->insert($table, array(
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'appointment_date' => $date,
            'status' => 'confirmed',
            'service_id' => $service_id,
            'employee_id' => $employee_id
        ), array('%s', '%s', '%s', '%s', '%s', '%d', '%d'));
        
        if ($result) {
            $appointment_id = $wpdb->insert_id;
            
            // Generate strong_id using the actual database ID
            $strong_id = sprintf('APT-%d-%06d', date('Y'), $appointment_id);
            
            // Update the record with strong_id
            $update_result = $wpdb->update(
                $table,
                array('strong_id' => $strong_id),
                array('id' => $appointment_id),
                array('%s'),
                array('%d')
            );
            
            if ($update_result === false) {
                return new WP_Error('update_failed', 'Failed to generate appointment ID', array('status' => 500));
            }
            
            // Trigger webhook for new appointment
            $this->trigger_appointment_webhook($appointment_id, $strong_id, array(
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'appointment_date' => $date,
                'service_id' => $service_id,
                'employee_id' => $employee_id
            ));
            
            return rest_ensure_response(array(
                'id' => $appointment_id, 
                'strong_id' => $strong_id,
                'message' => 'Appointment booked successfully!'
            ));
        }
        
        return new WP_Error('booking_failed', 'Failed to create appointment', array('status' => 500));
    }
    

    
    public function get_appointment($request) {
        global $wpdb;
        $id = $request['id'];
        $table = $wpdb->prefix . 'appointments';
        
        $appointment = $this->find_appointment_by_id($id);
        
        if ($appointment) {
            return rest_ensure_response($appointment);
        }
        
        return new WP_Error('not_found', 'Appointment not found', array('status' => 404));
    }
    
    public function cancel_appointment($request) {
        global $wpdb;
        $id = sanitize_text_field($request['id']);
        
        if (empty($id)) {
            return new WP_Error('missing_id', 'Appointment ID is required', array('status' => 400));
        }
        
        // Check if appointment exists first
        $appointment = $this->find_appointment_by_id($id);
        if (!$appointment) {
            return new WP_Error('not_found', 'Appointment not found', array('status' => 404));
        }
        
        $table = $wpdb->prefix . 'appointments';
        $where_clause = $this->get_where_clause_for_id($id);
        
        $result = $wpdb->update($table, 
            array('status' => 'cancelled'),
            $where_clause['where'],
            array('%s'),
            $where_clause['format']
        );
        
        if ($result === false) {
            return new WP_Error('update_failed', 'Database error occurred', array('status' => 500));
        }
        
        if ($result === 0) {
            return new WP_Error('no_changes', 'No appointment was updated', array('status' => 404));
        }
        
        return rest_ensure_response(array('success' => true));
    }
    
    public function reschedule_appointment($request) {
        global $wpdb;
        $id = sanitize_text_field($request['id']);
        $params = $request->get_json_params();
        
        if (empty($id) || !isset($params['new_date'])) {
            return new WP_Error('missing_params', 'ID and new date are required', array('status' => 400));
        }
        
        $new_date = sanitize_text_field($params['new_date']);
        
        // Validate date format and ensure it's in the future
        $appointment_time = strtotime($new_date);
        if ($appointment_time === false || $appointment_time <= time()) {
            return new WP_Error('invalid_date', 'Invalid date or date must be in the future', array('status' => 400));
        }
        
        // Check if appointment exists first
        $appointment = $this->find_appointment_by_id($id);
        if (!$appointment) {
            return new WP_Error('not_found', 'Appointment not found', array('status' => 404));
        }
        
        $table = $wpdb->prefix . 'appointments';
        $where_clause = $this->get_where_clause_for_id($id);
        
        $result = $wpdb->update($table, 
            array('appointment_date' => $new_date),
            $where_clause['where'],
            array('%s'),
            $where_clause['format']
        );
        
        if ($result === false) {
            return new WP_Error('update_failed', 'Database error occurred', array('status' => 500));
        }
        
        if ($result === 0) {
            return new WP_Error('no_changes', 'No appointment was updated', array('status' => 404));
        }
        
        return rest_ensure_response(array('success' => true));
    }
    
    public function get_user_appointments($request) {
        global $wpdb;
        $params = $request->get_json_params();
        
        if (!isset($params['email'])) {
            return new WP_Error('missing_email', 'Email is required', array('status' => 400));
        }
        
        $email = sanitize_email($params['email']);
        
        if (empty($email) || !is_email($email)) {
            return new WP_Error('invalid_email', 'Valid email is required', array('status' => 400));
        }
        
        $table = $wpdb->prefix . 'appointments';
        $email_prefix = explode('@', $email)[0];
        
        // Create flexible search patterns with proper escaping
        $base_name = str_replace('.', '', $email_prefix);
        $pattern1 = '%' . $wpdb->esc_like($email_prefix) . '%';
        $pattern2 = '%' . $wpdb->esc_like($base_name) . '%';
        $pattern3 = '%' . $wpdb->esc_like(str_replace('a', 's', $base_name)) . '%';
        
        $query = $wpdb->prepare(
            "SELECT * FROM {$table} WHERE email = %s OR name LIKE %s OR name LIKE %s OR name LIKE %s ORDER BY appointment_date DESC",
            $email, $pattern1, $pattern2, $pattern3
        );
        
        $appointments = $wpdb->get_results($query);
        
        return rest_ensure_response($appointments);
    }
    
    public function check_customer_by_email($request) {
        global $wpdb;
        
        $email = $request->get_param('email');
        if (!$email) {
            return new WP_Error('missing_email', 'Email is required', array('status' => 400));
        }
        
        $email = sanitize_email(urldecode($email));
        
        if (empty($email) || !is_email($email)) {
            return new WP_Error('invalid_email', 'Valid email is required', array('status' => 400));
        }
        
        // Check in customers table first
        $customer = $wpdb->get_row($wpdb->prepare(
            "SELECT name, phone FROM {$wpdb->prefix}appointease_customers WHERE email = %s",
            $email
        ));
        
        if ($customer) {
            return rest_ensure_response(array(
                'exists' => true,
                'name' => $customer->name,
                'phone' => $customer->phone
            ));
        }
        
        // Check in appointments table as fallback
        $appointment = $wpdb->get_row($wpdb->prepare(
            "SELECT name, phone FROM {$wpdb->prefix}appointments WHERE email = %s ORDER BY id DESC LIMIT 1",
            $email
        ));
        
        if ($appointment) {
            return rest_ensure_response(array(
                'exists' => true,
                'name' => $appointment->name,
                'phone' => $appointment->phone
            ));
        }
        
        return rest_ensure_response(array('exists' => false));
    }
    
    public function public_permission($request) {
        return true;
    }
    
    public function verify_nonce_permission($request) {
        $nonce = $request->get_header('X-WP-Nonce');
        if (!$nonce) {
            $nonce = $request->get_param('_wpnonce');
        }
        return wp_verify_nonce($nonce, 'wp_rest');
    }
    
    public function appointment_permission($request) {
        return true; // Allow public access for appointment management
    }
    
    private function find_appointment_by_id($id) {
        global $wpdb;
        $table = $wpdb->prefix . 'appointments';
        
        if (strpos($id, 'APT-') === 0) {
            // Try to find by strong_id first
            $appointment = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$table} WHERE strong_id = %s", $id
            ));
            
            // If not found by strong_id, try to find by numeric part
            if (!$appointment && preg_match('/APT-\d{4}-(\d+)/', $id, $matches)) {
                $numeric_id = intval($matches[1]);
                $appointment = $wpdb->get_row($wpdb->prepare(
                    "SELECT * FROM {$table} WHERE id = %d", $numeric_id
                ));
            }
        } else {
            // Direct numeric ID search
            $appointment = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$table} WHERE id = %d", intval($id)
            ));
        }
        
        return $appointment;
    }
    
    private function get_where_clause_for_id($id) {
        if (strpos($id, 'APT-') === 0) {
            return array(
                'where' => array('strong_id' => $id),
                'format' => array('%s')
            );
        } else {
            return array(
                'where' => array('id' => intval($id)),
                'format' => array('%d')
            );
        }
    }
    
    public function debug_appointments($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'appointments';
        
        // Get all appointments with full details
        $appointments = $wpdb->get_results(
            "SELECT * FROM {$table} ORDER BY appointment_date DESC"
        );
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
        }
        
        // Get counts by status
        $status_counts = $wpdb->get_results(
            "SELECT status, COUNT(*) as count FROM {$table} GROUP BY status"
        );
        
        // Get appointments by employee
        $employee_counts = $wpdb->get_results(
            "SELECT employee_id, COUNT(*) as count FROM {$table} GROUP BY employee_id"
        );
        
        // Get recent appointments (last 7 days)
        $recent_appointments = $wpdb->get_results(
            "SELECT * FROM {$table} WHERE appointment_date >= DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY appointment_date DESC"
        );
        
        // Get upcoming appointments (next 30 days)
        $upcoming_appointments = $wpdb->get_results(
            "SELECT * FROM {$table} WHERE appointment_date >= NOW() AND appointment_date <= DATE_ADD(NOW(), INTERVAL 30 DAY) ORDER BY appointment_date ASC"
        );
        
        $total_count = $wpdb->get_var("SELECT COUNT(*) FROM {$table}");
        $null_strong_ids = $wpdb->get_var("SELECT COUNT(*) FROM {$table} WHERE strong_id IS NULL OR strong_id = ''");
        
        return rest_ensure_response(array(
            'table_name' => $table,
            'server_time' => date('Y-m-d H:i:s'),
            'total_count' => intval($total_count),
            'null_strong_ids' => intval($null_strong_ids),
            'status_counts' => $status_counts,
            'employee_counts' => $employee_counts,
            'all_appointments' => $appointments,
            'recent_appointments' => $recent_appointments,
            'upcoming_appointments' => $upcoming_appointments,
            'database_info' => array(
                'table_exists' => $wpdb->get_var("SHOW TABLES LIKE '{$table}'") === $table,
                'table_structure' => $wpdb->get_results("DESCRIBE {$table}")
            )
        ));
    }
    
    public function fix_existing_appointments($request) {
        // Restrict to admin users only
        if (!current_user_can('manage_options')) {
            return new WP_Error('forbidden', 'Access denied', array('status' => 403));
        }
        
        global $wpdb;
        $table = $wpdb->prefix . 'appointments';
        
        // Process in batches to avoid memory issues
        $batch_size = 100;
        $offset = 0;
        $fixed_count = 0;
        
        do {
            $appointments = $wpdb->get_results($wpdb->prepare(
                "SELECT id FROM {$table} WHERE strong_id IS NULL OR strong_id = '' LIMIT %d OFFSET %d",
                $batch_size, $offset
            ));
            
            if ($wpdb->last_error) {
                return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
            }
            
            foreach ($appointments as $appointment) {
                $strong_id = sprintf('APT-%d-%06d', date('Y'), $appointment->id);
                $result = $wpdb->update(
                    $table,
                    array('strong_id' => $strong_id),
                    array('id' => $appointment->id),
                    array('%s'),
                    array('%d')
                );
                if ($result) $fixed_count++;
            }
            
            $offset += $batch_size;
        } while (count($appointments) === $batch_size);
        
        return rest_ensure_response(array(
            'message' => "Fixed {$fixed_count} appointments",
            'fixed_count' => $fixed_count
        ));
    }
    
    public function stream_appointments($request) {
        $email = sanitize_email($request->get_param('email'));
        
        if (empty($email)) {
            return new WP_Error('missing_email', 'Email parameter is required', array('status' => 400));
        }
        
        global $wpdb;
        $table = $wpdb->prefix . 'appointments';
        
        $appointments = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$table} WHERE email = %s ORDER BY appointment_date DESC",
            $email
        ));
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
        }
        
        $formatted_appointments = array();
        foreach ($appointments as $apt) {
            $formatted_appointments[] = array(
                'id' => $apt->strong_id ?: 'AE' . str_pad($apt->id, 6, '0', STR_PAD_LEFT),
                'service' => 'Service',
                'staff' => 'Staff Member', 
                'date' => $apt->appointment_date,
                'status' => $apt->status,
                'name' => $apt->name,
                'email' => $apt->email,
                'last_updated' => current_time('timestamp')
            );
        }
        
        return rest_ensure_response(array(
            'appointments' => $formatted_appointments,
            'timestamp' => current_time('timestamp'),
            'count' => count($formatted_appointments)
        ));
    }
    
    public function verify_otp_and_create_session($request) {
        $params = $request->get_json_params();
        
        if (!isset($params['email'], $params['otp'])) {
            return new WP_Error('missing_params', 'Email and OTP are required', array('status' => 400));
        }
        
        $email = sanitize_email($params['email']);
        $otp = sanitize_text_field($params['otp']);
        
        // Get valid OTP from settings or use default for demo
        $valid_otp = get_option('appointease_demo_otp', '123456');
        if ($otp !== $valid_otp) {
            return new WP_Error('invalid_otp', 'Invalid OTP code', array('status' => 400));
        }
        
        $session_manager = BookingSessionManager::getInstance();
        $session = $session_manager->createSession($email);
        
        if (!$session) {
            return new WP_Error('session_failed', 'Failed to create session', array('status' => 500));
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'token' => $session['token'],
            'expires_in' => $session['expires_in']
        ));
    }
    
    public function create_secure_session($request) {
        $params = $request->get_json_params();
        
        if (!isset($params['email'])) {
            return new WP_Error('missing_email', 'Email is required', array('status' => 400));
        }
        
        $email = sanitize_email($params['email']);
        $session_manager = BookingSessionManager::getInstance();
        $session = $session_manager->createSession($email);
        
        if (!$session) {
            return new WP_Error('session_failed', 'Failed to create session', array('status' => 500));
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'token' => $session['token'],
            'expires_in' => $session['expires_in']
        ));
    }
    
    public function get_secure_session($request) {
        $session_manager = BookingSessionManager::getInstance();
        $user = $session_manager->validateSession();
        
        if (!$user) {
            return rest_ensure_response(array('email' => null));
        }
        
        return rest_ensure_response(array('email' => $user->user_email));
    }
    
    public function delete_secure_session($request) {
        $session_manager = BookingSessionManager::getInstance();
        $session_manager->clearSession();
        
        return rest_ensure_response(array('success' => true));
    }
    
    public function clear_all_appointments($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'appointments';
        
        $result = $wpdb->query("TRUNCATE TABLE {$table}");
        
        if ($result === false) {
            return new WP_Error('clear_failed', 'Failed to clear appointments', array('status' => 500));
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'message' => 'All appointments cleared successfully'
        ));
    }
    
    public function debug_working_days($request) {
        $options = get_option('appointease_options', array());
        $working_days = isset($options['working_days']) && is_array($options['working_days']) && !empty($options['working_days']) 
            ? $options['working_days'] 
            : ['1','2','3','4','5']; // Default: Monday-Friday
        
        return rest_ensure_response(array(
            'working_days' => $working_days,
            'all_options' => $options,
            'server_date' => date('Y-m-d'),
            'server_time' => date('Y-m-d H:i:s'),
            'timezone' => date_default_timezone_get(),
            'day_names' => array(
                '0' => 'Sunday',
                '1' => 'Monday', 
                '2' => 'Tuesday',
                '3' => 'Wednesday',
                '4' => 'Thursday',
                '5' => 'Friday',
                '6' => 'Saturday'
            )
        ));
    }
    
    public function fix_working_days($request) {
        $options = get_option('appointease_options', array());
        $options['working_days'] = ['1','2','3','4','5']; // Monday-Friday only
        $result = update_option('appointease_options', $options);
        
        // Clear any caches
        wp_cache_delete('appointease_options', 'options');
        
        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Working days fixed to Monday-Friday only',
            'working_days' => $options['working_days'],
            'update_result' => $result
        ));
    }
    
    public function get_server_date($request) {
        return rest_ensure_response(array(
            'server_date' => date('Y-m-d'),
            'server_time' => date('Y-m-d H:i:s'),
            'server_timestamp' => time(),
            'timezone' => date_default_timezone_get(),
            'utc_offset' => date('P')
        ));
    }
    
    public function get_time_slots($request) {
        $options = get_option('appointease_options', array());
        
        $start_time = isset($options['start_time']) ? $options['start_time'] : get_option('appointease_start_time', '09:00');
        $end_time = isset($options['end_time']) ? $options['end_time'] : get_option('appointease_end_time', '17:00');
        $slot_duration = isset($options['slot_duration']) ? intval($options['slot_duration']) : intval(get_option('appointease_slot_duration', 60));
        
        $time_slots = $this->generate_time_slots($start_time, $end_time, $slot_duration);
            
        return rest_ensure_response(array(
            'time_slots' => $time_slots,
            'slot_duration' => $slot_duration
        ));
    }
    
    public function get_business_hours($request) {
        $options = get_option('appointease_options', array());
        
        return rest_ensure_response(array(
            'working_days' => isset($options['working_days']) && !empty($options['working_days']) 
                ? $options['working_days'] 
                : get_option('appointease_working_days', array('1','2','3','4','5')),
            'start_time' => isset($options['start_time']) ? $options['start_time'] : get_option('appointease_start_time', '09:00'),
            'end_time' => isset($options['end_time']) ? $options['end_time'] : get_option('appointease_end_time', '17:00'),
            'lunch_start' => isset($options['lunch_start']) ? $options['lunch_start'] : get_option('appointease_lunch_start', '12:00'),
            'lunch_end' => isset($options['lunch_end']) ? $options['lunch_end'] : get_option('appointease_lunch_end', '14:00')
        ));
    }
    
    public function check_slot_booking($request) {
        global $wpdb;
        $params = $request->get_json_params();
        
        if (!isset($params['date'], $params['time'], $params['employee_id'])) {
            return new WP_Error('missing_params', 'Date, time and employee ID are required', array('status' => 400));
        }
        
        $date = sanitize_text_field($params['date']);
        $time = sanitize_text_field($params['time']);
        $employee_id = intval($params['employee_id']);
        
        $datetime = $date . ' ' . $time . ':00';
        
        $appointments_table = $wpdb->prefix . 'appointments';
        $booking = $wpdb->get_row($wpdb->prepare(
            "SELECT id, strong_id, name, email, status FROM {$appointments_table} WHERE employee_id = %d AND appointment_date = %s",
            $employee_id, $datetime
        ));
        
        if ($booking) {
            return rest_ensure_response(array(
                'is_booked' => true,
                'booking_details' => array(
                    'id' => $booking->strong_id ?: $booking->id,
                    'customer' => $booking->name,
                    'email' => $booking->email,
                    'status' => $booking->status
                )
            ));
        }
        
        return rest_ensure_response(array(
            'is_booked' => false,
            'message' => 'Time slot is available'
        ));
    }
    
    public function get_settings($request) {
        error_log('[AppointEase] get_settings called');
        error_log('[AppointEase] Request method: ' . $request->get_method());
        error_log('[AppointEase] Request route: ' . $request->get_route());
        
        $options = get_option('appointease_options', array());
        error_log('[AppointEase] Options: ' . print_r($options, true));
        
        // Generate time slots based on settings
        $start_time = isset($options['start_time']) ? $options['start_time'] : get_option('appointease_start_time', '09:00');
        $end_time = isset($options['end_time']) ? $options['end_time'] : get_option('appointease_end_time', '17:00');
        $slot_duration = isset($options['slot_duration']) ? intval($options['slot_duration']) : intval(get_option('appointease_slot_duration', 60));
        
        error_log('[AppointEase] Time settings: start=' . $start_time . ', end=' . $end_time . ', duration=' . $slot_duration);
        
        $time_slots = $this->generate_time_slots($start_time, $end_time, $slot_duration);
        error_log('[AppointEase] Generated slots: ' . print_r($time_slots, true));
        
        $response = array(
            'business_hours' => array(
                'start' => $start_time,
                'end' => $end_time
            ),
            'working_days' => isset($options['working_days']) && !empty($options['working_days']) 
                ? $options['working_days'] 
                : get_option('appointease_working_days', array('1','2','3','4','5')),
            'time_slots' => $time_slots,
            'slot_duration' => $slot_duration
        );
        
        error_log('[AppointEase] Final response: ' . print_r($response, true));
        return rest_ensure_response($response);
    }
    
    private function generate_time_slots($start_time, $end_time, $duration_minutes) {
        $slots = array();
        $start = strtotime($start_time);
        $end = strtotime($end_time);
        
        for ($time = $start; $time < $end; $time += ($duration_minutes * 60)) {
            $slots[] = date('H:i', $time);
        }
        
        return $slots;
    }
    
    public function get_admin_appointments($request) {
        global $wpdb;
        
        $start_date = $request->get_param('start');
        $end_date = $request->get_param('end');
        
        $where_clause = '';
        $params = array();
        
        if ($start_date && $end_date) {
            $where_clause = 'WHERE appointment_date BETWEEN %s AND %s';
            $params = array($start_date, $end_date);
        }
        
        $query = "SELECT a.*, s.name as service_name, st.name as staff_name 
                  FROM {$wpdb->prefix}appointments a 
                  LEFT JOIN {$wpdb->prefix}appointease_services s ON a.service_id = s.id 
                  LEFT JOIN {$wpdb->prefix}appointease_staff st ON a.employee_id = st.id 
                  {$where_clause} 
                  ORDER BY a.appointment_date ASC";
        
        if (!empty($params)) {
            $appointments = $wpdb->get_results($wpdb->prepare($query, $params));
        } else {
            $appointments = $wpdb->get_results($query);
        }
        
        $events = array();
        foreach ($appointments as $appointment) {
            $events[] = array(
                'id' => $appointment->id,
                'title' => $appointment->name . ' - ' . ($appointment->service_name ?: 'Service'),
                'start' => $appointment->appointment_date,
                'end' => date('Y-m-d H:i:s', strtotime($appointment->appointment_date . ' +1 hour')),
                'status' => $appointment->status,
                'customer' => $appointment->name,
                'email' => $appointment->email,
                'phone' => $appointment->phone,
                'service' => $appointment->service_name ?: 'Service',
                'staff' => $appointment->staff_name ?: 'Staff'
            );
        }
        
        return rest_ensure_response($events);
    }
    
    public function update_admin_appointment($request) {
        global $wpdb;
        
        $id = intval($request['id']);
        $params = $request->get_json_params();
        
        if (!$id) {
            return new WP_Error('invalid_id', 'Invalid appointment ID', array('status' => 400));
        }
        
        $update_data = array();
        $update_format = array();
        
        if (isset($params['appointment_date'])) {
            $update_data['appointment_date'] = sanitize_text_field($params['appointment_date']);
            $update_format[] = '%s';
        }
        
        if (isset($params['status'])) {
            $status = sanitize_text_field($params['status']);
            if (in_array($status, ['confirmed', 'cancelled', 'pending'])) {
                $update_data['status'] = $status;
                $update_format[] = '%s';
            }
        }
        
        if (empty($update_data)) {
            return new WP_Error('no_data', 'No valid data to update', array('status' => 400));
        }
        
        $result = $wpdb->update(
            $wpdb->prefix . 'appointments',
            $update_data,
            array('id' => $id),
            $update_format,
            array('%d')
        );
        
        if ($result === false) {
            return new WP_Error('update_failed', 'Failed to update appointment', array('status' => 500));
        }
        
        return rest_ensure_response(array('success' => true, 'updated' => $result));
    }
    
    /**
     * Trigger webhook when new appointment is created
     */
    private function trigger_appointment_webhook($appointment_id, $strong_id, $appointment_data) {
        // Get service and staff details
        global $wpdb;
        
        $service = $wpdb->get_row($wpdb->prepare(
            "SELECT name FROM {$wpdb->prefix}appointease_services WHERE id = %d",
            $appointment_data['service_id']
        ));
        
        $staff = $wpdb->get_row($wpdb->prepare(
            "SELECT name, email FROM {$wpdb->prefix}appointease_staff WHERE id = %d",
            $appointment_data['employee_id']
        ));
        
        // Prepare webhook payload
        $webhook_data = array(
            'event' => 'appointment.created',
            'appointment_id' => $strong_id,
            'customer' => array(
                'name' => $appointment_data['name'],
                'email' => $appointment_data['email'],
                'phone' => $appointment_data['phone']
            ),
            'appointment' => array(
                'date' => $appointment_data['appointment_date'],
                'service' => $service ? $service->name : 'Unknown Service',
                'staff' => $staff ? $staff->name : 'Unknown Staff'
            ),
            'timestamp' => current_time('mysql')
        );
        
        // Send admin email notification
        $this->send_admin_notification($webhook_data);
        
        // Add to notification queue for admin panel
        $this->add_to_notification_queue($webhook_data);
        
        // Trigger WordPress action hook for custom integrations
        do_action('appointease_new_appointment', $webhook_data);
        
        // Send to external webhook URL if configured
        $webhook_url = get_option('appointease_webhook_url');
        if (!empty($webhook_url)) {
            $this->send_webhook($webhook_url, $webhook_data);
        }
    }
    
    /**
     * Send admin email notification
     */
    private function send_admin_notification($data) {
        $admin_email = get_option('admin_email');
        $site_name = get_bloginfo('name');
        
        $subject = sprintf('[%s] New Appointment Booked - %s', $site_name, $data['appointment_id']);
        
        $message = sprintf(
            "New appointment has been booked:\n\n" .
            "Appointment ID: %s\n" .
            "Customer: %s\n" .
            "Email: %s\n" .
            "Phone: %s\n" .
            "Service: %s\n" .
            "Staff: %s\n" .
            "Date & Time: %s\n\n" .
            "View all appointments: %s",
            $data['appointment_id'],
            $data['customer']['name'],
            $data['customer']['email'],
            $data['customer']['phone'],
            $data['appointment']['service'],
            $data['appointment']['staff'],
            date('F j, Y \\a\\t g:i A', strtotime($data['appointment']['date'])),
            admin_url('admin.php?page=appointease-admin')
        );
        
        wp_mail($admin_email, $subject, $message);
    }
    
    /**
     * Send webhook to external URL
     */
    private function send_webhook($url, $data) {
        wp_remote_post($url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-Webhook-Source' => 'AppointEase'
            ),
            'body' => json_encode($data),
            'timeout' => 15
        ));
    }
    
    /**
     * Register webhook URL endpoint
     */
    public function register_webhook_routes() {
        register_rest_route('appointease/v1', '/webhook/config', array(
            'methods' => 'POST',
            'callback' => array($this, 'configure_webhook'),
            'permission_callback' => function() { return current_user_can('manage_options'); }
        ));
        
        register_rest_route('appointease/v1', '/webhook/test', array(
            'methods' => 'POST',
            'callback' => array($this, 'test_webhook'),
            'permission_callback' => function() { return current_user_can('manage_options'); }
        ));
    }
    
    public function configure_webhook($request) {
        $params = $request->get_json_params();
        
        if (!isset($params['webhook_url'])) {
            return new WP_Error('missing_url', 'Webhook URL is required', array('status' => 400));
        }
        
        $webhook_url = esc_url_raw($params['webhook_url']);
        
        if (!filter_var($webhook_url, FILTER_VALIDATE_URL)) {
            return new WP_Error('invalid_url', 'Invalid webhook URL', array('status' => 400));
        }
        
        update_option('appointease_webhook_url', $webhook_url);
        
        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Webhook URL configured successfully',
            'webhook_url' => $webhook_url
        ));
    }
    
    public function test_webhook($request) {
        $webhook_url = get_option('appointease_webhook_url');
        
        if (empty($webhook_url)) {
            return new WP_Error('no_webhook', 'No webhook URL configured', array('status' => 400));
        }
        
        $test_data = array(
            'event' => 'webhook.test',
            'message' => 'This is a test webhook from AppointEase',
            'timestamp' => current_time('mysql'),
            'site_url' => home_url()
        );
        
        $response = wp_remote_post($webhook_url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-Webhook-Source' => 'AppointEase'
            ),
            'body' => json_encode($test_data),
            'timeout' => 15
        ));
        
        if (is_wp_error($response)) {
            return new WP_Error('webhook_failed', $response->get_error_message(), array('status' => 500));
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        
        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Test webhook sent successfully',
            'response_code' => $response_code,
            'webhook_url' => $webhook_url
        ));
    }
    
    public function check_reschedule_availability($request) {
        global $wpdb;
        $params = $request->get_json_params();
        
        if (!isset($params['date'], $params['employee_id'], $params['exclude_appointment_id'])) {
            return new WP_Error('missing_params', 'Date, employee ID, and exclude appointment ID are required', array('status' => 400));
        }
        
        $date = sanitize_text_field($params['date']);
        $employee_id = intval($params['employee_id']);
        $exclude_appointment_id = sanitize_text_field($params['exclude_appointment_id']);
        
        // Validate date format
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return new WP_Error('invalid_date', 'Invalid date format', array('status' => 400));
        }
        
        // Check working days and business rules (same as regular availability)
        $options = get_option('appointease_options', array());
        
        // Check if date is in the past
        $today = date('Y-m-d');
        if ($date < $today) {
            return rest_ensure_response(array('unavailable' => 'all', 'reason' => 'past_date'));
        }
        
        // Check working days
        $working_days = get_option('appointease_working_days', ['1','2','3','4','5']);
        if (isset($options['working_days']) && is_array($options['working_days']) && !empty($options['working_days'])) {
            $working_days = $options['working_days'];
        }
        $day_of_week = date('w', strtotime($date));
        
        if (!in_array((string)$day_of_week, $working_days)) {
            return rest_ensure_response(array('unavailable' => 'all', 'reason' => 'non_working_day'));
        }
        
        // Get existing appointments EXCLUDING the current appointment being rescheduled
        $appointments_table = $wpdb->prefix . 'appointments';
        
        if (strpos($exclude_appointment_id, 'APT-') === 0) {
            $booked_appointments = $wpdb->get_results($wpdb->prepare(
                "SELECT TIME_FORMAT(appointment_date, '%%H:%%i') as time_slot, name, email, status, strong_id, id FROM {$appointments_table} WHERE employee_id = %d AND DATE(appointment_date) = %s AND status IN ('confirmed', 'created') AND strong_id != %s",
                $employee_id, $date, $exclude_appointment_id
            ));
        } else {
            $booked_appointments = $wpdb->get_results($wpdb->prepare(
                "SELECT TIME_FORMAT(appointment_date, '%%H:%%i') as time_slot, name, email, status, strong_id, id FROM {$appointments_table} WHERE employee_id = %d AND DATE(appointment_date) = %s AND status IN ('confirmed', 'created') AND id != %d",
                $employee_id, $date, intval($exclude_appointment_id)
            ));
        }
        
        $booked_times = array();
        $booking_details = array();
        
        foreach ($booked_appointments as $appointment) {
            $time_slot = $appointment->time_slot;
            $booked_times[] = $time_slot;
            $booking_details[$time_slot] = array(
                'customer_name' => $appointment->name,
                'customer_email' => $appointment->email,
                'status' => $appointment->status,
                'booking_id' => $appointment->strong_id ?: $appointment->id
            );
        }
        
        return rest_ensure_response(array(
            'unavailable' => $booked_times,
            'booking_details' => $booking_details,
            'excluded_appointment' => $exclude_appointment_id
        ));
    }
    
    /**
     * Add notification to transient queue
     */
    private function add_to_notification_queue($webhook_data) {
        $queue = get_transient('appointease_notification_queue');
        if (!$queue) {
            $queue = [];
        }
        
        $notification = array(
            'id' => $webhook_data['appointment_id'],
            'name' => $webhook_data['customer']['name'],
            'service_name' => $webhook_data['appointment']['service'],
            'appointment_date' => $webhook_data['appointment']['date'],
            'timestamp' => time()
        );
        
        $queue[] = $notification;
        
        // Keep only last 10 notifications and expire after 1 hour
        $queue = array_slice($queue, -10);
        set_transient('appointease_notification_queue', $queue, HOUR_IN_SECONDS);
    }
}