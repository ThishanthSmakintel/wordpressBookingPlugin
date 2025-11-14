<?php
/**
 * Security Helper Class
 * Centralized security functions for the plugin
 */

if (!defined('ABSPATH')) {
    exit;
}

class AppointEase_Security_Helper {
    
    /**
     * Verify admin capability
     */
    public static function verify_admin() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.', 'appointease'));
        }
    }
    
    /**
     * Verify AJAX request with nonce and capability
     */
    public static function verify_ajax_admin($nonce_action = 'appointease_nonce') {
        check_ajax_referer($nonce_action, '_wpnonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Unauthorized access.', 'appointease'));
            exit;
        }
    }
    
    /**
     * Sanitize array of integers
     */
    public static function sanitize_int_array($array) {
        if (!is_array($array)) {
            return [];
        }
        return array_map('intval', array_filter($array, 'is_numeric'));
    }
    
    /**
     * Safe database error handling
     */
    public static function handle_db_error($wpdb, $context = '') {
        if ($wpdb->last_error) {
            error_log(sprintf('AppointEase DB Error [%s]: %s', $context, $wpdb->last_error));
            
            if (wp_doing_ajax()) {
                wp_send_json_error(__('Database operation failed.', 'appointease'));
                exit;
            }
            
            wp_die(__('A database error occurred. Please contact support.', 'appointease'));
        }
    }
    
    /**
     * Safe AJAX error response
     */
    public static function ajax_db_error($wpdb, $context = '') {
        if ($wpdb->last_error) {
            error_log(sprintf('AppointEase DB Error [%s]: %s', $context, $wpdb->last_error));
            wp_send_json_error(__('Database operation failed.', 'appointease'));
            exit;
        }
    }
    
    /**
     * Check database operation result and handle errors
     */
    public static function check_db_result($result, $wpdb, $context = '', $is_ajax = false) {
        if ($result === false && $wpdb->last_error) {
            error_log(sprintf('AppointEase DB Error [%s]: %s', $context, $wpdb->last_error));
            
            if ($is_ajax || wp_doing_ajax()) {
                wp_send_json_error(__('Database operation failed.', 'appointease'));
                exit;
            }
            
            return new WP_Error('db_error', __('Database operation failed.', 'appointease'));
        }
        
        return $result;
    }
    
    /**
     * Safe Redis operation with error handling
     */
    public static function safe_redis_operation($callback, $fallback = null) {
        try {
            return $callback();
        } catch (Exception $e) {
            error_log('AppointEase Redis Error: ' . $e->getMessage());
            
            if ($fallback && is_callable($fallback)) {
                return $fallback();
            }
            
            return false;
        }
    }
    
    /**
     * Validate email with additional checks
     */
    public static function validate_email($email) {
        $email = sanitize_email($email);
        if (!is_email($email)) {
            return false;
        }
        return $email;
    }
    
    /**
     * Validate datetime
     */
    public static function validate_datetime($datetime) {
        $datetime = sanitize_text_field($datetime);
        $timestamp = strtotime($datetime);
        if ($timestamp === false || $timestamp <= time()) {
            return false;
        }
        return $datetime;
    }
    
    /**
     * Generate secure OTP
     */
    public static function generate_secure_otp($length = 6) {
        try {
            return sprintf('%0' . $length . 'd', random_int(0, pow(10, $length) - 1));
        } catch (Exception $e) {
            error_log('AppointEase: Failed to generate secure OTP - ' . $e->getMessage());
            return sprintf('%0' . $length . 'd', mt_rand(0, pow(10, $length) - 1));
        }
    }
    
    /**
     * Sanitize log output
     */
    public static function sanitize_log($data) {
        if (is_array($data) || is_object($data)) {
            $data = json_encode($data);
        }
        return str_replace(["\n", "\r"], '', (string)$data);
    }
    
    /**
     * Log error with context
     */
    public static function log_error($message, $context = [], $level = 'error') {
        $log_message = sprintf('[AppointEase] %s', $message);
        
        if (!empty($context)) {
            $log_message .= ' | Context: ' . self::sanitize_log($context);
        }
        
        error_log($log_message);
    }
    
    /**
     * Validate and handle API response
     */
    public static function validate_api_response($data, $required_fields = []) {
        if (!is_array($data)) {
            return new WP_Error('invalid_data', 'Invalid data format');
        }
        
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return new WP_Error('missing_field', sprintf('Required field missing: %s', $field));
            }
        }
        
        return true;
    }
}

/**
 * Exception class for AppointEase errors
 */
class AppointEase_Exception extends Exception {
    private $context;
    
    public function __construct($message = '', $code = 0, Exception $previous = null, $context = []) {
        parent::__construct($message, $code, $previous);
        $this->context = $context;
    }
    
    public function getContext() {
        return $this->context;
    }
}
