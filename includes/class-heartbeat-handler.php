<?php

if (!defined('ABSPATH')) {
    exit;
}

class Appointease_Heartbeat_Handler {
    
    public function __construct() {
        add_filter('heartbeat_received', array($this, 'handle_heartbeat'), 10, 2);
        add_action('wp_enqueue_scripts', array($this, 'enqueue_heartbeat_scripts'));
        add_filter('heartbeat_nopriv_received', array($this, 'handle_heartbeat'), 10, 2);
    }

    public function enqueue_heartbeat_scripts() {
        if (is_admin()) return;
        
        wp_enqueue_script('heartbeat');
        wp_add_inline_script('heartbeat', '
            jQuery(document).ready(function($) {
                wp.heartbeat.interval(1);
            });
        ');
    }

    public function handle_heartbeat($response, $data) {
        error_log('[Heartbeat] ===== FILTER CALLED ===== Keys: ' . print_r(array_keys($data), true));
        error_log('[Heartbeat] Full data: ' . print_r($data, true));
        
        // Always add a test response to verify filter is working
        $response['appointease_test'] = 'heartbeat_working';
        
        try {
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
                
                error_log('[Heartbeat] Polling for date: ' . $date . ', employee: ' . $employee_id . ', client: ' . $client_id . ', time: ' . $selected_time);
                
                // Get booked slots from database
                global $wpdb;
                $booked_slots = $wpdb->get_col($wpdb->prepare(
                    "SELECT TIME_FORMAT(TIME(appointment_date), '%%H:%%i') FROM {$wpdb->prefix}appointments 
                     WHERE DATE(appointment_date) = %s AND employee_id = %d AND status IN ('confirmed', 'created')",
                    $date, $employee_id
                ));
                
                // Get locked slots from database (exclude user's own locks)
                $locks_table = $wpdb->prefix . 'appointease_slot_locks';
                
                // Clean expired locks first
                $wpdb->query("DELETE FROM {$locks_table} WHERE expires_at < UTC_TIMESTAMP()");
                
                // Get user identifier to exclude their locks
                $user_ip = $_SERVER['REMOTE_ADDR'];
                $user_agent = $_SERVER['HTTP_USER_AGENT'];
                $user_id = md5($user_ip . $user_agent);
                
                // Simple SQL query: exclude locks with current user_id
                $locked_slots = $wpdb->get_col($wpdb->prepare(
                    "SELECT TIME_FORMAT(time, '%%H:%%i') FROM {$locks_table} 
                     WHERE date = %s AND employee_id = %d AND expires_at > UTC_TIMESTAMP() AND user_id != %s",
                    $date, $employee_id, $user_id
                ));
                
                // Get active selections from transient
                $key = "appointease_active_{$date}_{$employee_id}";
                $selections = get_transient($key) ?: array();
                
                error_log('[Heartbeat] Found selections: ' . print_r($selections, true));
                error_log('[Heartbeat] Booked slots: ' . print_r($booked_slots, true));
                error_log('[Heartbeat] Locked slots: ' . print_r($locked_slots, true));
                
                // Refresh timestamp for current user's selection
                $now = time();
                if ($client_id && $selected_time && isset($selections[$selected_time])) {
                    $sel_data = $selections[$selected_time];
                    if (is_array($sel_data) && isset($sel_data['client_id']) && $sel_data['client_id'] === $client_id) {
                        $selections[$selected_time]['timestamp'] = $now;
                        set_transient($key, $selections, 300);
                        error_log('[Heartbeat] Refreshed timestamp for ' . $selected_time);
                    }
                }
                
                // Clean expired selections (older than 5 seconds)
                $active_times = array();
                foreach ($selections as $time => $sel_data) {
                    $timestamp = is_array($sel_data) ? ($sel_data['timestamp'] ?? 0) : $sel_data;
                    if ($now - $timestamp < 5) {
                        $active_times[] = $time;
                    }
                }
                
                error_log('[Heartbeat] Active times: ' . print_r($active_times, true));
                $response['appointease_active_selections'] = $active_times;
                $response['appointease_booked_slots'] = $booked_slots;
                $response['appointease_locked_slots'] = $locked_slots;
            }
        } catch (Exception $e) {
            error_log('[Heartbeat] Error in poll handler: ' . $e->getMessage());
        }
        
        if (!isset($data['appointease_booking'])) {
            return $response;
        }

        try {
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
        } catch (Exception $e) {
            error_log('[Heartbeat] Error in booking handler: ' . $e->getMessage());
            $response['appointease_booking'] = array('error' => 'Server error: ' . $e->getMessage());
        }
        
        // Handle debug requests
        if (isset($data['appointease_debug'])) {
            try {
                $debug_data = $data['appointease_debug'];
                switch ($debug_data['action']) {
                    case 'get_selections':
                        $response['appointease_debug'] = $this->get_debug_selections();
                        break;
                    case 'clear_locks':
                        $response['appointease_debug'] = $this->clear_all_locks();
                        break;
                }
            } catch (Exception $e) {
                error_log('[Heartbeat] Error in debug handler: ' . $e->getMessage());
                $response['appointease_debug'] = array('error' => $e->getMessage());
            }
        }

        error_log('[Heartbeat] ===== RETURNING RESPONSE ===== ' . print_r(array_keys($response), true));
        return $response;
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
        
        // Check if slot is already booked
        global $wpdb;
        $datetime = $date . ' ' . $time . ':00';
        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}appointments 
             WHERE appointment_date = %s AND employee_id = %d AND status IN ('confirmed', 'created')",
            $datetime, $employee_id
        ));
        
        if ($count > 0) {
            return array('error' => 'Slot already booked', 'status' => 'booked');
        }
        
        // Store selection in transient
        $key = "appointease_active_{$date}_{$employee_id}";
        $selections = get_transient($key) ?: array();
        $selections[$time] = array('timestamp' => time(), 'client_id' => $client_id);
        set_transient($key, $selections, 300);
        
        return array('success' => true, 'status' => 'selected');
    }
    
    private function handle_slot_deselection($data) {
        if (!isset($data['date'], $data['time'], $data['employee_id'])) {
            return array('error' => 'Missing required parameters');
        }
        
        $date = sanitize_text_field($data['date']);
        $time = sanitize_text_field($data['time']);
        $employee_id = intval($data['employee_id']);
        
        // Remove selection from transient
        $key = "appointease_active_{$date}_{$employee_id}";
        $selections = get_transient($key) ?: array();
        unset($selections[$time]);
        
        if (empty($selections)) {
            delete_transient($key);
        } else {
            set_transient($key, $selections, 300);
        }
        
        return array('success' => true);
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
            
            // Clean up selection
            $key = "appointease_active_{$data['date']}_{$data['staff_id']}";
            $selections = get_transient($key) ?: array();
            unset($selections[$data['time']]);
            if (empty($selections)) {
                delete_transient($key);
            } else {
                set_transient($key, $selections, 300);
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
        global $wpdb;
        
        // Get all transients matching appointease_active_*
        $transients = $wpdb->get_results(
            "SELECT option_name, option_value FROM {$wpdb->options} 
             WHERE option_name LIKE '_transient_appointease_active_%'"
        );
        
        $selections = array();
        $now = time();
        
        foreach ($transients as $transient) {
            $key = str_replace('_transient_', '', $transient->option_name);
            $data = maybe_unserialize($transient->option_value);
            
            if (preg_match('/appointease_active_([^_]+)_(.+)/', $key, $matches)) {
                $date = $matches[1];
                $employee_id = $matches[2];
                
                if (is_array($data)) {
                    foreach ($data as $time => $sel_data) {
                        $timestamp = is_array($sel_data) ? ($sel_data['timestamp'] ?? 0) : $sel_data;
                        $age = $now - $timestamp;
                        
                        // Auto-clean expired (>5s)
                        if ($age > 5) {
                            unset($data[$time]);
                        } else {
                            $selections[] = array(
                                'date' => $date,
                                'time' => $time,
                                'employee_id' => $employee_id,
                                'age' => $age,
                                'client_id' => is_array($sel_data) ? ($sel_data['client_id'] ?? 'unknown') : 'legacy'
                            );
                        }
                    }
                    
                    // Update or delete transient
                    if (empty($data)) {
                        delete_transient($key);
                    } else {
                        set_transient($key, $data, 300);
                    }
                }
            }
        }
        
        return array(
            'selections' => $selections,
            'count' => count($selections),
            'timestamp' => $now
        );
    }
    
    private function clear_all_locks() {
        global $wpdb;
        
        // Delete all appointease transients
        $wpdb->query(
            "DELETE FROM {$wpdb->options} 
             WHERE option_name LIKE '_transient_appointease_active_%' 
             OR option_name LIKE '_transient_timeout_appointease_active_%'"
        );
        
        wp_cache_flush();
        
        return array(
            'success' => true,
            'message' => 'All locks cleared',
            'timestamp' => time()
        );
    }
}
