<?php
/**
 * Test data fixtures for PHPUnit tests
 */

class Test_Data_Fixtures {
    
    public static function create_test_service($args = []) {
        global $wpdb;
        
        $defaults = [
            'name' => 'Test Service',
            'duration' => 30,
            'price' => 50.00,
            'description' => 'Test service description'
        ];
        
        $data = wp_parse_args($args, $defaults);
        
        $wpdb->insert(
            $wpdb->prefix . 'appointease_services',
            $data,
            ['%s', '%d', '%f', '%s']
        );
        
        return $wpdb->insert_id;
    }
    
    public static function create_test_staff($args = []) {
        global $wpdb;
        
        $defaults = [
            'name' => 'Test Staff',
            'email' => 'staff@example.com',
            'specialization' => 'General'
        ];
        
        $data = wp_parse_args($args, $defaults);
        
        $wpdb->insert(
            $wpdb->prefix . 'appointease_staff',
            $data,
            ['%s', '%s', '%s']
        );
        
        return $wpdb->insert_id;
    }
    
    public static function create_test_appointment($args = []) {
        global $wpdb;
        
        $defaults = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '1234567890',
            'appointment_date' => date('Y-m-d H:i:s', strtotime('+1 day')),
            'service_id' => 1,
            'employee_id' => 1,
            'status' => 'confirmed'
        ];
        
        $data = wp_parse_args($args, $defaults);
        
        $wpdb->insert(
            $wpdb->prefix . 'appointments',
            $data,
            ['%s', '%s', '%s', '%s', '%d', '%d', '%s']
        );
        
        $appointment_id = $wpdb->insert_id;
        $strong_id = sprintf('APT-%d-%06d', date('Y'), $appointment_id);
        
        $wpdb->update(
            $wpdb->prefix . 'appointments',
            ['strong_id' => $strong_id],
            ['id' => $appointment_id],
            ['%s'],
            ['%d']
        );
        
        return $strong_id;
    }
    
    public static function cleanup_test_data() {
        global $wpdb;
        
        $tables = [
            $wpdb->prefix . 'appointments',
            $wpdb->prefix . 'appointease_services',
            $wpdb->prefix . 'appointease_staff',
            $wpdb->prefix . 'appointease_sessions'
        ];
        
        foreach ($tables as $table) {
            $wpdb->query("TRUNCATE TABLE {$table}");
        }
    }
}