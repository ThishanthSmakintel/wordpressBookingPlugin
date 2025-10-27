<?php
/**
 * Debug Lock Query
 */

require_once('C:/xampp/htdocs/wordpress/blog.promoplus.com/wp-config.php');

echo "<h1>🔍 Debug Lock Query</h1>\n";
echo "<style>body{font-family:monospace;background:#f5f5f5;padding:20px;} pre{background:white;padding:10px;border:1px solid #ddd;}</style>\n";

global $wpdb;

$test_date = date('Y-m-d', strtotime('next Monday'));
$test_time = '10:00:00';
$employee_id = 1;

echo "<h2>Test Parameters</h2>\n";
echo "Date: $test_date<br>\n";
echo "Time: $test_time<br>\n";
echo "Employee: $employee_id<br>\n";

// Create a test lock
echo "<h2>Creating Test Lock</h2>\n";
$result = $wpdb->insert(
    $wpdb->prefix . 'appointease_slot_locks',
    [
        'date' => $test_date,
        'time' => $test_time,
        'employee_id' => $employee_id,
        'client_id' => 'debug_test_' . time(),
        'expires_at' => date('Y-m-d H:i:s', strtotime('+10 minutes'))
    ]
);

if ($result) {
    $lock_id = $wpdb->insert_id;
    echo "✅ Created lock ID: $lock_id<br>\n";
    
    // Show what was inserted
    echo "<h3>Inserted Data:</h3>\n";
    $inserted = $wpdb->get_row("SELECT * FROM {$wpdb->prefix}appointease_slot_locks WHERE id = $lock_id");
    echo "<pre>" . print_r($inserted, true) . "</pre>\n";
    
    // Test the exact query used in check_availability
    echo "<h2>Testing Availability Query</h2>\n";
    $query = $wpdb->prepare(
        "SELECT DATE_FORMAT(CONCAT(date, ' ', time), '%%H:%%i') as time_slot, client_id, TIMESTAMPDIFF(SECOND, NOW(), expires_at) as remaining FROM {$wpdb->prefix}appointease_slot_locks WHERE date = %s AND employee_id = %d AND expires_at > NOW()",
        $test_date, $employee_id
    );
    
    echo "<h3>SQL Query:</h3>\n";
    echo "<pre>$query</pre>\n";
    
    $locks = $wpdb->get_results($query);
    
    echo "<h3>Query Results (" . count($locks) . " locks found):</h3>\n";
    if (count($locks) > 0) {
        echo "<pre>" . print_r($locks, true) . "</pre>\n";
        echo "<div style='color:green;font-weight:bold;'>✅ Lock query working correctly!</div>\n";
    } else {
        echo "<div style='color:red;font-weight:bold;'>❌ Lock query returned 0 results!</div>\n";
        
        // Debug: Try simpler query
        echo "<h3>Debug: All locks for this date:</h3>\n";
        $all_locks = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}appointease_slot_locks WHERE date = %s",
            $test_date
        ));
        echo "<pre>" . print_r($all_locks, true) . "</pre>\n";
        
        // Check if expires_at is in the future
        echo "<h3>Debug: Current server time:</h3>\n";
        echo "NOW(): " . $wpdb->get_var("SELECT NOW()") . "<br>\n";
        echo "Lock expires_at: " . $inserted->expires_at . "<br>\n";
        echo "Is future? " . (strtotime($inserted->expires_at) > time() ? 'YES' : 'NO') . "<br>\n";
    }
    
    // Cleanup
    echo "<h2>Cleanup</h2>\n";
    $wpdb->delete($wpdb->prefix . 'appointease_slot_locks', ['id' => $lock_id]);
    echo "✅ Deleted test lock<br>\n";
    
} else {
    echo "<div style='color:red;'>❌ Failed to create lock: " . $wpdb->last_error . "</div>\n";
}

?>
