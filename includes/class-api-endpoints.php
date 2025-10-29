<?php

class Booking_API_Endpoints {
    private $redis;
    
    public function __construct() {
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-redis-helper.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-redis-pubsub.php';
        $this->redis = Appointease_Redis_Helper::get_instance();
        add_action('rest_api_init', array($this, 'register_routes'));
        add_action('rest_api_init', array($this, 'register_webhook_routes'));
    }
    
    public function register_routes() {
        // Register appointease/v1 routes - consolidated to avoid conflicts
        register_rest_route('appointease/v1', '/appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_appointment'),
            'permission_callback' => '__return_true' // Allow public access for booking
        ));
        
        // IMPORTANT: Escape backslash properly for regex
        register_rest_route('appointease/v1', '/appointments/(?P<id>[a-zA-Z0-9\\-]+)', array(
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
                'permission_callback' => array($this, 'verify_nonce_or_session_permission'),
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
                'permission_callback' => array($this, 'verify_nonce_or_session_permission')
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
        
        // User appointments endpoint
        register_rest_route('appointease/v1', '/user-appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'get_user_appointments'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        // Debug endpoint to see all appointments
        register_rest_route('appointease/v1', '/debug/appointments', array(
            'methods' => 'GET',
            'callback' => array($this, 'debug_appointments'),
            'permission_callback' => '__return_true'
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
        
        // Debug active selections (needed for debug panel)
        register_rest_route('appointease/v1', '/debug/selections', array(
            'methods' => 'GET',
            'callback' => array($this, 'debug_selections'),
            'permission_callback' => '__return_true'
        ));
        
        // Debug locked slots (needed for debug panel)
        register_rest_route('appointease/v1', '/debug/locks', array(
            'methods' => 'GET',
            'callback' => array($this, 'debug_locks'),
            'permission_callback' => '__return_true'
        ));
        
        // Debug raw availability data
        register_rest_route('appointease/v1', '/debug/availability-raw', array(
            'methods' => 'POST',
            'callback' => array($this, 'debug_availability_raw'),
            'permission_callback' => '__return_true'
        ));
        
        // Server date endpoint for time sync
        register_rest_route('appointease/v1', '/server-date', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_server_date'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        // Business hours endpoint
        register_rest_route('appointease/v1', '/business-hours', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_business_hours'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        // Generate OTP for authentication
        register_rest_route('appointease/v1', '/generate-otp', array(
            'methods' => 'POST',
            'callback' => array($this, 'generate_otp'),
            'permission_callback' => '__return_true'
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
        
        // Redis monitoring endpoint (public access)
        register_rest_route('appointease/v1', '/redis/stats', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_redis_stats'),
            'permission_callback' => array($this, 'public_permission')
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
        
        // Clear all locks endpoint
        register_rest_route('appointease/v1', '/clear-locks', array(
            'methods' => 'POST',
            'callback' => array($this, 'clear_all_locks'),
            'permission_callback' => '__return_true'
        ));
        
        // Log endpoint
        register_rest_route('appointease/v1', '/log', array(
            'methods' => 'POST',
            'callback' => array($this, 'write_log'),
            'permission_callback' => '__return_true'
        ));
        
        // Redis slot selection endpoints (guest-friendly)
        register_rest_route('appointease/v1', '/slots/select', array(
            'methods' => 'POST',
            'callback' => array($this, 'realtime_select'),
            'permission_callback' => '__return_true' // Allow guest selection
        ));
        
        register_rest_route('appointease/v1', '/slots/deselect', array(
            'methods' => 'POST',
            'callback' => array($this, 'realtime_deselect'),
            'permission_callback' => '__return_true' // Allow guest deselection
        ));
        
        // Time slots endpoint for settings service
        register_rest_route('appointease/v1', '/time-slots', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_time_slots'),
            'permission_callback' => '__return_true'
        ));
    }
    
    public function test_heartbeat($request) {
        $class_exists = class_exists('Appointease_Heartbeat_Handler');
        $filter_exists = isset($GLOBALS['wp_filter']['heartbeat_received']);
        $is_registered = $filter_exists && !empty($GLOBALS['wp_filter']['heartbeat_received']->callbacks);
        
        return rest_ensure_response(array(
            'class_exists' => $class_exists,
            'filter_registered' => $is_registered,
            'heartbeat_enabled' => true
        ));
    }
    

    public function get_services() {
        try {
            global $wpdb;
            $table = $wpdb->prefix . 'appointease_services';
            $services = $wpdb->get_results("SELECT * FROM {$table} ORDER BY name");
            
            if ($wpdb->last_error) {
                return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
            }
            
            return rest_ensure_response($services);
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    public function get_staff() {
        try {
            global $wpdb;
            $table = $wpdb->prefix . 'appointease_staff';
            $staff = $wpdb->get_results("SELECT * FROM {$table} ORDER BY name");
            
            if ($wpdb->last_error) {
                return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
            }
            
            return rest_ensure_response($staff);
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    public function check_availability($request) {
        try {
            global $wpdb;
            $params = $request->get_json_params();
        
        if (!isset($params['date'], $params['employee_id'])) {
            return new WP_Error('missing_params', 'Date and employee ID are required', array('status' => 400));
        }
        
        $date = sanitize_text_field($params['date']);
        $employee_id = intval($params['employee_id']);
        
        error_log("[AVAILABILITY] Checking availability for date: {$date}, employee: {$employee_id}");
        
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
        
        // Verify table exists
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$appointments_table}'");
        if (!$table_exists) {
            error_log('[AVAILABILITY] Table does not exist: ' . $appointments_table);
            return rest_ensure_response(array('unavailable' => [], 'booking_details' => new stdClass(), 'error' => 'table_not_found'));
        }
        
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
                "SELECT TIME_FORMAT(appointment_date, '%%H:%%i') as time_slot, name, email, status, strong_id, id, appointment_date FROM {$appointments_table} WHERE employee_id = %d AND DATE(appointment_date) = %s AND status IN ('confirmed', 'created') ORDER BY id DESC",
                $employee_id, $date
            ));
        }
        
        // Debug: Log query and results
        error_log('[AVAILABILITY] Table: ' . $appointments_table);
        error_log('[AVAILABILITY] Query error: ' . $wpdb->last_error);
        error_log('[AVAILABILITY] Found ' . count($booked_appointments) . ' appointments for date=' . $date . ', employee=' . $employee_id);
        if (count($booked_appointments) > 0) {
            foreach ($booked_appointments as $apt) {
                error_log('[AppointEase] - Appointment: ' . $apt->strong_id . ' at ' . $apt->time_slot . ' (ID: ' . $apt->id . ')');
            }
        }
        
        $booked_times = array();
        $booking_details = array();
        
        // Check active selections from transients
        $key = "appointease_active_{$date}_{$employee_id}";
        $active_selections = get_transient($key) ?: array();
        error_log('[AVAILABILITY] Active selections from transient: ' . json_encode($active_selections));
        
        // Check Redis locks FIRST (processing bookings take priority)
        if ($this->redis->is_enabled()) {
            $pattern = "appointease_lock_{$date}_{$employee_id}_*";
            $locked_slots = $this->redis->get_locks_by_pattern($pattern);
            
            error_log('[AVAILABILITY] Found ' . count($locked_slots) . ' Redis locks');
            
            foreach ($locked_slots as $lock) {
                $time_slot = isset($lock['time']) ? substr($lock['time'], 0, 5) : '';
                if ($time_slot && !in_array($time_slot, $booked_times)) {
                    $booked_times[] = $time_slot;
                    $ttl = $this->redis->get_ttl("appointease_lock_{$date}_{$employee_id}_{$time_slot}");
                    $booking_details[$time_slot] = array(
                        'customer_name' => 'Viewing by other user',
                        'customer_email' => '',
                        'status' => 'processing',
                        'booking_id' => 'LOCK-' . substr($lock['client_id'] ?? '', 0, 8),
                        'booked_at' => $time_slot,
                        'is_locked' => true,
                        'lock_remaining' => max(0, $ttl)
                    );
                }
            }
        }
        
        // Clean old format entries and add active selections
        $cleaned_selections = array();
        foreach ($active_selections as $time => $data) {
            // Only keep new format entries (with user_id)
            if (is_array($data) && isset($data['user_id'])) {
                $cleaned_selections[$time] = $data;
                $time_slot = substr($time, 0, 5);
                if (!in_array($time_slot, $booked_times)) {
                    $booked_times[] = $time_slot;
                    $booking_details[$time_slot] = array(
                        'customer_name' => 'Viewing by other user',
                        'customer_email' => '',
                        'status' => 'processing',
                        'booking_id' => 'ACTIVE-' . substr(md5($data['timestamp']), 0, 8),
                        'booked_at' => $time_slot,
                        'is_active' => true
                    );
                }
            }
        }
        
        // Update transient with cleaned data
        if (count($cleaned_selections) !== count($active_selections)) {
            set_transient($key, $cleaned_selections, 300);
        }
        
        // Then add confirmed appointments (locks override confirmed appointments)
        foreach ($booked_appointments as $appointment) {
            $time_slot = $appointment->time_slot;
            if (!in_array($time_slot, $booked_times)) {
                $booked_times[] = $time_slot;
                $booking_details[$time_slot] = array(
                    'customer_name' => $appointment->name,
                    'customer_email' => $appointment->email,
                    'status' => $appointment->status,
                    'booking_id' => $appointment->strong_id ?: $appointment->id,
                    'booked_at' => $time_slot
                );
            }
        }
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
        }
        
        // Clear WordPress object cache to ensure fresh data
        wp_cache_flush();
        
        // Ensure booking_details is always an object, not an array
        if (empty($booking_details)) {
            $booking_details = new stdClass();
        }
        
        error_log("[AVAILABILITY] Final unavailable times: " . json_encode($booked_times));
        error_log("[AVAILABILITY] Booking details count: " . (is_array($booking_details) ? count($booking_details) : 0));
        
        return rest_ensure_response(array(
            'unavailable' => $booked_times,
            'booking_details' => $booking_details
        ));
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    public function create_appointment($request) {
        try {
            // Load atomic booking class
            require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-atomic-booking.php';
        
        $params = $request->get_json_params();
        
        if (!isset($params['name'], $params['email'], $params['date'])) {
            return new WP_Error('missing_fields', 'Required fields missing', array('status' => 400));
        }
        
        // Sanitize and validate inputs
        $booking_data = [
            'name' => trim(sanitize_text_field($params['name'])),
            'email' => trim(strtolower(sanitize_email($params['email']))),
            'phone' => trim(sanitize_text_field($params['phone'] ?? '')),
            'appointment_date' => trim(sanitize_text_field($params['date'])),
            'service_id' => intval($params['service_id'] ?? 1),
            'employee_id' => intval($params['employee_id'] ?? 1),
            'idempotency_key' => $request->get_header('X-Idempotency-Key')
        ];
        
        // Basic validation
        if (empty($booking_data['name']) || empty($booking_data['email']) || empty($booking_data['appointment_date'])) {
            return new WP_Error('invalid_data', 'Name, email and date are required', array('status' => 400));
        }
        
        if (!is_email($booking_data['email'])) {
            return new WP_Error('invalid_email', 'Invalid email format', array('status' => 400));
        }
        
        // Use atomic booking with race condition prevention
        $atomic_booking = Atomic_Booking::getInstance();
        $result = $atomic_booking->create_appointment_atomic($booking_data);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        // Trigger webhook for new appointment
        $this->trigger_appointment_webhook($result['appointment_id'], $result['strong_id'], $booking_data);
        
        return rest_ensure_response($result);
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    

    
    public function get_appointment($request) {
        try {
            global $wpdb;
            $id = $request['id'];
            $table = $wpdb->prefix . 'appointments';
            
            $appointment = $this->find_appointment_by_id($id);
            
            if ($appointment) {
                return rest_ensure_response($appointment);
            }
            
            return new WP_Error('not_found', 'Appointment not found', array('status' => 404));
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    public function cancel_appointment($request) {
        try {
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
        
        // If already cancelled, return success
        if ($appointment->status === 'cancelled') {
            return rest_ensure_response(array('success' => true, 'already_cancelled' => true));
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
        
        return rest_ensure_response(array('success' => true));
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    public function reschedule_appointment($request) {
        try {
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
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    public function get_user_appointments($request) {
        try {
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
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    public function check_customer_by_email($request) {
        try {
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
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
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
    
    public function public_booking_permission($request) {
        // Allow public booking creation for testing
        return true;
    }
    
    public function verify_nonce_or_session_permission($request) {
        // First try nonce verification
        $nonce = $request->get_header('X-WP-Nonce');
        if (!$nonce) {
            $nonce = $request->get_param('_wpnonce');
        }
        if ($nonce && wp_verify_nonce($nonce, 'wp_rest')) {
            return true;
        }
        
        // If nonce fails, check for valid session
        $session_manager = BookingSessionManager::getInstance();
        $user = $session_manager->validateSession();
        
        return $user !== false;
    }
    
    public function appointment_permission($request) {
        return true; // Allow public access for appointment management
    }
    
    private function find_appointment_by_id($id) {
        try {
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
        } catch (Exception $e) {
            error_log('[AppointEase] find_appointment_by_id error: ' . $e->getMessage());
            return null;
        }
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
        try {
            global $wpdb;
            $table = $wpdb->prefix . 'appointments';
            
            $appointments = $wpdb->get_results(
                "SELECT * FROM {$table} ORDER BY appointment_date DESC"
            );
            
            if ($wpdb->last_error) {
                return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
            }
            
            return rest_ensure_response(array(
                'all_appointments' => $appointments,
                'total_count' => count($appointments)
            ));
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    

    
    public function verify_otp_and_create_session($request) {
        $params = $request->get_json_params();
        
        if (!isset($params['email'], $params['otp'])) {
            return new WP_Error('missing_params', 'Email and OTP are required', array('status' => 400));
        }
        
        $email = sanitize_email($params['email']);
        $otp = sanitize_text_field($params['otp']);
        
        // Check stored OTP
        $stored_otp = get_transient('appointease_otp_' . md5($email));
        
        if (!$stored_otp) {
            return new WP_Error('otp_expired', 'OTP has expired. Please request a new one.', array('status' => 400));
        }
        
        if ($otp !== $stored_otp) {
            return new WP_Error('invalid_otp', 'Invalid OTP code', array('status' => 400));
        }
        
        // Delete used OTP
        delete_transient('appointease_otp_' . md5($email));
        
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
        try {
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
        
        // Use atomic check with microsecond precision
        $booking = $wpdb->get_row($wpdb->prepare(
            "SELECT id, strong_id, name, email, status, created_at FROM {$appointments_table} 
             WHERE employee_id = %d AND appointment_date = %s AND status IN ('confirmed', 'created')",
            $employee_id, $datetime
        ));
        
        if ($booking) {
            // Real-time conflict detection
            $conflict_age = time() - strtotime($booking->created_at);
            
            return rest_ensure_response(array(
                'is_booked' => true,
                'conflict_detected' => $conflict_age < 30, // Recent booking (30 seconds)
                'booking_details' => array(
                    'id' => $booking->strong_id ?: $booking->id,
                    'customer' => $booking->name,
                    'email' => $booking->email,
                    'status' => $booking->status,
                    'booked_at' => $booking->created_at
                )
            ));
        }
        
        return rest_ensure_response(array(
            'is_booked' => false,
            'available' => true,
            'message' => 'Time slot is available'
        ));
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
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
        try {
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
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    public function update_admin_appointment($request) {
        try {
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
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Trigger webhook when new appointment is created
     */
    private function trigger_appointment_webhook($appointment_id, $strong_id, $appointment_data) {
        try {
            global $wpdb;
            
            $service = $wpdb->get_row($wpdb->prepare(
            "SELECT name FROM {$wpdb->prefix}appointease_services WHERE id = %d",
            $appointment_data['service_id']
        ));
        
        $staff = $wpdb->get_row($wpdb->prepare(
            "SELECT name, email FROM {$wpdb->prefix}appointease_staff WHERE id = %d",
            $appointment_data['employee_id']
        ));
        
        // Send admin email notification only
        $admin_email = get_option('admin_email');
        $site_name = get_bloginfo('name');
        
        $subject = sprintf('[%s] New Appointment Booked - %s', $site_name, $strong_id);
        
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
            $strong_id,
            $appointment_data['name'],
            $appointment_data['email'],
            $appointment_data['phone'],
            $service ? $service->name : 'Unknown Service',
            $staff ? $staff->name : 'Unknown Staff',
            date('F j, Y \\a\\t g:i A', strtotime($appointment_data['appointment_date'])),
            admin_url('admin.php?page=appointease-admin')
        );
        
        wp_mail($admin_email, $subject, $message);
        } catch (Exception $e) {
            error_log('[AppointEase] Webhook error: ' . $e->getMessage());
        }
    }
    
    /**
     * Register webhook URL endpoint (removed - unused feature)
     */
    public function register_webhook_routes() {
        // Webhooks removed - not used in current implementation
    }
    
    public function check_reschedule_availability($request) {
        try {
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
        
        // Verify table exists
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$appointments_table}'");
        if (!$table_exists) {
            error_log('[RESCHEDULE] Table does not exist: ' . $appointments_table);
            return rest_ensure_response(array('unavailable' => [], 'booking_details' => new stdClass(), 'error' => 'table_not_found'));
        }
        
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
        
        // Check Redis locks FIRST (processing bookings take priority)
        if ($this->redis->is_enabled()) {
            $pattern = "appointease_lock_{$date}_{$employee_id}_*";
            $locked_slots = $this->redis->get_locks_by_pattern($pattern);
            
            foreach ($locked_slots as $lock) {
                $time_slot = isset($lock['time']) ? substr($lock['time'], 0, 5) : '';
                if ($time_slot && !in_array($time_slot, $booked_times)) {
                    $booked_times[] = $time_slot;
                    $ttl = $this->redis->get_ttl("appointease_lock_{$date}_{$employee_id}_{$time_slot}");
                    $booking_details[$time_slot] = array(
                        'customer_name' => 'Processing',
                        'customer_email' => '',
                        'status' => 'processing',
                        'booking_id' => 'LOCK-' . substr($lock['client_id'] ?? '', 0, 8),
                        'is_locked' => true,
                        'lock_remaining' => max(0, $ttl)
                    );
                }
            }
        }
        
        // Then add confirmed appointments (locks override confirmed appointments)
        foreach ($booked_appointments as $appointment) {
            $time_slot = $appointment->time_slot;
            if (!in_array($time_slot, $booked_times)) {
                $booked_times[] = $time_slot;
                $booking_details[$time_slot] = array(
                    'customer_name' => $appointment->name,
                    'customer_email' => $appointment->email,
                    'status' => $appointment->status,
                    'booking_id' => $appointment->strong_id ?: $appointment->id
                );
            }
        }
        
        // Ensure booking_details is always an object, not an array
        if (empty($booking_details)) {
            $booking_details = new stdClass();
        }
        
        return rest_ensure_response(array(
            'unavailable' => $booked_times,
            'booking_details' => $booking_details,
            'excluded_appointment' => $exclude_appointment_id
        ));
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    

    
    /**
     * Generate OTP for authentication
     */
    public function generate_otp($request) {
        $params = $request->get_json_params();
        
        if (!isset($params['email'])) {
            return new WP_Error('missing_email', 'Email is required', array('status' => 400));
        }
        
        $email = sanitize_email($params['email']);
        
        if (!is_email($email)) {
            return new WP_Error('invalid_email', 'Valid email is required', array('status' => 400));
        }
        
        // Generate 6-digit OTP
        $otp = sprintf('%06d', mt_rand(0, 999999));
        
        // Store OTP in transient (expires in 10 minutes)
        set_transient('appointease_otp_' . md5($email), $otp, 600);
        
        // Send OTP email
        $subject = 'Your AppointEase Login Code';
        $message = sprintf(
            "Your login code is: %s\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.",
            $otp
        );
        
        $sent = wp_mail($email, $subject, $message);
        
        if (!$sent) {
            return new WP_Error('email_failed', 'Failed to send OTP email', array('status' => 500));
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'message' => 'OTP sent to your email',
            'expires_in' => 600
        ));
    }
    
    /**
     * Track active slot selections (Redis ONLY - no database)
     */
    public function realtime_select($request) {
        $start = microtime(true);
        try {
            $params = $request->get_json_params();
            
            if (!isset($params['date'], $params['time'], $params['employee_id'], $params['client_id'])) {
                return new WP_Error('missing_params', 'Date, time, employee_id and client_id required', array('status' => 400));
            }
            
            $date = sanitize_text_field($params['date']);
            $time = sanitize_text_field($params['time']);
            $employee_id = intval($params['employee_id']);
            $client_id = sanitize_text_field($params['client_id']);
            
            $redis_check = microtime(true);
            $redis_enabled = $this->redis->is_enabled();
            error_log('[SELECT] Redis check: ' . (($redis_check - $start) * 1000) . 'ms, enabled: ' . ($redis_enabled ? 'YES' : 'NO'));
            
            if ($redis_enabled) {
                $set_start = microtime(true);
                $success = $this->redis->set_active_selection($date, $employee_id, $time, $client_id);
                $set_duration = (microtime(true) - $set_start) * 1000;
                
                error_log('[SELECT] set_active_selection: ' . $set_duration . 'ms, success: ' . ($success ? 'YES' : 'NO'));
                
                if (!$success) {
                    return new WP_Error('selection_failed', 'Failed to set selection', array('status' => 500));
                }
                
                $total = (microtime(true) - $start) * 1000;
                error_log('[SELECT] Total: ' . $total . 'ms');
                
                return rest_ensure_response(array(
                    'success' => true,
                    'client_id' => $client_id,
                    'storage' => 'redis',
                    'ttl' => 10,
                    'debug_ms' => round($total, 2)
                ));
            }
            
            // Fallback to transients
            $key = "appointease_active_{$date}_{$employee_id}";
            $selections = get_transient($key) ?: array();
            
            // Remove old selection by same user
            foreach ($selections as $slot_time => $data) {
                if (is_array($data) && isset($data['user_id']) && $data['user_id'] === $user_id) {
                    unset($selections[$slot_time]);
                }
            }
            
            // Check if slot already taken
            if (isset($selections[$time])) {
                return new WP_Error('already_locked', 'Slot is already locked', array('status' => 409));
            }
            
            $selections[$time] = array(
                'timestamp' => time(),
                'user_id' => $user_id,
                'client_id' => $client_id
            );
            set_transient($key, $selections, 600);
            
            return rest_ensure_response(array(
                'success' => true,
                'client_id' => $client_id,
                'locked' => true,
                'storage' => 'transient',
                'ttl' => 600
            ));
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Remove active slot selection (Redis ONLY)
     */
    public function realtime_deselect($request) {
        try {
            $params = $request->get_json_params();
            
            if (!isset($params['date'], $params['time'], $params['employee_id'])) {
                return new WP_Error('missing_params', 'Date, time and employee_id required', array('status' => 400));
            }
            
            $date = sanitize_text_field($params['date']);
            $time = sanitize_text_field($params['time']);
            $employee_id = intval($params['employee_id']);
            
            if ($this->redis->is_enabled()) {
                $slot_key = "appointease_active_{$date}_{$employee_id}_{$time}";
                $this->redis->delete_lock($slot_key);
            } else {
                $key = "appointease_active_{$date}_{$employee_id}";
                $selections = get_transient($key) ?: array();
                unset($selections[$time]);
                if (empty($selections)) {
                    delete_transient($key);
                } else {
                    set_transient($key, $selections, 600);
                }
            }
            
            return rest_ensure_response(array('success' => true));
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }

    
    public function debug_selections($request) {
        try {
            global $wpdb;
            $all_transients = $wpdb->get_results(
                "SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE '_transient_appointease_active_%'"
            );
            $selections = array();
            $now = time();
            $cleaned_count = 0;
            
            foreach ($all_transients as $transient) {
                $key = str_replace('_transient_', '', $transient->option_name);
                $data = maybe_unserialize($transient->option_value);
                
                // Clean expired entries (>5 seconds old)
                $cleaned_data = array();
                foreach ($data as $time => $timeData) {
                    if (is_array($timeData) && isset($timeData['timestamp'])) {
                        if ($now - $timeData['timestamp'] <= 5) {
                            $cleaned_data[$time] = $timeData;
                        } else {
                            $cleaned_count++;
                        }
                    }
                }
                
                // Update or delete transient
                if (empty($cleaned_data)) {
                    delete_transient($key);
                } else if (count($cleaned_data) !== count($data)) {
                    set_transient($key, $cleaned_data, 300);
                    $selections[$key] = $cleaned_data;
                } else {
                    $selections[$key] = $data;
                }
            }
            
            return rest_ensure_response(array(
                'active_selections' => $selections, 
                'count' => count($selections),
                'cleaned' => $cleaned_count
            ));
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    public function debug_locks($request) {
        try {
            $locks = array();
            
            if ($this->redis->is_enabled()) {
                $locks = $this->redis->get_locks_by_pattern('appointease_lock_*');
            } else {
                global $wpdb;
                $transients = $wpdb->get_results(
                    "SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE '_transient_appointease_active_%'"
                );
                foreach ($transients as $t) {
                    $data = maybe_unserialize($t->option_value);
                    if (is_array($data)) {
                        $locks = array_merge($locks, array_values($data));
                    }
                }
            }
            
            return rest_ensure_response(array('locked_slots' => $locks, 'count' => count($locks)));
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    public function debug_availability_raw($request) {
        try {
            global $wpdb;
            $params = $request->get_json_params();
            
            $date = isset($params['date']) ? sanitize_text_field($params['date']) : date('Y-m-d');
            $employee_id = isset($params['employee_id']) ? intval($params['employee_id']) : 1;
            
            $appointments_table = $wpdb->prefix . 'appointments';
            
            $appointments = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM {$appointments_table} WHERE employee_id = %d AND DATE(appointment_date) = %s",
                $employee_id, $date
            ));
            
            // Get Redis locks (current architecture)
            $redis_locks = [];
            if ($this->redis->is_enabled()) {
                $pattern = "appointease_lock_{$date}_{$employee_id}_*";
                $redis_locks = $this->redis->get_locks_by_pattern($pattern);
            }
            
            return rest_ensure_response(array(
                'date' => $date,
                'employee_id' => $employee_id,
                'appointments' => $appointments,
                'appointments_count' => count($appointments),
                'redis_locks' => $redis_locks,
                'redis_locks_count' => count($redis_locks),
                'last_error' => $wpdb->last_error
            ));
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    public function realtime_stream($request) {
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        header('X-Accel-Buffering: no');
        
        $pubsub = Appointease_Redis_PubSub::get_instance();
        
        if (!$pubsub->is_enabled()) {
            echo "data: {\"error\": \"Redis not available\"}\n\n";
            flush();
            return;
        }
        
        $pubsub->subscribe(['appointease:slots'], function($redis, $channel, $message) {
            echo "data: {$message}\n\n";
            flush();
        });
    }
    
    public function clear_all_locks($request) {
        try {
            global $wpdb;
            
            // Clear Redis locks
            $redis_cleared = 0;
            if ($this->redis->is_enabled()) {
                $redis_cleared = $this->redis->clear_all_locks();
            }
            
            // Clear transients
            $transients = $wpdb->get_results(
                "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE '_transient_appointease_active_%'"
            );
            
            $deleted_transients = 0;
            foreach ($transients as $transient) {
                $key = str_replace('_transient_', '', $transient->option_name);
                if (delete_transient($key)) {
                    $deleted_transients++;
                }
            }
            
            wp_cache_flush();
            
            error_log('[CLEAR_LOCKS] Redis: ' . $redis_cleared . ', Transients: ' . $deleted_transients);
            
            return rest_ensure_response(array(
                'success' => true,
                'deleted_transients' => $deleted_transients,
                'redis_cleared' => $redis_cleared,
                'message' => 'All locked data cleared successfully'
            ));
        } catch (Exception $e) {
            return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    public function write_log($request) {
        $params = $request->get_json_params();
        if (!isset($params['logs'])) {
            return new WP_Error('missing_logs', 'Logs data required', array('status' => 400));
        }
        
        $log_file = plugin_dir_path(dirname(__FILE__)) . 'appointease-debug.log';
        file_put_contents($log_file, $params['logs'], FILE_APPEND | LOCK_EX);
        
        return rest_ensure_response(array('success' => true));
    }
    
    /**
     * Redis monitoring and stats
     */
    public function get_redis_stats($request) {
        if (!$this->redis->is_enabled()) {
            return rest_ensure_response(array(
                'enabled' => false,
                'message' => 'Redis not available'
            ));
        }
        
        $stats = $this->redis->get_stats();
        $persistence = $this->redis->get_persistence_config();
        
        // Count active locks
        $lock_count = 0;
        $iterator = null;
        try {
            while ($keys = $this->redis->get_locks_by_pattern('appointease_lock_*')) {
                $lock_count = count($keys);
                break;
            }
        } catch (Exception $e) {
            $lock_count = 0;
        }
        
        return rest_ensure_response(array(
            'enabled' => true,
            'stats' => $stats,
            'persistence' => $persistence,
            'active_locks' => $lock_count,
            'health' => $this->redis->health_check()
        ));
    }
}
