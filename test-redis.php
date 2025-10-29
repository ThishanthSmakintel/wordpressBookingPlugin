<?php
// Quick Redis connection test
require_once __DIR__ . '/includes/class-redis-helper.php';

$redis = Redis_Helper::get_instance();

echo "=== Redis Connection Test ===\n\n";

// Test 1: Health Check
echo "1. Health Check: ";
$health = $redis->health_check();
echo $health ? "✓ PASS\n" : "✗ FAIL\n";

// Test 2: Set/Get
echo "2. Set/Get Test: ";
$redis->set('test_key', 'test_value', 10);
$value = $redis->get('test_key');
echo ($value === 'test_value') ? "✓ PASS\n" : "✗ FAIL\n";

// Test 3: Lock Slot
echo "3. Lock Slot Test: ";
$lock = $redis->lock_slot('2025-01-20', '10:00', 1, 'test_client', 'test@example.com');
echo $lock ? "✓ PASS\n" : "✗ FAIL\n";

// Test 4: Get Lock
echo "4. Get Lock Test: ";
$lockData = $redis->get_lock('2025-01-20', '10:00', 1);
echo ($lockData && $lockData['client_id'] === 'test_client') ? "✓ PASS\n" : "✗ FAIL\n";

// Test 5: Delete Lock
echo "5. Delete Lock Test: ";
$deleted = $redis->delete_lock('2025-01-20', '10:00', 1, 'test_client');
echo $deleted ? "✓ PASS\n" : "✗ FAIL\n";

// Cleanup
$redis->delete('test_key');

echo "\n=== All Tests Complete ===\n";
echo "Redis Status: " . ($redis->is_available() ? "CONNECTED" : "DISCONNECTED") . "\n";
