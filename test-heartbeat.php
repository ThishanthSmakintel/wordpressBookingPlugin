<?php
/**
 * Test Heartbeat Handler
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load WordPress
require_once(__DIR__ . '/../../../wp-load.php');

echo "=== TESTING HEARTBEAT HANDLER ===\n\n";

// Check if heartbeat handler is loaded
$heartbeat_handler = new Appointease_Heartbeat_Handler();
echo "✅ Heartbeat handler loaded\n\n";

// Test data
$test_data = array(
    'appointease_poll' => array(
        'date' => '2025-10-28',
        'employee_id' => 3
    )
);

echo "Test data:\n";
print_r($test_data);
echo "\n";

// Simulate heartbeat
$response = array();
try {
    $response = $heartbeat_handler->handle_heartbeat($response, $test_data);
    echo "✅ Heartbeat processed successfully\n\n";
    echo "Response:\n";
    print_r($response);
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
