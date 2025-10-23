# Real-time Connection System - Complete Setup

## Overview
AppointEase uses a **hybrid real-time communication system** with automatic fallback:
1. **WebSocket** (preferred) - Low latency, bi-directional communication
2. **HTTP Polling** (fallback) - Reliable, works everywhere
3. **WordPress Heartbeat API** (legacy) - WordPress native real-time updates

## Current Implementation Status

### ✅ Frontend (React/TypeScript)

#### 1. Real-time Service (`src/services/realtimeService.ts`)
```typescript
// Hybrid service with automatic fallback
- WebSocket connection with 5-second timeout
- Automatic fallback to HTTP polling
- Reconnection logic (5 attempts, 3s delay)
- Event-based message handling
- Connection mode tracking
```

#### 2. React Hook (`src/hooks/useRealtime.ts`)
```typescript
// Easy-to-use React hook
export const useRealtime = (options: UseRealtimeOptions) => {
  // Returns: connectionMode, isConnected, send, subscribe
}
```

#### 3. Integration in BookingApp (`src/app/core/BookingApp.tsx`)
```typescript
const { connectionMode, isConnected } = useRealtime({
    wsUrl: window.bookingAPI?.wsUrl,  // WebSocket URL (optional)
    pollingUrl: `${window.bookingAPI?.root}appointease/v1/user-appointments`,
    pollingInterval: 10000,  // 10 seconds
    enabled: bookingState.isLoggedIn && bookingState.showDashboard,
    onUpdate: (data) => {
        if (data.data?.appointments) {
            setAppointments(data.data.appointments);
        }
    },
    onConnectionChange: (mode) => {
        debugState.setConnectionMode?.(mode);
    }
});
```

#### 4. Debug Panel Display
**Location**: `src/app/features/debug/components/DebugPanel.component.tsx`
**Location**: `src/modules/DebugPanel.tsx`

Shows real-time connection status:
- ⚡ **WebSocket** (green) - Active WebSocket connection
- 🔄 **HTTP Polling** (orange) - Fallback polling mode
- ❌ **Disconnected** (red) - No connection

### ✅ Backend (PHP)

#### 1. WordPress Heartbeat Handler (`includes/class-heartbeat-handler.php`)
```php
class Appointease_Heartbeat_Handler {
    // Handles WordPress native heartbeat API
    // Interval: 15 seconds
    // Actions: get_user_data, validate_booking, check_availability, etc.
}
```

#### 2. REST API Endpoints (`includes/class-api-endpoints.php`)
```php
// Polling endpoint
GET /wp-json/appointease/v1/user-appointments
POST /wp-json/appointease/v1/user-appointments

// Other real-time endpoints
GET /wp-json/appointease/v1/server-date
POST /wp-json/appointease/v1/availability
GET /wp-json/appointease/v1/debug/appointments
```

## Connection Flow

### Scenario 1: WebSocket Available
```
1. App loads → useRealtime hook initializes
2. Attempts WebSocket connection to wsUrl
3. Connection succeeds within 5 seconds
4. Mode: 'websocket' ⚡
5. Debug panel shows: "⚡ WebSocket"
6. Real-time bi-directional updates
```

### Scenario 2: WebSocket Unavailable (Fallback)
```
1. App loads → useRealtime hook initializes
2. Attempts WebSocket connection to wsUrl
3. Connection fails or times out (5s)
4. Automatically falls back to HTTP polling
5. Mode: 'polling' 🔄
6. Debug panel shows: "🔄 HTTP Polling"
7. Polls every 10 seconds
```

### Scenario 3: WebSocket Disconnects
```
1. Active WebSocket connection
2. Connection drops (network issue, server restart)
3. Reconnection attempts (5 times, 3s delay)
4. If all attempts fail → fallback to polling
5. Mode changes: 'websocket' → 'disconnected' → 'polling'
6. Debug panel updates in real-time
```

## Configuration

### Frontend Configuration
```typescript
// In BookingApp.tsx
const realtimeConfig = {
    wsUrl: window.bookingAPI?.wsUrl,  // Optional WebSocket URL
    pollingUrl: `${window.bookingAPI?.root}appointease/v1/user-appointments`,
    pollingInterval: 10000,  // 10 seconds (configurable)
    enabled: true  // Enable/disable real-time updates
};
```

