<?php

class Booking_DB_Reset_Filters {
    
    public function __construct() {
        $this->init_filters();
    }
    
    /**
     * Initialize all reset filters
     */
    private function init_filters() {
        // Complete database reset filter
        add_filter('appointease_reset_database', [$this, 'reset_complete_database'], 10, 1);
        
        // Specific table reset filters
        add_filter('appointease_reset_appointments', [$this, 'reset_appointments_table'], 10, 1);
        add_filter('appointease_reset_customers', [$this, 'reset_customers_table'], 10, 1);
        add_filter('appointease_reset_services', [$this, 'reset_services_table'], 10, 1);
        add_filter('appointease_reset_staff', [$this, 'reset_staff_table'], 10, 1);
        
        // Get table counts filter
        add_filter('appointease_get_table_counts', [$this, 'get_table_counts'], 10, 1);
        
        // Admin action hooks
        add_action('wp_ajax_appointease_reset_db', [$this, 'ajax_reset_database']);
        add_action('wp_ajax_appointease_reset_table', [$this, 'ajax_reset_table']);
    }
    
    /**
     * Reset complete database
     */
    public function reset_complete_database($confirm = false) {
        if (!$confirm) {
            return ['error' => 'Confirmation required for database reset'];
        }
        
        if (!current_user_can('manage_options')) {
            return ['error' => 'Insufficient permissions'];
        }
        
        try {
            Booking_DB_Reset::reset_all_data();
            return ['success' => 'Database reset successfully', 'counts' => Booking_DB_Reset::get_table_counts()];
        } catch (Exception $e) {
            return ['error' => 'Reset failed: ' . $e->getMessage()];
        }
    }
    
    /**
     * Reset appointments table
     */
    public function reset_appointments_table($confirm = false) {
        if (!$confirm) {
            return ['error' => 'Confirmation required'];
        }
        
        if (!current_user_can('manage_options')) {
            return ['error' => 'Insufficient permissions'];
        }
        
        try {
            Booking_DB_Reset::reset_appointments();
            return ['success' => 'Appointments reset successfully'];
        } catch (Exception $e) {
            return ['error' => 'Reset failed: ' . $e->getMessage()];
        }
    }
    
    /**
     * Reset customers table
     */
    public function reset_customers_table($confirm = false) {
        if (!$confirm) {
            return ['error' => 'Confirmation required'];
        }
        
        if (!current_user_can('manage_options')) {
            return ['error' => 'Insufficient permissions'];
        }
        
        try {
            Booking_DB_Reset::reset_customers();
            return ['success' => 'Customers reset successfully'];
        } catch (Exception $e) {
            return ['error' => 'Reset failed: ' . $e->getMessage()];
        }
    }
    
    /**
     * Reset services table
     */
    public function reset_services_table($confirm = false) {
        if (!$confirm) {
            return ['error' => 'Confirmation required'];
        }
        
        if (!current_user_can('manage_options')) {
            return ['error' => 'Insufficient permissions'];
        }
        
        try {
            Booking_DB_Reset::reset_table_data('appointease_services');
            return ['success' => 'Services reset successfully'];
        } catch (Exception $e) {
            return ['error' => 'Reset failed: ' . $e->getMessage()];
        }
    }
    
    /**
     * Reset staff table
     */
    public function reset_staff_table($confirm = false) {
        if (!$confirm) {
            return ['error' => 'Confirmation required'];
        }
        
        if (!current_user_can('manage_options')) {
            return ['error' => 'Insufficient permissions'];
        }
        
        try {
            Booking_DB_Reset::reset_table_data('appointease_staff');
            return ['success' => 'Staff reset successfully'];
        } catch (Exception $e) {
            return ['error' => 'Reset failed: ' . $e->getMessage()];
        }
    }
    
    /**
     * Get table counts
     */
    public function get_table_counts($dummy = null) {
        return Booking_DB_Reset::get_table_counts();
    }
    
    /**
     * AJAX handler for database reset
     */
    public function ajax_reset_database() {
        check_ajax_referer('appointease_reset_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Insufficient permissions');
        }
        
        $result = $this->reset_complete_database(true);
        wp_send_json($result);
    }
    
    /**
     * AJAX handler for table reset
     */
    public function ajax_reset_table() {
        check_ajax_referer('appointease_reset_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Insufficient permissions');
        }
        
        $table = sanitize_text_field($_POST['table'] ?? '');
        
        switch ($table) {
            case 'appointments':
                $result = $this->reset_appointments_table(true);
                break;
            case 'customers':
                $result = $this->reset_customers_table(true);
                break;
            case 'services':
                $result = $this->reset_services_table(true);
                break;
            case 'staff':
                $result = $this->reset_staff_table(true);
                break;
            default:
                $result = ['error' => 'Invalid table specified'];
        }
        
        wp_send_json($result);
    }
}