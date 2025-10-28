<?php
require_once('../../../../wp-load.php');

global $wpdb;
$table = $wpdb->prefix . 'appointease_slot_locks';

// Check if table exists
$exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");
echo "Table exists: " . ($exists ? 'YES' : 'NO') . "\n\n";

if ($exists) {
    // Show table structure
    echo "Table structure:\n";
    $columns = $wpdb->get_results("DESCRIBE $table");
    foreach ($columns as $col) {
        echo "- {$col->Field} ({$col->Type}) {$col->Null} {$col->Key}\n";
    }
    
    echo "\n\nCurrent locks:\n";
    $locks = $wpdb->get_results("SELECT * FROM $table");
    print_r($locks);
}
