# Polling System Verification Checklist

## ✅ Frontend Components

### TimeSelector.tsx
- [x] Removed WebSocket dependencies (`useRealtimeService`)
- [x] Polling every 3 seconds via `setInterval`
- [x] Fetches from `/appointease/v1/realtime/poll`
- [x] Posts to `/appointease/v1/realtime/select` on slot selection
- [x] Posts to `/appointease/v1/realtime/deselect` on unmount
- [x] Eye icon (👁️) displays when `activeSelections.includes(time)`
- [x] Proper cleanup with `clearInterval`
- [x] Dependency arrays correct (no undefined references)

### State Management
- [x] `activeSelections` state: `string[]` - stores watched slots
- [x] Updates from polling response: `data.active_selections`
- [x] Eye icon conditional: `isBeingWatched && !isSelected`

### Slot Logic
- [x] `isPermanentlyBooked` - from database (`unavailableSlots`)
- [x] `isLocked` - temporary lock (`bookingDetails[time].is_locked`)
- [x] `isBeingWatched` - from polling (`activeSelections.includes(time)`)
- [x] `isUnavailable` - permanently booked OR locked by another user
- [x] `isDisabled` - unavailable OR current appointment OR processing

---

## 🔌 Required Backend API Endpoints

### 1. GET `/appointease/v1/realtime/poll`
**Query Parameters:**
- `date` (string) - Selected date (YYYY-MM-DD)
- `employee_id` (int) - Staff member ID

**Expected Response:**
```json
{
  "active_selections": ["09:00", "09:15", "10:30"],
  "locked_slots": ["14:00"],
  "timestamp": 1234567890
}
```

**Status:** ⚠️ NEEDS IMPLEMENTATION

---

### 2. POST `/appointease/v1/realtime/select`
**Request Body:**
```json
{
  "date": "2025-10-28",
  "time": "09:00",
  "employee_id": 3
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Selection registered"
}
```

**Status:** ⚠️ NEEDS IMPLEMENTATION

---

### 3. POST `/appointease/v1/realtime/deselect`
**Request Body:**
```json
{
  "date": "2025-10-28",
  "time": "09:00",
  "employee_id": 3
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Selection removed"
}
```

**Status:** ⚠️ NEEDS IMPLEMENTATION

---

### 4. POST `/appointease/v1/lock-slot` ✅ EXISTS
**Request Body:**
```json
{
  "date": "2025-10-28",
  "time": "09:00",
  "employee_id": 3
}
```

**Expected Response:**
```json
{
  "success": true,
  "client_id": "abc123xyz",
  "expires_in": 300
}
```

**Status:** ✅ ALREADY IMPLEMENTED

---

### 5. POST `/appointease/v1/unlock-slot` ✅ EXISTS
**Request Body:**
```json
{
  "client_id": "abc123xyz"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Slot unlocked"
}
```

**Status:** ✅ ALREADY IMPLEMENTED

---

## 🐛 Debug Panel Requirements

### Debug Information to Display
1. **Polling Status**
   - Last poll time
   - Poll interval (3000ms)
   - Connection status (polling/error)

2. **Active Selections**
   - Array of time slots being watched
   - Count of watchers per slot
   - User's own selection

3. **Locked Slots**
   - Temporarily locked slots
   - Lock expiration times
   - Client IDs

4. **API Calls Log**
   - Recent polling requests
   - Selection/deselection events
   - Lock/unlock operations
   - Response times

