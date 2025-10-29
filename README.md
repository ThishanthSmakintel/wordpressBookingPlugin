# AppointEase - WordPress Booking Plugin

Modern appointment booking system with **React frontend**, **PHP REST API**, and **Redis/MySQL hybrid real-time updates**.

## Real-Time Architecture

**WordPress Heartbeat + Redis (with MySQL Fallback) = Reliable Real-Time Updates**

```
Slot Selection → Redis (10s TTL) OR MySQL Transients → Heartbeat (1s polling) → All Clients
Booking Creation → MySQL (ACID Transaction) → Confirmed Appointment
Slot Locking → Redis (10min TTL) with atomic SETNX → Race Condition Prevention
```

## Key Features

- **7-step booking flow** with form validation
- **Real-time slot updates** via WordPress Heartbeat (1-second polling)
- **Dual-storage system**: Redis (primary) with MySQL transients (fallback)
- **Active selections** (10s TTL) for instant UI feedback
- **Slot locks** (10min TTL) for race condition prevention
- **OTP authentication** via email
- **Session management** with 24h persistence
- **Reschedule & cancel** appointments
- **Atomic booking** with MySQL transactions
- **Graceful degradation** when Redis unavailable

## Tech Stack

### Frontend
- React 18 + TypeScript
- WordPress `@wordpress/data` store
- Date-fns for date handling
- Webpack 5 build system

### Backend
- PHP 7.4+
- WordPress REST API
- WordPress Heartbeat API
- MySQL 5.7+
- Redis 6.0+ (optional)

## Installation

1. Upload plugin to `/wp-content/plugins/wordpressBookingPlugin`
2. Activate plugin in WordPress admin
3. Configure settings in **AppointEase → Settings**
4. Add booking form via Gutenberg block

## Redis Setup (Optional but Recommended)

Redis provides <1ms operations for slot locking and active selections. System automatically falls back to MySQL transients if Redis is unavailable.

```bash
# Install Redis
# Windows: Use Memurai or WSL2
# Linux: sudo apt install redis-server

# Production Configuration
redis-cli CONFIG SET appendonly yes
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET notify-keyspace-events Ex

# Configure in WordPress admin
AppointEase → Settings → Redis
- Host: 127.0.0.1
- Port: 6379
- Password: (optional)
```

### Redis Features Used
- ✅ **SETEX** - Set with TTL (10s for selections, 600s for locks)
- ✅ **SETNX (SET NX)** - Atomic locks with conflict detection
- ✅ **SCAN** - Non-blocking key iteration (production-safe)
- ✅ **Pub/Sub** - Scoped channels (`appointease:slots:{date}:{employee}`)
- ✅ **Health Check Key** - Fast availability detection (5s TTL)
- ✅ **Graceful Failback** - Auto-sync transients to Redis on recovery

### MySQL Fallback
- ✅ **WordPress Transients** - Automatic fallback storage
- ✅ **Same API** - Transparent switching between Redis/MySQL
- ✅ **TTL Support** - Automatic expiration via transient timeout
- ✅ **Zero Downtime** - Seamless degradation when Redis unavailable

See [REDIS_OPTIMIZATION.md](REDIS_OPTIMIZATION.md) for detailed configuration.

## Development

```bash
# Install dependencies
npm install

# Development build (watch mode)
npm run dev

# Production build
npm run build
```

## File Structure

```
wordpressBookingPlugin/
├── booking-plugin.php          # Main plugin file
├── includes/                   # PHP backend
│   ├── class-api-endpoints.php # REST API
│   ├── class-heartbeat-handler.php # Real-time polling
│   ├── class-redis-helper.php  # Redis operations
│   ├── class-redis-pubsub.php  # Pub/Sub messaging
│   └── class-atomic-booking.php # Race condition prevention
├── src/                        # React frontend
│   ├── hooks/
│   │   ├── useHeartbeat.ts     # Heartbeat integration
│   │   └── useHeartbeatSlotPolling.ts # Slot polling
│   ├── services/
│   │   └── redisDataService.ts # Redis API client
│   └── components/
│       └── forms/TimeSelector.tsx # Slot selection UI
└── build/                      # Compiled assets
```

