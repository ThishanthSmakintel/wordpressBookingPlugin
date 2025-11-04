# UI Update Fix

## Issue
UI not updating when slot selected.

## Root Cause
Heartbeat interval was set to 1 second, but WordPress minimum is 5 seconds.

## Fix Applied

### 1. Backend (class-heartbeat-handler.php)
```php
// Changed from interval = 1 to interval = 5
$settings['interval'] = 5;  // WordPress minimum
```

### 2. Frontend (useHeartbeat.ts)
```typescript
// Changed from interval(1) to interval(5)
window.wp.heartbeat.interval(5);  // WordPress minimum
```

## Testing

### 1. Open booking page in browser
### 2. Open browser console (F12)
### 3. Paste this test script:

```javascript
// Monitor heartbeat for 15 seconds
(function() {
    let count = 0;
    jQuery(document).on('heartbeat-tick.test', function(e, data) {
        count++;
        console.log(`Tick #${count}:`, {
            active: data.appointease_active_selections,
            booked: data.appointease_booked_slots,
            redis: data.redis_status
        });
    });
    setTimeout(() => {
        console.log(`Total ticks: ${count} (expected: 3)`);
        jQuery(document).off('heartbeat-tick.test');
    }, 15000);
})();
```

### Expected Result:
- 3 heartbeat ticks in 15 seconds
- Each tick shows active_selections, booked_slots
- Redis status: "available"

## Verify UI Updates

1. Open booking page in 2 browser windows
2. Select a time slot in window 1
3. Window 2 should show slot as "selected" within 5 seconds
4. Check console for: `appointease_active_selections: ["09:00"]`

## If Still Not Working

### Check 1: Heartbeat Enabled
```javascript
console.log(wp.heartbeat);  // Should show object, not undefined
```

### Check 2: PHP Logs
```bash
tail -f wp-content/debug.log | grep Heartbeat
```

### Check 3: Redis Connection
```bash
redis-cli GET "appointease:health:ping"
```

## Performance
- Heartbeat interval: 5 seconds
- Redis operations: <5ms
- UI update latency: 5-10 seconds (acceptable for booking system)

## Alternative: Faster Updates (Advanced)

To get 1-second updates, you need custom polling:

```typescript
// Custom 1-second polling (bypasses WordPress Heartbeat)
setInterval(async () => {
    const response = await fetch('/wp-json/appointease/v1/poll', {
        method: 'POST',
        body: JSON.stringify({ date, employee_id })
    });
    const data = await response.json();
    updateUI(data);
}, 1000);
```

But WordPress Heartbeat (5s) is recommended for stability.
