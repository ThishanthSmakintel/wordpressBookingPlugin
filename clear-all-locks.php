<?php
/**
 * Clear All Locked Data - Removes all slot locks and transients
 */

// Load WordPress
require_once(__DIR__ . '/../../../wp-load.php');

global $wpdb;

echo "=== CLEARING ALL LOCKED DATA ===\n\n";

// 1. Clear wp_appointease_slot_locks table
$locks_table = $wpdb->prefix . 'appointease_slot_locks';
$deleted_locks = $wpdb->query("DELETE FROM $locks_table");
echo "✅ Deleted $deleted_locks rows from $locks_table\n";

// 2. Clear all active selection transients
$transients = $wpdb->get_results(
    "SELECT option_name FROM {$wpdb->options} 
     WHERE option_name LIKE '_transient_appointease_active_selection_%'"
);

$deleted_transients = 0;
foreach ($transients as $transient) {
    $key = str_replace('_transient_', '', $transient->option_name);
    if (delete_transient($key)) {
        $deleted_transients++;
    }
}
echo "✅ Deleted $deleted_transients active selection transients\n";

// 3. Verify cleanup
$remaining_locks = $wpdb->get_var("SELECT COUNT(*) FROM $locks_table");
$remaining_transients = $wpdb->get_var(
    "SELECT COUNT(*) FROM {$wpdb->options} 
     WHERE option_name LIKE '_transient_appointease_active_selection_%'"
);

echo "\n=== VERIFICATION ===\n";
echo "Remaining locks: $remaining_locks\n";
echo "Remaining transients: $remaining_transients\n";

if ($remaining_locks == 0 && $remaining_transients == 0) {
    echo "\n✅ ALL LOCKED DATA CLEARED SUCCESSFULLY!\n";
} else {
    echo "\n⚠️ Some data may still remain\n";
}
