#!/bin/bash
# 502 Error Fix Script - Run as root

echo "=== Fixing 502 Bad Gateway Error ==="

# 1. Backup configs
cp /etc/php/8.0/fpm/pool.d/www.conf /etc/php/8.0/fpm/pool.d/www.conf.backup.$(date +%Y%m%d)
echo "✓ Backed up FPM pool config"

# 2. Remove old PHP admin values if they exist
sed -i '/php_admin_value\[memory_limit\]/d' /etc/php/8.0/fpm/pool.d/www.conf
sed -i '/php_admin_value\[max_execution_time\]/d' /etc/php/8.0/fpm/pool.d/www.conf
sed -i '/php_admin_value\[error_log\]/d' /etc/php/8.0/fpm/pool.d/www.conf

# 3. Add PHP-FPM pool settings (these override php.ini)
cat >> /etc/php/8.0/fpm/pool.d/www.conf << 'EOF'

; Custom settings for WordPress booking plugin
php_admin_value[memory_limit] = 256M
php_admin_value[max_execution_time] = 60
php_admin_value[error_log] = /var/log/php_errors.log
EOF
echo "✓ Updated PHP-FPM pool settings"

# 4. Enable WordPress debug
WP_CONFIG="/var/www/news.thishanth.com/wp-config.php"
if ! grep -q "WP_DEBUG" "$WP_CONFIG"; then
    sed -i "/\/\* That's all, stop editing/i \\
define('WP_DEBUG', true);\\
define('WP_DEBUG_LOG', true);\\
define('WP_DEBUG_DISPLAY', false);\\
@ini_set('display_errors', 0);\\
" "$WP_CONFIG"
    echo "✓ Enabled WordPress debug"
else
    echo "✓ WordPress debug already enabled"
fi

# 5. Create log files with proper permissions
touch /var/log/php_errors.log
chmod 666 /var/log/php_errors.log
touch /var/www/news.thishanth.com/wp-content/debug.log
chmod 666 /var/www/news.thishanth.com/wp-content/debug.log
chown www-data:www-data /var/www/news.thishanth.com/wp-content/debug.log
echo "✓ Created log files"

# 6. Restart services
systemctl restart php8.0-fpm
systemctl restart nginx
echo "✓ Restarted PHP-FPM and Nginx"

# 7. Verify settings were applied
echo ""
echo "=== Verifying FPM Pool Config ==="
grep -A 3 "Custom settings" /etc/php/8.0/fpm/pool.d/www.conf

echo ""
echo "=== Monitor logs with these commands ==="
echo "tail -f /var/log/nginx/error.log"
echo "tail -f /var/log/php8.0-fpm.log"
echo "tail -f /var/log/php_errors.log"
echo "tail -f /var/www/news.thishanth.com/wp-content/debug.log"

echo ""
echo "✓ Fix complete! Test your site and watch logs for errors."
