<?php
/**
 * Redis Locks Test Script
 * Run this to test if Redis locking is working
 */

// Load WordPress
require_once('../../../wp-load.php');

// Load Redis helper
require_once('includes/class-redis-helper.php');

$redis = Appointease_Redis_Helper::get_instance();

echo "=== Redis Locks Test ===\n\n";

// Test 1: Check Redis connection
echo "1. Testing Redis connection...\n";
if ($redis->is_enabled()) {
    echo "   ✅ Redis is connected\n\n";
} else {
    echo "   ❌ Redis is NOT connected\n\n";
    exit;
}

// Test 2: Set a selection
echo "2. Setting test selection...\n";
$date = '2025-11-04';
$employee_id = 3;
$time = '09:00';
$client_id = 'test_client_123';

$result = $redis->set_active_selection($date, $employee_id, $time, $client_id);
if ($result) {
    echo "   ✅ Selection set successfully\n";
    echo "   Key: appointease_active_{$date}_{$employee_id}_{$time}\n\n";
} else {
    echo "   ❌ Failed to set selection\n\n";
}

// Test 3: Get selections
echo "3. Getting active selections...\n";
$selections = $redis->get_active_selections($date, $employee_id);
echo "   Found " . count($selections) . " selections:\n";
foreach ($selections as $time => $data) {
    echo "   - {$time}: " . json_encode($data) . "\n";
}
echo "\n";

// Test 4: Check TTL
echo "4. Checking TTL...\n";
$key = "appointease_active_{$date}_{$employee_id}_{$time}";
$ttl = $redis->get_ttl($key);
echo "   TTL for {$key}: {$ttl} seconds\n\n";

// Test 5: Scan all keys
echo "5. Scanning all appointease keys...\n";
try {
    $redis_instance = new Redis();
    $redis_instance->pconnect('127.0.0.1', 6379);
    
    $iterator = null;
    $keys = [];
    while ($found = $redis_instance->scan($iterator, 'appointease_*', 100)) {
        $keys = array_merge($keys, $found);
        if ($iterator === 0) break;
    }
    
    echo "   Found " . count($keys) . " keys:\n";
    foreach ($keys as $key) {
        $value = $redis_instance->get($key);
        $ttl = $redis_instance->ttl($key);
        echo "   - {$key} (TTL: {$ttl}s) = {$value}\n";
    }
} catch (Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
