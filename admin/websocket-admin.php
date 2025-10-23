<?php
/**
 * WebSocket Server Admin Page
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('admin_menu', 'appointease_websocket_menu');

function appointease_websocket_menu() {
    add_submenu_page(
        'booking-admin',
        'WebSocket Server',
        'WebSocket Server',
        'manage_options',
        'appointease-websocket',
        'appointease_websocket_page'
    );
}

function appointease_websocket_page() {
    $manager = Appointease_WebSocket_Manager::getInstance();
    $status = $manager->get_status();
    
    if (isset($_POST['start_server']) && wp_verify_nonce($_POST['_wpnonce'], 'appointease_websocket_' . get_current_user_id())) {
        $manager->check_and_start_server();
        $status = $manager->get_status();
        echo '<div class="notice notice-success"><p>Server start command sent!</p></div>';
    }
    
    ?>
    <div class="wrap">
        <h1>⚡ WebSocket Server</h1>
        
        <div class="card" style="max-width: 800px;">
            <h2>Server Status</h2>
            
            <?php if ($status['running']): ?>
                <p style="font-size: 16px;">
                    <span style="color: green; font-size: 20px;">●</span> 
                    <strong>Running</strong> on port <?php echo $status['port']; ?>
                </p>
                <p>Real-time WebSocket updates are active! 🎉</p>
            <?php else: ?>
                <p style="font-size: 16px;">
                    <span style="color: red; font-size: 20px;">●</span> 
                    <strong>Not Running</strong>
                </p>
                <p>Using HTTP polling fallback (10 second intervals)</p>
            <?php endif; ?>
            
            <hr>
            
            <h3>Node.js Status</h3>
            <?php if ($status['node_installed']): ?>
                <p><span style="color: green;">✓</span> Node.js is installed</p>
            <?php else: ?>
                <p><span style="color: red;">✗</span> Node.js is not installed</p>
                <p>Install Node.js from <a href="https://nodejs.org" target="_blank">nodejs.org</a></p>
            <?php endif; ?>
            
            <hr>
            
            <h3>Manual Start</h3>
            <p>If auto-start doesn't work, start manually:</p>
            <ol>
                <li>Open Command Prompt / Terminal</li>
                <li>Navigate to: <code><?php echo plugin_dir_path(dirname(__FILE__)); ?></code></li>
                <li>Run: <code>npm install</code> (first time only)</li>
                <li>Run: <code>node websocket-server.js</code></li>
            </ol>
            
            <p>Or double-click: <code>start-websocket.bat</code> (Windows)</p>
            
            <hr>
            
            <form method="post">
                <?php wp_nonce_field('appointease_websocket_' . get_current_user_id()); ?>
                <p>
                    <input type="submit" name="start_server" class="button-primary" value="Try Auto-Start Server" />
                </p>
            </form>
            
            <hr>
            
            <h3>Connection Info</h3>
            <table class="widefat">
                <tr>
                    <td><strong>WebSocket URL:</strong></td>
                    <td><code>ws://localhost:8080</code></td>
                </tr>
                <tr>
                    <td><strong>Fallback:</strong></td>
                    <td>HTTP Polling (automatic)</td>
                </tr>
                <tr>
                    <td><strong>Update Interval:</strong></td>
                    <td>5 seconds (WebSocket) / 10 seconds (Polling)</td>
                </tr>
            </table>
        </div>
        
        <div class="card" style="max-width: 800px; margin-top: 20px;">
            <h2>📖 Documentation</h2>
            <p>For detailed setup instructions, see: <code>WEBSOCKET_SERVER.md</code></p>
            
            <h3>Quick Test</h3>
            <ol>
                <li>Ensure server is running (green status above)</li>
                <li>Open your booking form</li>
                <li>Login to dashboard</li>
                <li>Open browser console (F12)</li>
                <li>Look for: <code>[RealtimeService] WebSocket connected</code></li>
                <li>Debug panel should show: <strong>⚡ WebSocket</strong></li>
            </ol>
        </div>
    </div>
    <?php
}
