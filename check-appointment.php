<?php
/**
 * Quick check for appointment and route
 */
// Navigate up to WordPress root: plugins/wordpressBookingPlugin -> plugins -> wp-content -> root
require_once(dirname(dirname(dirname(dirname(__FILE__)))) . '/wp-load.php');

global $wpdb;
$id = 'APT-2025-000209';

// Check database
$apt = $wpdb->get_row($wpdb->prepare(
    "SELECT * FROM {$wpdb->prefix}appointments WHERE strong_id = %s", $id
));

// Check if route exists
$routes = rest_get_server()->get_routes();
$route_pattern = '/appointease/v1/appointments/(?P<id>[a-zA-Z0-9\-]+)';
$route_exists = isset($routes[$route_pattern]);

?>
<!DOCTYPE html>
<html>
<head><title>Appointment Check</title></head>
<body>
<h2>Appointment Check: <?php echo esc_html($id); ?></h2>

<h3>Database Check:</h3>
<pre><?php print_r($apt); ?></pre>

<h3>Route Check:</h3>
<p>Route Pattern: <code><?php echo esc_html($route_pattern); ?></code></p>
<p>Route Exists: <strong><?php echo $route_exists ? 'YES' : 'NO'; ?></strong></p>

<h3>All AppointEase Routes:</h3>
<ul>
<?php
foreach ($routes as $route => $handlers) {
    if (strpos($route, 'appointease') !== false) {
        echo '<li>' . esc_html($route) . '</li>';
    }
}
?>
</ul>

<h3>Test DELETE Request:</h3>
<button onclick="testDelete()">Test Cancel Appointment</button>
<pre id="result"></pre>

<script>
async function testDelete() {
    const result = document.getElementById('result');
    result.textContent = 'Testing...';
    
    try {
        const response = await fetch('<?php echo rest_url("appointease/v1/appointments/" . $id); ?>', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': '<?php echo wp_create_nonce('wp_rest'); ?>'
            },
            credentials: 'same-origin'
        });
        
        const data = await response.json();
        result.textContent = JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            data: data
        }, null, 2);
    } catch (error) {
        result.textContent = 'Error: ' + error.message;
    }
}
</script>
</body>
</html>
