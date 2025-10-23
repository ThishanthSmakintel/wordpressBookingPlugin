<?php
/**
 * WebSocket Setup Admin Page
 */

add_action('admin_menu', 'appointease_websocket_setup_menu');

function appointease_websocket_setup_menu() {
    add_submenu_page(
        'booking-admin',
        'WebSocket Setup',
        'WebSocket Setup',
        'manage_options',
        'appointease-websocket-setup',
        'appointease_websocket_setup_page'
    );
}

function appointease_websocket_setup_page() {
    $plugin_dir = plugin_dir_path(dirname(__FILE__));
    $ws_status = appointease_check_websocket_status();
    
    ?>
    <div class="wrap">
        <h1>⚡ WebSocket Real-time Setup</h1>
        
        <div class="notice notice-info">
            <p><strong>ℹ️ Note:</strong> Your booking system works perfectly without WebSocket using HTTP polling. WebSocket is optional for faster real-time updates.</p>
        </div>
        
        <div class="card" style="max-width: 800px;">
            <h2>Current Status</h2>
            
            <table class="widefat">
                <tr>
                    <td><strong>Composer Dependencies:</strong></td>
                    <td>
                        <?php if ($ws_status['composer']): ?>
                            <span style="color: green;">✅ Installed</span>
                        <?php else: ?>
                            <span style="color: orange;">⚠️ Not Installed</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <td><strong>WebSocket Server:</strong></td>
                    <td>
                        <?php if ($ws_status['running']): ?>
                            <span style="color: green;">✅ Running on port 8080</span>
                        <?php else: ?>
                            <span style="color: red;">❌ Not Running</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <td><strong>Connection Mode:</strong></td>
                    <td>
                        <?php if ($ws_status['running']): ?>
                            <strong style="color: green;">⚡ WebSocket (Fast)</strong>
                        <?php else: ?>
                            <strong style="color: blue;">🔄 HTTP Polling (Working)</strong>
                        <?php endif; ?>
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="card" style="max-width: 800px; margin-top: 20px;">
            <h2>🚀 One-Click Setup</h2>
            
            <?php if (!$ws_status['composer'] || !$ws_status['running']): ?>
                <p>Click the button below to automatically set up WebSocket:</p>
                
                <form method="post" id="websocket-setup-form">
                    <?php wp_nonce_field('appointease_websocket_setup', 'setup_nonce'); ?>
                    <p>
                        <button type="submit" name="run_setup" class="button button-primary button-hero" style="margin-right: 10px;">
                            🔧 Run Automatic Setup
                        </button>
                        <button type="button" class="button" onclick="document.getElementById('manual-instructions').style.display='block'">
                            📖 Show Manual Instructions
                        </button>
                    </p>
                </form>
                
                <div id="setup-output" style="display: none; background: #f5f5f5; padding: 15px; margin-top: 15px; border-left: 4px solid #0073aa; font-family: monospace; white-space: pre-wrap; max-height: 400px; overflow-y: auto;"></div>
                
            <?php else: ?>
                <div style="padding: 20px; background: #d4edda; border-left: 4px solid #28a745;">
                    <h3 style="margin-top: 0; color: #155724;">✅ WebSocket is Running!</h3>
                    <p>Your booking system is using WebSocket for instant real-time updates.</p>
                    <p>
                        <a href="<?php echo esc_url(plugin_dir_url(dirname(__FILE__)) . 'test-websocket.html'); ?>" class="button" target="_blank">🧪 Test Connection</a>
                        <button type="button" class="button" onclick="appointeaseStopWebSocket()">⏹️ Stop Server</button>
                    </p>
                </div>
            <?php endif; ?>
        </div>
        
        <div id="manual-instructions" class="card" style="max-width: 800px; margin-top: 20px; display: none;">
            <h2>📖 Manual Setup Instructions</h2>
            
            <h3>Option 1: SSH Command</h3>
            <p>Run this command via SSH:</p>
            <pre style="background: #f5f5f5; padding: 10px; overflow-x: auto;">cd <?php echo esc_html($plugin_dir); ?>
chmod +x setup-websocket.sh
./setup-websocket.sh</pre>
            
            <h3>Option 2: Manual Steps</h3>
            <ol>
                <li>
                    <strong>Install Composer dependencies:</strong>
                    <pre style="background: #f5f5f5; padding: 10px;">cd <?php echo esc_html($plugin_dir); ?>
composer install</pre>
                </li>
                <li>
                    <strong>Start WebSocket server:</strong>
                    <pre style="background: #f5f5f5; padding: 10px;">php <?php echo esc_html($plugin_dir); ?>websocket-server.php</pre>
                </li>
            </ol>
            
            <p><a href="<?php echo esc_url(plugin_dir_url(dirname(__FILE__)) . 'INSTALLATION.md'); ?>" target="_blank">View Full Documentation →</a></p>
        </div>
    </div>
    
    <script>
    jQuery(document).ready(function($) {
        $('#websocket-setup-form').on('submit', function(e) {
            e.preventDefault();
            
            var $output = $('#setup-output');
            var $button = $(this).find('button[type="submit"]');
            
            $output.show().html('⏳ Starting setup...\n');
            $button.prop('disabled', true).text('⏳ Setting up...');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'appointease_run_websocket_setup',
                    nonce: '<?php echo wp_create_nonce('appointease_websocket_setup'); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        $output.append('\n' + response.data.output);
                        if (response.data.success) {
                            $output.append('\n\n✅ Setup completed successfully!\n');
                            setTimeout(function() {
                                location.reload();
                            }, 2000);
                        }
                    } else {
                        $output.append('\n❌ Error: ' + response.data);
                    }
                },
                error: function() {
                    $output.append('\n❌ Failed to run setup. Please use manual instructions.');
                },
                complete: function() {
                    $button.prop('disabled', false).text('🔧 Run Automatic Setup');
                }
            });
        });
    });
    
    function appointeaseStopWebSocket() {
        if (!confirm('Stop WebSocket server? The system will fall back to HTTP polling.')) {
            return;
        }
        
        jQuery.post(ajaxurl, {
            action: 'appointease_stop_websocket',
            nonce: '<?php echo wp_create_nonce('appointease_stop_websocket'); ?>'
        }, function(response) {
            if (response.success) {
                alert('✅ WebSocket server stopped');
                location.reload();
            } else {
                alert('❌ ' + response.data);
            }
        });
    }
    </script>
    
    <style>
    .card { padding: 20px; background: #fff; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04); }
    .card h2 { margin-top: 0; }
    .widefat td { padding: 12px; }
    </style>
    <?php
}

