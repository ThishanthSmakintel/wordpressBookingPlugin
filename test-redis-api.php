<?php
/**
 * REST API Redis Test
 * Tests all Redis endpoints via WordPress REST API
 * Run: php test-redis-api.php
 */

class RedisAPITest {
    private $base_url;
    private $results = [];
    
    public function __construct($base_url) {
        $this->base_url = rtrim($base_url, '/');
    }
    
    public function run() {
        echo "🧪 Redis REST API Test Suite\n";
        echo str_repeat("=", 60) . "\n";
        echo "Base URL: {$this->base_url}\n\n";
        
        $this->test_redis_stats();
        $this->test_slot_select();
        $this->test_slot_deselect();
        $this->test_availability();
        $this->test_debug_locks();
        $this->test_clear_locks();
        
        $this->print_summary();
    }
    
    private function test_redis_stats() {
        echo "1️⃣  Testing Redis Stats Endpoint\n";
        echo str_repeat("-", 60) . "\n";
        
        $response = $this->api_get('/wp-json/appointease/v1/redis/stats');
        
        if ($response) {
            $this->log_result('Stats Endpoint', true, 'Endpoint accessible');
            
            if (isset($response['enabled'])) {
                $this->log_result('Redis Enabled', $response['enabled'], $response['enabled'] ? 'Redis active' : 'Redis disabled');
            }
            
            if (isset($response['stats'])) {
                $stats = $response['stats'];
                $this->log_result('Memory Usage', isset($stats['used_memory']), "Memory: " . ($stats['used_memory'] ?? 'N/A'));
                $this->log_result('Hit Rate', isset($stats['hit_rate']), "Hit rate: " . ($stats['hit_rate'] ?? 'N/A') . "%");
            }
            
            if (isset($response['active_locks'])) {
                $this->log_result('Active Locks', true, "Locks: {$response['active_locks']}");
            }
        } else {
            $this->log_result('Stats Endpoint', false, 'Failed to fetch stats');
        }
        
        echo "\n";
    }
    
    private function test_slot_select() {
        echo "2️⃣  Testing Slot Selection (Lock)\n";
        echo str_repeat("-", 60) . "\n";
        
        $data = [
            'date' => date('Y-m-d'),
            'time' => '09:00',
            'employee_id' => 1
        ];
        
        $response = $this->api_post('/wp-json/appointease/v1/slots/select', $data);
        
        if ($response) {
            $this->log_result('Slot Lock', isset($response['success']) && $response['success'], 'Slot locked successfully');
            
            if (isset($response['client_id'])) {
                $this->log_result('Client ID', true, "Client: {$response['client_id']}");
            }
            
            if (isset($response['storage'])) {
                $this->log_result('Storage Type', true, "Storage: {$response['storage']}");
            }
            
            if (isset($response['ttl'])) {
                $this->log_result('TTL Set', $response['ttl'] === 600, "TTL: {$response['ttl']}s");
            }
        } else {
            $this->log_result('Slot Lock', false, 'Failed to lock slot');
        }
        
        echo "\n";
    }
    
    private function test_slot_deselect() {
        echo "3️⃣  Testing Slot Deselection (Unlock)\n";
        echo str_repeat("-", 60) . "\n";
        
        $data = [
            'date' => date('Y-m-d'),
            'time' => '09:00',
            'employee_id' => 1
        ];
        
        $response = $this->api_post('/wp-json/appointease/v1/slots/deselect', $data);
        
        if ($response) {
            $this->log_result('Slot Unlock', isset($response['success']) && $response['success'], 'Slot unlocked successfully');
        } else {
            $this->log_result('Slot Unlock', false, 'Failed to unlock slot');
        }
        
        echo "\n";
    }
    
    private function test_availability() {
        echo "4️⃣  Testing Availability Check\n";
        echo str_repeat("-", 60) . "\n";
        
        $data = [
            'date' => date('Y-m-d'),
            'employee_id' => 1
        ];
        
        $response = $this->api_post('/wp-json/booking/v1/availability', $data);
        
        if ($response) {
            $this->log_result('Availability Check', true, 'Endpoint accessible');
            
            if (isset($response['unavailable'])) {
                $count = is_array($response['unavailable']) ? count($response['unavailable']) : 0;
                $this->log_result('Unavailable Slots', true, "Found {$count} unavailable slots");
            }
            
            if (isset($response['booking_details'])) {
                $this->log_result('Booking Details', true, 'Details included');
            }
        } else {
            $this->log_result('Availability Check', false, 'Failed to check availability');
        }
        
        echo "\n";
    }
    
    private function test_debug_locks() {
        echo "5️⃣  Testing Debug Locks Endpoint\n";
        echo str_repeat("-", 60) . "\n";
        
        $response = $this->api_get('/wp-json/appointease/v1/debug/locks');
        
        if ($response) {
            $this->log_result('Debug Locks', true, 'Endpoint accessible');
            
            if (isset($response['locked_slots'])) {
                $count = is_array($response['locked_slots']) ? count($response['locked_slots']) : 0;
                $this->log_result('Lock Count', true, "Active locks: {$count}");
            }
        } else {
            $this->log_result('Debug Locks', false, 'Failed to fetch locks');
        }
        
        echo "\n";
    }
    
    private function test_clear_locks() {
        echo "6️⃣  Testing Clear Locks Endpoint\n";
        echo str_repeat("-", 60) . "\n";
        
        $response = $this->api_post('/wp-json/appointease/v1/clear-locks', []);
        
        if ($response) {
            $this->log_result('Clear Locks', isset($response['success']) && $response['success'], 'Locks cleared');
            
            if (isset($response['redis_cleared'])) {
                $this->log_result('Redis Cleared', true, "Redis: {$response['redis_cleared']} keys");
            }
            
            if (isset($response['deleted_transients'])) {
                $this->log_result('Transients Cleared', true, "Transients: {$response['deleted_transients']}");
            }
        } else {
            $this->log_result('Clear Locks', false, 'Failed to clear locks');
        }
        
        echo "\n";
    }
    
    private function api_get($endpoint) {
        $url = $this->base_url . $endpoint;
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($http_code !== 200) {
            echo "   ⚠️  HTTP {$http_code}: {$url}\n";
            return null;
        }
        
        return json_decode($response, true);
    }
    
    private function api_post($endpoint, $data) {
        $url = $this->base_url . $endpoint;
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($http_code !== 200) {
            echo "   ⚠️  HTTP {$http_code}: {$url}\n";
            return null;
        }
        
        return json_decode($response, true);
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
        
        if ($passed === $total) {
            echo "🎉 All API tests passed!\n";
        } else {
            echo "⚠️  Some API tests failed.\n";
        }
    }
}

// Configuration
$base_url = 'http://localhost/wordpress'; // Change this to your WordPress URL

// Check if URL provided via command line
if (isset($argv[1])) {
    $base_url = $argv[1];
}

echo "Usage: php test-redis-api.php [base_url]\n";
echo "Example: php test-redis-api.php http://localhost/wordpress\n\n";

// Run tests
try {
    $tester = new RedisAPITest($base_url);
    $tester->run();
} catch (Exception $e) {
    echo "❌ Test failed: " . $e->getMessage() . "\n";
    exit(1);
}
