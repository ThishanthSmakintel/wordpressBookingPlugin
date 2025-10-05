<?php
/**
 * Test if the settings endpoint is registered
 * Add this to functions.php temporarily or run as a standalone script
 */

// Check if we're in WordPress context
if (!function_exists('rest_get_server')) {
    // Load WordPress
    require_once('../../../wp-load.php');
}

// Get REST server
$server = rest_get_server();
$routes = $server->get_routes();

echo "Checking for appointease/v1 routes:\n";
echo "=====================================\n";

foreach ($routes as $route => $handlers) {
    if (strpos($route, '/appointease/v1') === 0) {
        echo "Found route: $route\n";
        foreach ($handlers as $handler) {
            echo "  Methods: " . implode(', ', $handler['methods']) . "\n";
            echo "  Callback: " . (is_array($handler['callback']) ? 
                get_class($handler['callback'][0]) . '::' . $handler['callback'][1] : 
                $handler['callback']) . "\n";
        }
        echo "\n";
    }
}

// Specifically check for settings route
if (isset($routes['/appointease/v1/settings'])) {
    echo "✅ Settings route is registered!\n";
} else {
    echo "❌ Settings route NOT found!\n";
}

// Check if the class exists and method exists
if (class_exists('Booking_API_Endpoints')) {
    echo "✅ Booking_API_Endpoints class exists\n";
    $endpoints = new Booking_API_Endpoints();
    if (method_exists($endpoints, 'get_settings')) {
        echo "✅ get_settings method exists\n";
    } else {
        echo "❌ get_settings method NOT found\n";
    }
} else {
    echo "❌ Booking_API_Endpoints class NOT found\n";
}