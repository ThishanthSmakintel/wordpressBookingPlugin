<?php
// Update appointments table to use full name
require_once('../../../wp-config.php');

global $wpdb;
$table = $wpdb->prefix . 'appointments';

// Update existing records to use full name format
$wpdb->query("UPDATE $table SET name = REPLACE(name, '  ', ' ') WHERE name LIKE '%  %'");

echo "✅ Name field updated successfully!";
?>