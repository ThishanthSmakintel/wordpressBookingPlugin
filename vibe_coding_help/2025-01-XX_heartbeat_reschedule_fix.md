# Heartbeat Reschedule Fix

**Timestamp:** 2025-01-XX  
**Status:** ✅ COMPLETE - All fixes applied and tested
**Issue:** Heartbeat was not excluding current appointment when polling in reschedule mode

## Changes

### Backend
- `includes/class-heartbeat-handler.php`
  - Added `exclude_appointment_id` parameter support
  - Modified booked slots query to exclude current appointment when rescheduling
  - Supports both `APT-` (strong_id) and `AE` (numeric id) formats

### Frontend
- `src/hooks/useHeartbeatSlotPolling.ts`
  - Added `excludeAppointmentId` parameter to interface
  - Pass parameter to heartbeat poll data

- `src/components/forms/TimeSelector.tsx`
  - Pass `currentAppointment.id` to heartbeat when `isRescheduling` is true

## Result
Current appointment slot now shows as available during reschedule flow

## Additional Fix - Immediate Slot Updates
**Issue:** Current appointment time showing as unavailable even after heartbeat excludes it
**Root Cause:** Frontend `unavailableSet` was adding all `heartbeatBookedSlots` without checking if it's the current appointment time
**Fix:** 
- `TimeSelector.tsx`: Exclude current appointment time from unavailableSet during reschedule
- This ensures current time shows as available immediately
**Result:** Current appointment slot is clickable and shows as available during reschedule

## Additional Fix - Reschedule Session Tracking
**Issue:** User B sees User A's current appointment (being rescheduled) as "Booked" instead of "Processing"
**Root Cause:** No mechanism to mark slots as "being rescheduled" for other users
**Fix:**
- When User A enters reschedule mode, store their current appointment time as active selection with `reschedule_` prefix
- Backend removes reschedule slots from `booked_slots` array
- Backend adds reschedule slots to `active_times` array
- User B sees it as "Processing" (yellow) instead of "Booked" (red)
**Result:** Other users see slots being rescheduled as "Processing" not "Booked"
