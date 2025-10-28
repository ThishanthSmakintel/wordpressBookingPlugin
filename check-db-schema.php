<?php
/**
 * Database Schema Verification Script
 * Run this to check all table and column names
 */

require_once('C:/xampp/htdocs/wordpress/blog.promoplus.com/wp-load.php');

global $wpdb;

echo "=== DATABASE SCHEMA CHECK ===\n\n";
echo "Database Name: " . DB_NAME . "\n";
echo "Table Prefix: " . $wpdb->prefix . "\n\n";

// Check all appointease tables
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
        echo "✓ Table exists: {$full_table}\n";
        
        // Get columns
        $columns = $wpdb->get_results("SHOW COLUMNS FROM {$full_table}");
        echo "  Columns: ";
        $col_names = array_map(function($col) { return $col->Field; }, $columns);
        echo implode(', ', $col_names) . "\n\n";
    } else {
        echo "✗ Table MISSING: {$full_table}\n\n";
    }
}

// Check for any appointments
$appointments_table = $wpdb->prefix . 'appointments';
$count = $wpdb->get_var("SELECT COUNT(*) FROM {$appointments_table}");
echo "Total appointments in database: {$count}\n\n";

// Check services
$services_table = $wpdb->prefix . 'appointease_services';
$services = $wpdb->get_results("SELECT id, name FROM {$services_table}");
echo "Services:\n";
foreach ($services as $service) {
    echo "  - ID {$service->id}: {$service->name}\n";
}
echo "\n";

// Check staff
$staff_table = $wpdb->prefix . 'appointease_staff';
$staff = $wpdb->get_results("SELECT id, name FROM {$staff_table}");
echo "Staff:\n";
foreach ($staff as $member) {
    echo "  - ID {$member->id}: {$member->name}\n";
}
echo "\n";

echo "=== END SCHEMA CHECK ===\n";
