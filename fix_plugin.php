<?php
/**
 * Plugin Fix Script - Run this to ensure plugin is properly set up
 */

// WordPress bootstrap
require_once('../../../../../wp-config.php');

echo "🔧 AppointEase Plugin Fix Script\n";
echo "================================\n";

// Check if plugin is active
$active_plugins = get_option('active_plugins', []);
$plugin_file = 'wordpressBookingPlugin/booking-plugin.php';

if (!in_array($plugin_file, $active_plugins)) {
    echo "❌ Plugin not active. Activating...\n";
    $active_plugins[] = $plugin_file;
    update_option('active_plugins', $active_plugins);
    echo "✅ Plugin activated\n";
} else {
    echo "✅ Plugin is active\n";
}

// Check database tables
global $wpdb;
$tables = [
    'appointments',
    'appointease_services', 
    'appointease_staff',
    'appointease_categories'
];

foreach ($tables as $table) {
    $full_table = $wpdb->prefix . $table;
    $exists = $wpdb->get_var("SHOW TABLES LIKE '$full_table'");
    
    if ($exists) {
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $full_table");
        echo "✅ Table $table exists ($count records)\n";
    } else {
        echo "❌ Table $table missing\n";
    }
}

// Create missing tables if needed
if (!$wpdb->get_var("SHOW TABLES LIKE '{$wpdb->prefix}appointments'")) {
    echo "🔨 Creating missing tables...\n";
    
    // Load activator
    require_once('includes/class-activator.php');
    Booking_Activator::activate();
    
    echo "✅ Tables created\n";
}

// Check if atomic booking class exists
$atomic_file = __DIR__ . '/includes/class-atomic-booking.php';
if (file_exists($atomic_file)) {
    echo "✅ Atomic booking class exists\n";
} else {
    echo "❌ Atomic booking class missing\n";
}

// Test REST API
$rest_url = home_url('/wp-json/appointease/v1/services');
echo "🌐 Testing REST API: $rest_url\n";

$response = wp_remote_get($rest_url);
if (!is_wp_error($response)) {
    echo "✅ REST API working\n";
} else {
    echo "❌ REST API error: " . $response->get_error_message() . "\n";
}

echo "\n🎉 Plugin fix complete!\n";
echo "Now try running: python test_complete.py\n";