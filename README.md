# AppointEase - WordPress Booking Plugin

Modern appointment booking system with React frontend and real-time slot updates.

## Key Features

- 7-step booking flow with validation
- Real-time slot updates (1s polling)
- Redis/MySQL hybrid storage
- OTP authentication
- Reschedule & cancel appointments
- Race condition prevention

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Backend**: PHP 7.4+ + WordPress REST API
- **Storage**: Redis 6.0+ (optional) + MySQL 5.7+

## Installation

1. Upload to `/wp-content/plugins/wordpressBookingPlugin`
2. Activate in WordPress admin
3. Configure in **AppointEase → Settings**
4. Add booking form via Gutenberg block

## Redis Setup (Optional)

Redis provides <1ms slot locking vs ~15ms with MySQL.

```bash
# Windows
choco install redis-64

# Linux
sudo apt install redis-server php-redis

# macOS
brew install redis
```

See [REDIS-SETUP.md](REDIS-SETUP.md) for complete guide.

## Development

```bash
npm install
npm run dev    # Watch mode
npm run build  # Production
```

## API Endpoints

See [API-DOCUMENTATION.md](API-DOCUMENTATION.md) for complete reference.

### Key Endpoints
- `POST /appointease/v1/appointments` - Create booking
- `POST /appointease/v1/slots/select` - Lock slot
- `POST /booking/v1/availability` - Check availability

## Performance

- Redis operations: <5ms
- MySQL fallback: ~15ms
- Real-time updates: 1s polling
- Booking creation: ~50ms

## License

GPL v2 or later

## Documentation

- [INSTALLATION.md](INSTALLATION.md) - Setup guide
- [REDIS-SETUP.md](REDIS-SETUP.md) - Redis installation
- [API-DOCUMENTATION.md](API-DOCUMENTATION.md) - API reference
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
