<?php
/**
 * Fix WebSocket table name mismatch
 * The WebSocket server expects 'wp_appointease_appointments' but we use 'wp_appointments'
 */

// Only run this once
if (!get_option('appointease_websocket_table_fixed')) {
    global $wpdb;
    
    $source_table = $wpdb->prefix . 'appointments';
    $target_table = $wpdb->prefix . 'appointease_appointments';
    
    // Check if source table exists
    $source_exists = $wpdb->get_var("SHOW TABLES LIKE '{$source_table}'") === $source_table;
    
    if ($source_exists) {
        // Create a view that maps the expected table name to the actual table
        $wpdb->query("DROP VIEW IF EXISTS {$target_table}");
        $result = $wpdb->query("CREATE VIEW {$target_table} AS SELECT * FROM {$source_table}");
        
        if ($result !== false) {
            update_option('appointease_websocket_table_fixed', true);
            error_log("[APPOINTEASE] Created view {$target_table} -> {$source_table}");
        } else {
            error_log("[APPOINTEASE] Failed to create view: " . $wpdb->last_error);
        }
    }
}
?>