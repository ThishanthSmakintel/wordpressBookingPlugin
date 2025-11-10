#!/bin/bash
# 502 Error Fix Script - Run as root

echo "=== Fixing 502 Bad Gateway Error ==="

# 1. Use PHP 8.0
PHP_VERSION="8.0"
echo "Using PHP version: $PHP_VERSION"

# 2. Backup php.ini
cp /etc/php/8.0/fpm/php.ini /etc/php/8.0/fpm/php.ini.backup.$(date +%Y%m%d)
echo "✓ Backed up php.ini"

# 3. Update PHP settings
sed -i 's/^max_execution_time = 30/max_execution_time = 60/' /etc/php/8.0/fpm/php.ini
sed -i 's/^memory_limit = 128M/memory_limit = 256M/' /etc/php/8.0/fpm/php.ini
sed -i 's/^;error_log = php_errors.log/error_log = \/var\/log\/php_errors.log/' /etc/php/8.0/fpm/php.ini
echo "✓ Updated PHP settings"

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

# 7. Show current settings
echo ""
echo "=== Current PHP Settings ==="
php -i | grep "max_execution_time"
php -i | grep "memory_limit"
php -i | grep "error_log"

echo ""
echo "=== Monitor logs with these commands ==="
echo "tail -f /var/log/nginx/error.log"
echo "tail -f /var/log/php_errors.log"
echo "tail -f /var/www/news.thishanth.com/wp-content/debug.log"

echo ""
echo "✓ Fix complete! Test your site now."
