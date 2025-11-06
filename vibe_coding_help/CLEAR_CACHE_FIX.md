# Fix Employee ID 1 Showing Incomplete Data

## Issue
Employee ID 1 shows only `{id: 1, name: "Staff Member"}` in frontend, but database has complete data for "Sarah Johnson".

## Root Cause
Frontend is using **cached/stale data** from:
- Browser localStorage
- WordPress data store cache
- Browser cache

## Quick Fix (User Side)

### Option 1: Hard Refresh
1. Press `Ctrl + Shift + R` (Windows/Linux)
2. Or `Cmd + Shift + R` (Mac)
3. This clears browser cache and reloads

### Option 2: Clear Browser Data
1. Open browser DevTools (F12)
2. Go to Application tab
3. Clear Storage → Clear site data
4. Refresh page

### Option 3: Incognito/Private Window
1. Open new incognito window
2. Navigate to booking page
3. Employee data should load fresh

## Permanent Fix (Developer Side)

### Add Cache Busting
Update the employee fetch to bypass cache:

```typescript
fetch(`${window.bookingAPI.root}appointease/v1/staff?_=${Date.now()}`)
```

The `?_=${Date.now()}` parameter forces fresh data on every request.

## Verification
After clearing cache, Employee ID 1 should show:
```json
{
  "id": 1,
  "name": "Sarah Johnson",
  "email": "sarah@appointease.com",
  "phone": "555-0123",
  ...
}
```

## Note
This is a **frontend caching issue**, not a database problem. The database has correct data for all 3 employees.
