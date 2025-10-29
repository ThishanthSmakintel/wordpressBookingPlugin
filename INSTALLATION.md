# AppointEase Installation Guide

## Basic Installation (Works Immediately)

1. **Upload Plugin**
   - Upload `wordpressBookingPlugin` folder to `/wp-content/plugins/`
   - Or install via WordPress admin: Plugins → Add New → Upload

2. **Activate Plugin**
   - Go to WordPress Admin → Plugins
   - Click "Activate" on AppointEase

3. **Add Booking Form**
   - Edit any page/post
   - Add "AppointEase Booking Form" block
   - Publish

✅ **Done!** The plugin works immediately with WordPress Heartbeat (1-second polling) for real-time updates.

---

## Optional: Redis Setup (Better Performance)

Redis provides <1ms operations for slot locking with automatic MySQL fallback. **Skip this if you're happy with MySQL-only storage.**

### Requirements
- Redis 6.0+ installed
- PHP Redis extension

### Installation Steps

**Linux/Ubuntu:**
```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Install PHP Redis extension
sudo apt install php-redis

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

**Windows:**
```bash
# Option 1: Use Memurai (Redis for Windows)
# Download from: https://www.memurai.com/

# Option 2: Use WSL2
wsl --install
wsl
sudo apt update
sudo apt install redis-server
redis-server
```

**macOS:**
```bash
# Install via Homebrew
brew install redis

# Start Redis
brew services start redis

# Verify
redis-cli ping
```

### Configure in WordPress

1. Go to **WordPress Admin → AppointEase → Settings**
2. Navigate to **Redis** tab
3. Enter connection details:
   - Host: `127.0.0.1`
   - Port: `6379`
   - Password: (leave empty if no password)
4. Click **Test Connection**
5. Should show: ✅ **Redis Connected**

### Verify Redis is Working

1. Open booking form
2. Open browser DevTools (F12)
3. Look for debug panel (development mode)
4. Should show: `Storage: Redis` and `Redis Ops: {get: X, set: Y}`

---

## What Users See

### Without Redis (Default)
- ✅ Full functionality works
- 🔄 Real-time updates via WordPress Heartbeat (1s)
- 💾 Storage: MySQL
- 📊 Debug panel shows: "Storage: MySQL"

### With Redis (Optional)
- ✅ Full functionality works
- ⚡ Real-time updates via WordPress Heartbeat (1s)
- 💾 Storage: Redis (<1ms operations)
- 📊 Debug panel shows: "Storage: Redis"

---

## Configuration

### Admin Settings
Go to: **WordPress Admin → AppointEase → Settings**

- Business hours
- Working days
- Services & staff
- Email templates
- Appearance

### Shortcode (Alternative to Block)
```
[appointease_booking]
```

---

## Troubleshooting

### Plugin works but no Redis
✅ **This is normal!** MySQL storage works automatically. Redis is optional for better performance.

### Redis won't connect
1. Check Redis is running:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```
2. Check PHP Redis extension:
   ```bash
   php -m | grep redis
   # Should show: redis
   ```
3. Check connection in WordPress:
   - Go to AppointEase → Settings → Redis
   - Click "Test Connection"
4. Check error logs:
   ```bash
   tail -f /var/log/redis/redis-server.log
   ```

### Restart Redis Server
```bash
# Linux
sudo systemctl restart redis-server

# macOS
brew services restart redis

# Windows (Memurai)
# Restart from Services app
```

---

## For Shared Hosting Users

**Redis requires VPS/dedicated server.** Shared hosting typically doesn't allow:
- Redis installation
- PHP Redis extension
- Server configuration

**Solution:** Use MySQL storage (default). It works perfectly without any setup!

---

## Support

- Documentation: See `README.md`
- Architecture: See `ARCHITECTURE.md`
- API Documentation: See `API-DOCUMENTATION.md`
- Issues: Contact plugin author
