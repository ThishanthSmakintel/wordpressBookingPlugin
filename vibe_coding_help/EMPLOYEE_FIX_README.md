# Employee ID 1 Data Fix

## Issue
Employee ID 1 shows incomplete data:
```json
{
  "id": 1,
  "name": "Staff Member"
}
```

While Employee ID 3 has complete data:
```json
{
  "id": "3",
  "name": "Dr. Brown",
  "email": "brown@clinic.com",
  "phone": null,
  "created_at": "2025-10-28 08:01:42",
  "working_hours": null,
  "avatar": "DB"
}
```

## Root Cause
Employee ID 1 in the database is missing fields (email, phone, created_at, working_hours, avatar).

## Fix Options

### Option 1: Run SQL Script (Recommended)
1. Open phpMyAdmin
2. Select your WordPress database
3. Run the SQL from `fix_employee_1.sql`

### Option 2: Delete and Recreate
1. Delete Employee ID 1 from database
2. Deactivate and reactivate the plugin
3. Plugin will recreate default employees

### Option 3: Manual Update via WordPress Admin
1. Go to WordPress Admin → AppointEase → Staff
2. Edit Employee ID 1
3. Add missing fields:
   - Email: sarah@appointease.com
   - Phone: 555-0123
   - Working Hours: Mon-Fri 09:00-17:00

## Verification
After fix, Employee ID 1 should show complete data in debug panel like Employee ID 3.
