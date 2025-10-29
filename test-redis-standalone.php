<?php
/**
 * Standalone Redis Test (No WordPress Required)
 * Run: php test-redis-standalone.php
 */

class StandaloneRedisTest {
    private $redis;
    private $results = [];
    
    public function __construct() {
        if (!class_exists('Redis')) {
            die("❌ Redis extension not installed. Install: pecl install redis\n");
        }
        
        $this->redis = new Redis();
    }
    
    public function run() {
        echo "🧪 Standalone Redis Test Suite\n";
        echo str_repeat("=", 60) . "\n\n";
        
        if (!$this->connect()) {
            die("❌ Cannot connect to Redis. Ensure Redis is running on 127.0.0.1:6379\n");
        }
        
        $this->test_setnx_ttl();
        $this->test_scan();
        $this->test_ttl_expiration();
        $this->test_hashes();
        $this->test_pubsub();
        $this->test_persistence();
        $this->test_performance();
        
        $this->print_summary();
    }
    
    private function connect() {
        try {
            $connected = $this->redis->connect('127.0.0.1', 6379, 2.5);
            if (!$connected) return false;
            
            $ping = $this->redis->ping();
            $success = ($ping === '+PONG' || $ping === 'PONG' || $ping === true);
            
            $this->log_result('Redis Connection', $success, $success ? 'Connected to 127.0.0.1:6379' : 'Ping failed');
            return $success;
        } catch (Exception $e) {
            $this->log_result('Redis Connection', false, $e->getMessage());
            return false;
        }
    }
    
    private function test_setnx_ttl() {
        echo "\n1️⃣  SETNX + TTL (Atomic Lock)\n";
        echo str_repeat("-", 60) . "\n";
        
        $key = 'test_lock_' . time();
        $value = json_encode(['user' => 'test123', 'time' => date('H:i:s')]);
        
        // Test atomic lock
        $locked = $this->redis->set($key, $value, ['nx', 'ex' => 10]);
        $this->log_result('Atomic Lock', $locked, 'Lock acquired with 10s TTL');
        
        // Test duplicate prevention
        $duplicate = $this->redis->set($key, $value, ['nx', 'ex' => 10]);
        $this->log_result('Duplicate Prevention', !$duplicate, 'Duplicate lock prevented');
        
        // Check TTL
        $ttl = $this->redis->ttl($key);
        $this->log_result('TTL Check', $ttl > 0 && $ttl <= 10, "TTL: {$ttl}s");
        
        // Cleanup
        $this->redis->del($key);
    }
    
    private function test_scan() {
        echo "\n2️⃣  SCAN (Non-blocking Iteration)\n";
        echo str_repeat("-", 60) . "\n";
        
        // Create test keys
        for ($i = 1; $i <= 10; $i++) {
            $this->redis->setex("test_scan_{$i}", 60, "value_{$i}");
        }
        
        // Test SCAN
        $iterator = null;
        $found = 0;
        $start = microtime(true);
        
        while ($keys = $this->redis->scan($iterator, 'test_scan_*', 100)) {
            $found += count($keys);
            if ($iterator === 0) break;
        }
        
        $duration = (microtime(true) - $start) * 1000;
        
        $this->log_result('SCAN Operation', $found === 10, "Found {$found} keys in " . round($duration, 2) . "ms");
        $this->log_result('Performance', $duration < 10, "Non-blocking operation");
        
        // Cleanup
        for ($i = 1; $i <= 10; $i++) {
            $this->redis->del("test_scan_{$i}");
        }
    }
    
    private function test_ttl_expiration() {
        echo "\n3️⃣  TTL Auto-Expiration\n";
        echo str_repeat("-", 60) . "\n";
        
        $key = 'test_expire';
        $this->redis->setex($key, 2, 'will_expire');
        
        $exists_before = $this->redis->exists($key);
        $this->log_result('Key Created', $exists_before, 'Key exists with 2s TTL');
        
        echo "   ⏳ Waiting 3 seconds...\n";
        sleep(3);
        
        $exists_after = $this->redis->exists($key);
        $this->log_result('Auto Expiration', !$exists_after, 'Key expired automatically');
    }
    
    private function test_hashes() {
        echo "\n4️⃣  Redis Hashes\n";
        echo str_repeat("-", 60) . "\n";
        
        $hash_key = 'test_hash_' . time();
        
        // Set multiple fields
        $this->redis->hSet($hash_key, '09:00', json_encode(['user' => 'test1']));
        $this->redis->hSet($hash_key, '10:00', json_encode(['user' => 'test2']));
        $this->redis->hSet($hash_key, '11:00', json_encode(['user' => 'test3']));
        $this->redis->expire($hash_key, 60);
        
        // Get all fields
        $all = $this->redis->hGetAll($hash_key);
        $this->log_result('Hash Storage', count($all) === 3, "Stored " . count($all) . " fields");
        
        // Check field exists
        $exists = $this->redis->hExists($hash_key, '09:00');
        $this->log_result('Hash Field Check', $exists, 'Field exists check works');
        
        // Delete field
        $deleted = $this->redis->hDel($hash_key, '09:00');
        $remaining = $this->redis->hGetAll($hash_key);
        $this->log_result('Hash Field Delete', count($remaining) === 2, "Remaining: " . count($remaining));
        
        // Cleanup
        $this->redis->del($hash_key);
    }
    
