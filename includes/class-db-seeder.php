<?php

class Booking_DB_Seeder {
    
    public static function seed_data() {
        global $wpdb;
        
        // Create services table if not exists
        $services_table = $wpdb->prefix . 'booking_services';
        $wpdb->query("CREATE TABLE IF NOT EXISTS $services_table (
            id int(11) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            description text,
            duration int(11) DEFAULT 30,
            price decimal(10,2) DEFAULT 0.00,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        )");
        
        // Create staff table if not exists
        $staff_table = $wpdb->prefix . 'booking_staff';
        $wpdb->query("CREATE TABLE IF NOT EXISTS $staff_table (
            id int(11) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            email varchar(255),
            phone varchar(50),
            specialization varchar(255),
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        )");
        
        // Create availability table if not exists
        $availability_table = $wpdb->prefix . 'booking_availability';
        $wpdb->query("CREATE TABLE IF NOT EXISTS $availability_table (
            id int(11) NOT NULL AUTO_INCREMENT,
            staff_id int(11) NOT NULL,
            date date NOT NULL,
            time_slot varchar(10) NOT NULL,
            is_available tinyint(1) DEFAULT 1,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY staff_id (staff_id),
            KEY date_time (date, time_slot)
        )");
        
        // Seed services
        $services = [
            ['name' => 'Consultation', 'description' => 'Initial consultation session', 'duration' => 30, 'price' => 75.00],
            ['name' => 'Premium Service', 'description' => 'Extended premium service', 'duration' => 60, 'price' => 150.00],
            ['name' => 'Follow-up', 'description' => 'Follow-up appointment', 'duration' => 20, 'price' => 50.00]
        ];
        
        foreach ($services as $service) {
            $existing = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $services_table WHERE name = %s",
                $service['name']
            ));
            
            if (!$existing) {
                $wpdb->insert($services_table, $service);
            }
        }
        
        // Seed staff
        $staff = [
            ['name' => 'Sarah Johnson', 'email' => 'sarah@appointease.com', 'phone' => '+1-555-0101', 'specialization' => 'General Practice'],
            ['name' => 'Mike Wilson', 'email' => 'mike@appointease.com', 'phone' => '+1-555-0102', 'specialization' => 'Cardiology'],
            ['name' => 'Emma Davis', 'email' => 'emma@appointease.com', 'phone' => '+1-555-0103', 'specialization' => 'Dermatology']
        ];
        
        foreach ($staff as $member) {
            $existing = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $staff_table WHERE email = %s",
                $member['email']
            ));
            
            if (!$existing) {
                $wpdb->insert($staff_table, $member);
            }
        }
        
        // Seed availability (next 30 days)
        $staff_ids = $wpdb->get_col("SELECT id FROM $staff_table");
        $time_slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
        
        for ($i = 0; $i < 30; $i++) {
            $date = date('Y-m-d', strtotime("+$i days"));
            $day_of_week = date('w', strtotime($date));
            
            // Skip weekends
            if ($day_of_week == 0 || $day_of_week == 6) continue;
            
            foreach ($staff_ids as $staff_id) {
                foreach ($time_slots as $time_slot) {
                    $existing = $wpdb->get_var($wpdb->prepare(
                        "SELECT id FROM $availability_table WHERE staff_id = %d AND date = %s AND time_slot = %s",
                        $staff_id, $date, $time_slot
                    ));
                    
                    if (!$existing) {
                        // Randomly make some slots unavailable
                        $is_available = (rand(1, 10) > 2) ? 1 : 0;
                        
                        $wpdb->insert($availability_table, [
                            'staff_id' => $staff_id,
                            'date' => $date,
                            'time_slot' => $time_slot,
                            'is_available' => $is_available
                        ]);
                    }
                }
            }
        }
    }
    
    public static function clear_data() {
        global $wpdb;
        
        $services_table = $wpdb->prefix . 'booking_services';
        $staff_table = $wpdb->prefix . 'booking_staff';
        $availability_table = $wpdb->prefix . 'booking_availability';
        
        $wpdb->query("TRUNCATE TABLE $availability_table");
        $wpdb->query("TRUNCATE TABLE $staff_table");
        $wpdb->query("TRUNCATE TABLE $services_table");
    }
}