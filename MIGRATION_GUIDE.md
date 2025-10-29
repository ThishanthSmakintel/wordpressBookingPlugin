# WebSocket to WordPress Heartbeat Migration Guide

## What Changed?

The AppointEase booking plugin has been migrated from WebSocket-based real-time updates to WordPress Heartbeat API. This provides a more stable, WordPress-native solution for real-time features.

## For Developers

### Before (WebSocket)
```typescript
// Complex WebSocket configuration
const realtimeConfig = {
    wsUrl: 'ws://example.com:8080',
    pollingUrl: '/wp-json/appointease/v1/realtime/poll',
    pollingInterval: 5000,
    enabled: true,
    onUpdate: (data) => { /* handle updates */ }
};

const { connectionMode, send } = useRealtime(realtimeConfig);

// Send WebSocket message
send('lock_slot', { date, time, employeeId });
```

### After (WordPress Heartbeat)
```typescript
// Simple Heartbeat configuration
const heartbeatPollData = {
    email: userEmail,
    step: currentStep,
    date: selectedDate,
    time: selectedTime,
    employee_id: selectedEmployee?.id
};

const { isConnected, send } = useHeartbeat({
    enabled: true,
    pollData: heartbeatPollData,
    onPoll: (data) => { /* handle updates */ }
});

// Send via Heartbeat
send('appointease_booking', {
    action: 'select_slot',
    date, time, employee_id: employeeId
}, (response) => {
    // Handle response
});
```

## Key Differences

### 1. Connection Management
- **Before**: Manual WebSocket connection with fallback to polling
- **After**: WordPress Heartbeat handles everything automatically

### 2. Update Frequency
- **Before**: Real-time (<50ms) via WebSocket, 5s polling fallback
- **After**: 5-second polling via WordPress Heartbeat (configurable)

### 3. Server Requirements
- **Before**: Required WebSocket server (Node.js/PHP WebSocket)
- **After**: No additional server required (uses WordPress)

### 4. Data Flow
- **Before**: Bidirectional WebSocket messages
- **After**: Request/response via WordPress Heartbeat events

## Backend Changes Required

### PHP Heartbeat Handler
```php
// Add to includes/class-heartbeat-handler.php

add_filter('heartbeat_received', 'appointease_heartbeat_handler', 10, 2);

function appointease_heartbeat_handler($response, $data) {
    // Handle appointease_poll data
    if (isset($data['appointease_poll'])) {
        $poll_data = $data['appointease_poll'];
        
        // Get active selections
        $response['appointease_active_selections'] = get_active_selections();
        
        // Get booked slots
        $response['appointease_booked_slots'] = get_booked_slots(
            $poll_data['date'],
            $poll_data['employee_id']
        );
        
        // Get locked slots
        $response['appointease_locked_slots'] = get_locked_slots(
            $poll_data['date'],
            $poll_data['employee_id']
        );
        
        // Get user appointments if email provided
        if (!empty($poll_data['email'])) {
            $response['appointments'] = get_user_appointments($poll_data['email']);
        }
    }
    
    // Handle booking actions
    if (isset($data['appointease_booking'])) {
        $booking_data = $data['appointease_booking'];
        
        switch ($booking_data['action']) {
            case 'select_slot':
                $response['appointease_booking'] = handle_select_slot($booking_data);
                break;
            case 'deselect_slot':
                $response['appointease_booking'] = handle_deselect_slot($booking_data);
                break;
            case 'confirm_booking':
                $response['appointease_booking'] = handle_confirm_booking($booking_data);
                break;
        }
    }
    
    return $response;
}
```

## Testing the Migration

### 1. Check Heartbeat is Active
```javascript
// In browser console
jQuery(document).on('heartbeat-send', function(e, data) {
    console.log('[Heartbeat] Sending:', data);
});

jQuery(document).on('heartbeat-tick', function(e, data) {
    console.log('[Heartbeat] Received:', data);
});
```

### 2. Verify Real-time Updates
1. Open booking form
2. Select service, employee, date
3. Watch browser console for heartbeat events every 5 seconds
4. Verify `appointease_poll` data is being sent
5. Verify response contains `appointease_active_selections`, `appointease_booked_slots`, etc.

### 3. Test Booking Flow
1. Complete a booking (Steps 1-7)
2. Verify no WebSocket errors in console
3. Check that slot availability updates
4. Confirm booking success

### 4. Test Dashboard
1. Login to user dashboard
2. Verify appointments load
3. Check that appointments update every 5 seconds
4. Test reschedule and cancel functions

## Troubleshooting

### Issue: No real-time updates
**Solution**: Check that WordPress Heartbeat is enabled
```php
// In wp-config.php, ensure this is NOT present:
// define('WP_DISABLE_HEARTBEAT', true);
```

### Issue: Slow updates
**Solution**: Adjust Heartbeat interval
```javascript
// In useHeartbeat.ts
window.wp.heartbeat.interval(5); // 5 seconds (default: 15)
```

### Issue: Heartbeat not sending data
**Solution**: Verify poll data is set correctly
```typescript
// Check heartbeatPollData in BookingApp.tsx
console.log('Poll data:', heartbeatPollData);
```

### Issue: Backend not responding
**Solution**: Check PHP heartbeat handler is registered
```php
// Verify in includes/class-heartbeat-handler.php
add_filter('heartbeat_received', 'appointease_heartbeat_handler', 10, 2);
```

## Performance Considerations

### Heartbeat Optimization
```javascript
// Disable Heartbeat when not needed
const { isConnected } = useHeartbeat({
    enabled: needsRealtime, // Only enable when necessary
    pollData: heartbeatPollData
});
```

### Reduce Server Load
```php
// Cache frequently accessed data
function get_booked_slots($date, $employee_id) {
    $cache_key = "booked_slots_{$date}_{$employee_id}";
    $cached = wp_cache_get($cache_key);
    
    if ($cached !== false) {
        return $cached;
    }
    
    $slots = // ... fetch from database
    wp_cache_set($cache_key, $slots, '', 60); // Cache for 60 seconds
    
    return $slots;
}
```

## Rollback Plan

If issues occur, you can temporarily revert to WebSocket:

1. Restore `useRealtime` import in BookingApp.tsx
2. Replace `useHeartbeat` with `useRealtime`
3. Restore WebSocket configuration
4. Restart WebSocket server

However, the Heartbeat implementation is more stable and recommended for production.

## Benefits of Migration

✅ **No external dependencies** - Uses WordPress core functionality
✅ **Better reliability** - WordPress Heartbeat is battle-tested
✅ **Easier deployment** - No WebSocket server setup required
✅ **Lower maintenance** - Fewer moving parts
✅ **WordPress native** - Follows WordPress best practices
✅ **Automatic reconnection** - WordPress handles connection issues
✅ **Built-in throttling** - Prevents server overload

## Support

For issues or questions:
1. Check browser console for errors
2. Verify WordPress Heartbeat is enabled
3. Check PHP error logs for backend issues
4. Review `WEBSOCKET_REMOVAL_SUMMARY.md` for technical details
