<?php
class Booking_Activator {
    
    public static function activate() {
        self::create_tables();
        self::set_default_options();
        flush_rewrite_rules();
    }
    
    private static function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Appointments table
        $appointments_table = $wpdb->prefix . 'appointments';
        $sql1 = "CREATE TABLE $appointments_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            name varchar(100) NOT NULL,
            email varchar(100) NOT NULL,
            phone varchar(20),
            appointment_date datetime NOT NULL,
            status varchar(20) DEFAULT 'confirmed',
            service_id mediumint(9),
            employee_id mediumint(9),
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        // Services table
        $services_table = $wpdb->prefix . 'appointease_services';
        $sql2 = "CREATE TABLE $services_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            description text,
            duration int(11) NOT NULL,
            price decimal(10,2) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        // Staff table
        $staff_table = $wpdb->prefix . 'appointease_staff';
        $sql3 = "CREATE TABLE $staff_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            email varchar(100) NOT NULL,
            phone varchar(20),
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql1);
        dbDelta($sql2);
        dbDelta($sql3);
        
        self::insert_default_data();
    }
    
    private static function insert_default_data() {
        global $wpdb;
        
        $services_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointease_services");
        if($services_count == 0) {
            $wpdb->insert(
                $wpdb->prefix . 'appointease_services',
                array('name' => 'Consultation', 'description' => 'Initial consultation session', 'duration' => 30, 'price' => 75.00)
            );
            $wpdb->insert(
                $wpdb->prefix . 'appointease_services',
                array('name' => 'Premium Service', 'description' => 'Extended premium service', 'duration' => 60, 'price' => 150.00)
            );
        }
        
        $staff_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointease_staff");
        if($staff_count == 0) {
            $wpdb->insert(
                $wpdb->prefix . 'appointease_staff',
                array('name' => 'Sarah Johnson', 'email' => 'sarah@appointease.com', 'phone' => '555-0123')
            );
            $wpdb->insert(
                $wpdb->prefix . 'appointease_staff',
                array('name' => 'Mike Wilson', 'email' => 'mike@appointease.com', 'phone' => '555-0124')
            );
        }
    }
    
    private static function set_default_options() {
        add_option('booking_plugin_version', '1.0.0');
        add_option('booking_plugin_settings', array(
            'time_slots' => array('09:00', '10:00', '11:00', '14:00', '15:00', '16:00'),
            'admin_email' => get_option('admin_email')
        ));
    }
}