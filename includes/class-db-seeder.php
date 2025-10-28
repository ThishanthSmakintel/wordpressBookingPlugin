<?php

class Booking_DB_Seeder {
    
    public static function seed_data() {
        global $wpdb;
        
        // Use correct table names
        $services_table = $wpdb->prefix . 'appointease_services';
        $staff_table = $wpdb->prefix . 'appointease_staff';
        $appointments_table = $wpdb->prefix . 'appointments';
        
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
            ['name' => 'General Consultation', 'description' => 'Initial consultation session', 'duration' => 30, 'price' => 75.00],
            ['name' => 'Specialist Consultation', 'description' => 'Extended specialist consultation', 'duration' => 60, 'price' => 150.00],
            ['name' => 'Follow-up Visit', 'description' => 'Follow-up appointment', 'duration' => 30, 'price' => 50.00],
            ['name' => 'Health Screening', 'description' => 'Comprehensive health screening', 'duration' => 45, 'price' => 120.00]
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
            ['name' => 'Dr. Sarah Johnson', 'email' => 'sarah@clinic.com', 'phone' => '+1-555-0101', 'specialization' => 'General Practice'],
            ['name' => 'Dr. Michael Chen', 'email' => 'michael@clinic.com', 'phone' => '+1-555-0102', 'specialization' => 'Cardiology'],
            ['name' => 'Dr. Emma Rodriguez', 'email' => 'emma@clinic.com', 'phone' => '+1-555-0103', 'specialization' => 'Dermatology'],
            ['name' => 'Dr. James Wilson', 'email' => 'james@clinic.com', 'phone' => '+1-555-0104', 'specialization' => 'Orthopedics']
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
        
        // Seed sample appointments
        $staff_ids = $wpdb->get_col("SELECT id FROM $staff_table");
        $service_ids = $wpdb->get_col("SELECT id FROM $services_table");
        
        $sample_appointments = [
            ['name' => 'John Smith', 'email' => 'john.smith@email.com', 'phone' => '+1-555-1001', 'date' => '2025-01-15 10:00:00'],
            ['name' => 'Maria Garcia', 'email' => 'maria.garcia@email.com', 'phone' => '+1-555-1002', 'date' => '2025-01-15 14:30:00'],
            ['name' => 'David Johnson', 'email' => 'david.johnson@email.com', 'phone' => '+1-555-1003', 'date' => '2025-01-16 09:30:00'],
            ['name' => 'Lisa Chen', 'email' => 'lisa.chen@email.com', 'phone' => '+1-555-1004', 'date' => '2025-01-16 11:00:00'],
            ['name' => 'Robert Brown', 'email' => 'robert.brown@email.com', 'phone' => '+1-555-1005', 'date' => '2025-01-17 15:00:00'],
            ['name' => 'Jennifer Wilson', 'email' => 'jennifer.wilson@email.com', 'phone' => '+1-555-1006', 'date' => '2025-01-18 10:30:00'],
            ['name' => 'Michael Davis', 'email' => 'michael.davis@email.com', 'phone' => '+1-555-1007', 'date' => '2025-01-20 14:00:00'],
            ['name' => 'Sarah Miller', 'email' => 'sarah.miller@email.com', 'phone' => '+1-555-1008', 'date' => '2025-01-21 09:00:00']
        ];
        
        foreach ($sample_appointments as $index => $appointment) {
            $existing = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $appointments_table WHERE email = %s AND appointment_date = %s",
                $appointment['email'], $appointment['date']
            ));
            
            if (!$existing && !empty($staff_ids) && !empty($service_ids)) {
                $strong_id = 'APT-' . date('Y') . '-' . str_pad($index + 1000, 6, '0', STR_PAD_LEFT);
                
                $wpdb->insert($appointments_table, [
                    'name' => $appointment['name'],
                    'email' => $appointment['email'],
                    'phone' => $appointment['phone'],
                    'appointment_date' => $appointment['date'],
                    'service_id' => $service_ids[array_rand($service_ids)],
                    'employee_id' => $staff_ids[array_rand($staff_ids)],
                    'status' => 'confirmed',
                    'strong_id' => $strong_id,
                    'created_at' => current_time('mysql')
                ]);
            }
        }
    }
    
    public static function clear_data() {
        global $wpdb;
        
        $services_table = $wpdb->prefix . 'appointease_services';
        $staff_table = $wpdb->prefix . 'appointease_staff';
        $appointments_table = $wpdb->prefix . 'appointments';
        
        $wpdb->query("DELETE FROM $appointments_table WHERE strong_id LIKE 'APT-%'");
        $wpdb->query("DELETE FROM $staff_table WHERE email LIKE '%@clinic.com'");
        $wpdb->query("DELETE FROM $services_table WHERE name IN ('General Consultation', 'Specialist Consultation', 'Follow-up Visit', 'Health Screening')");
    }
}