<?php
class Booking_Activator {
    
    public static function activate() {
        self::create_tables();
        self::set_default_options();
        self::check_websocket_requirements();
        flush_rewrite_rules();
    }
    
    private static function check_websocket_requirements() {
        $notices = [];
        
        // Check if composer vendor exists
        $vendor_path = plugin_dir_path(dirname(__FILE__)) . 'vendor/autoload.php';
        if (!file_exists($vendor_path)) {
            $notices[] = 'websocket_composer';
        }
        
        // Check if WebSocket server is running
        $ws_running = @fsockopen('localhost', 8080, $errno, $errstr, 1);
        if (!$ws_running) {
            $notices[] = 'websocket_not_running';
        } else {
            fclose($ws_running);
        }
        
        if (!empty($notices)) {
            set_transient('appointease_activation_notices', $notices, 300);
        }
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
            customer_id mediumint(9),
            notes text,
            payment_status varchar(20) DEFAULT 'pending',
            total_amount decimal(10,2),
            strong_id varchar(20) UNIQUE,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            rescheduled_at datetime NULL,
            original_date datetime NULL,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        // Ensure strong_id column exists with proper constraints
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$appointments_table'");
        if ($table_exists) {
            $column_exists = $wpdb->get_results("SHOW COLUMNS FROM $appointments_table LIKE 'strong_id'");
            if (empty($column_exists)) {
                $wpdb->query("ALTER TABLE $appointments_table ADD COLUMN strong_id varchar(20) UNIQUE");
            }
        }
        
        // Services table
        $services_table = $wpdb->prefix . 'appointease_services';
        $sql2 = "CREATE TABLE $services_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            description text,
            duration int(11) NOT NULL,
            price decimal(10,2) NOT NULL,
            category_id mediumint(9),
            capacity int(11) DEFAULT 1,
            advance_booking_days int(11) DEFAULT 30,
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
            working_hours text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        // Service categories table
        $categories_table = $wpdb->prefix . 'appointease_categories';
        $sql4 = "CREATE TABLE $categories_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            description text,
            color varchar(7) DEFAULT '#1CBC9B',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        // Staff availability table
        $availability_table = $wpdb->prefix . 'appointease_availability';
        $sql5 = "CREATE TABLE $availability_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            staff_id mediumint(9) NOT NULL,
            day_of_week tinyint(1) NOT NULL,
            start_time time NOT NULL,
            end_time time NOT NULL,
            is_available tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        // Time off table
        $timeoff_table = $wpdb->prefix . 'appointease_timeoff';
        $sql6 = "CREATE TABLE $timeoff_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            staff_id mediumint(9) NOT NULL,
            start_date date NOT NULL,
            end_date date NOT NULL,
            reason varchar(255),
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        // Customers table
        $customers_table = $wpdb->prefix . 'appointease_customers';
        $sql7 = "CREATE TABLE $customers_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            email varchar(100) NOT NULL,
            phone varchar(20),
            notes text,
            total_appointments int(11) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        // Email templates table
        $templates_table = $wpdb->prefix . 'appointease_email_templates';
        $sql8 = "CREATE TABLE $templates_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            subject varchar(255) NOT NULL,
            body text NOT NULL,
            type varchar(50) NOT NULL,
            is_active tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        // Blackout dates table
        $blackout_table = $wpdb->prefix . 'appointease_blackout_dates';
        $sql9 = "CREATE TABLE $blackout_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            start_date date NOT NULL,
            end_date date NOT NULL,
            reason varchar(255),
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql1);
        dbDelta($sql2);
        dbDelta($sql3);
        dbDelta($sql4);
        dbDelta($sql5);
        dbDelta($sql6);
        dbDelta($sql7);
        dbDelta($sql8);
        dbDelta($sql9);
        
