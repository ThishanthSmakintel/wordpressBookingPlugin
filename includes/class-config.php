<?php
/**
 * Configuration Management Class
 * Industry-standard centralized configuration with WordPress options fallback
 */

if (!defined('ABSPATH')) {
    exit;
}

class AppointEase_Config {
    
    private static $instance = null;
    private $options = null;
    
    /**
     * Singleton instance
     */
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->load_options();
    }
    
    /**
     * Load options from WordPress with caching
     */
    private function load_options() {
        if ($this->options === null) {
            $this->options = get_option('appointease_options', array());
        }
    }
    
    /**
     * Get configuration value with fallback
     */
    public function get($key, $default = null) {
        $this->load_options();
        return isset($this->options[$key]) ? $this->options[$key] : $default;
    }
    
    /**
     * Business Hours Configuration
     */
    public function get_slot_duration() {
        return intval($this->get('slot_duration', 60));
    }
    
    public function get_start_time() {
        return $this->get('start_time', '09:00');
    }
    
    public function get_end_time() {
        return $this->get('end_time', '17:00');
    }
    
    public function get_working_days() {
        $days = $this->get('working_days', ['1','2','3','4','5']);
        return is_array($days) ? $days : explode(',', $days);
    }
    
    public function get_advance_booking_days() {
        return intval($this->get('advance_booking', 30));
    }
    
    /**
     * Rate Limiting Configuration (Industry Standard)
     */
    public function get_rate_limit_requests() {
        return intval($this->get('rate_limit_requests', 60)); // 60 req/min default
    }
    
    public function get_rate_limit_window() {
        return intval($this->get('rate_limit_window', 60)); // 60 seconds
    }
    
    public function get_rate_limit_booking() {
        return intval($this->get('rate_limit_booking', 10)); // 10 bookings/hour
    }
    
    /**
     * Security Configuration
     */
    public function get_session_timeout() {
        return intval($this->get('session_timeout', 3600)); // 1 hour
    }
    
    public function get_otp_expiry() {
        return intval($this->get('otp_expiry', 600)); // 10 minutes
    }
    
    public function get_max_login_attempts() {
        return intval($this->get('max_login_attempts', 5));
    }
    
    /**
     * Redis Configuration
     */
    public function get_redis_lock_ttl() {
        return intval($this->get('redis_lock_ttl', 300)); // 5 minutes
    }
    
    public function get_redis_selection_ttl() {
        return intval($this->get('redis_selection_ttl', 10)); // 10 seconds
    }
    
    /**
     * Appearance Configuration
     */
    public function get_primary_color() {
        return $this->get('primary_color', '#1CBC9B');
    }
    
    public function get_button_text() {
        return $this->get('button_text', 'Book Appointment');
    }
    
    /**
     * Default Configuration Values (Industry Standards)
     */
    public static function get_defaults() {
        return array(
            // Business Hours
            'slot_duration' => 60,
            'start_time' => '09:00',
            'end_time' => '17:00',
            'working_days' => ['1','2','3','4','5'],
            'advance_booking' => 30,
            
            // Rate Limiting (OWASP Recommendations)
            'rate_limit_requests' => 60,      // General API: 60 req/min
            'rate_limit_window' => 60,
            'rate_limit_booking' => 10,       // Booking creation: 10/hour
            'rate_limit_auth' => 5,           // Auth attempts: 5/15min
            
            // Security
            'session_timeout' => 3600,
            'otp_expiry' => 600,
            'max_login_attempts' => 5,
            
            // Redis
            'redis_lock_ttl' => 300,
            'redis_selection_ttl' => 10,
            
            // Appearance
            'primary_color' => '#1CBC9B',
            'button_text' => 'Book Appointment'
        );
    }
    
    /**
     * Initialize default settings on plugin activation
     */
    public static function init_defaults() {
        $existing = get_option('appointease_options', array());
        $defaults = self::get_defaults();
        
        // Merge with existing, keeping user values
        $options = array_merge($defaults, $existing);
        update_option('appointease_options', $options);
    }
}
