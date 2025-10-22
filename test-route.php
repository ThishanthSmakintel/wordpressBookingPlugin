<?php
/**
 * Test if REST API route is registered
 * Access: http://blog.promoplus.com/wp-content/plugins/wordpressBookingPlugin/test-route.php
 */

// Load WordPress
require_once('../../../../../wp-load.php');

header('Content-Type: application/json');

// Check if appointment exists
global $wpdb;
$appointment_id = 'APT-2025-000209';
$table = $wpdb->prefix . 'appointments';

$appointment = $wpdb->get_row($wpdb->prepare(
    "SELECT * FROM {$table} WHERE strong_id = %s",
    $appointment_id
));

echo json_encode([
    'appointment_exists' => $appointment ? true : false,
    'appointment_data' => $appointment,
    'table_name' => $table,
    'rest_url' => rest_url('appointease/v1/appointments/' . $appointment_id),
    'routes_registered' => array_keys(rest_get_server()->get_routes()),
    'appointease_routes' => array_filter(
        rest_get_server()->get_routes(),
        function($key) {
            return strpos($key, 'appointease') !== false;
        },
        ARRAY_FILTER_USE_KEY
    )
], JSON_PRETTY_PRINT);
