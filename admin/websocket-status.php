<?php
/**
 * WebSocket Status Admin Notice
 */

add_action('admin_notices', 'appointease_websocket_notices');

function appointease_websocket_notices() {
    $notices = get_transient('appointease_activation_notices');
    
    if (!$notices || !current_user_can('manage_options')) {
        return;
    }
    
    $screen = get_current_screen();
    if ($screen && strpos($screen->id, 'plugins') === false) {
        return;
    }
    
    ?>
    <div class="notice notice-info is-dismissible appointease-websocket-notice">
        <h3>🎉 AppointEase Activated Successfully!</h3>
        <p><strong>✅ Your booking system is ready to use!</strong></p>
        <p>The plugin works perfectly with <strong>HTTP polling</strong> for real-time updates.</p>
        
        <?php if (in_array('websocket_composer', $notices) || in_array('websocket_not_running', $notices)): ?>
        <hr>
        <h4>⚡ Optional: Enable WebSocket for Faster Updates</h4>
        <p>WebSocket provides instant real-time updates (optional enhancement):</p>
        
        <?php if (in_array('websocket_composer', $notices)): ?>
        <div style="background: #fff3cd; padding: 10px; margin: 10px 0; border-left: 4px solid #ffc107;">
            <strong>Step 1:</strong> Install dependencies via SSH:
            <pre style="background: #f5f5f5; padding: 10px; margin: 5px 0;">cd <?php echo esc_html(plugin_dir_path(dirname(__FILE__))); ?>
composer install</pre>
        </div>
        <?php endif; ?>
        
        <?php if (in_array('websocket_not_running', $notices)): ?>
        <div style="background: #fff3cd; padding: 10px; margin: 10px 0; border-left: 4px solid #ffc107;">
            <strong>Step 2:</strong> Start WebSocket server:
            <pre style="background: #f5f5f5; padding: 10px; margin: 5px 0;">php <?php echo esc_html(plugin_dir_path(dirname(__FILE__))); ?>websocket-server.php</pre>
        </div>
        <?php endif; ?>
        
        <p>
            <a href="<?php echo esc_url(plugin_dir_url(dirname(__FILE__)) . 'INSTALLATION.md'); ?>" class="button button-secondary" target="_blank">📖 View Full Guide</a>
            <button type="button" class="button button-primary" onclick="appointeaseDismissNotice()">I'll Set This Up Later</button>
            <button type="button" class="button" onclick="appointeaseDismissNotice()">I Don't Need WebSocket</button>
        </p>
        <?php else: ?>
        <hr>
        <p style="color: #28a745;"><strong>✅ WebSocket is running!</strong> You have the fastest real-time updates enabled.</p>
        <?php endif; ?>
    </div>
    
    <script>
    function appointeaseDismissNotice() {
        jQuery('.appointease-websocket-notice').fadeOut();
        jQuery.post(ajaxurl, {
            action: 'appointease_dismiss_websocket_notice',
            nonce: '<?php echo wp_create_nonce('appointease_dismiss'); ?>'
        });
    }
    </script>
    <?php
}

add_action('wp_ajax_appointease_dismiss_websocket_notice', 'appointease_dismiss_websocket_notice');

function appointease_dismiss_websocket_notice() {
    check_ajax_referer('appointease_dismiss', 'nonce');
    delete_transient('appointease_activation_notices');
    wp_send_json_success();
}
