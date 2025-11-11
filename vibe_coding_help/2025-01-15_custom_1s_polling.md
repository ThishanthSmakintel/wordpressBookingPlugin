# Custom 1-Second Polling Implementation

**Date:** 2025-01-15  
**Change Type:** Performance Optimization  
**Impact:** Frontend + Backend

## Summary
Replaced WordPress Heartbeat (5-second minimum) with custom 1-second REST API polling for real-time slot updates.

## Changes Made

### Frontend
1. **New Hook: `useSlotPolling.ts`**
   - Direct REST API polling every 1 second
   - Replaces `useHeartbeatSlotPolling`
   - Cleaner implementation without WordPress dependencies
   - Auto-cleanup on unmount

2. **Updated: `TimeSelector.tsx`**
   - Changed import from `useHeartbeatSlotPolling` to `useSlotPolling`
   - No other changes needed (same interface)

### Backend
1. **New Endpoint: `/appointease/v1/slots/poll`**
   - GET endpoint for polling slot status
   - Returns: active_selections, booked_slots, locked_slots
   - Supports reschedule exclusion
   - Refreshes user's selection on each poll

## Technical Details

### Polling Frequency
- **Old:** 5 seconds (WordPress Heartbeat minimum)
- **New:** 1 second (custom polling)
- **Improvement:** 5x faster updates

### API Endpoint
```
GET /wp-json/appointease/v1/slots/poll
Query Params:
  - date (required)
  - employee_id (required)
  - client_id (optional)
  - selected_time (optional)
  - exclude_appointment_id (optional)
```

### Response Format
```json
{
  "active_selections": ["09:00", "10:00"],
  "booked_slots": ["11:00", "14:00"],
  "locked_slots": ["15:00"],
  "timestamp": 1705334400
}
```

## Benefits
1. **Faster Updates:** 1s vs 5s polling
2. **Simpler Code:** No WordPress Heartbeat complexity
3. **Better Control:** Direct REST API calls
4. **Same Features:** All functionality preserved

## Files Modified
- `src/hooks/useSlotPolling.ts` (NEW)
- `src/components/forms/TimeSelector.tsx`
- `includes/class-api-endpoints.php`

## Testing Required
- [ ] Verify 1-second polling works
- [ ] Check slot selection updates in real-time
- [ ] Test reschedule flow
- [ ] Verify multiple users see each other's selections
- [ ] Check performance with multiple concurrent users

## Rollback Plan
If issues occur, revert TimeSelector.tsx to use `useHeartbeatSlotPolling` instead of `useSlotPolling`.
