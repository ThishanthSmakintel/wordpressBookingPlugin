<?php
/**
 * Debug Test - Processing Slot Visibility
 */

// Enable error display
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Bootstrap WordPress
$wp_paths = [
    __DIR__ . '/../../../../../wp-config.php',
    __DIR__ . '/../../../../wp-config.php', 
    __DIR__ . '/../../../wp-config.php'
];

$wp_loaded = false;
foreach ($wp_paths as $path) {
    if (file_exists($path)) {
        require_once($path);
        $wp_loaded = true;
        break;
    }
}

if (!$wp_loaded) {
    die('WordPress not found');
}

echo "<h1>🚦 Processing Slot Visibility Test</h1>\n";
echo "<style>body{font-family:monospace;background:#f5f5f5;padding:20px;} .pass{color:#2ecc71;} .fail{color:#e74c3c;} .info{color:#3498db;}</style>\n";

global $wpdb;
$locks_table = $wpdb->prefix . 'appointease_slot_locks';
$test_date = date('Y-m-d'); // Use TODAY not future date
$test_time = '14:30:00';
$employee_id = 1;

echo "<h2>Step 1: Create Test Lock (User B Processing)</h2>\n";
echo "<div class='info'>Test Date: {$test_date}, Server Time: " . date('Y-m-d H:i:s') . "</div>\n";

// Create lock with proper expiry using MySQL NOW() + INTERVAL
$expires_at = $wpdb->get_var("SELECT DATE_ADD(NOW(), INTERVAL 10 MINUTE)");
$lock_result = $wpdb->insert($locks_table, [
    'date' => $test_date,
    'time' => $test_time,
    'employee_id' => $employee_id,
    'client_id' => 'user_b_' . uniqid(),
    'expires_at' => $expires_at
]);

echo "<div class='info'>Lock expires at: {$expires_at} (using MySQL NOW() + 10 minutes)</div>\n";

if ($lock_result) {
    echo "<div class='pass'>✅ Lock created: {$test_date} {$test_time} Employee #{$employee_id}</div>\n";
} else {
    echo "<div class='fail'>❌ Lock creation failed: " . $wpdb->last_error . "</div>\n";
    die();
}

echo "<h2>Step 2: Check Database Lock Query</h2>\n";

// First check if lock exists at all
$locks_table = $wpdb->prefix . 'appointease_slot_locks';
$all_locks = $wpdb->get_results("SELECT * FROM {$locks_table}");

echo "<h3>All Locks in Database:</h3>\n";
echo "<pre>" . print_r($all_locks, true) . "</pre>\n";
echo "<div class='info'>NOW(): " . $wpdb->get_var("SELECT NOW()") . "</div>\n";

// Test the exact SQL query
$query = $wpdb->prepare(
    "SELECT DATE_FORMAT(CONCAT(date, ' ', time), '%%H:%%i') as time_slot, client_id, date, time, expires_at FROM {$locks_table} WHERE date = %s AND employee_id = %d AND expires_at > NOW()",
    $test_date, $employee_id
);

echo "<div class='info'>SQL Query: " . $query . "</div>\n";

$locked_slots = $wpdb->get_results($query);

echo "<h3>Filtered Lock Results:</h3>\n";
echo "<pre>" . print_r($locked_slots, true) . "</pre>\n";

if ($wpdb->last_error) {
    echo "<div class='fail'>❌ SQL Error: " . $wpdb->last_error . "</div>\n";
}

echo "<h2>Step 3: Check Availability API (User C Checking)</h2>\n";

// Call availability API
$response = wp_remote_post(rest_url('booking/v1/availability'), [
    'headers' => ['Content-Type' => 'application/json'],
    'body' => json_encode([
        'date' => $test_date,
        'employee_id' => $employee_id
    ])
]);

if (is_wp_error($response)) {
    echo "<div class='fail'>❌ API Error: " . $response->get_error_message() . "</div>\n";
} else {
    $data = json_decode(wp_remote_retrieve_body($response), true);
    
    echo "<h3>API Response:</h3>\n";
    echo "<pre>" . print_r($data, true) . "</pre>\n";
    
    $slot_unavailable = in_array('14:30', $data['unavailable']);
    $has_processing_status = isset($data['booking_details']['14:30']['status']) && 
                            $data['booking_details']['14:30']['status'] === 'processing';
    
    echo "<h3>Test Results:</h3>\n";
    
    if ($slot_unavailable) {
        echo "<div class='pass'>✅ PASS: Slot 14:30 is unavailable (blocked for new users)</div>\n";
    } else {
        echo "<div class='fail'>❌ FAIL: Slot 14:30 is available (RACE CONDITION EXISTS)</div>\n";
    }
    
    if ($has_processing_status) {
        echo "<div class='pass'>✅ PASS: Shows 'Processing' status</div>\n";
    } else {
        echo "<div class='info'>ℹ️ INFO: No processing status label</div>\n";
    }
}

echo "<h2>Step 4: Cleanup</h2>\n";

// Cleanup
$deleted = $wpdb->query($wpdb->prepare(
    "DELETE FROM $locks_table WHERE date = %s AND time = %s AND employee_id = %d",
    $test_date, $test_time, $employee_id
));

if ($deleted) {
    echo "<div class='pass'>✅ Test lock removed</div>\n";
} else {
    echo "<div class='fail'>❌ Cleanup failed</div>\n";
}

echo "<h2>Summary</h2>\n";
echo "<div class='info'>Test completed. Check results above.</div>\n";
?>
