# Public Endpoints Whitelist Update

**Date:** 2025-01-15  
**Issue:** Multiple 401 errors on public endpoints  
**Solution:** Comprehensive public endpoints whitelist

## Public Endpoints (No Auth Required)

### Session & Auth
- `/session` - Create/get/delete session
- `/verify-otp` - Verify OTP code
- `/generate-otp` - Generate OTP for email

### Browse Data
- `/services` - List all services
- `/staff` - List all staff members
- `/check-customer` - Check if customer exists

### Availability Checking
- `/availability` - Check slot availability
- `/reschedule-availability` - Check availability for rescheduling
- `/check-slot` - Check specific slot

### Real-Time Slot Sync (NEW)
- `/slots/poll` - 1-second polling for slot updates
- `/slots/select` - Mark slot as selected
- `/slots/deselect` - Remove slot selection

### Settings & Config
- `/server-date` - Get server time
- `/settings` - Get plugin settings
- `/business-hours` - Get business hours
- `/time-slots` - Get available time slots

### Monitoring
- `/redis/stats` - Redis health check

### Debug
- `/debug/*` - All debug endpoints
- `/test-heartbeat` - Test heartbeat
- `/clear-locks` - Clear all locks
- `/log` - Write logs

## Private Endpoints (Auth Required)

### Booking Management
- `POST /appointments` - Create booking (uses verify_nonce_or_session_permission)
- `PUT /appointments/{id}` - Reschedule (uses verify_nonce_or_session_permission)
- `DELETE /appointments/{id}` - Cancel (uses verify_nonce_or_session_permission)

## Security Model

1. **Public endpoints** - Allow guest access for browsing/checking
2. **Booking creation** - Requires nonce OR session (handled in endpoint)
3. **Booking modification** - Requires nonce OR session (handled in endpoint)

## Files Modified

- `includes/session-manager.php` - Updated public endpoints list
- `vibe_coding_help/2025-01-15_public_endpoints_whitelist.md` - This log
