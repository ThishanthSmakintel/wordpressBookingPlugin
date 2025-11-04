<?php
/**
 * Real-World Booking Scenarios Test
 * Tests actual user behavior patterns
 * 
 * Run: php tests/php/RealWorldTest.php
 */

define('WP_USE_THEMES', false);
require_once dirname(__DIR__, 5) . '/wp-load.php';
require_once dirname(__DIR__, 2) . '/includes/class-atomic-booking.php';

class RealWorldTest {
    
    private $atomic_booking;
    
    public function __construct() {
        $this->atomic_booking = Atomic_Booking::getInstance();
    }
    
    public function run_all_scenarios() {
        echo "\n╔════════════════════════════════════════════════════════════╗\n";
        echo "║          REAL-WORLD BOOKING SCENARIOS TEST                ║\n";
        echo "╚════════════════════════════════════════════════════════════╝\n\n";
        
        $this->scenario_1_happy_path();
        $this->scenario_2_double_booking_attempt();
        $this->scenario_3_last_minute_booking();
        $this->scenario_4_reschedule_attempt();
        $this->scenario_5_peak_hour_rush();
        $this->scenario_6_cancel_and_rebook();
        
        echo "\n✅ ALL REAL-WORLD SCENARIOS TESTED\n\n";
    }
    
    private function scenario_1_happy_path() {
        echo "📋 Scenario 1: Happy Path - Normal Booking\n";
        echo str_repeat("-", 60) . "\n";
        
        $result = $this->atomic_booking->create_appointment_atomic([
            'name' => 'Alice Johnson',
            'email' => 'alice' . time() . '@example.com',
            'phone' => '555-0101',
            'appointment_date' => date('Y-m-d H:i:s', strtotime('+1 day 10:00')),
            'service_id' => 1,
            'employee_id' => 1
        ]);
        
        if (!is_wp_error($result)) {
            echo "✅ Booking successful\n";
            echo "   Appointment ID: {$result['strong_id']}\n";
            echo "   Status: Confirmed\n";
        } else {
            echo "❌ Booking failed: " . $result->get_error_message() . "\n";
        }
        echo "\n";
    }
    
    private function scenario_2_double_booking_attempt() {
        echo "📋 Scenario 2: Two Users Try Same Slot\n";
        echo str_repeat("-", 60) . "\n";
        
        $slot = date('Y-m-d H:i:s', strtotime('+2 days 14:00'));
        
        // User 1 books
        $result1 = $this->atomic_booking->create_appointment_atomic([
            'name' => 'Bob Smith',
            'email' => 'bob' . time() . '@example.com',
            'phone' => '555-0102',
            'appointment_date' => $slot,
            'service_id' => 1,
            'employee_id' => 1
        ]);
        
        // User 2 tries same slot
        $result2 = $this->atomic_booking->create_appointment_atomic([
            'name' => 'Carol White',
            'email' => 'carol' . time() . '@example.com',
            'phone' => '555-0103',
            'appointment_date' => $slot,
            'service_id' => 1,
            'employee_id' => 1
        ]);
        
        if (!is_wp_error($result1) && is_wp_error($result2)) {
            echo "✅ Race condition prevented\n";
            echo "   Bob got the slot: {$result1['strong_id']}\n";
            echo "   Carol was blocked: {$result2->get_error_message()}\n";
        } else {
            echo "❌ Race condition failed\n";
        }
        echo "\n";
    }
    
    private function scenario_3_last_minute_booking() {
        echo "📋 Scenario 3: Last Minute Booking (Tomorrow)\n";
        echo str_repeat("-", 60) . "\n";
        
        $result = $this->atomic_booking->create_appointment_atomic([
            'name' => 'David Lee',
            'email' => 'david' . time() . '@example.com',
            'phone' => '555-0104',
            'appointment_date' => date('Y-m-d H:i:s', strtotime('+1 day 09:00')),
            'service_id' => 1,
            'employee_id' => 1
        ]);
        
        if (!is_wp_error($result)) {
            echo "✅ Last minute booking accepted\n";
            echo "   Appointment ID: {$result['strong_id']}\n";
        } else {
            echo "❌ Booking rejected: " . $result->get_error_message() . "\n";
        }
        echo "\n";
    }
    
