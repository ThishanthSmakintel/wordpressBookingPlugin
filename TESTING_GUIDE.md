# Real-Time Slot Visibility Testing Guide

## Quick Test (2 Minutes)

### Prerequisites
- WordPress site running at `http://localhost/wordpress/blog.promoplus.com`
- Plugin activated
- At least 1 service and 1 staff member configured

### Step-by-Step Test

#### 1. Open Two Browser Windows
```
Browser 1: Chrome (normal mode)
Browser 2: Chrome (incognito) or Firefox
```

#### 2. Navigate to Booking Page
```
Both browsers: Go to the page with [appointease_booking] shortcode
```

#### 3. Complete Steps 1-3 in Both Browsers
```
Step 1: Select same service (e.g., "Consultation")
Step 2: Select same staff member (e.g., "Dr. Smith")
Step 3: Select same date (e.g., tomorrow's date)
```

#### 4. Test Real-Time Visibility (Step 4 - Time Selection)

**Browser 1 Actions:**
1. Click on time slot "09:00"
2. Wait 3 seconds (polling interval)

**Browser 2 Expected Result:**
- Within 3 seconds, "09:00" slot should show 👁️ icon
- Icon should pulse/animate
- Slot remains clickable (competition mode)

**Browser 1 Actions:**
3. Click on different slot "10:00"
4. Wait 3 seconds

**Browser 2 Expected Result:**
- 👁️ icon moves from "09:00" to "10:00"
- Previous slot "09:00" returns to normal

#### 5. Test Cleanup
**Browser 1 Actions:**
1. Close browser tab or navigate away

**Browser 2 Expected Result:**
- Within 30 seconds, 👁️ icon disappears from "10:00"
- Slot returns to normal "Available" state

---

## Detailed Testing Scenarios

### Scenario 1: Single User Watching
**Test**: One user selects a slot, another user sees the eye icon

**Steps:**
1. Browser 1: Select slot "09:00"
2. Browser 2: Wait 3 seconds
3. **Expected**: Browser 2 shows 👁️ on "09:00"

**Success Criteria:**
- ✅ Eye icon appears within 3 seconds
- ✅ Icon has pulsing animation
- ✅ Slot shows "Available" status (not disabled)

---

### Scenario 2: Multiple Users Watching Same Slot
**Test**: Two users select the same slot simultaneously

**Steps:**
1. Browser 1: Select slot "10:00"
2. Browser 2: Select slot "10:00"
3. Wait 3 seconds in both browsers

**Expected:**
- Both browsers show 👁️ on "10:00"
- Both can proceed to confirmation
- First to confirm wins (competition mode)

**Success Criteria:**
- ✅ Both users see eye icon
- ✅ Both can click "Next"
- ✅ First confirmation succeeds
- ✅ Second confirmation fails with "slot already booked"

---

### Scenario 3: User Switches Slots
**Test**: User changes selection, eye icon moves

**Steps:**
1. Browser 1: Select "09:00"
2. Browser 2: Wait 3 seconds → sees 👁️ on "09:00"
3. Browser 1: Select "11:00"
4. Browser 2: Wait 3 seconds

**Expected:**
- 👁️ moves from "09:00" to "11:00"
- "09:00" returns to normal

**Success Criteria:**
- ✅ Eye icon updates within 3 seconds
- ✅ Previous slot clears properly
- ✅ No duplicate icons

---

### Scenario 4: Session Timeout
**Test**: Selection expires after 30 seconds

**Steps:**
1. Browser 1: Select "14:00"
2. Browser 2: Wait 3 seconds → sees 👁️
3. Wait 30 seconds (do nothing)
4. Browser 2: Check "14:00" slot

**Expected:**
- After 30 seconds, 👁️ disappears
- Slot returns to "Available"

**Success Criteria:**
- ✅ Icon disappears after 30 seconds
- ✅ Slot becomes normal again
- ✅ No stale selections

---

### Scenario 5: Browser Close/Refresh
**Test**: Cleanup on navigation away

**Steps:**
1. Browser 1: Select "15:00"
2. Browser 2: Wait 3 seconds → sees 👁️
3. Browser 1: Close tab or refresh page
4. Browser 2: Wait 3 seconds

**Expected:**
- 👁️ disappears immediately (deselect API call)
- If deselect fails, disappears after 30 seconds (timeout)

**Success Criteria:**
- ✅ Immediate cleanup on unmount
- ✅ Fallback timeout works
- ✅ No orphaned selections

---

## Backend API Testing

### Test Polling Endpoint
```bash
# Get active selections
curl "http://localhost/wordpress/blog.promoplus.com/wp-json/appointease/v1/realtime/poll?date=2025-01-20&employee_id=1"

# Expected Response:
{
  "active_selections": ["09:00", "10:00"],
  "timestamp": 1737123456
}
```

### Test Selection Endpoint
```bash
# Register slot watching
curl -X POST "http://localhost/wordpress/blog.promoplus.com/wp-json/appointease/v1/realtime/select" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-01-20",
    "time": "09:00",
    "employee_id": 1
  }'

# Expected Response:
{
  "success": true,
  "message": "Selection registered"
}
```

### Test Deselection Endpoint
```bash
# Remove slot watching
curl -X POST "http://localhost/wordpress/blog.promoplus.com/wp-json/appointease/v1/realtime/deselect" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-01-20",
    "time": "09:00",
    "employee_id": 1
  }'

# Expected Response:
{
  "success": true,
  "message": "Selection removed"
}
```

---

## Browser DevTools Debugging

### Monitor Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "realtime"

