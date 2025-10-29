<?php

if (!defined('ABSPATH')) {
    exit;
}

class Appointease_Heartbeat_Handler {
    private $redis;
    
    public function __construct() {
        require_once plugin_dir_path(__FILE__) . 'class-redis-helper.php';
        require_once plugin_dir_path(__FILE__) . 'class-logger.php';
        $this->redis = Appointease_Redis_Helper::get_instance();
        
        // CRITICAL: Enable heartbeat on frontend BEFORE WordPress suspends it
        add_action('init', array($this, 'force_enable_heartbeat'), 1);
        
        // Register heartbeat handlers (both logged-in and non-logged-in)
        add_filter('heartbeat_received', array($this, 'handle_heartbeat'), 10, 2);
        add_filter('heartbeat_nopriv_received', array($this, 'handle_heartbeat'), 10, 2);
        
        // Enqueue heartbeat script
        add_action('wp_enqueue_scripts', array($this, 'enqueue_heartbeat_scripts'), 1);
        
        // Set heartbeat interval and enable on frontend
        add_filter('heartbeat_settings', array($this, 'heartbeat_settings'));
        
        error_log('[Heartbeat] Filters registered');
    }
    
    public function force_enable_heartbeat() {
        // Remove WordPress's default heartbeat suspension on frontend
        remove_action('init', 'wp_check_php_mysql_versions');
        add_filter('heartbeat_settings', array($this, 'heartbeat_settings'), 1);
        error_log('[Heartbeat] Forced enable on init');
    }
    
    public function heartbeat_settings($settings) {
        // Force enable on frontend
        $settings['interval'] = 1;
        $settings['suspension'] = 'disable';
        
        error_log('[Heartbeat] Settings applied: ' . print_r($settings, true));
        return $settings;
    }

    public function enqueue_heartbeat_scripts() {
        // Enqueue WordPress heartbeat API
        wp_enqueue_script('heartbeat');
    }

