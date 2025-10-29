<?php
/**
 * Redis Feature Test Suite
 * Run: php test-redis.php
 */

// Load WordPress - find wp-load.php
$wp_load = __DIR__ . '/../../../../../../wp-load.php';
if (!file_exists($wp_load)) {
    $wp_load = __DIR__ . '/../../../../../wp-load.php';
}
if (!file_exists($wp_load)) {
    die("Cannot find wp-load.php. Run from plugin directory or use standalone test.\n");
}
require_once($wp_load);

// Load Redis classes
require_once(__DIR__ . '/includes/class-redis-helper.php');
require_once(__DIR__ . '/includes/class-redis-pubsub.php');

class RedisFeatureTest {
    private $redis;
    private $pubsub;
    private $results = [];
    
    public function __construct() {
        $this->redis = Appointease_Redis_Helper::get_instance();
        $this->pubsub = Appointease_Redis_PubSub::get_instance();
    }
    
    public function run_all_tests() {
        echo "🧪 Redis Feature Test Suite\n";
        echo str_repeat("=", 60) . "\n\n";
        
        $this->test_connection();
        $this->test_atomic_lock();
        $this->test_scan_operation();
        $this->test_ttl_expiration();
        $this->test_hash_operations();
        $this->test_pubsub();
        $this->test_persistence_config();
        $this->test_monitoring();
        $this->test_performance();
        
        $this->print_summary();
    }
    
    private function test_connection() {
        echo "1️⃣  Testing Redis Connection\n";
        echo str_repeat("-", 60) . "\n";
        
        $enabled = $this->redis->is_enabled();
        $this->log_result('Connection', $enabled, 'Redis connected successfully');
        
        if ($enabled) {
            $health = $this->redis->health_check();
            $this->log_result('Health Check', $health, 'Health check passed');
        }
        
        echo "\n";
    }
    
    private function test_atomic_lock() {
        echo "2️⃣  Testing SETNX + TTL (Atomic Lock)\n";
        echo str_repeat("-", 60) . "\n";
        
        $key = 'appointease_lock_test_' . time();
        $data = ['user_id' => 'test123', 'time' => '09:00'];
        
        // Test 1: Lock should succeed
        $locked = $this->redis->atomic_lock($key, $data, 10);
        $this->log_result('First Lock', $locked, 'Lock acquired successfully');
        
        // Test 2: Second lock should fail (already locked)
        $locked_again = $this->redis->atomic_lock($key, $data, 10);
        $this->log_result('Duplicate Lock Prevention', !$locked_again, 'Duplicate lock prevented');
        
        // Test 3: Check TTL
        $ttl = $this->redis->get_ttl($key);
        $this->log_result('TTL Set', $ttl > 0 && $ttl <= 10, "TTL: {$ttl}s");
        
        // Test 4: Verify data
        $stored = $this->redis->get_lock($key);
        $this->log_result('Data Integrity', $stored['user_id'] === 'test123', 'Data stored correctly');
        
        // Cleanup
        $this->redis->delete_lock($key);
        
        echo "\n";
    }
    
    private function test_scan_operation() {
        echo "3️⃣  Testing SCAN (Non-blocking Iteration)\n";
        echo str_repeat("-", 60) . "\n";
        
        // Create test keys
        $test_keys = [];
        for ($i = 1; $i <= 5; $i++) {
            $key = "appointease_lock_scan_test_{$i}";
            $this->redis->atomic_lock($key, ['test' => $i], 60);
            $test_keys[] = $key;
        }
        
        // Test SCAN
        $start = microtime(true);
        $locks = $this->redis->get_locks_by_pattern('appointease_lock_scan_test_*');
        $duration = (microtime(true) - $start) * 1000;
        
        $this->log_result('SCAN Operation', count($locks) === 5, "Found " . count($locks) . " keys in {$duration}ms");
        $this->log_result('Performance', $duration < 10, "SCAN completed in {$duration}ms");
        
        // Verify TTL included
        if (!empty($locks)) {
            $has_ttl = isset($locks[0]['_ttl']);
            $this->log_result('TTL Metadata', $has_ttl, 'TTL included in results');
        }
        
        // Cleanup
        foreach ($test_keys as $key) {
            $this->redis->delete_lock($key);
        }
        
        echo "\n";
    }
    
