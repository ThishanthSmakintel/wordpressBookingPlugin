# Fix: API Permissions for Guest Booking with OTP Authentication

**Date:** 2025-01-15  
**Issue:** 401 Unauthorized errors blocking guest users from booking flow  
**Solution:** Separate public endpoints from authenticated endpoints with OTP verification

## Problem

Guest users were unable to:
1. Check availability (401 error on `/booking/v1/availability`)
2. Create appointments without WordPress login
3. Cancel/reschedule appointments (should require email verification)

## Solution

### Public Endpoints (No Authentication Required)

**Browse & Book Flow:**
```php
// Services & Staff
GET  /booking/v1/services              → public_permission
GET  /booking/v1/staff                 → public_permission

// Availability Check
POST /booking/v1/availability          → __return_true (FIXED)
POST /appointease/v1/reschedule-availability → public_permission

// Slot Selection (Real-time)
POST /appointease/v1/slots/select      → __return_true
POST /appointease/v1/slots/deselect    → __return_true

// Create Appointment (Guest Booking)
POST /appointease/v1/appointments      → __return_true (FIXED)

// View Appointment
GET  /appointease/v1/appointments/{id} → public_permission

// Customer Lookup
GET  /booking/v1/check-customer/{email} → public_permission
POST /appointease/v1/user-appointments  → public_permission
```

**Configuration Endpoints:**
```php
GET /appointease/v1/settings           → __return_true
GET /appointease/v1/server-date        → public_permission
GET /appointease/v1/business-hours     → public_permission
GET /appointease/v1/time-slots         → __return_true
GET /appointease/v1/redis/stats        → public_permission
```

### Authenticated Endpoints (Require OTP Session)

**Modify Appointments:**
```php
DELETE /appointease/v1/appointments/{id} → verify_nonce_or_session_permission
PUT    /appointease/v1/appointments/{id} → verify_nonce_or_session_permission
```

**Authentication Flow:**
```php
// Step 1: Request OTP
POST /appointease/v1/generate-otp      → __return_true
  Body: { "email": "user@example.com" }
  Response: { "success": true, "expires_in": 600 }

// Step 2: Verify OTP & Get Session Token
POST /appointease/v1/verify-otp        → __return_true
  Body: { "email": "user@example.com", "otp": "123456" }
  Response: { "success": true, "token": "abc123...", "expires_in": 3600 }

// Step 3: Use Token for Authenticated Requests
DELETE /appointease/v1/appointments/APT-2025-123
  Headers: { "Authorization": "Bearer abc123..." }
```

### Session Management Endpoints
```php
POST   /appointease/v1/session         → __return_true (create)
GET    /appointease/v1/session         → __return_true (validate)
DELETE /appointease/v1/session         → __return_true (logout)
```

## Changes Made

### File: `includes/class-api-endpoints.php`

**1. Fixed Availability Endpoint (Line 67)**
```php
// BEFORE
'permission_callback' => array($this, 'verify_nonce_or_session_permission')

// AFTER
'permission_callback' => '__return_true'
```

**2. Keep Create Appointment Public (Line 16)**
```php
register_rest_route('appointease/v1', '/appointments', array(
    'methods' => 'POST',
    'callback' => array($this, 'create_appointment'),
    'permission_callback' => '__return_true' // Guest can book
));
```

**3. Protect Cancel/Reschedule (Lines 36-48)**
```php
// Cancel - Requires OTP Session
array(
    'methods' => 'DELETE',
    'callback' => array($this, 'cancel_appointment'),
    'permission_callback' => array($this, 'verify_nonce_or_session_permission')
)

// Reschedule - Requires OTP Session
array(
    'methods' => 'PUT',
    'callback' => array($this, 'reschedule_appointment'),
    'permission_callback' => array($this, 'verify_nonce_or_session_permission')
)
```

## Security Rationale

### Why These Are Public
1. **Availability Check** - Read-only, no sensitive data, input sanitized
2. **Create Appointment** - Allows guest booking (standard e-commerce flow)
3. **Slot Selection** - Temporary locks for UX, auto-expire in 10s
4. **View Appointment** - Public ID required, no sensitive data exposed

### Why These Require Auth
1. **Cancel Appointment** - Only owner should cancel (email verification via OTP)
2. **Reschedule Appointment** - Only owner should modify (email verification via OTP)

### Input Validation (All Endpoints)
```php
// Date validation
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    return new WP_Error('invalid_date', 'Invalid date format', array('status' => 400));
}

// Email validation
$email = sanitize_email($params['email']);
if (!is_email($email)) {
    return new WP_Error('invalid_email', 'Valid email required', array('status' => 400));
}

// ID sanitization
$id = sanitize_text_field($request['id']);
$employee_id = intval($params['employee_id']);
```

## User Flow Examples

### Guest Booking (No Auth)
1. Browse services → `GET /services`
2. Select staff → `GET /staff`
3. Check availability → `POST /availability`
4. Select slot → `POST /slots/select`
5. Create booking → `POST /appointments`
6. Receive confirmation email with booking ID

### Cancel Appointment (With OTP)
1. User clicks "Cancel" link in email
2. Enter email → `POST /generate-otp`
3. Receive OTP via email
4. Enter OTP → `POST /verify-otp` → Get session token
5. Cancel appointment → `DELETE /appointments/{id}` with token

### Reschedule Appointment (With OTP)
1. User clicks "Reschedule" link in email
2. Enter email → `POST /generate-otp`
3. Receive OTP via email
4. Enter OTP → `POST /verify-otp` → Get session token
5. Check new availability → `POST /reschedule-availability`
6. Reschedule → `PUT /appointments/{id}` with token

## Testing

### Test Public Endpoints (No Auth)
```bash
# Check availability (should work)
curl -X POST https://site.com/wp-json/booking/v1/availability \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-11-15","employee_id":1}'

# Create appointment (should work)
curl -X POST https://site.com/wp-json/appointease/v1/appointments \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","date":"2025-11-15 10:00:00","employee_id":1}'
```

### Test Protected Endpoints (Should Fail Without Auth)
```bash
# Cancel without auth (should return 401)
curl -X DELETE https://site.com/wp-json/appointease/v1/appointments/APT-2025-123

# Reschedule without auth (should return 401)
curl -X PUT https://site.com/wp-json/appointease/v1/appointments/APT-2025-123 \
  -H "Content-Type: application/json" \
  -d '{"new_date":"2025-11-16 14:00:00"}'
```

### Test OTP Authentication Flow
```bash
# 1. Generate OTP
curl -X POST https://site.com/wp-json/appointease/v1/generate-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com"}'

# 2. Verify OTP (check email for code)
curl -X POST https://site.com/wp-json/appointease/v1/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","otp":"123456"}'
# Response: {"success":true,"token":"abc123...","expires_in":3600}

# 3. Cancel with token (should work)
curl -X DELETE https://site.com/wp-json/appointease/v1/appointments/APT-2025-123 \
  -H "Authorization: Bearer abc123..."
```

## Impact

✅ **Fixed:** Guest users can now complete booking flow  
✅ **Secure:** Cancel/reschedule require email verification  
✅ **UX:** No forced WordPress login for browsing/booking  
✅ **Consistent:** Matches standard e-commerce patterns  

## Related Files
- `includes/class-api-endpoints.php` - API route registration
- `includes/session-manager.php` - OTP session handling
- `vibe_coding_help/2025-01-15_fix_401_availability_endpoint.md` - Previous fix