    public function handle_heartbeat($response, $data) {
        error_log('[Heartbeat] handle_heartbeat called with data: ' . print_r($data, true));
        try {
            $response['appointease_test'] = 'heartbeat_working';
            $redis_available = $this->redis->health_check();
            
            // Add Redis status to every response
            $response['redis_status'] = $redis_available ? 'available' : 'unavailable';
            $response['storage_mode'] = $redis_available ? 'redis' : 'mysql';
            
            // Graceful failback: Sync transients to Redis after recovery
            static $last_redis_status = null;
            if ($last_redis_status === false && $redis_available === true) {
                error_log('[Heartbeat] Redis recovered - syncing transients to Redis');
                if (isset($data['appointease_poll']['date'], $data['appointease_poll']['employee_id'])) {
                    $this->redis->sync_transients_to_redis(
                        $data['appointease_poll']['date'],
                        $data['appointease_poll']['employee_id']
                    );
                }
            }
            $last_redis_status = $redis_available;
            
            // Handle slot selection
            if (isset($data['appointease_select'])) {
                error_log('[Heartbeat] Processing slot selection: ' . print_r($data['appointease_select'], true));
                $response['appointease_select'] = $this->handle_slot_selection($data['appointease_select']);
                error_log('[Heartbeat] Selection response: ' . print_r($response['appointease_select'], true));
            }
            
            // Handle slot deselection
            if (isset($data['appointease_deselect'])) {
                $response['appointease_deselect'] = $this->handle_slot_deselection($data['appointease_deselect']);
            }
            
            // Handle real-time slot polling
            if (isset($data['appointease_poll'])) {
                $poll_data = $data['appointease_poll'];
                $date = sanitize_text_field($poll_data['date']);
                $employee_id = intval($poll_data['employee_id']);
                $client_id = isset($poll_data['client_id']) ? sanitize_text_field($poll_data['client_id']) : null;
                $selected_time = isset($poll_data['selected_time']) ? sanitize_text_field($poll_data['selected_time']) : null;
                
                // Skip if no date/employee (invalid request)
                if (empty($date) || $employee_id <= 0) {
                    return $response;
                }
                
                error_log('[Heartbeat] Polling for date: ' . $date . ', employee: ' . $employee_id . ', client: ' . $client_id . ', time: ' . $selected_time);
                Appointease_Logger::get_instance()->log('Poll', array('date' => $date, 'employee_id' => $employee_id, 'client_id' => $client_id, 'selected_time' => $selected_time));
                
                // Get booked slots from database
                global $wpdb;
                $booked_slots = $wpdb->get_col($wpdb->prepare(
                    "SELECT TIME_FORMAT(TIME(appointment_date), '%%H:%%i') FROM {$wpdb->prefix}appointments 
                     WHERE DATE(appointment_date) = %s AND employee_id = %d AND status IN ('confirmed', 'created')",
                    $date, $employee_id
                ));
                
                // Get locked slots from Redis (exclude user's own locks)
                $locked_slots = array();
                $user_ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
                $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
                $user_id = md5($user_ip . $user_agent);
                
                if ($redis_available) {
                    $pattern = "appointease_lock_{$date}_{$employee_id}_*";
                    $redis_locks = $this->redis->get_locks_by_pattern($pattern);
                    
                    foreach ($redis_locks as $lock) {
                        // Exclude current user's locks
                        if (isset($lock['user_id']) && $lock['user_id'] !== $user_id) {
                            $time_slot = isset($lock['time']) ? substr($lock['time'], 0, 5) : '';
                            if ($time_slot) {
                                $locked_slots[] = $time_slot;
                            }
                        }
                    }
                    error_log('[Heartbeat] Found ' . count($redis_locks) . ' Redis locks, ' . count($locked_slots) . ' from other users');
                }
                
                // Get active selections from Redis with transient fallback
                $selections = array();
                $now = time();
                
                if ($redis_available) {
                    $selections = $this->redis->get_active_selections($date, $employee_id);
                    error_log('[Heartbeat] Using Redis for selections');
                } else {
                    // Fallback to transients
                    $key = "appointease_active_{$date}_{$employee_id}";
                    $selections = get_transient($key) ?: array();
                    error_log('[Heartbeat] Using transients fallback');
                }
                
                // Extract active times and filter out current user's selection
                $active_times = array();
                if ($redis_available) {
                    foreach ($selections as $time => $sel_data) {
                        // Exclude current user's own selection from active_selections
                        if (isset($sel_data['client_id']) && $sel_data['client_id'] !== $client_id) {
                            $active_times[] = $time;
                        }
                    }
                } else {
                    // Clean expired selections for transients (older than 10 seconds)
                    foreach ($selections as $time => $sel_data) {
                        $timestamp = is_array($sel_data) ? ($sel_data['timestamp'] ?? 0) : $sel_data;
                        $sel_client_id = is_array($sel_data) ? ($sel_data['client_id'] ?? null) : null;
                        // Exclude current user and expired selections
                        if ($now - $timestamp < 10 && $sel_client_id !== $client_id) {
                            $active_times[] = $time;
                        }
                    }
                }
                
                error_log('[Heartbeat] Found selections: ' . print_r($selections, true));
                error_log('[Heartbeat] Active times (excluding current user): ' . print_r($active_times, true));
                error_log('[Heartbeat] Booked slots: ' . print_r($booked_slots, true));
                error_log('[Heartbeat] Locked slots: ' . print_r($locked_slots, true));
                
                // Count current user's selection - check if user has any selection with their client_id
                error_log('[Heartbeat] Checking user selection - client_id: ' . $client_id . ', selected_time: ' . $selected_time);
                $user_has_selection = 0;
                if (!empty($client_id)) {
                    // Check if user has any active selection
                    foreach ($selections as $time => $sel_data) {
                        if (isset($sel_data['client_id']) && $sel_data['client_id'] === $client_id) {
                            $user_has_selection = 1;
                            break;
                        }
                    }
                    
                    // If user provided selected_time, refresh/set their selection
                    if (!empty($selected_time)) {
                        if ($redis_available) {
                            $this->redis->set_active_selection($date, $employee_id, $selected_time, $client_id);
                        } else {
                            // Fallback to transients - release previous slots for this user
                            $key = "appointease_active_{$date}_{$employee_id}";
                            $selections_data = get_transient($key) ?: array();
                            
                            // Remove all previous selections by this user
                            foreach ($selections_data as $time_key => $sel_data) {
                                if (isset($sel_data['client_id']) && $sel_data['client_id'] === $client_id) {
                                    unset($selections_data[$time_key]);
                                }
                            }
                            
                            // Add new selection
                            $selections_data[$selected_time] = array('timestamp' => $now, 'client_id' => $client_id);
                            set_transient($key, $selections_data, 300);
                        }
                        $user_has_selection = 1;
                        error_log('[Heartbeat] Set slot ' . $selected_time . ' for client ' . $client_id . ' (released previous slots)');
                    }
                }
                
                $response['appointease_active_selections'] = $active_times;
                $response['appointease_booked_slots'] = $booked_slots;
                $response['appointease_locked_slots'] = $locked_slots;
                
                error_log('[Heartbeat] Sending to client - Active: ' . json_encode($active_times) . ', Booked: ' . json_encode($booked_slots) . ', Locked: ' . json_encode($locked_slots));
                
                // Add cache info
                $response['cache_info'] = array(
                    'redis_enabled' => $redis_available,
                    'storage_mode' => $redis_available ? 'redis' : 'mysql',
                    'timestamp' => time(),
                    'health_check_used' => true
                );
                
                // Count Redis operations - locks from DB, selections from other users, user's own selection
                $response['redis_ops'] = array(
                    'locks' => count($locked_slots),
                    'selections' => count($active_times),
                    'user_selection' => $user_has_selection
                );
                
                error_log('[Heartbeat] Redis ops - Locks: ' . count($locked_slots) . ', Other users: ' . count($active_times) . ', User: ' . $user_has_selection);
                Appointease_Logger::get_instance()->log('RedisOps', array('locks' => count($locked_slots), 'selections' => count($active_times), 'user_selection' => $user_has_selection));
            }
            
            if (!isset($data['appointease_booking'])) {
                return $response;
            }
            
            $booking_data = $data['appointease_booking'];
            
            switch ($booking_data['action']) {
            case 'get_user_data':
                $response['appointease_booking'] = $this->get_user_booking_data($booking_data);
                break;
                
            case 'validate_booking':
                $response['appointease_booking'] = $this->validate_booking_data($booking_data);
                break;
                
            case 'check_availability':
                $response['appointease_booking'] = $this->check_slot_availability($booking_data);
                break;
                
            case 'cancel_appointment':
                $response['appointease_booking'] = $this->cancel_appointment($booking_data);
                break;
                
            case 'reschedule_appointment':
                $response['appointease_booking'] = $this->reschedule_appointment($booking_data);
                break;
                
            case 'confirm_booking':
                $response['appointease_booking'] = $this->confirm_booking($booking_data);
                break;
                
            case 'send_otp':
                $response['appointease_booking'] = $this->send_otp($booking_data);
                break;
                
                case 'verify_otp':
                    $response['appointease_booking'] = $this->verify_otp($booking_data);
                    break;
            }
            
            // Handle debug requests
            if (isset($data['appointease_debug'])) {
                $debug_data = $data['appointease_debug'];
                switch ($debug_data['action']) {
                    case 'get_selections':
                        $response['appointease_debug'] = $this->get_debug_selections();
                        break;
                    case 'clear_locks':
                        $response['appointease_debug'] = $this->clear_all_locks();
                        break;
                }
            }
            
            return $response;
        } catch (Exception $e) {
            error_log('[Heartbeat] FATAL ERROR: ' . $e->getMessage());
            error_log('[Heartbeat] Stack trace: ' . $e->getTraceAsString());
            return array(
                'appointease_test' => 'error',
                'error' => $e->getMessage(),
                'redis_status' => 'error'
            );
        }
    }

