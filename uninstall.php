<?php
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

global $wpdb;

// Delete appointments table
$wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}appointments");

// Delete plugin options
delete_option('booking_plugin_version');
delete_option('booking_plugin_settings');