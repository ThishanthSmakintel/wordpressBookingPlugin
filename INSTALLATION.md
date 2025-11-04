# Installation Guide

## Quick Start

1. Upload to `/wp-content/plugins/wordpressBookingPlugin`
2. Activate in WordPress Admin
3. Add booking form block

✅ Works immediately with MySQL.

## Redis Setup (Optional)

Redis provides 15x faster performance (<5ms vs ~15ms).

### Install

**Linux:**
```bash
sudo apt install redis-server php-redis
sudo systemctl start redis-server
redis-cli ping
```

**Windows:** Use Memurai (https://www.memurai.com/)

**macOS:**
```bash
brew install redis
brew services start redis
```

### Configure

1. WordPress Admin → AppointEase → Settings → Redis
2. Host: `127.0.0.1`, Port: `6379`
3. Test Connection

## Configuration

**Settings:** AppointEase → Settings
- Business hours
- Services & staff
- Email templates

**Shortcode:** `[appointease_booking]`

## Troubleshooting

```bash
# Check Redis
redis-cli ping
php -m | grep redis

# Restart
sudo systemctl restart redis-server
```

**Shared Hosting:** Use MySQL (default). Redis requires VPS.

## Documentation

- [SETUP.md](SETUP.md) - Quick setup
- [README.md](README.md) - Overview
- [API-DOCUMENTATION.md](API-DOCUMENTATION.md) - API reference