### Backend Configuration (WordPress)
```php
// In class-booking-plugin.php or functions.php
add_filter('appointease_realtime_config', function($config) {
    return [
        'ws_url' => 'ws://localhost:8080',  // WebSocket server URL
        'polling_interval' => 10000,  // Milliseconds
        'heartbeat_interval' => 15  // WordPress heartbeat (seconds)
    ];
});
```

## WebSocket Server Setup (Optional)

### Option 1: Node.js WebSocket Server
```javascript
// websocket-server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        // Handle message and broadcast updates
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'update',
                    data: { /* appointment data */ }
                }));
            }
        });
    });
});
```

### Option 2: PHP WebSocket (Ratchet)
```php
// composer require cboden/ratchet
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new AppointmentWebSocket()
        )
    ),
    8080
);

$server->run();
```

### Option 3: Use Existing Service
- **Pusher** (pusher.com)
- **Ably** (ably.com)
- **Socket.io** (socket.io)

## Current Behavior (Without WebSocket Server)

Since no WebSocket server is configured:
1. ✅ System attempts WebSocket connection
2. ⏱️ Times out after 5 seconds
3. ✅ Automatically falls back to HTTP polling
4. 🔄 Debug panel shows: "🔄 HTTP Polling"
5. ✅ Updates every 10 seconds via REST API
6. ✅ Fully functional, no errors

## Performance Comparison

| Feature | WebSocket | HTTP Polling | Heartbeat API |
|---------|-----------|--------------|---------------|
| Latency | ~50ms | ~10s | ~15s |
| Server Load | Low | Medium | Medium |
| Reliability | Medium | High | High |
| Setup Complexity | High | Low | Low |
| WordPress Native | No | Yes | Yes |

## Monitoring & Debugging

### Check Connection Mode
1. Open the booking form
2. Click "🔍 Debug" button (top-right)
3. Look for "🔌 Connection Mode:"
   - ⚡ WebSocket = Active WebSocket
   - 🔄 HTTP Polling = Fallback mode
   - ❌ Disconnected = No connection

### Browser Console Logs
```javascript
// Enable detailed logging
localStorage.setItem('appointease_debug_mode', 'true');

// Check logs
[RealtimeService] WebSocket connected
[RealtimeService] Using HTTP polling mode
[RealtimeService] Reconnecting... (1/5)
```

### Network Tab
- **WebSocket**: Look for "ws://" connections
- **Polling**: Look for repeated GET requests to `/user-appointments`

## Recommendations

### For Development
✅ **Current Setup (HTTP Polling)** - Works perfectly, no additional setup needed

### For Production (High Traffic)
Consider adding WebSocket server:
1. Reduces server load (no repeated HTTP requests)
2. Lower latency (instant updates)
3. Better user experience (real-time feel)

### Implementation Priority
1. ✅ **Phase 1**: HTTP Polling (DONE - Current)
2. 🔄 **Phase 2**: WebSocket Server (Optional)
3. 🔄 **Phase 3**: Redis/Pub-Sub (Scale)

## Testing

### Test Polling Mode
```javascript
// Force polling mode (disable WebSocket)
const { connectionMode } = useRealtime({
    wsUrl: undefined,  // No WebSocket URL
    pollingUrl: '/wp-json/appointease/v1/user-appointments',
    pollingInterval: 5000  // 5 seconds for testing
});
```

### Test WebSocket Mode
```javascript
// Enable WebSocket (requires server)
const { connectionMode } = useRealtime({
    wsUrl: 'ws://localhost:8080',
    pollingUrl: '/wp-json/appointease/v1/user-appointments',
    pollingInterval: 10000
});
```

## Troubleshooting

### Issue: Debug panel shows "Disconnected"
**Cause**: Real-time updates disabled or not logged in
**Solution**: Login and navigate to dashboard

### Issue: Polling too frequent
**Cause**: Low polling interval
**Solution**: Increase `pollingInterval` to 15000-30000ms

### Issue: WebSocket connection fails
**Cause**: No WebSocket server running
**Solution**: Normal behavior - system automatically falls back to polling

## Summary

✅ **System is fully functional** with HTTP polling fallback
✅ **Debug panel shows connection mode** in real-time
✅ **No errors or issues** - graceful degradation
✅ **Ready for WebSocket** when needed (optional enhancement)

The hybrid approach ensures:
- 🚀 Fast updates when WebSocket available
- 🛡️ Reliable fallback when WebSocket unavailable
- 📊 Clear visibility of connection status
- 🔧 Easy to configure and monitor
