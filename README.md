# AppointEase - WordPress Booking Plugin

Modern appointment booking system with **React frontend**, **PHP REST API**, and **Redis-powered real-time updates**.

## Real-Time Architecture

**WordPress Heartbeat (1s) + Redis Pub/Sub = Sub-second updates without WebSocket**

```
Frontend (React) → Heartbeat API (1s) → Redis Pub/Sub (<5ms) → All Clients
```

## Key Features

- **7-step booking flow** with form validation
- **Real-time slot locking** prevents double bookings
- **OTP authentication** via email
- **Session management** with 24h persistence
- **Reschedule & cancel** appointments
- **Redis-primary storage** with MySQL fallback
- **Optimistic UI updates** for instant feedback

## Tech Stack

### Frontend
- React 18 + TypeScript
- WordPress `@wordpress/data` store
- Date-fns for date handling
- Webpack 5 build system

### Backend
- PHP 7.4+
- WordPress REST API
- MySQL 5.7+
- Redis 6.0+ (optional)

## Installation

1. Upload plugin to `/wp-content/plugins/wordpressBookingPlugin`
2. Activate plugin in WordPress admin
3. Configure settings in **AppointEase → Settings**
4. Add booking form via Gutenberg block

## Redis Setup (Optional)

Redis provides <1ms operations for slot locking and real-time updates.

```bash
# Install Redis
# Windows: Use Memurai or WSL2
# Linux: sudo apt install redis-server

# Configure in WordPress admin
AppointEase → Settings → Redis
- Host: 127.0.0.1
- Port: 6379
- Password: (optional)
```

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
- `POST /wp-json/appointease/v1/appointments` - Create
- `GET /wp-json/appointease/v1/appointments/{id}` - Get
- `PUT /wp-json/appointease/v1/appointments/{id}` - Reschedule
- `DELETE /wp-json/appointease/v1/appointments/{id}` - Cancel

### Availability
- `POST /wp-json/booking/v1/availability` - Check date
- `GET /wp-json/appointease/v1/business-hours` - Get hours

### Authentication
- `POST /wp-json/appointease/v1/generate-otp` - Send OTP
- `POST /wp-json/appointease/v1/verify-otp` - Verify OTP
- `POST /wp-json/appointease/v1/session` - Create session

### Real-Time
- `POST /wp-json/appointease/v1/slots/select` - Lock slot
- `POST /wp-json/appointease/v1/slots/deselect` - Unlock slot

## Performance

- **Slot selection**: <100ms (optimistic UI)
- **Real-time updates**: 1-second polling
- **Redis operations**: <1ms
- **Conflict detection**: <5ms via Pub/Sub
- **Database queries**: Optimized with indexes

## Security

- Session-based authentication
- OTP email verification
- Atomic database operations
- Input sanitization
- CSRF protection via nonces
- Rate limiting on OTP requests

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

GPL v2 or later

## Support

For issues and feature requests, see `ARCHITECTURE.md` for technical details.
