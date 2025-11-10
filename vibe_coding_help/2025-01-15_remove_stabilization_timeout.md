# Remove Stabilization Timeout

**Timestamp:** 2025-01-15  
**Type:** Bug Fix  
**Issue:** Active selections looping between none → 9:00 → 10:00 → none

## Problem

The 200ms stabilization timeout was conflicting with smart diffing:
- Smart diffing prevents unnecessary updates
- Stabilization timeout delays updates by 200ms
- Creates timing conflicts and loops

## Solution

Removed the stabilization timeout completely:
```typescript
// Smart diffing already prevents flickering - no need for stabilization timeout
```

## Why This Works

Smart diffing in `useHeartbeatSlotPolling` already:
- Compares arrays before updating
- Returns previous reference if unchanged
- Prevents unnecessary re-renders

The timeout was redundant and causing timing issues.

## File Modified
- `src/components/forms/TimeSelector.tsx`