function appointease_check_websocket_status() {
    $plugin_dir = plugin_dir_path(dirname(__FILE__));
    
    return [
        'composer' => file_exists($plugin_dir . 'vendor/autoload.php'),
        'running' => @fsockopen('localhost', 8080, $errno, $errstr, 1) !== false
    ];
}

add_action('wp_ajax_appointease_run_websocket_setup', 'appointease_run_websocket_setup_ajax');

function appointease_run_websocket_setup_ajax() {
    check_ajax_referer('appointease_websocket_setup', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Unauthorized');
    }
    
    $plugin_dir = plugin_dir_path(dirname(__FILE__));
    $script = $plugin_dir . 'setup-websocket.sh';
    
    if (!file_exists($script)) {
        wp_send_json_error('Setup script not found');
    }
    
    // Make script executable
    @chmod($script, 0755);
    
    // Run setup script
    $output = [];
    $return_var = 0;
    
    // Run in non-interactive mode
    exec("cd " . escapeshellarg($plugin_dir) . " && bash setup-websocket.sh 2>&1", $output, $return_var);
    
    wp_send_json_success([
        'output' => implode("\n", $output),
        'success' => $return_var === 0
    ]);
}

add_action('wp_ajax_appointease_stop_websocket', 'appointease_stop_websocket_ajax');

function appointease_stop_websocket_ajax() {
    check_ajax_referer('appointease_stop_websocket', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Unauthorized');
    }
    
    // Try to stop via supervisor
    exec('sudo supervisorctl stop appointease-websocket 2>&1', $output, $return_var);
    
    if ($return_var === 0) {
        wp_send_json_success('Stopped via supervisor');
    }
    
    // Try to kill process
    exec("pkill -f 'php.*websocket-server.php' 2>&1", $output2, $return_var2);
    
    if ($return_var2 === 0) {
        wp_send_json_success('Process stopped');
    }
    
    wp_send_json_error('Could not stop server. Please stop manually via SSH.');
}
