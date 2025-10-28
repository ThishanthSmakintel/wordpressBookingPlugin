<?php
/**
 * Booking Queue Manager - Handles waiting lists and slot notifications
 * When a slot is locked, users can join a queue to be notified when it becomes available
 */

class Booking_Queue_Manager {
    private $table_name;
    
    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'appointease_booking_queue';
    }
    
    /**
     * Create queue table
     */
    public static function create_table() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'appointease_booking_queue';
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            email varchar(100) NOT NULL,
            name varchar(100) NOT NULL,
            phone varchar(20) DEFAULT NULL,
            date date NOT NULL,
            time time NOT NULL,
            employee_id int NOT NULL,
            service_id int NOT NULL,
            priority int DEFAULT 1,
            status enum('waiting','notified','expired','cancelled') DEFAULT 'waiting',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            notified_at datetime DEFAULT NULL,
            expires_at datetime DEFAULT NULL,
            PRIMARY KEY (id),
            KEY idx_slot (date, time, employee_id),
            KEY idx_email (email),
            KEY idx_status (status),
            KEY idx_priority (priority, created_at)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
    
    /**
     * Add user to queue for a specific slot
     */
    public function join_queue($email, $name, $phone, $date, $time, $employee_id, $service_id) {
        global $wpdb;
        
        // Check if user is already in queue for this slot
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} 
             WHERE email = %s AND date = %s AND time = %s 
             AND employee_id = %d AND status = 'waiting'",
            $email, $date, $time, $employee_id
        ));
        
        if ($existing) {
            return new WP_Error('already_queued', 'You are already in the queue for this slot');
        }
        
        // Get queue position (priority based on join time)
        $position = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) + 1 FROM {$this->table_name} 
             WHERE date = %s AND time = %s AND employee_id = %d 
             AND status = 'waiting'",
            $date, $time, $employee_id
        ));
        
        $result = $wpdb->insert(
            $this->table_name,
            [
                'email' => sanitize_email($email),
                'name' => sanitize_text_field($name),
                'phone' => sanitize_text_field($phone),
                'date' => $date,
                'time' => $time,
                'employee_id' => $employee_id,
                'service_id' => $service_id,
                'priority' => $position
            ],
            ['%s', '%s', '%s', '%s', '%s', '%d', '%d', '%d']
        );
        
        if ($result === false) {
            return new WP_Error('queue_failed', 'Failed to join queue');
        }
        
        // Send confirmation email
        $this->send_queue_confirmation($email, $name, $date, $time, $position);
        
        return [
            'success' => true,
            'queue_id' => $wpdb->insert_id,
            'position' => $position,
            'message' => "You've been added to the waiting list (position #{$position})"
        ];
    }
    
    /**
     * Notify next person in queue when slot becomes available
     */
    public function notify_next_in_queue($date, $time, $employee_id) {
        global $wpdb;
        
        // Get next person in queue
        $next_person = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} 
             WHERE date = %s AND time = %s AND employee_id = %d 
             AND status = 'waiting' 
             ORDER BY priority ASC, created_at ASC 
             LIMIT 1",
            $date, $time, $employee_id
        ));
        
        if (!$next_person) {
            return false; // No one in queue
        }
        
        // Mark as notified with 10-minute expiration
        $expires_at = date('Y-m-d H:i:s', time() + (10 * 60));
        
        $wpdb->update(
            $this->table_name,
            [
                'status' => 'notified',
                'notified_at' => current_time('mysql'),
                'expires_at' => $expires_at
            ],
            ['id' => $next_person->id],
            ['%s', '%s', '%s'],
            ['%d']
        );
        
        // Send notification email
        $this->send_slot_available_notification($next_person, $expires_at);
        
        // Update priorities for remaining queue members
        $this->update_queue_priorities($date, $time, $employee_id);
        
        return [
            'notified' => true,
            'email' => $next_person->email,
            'expires_at' => $expires_at
        ];
    }
    
    /**
     * Remove user from queue (when they book or cancel)
     */
    public function leave_queue($queue_id, $email) {
        global $wpdb;
        
        $result = $wpdb->update(
            $this->table_name,
            ['status' => 'cancelled'],
            ['id' => $queue_id, 'email' => $email],
            ['%s'],
            ['%d', '%s']
        );
        
        if ($result > 0) {
            // Update priorities for remaining members
            $queue_item = $wpdb->get_row($wpdb->prepare(
                "SELECT date, time, employee_id FROM {$this->table_name} WHERE id = %d",
                $queue_id
            ));
            
            if ($queue_item) {
                $this->update_queue_priorities($queue_item->date, $queue_item->time, $queue_item->employee_id);
            }
            
            return ['success' => true, 'message' => 'Removed from queue'];
        }
        
        return new WP_Error('not_found', 'Queue entry not found');
    }
    
    /**
     * Get queue status for a slot
     */
    public function get_queue_status($date, $time, $employee_id) {
        global $wpdb;
        
        $queue = $wpdb->get_results($wpdb->prepare(
            "SELECT email, name, priority, created_at, status 
             FROM {$this->table_name} 
             WHERE date = %s AND time = %s AND employee_id = %d 
             AND status IN ('waiting', 'notified') 
             ORDER BY priority ASC",
            $date, $time, $employee_id
        ));
        
        return [
            'total_waiting' => count($queue),
            'queue' => $queue
        ];
    }
    
    /**
     * Clean up expired notifications
     */
    public function cleanup_expired_notifications() {
        global $wpdb;
        
        $expired_count = $wpdb->query(
            "UPDATE {$this->table_name} 
             SET status = 'expired' 
             WHERE status = 'notified' AND expires_at <= NOW()"
        );
        
        if ($expired_count > 0) {
            // Notify next people in affected queues
            $affected_slots = $wpdb->get_results(
                "SELECT DISTINCT date, time, employee_id FROM {$this->table_name} 
                 WHERE status = 'expired' AND expires_at <= NOW()"
            );
            
            foreach ($affected_slots as $slot) {
                $this->notify_next_in_queue($slot->date, $slot->time, $slot->employee_id);
            }
        }
        
        return $expired_count;
    }
    
    /**
     * Update queue priorities after someone leaves
     */
    private function update_queue_priorities($date, $time, $employee_id) {
        global $wpdb;
        
        $queue_members = $wpdb->get_results($wpdb->prepare(
            "SELECT id FROM {$this->table_name} 
             WHERE date = %s AND time = %s AND employee_id = %d 
             AND status = 'waiting' 
             ORDER BY priority ASC, created_at ASC",
            $date, $time, $employee_id
        ));
        
        foreach ($queue_members as $index => $member) {
            $wpdb->update(
                $this->table_name,
                ['priority' => $index + 1],
                ['id' => $member->id],
                ['%d'],
                ['%d']
            );
        }
    }
    
    /**
     * Send queue confirmation email
     */
    private function send_queue_confirmation($email, $name, $date, $time, $position) {
        $subject = 'Added to Appointment Waiting List';
        $message = sprintf(
            "Hi %s,\n\nYou've been added to the waiting list for:\n\nDate: %s\nTime: %s\nPosition: #%d\n\nWe'll notify you if this slot becomes available.\n\nBest regards,\nAppointEase Team",
            $name,
            date('F j, Y', strtotime($date)),
            date('g:i A', strtotime($time)),
            $position
        );
        
        wp_mail($email, $subject, $message);
    }
    
    /**
     * Send slot available notification
     */
    private function send_slot_available_notification($queue_item, $expires_at) {
        $subject = 'Appointment Slot Now Available!';
        $booking_link = home_url('/book-appointment/') . '?queue_id=' . $queue_item->id;
        
        $message = sprintf(
            "Hi %s,\n\nGreat news! The appointment slot you were waiting for is now available:\n\nDate: %s\nTime: %s\n\nYou have until %s to book this slot.\n\nBook now: %s\n\nBest regards,\nAppointEase Team",
            $queue_item->name,
            date('F j, Y', strtotime($queue_item->date)),
            date('g:i A', strtotime($queue_item->time)),
            date('g:i A', strtotime($expires_at)),
            $booking_link
        );
        
        wp_mail($queue_item->email, $subject, $message);
    }
    
    /**
     * Get user's queue positions
     */
    public function get_user_queue_status($email) {
        global $wpdb;
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT date, time, priority, status, created_at, expires_at 
             FROM {$this->table_name} 
             WHERE email = %s AND status IN ('waiting', 'notified') 
             ORDER BY created_at DESC",
            $email
        ));
    }
}