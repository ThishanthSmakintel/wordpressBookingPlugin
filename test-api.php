<?php
/**
 * Simple API test script
 * Access via: /wp-content/plugins/wordpressBookingPlugin/test-api.php
 */

// Load WordPress
require_once('../../../../../wp-load.php');

// Test if API endpoints are registered
$routes = rest_get_server()->get_routes();

echo "<h2>AppointEase API Routes Test</h2>";

echo "<h3>Available Routes:</h3>";
echo "<ul>";
foreach ($routes as $route => $handlers) {
    if (strpos($route, 'appointease') !== false || strpos($route, 'booking') !== false) {
        echo "<li><strong>$route</strong>";
        foreach ($handlers as $handler) {
            $methods = isset($handler['methods']) ? implode(', ', array_keys($handler['methods'])) : 'Unknown';
            echo " ($methods)";
        }
        echo "</li>";
    }
}
echo "</ul>";

// Test specific endpoints
$test_urls = [
    '/wp-json/appointease/v1/settings',
    '/wp-json/booking/v1/settings',
    '/wp-json/appointease/v1/time-slots',
    '/wp-json/booking/v1/time-slots',
    '/wp-json/appointease/v1/services',
    '/wp-json/booking/v1/services'
];

echo "<h3>Endpoint Tests:</h3>";
foreach ($test_urls as $url) {
    echo "<p><strong>Testing: $url</strong><br>";
    
    $response = wp_remote_get(home_url($url));
    
    if (is_wp_error($response)) {
        echo "❌ Error: " . $response->get_error_message();
    } else {
        $code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        
        if ($code === 200) {
            echo "✅ Success (200)";
            $data = json_decode($body, true);
            if ($data) {
                echo " - Data keys: " . implode(', ', array_keys($data));
            }
        } else {
            echo "❌ Failed ($code)";
            if ($body) {
                $error_data = json_decode($body, true);
                if (isset($error_data['message'])) {
                    echo " - " . $error_data['message'];
                }
            }
        }
    }
    echo "</p>";
}

echo "<h3>WordPress Info:</h3>";
echo "<p>Site URL: " . home_url() . "</p>";
echo "<p>REST URL: " . rest_url() . "</p>";
echo "<p>Plugin Active: " . (is_plugin_active('wordpressBookingPlugin/booking-plugin.php') ? 'Yes' : 'No') . "</p>";