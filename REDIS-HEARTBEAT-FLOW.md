# Redis + Heartbeat Real-Time Slot Selection Flow

## Overview
AppointEase uses Redis for <1ms slot locking and WordPress Heartbeat API for real-time updates (5s polling). Both create and reschedule flows use identical logic.

---

## Architecture

```
User A (Browser)          WordPress Heartbeat          Redis/MySQL          User B (Browser)
     |                            |                         |                        |
     | 1. Click slot 09:30        |                         |                        |
     |--------------------------->|                         |                        |
     | UI updates INSTANTLY       |                         |                        |
     |                            |                         |                        |
     | 2. POST /slots/select      |                         |                        |
     |--------------------------->| 3. SET selection key    |                        |
     |                            |------------------------>|                        |
     |                            |    TTL: 600s            |                        |
     |                            |                         |                        |
     | 4. Success response        |                         |                        |
     |<---------------------------|                         |                        |
     |                            |                         |                        |
     |                            | 5. Heartbeat poll (5s)  |                        |
     |                            |<-------------------------------------|            |
     |                            |                         |                        |
     |                            | 6. GET active selections|                        |
     |                            |------------------------>|                        |
     |                            |                         |                        |
     |                            | 7. Return ["09:30"]     |                        |
     |                            |-------------------------|                        |
     |                            |                         |                        |
     |                            | 8. Send to User B       |                        |
     |                            |---------------------------------------------->   |
     |                            |                         |                        |
     |                            |                         |    UI shows 09:30 as   |
     |                            |                         |    "Processing" (yellow)|
```

---

## Frontend Flow (React)

### 1. Slot Selection (`TimeSelector.tsx`)

```typescript
// User clicks slot → INSTANT UI update
setTempSelected(time);  // ✅ Updates UI immediately

// Then call API
await selectSlot(date, time, employeeId, clientId);

// Revert only if API fails
catch (error) {
  setTempSelected(prevSelected);
}
```

**Key Files:**
- `src/components/forms/TimeSelector.tsx` - Slot selection UI
- `src/hooks/useHeartbeat.ts` - Slot locking API calls

### 2. Real-Time Polling (`useHeartbeatSlotPolling.ts`)

```typescript
// Polls every 5 seconds via WordPress Heartbeat
useHeartbeat({
  pollData: { date, employee_id, client_id, selected_time },
  onPoll: (data) => {
    setActiveSelections(data.appointease_active_selections);
    setBookedSlots(data.appointease_booked_slots);
  }
});
```

**Returns:**
- `activeSelections` - Slots being selected by other users (yellow)
- `bookedSlots` - Confirmed appointments (red)
- `lockedSlots` - Temporarily locked slots (red)

---

## Backend Flow (PHP)

### 3. Heartbeat Handler (`class-heartbeat-handler.php`)

**Every 5 seconds:**

```php
// 1. Check Redis health
$redis_available = $this->redis->health_check();

// 2. Get booked slots from MySQL
$booked_slots = $wpdb->get_col("
  SELECT TIME_FORMAT(TIME(appointment_date), '%H:%i') 
  FROM wp_appointments 
  WHERE DATE(appointment_date) = '$date' 
  AND employee_id = $employee_id
");

// 3. Get active selections from Redis
if ($redis_available) {
  $selections = $this->redis->get_active_selections($date, $employee_id);
} else {
  // Fallback to WordPress transients
  $selections = get_transient("appointease_active_{$date}_{$employee_id}");
}

// 4. Return to frontend
return [
  'appointease_active_selections' => $active_times,
  'appointease_booked_slots' => $booked_slots,
  'redis_status' => $redis_available ? 'available' : 'unavailable'
];
```

---

## Redis Keys Structure

### Selection Keys
```
appointease_selection_{date}_{employee}_{time}_{client_id}
```
- **TTL:** 600 seconds (10 minutes)
- **Value:** `{ time: "09:30", client_id: "client_123", timestamp: 1234567890 }`
- **Purpose:** Track which slots users are actively selecting