### Debug Panel Component Structure
```typescript
interface DebugInfo {
  lastPollTime: Date;
  pollInterval: number;
  activeSelections: string[];
  lockedSlots: Record<string, { client_id: string; expires: number }>;
  apiCalls: Array<{
    endpoint: string;
    method: string;
    timestamp: Date;
    duration: number;
    status: number;
  }>;
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Single User Selection
1. User A selects 09:00
2. POST to `/realtime/select` succeeds
3. Next poll shows `active_selections: ["09:00"]`
4. Eye icon appears on 09:00 for other users

### Scenario 2: Multiple Users Same Slot
1. User A selects 09:00
2. User B selects 09:00
3. Both see eye icon on 09:00
4. Both can click (competition mode)
5. First to confirm gets the slot

### Scenario 3: User Leaves
1. User A selects 09:00
2. User A navigates away
3. POST to `/realtime/deselect` on unmount
4. Next poll removes 09:00 from `active_selections`
5. Eye icon disappears for other users

### Scenario 4: Temporary Lock
1. User A selects 09:00 and proceeds to step 5
2. POST to `/lock-slot` succeeds
3. `bookingDetails["09:00"].is_locked = true`
4. Slot becomes unavailable for User B
5. Lock expires after 5 minutes if not confirmed

---

## 📊 Performance Metrics

### Target Metrics
- Polling interval: 3 seconds
- API response time: < 200ms
- Eye icon update latency: < 3 seconds
- Lock expiration: 5 minutes (300 seconds)
- Selection timeout: 30 seconds

### Monitoring Points
- Number of active polling connections
- Database query performance for active selections
- Memory usage for selection tracking
- Network bandwidth (polling overhead)

---

## 🔧 Implementation Checklist

### Backend (PHP)
- [ ] Create `/realtime/poll` endpoint
- [ ] Create `/realtime/select` endpoint
- [ ] Create `/realtime/deselect` endpoint
- [ ] Implement in-memory selection tracking (Redis/Memcached recommended)
- [ ] Add automatic cleanup for expired selections (30s timeout)
- [ ] Add CORS headers for polling requests
- [ ] Implement rate limiting (max 1 poll per second per user)

### Frontend (React)
- [x] Remove all WebSocket code
- [x] Implement polling with `setInterval`
- [x] Add selection notification on slot click
- [x] Add deselection notification on unmount
- [x] Display eye icon for watched slots
- [x] Handle polling errors gracefully
- [ ] Add debug panel for monitoring

### Testing
- [ ] Test single user selection
- [ ] Test multiple users same slot
- [ ] Test user navigation/unmount
- [ ] Test temporary lock system
- [ ] Test polling error handling
- [ ] Test selection timeout (30s)
- [ ] Load test with 50+ concurrent users

---

## 🚨 Known Issues & Limitations

### Current Limitations
1. **Polling Delay**: 3-second delay before other users see selections
2. **Server Load**: Each user polls every 3 seconds (scalability concern)
3. **No Real-time**: Not true real-time like WebSocket (acceptable trade-off)

### Recommended Optimizations
1. **Increase polling interval** to 5 seconds for lower server load
2. **Implement caching** for poll responses (1-second cache)
3. **Use Redis** for selection tracking (fast in-memory storage)
4. **Add exponential backoff** on polling errors
5. **Implement long-polling** for better real-time feel (optional)

---

## 📝 API Implementation Example (PHP)

### `/realtime/poll` Endpoint
```php
public function handle_realtime_poll($request) {
    $date = $request->get_param('date');
    $employee_id = $request->get_param('employee_id');
    
    // Get active selections from cache/database
    $cache_key = "active_selections_{$date}_{$employee_id}";
    $active_selections = wp_cache_get($cache_key);
    
    if ($active_selections === false) {
        // Query database or in-memory store
        $active_selections = $this->get_active_selections($date, $employee_id);
        wp_cache_set($cache_key, $active_selections, '', 1); // 1 second cache
    }
    
    return rest_ensure_response([
        'active_selections' => $active_selections,
        'timestamp' => time()
    ]);
}
```

### `/realtime/select` Endpoint
```php
public function handle_realtime_select($request) {
    $date = $request->get_param('date');
    $time = $request->get_param('time');
    $employee_id = $request->get_param('employee_id');
    
    // Store selection with 30-second expiration
    $selection_key = "selection_{$date}_{$time}_{$employee_id}_" . uniqid();
    wp_cache_set($selection_key, [
        'time' => $time,
        'expires' => time() + 30
    ], '', 30);
    
    // Clear cache to force refresh
    wp_cache_delete("active_selections_{$date}_{$employee_id}");
    
    return rest_ensure_response([
        'success' => true,
        'message' => 'Selection registered'
    ]);
}
```

---

## ✅ Final Verification Steps

1. **Test polling in browser console:**
   ```javascript
   // Check if polling is running
   console.log('[Polling] Active selections:', activeSelections);
   ```

2. **Verify API calls in Network tab:**
   - Look for `/realtime/poll` every 3 seconds
   - Check `/realtime/select` on slot click
   - Verify `/realtime/deselect` on page leave

3. **Test eye icon display:**
   - Open 2 browser windows
   - Select same slot in both
   - Verify eye icon appears within 3 seconds

4. **Test cleanup:**
   - Select a slot
   - Close browser tab
   - Verify deselection API call in server logs

---

## 📞 Support & Debugging

### Common Issues

**Issue: Eye icon not appearing**
- Check browser console for polling errors
- Verify `/realtime/poll` returns correct data
- Check `activeSelections` state in React DevTools

**Issue: Polling not working**
- Verify `selectedDate` and `selectedEmployee` are set
- Check Network tab for 404/500 errors
- Ensure polling interval is running (check `setInterval`)

**Issue: Selection not registering**
- Verify `/realtime/select` endpoint exists
- Check request payload format
- Look for CORS errors in console

---

## 🎯 Success Criteria

- ✅ Eye icon appears within 3 seconds of another user selecting a slot
- ✅ Eye icon disappears within 3 seconds of user leaving
- ✅ Multiple users can compete for same slot
- ✅ Temporary locks prevent double-booking
- ✅ System handles 50+ concurrent users
- ✅ No WebSocket dependencies
- ✅ Graceful error handling
- ✅ Clean unmount/cleanup

---

**Last Updated:** 2025-01-10
**Status:** Frontend Complete ✅ | Backend Pending ⚠️