## API Endpoints

### Appointments
- `POST /wp-json/appointease/v1/appointments` - Create booking (MySQL transaction)
- `GET /wp-json/appointease/v1/appointments/{id}` - Get appointment
- `PUT /wp-json/appointease/v1/appointments/{id}` - Reschedule
- `DELETE /wp-json/appointease/v1/appointments/{id}` - Cancel

### Availability
- `POST /wp-json/booking/v1/availability` - Check date availability
- `GET /wp-json/appointease/v1/business-hours` - Get business hours

### Authentication
- `POST /wp-json/appointease/v1/generate-otp` - Send OTP email
- `POST /wp-json/appointease/v1/verify-otp` - Verify OTP code
- `POST /wp-json/appointease/v1/session` - Create session

### Real-Time Slot Management
- `POST /wp-json/appointease/v1/slots/select` - Lock slot (Redis/Transient, 10min TTL)
- `POST /wp-json/appointease/v1/slots/deselect` - Unlock slot

### WordPress Heartbeat Integration
- **Heartbeat Tick** (1-second interval) - Polls for:
  - Active selections (10s TTL) - Other users hovering over slots
  - Booked slots (MySQL) - Confirmed appointments
  - Locked slots (Redis/Transient) - Slots in booking process
  - Redis health status - Automatic failover detection

## System Architecture

### Storage Strategy
1. **Active Selections** (10s TTL)
   - Redis: `appointease_active_{date}_{employee}_{time}` keys
   - Fallback: WordPress transients with same key pattern
   - Purpose: Show which slots other users are hovering over
   - Cleanup: Auto-expiration via TTL

2. **Slot Locks** (10min TTL)
   - Redis: `appointease_lock_{date}_{employee}_{time}` keys with atomic SETNX
   - Fallback: WordPress transients with conflict checking
   - Purpose: Prevent race conditions during booking process
   - Cleanup: Auto-expiration or manual unlock on booking completion

3. **Confirmed Bookings** (Permanent)
   - MySQL: `wp_appointments` table
   - ACID transactions with FOR UPDATE row locking
   - Purpose: Persistent appointment records

### Real-Time Update Flow
```
1. User hovers over slot → Set active selection (10s TTL)
2. Heartbeat polls (1s) → Returns active selections from all users
3. User clicks slot → Create lock (10min TTL) with atomic SETNX
4. User completes booking → MySQL transaction + delete lock
5. Heartbeat broadcasts → All clients update UI
```

### Failover Behavior
- **Redis Down**: Automatic switch to MySQL transients
- **Redis Recovery**: Sync existing transients to Redis
- **Health Check**: Dedicated Redis key checked every heartbeat
- **Zero Downtime**: Transparent failover with same API

## Performance

- **Active selection**: <1ms (Redis SETEX) or ~10ms (MySQL transient)
- **Slot locking**: <5ms (Redis atomic SETNX) or ~15ms (MySQL transient)
- **Real-time updates**: 1-second polling via WordPress Heartbeat
- **Redis health check**: <1ms (dedicated health key)
- **Booking creation**: ~50ms (MySQL transaction with FOR UPDATE lock)
- **Heartbeat payload**: ~2KB (active selections + booked slots + locks)
- **Graceful failback**: <100ms (transient sync to Redis on recovery)

## Security

- Session-based authentication
- OTP email verification
- Atomic database operations
- Input sanitization
- CSRF protection via nonces
- Rate limiting on OTP requests
- Client ownership verification for locks

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

GPL v2 or later

## Documentation

- [REDIS_ARCHITECTURE.md](REDIS_ARCHITECTURE.md) - Redis integration design
- [REDIS_OPTIMIZATION.md](REDIS_OPTIMIZATION.md) - Production configuration & monitoring
- [ARCHITECTURE.md](ARCHITECTURE.md) - Full system architecture
- [API-DOCUMENTATION.md](API-DOCUMENTATION.md) - Complete API reference

## Support

For issues and feature requests, see documentation above.
