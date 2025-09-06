<?php
// Temporary script to add strong_id column
// Run this once then delete the file

require_once('../../../wp-config.php');

global $wpdb;
$appointments_table = $wpdb->prefix . 'appointments';

// Check if column exists
$column_exists = $wpdb->get_results("SHOW COLUMNS FROM $appointments_table LIKE 'strong_id'");

if (empty($column_exists)) {
    $result = $wpdb->query("ALTER TABLE $appointments_table ADD COLUMN strong_id varchar(20) UNIQUE");
    if ($result !== false) {
        echo "✅ strong_id column added successfully!";
    } else {
        echo "❌ Failed to add column: " . $wpdb->last_error;
    }
} else {
    echo "✅ strong_id column already exists!";
}
?>