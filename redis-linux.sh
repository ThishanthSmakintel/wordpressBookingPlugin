#!/bin/bash

echo "=== Redis Linux Fix Script ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo: sudo bash fix-redis-ubuntu.sh"
    exit 1
fi

# Detect Linux distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    echo "Cannot detect Linux distribution"
    exit 1
fi

echo "Detected: $OS $VER"

# 1. Install Redis Server
echo "1. Installing Redis Server..."
case $OS in
    ubuntu|debian)
        apt update
        apt install -y redis-server
        REDIS_CONF="/etc/redis/redis.conf"
        ;;
    centos|rhel|fedora|rocky|almalinux)
        if command -v dnf &> /dev/null; then
            dnf install -y redis
        else
            yum install -y redis
        fi
        REDIS_CONF="/etc/redis.conf"
        ;;
    arch|manjaro)
        pacman -Sy --noconfirm redis
        REDIS_CONF="/etc/redis/redis.conf"
        ;;
    *)
        echo "Unsupported distribution: $OS"
        exit 1
        ;;
esac

# 2. Detect WordPress PHP Version
echo "2. Detecting WordPress PHP version..."
WP_PHP_VERSION=""
WP_CONFIG=$(find /var/www /home -name "wp-config.php" 2>/dev/null | head -1)

if [ -n "$WP_CONFIG" ]; then
    WP_DIR=$(dirname "$WP_CONFIG")
    WP_PHP_VERSION=$(cd "$WP_DIR" && sudo -u www-data php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;" 2>/dev/null)
    echo "WordPress using PHP: $WP_PHP_VERSION"
else
    WP_PHP_VERSION=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;" 2>/dev/null)
    echo "WordPress not found, using CLI PHP: $WP_PHP_VERSION"
fi

# 3. Install PHP Redis Extension
echo "3. Installing PHP Redis Extension for PHP $WP_PHP_VERSION..."

case $OS in
    ubuntu|debian)
        apt install -y php${WP_PHP_VERSION}-redis
        if [ ! -f "/etc/php/${WP_PHP_VERSION}/mods-available/redis.ini" ]; then
            echo "extension=redis.so" > /etc/php/${WP_PHP_VERSION}/mods-available/redis.ini
        fi
        phpenmod -v ${WP_PHP_VERSION} -s apache2 redis 2>/dev/null
        phpenmod -v ${WP_PHP_VERSION} redis 2>/dev/null
        ;;
    centos|rhel|fedora|rocky|almalinux)
        if command -v dnf &> /dev/null; then
            dnf install -y php-pecl-redis
        else
            yum install -y php-pecl-redis
        fi
        echo "extension=redis.so" > /etc/php.d/50-redis.ini
        ;;
    arch|manjaro)
        pacman -Sy --noconfirm php-redis
        echo "extension=redis.so" > /etc/php/conf.d/redis.ini
        ;;
esac

echo "✓ Redis extension installed for PHP $WP_PHP_VERSION"

# 4. Start Redis Service
echo "4. Starting Redis Service..."
case $OS in
    ubuntu|debian)
        systemctl start redis-server
        systemctl enable redis-server
        REDIS_SERVICE="redis-server"
        ;;
    *)
        systemctl start redis
        systemctl enable redis
        REDIS_SERVICE="redis"
        ;;
esac

# 5. Configure Redis
echo "5. Configuring Redis..."
if [ -f "$REDIS_CONF" ]; then
    sed -i 's/^bind .*/bind 127.0.0.1/' "$REDIS_CONF"
    sed -i 's/^# maxmemory .*/maxmemory 256mb/' "$REDIS_CONF"
    sed -i 's/^# maxmemory-policy .*/maxmemory-policy allkeys-lru/' "$REDIS_CONF"
else
    echo "Warning: Redis config not found at $REDIS_CONF"
fi

# 6. Restart Services
echo "6. Restarting Services..."
systemctl restart $REDIS_SERVICE
echo "✓ Redis restarted"

# Detect and restart web server
WEB_SERVER=""
if systemctl is-active --quiet apache2; then
    WEB_SERVER="apache2"
    systemctl restart apache2
    echo "✓ Apache2 restarted"
elif systemctl is-active --quiet httpd; then
    WEB_SERVER="httpd"
    systemctl restart httpd
    echo "✓ Apache (httpd) restarted"
elif systemctl is-active --quiet nginx; then
    WEB_SERVER="nginx"
    # Nginx with PHP-FPM - restart FPM
    if systemctl is-active --quiet php${WP_PHP_VERSION}-fpm; then
        systemctl restart php${WP_PHP_VERSION}-fpm
        echo "✓ PHP-FPM ${WP_PHP_VERSION} restarted"
    elif systemctl is-active --quiet php-fpm; then
        systemctl restart php-fpm
        echo "✓ PHP-FPM restarted"
    fi
    systemctl restart nginx
    echo "✓ Nginx restarted"
else
    echo "⚠ No web server detected"
fi

# 7. Verify Installation
echo ""
echo "=== Verification ==="
echo -n "Redis Service: "
systemctl is-active $REDIS_SERVICE

echo -n "Redis Connection: "
redis-cli ping 2>/dev/null || echo "FAILED"

echo -n "PHP CLI Redis: "
php -r "echo class_exists('Redis') ? '✓ Loaded' : '✗ Missing';"
echo ""

echo -n "Web Server: "
if command -v apache2 &> /dev/null; then
    apache2 -v 2>/dev/null | grep "Server version" | cut -d' ' -f3
elif command -v httpd &> /dev/null; then
    httpd -v 2>/dev/null | grep "Server version" | cut -d' ' -f3
elif command -v nginx &> /dev/null; then
    nginx -v 2>&1 | cut -d' ' -f3
else
    echo "Not detected"
fi

# 7. Test WordPress PHP
echo ""
echo "=== WordPress Test ==="
WP_PHP=$(find /var/www /home -name "wp-config.php" 2>/dev/null | head -1)
if [ -n "$WP_PHP" ]; then
    WP_DIR=$(dirname "$WP_PHP")
    cd "$WP_DIR"
    sudo -u www-data php -r "echo class_exists('Redis') ? '✓ WordPress can use Redis' : '✗ WordPress cannot use Redis';" 2>/dev/null
    echo ""
fi

echo ""
echo "=== Complete ==="
echo "✓ Redis server running"
echo "✓ PHP extension installed"
echo ""
echo "Next: Go to WordPress → AppointEase → Settings"
echo "Redis Status should show: ✓ Connected"
