# Fix 401 Unauthorized on /slots/poll Endpoint

**Date:** 2025-01-15  
**Issue:** GET /slots/poll returns 401 Unauthorized  
**Cause:** Permission callback `__return_true` not working for guest users

## Error
```
GET https://news.thishanth.com/wp-json/appointease/v1/slots/poll?date=2025-11-11&employee_id=2&client_id=client_1762569483008_gmf3flg1d&selected_time=09%3A00 401 (Unauthorized)
```

## Fix

**File:** `includes/class-api-endpoints.php`

**Before:**
```php
register_rest_route('appointease/v1', '/slots/poll', array(
    'methods' => 'GET',
    'callback' => array($this, 'poll_slots'),
    'permission_callback' => '__return_true'  // ❌ Not working
));
```

**After:**
```php
register_rest_route('appointease/v1', '/slots/poll', array(
    'methods' => 'GET',
    'callback' => array($this, 'poll_slots'),
    'permission_callback' => array($this, 'public_permission')  // ✅ Works
));
```

## Result

- Endpoint now accessible to guest users
- 1-second polling works without authentication
- Latency reduced from 5s to 1s

## Files Modified

- `includes/class-api-endpoints.php` - Changed permission callback
- `vibe_coding_help/2025-01-15_fix_401_poll_endpoint.md` - This log
