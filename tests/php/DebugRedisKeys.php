<?php
/**
 * Debug Redis Keys Test
 * Run: php tests/php/DebugRedisKeys.php
 */

// Load WordPress
require_once 'C:/xampp/htdocs/wordpress/blog.promoplus.com/wp-load.php';
require_once dirname(__FILE__) . '/../../includes/class-redis-helper.php';

echo "=== Redis Keys Debug Test ===\n\n";

$redis = Appointease_Redis_Helper::get_instance();

if (!$redis->is_enabled()) {
    echo "❌ Redis NOT available\n";
    exit(1);
}

echo "✓ Redis connected\n\n";

// Get raw Redis connection
$redis_raw = new Redis();
$redis_raw->pconnect('127.0.0.1', 6379);

// Test date and employee
$date = '2025-11-05';
$employee_id = 3;

echo "Searching for keys matching: appointease_active_{$date}_{$employee_id}_*\n\n";

// Use SCAN to find all matching keys
$iterator = null;
$found_keys = [];
while ($keys = $redis_raw->scan($iterator, "appointease_active_{$date}_{$employee_id}_*", 100)) {
    foreach ($keys as $key) {
        $found_keys[] = $key;
    }
    if ($iterator === 0) break;
}

echo "Found " . count($found_keys) . " keys:\n";
foreach ($found_keys as $key) {
    $value = $redis_raw->get($key);
    $ttl = $redis_raw->ttl($key);
    echo "  - $key\n";
    echo "    Value: $value\n";
    echo "    TTL: $ttl seconds\n";
    echo "    Decoded: " . print_r(json_decode($value, true), true) . "\n";
}

echo "\n=== Testing get_active_selections() ===\n";
$selections = $redis->get_active_selections($date, $employee_id);
echo "Result: " . print_r($selections, true) . "\n";
echo "Count: " . count($selections) . "\n";

echo "\n✓ Test complete\n";
