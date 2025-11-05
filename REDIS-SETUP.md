# Redis Setup Guide

AppointEase uses Redis for high-performance slot locking and real-time updates.

## Windows Installation

### 1. Download Redis
```bash
# Download from GitHub
https://github.com/tporadowski/redis/releases

# Or use Chocolatey
choco install redis-64
```

### 2. Install & Start
```bash
# Extract to C:\Redis
# Run redis-server.exe
cd C:\Redis
redis-server.exe
```

### 3. Verify Installation
```bash
redis-cli ping
# Should return: PONG
```

## Linux Installation

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### CentOS/RHEL
```bash
sudo yum install redis
sudo systemctl start redis
sudo systemctl enable redis
```

## macOS Installation

```bash
brew install redis
brew services start redis
```

## PHP Redis Extension

### Windows
1. Download php_redis.dll from https://pecl.php.net/package/redis
2. Copy to `C:\xampp\php\ext\`
3. Add to php.ini: `extension=redis`
4. Restart Apache

### Linux
```bash
sudo apt install php-redis
sudo systemctl restart apache2
```

### macOS
```bash
pecl install redis
# Add to php.ini: extension=redis.so
brew services restart php
```

## WordPress Configuration

1. Go to **AppointEase → Settings**
2. Enable Redis
3. Configure:
   - Host: `127.0.0.1`
   - Port: `6379`
   - Password: (leave empty for local)

## Verify Redis is Working

```bash
# Check connection
redis-cli
> PING
PONG

# Check AppointEase keys
> KEYS appointease:*

# Monitor real-time operations
> MONITOR
```

## Performance Benefits

| Operation | MySQL | Redis |
|-----------|-------|-------|
| Slot Lock | ~15ms | <1ms |
| Availability Check | ~20ms | <2ms |
| Real-time Updates | Polling | Pub/Sub |

## Troubleshooting

### Redis not connecting
```bash
# Check if Redis is running
redis-cli ping

# Check PHP extension
php -m | grep redis
```

### Permission denied
```bash
# Linux: Fix permissions
sudo chown redis:redis /var/lib/redis
sudo chmod 755 /var/lib/redis
```

### Port already in use
```bash
# Change port in redis.conf
port 6380

# Update WordPress settings accordingly
```

## Optional: Redis Configuration

Edit `redis.conf`:
```conf
# Memory limit
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security (production)
requirepass your_strong_password
bind 127.0.0.1
```

## Fallback Mode

If Redis is unavailable, AppointEase automatically falls back to MySQL with no data loss.
