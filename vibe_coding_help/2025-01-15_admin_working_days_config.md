# Admin Working Days Configuration

**Timestamp:** 2025-01-15  
**Issue:** Working days configurable by admin  
**Status:** ✅ Implemented

## Changes Made

### Added Admin Settings Fields

**File:** `includes/class-settings.php`

#### 1. Working Days Field
- Checkbox selection for all 7 days
- Default: Monday-Friday (1,2,3,4,5)
- Visual layout with flex display
- Stores as array in WordPress options

#### 2. Slot Duration Field
- Dropdown: 15, 30, 45, 60, 90, 120 minutes
- Default: 60 minutes
- Affects time slot generation

#### 3. Advance Booking Field
- Number input: 1-365 days
- Default: 30 days
- Controls how far ahead customers can book

## Admin Interface

**Location:** WordPress Admin → AppointEase → Settings → General Settings

**Fields Added:**
```
Business Hours: [09:00] to [17:00]
Working Days: ☑ Monday ☑ Tuesday ☑ Wednesday ☑ Thursday ☑ Friday ☐ Saturday ☐ Sunday
Slot Duration: [60 minutes ▼]
Advance Booking: [30] days
```

## Configuration Flow

1. Admin sets working days via checkboxes
2. Saved to `appointease_options['working_days']` as array
3. Retrieved via `AppointEase_Config::get_working_days()`
4. Used in availability checks and calendar display

## Affected Files

- `includes/class-settings.php` - Admin UI
- `includes/class-config.php` - Configuration getter
- `includes/class-api-endpoints.php` - Uses config values

## Testing

- [x] Working days save correctly
- [x] Slot duration updates time slots
- [x] Advance booking limits calendar
- [x] Default values load on first install
