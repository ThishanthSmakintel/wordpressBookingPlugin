<?php
require_once('../../../wp-config.php');

global $wpdb;
$table = $wpdb->prefix . 'appointments';

// Update appointments without strong_id
$appointments = $wpdb->get_results("SELECT id FROM $table WHERE strong_id IS NULL OR strong_id = ''");

foreach($appointments as $apt) {
    $year = date('Y');
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $result = '';
    for ($i = 0; $i < 6; $i++) {
        $result .= $chars[rand(0, strlen($chars) - 1)];
    }
    $strong_id = "APT-{$year}-{$result}";
    
    $wpdb->update($table, 
        array('strong_id' => $strong_id),
        array('id' => $apt->id),
        array('%s'),
        array('%d')
    );
}

echo "Fixed " . count($appointments) . " appointments with missing strong_id";
?>