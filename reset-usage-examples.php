<?php
/**
 * Database Reset Usage Examples
 * 
 * This file demonstrates how to use the database reset filters
 * DO NOT include this file in production - it's for reference only
 */

// Example 1: Reset complete database
function example_reset_complete_database() {
    $result = apply_filters('appointease_reset_database', true);
    
    if (isset($result['success'])) {
        echo "Database reset successfully!";
        print_r($result['counts']); // Shows new table counts
    } else {
        echo "Error: " . $result['error'];
    }
}

// Example 2: Reset only appointments
function example_reset_appointments() {
    $result = apply_filters('appointease_reset_appointments', true);
    
    if (isset($result['success'])) {
        echo "Appointments reset successfully!";
    } else {
        echo "Error: " . $result['error'];
    }
}

// Example 3: Reset only customers
function example_reset_customers() {
    $result = apply_filters('appointease_reset_customers', true);
    
    if (isset($result['success'])) {
        echo "Customers reset successfully!";
    } else {
        echo "Error: " . $result['error'];
    }
}

// Example 4: Get current table counts
function example_get_table_counts() {
    $counts = apply_filters('appointease_get_table_counts', null);
    
    echo "Current table counts:\n";
    foreach ($counts as $table => $count) {
        echo "$table: $count records\n";
    }
}

// Example 5: Custom function using the reset functionality
function custom_reset_for_testing() {
    // Check if user has permission
    if (!current_user_can('manage_options')) {
        return false;
    }
    
    // Get current counts
    $before_counts = apply_filters('appointease_get_table_counts', null);
    
    // Reset appointments and customers only
    apply_filters('appointease_reset_appointments', true);
    apply_filters('appointease_reset_customers', true);
    
    // Get new counts
    $after_counts = apply_filters('appointease_get_table_counts', null);
    
    return [
        'before' => $before_counts,
        'after' => $after_counts
    ];
}

// Example 6: Hook into WordPress actions
add_action('init', function() {
    // Only run for administrators
    if (current_user_can('manage_options') && isset($_GET['reset_demo'])) {
        
        switch ($_GET['reset_demo']) {
            case 'all':
                $result = apply_filters('appointease_reset_database', true);
                break;
                
            case 'appointments':
                $result = apply_filters('appointease_reset_appointments', true);
                break;
                
            case 'customers':
                $result = apply_filters('appointease_reset_customers', true);
                break;
                
            case 'counts':
                $result = apply_filters('appointease_get_table_counts', null);
                break;
        }
        
        if (isset($result)) {
            wp_die('<pre>' . print_r($result, true) . '</pre>');
        }
    }
});

/**
 * Available Filters:
 * 
 * 1. appointease_reset_database - Reset complete database
 *    Usage: apply_filters('appointease_reset_database', true)
 * 
 * 2. appointease_reset_appointments - Reset appointments table
 *    Usage: apply_filters('appointease_reset_appointments', true)
 * 
 * 3. appointease_reset_customers - Reset customers table
 *    Usage: apply_filters('appointease_reset_customers', true)
 * 
 * 4. appointease_reset_services - Reset services table
 *    Usage: apply_filters('appointease_reset_services', true)
 * 
 * 5. appointease_reset_staff - Reset staff table
 *    Usage: apply_filters('appointease_reset_staff', true)
 * 
 * 6. appointease_get_table_counts - Get current table counts
 *    Usage: apply_filters('appointease_get_table_counts', null)
 * 
 * All reset filters require 'true' as parameter for confirmation
 * All reset filters return array with 'success' or 'error' key
 */