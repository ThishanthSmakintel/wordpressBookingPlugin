<?php
/**
 * Test Lock Priority Over Confirmed Appointments
 */

require_once('C:/xampp/htdocs/wordpress/blog.promoplus.com/wp-config.php');

echo "<h1>🔒 Lock Priority Test</h1>\n";
echo "<style>body{font-family:monospace;} .pass{color:green;} .fail{color:red;}</style>\n";

global $wpdb;

$test_date = date('Y-m-d', strtotime('next Monday'));
$test_time = '10:00:00';
$employee_id = 1;

echo "<h2>Setup</h2>\n";
echo "Date: $test_date<br>\n";
echo "Time: $test_time<br>\n";
echo "Employee: $employee_id<br>\n";

// Step 1: Create a confirmed appointment at 10:00
echo "<h2>Step 1: Create Confirmed Appointment</h2>\n";
$wpdb->insert(
    $wpdb->prefix . 'appointments',
    [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'phone' => '555-0000',
        'appointment_date' => "$test_date $test_time",
        'status' => 'confirmed',
        'service_id' => 1,
        'employee_id' => $employee_id,
        'strong_id' => 'APT-TEST-001'
    ]
);
$appointment_id = $wpdb->insert_id;
echo "✅ Created appointment ID: $appointment_id<br>\n";

// Step 2: Create a lock at the same time
echo "<h2>Step 2: Create Lock at Same Time</h2>\n";
$wpdb->insert(
    $wpdb->prefix . 'appointease_slot_locks',
    [
        'date' => $test_date,
        'time' => $test_time,
        'employee_id' => $employee_id,
        'client_id' => 'test_client_priority',
        'expires_at' => date('Y-m-d H:i:s', strtotime('+10 minutes'))
    ]
);
$lock_id = $wpdb->insert_id;
echo "✅ Created lock ID: $lock_id<br>\n";

// Step 3: Call availability API
echo "<h2>Step 3: Check Availability API</h2>\n";
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
    echo "<pre>" . json_encode($data, JSON_PRETTY_PRINT) . "</pre>\n";
    
    // Check if 10:00 is in unavailable
    $slot_unavailable = in_array('10:00', $data['unavailable']);
    echo $slot_unavailable ? "<div class='pass'>✅ Slot marked as unavailable</div>\n" : "<div class='fail'>❌ Slot NOT marked as unavailable</div>\n";
    
    // Check booking_details for 10:00
    if (isset($data['booking_details']['10:00'])) {
        $details = $data['booking_details']['10:00'];
        echo "<h3>Booking Details for 10:00:</h3>\n";
        echo "<pre>" . json_encode($details, JSON_PRETTY_PRINT) . "</pre>\n";
        
        // Verify it shows lock data, not appointment data
        $is_processing = isset($details['status']) && $details['status'] === 'processing';
        $is_locked = isset($details['is_locked']) && $details['is_locked'] === true;
        $has_lock_remaining = isset($details['lock_remaining']);
        
        echo $is_processing ? "<div class='pass'>✅ Status = 'processing'</div>\n" : "<div class='fail'>❌ Status = '" . ($details['status'] ?? 'N/A') . "' (should be 'processing')</div>\n";
        echo $is_locked ? "<div class='pass'>✅ is_locked = true</div>\n" : "<div class='fail'>❌ is_locked missing or false</div>\n";
        echo $has_lock_remaining ? "<div class='pass'>✅ lock_remaining present</div>\n" : "<div class='fail'>❌ lock_remaining missing</div>\n";
        
        if ($is_processing && $is_locked && $has_lock_remaining) {
            echo "<h2 class='pass'>🎉 SUCCESS: Lock takes priority over confirmed appointment!</h2>\n";
        } else {
            echo "<h2 class='fail'>❌ FAILED: Confirmed appointment data returned instead of lock</h2>\n";
        }
    } else {
        echo "<div class='fail'>❌ No booking_details for 10:00</div>\n";
    }
}

// Cleanup
echo "<h2>Cleanup</h2>\n";
$wpdb->delete($wpdb->prefix . 'appointments', ['id' => $appointment_id]);
$wpdb->delete($wpdb->prefix . 'appointease_slot_locks', ['id' => $lock_id]);
echo "✅ Cleaned up test data<br>\n";

echo "<hr>\n";
echo "<p><a href='test_api.php'>← Back to Full Test Suite</a></p>\n";
?>