### Lock Keys
```
appointease_lock_{date}_{employee}_{time}
```
- **TTL:** 600 seconds (10 minutes)
- **Value:** `{ user_id: "abc123", time: "09:30", locked_at: 1234567890 }`
- **Purpose:** Prevent race conditions during booking

---

## API Endpoints

### POST `/appointease/v1/slots/select`
**Request:**
```json
{
  "date": "2025-11-05",
  "time": "09:30",
  "employee_id": 1,
  "client_id": "client_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Slot selected",
  "storage": "redis"
}
```

### POST `/appointease/v1/slots/deselect`
**Request:**
```json
{
  "date": "2025-11-05",
  "time": "09:30",
  "employee_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Slot deselected"
}
```

---

## Slot States

| State | Color | Border | Description |
|-------|-------|--------|-------------|
| **Available** | White | Gray | No one selected, not booked |
| **Your Selection** | White | Green (3px) | Current user's selection |
| **Processing** | Yellow | Dashed Orange | Another user is selecting |
| **Booked** | Red | Red | Confirmed appointment exists |
| **Current Time** | Orange | Orange | Current appointment (reschedule only) |

---

## Performance Metrics

| Operation | Redis | MySQL Fallback |
|-----------|-------|----------------|
| Slot selection | <1ms | ~15ms |
| Heartbeat poll | <5ms | ~20ms |
| Lock check | <1ms | ~10ms |
| Total booking | ~50ms | ~150ms |

---

## Reschedule vs Create Appointment

Both flows use **IDENTICAL** logic:

| Feature | Create | Reschedule |
|---------|--------|------------|
| Slot selection | ✅ Same | ✅ Same |
| Redis locking | ✅ Same | ✅ Same |
| Heartbeat polling | ✅ Same | ✅ Same |
| Immediate UI update | ✅ Same | ✅ Same |
| API endpoints | ✅ Same | ✅ Same |

**Only difference:** Reschedule excludes current appointment slot from unavailable list.

---

## MySQL Fallback

If Redis is unavailable:

1. **WordPress Transients** store selections
2. **Performance:** ~15ms instead of <1ms
3. **Automatic sync** when Redis recovers
4. **No data loss** - seamless failover

```php
// Automatic fallback in Redis Helper
if (!$this->redis->ping()) {
  set_transient("appointease_selection_{$key}", $data, 600);
}
```

---

## Key Implementation Rules

### ✅ DO
- Update UI state FIRST before API calls
- Use same TimeSelector for create and reschedule
- Remove React.memo() from real-time components
- Poll every 5 seconds via Heartbeat
- Show all active selections to all users

### ❌ DON'T
- Use React.memo() on TimeSelector
- Create separate reschedule slot selection logic
- Use useMemo() for slot styles
- Poll faster than 5 seconds (WordPress limit)
- Hide other users' selections

---

## Troubleshooting

### Slot not updating immediately
- Check: React.memo() removed from TimeSelector
- Check: setTempSelected() called before API
- Check: Component key includes selection state

### Other users' selections not showing
- Check: Heartbeat polling enabled
- Check: Redis health_check() passing
- Check: activeSelections in unavailableSet

### Redis connection issues
- Check: Redis server running
- Check: PHP redis extension installed
- Fallback: MySQL transients auto-enabled

---

## Files Reference

**Frontend:**
- `src/components/forms/TimeSelector.tsx` - Slot selection UI
- `src/hooks/useHeartbeat.ts` - Slot locking API
- `src/hooks/useHeartbeatSlotPolling.ts` - Real-time polling
- `src/app/features/booking/components/BookingFlow.tsx` - Main flow

**Backend:**
- `includes/class-heartbeat-handler.php` - Heartbeat processing
- `includes/class-redis-helper.php` - Redis operations
- `includes/class-api-endpoints.php` - REST API endpoints

**Rules:**
- `.amazonq/rules/always.md` - Development guidelines (C11-C13)