    private function scenario_4_reschedule_attempt() {
        echo "📋 Scenario 4: User Tries to Rebook (Idempotency)\n";
        echo str_repeat("-", 60) . "\n";
        
        $data = [
            'name' => 'Emma Davis',
            'email' => 'emma' . time() . '@example.com',
            'phone' => '555-0105',
            'appointment_date' => date('Y-m-d H:i:s', strtotime('+3 days 11:00')),
            'service_id' => 1,
            'employee_id' => 1,
            'idempotency_key' => 'emma-booking-' . time()
        ];
        
        $result1 = $this->atomic_booking->create_appointment_atomic($data);
        sleep(1);
        $result2 = $this->atomic_booking->create_appointment_atomic($data);
        
        if (!is_wp_error($result1) && is_wp_error($result2)) {
            echo "✅ Duplicate prevented\n";
            echo "   First booking: {$result1['strong_id']}\n";
            echo "   Second attempt blocked: {$result2->get_error_message()}\n";
        } else {
            echo "❌ Duplicate not prevented\n";
        }
        echo "\n";
    }
    
    private function scenario_5_peak_hour_rush() {
        echo "📋 Scenario 5: Peak Hour Rush (5 Users, 1 Slot)\n";
        echo str_repeat("-", 60) . "\n";
        
        $slot = date('Y-m-d H:i:s', strtotime('+4 days 15:00'));
        $results = [];
        
        for ($i = 1; $i <= 5; $i++) {
            $results[] = $this->atomic_booking->create_appointment_atomic([
                'name' => "User {$i}",
                'email' => "user{$i}" . time() . rand(1000, 9999) . '@example.com',
                'phone' => "555-010{$i}",
                'appointment_date' => $slot,
                'service_id' => 1,
                'employee_id' => 1
            ]);
        }
        
        $successful = array_filter($results, fn($r) => !is_wp_error($r));
        $failed = array_filter($results, fn($r) => is_wp_error($r));
        
        if (count($successful) === 1 && count($failed) === 4) {
            echo "✅ Peak hour handled correctly\n";
            echo "   Winner: " . $successful[array_key_first($successful)]['strong_id'] . "\n";
            echo "   Blocked: 4 users\n";
        } else {
            echo "❌ Peak hour failed\n";
            echo "   Successful: " . count($successful) . "\n";
            echo "   Failed: " . count($failed) . "\n";
        }
        echo "\n";
    }
    
    private function scenario_6_cancel_and_rebook() {
        echo "📋 Scenario 6: Cancel and Rebook Same Slot\n";
        echo str_repeat("-", 60) . "\n";
        
        $slot = date('Y-m-d H:i:s', strtotime('+5 days 10:00'));
        
        // First booking
        $result1 = $this->atomic_booking->create_appointment_atomic([
            'name' => 'Frank Miller',
            'email' => 'frank' . time() . '@example.com',
            'phone' => '555-0106',
            'appointment_date' => $slot,
            'service_id' => 1,
            'employee_id' => 1
        ]);
        
        if (!is_wp_error($result1)) {
            echo "✅ Initial booking: {$result1['strong_id']}\n";
            
            // Simulate cancellation (would need cancel endpoint)
            global $wpdb;
            $wpdb->update(
                $wpdb->prefix . 'appointments',
                ['status' => 'cancelled'],
                ['id' => $result1['appointment_id']],
                ['%s'], ['%d']
            );
            
            // Try to rebook same slot
            $result2 = $this->atomic_booking->create_appointment_atomic([
                'name' => 'Grace Taylor',
                'email' => 'grace' . time() . '@example.com',
                'phone' => '555-0107',
                'appointment_date' => $slot,
                'service_id' => 1,
                'employee_id' => 1
            ]);
            
            if (!is_wp_error($result2)) {
                echo "✅ Rebook successful: {$result2['strong_id']}\n";
            } else {
                echo "❌ Rebook failed: " . $result2->get_error_message() . "\n";
            }
        }
        echo "\n";
    }
}

if (php_sapi_name() === 'cli') {
    $test = new RealWorldTest();
    $test->run_all_scenarios();
}
