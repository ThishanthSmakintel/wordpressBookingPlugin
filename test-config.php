<?php
/**
 * Test Configuration Sync
 * Access: http://blog.promoplus.com/wp-content/plugins/wordpressBookingPlugin/test-config.php
 */

// Load WordPress
define('WP_USE_THEMES', false);
require_once('C:/xampp/htdocs/wordpress/blog.promoplus.com/wp-load.php');

// Load config class
require_once('includes/class-config.php');

$config = AppointEase_Config::get_instance();

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>AppointEase Config Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .test-section { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .success { color: #28a745; font-weight: bold; }
        .value { background: #fff; padding: 10px; border-left: 4px solid #1CBC9B; margin: 10px 0; }
        h1 { color: #1CBC9B; }
        h2 { color: #333; border-bottom: 2px solid #1CBC9B; padding-bottom: 10px; }
        .day-list { display: flex; gap: 10px; flex-wrap: wrap; }
        .day { padding: 8px 16px; background: #1CBC9B; color: white; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>✅ AppointEase Configuration Test</h1>
    
    <div class="test-section">
        <h2>📅 Working Days Configuration</h2>
        <p><strong>From Database:</strong></p>
        <div class="value">
            <?php 
            $working_days = $config->get_working_days();
            echo '<pre>' . print_r($working_days, true) . '</pre>';
            ?>
        </div>
        
        <p><strong>Human Readable:</strong></p>
        <div class="day-list">
            <?php
            $day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            foreach ($working_days as $day) {
                echo '<div class="day">' . $day_names[intval($day)] . '</div>';
            }
            ?>
        </div>
    </div>
    
    <div class="test-section">
        <h2>⏰ Business Hours</h2>
        <div class="value">
            <strong>Start Time:</strong> <?php echo $config->get_start_time(); ?><br>
            <strong>End Time:</strong> <?php echo $config->get_end_time(); ?><br>
            <strong>Slot Duration:</strong> <?php echo $config->get_slot_duration(); ?> minutes<br>
            <strong>Advance Booking:</strong> <?php echo $config->get_advance_booking_days(); ?> days
        </div>
    </div>
    
    <div class="test-section">
        <h2>🔒 Rate Limiting</h2>
        <div class="value">
            <strong>Requests per minute:</strong> <?php echo $config->get_rate_limit_requests(); ?><br>
            <strong>Window:</strong> <?php echo $config->get_rate_limit_window(); ?> seconds<br>
            <strong>Booking limit:</strong> <?php echo $config->get_rate_limit_booking(); ?> per hour
        </div>
    </div>
    
    <div class="test-section">
        <h2>🎨 Appearance</h2>
        <div class="value">
            <strong>Primary Color:</strong> <span style="display: inline-block; width: 30px; height: 30px; background: <?php echo $config->get_primary_color(); ?>; border-radius: 4px; vertical-align: middle;"></span> <?php echo $config->get_primary_color(); ?><br>
            <strong>Button Text:</strong> <?php echo $config->get_button_text(); ?>
        </div>
    </div>
    
    <div class="test-section">
        <h2>🧪 Test Instructions</h2>
        <ol>
            <li>Go to <a href="/wp-admin/admin.php?page=appointease-settings" target="_blank">Settings Page</a></li>
            <li>Change working days (check/uncheck days)</li>
            <li>Click "Save Changes"</li>
            <li>Refresh this page</li>
            <li>Verify the working days updated above ✅</li>
        </ol>
    </div>
    
    <p style="text-align: center; color: #666; margin-top: 40px;">
        <a href="/wp-admin/admin.php?page=appointease-settings" style="background: #1CBC9B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Settings</a>
    </p>
</body>
</html>