    private function test_ttl_expiration() {
        echo "4️⃣  Testing TTL Auto-Expiration\n";
        echo str_repeat("-", 60) . "\n";
        
        $key = 'appointease_lock_ttl_test';
        
        // Create lock with 2 second TTL
        $this->redis->atomic_lock($key, ['test' => 'expiration'], 2);
        
        // Check exists
        $exists_before = $this->redis->exists($key);
        $this->log_result('Key Created', $exists_before, 'Key exists after creation');
        
        // Wait for expiration
        echo "   ⏳ Waiting 3 seconds for expiration...\n";
        sleep(3);
        
        // Check expired
        $exists_after = $this->redis->exists($key);
        $this->log_result('Auto Expiration', !$exists_after, 'Key expired automatically');
        
        echo "\n";
    }
    
    private function test_hash_operations() {
        echo "5️⃣  Testing Redis Hashes (Grouped Locks)\n";
        echo str_repeat("-", 60) . "\n";
        
        $date = date('Y-m-d');
        $employee_id = 1;
        
        // Lock multiple slots in hash
        $slots = ['09:00', '10:00', '11:00'];
        foreach ($slots as $time) {
            $locked = $this->redis->lock_slot_hash($date, $employee_id, $time, [
                'user_id' => 'test123',
                'client_id' => 'CLIENT_test'
            ], 60);
            $this->log_result("Hash Lock {$time}", $locked, "Slot {$time} locked in hash");
        }
        
        // Get all locks from hash
        $all_locks = $this->redis->get_all_locks_hash($date, $employee_id);
        $this->log_result('Hash Retrieval', count($all_locks) === 3, "Retrieved " . count($all_locks) . " slots from hash");
        
        // Test duplicate prevention
        $duplicate = $this->redis->lock_slot_hash($date, $employee_id, '09:00', ['test' => 'dup'], 60);
        $this->log_result('Hash Duplicate Prevention', !$duplicate, 'Duplicate slot prevented');
        
        // Unlock one slot
        $unlocked = $this->redis->unlock_slot_hash($date, $employee_id, '09:00');
        $this->log_result('Hash Unlock', $unlocked, 'Slot unlocked from hash');
        
        // Verify count after unlock
        $remaining = $this->redis->get_all_locks_hash($date, $employee_id);
        $this->log_result('Hash After Unlock', count($remaining) === 2, "Remaining slots: " . count($remaining));
        
        echo "\n";
    }
    
    private function test_pubsub() {
        echo "6️⃣  Testing Pub/Sub (Scoped Channels)\n";
        echo str_repeat("-", 60) . "\n";
        
        if (!$this->pubsub->is_enabled()) {
            $this->log_result('Pub/Sub', false, 'Pub/Sub not available');
            echo "\n";
            return;
        }
        
        $date = date('Y-m-d');
        $employee_id = 1;
        
        // Test scoped channel publish
        $published = $this->pubsub->publish_slot_event('lock', $date, $employee_id, '09:00', [
            'user_id' => 'test123',
            'client_id' => 'CLIENT_test'
        ]);
        
        $this->log_result('Scoped Publish', $published !== false, 'Event published to scoped channel');
        
        // Test channel stats
        $stats = $this->pubsub->get_channel_stats();
        if ($stats) {
            $channel_count = is_array($stats['pubsub_channels']) ? count($stats['pubsub_channels']) : 0;
            $this->log_result('Channel Stats', true, "Active channels: {$channel_count}");
        }
        
        echo "\n";
    }
    
