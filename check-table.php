<?php
// Quick script to check if slot_locks table exists
require_once(__DIR__ . '/../../../wp-load.php');

global $wpdb;

$table_name = $wpdb->prefix . 'appointease_slot_locks';
$table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'");

if ($table_exists) {
    echo "✅ Table EXISTS: $table_name\n\n";
    
    // Show table structure
    $columns = $wpdb->get_results("DESCRIBE $table_name");
    echo "Table Structure:\n";
    foreach ($columns as $col) {
        echo "  - {$col->Field} ({$col->Type})\n";
    }
    
    // Show row count
    $count = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
    echo "\nTotal rows: $count\n";
    
    // Show all locks
    if ($count > 0) {
        $locks = $wpdb->get_results("SELECT * FROM $table_name");
        echo "\nActive Locks:\n";
        foreach ($locks as $lock) {
            echo "  - {$lock->date} {$lock->time} (Employee #{$lock->employee_id}) - Expires: {$lock->expires_at}\n";
        }
    }
} else {
    echo "❌ Table DOES NOT EXIST: $table_name\n";
    echo "\nTo create it, deactivate and reactivate the plugin.\n";
}
