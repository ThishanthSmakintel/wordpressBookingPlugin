<?php
/**
 * Test Lock Priority Over Confirmed Appointments (FIXED)
 */

require_once('C:/xampp/htdocs/wordpress/blog.promoplus.com/wp-config.php');

echo "<h1>🔒 Lock Priority Test (FIXED)</h1>\n";
echo "<style>body{font-family:monospace;} .pass{color:green;} .fail{color:red;}</style>\n";

global $wpdb;

$test_date = date('Y-m-d', strtotime('next Monday'));
$test_time = '10:00:00';
$employee_id = 1;

echo "<h2>Setup</h2>\n";
echo "Date: $test_date<br>\n";
echo "Time: $test_time<br>\n";
echo "Employee: $employee_id<br>\n";
echo "Server NOW(): " . $wpdb->get_var("SELECT NOW()") . "<br>\n";

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
        'strong_id' => 'APT-TEST-FIXED'
    ]
);
$appointment_id = $wpdb->insert_id;
echo "✅ Created appointment ID: $appointment_id<br>\n";

// Step 2: Create a lock at the same time (USING MySQL DATE_ADD)
echo "<h2>Step 2: Create Lock at Same Time (MySQL DATE_ADD)</h2>\n";
$wpdb->query($wpdb->prepare(
    "INSERT INTO {$wpdb->prefix}appointease_slot_locks (date, time, employee_id, client_id, expires_at) 
     VALUES (%s, %s, %d, %s, DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
    $test_date, $test_time, $employee_id, 'test_client_fixed'
));
$lock_id = $wpdb->insert_id;
echo "✅ Created lock ID: $lock_id<br>\n";

// Verify lock was created correctly
$lock = $wpdb->get_row("SELECT *, TIMESTAMPDIFF(SECOND, NOW(), expires_at) as remaining FROM {$wpdb->prefix}appointease_slot_locks WHERE id = $lock_id");
echo "Lock expires_at: {$lock->expires_at}<br>\n";
echo "Remaining seconds: {$lock->remaining}s<br>\n";
echo ($lock->remaining > 0 ? "<span class='pass'>✅ Lock is in the future</span><br>\n" : "<span class='fail'>❌ Lock is in the past!</span><br>\n");

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
        echo $has_lock_remaining ? "<div class='pass'>✅ lock_remaining = " . $details['lock_remaining'] . "s</div>\n" : "<div class='fail'>❌ lock_remaining missing</div>\n";
        
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
