<?php
require_once('../../../wp-config.php');

global $wpdb;
$table = $wpdb->prefix . 'appointments';

// Check if appointment APT-2025-P8B1S2 exists
$appointment = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE strong_id = %s", 'APT-2025-P8B1S2'));

if ($appointment) {
    echo "✅ Appointment found:<br>";
    echo "ID: " . $appointment->id . "<br>";
    echo "Strong ID: " . $appointment->strong_id . "<br>";
    echo "Name: " . $appointment->name . "<br>";
    echo "Email: " . $appointment->email . "<br>";
    echo "Date: " . $appointment->appointment_date . "<br>";
    echo "Status: " . $appointment->status . "<br>";
} else {
    echo "❌ Appointment APT-2025-P8B1S2 not found in database<br><br>";
    
    // Show all appointments with strong_id
    $all = $wpdb->get_results("SELECT strong_id, name, appointment_date FROM $table WHERE strong_id IS NOT NULL ORDER BY id DESC LIMIT 10");
    echo "Recent appointments:<br>";
    foreach($all as $apt) {
        echo "- " . $apt->strong_id . " | " . $apt->name . " | " . $apt->appointment_date . "<br>";
    }
}
?>