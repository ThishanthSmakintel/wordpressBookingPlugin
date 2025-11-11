# Switch to 1-Second Polling for Real-Time Slot Sync

**Date:** 2025-01-15  
**Issue:** User B's slot selection reflects to User A with 5-second delay  
**Solution:** Replace heartbeat (5s) with direct REST API polling (1s)

## Changes Made

### Backend
**File:** `includes/class-api-endpoints.php`
- Added `/appointease/v1/slots/poll` endpoint
- Returns active_selections, booked_slots, locked_slots
- Refreshes user's selection automatically

### Frontend
**File:** `src/components/forms/TimeSelector.tsx`

**Before:**
```typescript
import { useHeartbeatSlotPolling } from '../../hooks/useHeartbeatSlotPolling'; // 5s
const { bookedSlots, activeSelections } = useHeartbeatSlotPolling({...});
```

**After:**
```typescript
import { useSlotPolling } from '../../hooks/useSlotPolling'; // 1s
const { bookedSlots, activeSelections } = useSlotPolling({...});
```

## Result

- **Polling interval:** 5s → 1s (80% faster)
- **Race condition window:** 5s → 1s (80% reduction)
- **User A selects slot** → User B sees it within 1s (was 5s)
- **User B selects slot** → User A sees it within 1s (was 5s)

## Testing

1. Open 2 browsers (User A and User B)
2. Both select same date/employee
3. User A selects 10:00 → User B should see "Processing" within 1s
4. User B selects 10:30 → User A should see "Processing" within 1s

## Files Modified

1. `includes/class-api-endpoints.php` - Added poll_slots() endpoint
2. `src/components/forms/TimeSelector.tsx` - Switched to useSlotPolling
3. `vibe_coding_help/2025-01-15_switch_to_1s_polling.md` - This log

## Build Required

Run `npm run dev` to rebuild frontend with new polling hook.
