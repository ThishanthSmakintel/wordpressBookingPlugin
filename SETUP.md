# Quick Setup Guide

## Installation

1. Upload plugin to `/wp-content/plugins/wordpressBookingPlugin`
2. Activate in WordPress Admin
3. Add booking form block to any page

✅ Works immediately with MySQL storage.

## Redis Setup (Optional - 15x faster)

### Install Redis

**Linux:**
```bash
sudo apt install redis-server php-redis
sudo systemctl start redis-server
redis-cli ping  # Test
```

**Windows:** Download Memurai from https://www.memurai.com/

**macOS:**
```bash
brew install redis
brew services start redis
```

### Configure

1. WordPress Admin → AppointEase → Settings → Redis
2. Host: `127.0.0.1`, Port: `6379`
3. Click **Test Connection**

## Performance

| Storage | Latency | Use Case |
|---------|---------|----------|
| MySQL | ~15ms | Default, works everywhere |
| Redis | <5ms | VPS/dedicated servers |

## Troubleshooting

```bash
# Check Redis
redis-cli ping

# Check PHP extension
php -m | grep redis

# Restart Redis
sudo systemctl restart redis-server
```

## Documentation

- [README.md](README.md) - Overview
- [API-DOCUMENTATION.md](API-DOCUMENTATION.md) - API reference
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
