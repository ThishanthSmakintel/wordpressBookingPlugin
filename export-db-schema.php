<?php
require_once('C:/xampp/htdocs/wordpress/blog.promoplus.com/wp-load.php');

global $wpdb;

$output = "=== APPOINTEASE DATABASE SCHEMA ===\n\n";
$output .= "Database: " . DB_NAME . "\n";
$output .= "Prefix: " . $wpdb->prefix . "\n";
$output .= "Generated: " . date('Y-m-d H:i:s') . "\n\n";

$tables = [
    'appointments',
    'appointease_services',
    'appointease_staff',
    'appointease_categories',
    'appointease_availability',
    'appointease_timeoff',
    'appointease_customers',
    'appointease_email_templates',
    'appointease_blackout_dates',
    'appointease_slot_locks'
];

foreach ($tables as $table) {
    $full_table = $wpdb->prefix . $table;
    $exists = $wpdb->get_var("SHOW TABLES LIKE '{$full_table}'");
    
    if ($exists) {
        $output .= "TABLE: {$full_table}\n";
        $output .= str_repeat("=", 80) . "\n";
        
        $columns = $wpdb->get_results("SHOW FULL COLUMNS FROM {$full_table}");
        foreach ($columns as $col) {
            $output .= sprintf("  %-25s %-20s %s\n", $col->Field, $col->Type, $col->Null === 'YES' ? 'NULL' : 'NOT NULL');
        }
        
        $count = $wpdb->get_var("SELECT COUNT(*) FROM {$full_table}");
        $output .= "\n  Total Records: {$count}\n";
        
        if ($count > 0) {
            $output .= "\n  ALL DATA:\n";
            $data = $wpdb->get_results("SELECT * FROM {$full_table}", ARRAY_A);
            foreach ($data as $idx => $row) {
                $output .= "    Row " . ($idx + 1) . ": " . json_encode($row, JSON_PRETTY_PRINT) . "\n";
            }
        }
        
        $output .= "\n\n";
    }
}

file_put_contents(__DIR__ . '/database-schema.txt', $output);
echo "Schema exported to database-schema.txt\n";
