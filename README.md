# AppointEase - WordPress Booking Plugin

Modern appointment booking system with React frontend and real-time slot updates.

⚠️ **SECURITY WARNING:** This plugin contains critical security vulnerabilities. Do not use in production until security patches are applied. See [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md) for details.

## Key Features

- 7-step booking flow with validation
- Real-time slot updates (5s polling)
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
- Real-time updates: 5s polling
- Booking creation: ~50ms

## Security Status

🔴 **CRITICAL SECURITY ISSUES IDENTIFIED**

**Last Security Audit:** January 15, 2025  
**Status:** 10 vulnerabilities found (4 HIGH, 4 MEDIUM, 2 LOW)  
**Action Required:** Apply security patches before production use

**Critical Issues:**
- SQL Injection vulnerabilities in API endpoints
- XSS vulnerabilities in admin interface
- CSRF protection missing on public endpoints
- Input validation gaps in form processing

**Quick Fix:** See [SECURITY_PATCHES_REQUIRED.md](SECURITY_PATCHES_REQUIRED.md)

## Security Status

🔴 **SECURITY ALERT:** Critical vulnerabilities found in security audit (Jan 15, 2025)

**Immediate Action Required:**
- SQL injection vulnerabilities in API endpoints
- XSS vulnerabilities in admin interface  
- CSRF protection missing on public endpoints
- Input validation gaps in form processing

**See:** [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md) for complete details.

## License

GPL v2 or later

## Documentation

### Setup & Installation
- [SETUP.md](SETUP.md) - Quick setup guide
- [INSTALLATION.md](INSTALLATION.md) - Detailed installation
- [REDIS-SETUP.md](REDIS-SETUP.md) - Redis installation
- [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) - Deployment

### Technical Documentation
- [REDIS-HEARTBEAT-FLOW.md](REDIS-HEARTBEAT-FLOW.md) - Real-time flow
- [API-DOCUMENTATION.md](API-DOCUMENTATION.md) - API reference
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design

### Security Documentation
- [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md) - **🔴 CRITICAL - Security audit findings**
- [SQL_INJECTION_FIX_GUIDE.md](SQL_INJECTION_FIX_GUIDE.md) - SQL injection remediation
- [vibe_coding_help/2025-01-15_comprehensive_security_review.md](vibe_coding_help/2025-01-15_comprehensive_security_review.md) - Detailed security review
