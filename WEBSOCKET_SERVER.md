# WebSocket Server Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd wp-content/plugins/wordpressBookingPlugin
npm install
```

### 2. Configure Database
Edit `websocket-server.js` line 6-11:
```javascript
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',           // Your MySQL username
    password: '',           // Your MySQL password
    database: 'wordpress'   // Your WordPress database name
};
```

### 3. Start Server

**Auto-Start (Recommended):**
The WebSocket server automatically starts when the plugin loads!

Check status: **WordPress Admin → AppointEase → WebSocket Server**

**Manual Start:**

**Windows:**
```bash
start-websocket.bat
```

**Or manually:**
```bash
node websocket-server.js
```

**Development mode (auto-restart):**
```bash
npm run dev
```

## ✅ Verify Connection

1. Start the WebSocket server
2. Open your WordPress site
3. Login to booking dashboard
4. Open browser console
5. Look for: `[RealtimeService] WebSocket connected`
6. Debug panel should show: **⚡ WebSocket**

## 🔧 How It Works

```
Frontend (React) → WebSocket Client → ws://localhost:8080
                                    ↓
                            Node.js WebSocket Server
                                    ↓
                            MySQL Database (wp_appointments)
                                    ↓
                            Real-time Updates → Frontend
```

## 📡 WebSocket URL

The frontend automatically connects to:
```
ws://localhost:8080/appointease/v1/realtime/ws?email=user@example.com
```

## 🔄 Fallback System

If WebSocket fails to connect:
1. **Try WebSocket** (3 second timeout)
2. **Fall back to HTTP Polling** (10 second intervals)
3. **Backup: WordPress Heartbeat** (15-60 seconds)

## 🛠 Troubleshooting

### WebSocket not connecting?
- Check if server is running: `netstat -an | findstr 8080`
- Verify database credentials in `websocket-server.js`
- Check browser console for errors

### Port already in use?
Change port in `websocket-server.js`:
```javascript
const PORT = 8081; // Change to different port
```

Then update frontend in `BookingApp.tsx`:
```typescript
wsUrl: `ws://${window.location.host.replace(':80', ':8081')}/...`
```

### Database connection failed?
- Verify MySQL is running
- Check database name matches WordPress
- Confirm user has SELECT permissions

## 📊 Server Logs

The server logs all connections:
```
[WebSocket] Server running on port 8080
[WebSocket] Client connected: user@example.com
[WebSocket] Message from user@example.com: {type: 'subscribe'}
[WebSocket] Client disconnected: user@example.com
```

## 🔒 Security Notes

**For Production:**
1. Use `wss://` (secure WebSocket)
2. Add authentication tokens
3. Validate all incoming messages
4. Rate limit connections
5. Use environment variables for DB credentials

## 🎯 Features

✅ Real-time appointment updates
✅ Automatic reconnection handling
✅ Email-based client identification
✅ 5-second polling for active clients
✅ Graceful connection/disconnection
✅ Error handling and logging

## 📝 Production Deployment

For production, use PM2 or similar:
```bash
npm install -g pm2
pm2 start websocket-server.js --name appointease-ws
pm2 save
pm2 startup
```

## 🔗 Integration

The WebSocket server is automatically used when:
- Server is running on port 8080
- User is logged in
- Dashboard is open
- No configuration needed in WordPress
