<?php
/**
 * Slot Lock Manager - Enhanced with auto-expiration and rate limiting
 * Prevents race conditions and manages temporary slot reservations
 */

class Slot_Lock_Manager {
    private $table_name;
    private $lock_duration = 30; // seconds
    private $rate_limit = 5; // max locks per minute per IP
    
    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'appointease_slot_locks';
    }
    
    /**
     * Create locks table on activation
     */
    public static function create_table() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'appointease_slot_locks';
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            client_id varchar(64) NOT NULL,
            date date NOT NULL,
            time time NOT NULL,
            employee_id int NOT NULL,
            user_ip varchar(45) NOT NULL,
            user_id varchar(100) DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            expires_at datetime NOT NULL,
            status enum('active','expired','released') DEFAULT 'active',
            PRIMARY KEY (id),
            UNIQUE KEY unique_slot (date, time, employee_id),
            KEY idx_expires (expires_at),
            KEY idx_client (client_id),
            KEY idx_user_ip (user_ip, created_at)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
    
    /**
     * Lock a time slot with rate limiting and auto-expiration
     */
    public function lock_slot($date, $time, $employee_id, $user_id = null) {
        global $wpdb;
        
        // Rate limiting check
        $user_ip = $this->get_client_ip();
        if (!$this->check_rate_limit($user_ip)) {
            return new WP_Error('rate_limit', 'Too many lock attempts. Please wait.');
        }
        
        // Clean expired locks first
        $this->cleanup_expired_locks();
        
        // Check if slot is already locked
        $existing_lock = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} 
             WHERE date = %s AND time = %s AND employee_id = %d 
             AND status = 'active' AND expires_at > NOW()",
            $date, $time, $employee_id
        ));
        
        if ($existing_lock) {
            return new WP_Error('slot_locked', 'Slot is currently locked by another user', [
                'locked_by' => $existing_lock->client_id,
                'expires_at' => $existing_lock->expires_at
            ]);
        }
        
        // Generate unique client ID
        $client_id = $this->generate_client_id();
        $expires_at = date('Y-m-d H:i:s', time() + $this->lock_duration);
        
        // Create lock
        $result = $wpdb->insert(
            $this->table_name,
            [
                'client_id' => $client_id,
                'date' => $date,
                'time' => $time,
                'employee_id' => $employee_id,
                'user_ip' => $user_ip,
                'user_id' => $user_id,
                'expires_at' => $expires_at,
                'status' => 'active'
            ],
            ['%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s']
        );
        
        if ($result === false) {
            return new WP_Error('lock_failed', 'Failed to create slot lock');
        }
        
        // Log transaction for debugging
        $this->log_transaction('lock_created', [
            'client_id' => $client_id,
            'slot' => "$date $time",
            'employee_id' => $employee_id,
            'user_ip' => $user_ip,
            'expires_at' => $expires_at
        ]);
        
        return [
            'success' => true,
            'client_id' => $client_id,
            'expires_at' => $expires_at,
            'expires_in' => $this->lock_duration
        ];
    }
    
    /**
     * Release a slot lock
     */
    public function unlock_slot($client_id) {
        global $wpdb;
        
        $result = $wpdb->update(
            $this->table_name,
            ['status' => 'released'],
            ['client_id' => $client_id, 'status' => 'active'],
            ['%s'],
            ['%s', '%s']
        );
        
        if ($result > 0) {
            $this->log_transaction('lock_released', ['client_id' => $client_id]);
            return ['success' => true, 'message' => 'Slot unlocked successfully'];
        }
        
        return new WP_Error('unlock_failed', 'Lock not found or already released');
    }
    
    /**
     * Validate if client still holds the lock
     */
    public function validate_lock($client_id, $date, $time, $employee_id) {
        global $wpdb;
        
        $lock = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} 
             WHERE client_id = %s AND date = %s AND time = %s 
             AND employee_id = %d AND status = 'active' AND expires_at > NOW()",
            $client_id, $date, $time, $employee_id
        ));
        
        return $lock !== null;
    }
    
    /**
     * Get all active locks for a date/employee (for real-time updates)
     */
    public function get_active_locks($date, $employee_id) {
        global $wpdb;
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT time, client_id, expires_at FROM {$this->table_name} 
             WHERE date = %s AND employee_id = %d 
             AND status = 'active' AND expires_at > NOW()
             ORDER BY time",
            $date, $employee_id
        ));
    }
    
    /**
     * Rate limiting check
     */
    private function check_rate_limit($user_ip) {
        global $wpdb;
        
        $recent_locks = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table_name} 
             WHERE user_ip = %s AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)",
            $user_ip
        ));
        
        return $recent_locks < $this->rate_limit;
    }
    
    /**
     * Clean up expired locks
     */
    public function cleanup_expired_locks() {
        global $wpdb;
        
        $expired_count = $wpdb->query(
            "UPDATE {$this->table_name} 
             SET status = 'expired' 
             WHERE status = 'active' AND expires_at <= NOW()"
        );
        
        if ($expired_count > 0) {
            $this->log_transaction('cleanup_expired', ['count' => $expired_count]);
        }
        
        return $expired_count;
    }
    
    /**
     * Generate unique client ID
     */
    private function generate_client_id() {
        return hash('sha256', uniqid() . microtime(true) . wp_generate_password(16, false));
    }
    
    /**
     * Get client IP address
     */
    private function get_client_ip() {
        $ip_keys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }
    
    /**
     * Transaction logging for debugging
     */
    private function log_transaction($action, $data = []) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf(
                '[SlotLock] %s: %s',
                $action,
                json_encode($data)
            ));
        }
    }
    
    /**
     * Get lock statistics for monitoring
     */
    public function get_lock_stats() {
        global $wpdb;
        
        $stats = $wpdb->get_row(
            "SELECT 
                COUNT(*) as total_locks,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_locks,
                SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_locks,
                SUM(CASE WHEN status = 'released' THEN 1 ELSE 0 END) as released_locks,
                AVG(TIMESTAMPDIFF(SECOND, created_at, 
                    CASE WHEN status = 'released' THEN expires_at ELSE NOW() END
                )) as avg_lock_duration
             FROM {$this->table_name} 
             WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)",
            ARRAY_A
        );
        
        return $stats;
    }
}