    private function test_persistence_config() {
        echo "7️⃣  Testing Persistence Configuration\n";
        echo str_repeat("-", 60) . "\n";
        
        $config = $this->redis->get_persistence_config();
        
        if ($config) {
            $aof_enabled = $config['aof_enabled'];
            $this->log_result('AOF Persistence', $aof_enabled, $aof_enabled ? 'AOF enabled ✓' : 'AOF disabled (recommend enabling)');
            
            if (isset($config['save_config'])) {
                $this->log_result('RDB Config', true, 'RDB save config: ' . print_r($config['save_config'], true));
            }
        } else {
            $this->log_result('Persistence Check', false, 'Could not retrieve config');
        }
        
        echo "\n";
    }
    
    private function test_monitoring() {
        echo "8️⃣  Testing Monitoring & Stats\n";
        echo str_repeat("-", 60) . "\n";
        
        $stats = $this->redis->get_stats();
        
        if ($stats) {
            $this->log_result('Memory Usage', true, "Used: {$stats['used_memory']}");
            $this->log_result('Connected Clients', true, "Clients: {$stats['connected_clients']}");
            $this->log_result('Hit Rate', true, "Hit rate: {$stats['hit_rate']}%");
            $this->log_result('Uptime', true, "Uptime: {$stats['uptime_seconds']}s");
        } else {
            $this->log_result('Stats Retrieval', false, 'Could not retrieve stats');
        }
        
        echo "\n";
    }
    
    private function test_performance() {
        echo "9️⃣  Testing Performance Benchmarks\n";
        echo str_repeat("-", 60) . "\n";
        
        // Test 1: Lock performance
        $iterations = 100;
        $start = microtime(true);
        for ($i = 0; $i < $iterations; $i++) {
            $key = "appointease_lock_perf_{$i}";
            $this->redis->atomic_lock($key, ['test' => $i], 60);
        }
        $lock_time = ((microtime(true) - $start) / $iterations) * 1000;
        $this->log_result('Lock Performance', $lock_time < 5, sprintf('Avg: %.2fms per lock', $lock_time));
        
        // Test 2: Get performance
        $start = microtime(true);
        for ($i = 0; $i < $iterations; $i++) {
            $key = "appointease_lock_perf_{$i}";
            $this->redis->get_lock($key);
        }
        $get_time = ((microtime(true) - $start) / $iterations) * 1000;
        $this->log_result('Get Performance', $get_time < 5, sprintf('Avg: %.2fms per get', $get_time));
        
        // Test 3: Delete performance
        $start = microtime(true);
        for ($i = 0; $i < $iterations; $i++) {
            $key = "appointease_lock_perf_{$i}";
            $this->redis->delete_lock($key);
        }
        $del_time = ((microtime(true) - $start) / $iterations) * 1000;
        $this->log_result('Delete Performance', $del_time < 5, sprintf('Avg: %.2fms per delete', $del_time));
        
        echo "\n";
    }
    
    private function log_result($test, $passed, $message) {
        $status = $passed ? '✅' : '❌';
        $this->results[] = ['test' => $test, 'passed' => $passed];
        echo "   {$status} {$test}: {$message}\n";
    }
    
    private function print_summary() {
        echo str_repeat("=", 60) . "\n";
        echo "📊 Test Summary\n";
        echo str_repeat("=", 60) . "\n";
        
        $total = count($this->results);
        $passed = count(array_filter($this->results, fn($r) => $r['passed']));
        $failed = $total - $passed;
        
        echo "Total Tests: {$total}\n";
        echo "✅ Passed: {$passed}\n";
        echo "❌ Failed: {$failed}\n";
        echo "Success Rate: " . round(($passed / $total) * 100, 1) . "%\n\n";
        
        if ($failed > 0) {
            echo "Failed Tests:\n";
            foreach ($this->results as $result) {
                if (!$result['passed']) {
                    echo "  - {$result['test']}\n";
                }
            }
        }
        
        echo "\n";
        
        if ($passed === $total) {
            echo "🎉 All tests passed! Redis is configured correctly.\n";
        } else {
            echo "⚠️  Some tests failed. Check Redis configuration.\n";
        }
    }
}

// Run tests
try {
    $tester = new RedisFeatureTest();
    $tester->run_all_tests();
} catch (Exception $e) {
    echo "❌ Test suite failed: " . $e->getMessage() . "\n";
    exit(1);
}
