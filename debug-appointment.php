<?php
require_once('../../../wp-config.php');

global $wpdb;
$table = $wpdb->prefix . 'appointments';

// Check if table exists
$table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");
echo "Table exists: " . ($table_exists ? "YES" : "NO") . "<br>";

// Check all appointments
$appointments = $wpdb->get_results("SELECT * FROM $table");
echo "Total appointments: " . count($appointments) . "<br><br>";

foreach($appointments as $apt) {
    echo "ID: " . $apt->id . " | Strong ID: " . $apt->strong_id . " | Name: " . $apt->name . "<br>";
}

// Try to find specific appointment
$specific = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE strong_id = %s", 'APT-2024-TDIK14'));
echo "<br>APT-2024-TDIK14 found: " . ($specific ? "YES" : "NO");
?>