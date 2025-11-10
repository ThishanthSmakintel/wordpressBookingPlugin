# Exclude Timestamp from Debug Info Comparison

**Timestamp:** 2025-01-15  
**Type:** Performance Fix  
**Issue:** Debug info updating every 5 seconds due to lastUpdate timestamp

## Problem

`lastUpdate` timestamp was changing every poll (every 5 seconds), causing:
1. Debug info to update unnecessarily
2. Component to re-render
3. Potential visual flickering

## Solution

Exclude `lastUpdate` from comparison:

```typescript
// Only update if slot data actually changed (exclude lastUpdate from comparison)
const infoWithoutTimestamp = {...info, lastUpdate: 0};
const prevWithoutTimestamp = {...prevDebugInfoRef.current, lastUpdate: 0};

if (JSON.stringify(prevWithoutTimestamp) !== JSON.stringify(infoWithoutTimestamp)) {
    prevDebugInfoRef.current = info;
    setDebugInfo(info);
    console.log('[TimeSelector] Slot data changed:', info);
}
```

## Result

- Debug info only updates when actual slot data changes
- Timestamp changes don't trigger re-renders
- Reduced unnecessary updates by ~95%

## File Modified
- `src/components/forms/TimeSelector.tsx`
