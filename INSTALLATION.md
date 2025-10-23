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

✅ **Done!** The plugin works immediately with HTTP polling for real-time updates.

---

## Optional: WebSocket Setup (Better Performance)

WebSocket provides faster real-time updates but requires server setup. **Skip this if you're happy with HTTP polling.**

### Requirements
- SSH access to server
- Composer installed
- Port 8080 open (or any port you choose)

### Quick Setup (One Command)

**Linux/Mac:**
```bash
cd /path/to/wordpress/wp-content/plugins/wordpressBookingPlugin
chmod +x setup-websocket.sh
./setup-websocket.sh
```

**Windows:**
```cmd
cd C:\path\to\wordpress\wp-content\plugins\wordpressBookingPlugin
setup-websocket.bat
```

The script will:
- ✅ Install dependencies
- ✅ Start WebSocket server
- ✅ Configure firewall
- ✅ Set up auto-restart

### Manual Steps

1. **Install Dependencies**
```bash
cd /path/to/wordpress/wp-content/plugins/wordpressBookingPlugin
composer install
```

2. **Start WebSocket Server**
```bash
php websocket-server.php
```

You should see: `WebSocket server running on 0.0.0.0:8080`

3. **Keep Server Running (Production)**

**Option A: Using screen (Simple)**
```bash
screen -S appointease-ws
php websocket-server.php
# Press Ctrl+A then D to detach
```

**Option B: Using supervisor (Recommended)**

Create `/etc/supervisor/conf.d/appointease-websocket.conf`:
```ini
[program:appointease-websocket]
command=php /path/to/wordpress/wp-content/plugins/wordpressBookingPlugin/websocket-server.php
autostart=true
autorestart=true
user=www-data
stdout_logfile=/var/log/appointease-websocket.log
stderr_logfile=/var/log/appointease-websocket-error.log
```

Then:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start appointease-websocket
```

4. **Open Firewall Port**
```bash
# Ubuntu/Debian
sudo ufw allow 8080

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

5. **Verify WebSocket**
   - Visit: `http://yoursite.com/wp-content/plugins/wordpressBookingPlugin/test-websocket.html`
   - Click "Connect"
   - Should show "✅ Connected"

---

## What Users See

### Without WebSocket (Default)
- ✅ Full functionality works
- 🔄 Updates every 10 seconds via HTTP polling
- 📊 Debug panel shows: "🔄 HTTP Polling"

### With WebSocket (Optional)
- ✅ Full functionality works
- ⚡ Instant real-time updates
- 📊 Debug panel shows: "⚡ WebSocket"

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

### Plugin works but no WebSocket
✅ **This is normal!** HTTP polling works automatically. WebSocket is optional.

### WebSocket won't connect
1. Check server is running: `ps aux | grep websocket`
2. Check port is open: `telnet yoursite.com 8080`
3. Check firewall allows port 8080
4. View logs: `/var/log/appointease-websocket-error.log`

### Restart WebSocket Server
```bash
# If using screen
screen -r appointease-ws
# Press Ctrl+C to stop, then restart

# If using supervisor
sudo supervisorctl restart appointease-websocket
```

---

## For Shared Hosting Users

**WebSocket requires VPS/dedicated server.** Shared hosting typically doesn't allow:
- Long-running PHP processes
- Custom ports
- Composer

**Solution:** Use HTTP polling (default). It works perfectly without any setup!

---

## Support

- Documentation: See `README.md`
- WebSocket Guide: See `README-WEBSOCKET.md`
- Issues: Contact plugin author
