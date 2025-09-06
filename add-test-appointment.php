<?php
// Add test appointment
require_once('../../../wp-config.php');

global $wpdb;
$table = $wpdb->prefix . 'appointments';

$wpdb->insert($table, array(
    'name' => 'test service',
    'email' => 'dev15.smaintel@gmail.com',
    'phone' => '(555) 123-4567',
    'appointment_date' => '2025-09-08 10:00:00',
    'status' => 'confirmed',
    'strong_id' => 'APT-2024-TDIK14',
    'service_id' => 1,
    'employee_id' => 2,
    'total_amount' => 75.00
));

echo "Test appointment AETDIK14 added successfully!";
?>