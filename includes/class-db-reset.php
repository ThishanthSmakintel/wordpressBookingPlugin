<?php

class Booking_DB_Reset {
    
    /**
     * Reset all plugin data
     */
    public static function reset_all_data() {
        global $wpdb;
        
        // Get all plugin tables
        $tables = self::get_plugin_tables();
        
        // Truncate all tables
        foreach ($tables as $table) {
            if (self::table_exists($table)) {
                $wpdb->query("TRUNCATE TABLE `$table`");
            }
        }
        
        // Delete plugin options
        self::delete_plugin_options();
        
        // Re-insert default data
        if (class_exists('Booking_Activator')) {
            Booking_Activator::activate();
        }
        
        return true;
    }
    
    /**
     * Reset specific table data
     */
    public static function reset_table_data($table_name) {
        global $wpdb;
        
        $full_table_name = $wpdb->prefix . $table_name;
        
        if (self::table_exists($full_table_name)) {
            $wpdb->query("TRUNCATE TABLE `$full_table_name`");
            return true;
        }
        
        return false;
    }
    
    /**
     * Get all plugin tables
     */
    private static function get_plugin_tables() {
        global $wpdb;
        
        return [
            $wpdb->prefix . 'appointments',
            $wpdb->prefix . 'appointease_services',
            $wpdb->prefix . 'appointease_staff',
            $wpdb->prefix . 'appointease_categories',
            $wpdb->prefix . 'appointease_availability',
            $wpdb->prefix . 'appointease_timeoff',
            $wpdb->prefix . 'appointease_customers',
            $wpdb->prefix . 'appointease_email_templates',
            $wpdb->prefix . 'appointease_blackout_dates',
            $wpdb->prefix . 'booking_services',
            $wpdb->prefix . 'booking_staff',
            $wpdb->prefix . 'booking_availability'
        ];
    }
    
    /**
     * Check if table exists
     */
    private static function table_exists($table_name) {
        global $wpdb;
        
        $table = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name));
        return $table === $table_name;
    }
    
    /**
     * Delete plugin options
     */
    private static function delete_plugin_options() {
        delete_option('booking_plugin_version');
        delete_option('booking_plugin_settings');
        delete_option('appointease_email_settings');
    }
    
    /**
     * Reset appointments only
     */
    public static function reset_appointments() {
        global $wpdb;
        
        $appointments_table = $wpdb->prefix . 'appointments';
        if (self::table_exists($appointments_table)) {
            $wpdb->query("TRUNCATE TABLE `$appointments_table`");
            return true;
        }
        
        return false;
    }
    
    /**
     * Reset customers only
     */
    public static function reset_customers() {
        global $wpdb;
        
        $customers_table = $wpdb->prefix . 'appointease_customers';
        if (self::table_exists($customers_table)) {
            $wpdb->query("TRUNCATE TABLE `$customers_table`");
            return true;
        }
        
        return false;
    }
    
    /**
     * Get table row counts for verification
     */
    public static function get_table_counts() {
        global $wpdb;
        
        $counts = [];
        $tables = self::get_plugin_tables();
        
        foreach ($tables as $table) {
            if (self::table_exists($table)) {
                $count = $wpdb->get_var("SELECT COUNT(*) FROM `$table`");
                $counts[str_replace($wpdb->prefix, '', $table)] = (int) $count;
            }
        }
        
        return $counts;
    }
}