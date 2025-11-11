# 1-Second Polling for Real-Time Slot Synchronization

**Date:** 2025-01-15  
**Issue:** User A and User B slot selections not syncing immediately (5s delay)  
**Root Cause:** WordPress Heartbeat API has 5-second minimum polling interval

## Problem

When User A selects a slot, User B sees it after up to 5 seconds. When User B selects a slot, User A sees it after another 5 seconds. This creates a **race condition window** where both users can attempt to book the same slot.

### Current Flow
```
User A selects 10:00 → Redis updated instantly
↓ (0-5s delay)
User B's heartbeat polls → sees 10:00 as "Processing"
User B selects 10:30 → Redis updated instantly
↓ (0-5s delay)
User A's heartbeat polls → sees 10:30 as "Processing"
```

## Solution

Replace 5-second heartbeat polling with **1-second REST API polling** for slot updates.

### Changes Made

#### 1. Backend: New Polling Endpoint
**File:** `includes/class-api-endpoints.php`

Added `/appointease/v1/slots/poll` endpoint:
- Polls every 1 second (vs 5s heartbeat)
- Returns active_selections, booked_slots, locked_slots
- Refreshes user's own selection to keep it alive
- Excludes user's own selection from "Processing" list

```php
public function poll_slots($request) {
    $date = $request->get_param('date');
    $employee_id = intval($request->get_param('employee_id'));
    $client_id = $request->get_param('client_id');
    $selected_time = $request->get_param('selected_time');
    
    // Get booked slots from DB
    $booked_slots = $wpdb->get_col(...);
    
    // Get active selections from Redis
    $selections = $this->redis->get_active_selections($date, $employee_id);
    
    // Filter out user's own selection
    foreach ($selections as $time => $sel_data) {
        if ($sel_data['client_id'] !== $client_id) {
            $active_selections[] = $time;
        }
    }
    
    // Refresh user's selection
    if ($client_id && $selected_time) {
        $this->redis->set_active_selection($date, $employee_id, $selected_time, $client_id);
    }
    
    return array(
        'active_selections' => $active_selections,
        'booked_slots' => $booked_slots,
        'locked_slots' => $locked_slots
    );
}
```

#### 2. Frontend: Already Using 1s Polling
**File:** `src/hooks/useSlotPolling.ts`

The frontend already has `useSlotPolling` hook that polls every 1 second. It just needs to be used instead of `useHeartbeatSlotPolling`.

**File:** `src/components/forms/TimeSelector.tsx`

Currently uses:
```typescript
import { useHeartbeatSlotPolling } from '../../hooks/useHeartbeatSlotPolling'; // 5s polling
```

Should use:
```typescript
import { useSlotPolling } from '../../hooks/useSlotPolling'; // 1s polling
```

## Performance Impact

### Before (Heartbeat)
- Polling interval: 5 seconds
- Race condition window: 0-5 seconds
- Network requests: 12/minute
- Latency: Up to 5000ms

### After (1s Polling)
- Polling interval: 1 second
- Race condition window: 0-1 seconds (80% reduction)
- Network requests: 60/minute
- Latency: Up to 1000ms

### Server Load
- Additional requests: +48/minute per user
- Endpoint is lightweight (Redis read + 1 DB query)
- Response size: ~200 bytes
- Total bandwidth: ~12KB/minute per user

## Next Steps

1. **Switch TimeSelector to use 1s polling:**
   ```typescript
   const { bookedSlots, activeSelections } = useSlotPolling({
       date: selectedDate,
       employeeId: selectedEmployee?.id || 0,
       enabled: !!selectedDate && !!selectedEmployee,
       clientId,
       selectedTime: tempSelected
   });
   ```

2. **Remove heartbeat dependency** (optional - can keep for other features)

3. **Monitor Redis performance** - ensure 1s polling doesn't overload Redis

## Testing

Test with 2 browsers:
1. Browser A selects slot → Browser B should see "Processing" within 1s
2. Browser B selects different slot → Browser A should see "Processing" within 1s
3. Verify no double-bookings possible

## Files Modified

- `includes/class-api-endpoints.php` - Added `/slots/poll` endpoint
- `vibe_coding_help/2025-01-15_1s_polling_slot_sync.md` - This documentation

## Files To Modify (Next)

- `src/components/forms/TimeSelector.tsx` - Switch from heartbeat to 1s polling
