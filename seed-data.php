<?php
/**
 * Database Seeder Script
 * Run this file to populate dummy data in the database
 */

// WordPress environment
require_once('../../../wp-config.php');
require_once('includes/class-db-seeder.php');

// Check if user is admin
if (!current_user_can('manage_options')) {
    wp_die('Unauthorized access');
}

$action = $_GET['action'] ?? 'seed';

if ($action === 'seed') {
    Booking_DB_Seeder::seed_data();
    echo '<h2>✅ Database seeded successfully!</h2>';
    echo '<p>Added:</p>';
    echo '<ul>';
    echo '<li>3 Services (Consultation, Premium Service, Follow-up)</li>';
    echo '<li>3 Staff members (Sarah Johnson, Mike Wilson, Emma Davis)</li>';
    echo '<li>Availability slots for next 30 days (weekdays only)</li>';
    echo '</ul>';
    echo '<p><a href="?action=clear">Clear Data</a> | <a href="' . admin_url('admin.php?page=booking-admin') . '">Go to Admin</a></p>';
} elseif ($action === 'clear') {
    Booking_DB_Seeder::clear_data();
    echo '<h2>🗑️ Database cleared successfully!</h2>';
    echo '<p><a href="?action=seed">Seed Data</a> | <a href="' . admin_url('admin.php?page=booking-admin') . '">Go to Admin</a></p>';
}
?>