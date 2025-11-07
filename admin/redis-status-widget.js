jQuery(document).ready(function($) {
    if (window.location.href.includes('appointease') && typeof appointeaseAdmin !== 'undefined') {
        $.ajax({
            url: appointeaseAdmin.ajaxurl,
            method: 'POST',
            data: {
                action: 'check_redis_status',
                nonce: appointeaseAdmin.redisNonce
            },
            success: function(response) {
                if (response.success && response.data.redis_installed && response.data.php_redis_installed) {
                    $('#page-redis-status').text('Active (<1ms)').css('color', '#a8f5a8');
                } else {
                    $('#page-redis-status').text('Inactive').css('color', '#ffcccc');
                }
            }
        });
    }
});