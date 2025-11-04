<?php
/**
 * Race Condition Simulator
 * Run: php tests/php/RaceConditionSimulator.php
 */

// Bootstrap WordPress
define('WP_USE_THEMES', false);
require_once dirname(__DIR__, 5) . '/wp-load.php';

require_once dirname(__DIR__, 2) . '/includes/class-atomic-booking.php';

class RaceConditionSimulator {
    
    private $atomic_booking;
    private $results = [];
    
    public function __construct() {
        $this->atomic_booking = Atomic_Booking::getInstance();
    }
    
    public function simulate_concurrent_bookings($num_requests = 10) {
        echo "🔄 Simulating {$num_requests} concurrent requests...\n\n";
        
        // Find next weekday
        $slot = null;
        for ($i = 1; $i <= 10; $i++) {
            $test_date = strtotime("+{$i} days");
            $day_of_week = date('w', $test_date);
            if ($day_of_week >= 1 && $day_of_week <= 5) {
                $hour = rand(10, 15);
                $minute = rand(0, 59);
                $slot = date('Y-m-d', $test_date) . " {$hour}:{$minute}:00";
                break;
            }
        }
        
        // Clean up existing booking
        global $wpdb;
        $wpdb->delete(
            $wpdb->prefix . 'appointments',
            ['appointment_date' => $slot, 'employee_id' => 1],
            ['%s', '%d']
        );
        
        echo "Testing slot: {$slot} (" . date('l', strtotime($slot)) . ")\n\n";
        
        $booking_data = [
            'name' => 'Test User',
            'phone' => '1234567890',
            'appointment_date' => $slot,
            'service_id' => 1,
            'employee_id' => 1
        ];
        
        $start = microtime(true);
        
        for ($i = 0; $i < $num_requests; $i++) {
            $data = $booking_data;
            $data['email'] = "user{$i}" . time() . "@example.com";
            
            $result = $this->atomic_booking->create_appointment_atomic($data);
            
            $this->results[] = [
                'id' => $i + 1,
                'email' => $data['email'],
                'success' => !is_wp_error($result),
                'error' => is_wp_error($result) ? $result->get_error_code() : null,
                'message' => is_wp_error($result) ? $result->get_error_message() : 'Success'
            ];
        }
        
        $time = round((microtime(true) - $start) * 1000, 2);
        
        $successful = count(array_filter($this->results, fn($r) => $r['success']));
        $failed = count($this->results) - $successful;
        
        echo "✅ Successful: {$successful}\n";
        echo "❌ Failed: {$failed}\n";
        echo "⏱️  Time: {$time}ms\n\n";
        
        // Show first few results for debugging
        if ($failed > 0) {
            echo "Sample Errors:\n";
            $error_samples = array_slice(array_filter($this->results, fn($r) => !$r['success']), 0, 3);
            foreach ($error_samples as $sample) {
                echo "  - {$sample['error']}: {$sample['message']}\n";
            }
            echo "\n";
        }
        
        if ($successful === 1 && $failed === 9) {
            echo "✅ RACE CONDITION PROTECTION: PASSED\n";
        } else {
            echo "❌ RACE CONDITION PROTECTION: FAILED\n";
            echo "   Expected: 1 success, 9 failures\n";
            echo "   Got: {$successful} success, {$failed} failures\n";
        }
    }
}

if (php_sapi_name() === 'cli') {
    $simulator = new RaceConditionSimulator();
    $simulator->simulate_concurrent_bookings(10);
}
