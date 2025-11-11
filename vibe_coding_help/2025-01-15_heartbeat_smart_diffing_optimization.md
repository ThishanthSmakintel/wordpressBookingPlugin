# Heartbeat Smart Diffing Optimization

**Timestamp:** 2025-01-15  
**Type:** Performance Optimization  
**Impact:** Prevents unnecessary re-renders during slot polling

## Problem

The heartbeat polling hook was updating state on every heartbeat tick (every 5 seconds), even when the slot data (booked slots, active selections, locked slots) hadn't changed. This caused unnecessary component re-renders and UI flickering.

## Root Cause

In `useHeartbeatSlotPolling.ts`, the `onPoll` callback was calling `setState` unconditionally:

```typescript
onPoll: (data: any) => {
  const newActiveSelections = data?.appointease_active_selections || [];
  const newBookedSlots = data?.appointease_booked_slots || [];
  const newLockedSlots = data?.appointease_locked_slots || [];
  
  // ❌ Always updates state, even if data is identical
  setActiveSelections(newActiveSelections);
  setBookedSlots(newBookedSlots);
  setLockedSlots(newLockedSlots);
  setLastUpdate(Date.now());
}
```

## Solution

Implemented smart diffing using `arraysEqual` utility to compare old and new data before updating state:

```typescript
const prevDataRef = useRef({
  activeSelections: [],
  bookedSlots: [],
  lockedSlots: []
});

onPoll: (data: any) => {
  const newActiveSelections = data?.appointease_active_selections || [];
  const newBookedSlots = data?.appointease_booked_slots || [];
  const newLockedSlots = data?.appointease_locked_slots || [];
  
  const prev = prevDataRef.current;
  let hasChanges = false;
  
  // ✅ Only update if data actually changed
  if (!arraysEqual(prev.activeSelections, newActiveSelections)) {
    setActiveSelections(newActiveSelections);
    prevDataRef.current.activeSelections = newActiveSelections;
    hasChanges = true;
  }
  
  if (!arraysEqual(prev.bookedSlots, newBookedSlots)) {
    setBookedSlots(newBookedSlots);
    prevDataRef.current.bookedSlots = newBookedSlots;
    hasChanges = true;
  }
  
  if (!arraysEqual(prev.lockedSlots, newLockedSlots)) {
    setLockedSlots(newLockedSlots);
    prevDataRef.current.lockedSlots = newLockedSlots;
    hasChanges = true;
  }
  
  // Only update lastUpdate if actual data changed
  if (hasChanges) {
    setLastUpdate(Date.now());
  }
}
```

## Benefits

1. **Prevents Unnecessary Re-renders**: Components only re-render when slot data actually changes
2. **Reduces UI Flickering**: Stable state prevents visual glitches
3. **Better Performance**: Less React reconciliation work
4. **Cleaner Logs**: Console logs only show actual changes

## Technical Details

- Uses `useRef` to store previous values without triggering re-renders
- Leverages existing `arraysEqual` utility from `smartDiff.ts`
- Order-independent array comparison (handles Redis set ordering)
- Maintains `pollCount` increment for debugging purposes

## Files Modified

- `src/hooks/useHeartbeatSlotPolling.ts` - Added smart diffing logic

## Testing

Test by:
1. Select a time slot
2. Watch console logs - should see "No changes detected - re-render prevented" on subsequent heartbeats
3. Open another browser/tab and select a different slot
4. Original tab should log "Active selections changed" and re-render only once

## Related

- Complements existing `useSlotStore` smart diffing
- Uses same `arraysEqual` utility for consistency
- Part of broader anti-flicker optimization strategy