    private function test_pubsub() {
        echo "\n5️⃣  Pub/Sub\n";
        echo str_repeat("-", 60) . "\n";
        
        $channel = 'test_channel_' . time();
        $message = json_encode(['action' => 'test', 'timestamp' => time()]);
        
        // Publish message
        $subscribers = $this->redis->publish($channel, $message);
        $this->log_result('Publish', true, "Published to {$subscribers} subscribers");
        
        // Check active channels
        $channels = $this->redis->pubsub('CHANNELS', 'test_*');
        $this->log_result('Channel List', is_array($channels), "Active channels: " . count($channels));
    }
    
    private function test_persistence() {
        echo "\n6️⃣  Persistence Configuration\n";
        echo str_repeat("-", 60) . "\n";
        
        try {
            $aof = $this->redis->config('GET', 'appendonly');
            $aof_enabled = isset($aof['appendonly']) && $aof['appendonly'] === 'yes';
            $this->log_result('AOF Persistence', true, $aof_enabled ? 'Enabled ✓' : 'Disabled (recommend enabling)');
            
            $maxmem = $this->redis->config('GET', 'maxmemory');
            $maxmem_val = isset($maxmem['maxmemory']) ? $maxmem['maxmemory'] : '0';
            $this->log_result('Memory Limit', true, "Max memory: " . ($maxmem_val === '0' ? 'unlimited' : $maxmem_val));
            
            $notify = $this->redis->config('GET', 'notify-keyspace-events');
            $notify_val = isset($notify['notify-keyspace-events']) ? $notify['notify-keyspace-events'] : '';
            $this->log_result('Keyspace Events', true, "Config: '{$notify_val}'");
        } catch (Exception $e) {
            $this->log_result('Config Access', false, 'CONFIG command disabled or error: ' . $e->getMessage());
        }
    }
    
    private function test_performance() {
        echo "\n7️⃣  Performance Benchmarks\n";
        echo str_repeat("-", 60) . "\n";
        
        $iterations = 1000;
        
        // SET benchmark
        $start = microtime(true);
        for ($i = 0; $i < $iterations; $i++) {
            $this->redis->set("perf_test_{$i}", "value_{$i}", ['ex' => 60]);
        }
        $set_time = ((microtime(true) - $start) / $iterations) * 1000;
        $this->log_result('SET Performance', $set_time < 5, sprintf('%.3fms per operation', $set_time));
        
        // GET benchmark
        $start = microtime(true);
        for ($i = 0; $i < $iterations; $i++) {
            $this->redis->get("perf_test_{$i}");
        }
        $get_time = ((microtime(true) - $start) / $iterations) * 1000;
        $this->log_result('GET Performance', $get_time < 5, sprintf('%.3fms per operation', $get_time));
        
        // DEL benchmark
        $start = microtime(true);
        for ($i = 0; $i < $iterations; $i++) {
            $this->redis->del("perf_test_{$i}");
        }
        $del_time = ((microtime(true) - $start) / $iterations) * 1000;
        $this->log_result('DEL Performance', $del_time < 5, sprintf('%.3fms per operation', $del_time));
        
        // Calculate ops/sec
        $ops_per_sec = round(1000 / $set_time);
        $this->log_result('Throughput', true, "~{$ops_per_sec} ops/sec");
    }
    
    private function log_result($test, $passed, $message) {
        $status = $passed ? '✅' : '❌';
        $this->results[] = ['test' => $test, 'passed' => $passed];
        echo "   {$status} {$test}: {$message}\n";
    }
    
    private function print_summary() {
        echo "\n" . str_repeat("=", 60) . "\n";
        echo "📊 Test Summary\n";
        echo str_repeat("=", 60) . "\n";
        
        $total = count($this->results);
        $passed = count(array_filter($this->results, fn($r) => $r['passed']));
        $failed = $total - $passed;
        
        echo "Total Tests: {$total}\n";
        echo "✅ Passed: {$passed}\n";
        echo "❌ Failed: {$failed}\n";
        echo "Success Rate: " . round(($passed / $total) * 100, 1) . "%\n\n";
        
        if ($passed === $total) {
            echo "🎉 All tests passed! Redis is working correctly.\n\n";
            echo "Next Steps:\n";
            echo "1. Enable AOF: redis-cli CONFIG SET appendonly yes\n";
            echo "2. Set memory: redis-cli CONFIG SET maxmemory 256mb\n";
            echo "3. Enable events: redis-cli CONFIG SET notify-keyspace-events Ex\n";
        } else {
            echo "⚠️  Some tests failed. Check Redis configuration.\n";
        }
    }
}

// Run tests
try {
    $tester = new StandaloneRedisTest();
    $tester->run();
} catch (Exception $e) {
    echo "❌ Test failed: " . $e->getMessage() . "\n";
    exit(1);
}