**Expected Requests:**
```
GET  /realtime/poll?date=2025-01-20&employee_id=1  (every 3 seconds)
POST /realtime/select                               (on slot click)
POST /realtime/deselect                             (on unmount)
```

### Check Console Logs
```javascript
// Should see polling activity
[TimeSelector] Polling error: ... (if any errors)

// Should NOT see WebSocket errors
❌ WebSocket connection failed
❌ useRealtimeService is not defined
```

---

## Performance Verification

### Metrics to Check
- **Polling Interval**: Exactly 3 seconds between requests
- **Response Time**: < 100ms for polling endpoint
- **Icon Update Delay**: < 3 seconds (1 polling cycle)
- **Cleanup Time**: Immediate on deselect, 30s on timeout

### Network Load
```
Expected per user:
- 20 requests/minute (3-second polling)
- ~500 bytes per request
- ~10 KB/minute bandwidth
```

---

## Common Issues & Solutions

### Issue 1: Eye Icon Not Appearing
**Symptoms**: No 👁️ icon after 3 seconds

**Debug Steps:**
1. Check Network tab → Is polling happening?
2. Check Response → Does it include `active_selections`?
3. Check Console → Any JavaScript errors?

**Solutions:**
- Verify backend endpoints are registered
- Check `selectedDate` and `selectedEmployee` are set
- Verify transient storage is working

---

### Issue 2: Icon Doesn't Disappear
**Symptoms**: 👁️ stays after user leaves

**Debug Steps:**
1. Check if deselect API is called on unmount
2. Verify transient expiration (30 seconds)
3. Check cleanup in useEffect return

**Solutions:**
- Ensure `tempSelected` is in dependency array
- Verify deselect endpoint is working
- Check transient TTL is 30 seconds

---

### Issue 3: Multiple Icons on Same Slot
**Symptoms**: Duplicate 👁️ icons

**Debug Steps:**
1. Check if old selections are being cleared
2. Verify state updates are atomic
3. Check for race conditions

**Solutions:**
- Ensure `setActiveSelections` replaces (not appends)
- Verify backend returns deduplicated array
- Check session ID uniqueness

---

## WordPress Admin Verification

### Check Transient Storage
```php
// In WordPress admin → Tools → Site Health → Info → Database
// Look for transients:
_transient_selection_2025-01-20_1

// Or use WP-CLI:
wp transient list | grep selection
```

### Expected Transient Format
```php
Key: _transient_selection_2025-01-20_1
Value: ["09:00", "10:00", "14:00"]
Expiration: 30 seconds
```

---

## Success Checklist

### Frontend ✅
- [ ] Polling starts on Step 4 (Time Selection)
- [ ] Polling stops on unmount
- [ ] Eye icon appears within 3 seconds
- [ ] Icon has pulsing animation
- [ ] Icon disappears after 30 seconds
- [ ] Deselect API called on unmount
- [ ] No WebSocket errors in console

### Backend ✅
- [ ] `/realtime/poll` returns active_selections
- [ ] `/realtime/select` stores selection in transient
- [ ] `/realtime/deselect` removes selection
- [ ] Transients expire after 30 seconds
- [ ] Multiple sessions tracked correctly
- [ ] No database errors

### User Experience ✅
- [ ] Real-time updates feel responsive
- [ ] No UI lag or freezing
- [ ] Competition mode works (both can select)
- [ ] First to confirm wins
- [ ] Clear visual feedback
- [ ] No false positives

---

## Production Readiness

### Before Deployment
1. ✅ All 5 scenarios pass
2. ✅ No console errors
3. ✅ Network requests are efficient
4. ✅ Cleanup works properly
5. ✅ Performance is acceptable

### Monitoring
- Track polling request volume
- Monitor transient storage size
- Check for orphaned selections
- Verify cleanup effectiveness

---

## Quick Verification Command

```bash
# Test all endpoints at once
echo "Testing Polling System..."

# 1. Select slot
curl -X POST "http://localhost/wordpress/blog.promoplus.com/wp-json/appointease/v1/realtime/select" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-01-20","time":"09:00","employee_id":1}'

# 2. Check active selections
curl "http://localhost/wordpress/blog.promoplus.com/wp-json/appointease/v1/realtime/poll?date=2025-01-20&employee_id=1"

# 3. Deselect slot
curl -X POST "http://localhost/wordpress/blog.promoplus.com/wp-json/appointease/v1/realtime/deselect" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-01-20","time":"09:00","employee_id":1}'

# 4. Verify cleanup
curl "http://localhost/wordpress/blog.promoplus.com/wp-json/appointease/v1/realtime/poll?date=2025-01-20&employee_id=1"
```

**Expected Output:**
```json
// After select:
{"success":true,"message":"Selection registered"}

// After poll:
{"active_selections":["09:00"],"timestamp":1737123456}

// After deselect:
{"success":true,"message":"Selection removed"}

// After cleanup poll:
{"active_selections":[],"timestamp":1737123460}
```

---

## Report Template

```
## Test Results - [Date]

### Environment
- WordPress Version: 
- Plugin Version: 
- Browser: 
- PHP Version: 

### Scenario Results
- [ ] Scenario 1: Single User Watching - PASS/FAIL
- [ ] Scenario 2: Multiple Users - PASS/FAIL
- [ ] Scenario 3: User Switches Slots - PASS/FAIL
- [ ] Scenario 4: Session Timeout - PASS/FAIL
- [ ] Scenario 5: Browser Close - PASS/FAIL

### Performance
- Polling Interval: ___ seconds
- Icon Update Delay: ___ seconds
- Response Time: ___ ms
- Cleanup Time: ___ seconds

### Issues Found
1. [Description]
2. [Description]

### Notes
[Any additional observations]
```
