# Fix: 401 Error - Availability Endpoint Permission

**Date:** 2025-01-15  
**Issue:** `rest_forbidden` 401 error on `booking/v1/availability` endpoint  
**Root Cause:** Endpoint required nonce verification for guest users

## Problem

The availability check endpoint was using `verify_nonce_or_session_permission` which blocks guest users who don't have a valid WordPress nonce or session.

**Error:**
```json
{
  "code": "rest_forbidden",
  "message": "Sorry, you are not allowed to do that.",
  "data": {"status": 401}
}
```

## Solution

Changed permission callback from `verify_nonce_or_session_permission` to `__return_true` to allow public access.

### File: `includes/class-api-endpoints.php`

**Before (Line 67):**
```php
register_rest_route('booking/v1', '/availability', array(
    'methods' => 'POST',
    'callback' => array($this, 'check_availability'),
    'permission_callback' => array($this, 'verify_nonce_or_session_permission')
));
```

**After:**
```php
register_rest_route('booking/v1', '/availability', array(
    'methods' => 'POST',
    'callback' => array($this, 'check_availability'),
    'permission_callback' => '__return_true'
));
```

## Why This Is Safe

1. **Read-only operation** - Only checks slot availability, doesn't modify data
2. **Input validation** - All parameters sanitized in `check_availability()` method
3. **No sensitive data** - Returns only time slot availability status
4. **Consistent with other endpoints** - `/services`, `/staff`, `/reschedule-availability` already public

## Impact

✅ **Fixed:** Guest users can now check availability  
✅ **Secure:** Input validation prevents SQL injection  
✅ **Consistent:** Matches other public read endpoints  
✅ **UX:** No login required for browsing available slots

## Testing

1. Open booking form as guest user
2. Select service and employee
3. Choose date
4. Verify time slots load successfully
5. Check browser console - no 401 errors

## Related Endpoints (Already Public)

- `booking/v1/services` - `public_permission`
- `booking/v1/staff` - `public_permission`
- `appointease/v1/reschedule-availability` - `public_permission`
- `appointease/v1/user-appointments` - `public_permission`
