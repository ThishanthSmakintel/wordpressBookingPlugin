# Fix: 502 Error - admin-ajax.php Fallback Removed

**Date:** 2025-01-15  
**Issue:** 502 Bad Gateway errors when REST API fallback triggered  
**Root Cause:** Invalid admin-ajax.php fallback with unregistered AJAX actions

## Problem

The `useBookingActions.ts` file contained a fallback to `admin-ajax.php` that would trigger 502 errors because:

1. **No AJAX handlers registered** - Plugin uses REST API exclusively
2. **Invalid endpoint path** - `/wp-admin/admin-ajax.php` (relative path)
3. **Missing actions** - `appointease_check_availability` and `appointease_reschedule_availability` don't exist

## Changes Made

### File: `src/hooks/useBookingActions.ts`

**Removed:**
- admin-ajax.php fallback logic (lines 18-35)
- `useAjax` variable and conditional headers
- URLSearchParams conversion for AJAX requests

**Simplified:**
- Direct REST API endpoint selection
- Single fetch configuration
- Cleaner conditional logic

## Technical Details

**Before:**
```typescript
let endpoint = `${window.bookingAPI.root}booking/v1/availability`;
let useAjax = false;

if (!window.bookingAPI.root.includes('/wp-json/')) {
    endpoint = '/wp-admin/admin-ajax.php';
    requestBody.action = 'appointease_check_availability';
    useAjax = true;
}
```

**After:**
```typescript
const endpoint = bookingState.isRescheduling && bookingState.currentAppointment?.id
    ? `${window.bookingAPI.root}appointease/v1/reschedule-availability`
    : `${window.bookingAPI.root}booking/v1/availability`;
```

## Impact

✅ **Fixed:** 502 errors eliminated  
✅ **Simplified:** Removed 17 lines of unnecessary code  
✅ **Consistent:** All requests use REST API  
✅ **Reliable:** No fallback to non-existent endpoints

## Testing

Test availability checks:
1. Select service and employee
2. Choose date
3. Verify time slots load without 502 errors
4. Check browser console for successful API calls

## Notes

- Plugin architecture uses REST API exclusively
- No need for admin-ajax.php compatibility
- All endpoints registered in `class-api-endpoints.php`
