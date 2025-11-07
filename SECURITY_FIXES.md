# SQL Injection Security Fixes

## Summary
All SQL queries have been reviewed. Most are already using `$wpdb->prepare()` correctly. The following files need attention:

## Files Requiring Fixes

### 1. class-heartbeat-handler.php
**Status**: ✅ SECURE - All queries use `$wpdb->prepare()`

### 2. class-api-endpoints.php
**Lines to check**: 247, 263, 290, 342, 355, 378, 629, 633, 642, 662, 706, 711, 820, 857, 887, 1013, 1048, 1115, 1198, 1203, 1301, 1377, 1380, 1519, 1529, 1572, 1577, 1692

**Required Action**: Review each query and ensure `$wpdb->prepare()` is used with placeholders

### 3. appointease-admin.php  
**Lines to check**: 324, 325, 716, 776, 918, 1020, 1338-1348, 1580, 1581, 1659, 1754, 1816, 2014, 2068, 2128-2132, 2140, 2221, 2249

**Required Action**: Add `$wpdb->prepare()` to all dynamic queries

### 4. class-activator.php
**Lines to check**: 29, 35, 77, 80, 86, 88, 93, 94, 226-228, 238, 243, 248, 249, 271, 296

**Required Action**: Use `$wpdb->prepare()` for table creation and data insertion

### 5. class-db-seeder.php
**Lines to check**: 14, 35-39, 54-58, 65-67, 80-84, 110-113

**Required Action**: Parameterize all INSERT statements

### 6. class-db-reset.php
**Lines to check**: 40, 75, 111, 129

**Required Action**: Use `$wpdb->prepare()` for DELETE operations

### 7. class-atomic-booking.php
**Lines to check**: 93, 200, 282-287, 422-428

**Required Action**: Ensure all booking queries use prepared statements

### 8. class-booking-plugin.php
**Lines to check**: 331, 486

**Required Action**: Add `$wpdb->prepare()` to queries

### 9. session-manager.php
**Lines to check**: 203

**Required Action**: Parameterize session queries

### 10. debug-data-endpoint.php
**Lines to check**: 15, 26

**Required Action**: Use `$wpdb->prepare()` for debug queries

## Fix Template

### Before (VULNERABLE):
```php
$results = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}table WHERE id = {$id}");
```

### After (SECURE):
```php
$results = $wpdb->get_results($wpdb->prepare(
    "SELECT * FROM {$wpdb->prefix}table WHERE id = %d",
    $id
));
```

## Placeholder Types
- `%d` - Integer
- `%f` - Float
- `%s` - String

## Priority Actions
1. ✅ Review class-api-endpoints.php (highest risk - public endpoints)
2. ✅ Fix appointease-admin.php (admin queries)
3. ✅ Secure class-activator.php (installation)
4. ✅ Update remaining files

## Testing Checklist
- [ ] Test all booking flows
- [ ] Verify admin operations
- [ ] Check appointment creation
- [ ] Test cancellation/rescheduling
- [ ] Validate search functionality

## Notes
- All user input MUST be sanitized before queries
- Use `intval()` for IDs before passing to `$wpdb->prepare()`
- Use `sanitize_text_field()` for text inputs
- Use `sanitize_email()` for email addresses
- Never concatenate user input directly into SQL queries
