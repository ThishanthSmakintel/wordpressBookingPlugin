# WebSocket Real-time System Setup

## Installation

### 1. Install Ratchet via Composer

```bash
cd wp-content/plugins/wordpressBookingPlugin
composer install
```

### 2. Start WebSocket Server

```bash
php websocket-server.php
```

The server will run on `ws://localhost:8080`

### 3. Keep Server Running (Production)

Use a process manager like `supervisor` or `systemd`:

**Supervisor Config** (`/etc/supervisor/conf.d/appointease-websocket.conf`):
```ini
[program:appointease-websocket]
command=php /path/to/wordpress/wp-content/plugins/wordpressBookingPlugin/websocket-server.php
autostart=true
autorestart=true
user=www-data
stdout_logfile=/var/log/appointease-websocket.log
stderr_logfile=/var/log/appointease-websocket-error.log
```

Then run:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start appointease-websocket
```

## How It Works

### Architecture

```
User Action → PHP Backend → WebSocket Broadcast → Connected Clients
     ↓              ↓              ↓                    ↓
Book Apt → create_appointment → broadcast_update → Real-time UI Update
```

### Connection Flow

1. **Frontend connects** to `ws://localhost:8080`
2. **Subscribes** with email: `{type: 'subscribe', email: 'user@example.com'}`
3. **Receives updates** when appointments change
4. **Fallback to polling** if WebSocket unavailable

### Endpoints

- **WebSocket**: `ws://localhost:8080` (primary)
- **HTTP Polling**: `/wp-json/appointease/v1/realtime/poll` (fallback)

## Testing

### Test WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:8080');
ws.onopen = () => {
    //console.log('Connected');
    ws.send(JSON.stringify({type: 'subscribe', email: 'test@example.com'}));
};
ws.onmessage = (e) => //console.log('Message:', e.data);
```

### Test Polling Fallback

```bash
curl "http://yoursite.com/wp-json/appointease/v1/realtime/poll?email=test@example.com&last_update=0"
```

## Production Considerations

1. **SSL/TLS**: Use `wss://` for secure connections
2. **Port**: Change from 8080 to production port
3. **Firewall**: Open WebSocket port
4. **Load Balancing**: Use sticky sessions
5. **Monitoring**: Log WebSocket connections and errors

## Troubleshooting

### Server won't start
- Check if port 8080 is available: `netstat -an | grep 8080`
- Check PHP socket extension: `php -m | grep socket`

### Clients can't connect
- Verify firewall allows port 8080
- Check server is running: `ps aux | grep websocket`
- Test with telnet: `telnet localhost 8080`

### Updates not received
- Check transient storage: WordPress admin → Tools → Site Health
- Verify broadcast function is called
- Check error logs: `/var/log/appointease-websocket-error.log`
