# Cancel Appointment Fix for Logged-in Users

## Issue
Cancel appointment was not working for logged-in users - getting 404 error.

## Root Cause
1. Missing API call in AppointmentManager component
2. Permission callback only checked nonce, not session tokens
3. Possible WordPress permalink/rewrite rules not flushed

## Fixes Applied

### 1. AppointmentManager.tsx
- Added `handleCancelAppointment` function that makes DELETE API call
- Proper URL construction without double slashes
- Added `credentials: 'same-origin'` to send session cookies
- Better error handling with response status logging

### 2. class-api-endpoints.php
- Created `verify_nonce_or_session_permission` method
- Checks both nonce (for admin) and session (for logged-in users)
- Updated DELETE endpoint permission callback
- Updated PUT (reschedule) endpoint permission callback

## Testing Steps

1. **Flush WordPress Permalinks** (IMPORTANT):
   - Go to WordPress Admin → Settings → Permalinks
   - Click "Save Changes" (no need to change anything)
   - This flushes rewrite rules and registers REST API routes

2. **Test Cancel Flow**:
   - Login as user
   - View dashboard with appointments
   - Click "Cancel" on an appointment
   - Confirm cancellation
   - Should see success message and appointment status changed to 'cancelled'

3. **Verify API Endpoint**:
   - Open browser console
   - Check network tab for DELETE request to:
     `http://blog.promoplus.com/wp-json/appointease/v1/appointments/APT-2025-XXXXXX`
   - Should return 200 OK with `{"success":true}`

## Quick Fix Command
If 404 persists, run this in WordPress admin or via WP-CLI:
```php
// In WordPress admin or functions.php temporarily
flush_rewrite_rules();
```

Or via WP-CLI:
```bash
wp rewrite flush
```

## Files Modified
- `src/modules/AppointmentManager.tsx`
- `includes/class-api-endpoints.php`
