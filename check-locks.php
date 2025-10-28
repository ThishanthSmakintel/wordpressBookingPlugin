<?php
require_once('C:/xampp/htdocs/wordpress/blog.promoplus.com/wp-load.php');

global $wpdb;

echo "=== CHECKING SLOT LOCKS ===\n\n";

$locks_table = $wpdb->prefix . 'appointease_slot_locks';

// Get all locks
$all_locks = $wpdb->get_results("SELECT * FROM {$locks_table}");
echo "Total locks in table: " . count($all_locks) . "\n\n";

if (count($all_locks) > 0) {
    echo "ALL LOCKS:\n";
    foreach ($all_locks as $lock) {
        $expired = strtotime($lock->expires_at) < time() ? 'EXPIRED' : 'ACTIVE';
        echo "  - Date: {$lock->date}, Time: {$lock->time}, Employee: {$lock->employee_id}, Status: {$expired}\n";
        echo "    Client: {$lock->client_id}\n";
        echo "    Expires: {$lock->expires_at}\n\n";
    }
}

// Get active locks only
$active_locks = $wpdb->get_results("SELECT * FROM {$locks_table} WHERE expires_at > NOW()");
echo "Active locks (not expired): " . count($active_locks) . "\n\n";

// Check transients
echo "=== CHECKING TRANSIENTS ===\n\n";
$transients = $wpdb->get_results(
    "SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE '_transient_appointease_active_%'"
);

echo "Total active selection transients: " . count($transients) . "\n\n";

foreach ($transients as $transient) {
    $key = str_replace('_transient_', '', $transient->option_name);
    $data = maybe_unserialize($transient->option_value);
    echo "Transient: {$key}\n";
    echo "Data: " . print_r($data, true) . "\n\n";
}

echo "=== END CHECK ===\n";