    private function get_user_booking_data($data) {
        if (!isset($data['user_email'])) {
            return array('error' => 'Email required');
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'appointments';
        
        $appointments = $wpdb->get_results($wpdb->prepare(
            "SELECT id, name, email, service_id, staff_id, appointment_date, status, created_at, rescheduled_at, original_date FROM $table_name WHERE email = %s AND status != 'cancelled' ORDER BY appointment_date ASC LIMIT 100",
            $data['user_email']
        ));

        $formatted_appointments = array();
        foreach ($appointments as $apt) {
            $formatted_appointments[] = array(
                'id' => 'APT-' . date('Y') . '-' . str_pad($apt->id, 6, '0', STR_PAD_LEFT),
                'service_name' => $apt->service_name ?? 'Service',
                'staff_name' => $apt->staff_name ?? 'Staff Member',
                'appointment_date' => $apt->appointment_date,
                'status' => $apt->status,
                'name' => $apt->name,
                'email' => $apt->email,
                'created_at' => $apt->created_at,
                'rescheduled_at' => $apt->rescheduled_at ?? null,
                'original_date' => $apt->original_date ?? null
            );
        }

        return array(
            'appointments' => $formatted_appointments,
            'timestamp' => time()
        );
    }

    private function validate_booking_data($data) {
        $errors = array();

        // Server-side validation
        if (empty($data['firstName'])) {
            $errors['firstName'] = 'First name is required';
        }

        if (empty($data['lastName'])) {
            $errors['lastName'] = 'Last name is required';
        }

        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Valid email is required';
        }

        if (empty($data['phone']) || !preg_match('/^[\+]?[1-9][\d]{0,15}$/', preg_replace('/\s/', '', $data['phone']))) {
            $errors['phone'] = 'Valid phone number is required';
        }

        if (empty($data['service_id'])) {
            $errors['service'] = 'Service selection is required';
        }

        if (empty($data['staff_id'])) {
            $errors['staff'] = 'Staff selection is required';
        }

        if (empty($data['date']) || !$this->is_valid_date($data['date'])) {
            $errors['date'] = 'Valid date is required';
        }

        if (empty($data['time']) || !$this->is_valid_time($data['time'])) {
            $errors['time'] = 'Valid time is required';
        }

        // Check slot availability
        if (empty($errors) && !$this->is_slot_available($data['date'], $data['time'], $data['staff_id'])) {
            $errors['time'] = 'Selected time slot is no longer available';
        }

        return array(
            'validation_errors' => $errors,
            'is_valid' => empty($errors)
        );
    }

