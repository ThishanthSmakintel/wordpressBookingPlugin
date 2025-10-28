<?php
require_once('C:/xampp/htdocs/wordpress/blog.promoplus.com/wp-load.php');

echo "=== TESTING AVAILABILITY API ===\n\n";

// Test cases based on actual database data
$test_cases = [
    [
        'name' => 'Employee 2, Date 2025-10-24 (has confirmed appointment at 10:00)',
        'date' => '2025-10-24',
        'employee_id' => 2,
        'expected' => ['10:00']
    ],
    [
        'name' => 'Employee 1, Date 2025-10-27 (has confirmed appointment at 10:00)',
        'date' => '2025-10-27',
        'employee_id' => 1,
        'expected' => ['10:00']
    ],
    [
        'name' => 'Employee 2, Date 2025-10-27 (has confirmed appointment at 09:00)',
        'date' => '2025-10-27',
        'employee_id' => 2,
        'expected' => ['09:00']
    ],
    [
        'name' => 'Employee 3, Date 2025-10-28 (NO appointments)',
        'date' => '2025-10-28',
        'employee_id' => 3,
        'expected' => []
    ],
    [
        'name' => 'Employee 1, Date 2025-11-03 (has confirmed appointment at 10:00)',
        'date' => '2025-11-03',
        'employee_id' => 1,
        'expected' => ['10:00']
    ]
];

global $wpdb;
$appointments_table = $wpdb->prefix . 'appointments';

foreach ($test_cases as $test) {
    echo "TEST: {$test['name']}\n";
    echo "Query: date={$test['date']}, employee_id={$test['employee_id']}\n";
    
    // Run the actual query
    $booked = $wpdb->get_results($wpdb->prepare(
        "SELECT TIME_FORMAT(appointment_date, '%%H:%%i') as time_slot, name, status 
         FROM {$appointments_table} 
         WHERE employee_id = %d AND DATE(appointment_date) = %s AND status IN ('confirmed', 'created')",
        $test['employee_id'], $test['date']
    ));
    
    $unavailable = array_map(function($apt) { return $apt->time_slot; }, $booked);
    
    echo "Result: " . json_encode($unavailable) . "\n";
    echo "Expected: " . json_encode($test['expected']) . "\n";
    
    if (json_encode($unavailable) === json_encode($test['expected'])) {
        echo "✓ PASS\n";
    } else {
        echo "✗ FAIL\n";
        echo "Details:\n";
        foreach ($booked as $apt) {
            echo "  - {$apt->time_slot}: {$apt->name} ({$apt->status})\n";
        }
    }
    
    echo "\n";
}

echo "=== END TEST ===\n";
