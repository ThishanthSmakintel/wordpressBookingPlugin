# Employee ID Bug Fix - January 6, 2025

## Problem
When rescheduling appointment APT-2025-000334, the debug panel showed "Staff Member (ID: 1)" even though the appointment in database has `employee_id=3` (Dr. Brown).

## Root Cause Analysis

### Database State (Correct)
```sql
SELECT id, strong_id, employee_id FROM wp_appointments WHERE strong_id = 'APT-2025-000334';
-- Result: id=334, strong_id=APT-2025-000334, employee_id=3
```

### Issue Chain
1. **Backend API** (`get_user_appointments` in class-api-endpoints.php):
   - Returns raw database rows including `employee_id=3` ✅

2. **Frontend Transformation** (`loadUserAppointmentsRealtime` in useBookingActions.ts):
   - Transformed appointment data but **OMITTED `employee_id`** ❌
   - Only included: id, service, staff, date, status, name, email

3. **Reschedule Logic** (BookingApp.tsx lines 443, 467):
   - Tried to match employee by `staff_name` from appointment
   - When no match found, fell back to `{id: 1, name: 'Staff Member'}` ❌
   - Should have used `employee_id` from appointment data

## Files Fixed

### 1. src/hooks/useBookingActions.ts
**Line 177-186**: Added `employee_id` to formatted appointments
```typescript
const formattedAppointments = (appointments || []).map((apt: any) => ({
    id: apt.strong_id || `AE${apt.id.toString().padStart(6, '0')}`,
    service: apt.service_name || 'Service',
    staff: apt.staff_name || 'Staff Member',
    date: apt.appointment_date,
    status: apt.status,
    name: apt.name,
    email: apt.email,
    employee_id: apt.employee_id  // ✅ ADDED
}));
```

### 2. src/app/core/BookingApp.tsx
**Lines 437-450**: Fixed reschedule from Dashboard
```typescript
onReschedule={(appointment) => {
    bookingState.setCurrentAppointment({
        id: appointment.id,
        name: appointment.name || bookingState.loginEmail,
        email: appointment.email || bookingState.loginEmail,
        appointment_date: appointment.date,
        status: appointment.status,
        service_name: appointment.service,
        staff_name: appointment.staff,
        employee_id: appointment.employee_id  // ✅ ADDED
    });
    setSelectedService({name: appointment.service, price: 0});
    // Use employee_id from appointment, fallback to name match
    const matchingEmployee = employees.find(emp => emp.id === appointment.employee_id) ||  // ✅ PRIMARY
                           employees.find(emp => emp.name === appointment.staff);
    setSelectedEmployee(matchingEmployee || {id: appointment.employee_id || 1, name: appointment.staff});  // ✅ USE ACTUAL ID
```

**Lines 461-470**: Fixed reschedule from AppointmentManager
```typescript
onReschedule={() => {
    setSelectedService({name: bookingState.currentAppointment?.service_name, price: 0});
    // Use employee_id from appointment, fallback to name match
    const matchingEmployee = employees.find(emp => emp.id === bookingState.currentAppointment?.employee_id) ||  // ✅ PRIMARY
                           employees.find(emp => emp.name === bookingState.currentAppointment?.staff_name);
    setSelectedEmployee(matchingEmployee || {id: bookingState.currentAppointment?.employee_id || 1, name: bookingState.currentAppointment?.staff_name || 'Staff Member'});  // ✅ USE ACTUAL ID
```

### 3. src/types/index.ts
**Line 16-24**: Added `employee_id` to Appointment interface
```typescript
export interface Appointment {
  id: string;
  service: string;
  staff: string;
  date: string;
  status: 'confirmed' | 'cancelled' | 'rescheduled' | 'created';
  name: string;
  email: string;
  employee_id?: number;  // ✅ ADDED
}
```

## Testing
1. Open reschedule for appointment APT-2025-000334
2. Debug panel should now show "Dr. Brown (ID: 3)" instead of "Staff Member (ID: 1)"
3. Reschedule should work with correct employee

## Impact
- **Before**: All reschedules defaulted to employee_id=1 when name didn't match
- **After**: Reschedules use actual employee_id from database
- **Backward Compatible**: Fallback logic still works if employee_id is missing

## Related Files
- Database: wp_appointments table has employee_id column
- Backend: class-api-endpoints.php returns employee_id in API responses
- Frontend: Now properly passes employee_id through the data flow
