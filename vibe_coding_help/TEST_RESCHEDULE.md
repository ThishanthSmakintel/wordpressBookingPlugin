# Test Reschedule Flow

## Test Steps

1. **Create an appointment**
   - Book appointment for tomorrow at 10:00 AM
   - Note the appointment ID

2. **Start reschedule**
   - Go to manage appointment
   - Click "Reschedule"
   - Select same date (tomorrow)

3. **Verify current time shows as available**
   - ✅ 10:00 AM should show as "Current Time" (orange)
   - ✅ 10:00 AM should be clickable
   - ✅ Other booked slots should show as "Booked" (red)

4. **Select new time**
   - Click on 11:00 AM
   - ✅ Should turn green immediately ("Your Selection")
   - ✅ 10:00 AM should return to "Current Time" (orange)

5. **Verify heartbeat updates**
   - Wait 5 seconds for heartbeat
   - ✅ 11:00 AM should remain green
   - ✅ No slots should show as "Processing" for your own selection

## Expected Backend Behavior

### Initial Load (checkAvailability)
- Endpoint: `/appointease/v1/reschedule-availability`
- Excludes: Current appointment ID
- Returns: All booked slots EXCEPT current appointment

### Heartbeat Polling
- Sends: `exclude_appointment_id` parameter
- Query: Excludes current appointment from booked slots
- Returns: Booked slots without current appointment

### Slot Selection
- Endpoint: `/appointease/v1/slots/select`
- Stores: User's selection in Redis
- Triggers: Immediate heartbeat update

## Debug Console Logs

Look for:
```
[Heartbeat] Polling for date: ..., exclude: APT-2025-XXXXXX
[TimeSelector] Heartbeat data updated: { bookedSlots: [...], activeSelections: [...] }
[TimeSelector] Slot selected successfully: 11:00
```
