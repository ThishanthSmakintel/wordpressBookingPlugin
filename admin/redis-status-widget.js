jQuery(document).ready(function($) {
    // Add Redis status to all AppointEase admin pages
    if (window.location.href.includes('appointease')) {
        // Check Redis status
        $.ajax({
            url: ajaxurl,
            method: 'POST',
            data: {
                action: 'check_redis_status',
                nonce: $('#redis-nonce').val() || 'fallback'
            },
            success: function(response) {
                if (response.success && response.data.redis_installed && response.data.php_redis_installed) {
                    $('#page-redis-status').text('Active (<1ms performance)').css('color', '#a8f5a8');
                } else {
                    $('#page-redis-status').text('Inactive (MySQL fallback)').css('color', '#ffcccc');
                }
            },
            error: function() {
                $('#page-redis-status').text('Connection Error').css('color', '#ffcccc');
            }
        });
    }
});