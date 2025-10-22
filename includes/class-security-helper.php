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
}