        // Ensure new columns exist after table creation
        $strong_id_exists = $wpdb->get_results("SHOW COLUMNS FROM $appointments_table LIKE 'strong_id'");
        if (empty($strong_id_exists)) {
            $wpdb->query("ALTER TABLE $appointments_table ADD COLUMN strong_id varchar(20) UNIQUE");
        }
        
        $rescheduled_at_exists = $wpdb->get_results("SHOW COLUMNS FROM $appointments_table LIKE 'rescheduled_at'");
        if (empty($rescheduled_at_exists)) {
            $wpdb->query("ALTER TABLE $appointments_table ADD COLUMN rescheduled_at datetime NULL");
        }
        
        $original_date_exists = $wpdb->get_results("SHOW COLUMNS FROM $appointments_table LIKE 'original_date'");
        if (empty($original_date_exists)) {
            $wpdb->query("ALTER TABLE $appointments_table ADD COLUMN original_date datetime NULL");
        }
        
        self::insert_default_data();
    }
    
    private static function insert_default_data() {
        global $wpdb;
        
        // Insert default categories
        $categories_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointease_categories");
        if($categories_count == 0) {
            $wpdb->insert(
                $wpdb->prefix . 'appointease_categories',
                array('name' => 'General Services', 'description' => 'General booking services', 'color' => '#1CBC9B')
            );
            $wpdb->insert(
                $wpdb->prefix . 'appointease_categories',
                array('name' => 'Premium Services', 'description' => 'Premium booking services', 'color' => '#3498db')
            );
        }
        
        $services_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointease_services");
        if($services_count == 0) {
            $wpdb->insert(
                $wpdb->prefix . 'appointease_services',
                array('name' => 'Consultation', 'description' => 'Initial consultation session', 'duration' => 30, 'price' => 75.00, 'category_id' => 1)
            );
            $wpdb->insert(
                $wpdb->prefix . 'appointease_services',
                array('name' => 'Premium Service', 'description' => 'Extended premium service', 'duration' => 60, 'price' => 150.00, 'category_id' => 2)
            );
        }
        
        $staff_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointease_staff");
        if($staff_count == 0) {
            $wpdb->insert(
                $wpdb->prefix . 'appointease_staff',
                array('name' => 'Sarah Johnson', 'email' => 'sarah@appointease.com', 'phone' => '555-0123', 'working_hours' => json_encode(['mon' => ['09:00', '17:00'], 'tue' => ['09:00', '17:00'], 'wed' => ['09:00', '17:00'], 'thu' => ['09:00', '17:00'], 'fri' => ['09:00', '17:00']]))
            );
            $wpdb->insert(
                $wpdb->prefix . 'appointease_staff',
                array('name' => 'Mike Wilson', 'email' => 'mike@appointease.com', 'phone' => '555-0124', 'working_hours' => json_encode(['mon' => ['10:00', '18:00'], 'tue' => ['10:00', '18:00'], 'wed' => ['10:00', '18:00'], 'thu' => ['10:00', '18:00'], 'fri' => ['10:00', '18:00']]))
            );
        }
        
        // Insert default email templates
        $templates_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointease_email_templates");
        if($templates_count == 0) {
            // Booking Confirmation
            $wpdb->insert(
                $wpdb->prefix . 'appointease_email_templates',
                array(
                    'name' => 'Booking Confirmation',
                    'subject' => 'Appointment Confirmed - ID: {{appointment_id}}',
                    'body' => 'Dear {{customer_name}},\n\nYour appointment has been successfully booked!\n\nAppointment Details:\n- ID: {{appointment_id}}\n- Date & Time: {{appointment_date}}\n- Service: {{service_name}}\n- Staff: {{staff_name}}\n- Duration: {{duration}} minutes\n- Total: ${{total_amount}}\n\nTo manage your appointment, use ID: {{appointment_id}}\n\nThank you for choosing us!\n\nBest regards,\n{{business_name}}',
                    'type' => 'confirmation'
                )
            );
            
            // Appointment Reminder
            $wpdb->insert(
                $wpdb->prefix . 'appointease_email_templates',
                array(
                    'name' => 'Appointment Reminder',
                    'subject' => 'Reminder: Your appointment is tomorrow',
                    'body' => 'Dear {{customer_name}},\n\nThis is a friendly reminder about your upcoming appointment:\n\n- Date & Time: {{appointment_date}}\n- Service: {{service_name}}\n- Staff: {{staff_name}}\n- Location: {{business_address}}\n\nIf you need to reschedule or cancel, please use your appointment ID: {{appointment_id}}\n\nSee you soon!\n\n{{business_name}}',
                    'type' => 'reminder'
                )
            );
            
            // Cancellation Confirmation
            $wpdb->insert(
                $wpdb->prefix . 'appointease_email_templates',
                array(
                    'name' => 'Cancellation Confirmation',
                    'subject' => 'Appointment Cancelled - ID: {{appointment_id}}',
                    'body' => 'Dear {{customer_name}},\n\nYour appointment has been successfully cancelled.\n\nCancelled Appointment Details:\n- ID: {{appointment_id}}\n- Original Date: {{appointment_date}}\n- Service: {{service_name}}\n\nWe hope to serve you again in the future.\n\nBest regards,\n{{business_name}}',
                    'type' => 'cancellation'
                )
            );
            
            // Reschedule Confirmation
            $wpdb->insert(
                $wpdb->prefix . 'appointease_email_templates',
                array(
                    'name' => 'Reschedule Confirmation',
                    'subject' => 'Appointment Rescheduled - ID: {{appointment_id}}',
                    'body' => 'Dear {{customer_name}},\n\nYour appointment has been successfully rescheduled.\n\nUpdated Appointment Details:\n- ID: {{appointment_id}}\n- New Date & Time: {{appointment_date}}\n- Service: {{service_name}}\n- Staff: {{staff_name}}\n\nThank you for your flexibility!\n\nBest regards,\n{{business_name}}',
                    'type' => 'reschedule'
                )
            );
            
            // Admin Notification
            $wpdb->insert(
                $wpdb->prefix . 'appointease_email_templates',
                array(
                    'name' => 'Admin New Booking',
                    'subject' => 'New Appointment Booked - {{appointment_date}}',
                    'body' => 'New appointment booked:\n\nCustomer: {{customer_name}}\nEmail: {{customer_email}}\nPhone: {{customer_phone}}\nDate: {{appointment_date}}\nService: {{service_name}}\nStaff: {{staff_name}}\nID: {{appointment_id}}',
                    'type' => 'admin_notification'
                )
            );
        }
        
        // Insert default holidays
        $holidays_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointease_blackout_dates");
        if($holidays_count == 0) {
            $current_year = date('Y');
            $wpdb->insert(
                $wpdb->prefix . 'appointease_blackout_dates',
                array('reason' => 'New Year\'s Day', 'start_date' => $current_year . '-01-01', 'end_date' => $current_year . '-01-01')
            );
            $wpdb->insert(
                $wpdb->prefix . 'appointease_blackout_dates',
                array('reason' => 'Christmas Day', 'start_date' => $current_year . '-12-25', 'end_date' => $current_year . '-12-25')
            );
        }
    }
    
    private static function set_default_options() {
        add_option('booking_plugin_version', '1.0.0');
        add_option('booking_plugin_settings', array(
            'time_slots' => array('09:00', '10:00', '11:00', '14:00', '15:00', '16:00'),
            'admin_email' => get_option('admin_email')
        ));
        add_option('appointease_email_settings', array(
            'smtp_host' => '',
            'smtp_port' => '587',
            'smtp_username' => '',
            'smtp_password' => '',
            'smtp_encryption' => 'tls',
            'from_email' => get_option('admin_email'),
            'from_name' => get_bloginfo('name'),
            'enable_reminders' => 1,
            'reminder_hours' => 24
        ));
    }
}