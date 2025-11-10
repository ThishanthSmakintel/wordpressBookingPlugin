<?php

/**
 * Atomic Booking Class - Industry Standard Double Booking Prevention
 * Implements enterprise-grade race condition protection with multiple layers
 */
class Atomic_Booking {
    
    private static $instance = null;
    private $wpdb;
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
    }
    
    /**
     * Create appointment with atomic transaction and conflict prevention
     * Industry standard: Calendly/Acuity pattern with row-level locking
     */
    public function create_appointment_atomic($data) {
        // Validate required fields
        if (empty($data['appointment_date']) || empty($data['employee_id'])) {
            return new WP_Error('missing_fields', 'Required fields missing: appointment_date, employee_id', ['status' => 400]);
        }
        
        // Generate idempotency key for duplicate prevention
        $idempotency_key = $data['idempotency_key'] ?? $this->generate_idempotency_key($data);
        
        // Check for duplicate submission
        if ($this->is_duplicate_submission($idempotency_key)) {
            return new WP_Error('duplicate_submission', 'Duplicate booking attempt detected', ['status' => 409]);
        }
        
        // Start atomic transaction
        $this->wpdb->query('START TRANSACTION');
        
        try {
            // Layer 1: Pessimistic locking - Lock specific time slot
            $conflict = $this->check_slot_with_lock($data['appointment_date'], $data['employee_id']);
            
            if ($conflict) {
                $this->wpdb->query('ROLLBACK');
                
                // Broadcast conflict to WebSocket clients
                $this->broadcast_slot_conflict($data);
                
                return new WP_Error('slot_taken', 'Time slot is no longer available', [
                    'status' => 409,
                    'data' => [
                        'conflict_time' => $data['appointment_date'],
                        'suggested_slots' => $this->get_suggested_slots($data)
                    ]
                ]);
            }
            
            // Layer 2: Business rules validation
            $validation = $this->validate_booking_rules($data);
            if (is_wp_error($validation)) {
                $this->wpdb->query('ROLLBACK');
                return $validation;
            }
            
            // Layer 2.5: Final slot check (catch race conditions)
            $final_check = $this->wpdb->get_var($this->wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->wpdb->prefix}appointments 
                 WHERE appointment_date = %s AND employee_id = %d AND status IN ('confirmed', 'created')",
                $data['appointment_date'], $data['employee_id']
            ));
            
            if ($final_check > 0) {
                $this->wpdb->query('ROLLBACK');
                return new WP_Error('slot_taken', 'Slot was just booked by another user', ['status' => 409]);
            }
            
            // Layer 3: Create appointment atomically
            $appointment_id = $this->insert_appointment_atomic($data, $idempotency_key);
            
            if (!$appointment_id) {
                $this->wpdb->query('ROLLBACK');
                $db_error = $this->wpdb->last_error ?: 'Unknown database error';
                error_log('[AtomicBooking] Insert failed: ' . $db_error);
                return new WP_Error('insert_failed', 'Failed to create appointment: ' . $db_error, ['status' => 500]);
            }
            
            // Layer 4: Generate strong ID and update
            $strong_id = sprintf('APT-%d-%06d', date('Y'), $appointment_id);
            $update_result = $this->wpdb->update(
                $this->wpdb->prefix . 'appointments',
                ['strong_id' => $strong_id],
                ['id' => $appointment_id],
                ['%s'], ['%d']
            );
            
            // WordPress wpdb->update returns false on error, 0 if no rows affected, or number of rows updated
            // We only care if it's false (error), not 0 (no change needed)
            if ($update_result === false && !empty($this->wpdb->last_error)) {
                $this->wpdb->query('ROLLBACK');
                error_log('[AtomicBooking] Update failed: ' . $this->wpdb->last_error . ' | ID: ' . $appointment_id . ' | Strong ID: ' . $strong_id);
                return new WP_Error('update_failed', 'Failed to generate appointment ID: ' . $this->wpdb->last_error, ['status' => 500]);
            }
            
            // Commit transaction
            $this->wpdb->query('COMMIT');
            
            // Layer 5: Post-commit actions (non-blocking)
            $this->post_booking_actions($appointment_id, $strong_id, $data);
            
            return [
                'success' => true,
                'appointment_id' => $appointment_id,
                'strong_id' => $strong_id,
                'message' => 'Appointment booked successfully'
            ];
            
        } catch (Exception $e) {
            $this->wpdb->query('ROLLBACK');
            error_log('[AtomicBooking] Transaction failed: ' . $e->getMessage());
            return new WP_Error('transaction_failed', 'Booking transaction failed', ['status' => 500]);
        }
    }
    
    /**
     * Check slot availability with row-level locking (Pessimistic locking)
     */
    private function check_slot_with_lock($appointment_date, $employee_id) {
        $table = $this->wpdb->prefix . 'appointments';
        
        // Use FOR UPDATE to lock the row during transaction
        $conflict = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT id, strong_id, name, email FROM {$table} 
             WHERE appointment_date = %s AND employee_id = %d AND status IN ('confirmed', 'created')
             FOR UPDATE",
            $appointment_date, $employee_id
        ));
        
        return $conflict;
    }
    
    /**
     * Validate business rules before booking
     */
    private function validate_booking_rules($data) {
        // Validate required fields
        if (empty($data['appointment_date'])) {
            return new WP_Error('missing_date', 'Appointment date is required', ['status' => 400]);
        }
        
        // 1. Past date validation (allow 1 minute buffer for processing time)
        if (strtotime($data['appointment_date']) < (time() - 60)) {
            return new WP_Error('past_date', 'Cannot book appointments in the past', ['status' => 400]);
        }
        
        // 2. Advance booking limit
        $max_advance = strtotime('+30 days');
        if (strtotime($data['appointment_date']) > $max_advance) {
            return new WP_Error('too_far_advance', 'Cannot book more than 30 days in advance', ['status' => 400]);
        }
        
        // 3. Working hours validation
        if (!$this->is_within_business_hours($data['appointment_date'])) {
            return new WP_Error('outside_hours', 'Appointment must be within business hours', ['status' => 400]);
        }
        
        // 4. Working day validation
        if (!$this->is_working_day($data['appointment_date'])) {
            return new WP_Error('non_working_day', 'Appointment must be on a working day', ['status' => 400]);
        }
        
        // 5. Rate limiting per email
        if ($this->is_rate_limited($data['email'])) {
            return new WP_Error('rate_limited', 'Too many booking attempts. Please wait.', ['status' => 429]);
        }
        
        return true;
    }
    
    /**
     * Insert appointment with atomic operation
     */
    private function insert_appointment_atomic($data, $idempotency_key) {
        global $wpdb;
        $table = $wpdb->prefix . 'appointments';
        
        // Simple insert with all fields
        $insert_data = [
            'name' => sanitize_text_field($data['name']),
            'email' => sanitize_email($data['email']),
            'phone' => sanitize_text_field($data['phone'] ?? ''),
            'appointment_date' => $data['appointment_date'],
            'status' => 'confirmed',
            'service_id' => intval($data['service_id']),
            'employee_id' => intval($data['employee_id']),
            'idempotency_key' => $idempotency_key,
            'created_at' => current_time('mysql')
        ];
        
        $format = ['%s', '%s', '%s', '%s', '%s', '%d', '%d', '%s', '%s'];
        
        $result = $wpdb->insert($table, $insert_data, $format);
        
        if ($result === false) {
            return false;
        }
        
        return $wpdb->insert_id ?: $wpdb->get_var('SELECT LAST_INSERT_ID()');
    }
    
    /**
     * Generate unique idempotency key for duplicate prevention
     */
    private function generate_idempotency_key($data) {
        $key_data = [
            $data['email'] ?? 'unknown',
            $data['appointment_date'] ?? date('Y-m-d H:i:s'),
            $data['employee_id'] ?? 0,
            date('Y-m-d H:i')  // Include minute for uniqueness
        ];
        return hash('sha256', implode('|', $key_data));  // SHA256 = exactly 64 chars
    }
    
    /**
     * Check for duplicate submission using idempotency key
     */
    private function is_duplicate_submission($idempotency_key) {
        $table = $this->wpdb->prefix . 'appointments';
        
        $existing = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT id FROM {$table} WHERE idempotency_key = %s AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)",
            $idempotency_key
        ));
        
        return $existing !== null;
    }
    
    /**
     * Check if appointment is within business hours
     */
    private function is_within_business_hours($datetime) {
        $time = date('H:i', strtotime($datetime));
        $day = strtolower(date('l', strtotime($datetime)));
        
        $options = get_option('appointease_options', []);
        $start_time = $options['start_time'] ?? '09:00';
        $end_time = $options['end_time'] ?? '17:00';
        
        return $time >= $start_time && $time < $end_time;
    }
    
    /**
     * Check if date is a working day
     */
    private function is_working_day($datetime) {
        $day_of_week = date('w', strtotime($datetime));
        $options = get_option('appointease_options', []);
        $working_days = $options['working_days'] ?? ['1','2','3','4','5'];
        
        return in_array((string)$day_of_week, $working_days);
    }
    
    /**
     * Rate limiting check per email
     */
    private function is_rate_limited($email) {
        $table = $this->wpdb->prefix . 'appointments';
        
        $recent_count = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE email = %s AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)",
            $email
        ));
        
        return $recent_count >= 3; // Max 3 bookings per 5 minutes
    }
    
    /**
     * Get suggested alternative time slots
     */
    private function get_suggested_slots($data) {
        if (empty($data['appointment_date']) || empty($data['employee_id'])) {
            return [];
        }
        
        $date = date('Y-m-d', strtotime($data['appointment_date']));
        $employee_id = $data['employee_id'];
        
        // Get all booked slots for the day
        $table = $this->wpdb->prefix . 'appointments';
        $booked_times = $this->wpdb->get_col($this->wpdb->prepare(
            "SELECT TIME_FORMAT(appointment_date, '%%H:%%i') FROM {$table} 
             WHERE DATE(appointment_date) = %s AND employee_id = %d AND status IN ('confirmed', 'created')",
            $date, $employee_id
        ));
        
        // Generate available slots
        $all_slots = $this->generate_time_slots();
        $available_slots = array_diff($all_slots, $booked_times);
        
        return array_values(array_slice($available_slots, 0, 3)); // Return first 3 available
    }
    
    /**
     * Generate time slots based on business hours
     */
    private function generate_time_slots() {
        $options = get_option('appointease_options', []);
        $start_time = $options['start_time'] ?? '09:00';
        $end_time = $options['end_time'] ?? '17:00';
        $duration = $options['slot_duration'] ?? 60;
        
        $slots = [];
        $start = strtotime($start_time);
        $end = strtotime($end_time);
        
        for ($time = $start; $time < $end; $time += ($duration * 60)) {
            $slots[] = date('H:i', $time);
        }
        
        return $slots;
    }
    
    /**
     * Broadcast slot conflict to WebSocket clients
     */
    private function broadcast_slot_conflict($data) {
        $conflict_data = [
            'type' => 'slot_taken',
            'date' => date('Y-m-d', strtotime($data['appointment_date'])),
            'time' => date('H:i', strtotime($data['appointment_date'])),
            'employee_id' => $data['employee_id'],
            'timestamp' => time()
        ];
        
        // Store in transient for polling clients
        $updates = get_transient('appointease_realtime_updates') ?: [];
        $updates[] = $conflict_data;
        $updates = array_slice($updates, -50); // Keep last 50 updates
        set_transient('appointease_realtime_updates', $updates, 300); // 5 minutes
        
        // Broadcast via WebSocket if available
        $broadcaster_file = plugin_dir_path(dirname(__FILE__)) . 'includes/class-websocket-broadcaster.php';
        if (file_exists($broadcaster_file)) {
            require_once $broadcaster_file;
            if (class_exists('WebSocket_Broadcaster')) {
                $broadcaster = WebSocket_Broadcaster::getInstance();
                $broadcaster->broadcast_slot_conflict($conflict_data);
            }
        }
    }
    
    /**
     * Post-booking actions (non-blocking)
     */
    private function post_booking_actions($appointment_id, $strong_id, $data) {
        // Send confirmation email
        $this->send_confirmation_email($data, $strong_id);
        
        // Trigger webhooks
        $this->trigger_webhooks($appointment_id, $strong_id, $data);
        
        // Update cache
        $this->update_availability_cache($data);
        
        // Log booking for analytics
        $this->log_booking_event($appointment_id, $data);
    }
    
    /**
     * Send confirmation email
     */
    private function send_confirmation_email($data, $strong_id) {
        $subject = 'Appointment Confirmation - ' . $strong_id;
        $message = sprintf(
            "Dear %s,\n\nYour appointment has been confirmed:\n\nAppointment ID: %s\nDate & Time: %s\n\nThank you!",
            $data['name'],
            $strong_id,
            date('F j, Y \a\t g:i A', strtotime($data['appointment_date']))
        );
        
        wp_mail($data['email'], $subject, $message);
    }
    
    /**
     * Trigger webhooks for integrations
     */
    private function trigger_webhooks($appointment_id, $strong_id, $data) {
        $webhook_data = [
            'event' => 'appointment.created',
            'appointment_id' => $strong_id,
            'customer' => [
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? ''
            ],
            'appointment' => [
                'date' => $data['appointment_date'],
                'service_id' => $data['service_id'],
                'employee_id' => $data['employee_id']
            ],
            'timestamp' => current_time('mysql')
        ];
        
        // WordPress action hook
        do_action('appointease_appointment_created', $webhook_data);
        
        // External webhook
        $webhook_url = get_option('appointease_webhook_url');
        if (!empty($webhook_url)) {
            wp_remote_post($webhook_url, [
                'headers' => ['Content-Type' => 'application/json'],
                'body' => json_encode($webhook_data),
                'timeout' => 15
            ]);
        }
    }
    
    /**
     * Update availability cache
     */
    private function update_availability_cache($data) {
        $cache_key = 'availability_' . date('Y-m-d', strtotime($data['appointment_date'])) . '_' . $data['employee_id'];
        wp_cache_delete($cache_key, 'appointease');
    }
    
    /**
     * Log booking event for analytics
     */
    private function log_booking_event($appointment_id, $data) {
        error_log(sprintf(
            '[AtomicBooking] Appointment created: ID=%d, Email=%s, Date=%s',
            $appointment_id,
            $data['email'],
            $data['appointment_date']
        ));
    }
}