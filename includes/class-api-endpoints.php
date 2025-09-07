<?php

class Booking_API_Endpoints {
    
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    public function register_routes() {
        // Register appointease/v1 routes - consolidated to avoid conflicts
        register_rest_route('appointease/v1', '/appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_appointment'),
            'permission_callback' => array($this, 'public_permission')
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
                'permission_callback' => array($this, 'public_permission'),
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
                'permission_callback' => array($this, 'public_permission')
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
        
        // User appointments endpoint (keeping both namespaces for backward compatibility)
        register_rest_route('appointease/v1', '/user-appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'get_user_appointments'),
            'permission_callback' => array($this, 'public_permission')
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
            'permission_callback' => array($this, 'public_permission')
        ));
        
        // Fix existing appointments without strong_id
        register_rest_route('appointease/v1', '/fix-appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'fix_existing_appointments'),
            'permission_callback' => array($this, 'public_permission')
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
        
        // Validate date format
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return new WP_Error('invalid_date', 'Invalid date format', array('status' => 400));
        }
        
        // Check existing appointments for this staff member on this date
        $appointments_table = $wpdb->prefix . 'appointments';
        $booked_times = $wpdb->get_col($wpdb->prepare(
            "SELECT TIME_FORMAT(appointment_date, '%%H:%%i') as time_slot FROM {$appointments_table} WHERE employee_id = %d AND DATE(appointment_date) = %s AND status = 'confirmed'",
            $employee_id, $date
        ));
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
        }
        
        return rest_ensure_response(array('unavailable' => $booked_times));
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
        
        if (empty($name) || empty($email) || empty($date)) {
            return new WP_Error('invalid_data', 'Name, email and date are required', array('status' => 400));
        }
        
        // Validate email format
        if (!is_email($email)) {
            return new WP_Error('invalid_email', 'Invalid email format', array('status' => 400));
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
        
        // Create flexible search patterns
        $base_name = str_replace('.', '', $email_prefix); // Remove dots
        $pattern1 = '%' . $email_prefix . '%';           // Original with dots
        $pattern2 = '%' . $base_name . '%';              // Without dots
        $pattern3 = '%' . str_replace('a', 's', $base_name) . '%'; // Handle a/s typos
        
        $query = $wpdb->prepare(
            "SELECT * FROM {$table} WHERE email = %s OR name LIKE %s OR name LIKE %s OR name LIKE %s ORDER BY appointment_date DESC",
            $email, $pattern1, $pattern2, $pattern3
        );
        
        $appointments = $wpdb->get_results($query);
        
        return rest_ensure_response($appointments);
    }
    
    public function public_permission($request) {
        return true;
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
        // Restrict debug endpoint to admin users only
        if (!current_user_can('manage_options')) {
            return new WP_Error('forbidden', 'Access denied', array('status' => 403));
        }
        
        global $wpdb;
        $table = $wpdb->prefix . 'appointments';
        
        $appointments = $wpdb->get_results(
            "SELECT id, strong_id, name, appointment_date, status FROM {$table} ORDER BY id DESC LIMIT 20"
        );
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
        }
        
        $total_count = $wpdb->get_var("SELECT COUNT(*) FROM {$table}");
        $null_strong_ids = $wpdb->get_var("SELECT COUNT(*) FROM {$table} WHERE strong_id IS NULL");
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
        }
        
        return rest_ensure_response(array(
            'table_name' => $table,
            'appointments' => $appointments,
            'total_count' => $total_count,
            'null_strong_ids' => $null_strong_ids
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
        
        // For demo purposes, accept 123456 as valid OTP
        if ($otp !== '123456') {
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
        
        return rest_ensure_response(array('success' => true));
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
}