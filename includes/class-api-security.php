<?php
/**
 * API Security Helper - Centralized security for REST endpoints
 */

if (!defined('ABSPATH')) exit;

class Appointease_API_Security {
    
    /**
     * Secure permission callback for public endpoints with rate limiting
     */
    public static function public_permission_callback($request) {
        // Rate limiting
        $ip = self::get_client_ip();
        $key = 'appointease_rate_' . hash('sha256', $ip);
        $count = get_transient($key) ?: 0;
        
        if ($count > 50) { // Reduced from 100 to 50
            return new WP_Error('rate_limited', 'Too many requests', array('status' => 429));
        }
        
        set_transient($key, $count + 1, 60);
        return true;
    }
    
    /**
     * Secure permission callback with nonce verification
     */
    public static function nonce_permission_callback($request) {
        $nonce = $request->get_header('X-WP-Nonce');
        if (!$nonce || !wp_verify_nonce($nonce, 'wp_rest')) {
            return new WP_Error('invalid_nonce', 'Invalid security token', array('status' => 403));
        }
        
        return self::public_permission_callback($request);
    }
    
    /**
     * Get real client IP address
     */
    private static function get_client_ip() {
        $headers = array('HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR');
        
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = sanitize_text_field($_SERVER[$header]);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return sanitize_text_field($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    }
    
    /**
     * Secure table name helper
     */
    public static function get_table_name($table_suffix) {
        global $wpdb;
        $allowed_tables = array(
            'appointments' => $wpdb->prefix . 'appointments',
            'appointease_services' => $wpdb->prefix . 'appointease_services',
            'appointease_staff' => $wpdb->prefix . 'appointease_staff',
            'appointease_customers' => $wpdb->prefix . 'appointease_customers'
        );
        
        if (!isset($allowed_tables[$table_suffix])) {
            wp_die('Invalid table access attempt');
        }
        
        return $allowed_tables[$table_suffix];
    }
}