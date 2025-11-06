# Frontend Slot Selection Test Instructions

## Test Setup

1. **Open Browser Console** (F12)
2. **Open Two Browser Windows:**
   - Window A: Normal browser
   - Window B: Incognito/Private window

## Test Steps

### User A (Window A):
1. Go to: `http://blog.promoplus.com/52-2/`
2. Click "Manage Appointments"
3. Enter email and get OTP
4. Select an existing appointment
5. Click "Reschedule"
6. Select tomorrow's date
7. **Select time slot 10:30**
8. **Keep browser open, don't click Next**

### User B (Window B):
1. Go to: `http://blog.promoplus.com/52-2/`
2. Start new booking flow
3. Select service → Select staff → Select same date as User A
4. **Check time slot 10:30**

## Expected Results

✅ **User B should see 10:30 as:**
- Yellow background (#fef3c7)
- Dashed orange border
- Text: "Processing"
- Disabled (not clickable)

❌ **If User B sees 10:30 as "Available":**
- Check browser console for errors
- Look for `[HeartbeatPolling]` logs
- Look for `[TimeSelector]` logs

## Console Logs to Check

### User A Console:
```
[TimeSelector] Slot selected successfully: 10:30
[Heartbeat] Slot selected via REST: {...}
```

### User B Console (every 5 seconds):
```
[HeartbeatPolling] Raw data received: {...}
[HeartbeatPolling] Active selections: ["10:30"]
[TimeSelector] Heartbeat data updated: {
  activeSelections: ["10:30"],
  bookedSlots: [...],
  tempSelected: ""
}
```

## Troubleshooting

### If no heartbeat logs appear:
1. Check WordPress Heartbeat is loaded:
   ```javascript
   console.log(typeof wp !== 'undefined' && wp.heartbeat)
   ```

### If activeSelections is empty:
1. Check backend test passed: `php tests/php/RescheduleSlotTest.php`
2. Check Redis is running
3. Check PHP error logs

### If slot shows as "Available" instead of "Processing":
1. Check `isProcessing` calculation in console:
   ```javascript
   // Should be true for 10:30
   heartbeatActiveSelections.includes("10:30")
   ```

## Quick Debug Commands

### Check Heartbeat Status:
```javascript
console.log('Heartbeat:', wp.heartbeat);
console.log('jQuery:', typeof jQuery);
```

### Force Heartbeat Poll:
```javascript
wp.heartbeat.connectNow();
```

### Check Current State:
```javascript
// In React DevTools, find TimeSelector component
// Check props: heartbeatActiveSelections
```

## Test with HTML Page

Alternative test using standalone page:
1. Go to: `http://blog.promoplus.com/wp-content/plugins/wordpressBookingPlugin/tests/frontend-slot-test.html`
2. Click "Select Slot (User A)"
3. Click "Poll Heartbeat (User B)"
4. Check results

## Success Criteria

- ✅ Backend test passes (PHP)
- ✅ User A can select slot
- ✅ User B sees slot as "Processing" within 5 seconds
- ✅ Console shows `activeSelections: ["10:30"]`
- ✅ Slot becomes available after 10 minutes (TTL expires)
