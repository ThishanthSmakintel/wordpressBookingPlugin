<?php
/**
 * Admin Security Wrapper
 * Centralized security for all admin AJAX handlers
 */

if (!defined('ABSPATH')) {
    exit;
}

class AppointEase_Admin_Security {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Hook into all admin AJAX actions
        add_action('admin_init', array($this, 'secure_ajax_handlers'), 1);
    }
    
    /**
     * Secure all AJAX handlers with nonce and capability checks
     */
    public function secure_ajax_handlers() {
        $ajax_actions = array(
            'appointease_get_services',
            'appointease_get_staff',
            'appointease_get_appointments',
            'appointease_save_service',
            'appointease_delete_service',
            'appointease_save_staff',
            'appointease_delete_staff',
            'appointease_save_settings',
            'appointease_reset_database',
            'check_redis_status',
            'install_redis',
            'appointease_seed_data'
        );
        
        foreach ($ajax_actions as $action) {
            add_action("wp_ajax_{$action}", array($this, 'verify_ajax_security'), 1);
        }
    }
    
    /**
     * Verify AJAX security before processing
     */
    public function verify_ajax_security() {
        // Check nonce
        if (!check_ajax_referer('appointease_nonce', '_wpnonce', false)) {
            wp_send_json_error(array('message' => 'Security check failed'), 403);
            exit;
        }
        
        // Check capability
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized access'), 403);
            exit;
        }
    }
    
    /**
     * Secure database query wrapper
     */
    public static function secure_query($query, $params = array()) {
        global $wpdb;
        
        if (empty($params)) {
            return $wpdb->get_results($query);
        }
        
        return $wpdb->get_results($wpdb->prepare($query, $params));
    }
    
    /**
     * Secure INSERT wrapper
     */
    public static function secure_insert($table, $data, $format = null) {
        global $wpdb;
        
        // Sanitize data
        $sanitized = array();
        foreach ($data as $key => $value) {
            if (is_email($value)) {
                $sanitized[$key] = sanitize_email($value);
            } elseif (is_numeric($value)) {
                $sanitized[$key] = intval($value);
            } else {
                $sanitized[$key] = sanitize_text_field($value);
            }
        }
        
        $result = $wpdb->insert($table, $sanitized, $format);
        
        if ($result === false) {
            error_log('[AppointEase] Insert failed: ' . $wpdb->last_error);
            return false;
        }
        
        return $wpdb->insert_id;
    }
    
    /**
     * Secure UPDATE wrapper
     */
    public static function secure_update($table, $data, $where, $format = null, $where_format = null) {
        global $wpdb;
        
        // Sanitize data
        $sanitized_data = array();
        foreach ($data as $key => $value) {
            if (is_email($value)) {
                $sanitized_data[$key] = sanitize_email($value);
            } elseif (is_numeric($value)) {
                $sanitized_data[$key] = intval($value);
            } else {
                $sanitized_data[$key] = sanitize_text_field($value);
            }
        }
        
        // Sanitize where
        $sanitized_where = array();
        foreach ($where as $key => $value) {
            $sanitized_where[$key] = is_numeric($value) ? intval($value) : sanitize_text_field($value);
        }
        
        $result = $wpdb->update($table, $sanitized_data, $sanitized_where, $format, $where_format);
        
        if ($result === false) {
            error_log('[AppointEase] Update failed: ' . $wpdb->last_error);
        }
        
        return $result;
    }
    
    /**
     * Secure DELETE wrapper
     */
    public static function secure_delete($table, $where, $where_format = null) {
        global $wpdb;
        
        // Sanitize where
        $sanitized_where = array();
        foreach ($where as $key => $value) {
            $sanitized_where[$key] = is_numeric($value) ? intval($value) : sanitize_text_field($value);
        }
        
        $result = $wpdb->delete($table, $sanitized_where, $where_format);
        
        if ($result === false) {
            error_log('[AppointEase] Delete failed: ' . $wpdb->last_error);
        }
        
        return $result;
    }
    
    /**
     * Verify admin page access
     */
    public static function verify_admin_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.', 'appointease'));
        }
        
        // Check nonce for form submissions
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'appointease_admin_action')) {
                wp_die(__('Security check failed.', 'appointease'));
            }
        }
    }
}

// Initialize
AppointEase_Admin_Security::get_instance();
