# Slot Locking & Active Selections Fix

## Problem
The frontend was showing "No active selections" and "No locked slots" because:
1. Frontend was calling `/realtime/select` and `/realtime/deselect` endpoints that didn't exist
2. WordPress Heartbeat handler wasn't returning active selections data

## Solution Implemented

### 1. Added Missing API Endpoints (class-api-endpoints.php)

#### New Methods:
- `realtime_select()` - Tracks when users select time slots
- `realtime_deselect()` - Removes selection when users deselect

#### Route Registration:
```php
register_rest_route('appointease/v1', '/realtime/select', array(
    'methods' => 'POST',
    'callback' => array($this, 'realtime_select'),
    'permission_callback' => '__return_true'
));

register_rest_route('appointease/v1', '/realtime/deselect', array(
    'methods' => 'POST',
    'callback' => array($this, 'realtime_deselect'),
    'permission_callback' => '__return_true'
));
```

### 2. Updated Heartbeat Handler (class-heartbeat-handler.php)

Added handler for `appointease_poll` data to return active selections:

```php
if (isset($data['appointease_poll'])) {
    $poll_data = $data['appointease_poll'];
    $date = sanitize_text_field($poll_data['date']);
    $employee_id = intval($poll_data['employee_id']);
    
    // Get active selections from transient
    $key = "appointease_active_{$date}_{$employee_id}";
    $selections = get_transient($key) ?: array();
    
    // Clean expired selections (older than 30 seconds)
    $now = time();
    $active_times = array();
    foreach ($selections as $time => $timestamp) {
        if ($now - $timestamp < 30) {
            $active_times[] = $time;
        }
    }
    
    $response['appointease_active_selections'] = $active_times;
}
```

## How It Works

### Frontend Flow (TimeSelector.tsx):
1. User selects a time slot
2. Frontend calls `/realtime/select` with date, time, employee_id
3. Frontend also calls `/lock-slot` for informational locking
4. WordPress Heartbeat polls every 15 seconds
5. Heartbeat sends `appointease_poll` data
6. Backend returns `appointease_active_selections` array
7. Frontend displays 👁️ icon on slots being watched by others

### Backend Flow:
1. `/realtime/select` stores selection in transient with 30-second expiry
2. Transient key: `appointease_active_{date}_{employee_id}`
3. Value: `{ "09:00": 1736527845, "10:30": 1736527850 }`
4. Heartbeat handler reads transient and filters expired selections
5. Returns active time slots to frontend

### Data Structure:
```php
// Transient storage
set_transient('appointease_active_2025-01-15_1', [
    '09:00' => 1736527845,  // timestamp when selected
    '10:30' => 1736527850
], 30); // expires in 30 seconds

// Heartbeat response
$response['appointease_active_selections'] = ['09:00', '10:30'];
```

## Testing

### 1. Check Endpoints Exist:
```bash
# Test realtime/select
curl -X POST http://your-site.com/wp-json/appointease/v1/realtime/select \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-01-15","time":"09:00","employee_id":1}'

# Expected: {"success":true}
```

### 2. Check Heartbeat Response:
1. Open browser DevTools → Network tab
2. Filter for "heartbeat"
3. Select a time slot in booking form
4. Wait for next heartbeat request (15 seconds)
5. Check response for `appointease_active_selections` array

### 3. Visual Test:
1. Open booking form in two browser windows
2. In Window 1: Select date, employee, then hover over a time slot
3. In Window 2: Select same date/employee
4. After 15 seconds, Window 2 should show 👁️ icon on the slot Window 1 is watching

## Files Modified

1. `includes/class-api-endpoints.php`
   - Added `realtime_select()` method
   - Added `realtime_deselect()` method
   - Registered `/realtime/select` route
   - Registered `/realtime/deselect` route

2. `includes/class-heartbeat-handler.php`
   - Added `appointease_poll` handler
   - Returns `appointease_active_selections` array
   - Filters expired selections (>30 seconds old)

## Performance Notes

- Transients auto-expire after 30 seconds (no manual cleanup needed)
- Heartbeat runs every 15 seconds (WordPress default)
- Minimal database impact (transients stored in wp_options with expiry)
- No WebSocket required (uses WordPress Heartbeat API)

## Security

- All inputs sanitized (`sanitize_text_field`, `intval`)
- Public endpoints (no authentication required for viewing active selections)
- Transient keys include date and employee_id to prevent cross-contamination
- Auto-expiry prevents stale data

## Next Steps

If you want to see locked slots (from the `/lock-slot` endpoint), you need to:
1. Query the `wp_appointease_slot_locks` table
2. Display locks in a separate UI section
3. The current implementation only shows "active selections" (users hovering/viewing)
