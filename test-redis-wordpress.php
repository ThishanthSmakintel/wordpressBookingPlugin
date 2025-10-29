<?php
/**
 * Test Redis within WordPress context
 * Access: http://your-site.com/wp-content/plugins/wordpressBookingPlugin/test-redis-wordpress.php
 */

// Load WordPress
require_once('C:/xampp/htdocs/wordpress/blog.promoplus.com/wp-load.php');

// Load Redis helper
require_once('includes/class-redis-helper.php');

header('Content-Type: text/plain; charset=utf-8');

echo "🔍 Testing Redis in WordPress Context\n";
echo str_repeat('=', 50) . "\n\n";

// Get Redis instance
$redis = Appointease_Redis_Helper::get_instance();

echo "1️⃣ Redis Status: ";
if ($redis->is_enabled()) {
    echo "✅ ENABLED\n\n";
    
    // Test operations
    echo "2️⃣ Testing Operations:\n";
    
    // Test write
    $test_key = 'appointease_test_' . time();
    $test_data = ['test' => true, 'timestamp' => time()];
    $write = $redis->lock_slot($test_key, ['client_id' => 'test', 'data' => $test_data], 10);
    echo "   Write: " . ($write ? "✅ Success" : "❌ Failed") . "\n";
    
    // Test read
    $read = $redis->get_lock($test_key);
    echo "   Read: " . ($read ? "✅ Success" : "❌ Failed") . "\n";
    
    // Test delete
    $delete = $redis->delete_lock($test_key);
    echo "   Delete: " . ($delete ? "✅ Success" : "❌ Failed") . "\n\n";
    
    // Get stats
    echo "3️⃣ Redis Stats:\n";
    $stats = $redis->get_stats();
    if ($stats) {
        echo "   Memory: " . $stats['used_memory'] . "\n";
        echo "   Clients: " . $stats['connected_clients'] . "\n";
        echo "   Hit Rate: " . $stats['hit_rate'] . "%\n";
        echo "   Uptime: " . $stats['uptime_seconds'] . "s\n\n";
    }
    
    echo "🎯 Result: Redis is WORKING in WordPress!\n";
    echo "\n💡 Now test in browser:\n";
    echo "   Paste in console: await fetch('/wp-json/appointease/v1/redis/stats').then(r=>r.json()).then(d=>console.log(d))\n";
    
} else {
    echo "❌ DISABLED\n\n";
    
    echo "🔍 Debugging:\n";
    echo "   PHP Redis extension: " . (class_exists('Redis') ? "✅ Installed" : "❌ Missing") . "\n";
    
    if (class_exists('Redis')) {
        try {
            $test = new Redis();
            $connected = @$test->connect('127.0.0.1', 6379, 2);
            echo "   Redis connection: " . ($connected ? "✅ Success" : "❌ Failed") . "\n";
            
            if ($connected) {
                $pong = $test->ping();
                echo "   Redis ping: " . ($pong ? "✅ PONG" : "❌ No response") . "\n";
            }
        } catch (Exception $e) {
            echo "   Error: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n❌ Redis is NOT working in WordPress context\n";
    echo "   Check wp-content/debug.log for errors\n";
}
