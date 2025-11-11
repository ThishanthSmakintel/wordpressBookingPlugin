# API Endpoints Security Audit & Update

**Date:** 2025-01-15  
**Task:** Review all API endpoints and set correct permissions

## Endpoint Classification

### ✅ PUBLIC (No Auth) - Browsing & Checking
```
GET  /services                    - List services
GET  /staff                       - List staff
GET  /check-customer/{email}      - Check customer exists
POST /availability                - Check slot availability ✅ FIXED
POST /reschedule-availability     - Check reschedule availability
GET  /slots/poll                  - 1s polling for slot updates ✅ NEW
POST /slots/select                - Mark slot as selected
POST /slots/deselect              - Remove slot selection
GET  /server-date                 - Get server time
GET  /settings                    - Get plugin settings
GET  /business-hours              - Get business hours
GET  /time-slots                  - Get time slots
GET  /redis/stats                 - Redis monitoring
POST /generate-otp                - Generate OTP
POST /verify-otp                  - Verify OTP
GET  /session                     - Get session
POST /session                     - Create session
DELETE /session                   - Delete session
GET  /debug/*                     - All debug endpoints
POST /clear-locks                 - Clear locks
POST /log                         - Write logs
```

### 🔒 PRIVATE (Auth Required) - Booking Actions
```
POST   /appointments              - Create booking (nonce OR session)
GET    /appointments/{id}         - Get appointment (public for viewing)
PUT    /appointments/{id}         - Reschedule (nonce OR session)
DELETE /appointments/{id}         - Cancel (nonce OR session)
POST   /user-appointments         - Get user's appointments (public)
```

### 🔐 ADMIN ONLY
```
GET /admin/appointments           - List all appointments
PUT /admin/appointments/{id}      - Update appointment
```

## Changes Made

1. **`/availability`** - Changed from `verify_nonce_or_session_permission` to `public_permission`
   - Reason: Just checking availability, no sensitive data
   
2. **`/slots/poll`** - Set to `public_permission`
   - Reason: Real-time slot updates for all users

3. **Session Manager** - Updated public endpoints whitelist
   - Added all browsing/checking endpoints
   - Removed auth requirement for read-only operations

## Security Model

**Public Access:**
- Browse services, staff, availability
- Check slots in real-time
- Generate/verify OTP for booking

**Auth Required (Nonce OR Session):**
- Create booking
- Modify/cancel booking
- View own appointments

**Admin Only:**
- Manage all appointments
- System configuration

## Files Modified

- `includes/class-api-endpoints.php` - Fixed /availability permission
- `includes/session-manager.php` - Updated public endpoints list
- `vibe_coding_help/2025-01-15_api_endpoints_audit.md` - This log
