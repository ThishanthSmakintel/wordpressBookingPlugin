<?php
/**
 * Reschedule Slot Selection Test
 * Tests that User A's slot selection during reschedule is visible to User B
 * Run: php tests/php/RescheduleSlotTest.php
 */

define('WP_USE_THEMES', false);
require_once dirname(__DIR__, 5) . '/wp-load.php';

class RescheduleSlotTest {
    
    private $redis;
    private $date;
    private $employee_id = 1;
    
    public function __construct() {
        require_once dirname(__DIR__, 2) . '/includes/class-redis-helper.php';
        $this->redis = Appointease_Redis_Helper::get_instance();
        $this->date = date('Y-m-d', strtotime('+1 day'));
    }
    
    public function run_all_tests() {
        echo "🧪 RESCHEDULE SLOT SELECTION TESTS\n";
        echo "==================================\n\n";
        
        $this->test_redis_connection();
        $this->test_slot_selection_storage();
        $this->test_multi_user_visibility();
        $this->test_heartbeat_response();
        
        echo "\n✅ ALL TESTS COMPLETED\n";
    }
    
    private function test_redis_connection() {
        echo "1️⃣  Testing Redis Connection...\n";
        
        $is_enabled = $this->redis->is_enabled();
        $health = $this->redis->health_check();
        
        if ($is_enabled && $health) {
            echo "   ✅ Redis: CONNECTED\n";
        } else {
            echo "   ⚠️  Redis: UNAVAILABLE (using transients fallback)\n";
        }
        echo "\n";
    }
    
    private function test_slot_selection_storage() {
        echo "2️⃣  Testing Slot Selection Storage...\n";
        
        $time = '10:30';
        $client_a = 'client_test_A_' . time();
        
        // User A selects slot
        $result = $this->redis->set_active_selection($this->date, $this->employee_id, $time, $client_a);
        
        if ($result) {
            echo "   ✅ User A selection stored\n";
        } else {
            echo "   ❌ Failed to store selection\n";
        }
        
        // Verify it's stored
        $selections = $this->redis->get_active_selections($this->date, $this->employee_id);
        
        if (isset($selections[$time])) {
            echo "   ✅ Selection retrieved: " . json_encode($selections[$time]) . "\n";
        } else {
            echo "   ❌ Selection not found\n";
        }
        
        echo "\n";
    }
    
    private function test_multi_user_visibility() {
        echo "3️⃣  Testing Multi-User Visibility...\n";
        
        $time_a = '09:30';
        $time_b = '10:45';
        $client_a = 'client_test_A_' . time();
        $client_b = 'client_test_B_' . time();
        
        // User A selects 09:30
        $this->redis->set_active_selection($this->date, $this->employee_id, $time_a, $client_a);
        echo "   👤 User A selected: {$time_a}\n";
        
        // User B selects 10:45
        $this->redis->set_active_selection($this->date, $this->employee_id, $time_b, $client_b);
        echo "   👤 User B selected: {$time_b}\n";
        
        // Get all selections
        $selections = $this->redis->get_active_selections($this->date, $this->employee_id);
        
        echo "   📊 Total selections: " . count($selections) . "\n";
        
        if (isset($selections[$time_a]) && isset($selections[$time_b])) {
            echo "   ✅ Both selections visible\n";
            echo "      - {$time_a}: " . $selections[$time_a]['client_id'] . "\n";
            echo "      - {$time_b}: " . $selections[$time_b]['client_id'] . "\n";
        } else {
            echo "   ❌ Missing selections\n";
        }
        
        echo "\n";
    }
    
    private function test_heartbeat_response() {
        echo "4️⃣  Testing Heartbeat Response...\n";
        
        $time = '11:00';
        $client_a = 'client_test_A_' . time();
        $client_b = 'client_test_B_' . time();
        
        // User A selects slot
        $this->redis->set_active_selection($this->date, $this->employee_id, $time, $client_a);
        
        // Simulate heartbeat poll from User B
        $poll_data = [
            'date' => $this->date,
            'employee_id' => $this->employee_id,
            'client_id' => $client_b
        ];
        
        // Get selections (simulating heartbeat handler logic)
        $selections = $this->redis->get_active_selections($this->date, $this->employee_id);
        
        // Extract active times (should show ALL selections)
        $active_times = [];
        foreach ($selections as $slot_time => $sel_data) {
            if (isset($sel_data['client_id'])) {
                $active_times[] = $slot_time;
            }
        }
        
        echo "   📡 Heartbeat response:\n";
        echo "      - Active selections: " . json_encode($active_times) . "\n";
        
        if (in_array($time, $active_times)) {
            echo "   ✅ User A's selection visible to User B\n";
        } else {
            echo "   ❌ User A's selection NOT visible to User B\n";
        }
        
        // Get booked slots from database
        global $wpdb;
        $booked_slots = $wpdb->get_col($wpdb->prepare(
            "SELECT TIME_FORMAT(TIME(appointment_date), '%%H:%%i') 
             FROM {$wpdb->prefix}appointments 
             WHERE DATE(appointment_date) = %s 
             AND employee_id = %d 
             AND status IN ('confirmed', 'created')",
            $this->date, $this->employee_id
        ));
        
        echo "      - Booked slots: " . json_encode($booked_slots) . "\n";
        
        echo "\n";
    }
    
    public function cleanup() {
        echo "🧹 Cleaning up test data...\n";
        
        // Clear all test selections
        if ($this->redis->is_enabled()) {
            $pattern = "appointease_active_{$this->date}_{$this->employee_id}_*";
            $this->redis->clear_all_locks();
        }
        
        echo "   ✅ Cleanup complete\n";
    }
}

if (php_sapi_name() === 'cli') {
    $test = new RescheduleSlotTest();
    $test->run_all_tests();
    $test->cleanup();
}