    private function check_slot_availability($data) {
        if (!isset($data['date']) || !isset($data['staff_id'])) {
            return array('error' => 'Date and staff ID required');
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'appointments';
        
        $booked_slots = $wpdb->get_col($wpdb->prepare(
            "SELECT TIME(appointment_date) as time_slot FROM $table_name 
             WHERE DATE(appointment_date) = %s AND employee_id = %d AND status != 'cancelled' AND appointment_date >= UTC_TIMESTAMP()",
            $data['date'],
            $data['staff_id']
        ));

        $available_slots = $this->generate_time_slots();
        $available_slots = array_diff($available_slots, $booked_slots);

        return array(
            'available_slots' => array_values($available_slots),
            'booked_slots' => $booked_slots
        );
    }

    private function is_valid_date($date) {
        $d = DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date && $d >= new DateTime('today');
    }

    private function is_valid_time($time) {
        $t = DateTime::createFromFormat('H:i', $time);
        return $t && $t->format('H:i') === $time;
    }

    private function is_slot_available($date, $time, $staff_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'appointments';
        
        $datetime = $date . ' ' . $time . ':00';
        
        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_name 
             WHERE appointment_date = %s AND employee_id = %d AND status != 'cancelled'",
            $datetime,
            $staff_id
        ));

        return $count == 0;
    }

    private function generate_time_slots() {
        static $cached_slots = null;
        if ($cached_slots !== null) {
            return $cached_slots;
        }
        
        $slots = array();
        $start = new DateTime('09:00');
        $end = new DateTime('17:00');
        $interval = new DateInterval('PT30M');

        while ($start < $end) {
            $slots[] = $start->format('H:i');
            $start->add($interval);
        }

        $cached_slots = $slots;
        return $slots;
    }

    private function cancel_appointment($data) {
        if (!isset($data['appointment_id']) || !isset($data['user_email'])) {
            return array('error' => 'Appointment ID and email required');
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'appointments';
        
        $result = $wpdb->update(
            $table_name,
            array('status' => 'cancelled'),
            array(
                'id' => str_replace('AE', '', $data['appointment_id']),
                'email' => $data['user_email']
            ),
            array('%s'),
            array('%d', '%s')
        );

        if ($result !== false) {
            return $this->get_user_booking_data($data);
        }

        return array('error' => 'Failed to cancel appointment');
    }

    private function reschedule_appointment($data) {
        if (!isset($data['appointment_id']) || !isset($data['new_date']) || !isset($data['new_time'])) {
            return array('error' => 'Missing required data');
        }

        $new_datetime = $data['new_date'] . ' ' . $data['new_time'] . ':00';
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'appointments';
        
        // Get current appointment date for original_date tracking
        $current_apt = $wpdb->get_row($wpdb->prepare(
            "SELECT appointment_date, original_date FROM $table_name WHERE id = %d AND email = %s",
            str_replace(['APT-' . date('Y') . '-', 'AE'], '', $data['appointment_id']),
            $data['user_email']
        ));
        
        $original_date = $current_apt->original_date ?? $current_apt->appointment_date;
        
        $result = $wpdb->update(
            $table_name,
            array(
                'appointment_date' => $new_datetime,
                'rescheduled_at' => current_time('mysql'),
                'original_date' => $original_date
            ),
            array(
                'id' => str_replace(['APT-' . date('Y') . '-', 'AE'], '', $data['appointment_id']),
                'email' => $data['user_email']
            ),
            array('%s', '%s', '%s'),
            array('%d', '%s')
        );

        if ($result !== false) {
            return $this->get_user_booking_data($data);
        }

        return array('error' => 'Failed to reschedule appointment');
    }

    private function handle_slot_selection($data) {
        if (!isset($data['date'], $data['time'], $data['employee_id'], $data['client_id'])) {
            return array('error' => 'Missing required parameters');
        }
        
        $date = sanitize_text_field($data['date']);
        $time = sanitize_text_field($data['time']);
        $employee_id = intval($data['employee_id']);
        $client_id = sanitize_text_field($data['client_id']);
        
        error_log('[Heartbeat] Slot selection - Date: ' . $date . ', Time: ' . $time . ', Employee: ' . $employee_id . ', Client: ' . $client_id);
        
        // Check if slot is already booked
        global $wpdb;
        $datetime = $date . ' ' . $time . ':00';
        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}appointments 
             WHERE appointment_date = %s AND employee_id = %d AND status IN ('confirmed', 'created')",
            $datetime, $employee_id
        ));
        
        if ($count > 0) {
            error_log('[Heartbeat] Slot already booked');
            return array('error' => 'Slot already booked', 'status' => 'booked');
        }
        
        // Store selection in Redis or fallback to transients
        if ($this->redis->is_enabled()) {
            $this->redis->set_active_selection($date, $employee_id, $time, $client_id);
            error_log('[Heartbeat] Stored selection in Redis');
        } else {
            // Fallback to transients
            $key = "appointease_active_{$date}_{$employee_id}";
            $selections = get_transient($key) ?: array();
            $selections[$time] = array('timestamp' => time(), 'client_id' => $client_id);
            set_transient($key, $selections, 300);
            error_log('[Heartbeat] Stored selection in transients');
        }
        
        return array('success' => true, 'status' => 'selected', 'broadcast' => true);
    }
    
    private function handle_slot_deselection($data) {
        if (!isset($data['date'], $data['time'], $data['employee_id'])) {
            return array('error' => 'Missing required parameters');
        }
        
        $date = sanitize_text_field($data['date']);
        $time = sanitize_text_field($data['time']);
        $employee_id = intval($data['employee_id']);
        
        error_log('[Heartbeat] Slot deselection - Date: ' . $date . ', Time: ' . $time . ', Employee: ' . $employee_id);
        
        // Remove selection from Redis or transients
        if ($this->redis->is_enabled()) {
            $key = "appointease_active_{$date}_{$employee_id}_{$time}";
            $this->redis->delete_lock($key);
            error_log('[Heartbeat] Removed selection from Redis');
        } else {
            // Fallback to transients
            $key = "appointease_active_{$date}_{$employee_id}";
            $selections = get_transient($key) ?: array();
            unset($selections[$time]);
            if (empty($selections)) {
                delete_transient($key);
            } else {
                set_transient($key, $selections, 300);
            }
            error_log('[Heartbeat] Removed selection from transients');
        }
        
        return array('success' => true, 'broadcast' => true);
    }
    
    private function confirm_booking($data) {
        // Validate required fields
        $required_fields = ['firstName', 'lastName', 'email', 'phone', 'service_id', 'staff_id', 'date', 'time', 'client_id'];
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                return array('error' => ucfirst($field) . ' is required');
            }
        }

        // Server-side validation
        $validation_result = $this->validate_booking_data($data);
        if (!$validation_result['is_valid']) {
            return $validation_result;
        }

        global $wpdb;
        $wpdb->query('START TRANSACTION');
        
        try {
            $appointment_datetime = $data['date'] . ' ' . $data['time'] . ':00';
            
            // Lock and check slot availability
            $conflict = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}appointments 
                 WHERE appointment_date = %s AND staff_id = %d AND status IN ('confirmed', 'created') 
                 FOR UPDATE",
                $appointment_datetime, intval($data['staff_id'])
            ));
            
            if ($conflict) {
                $wpdb->query('ROLLBACK');
                return array('error' => 'Time slot is no longer available');
            }
            
            // Insert booking
            $result = $wpdb->insert(
                $wpdb->prefix . 'appointments',
                array(
                    'name' => $data['firstName'] . ' ' . $data['lastName'],
                    'email' => sanitize_email($data['email']),
                    'phone' => sanitize_text_field($data['phone']),
                    'service_id' => intval($data['service_id']),
                    'staff_id' => intval($data['staff_id']),
                    'appointment_date' => $appointment_datetime,
                    'status' => 'confirmed',
                    'created_at' => current_time('mysql'),
                    'idempotency_key' => sanitize_text_field($data['client_id'])
                ),
                array('%s', '%s', '%s', '%d', '%d', '%s', '%s', '%s', '%s')
            );
            
            if ($result === false) {
                $wpdb->query('ROLLBACK');
                return array('error' => 'Failed to create booking');
            }
            
            $wpdb->query('COMMIT');
            
            // Clean up selection from Redis or transients
            if ($this->redis->is_enabled()) {
                $key = "appointease_active_{$data['date']}_{$data['staff_id']}_{$data['time']}";
                $this->redis->delete_lock($key);
            } else {
                // Fallback to transients
                $key = "appointease_active_{$data['date']}_{$data['staff_id']}";
                $selections = get_transient($key) ?: array();
                unset($selections[$data['time']]);
                if (empty($selections)) {
                    delete_transient($key);
                } else {
                    set_transient($key, $selections, 300);
                }
            }
            
            $appointment_id = 'APT-' . date('Y') . '-' . str_pad($wpdb->insert_id, 6, '0', STR_PAD_LEFT);
            
            return array(
                'booking_confirmed' => true,
                'appointment_id' => $appointment_id,
                'message' => 'Booking confirmed successfully'
            );
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return array('error' => 'Transaction failed: ' . $e->getMessage());
        }
    }
    
    private function get_debug_selections() {
        // Get all active selections from Redis
        $all_selections = array();
        $now = time();
        
        // Note: This requires Redis KEYS command which may be slow in production
        // Consider using SCAN for production environments
        if ($this->redis->is_enabled()) {
            $locks = $this->redis->get_locks_by_pattern('appointease_active_*');
            
            foreach ($locks as $lock) {
                if (isset($lock['client_id'], $lock['timestamp'])) {
                    $all_selections[] = array(
                        'client_id' => $lock['client_id'],
                        'age' => $now - $lock['timestamp'],
                        'timestamp' => $lock['timestamp']
                    );
                }
            }
        }
        
        return array(
            'selections' => $all_selections,
            'count' => count($all_selections),
            'timestamp' => $now,
            'redis_enabled' => $this->redis->is_enabled()
        );
    }
    
    private function clear_all_locks() {
        // Clear all locks from Redis
        $count = 0;
        if ($this->redis->is_enabled()) {
            $count = $this->redis->clear_all_locks();
        }
        
        // Also clear any legacy transients
        global $wpdb;
        $wpdb->query(
            "DELETE FROM {$wpdb->options} 
             WHERE option_name LIKE '_transient_appointease_active_%' 
             OR option_name LIKE '_transient_timeout_appointease_active_%'"
        );
        
        wp_cache_flush();
        
        return array(
            'success' => true,
            'message' => 'All locks cleared',
            'redis_count' => $count,
            'timestamp' => time()
        );
    }
}
