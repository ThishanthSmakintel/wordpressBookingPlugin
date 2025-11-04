<?php
require_once('../../../wp-load.php');
require_once('includes/class-redis-helper.php');

$redis = Appointease_Redis_Helper::get_instance();

echo "=== Testing get_active_selections ===\n\n";

$date = '2025-11-04';
$employee_id = 3;

echo "Calling get_active_selections('{$date}', {$employee_id})...\n\n";

$selections = $redis->get_active_selections($date, $employee_id);

echo "Result: " . count($selections) . " selections found\n";
foreach ($selections as $time => $data) {
    echo "  - {$time}: " . json_encode($data) . "\n";
}

echo "\n=== Check PHP error log for detailed SCAN output ===\n";
