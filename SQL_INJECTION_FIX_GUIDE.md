# SQL Injection Fix Guide - AppointEase Plugin

## 🚨 Critical Security Issue
SQL injection vulnerabilities were found in multiple files. This guide provides step-by-step instructions to fix them.

## ✅ Quick Fix Checklist

### Priority 1: Public-Facing Files (Fix Immediately)
- [ ] `includes/class-api-endpoints.php` - REST API endpoints
- [ ] `includes/class-heartbeat-handler.php` - Real-time updates
- [ ] `includes/class-atomic-booking.php` - Booking operations

### Priority 2: Admin Files (Fix Soon)
- [ ] `admin/appointease-admin.php` - Admin panel
- [ ] `includes/class-booking-plugin.php` - Core plugin

### Priority 3: Setup/Utility Files (Fix When Possible)
- [ ] `includes/class-activator.php` - Plugin activation
- [ ] `includes/class-db-seeder.php` - Database seeding
- [ ] `includes/class-db-reset.php` - Database reset
- [ ] `includes/session-manager.php` - Session management
- [ ] `includes/debug-data-endpoint.php` - Debug endpoints

## 📋 Fix Patterns

### Pattern 1: Simple SELECT Query
```php
// ❌ VULNERABLE
$result = $wpdb->get_row("SELECT * FROM {$wpdb->prefix}appointments WHERE id = $id");

// ✅ SECURE
$result = $wpdb->get_row($wpdb->prepare(
    "SELECT * FROM {$wpdb->prefix}appointments WHERE id = %d",
    $id
));
```

### Pattern 2: Multiple WHERE Conditions
```php
// ❌ VULNERABLE
$results = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}appointments WHERE email = '$email' AND status = '$status'");

// ✅ SECURE
$results = $wpdb->get_results($wpdb->prepare(
    "SELECT * FROM {$wpdb->prefix}appointments WHERE email = %s AND status = %s",
    $email,
    $status
));
```

### Pattern 3: INSERT Using $wpdb->insert()
```php
// ❌ VULNERABLE
$wpdb->query("INSERT INTO {$wpdb->prefix}appointments (name, email, phone) VALUES ('$name', '$email', '$phone')");

// ✅ SECURE (Recommended)
$wpdb->insert(
    $wpdb->prefix . 'appointments',
    array(
        'name' => $name,
        'email' => $email,
        'phone' => $phone
    ),
    array('%s', '%s', '%s')
);
```

### Pattern 4: UPDATE Using $wpdb->update()
```php
// ❌ VULNERABLE
$wpdb->query("UPDATE {$wpdb->prefix}appointments SET status = '$status' WHERE id = $id");

// ✅ SECURE (Recommended)
$wpdb->update(
    $wpdb->prefix . 'appointments',
    array('status' => $status),
    array('id' => $id),
    array('%s'),
    array('%d')
);
```

### Pattern 5: DELETE Using $wpdb->delete()
```php
// ❌ VULNERABLE
$wpdb->query("DELETE FROM {$wpdb->prefix}appointments WHERE id = $id");

// ✅ SECURE (Recommended)
$wpdb->delete(
    $wpdb->prefix . 'appointments',
    array('id' => $id),
    array('%d')
);
```

### Pattern 6: IN Clause with Array
```php
// ❌ VULNERABLE
$ids_string = implode(',', $appointment_ids);
$results = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}appointments WHERE id IN ($ids_string)");

// ✅ SECURE
$placeholders = implode(',', array_fill(0, count($appointment_ids), '%d'));
$results = $wpdb->get_results($wpdb->prepare(
    "SELECT * FROM {$wpdb->prefix}appointments WHERE id IN ($placeholders)",
    ...$appointment_ids
));
```

### Pattern 7: LIKE Search
```php
// ❌ VULNERABLE
$results = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}appointments WHERE name LIKE '%$search%'");

// ✅ SECURE
$like = '%' . $wpdb->esc_like($search) . '%';
$results = $wpdb->get_results($wpdb->prepare(
    "SELECT * FROM {$wpdb->prefix}appointments WHERE name LIKE %s",
    $like
));
```

### Pattern 8: Complex Query with JOIN
```php
// ❌ VULNERABLE
$results = $wpdb->get_results("
    SELECT a.*, s.name as service_name 
    FROM {$wpdb->prefix}appointments a
    LEFT JOIN {$wpdb->prefix}appointease_services s ON a.service_id = s.id
    WHERE a.email = '$email' AND a.status = '$status'
");

// ✅ SECURE
$results = $wpdb->get_results($wpdb->prepare("
    SELECT a.*, s.name as service_name 
    FROM {$wpdb->prefix}appointments a
    LEFT JOIN {$wpdb->prefix}appointease_services s ON a.service_id = s.id
    WHERE a.email = %s AND a.status = %s
", $email, $status));
```

## 🔧 Placeholder Reference

| Type | Placeholder | Example |
|------|-------------|---------|
| Integer | `%d` | `$wpdb->prepare("WHERE id = %d", 123)` |
| Float | `%f` | `$wpdb->prepare("WHERE price = %f", 99.99)` |
| String | `%s` | `$wpdb->prepare("WHERE name = %s", "John")` |

## 🛡️ Input Sanitization

Always sanitize input BEFORE using in queries:

```php
// Sanitize functions
$id = intval($_POST['id']);                          // Integer
$email = sanitize_email($_POST['email']);            // Email
$text = sanitize_text_field($_POST['text']);         // Text
$textarea = sanitize_textarea_field($_POST['text']); // Textarea
$key = sanitize_key($_POST['key']);                  // Alphanumeric + dashes/underscores
```

## 📝 File-Specific Fixes

### class-api-endpoints.php
**Lines to fix**: 247, 263, 290, 342, 355, 378, 629, 633, 642, 662, 706, 711, 820, 857, 1013, 1115, 1198, 1203, 1301, 1519, 1572

**Common issues**:
- Direct variable interpolation in SELECT queries
- Unparameterized WHERE clauses
- String concatenation in SQL

**Fix approach**:
1. Find all `$wpdb->get_*` and `$wpdb->query` calls
2. Check if they use `$wpdb->prepare()`
3. If not, wrap with `$wpdb->prepare()` and add placeholders
4. Replace variables with `%d`, `%s`, or `%f`

### appointease-admin.php
**Lines to fix**: 324, 325, 716, 776, 918, 1020, 1338-1348, 1580, 1581, 1659, 1754, 1816, 2014, 2068, 2128-2132, 2140, 2221, 2249

**Common issues**:
- Admin AJAX handlers with direct queries
- Bulk operations without parameterization
- Search functionality with LIKE clauses

**Fix approach**:
1. Add `check_ajax_referer()` to all AJAX handlers
2. Sanitize all `$_POST` and `$_GET` inputs
3. Use `$wpdb->prepare()` for all queries
4. Use `$wpdb->insert()`, `$wpdb->update()`, `$wpdb->delete()` where possible

## 🧪 Testing After Fixes

### Test Checklist
1. **Booking Flow**
   - [ ] Create new appointment
   - [ ] View appointments
   - [ ] Cancel appointment
   - [ ] Reschedule appointment

2. **Admin Operations**
   - [ ] Add/edit services
   - [ ] Add/edit staff
   - [ ] View appointments list
   - [ ] Search appointments
   - [ ] Bulk operations

3. **API Endpoints**
   - [ ] GET /appointease/v1/services
   - [ ] GET /appointease/v1/staff
   - [ ] POST /appointease/v1/appointments
   - [ ] GET /appointease/v1/availability

4. **Edge Cases**
   - [ ] Special characters in names (O'Brien, José)
   - [ ] SQL keywords in input (SELECT, DROP, etc.)
   - [ ] Very long strings
   - [ ] Empty values
   - [ ] NULL values

## 🚀 Automated Fix Script

Run the fix helper script to see examples:
```
http://your-site.com/wp-content/plugins/wordpressBookingPlugin/fix-sql-injection.php?show_sql_fixes=1
```

**Note**: Only works when `WP_DEBUG` is enabled.

## 📚 Additional Resources

- [WordPress $wpdb Documentation](https://developer.wordpress.org/reference/classes/wpdb/)
- [WordPress Data Validation](https://developer.wordpress.org/apis/security/data-validation/)
- [WordPress Sanitizing Data](https://developer.wordpress.org/apis/security/sanitizing-securing-output/)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

## ⚠️ Important Notes

1. **Never trust user input** - Always sanitize and validate
2. **Use prepared statements** - Always use `$wpdb->prepare()`
3. **Prefer WordPress methods** - Use `$wpdb->insert()`, `$wpdb->update()`, `$wpdb->delete()`
4. **Test thoroughly** - Test all functionality after fixes
5. **Review regularly** - Audit code for new vulnerabilities

## 🔒 Security Best Practices

1. **Input Validation**: Validate data type, format, and range
2. **Output Escaping**: Use `esc_html()`, `esc_attr()`, `esc_url()`
3. **Nonce Verification**: Use `wp_verify_nonce()` for forms
4. **Capability Checks**: Use `current_user_can()` for permissions
5. **HTTPS Only**: Force SSL for sensitive operations

## 📞 Support

If you need help implementing these fixes:
1. Review the examples in this guide
2. Check the WordPress Codex
3. Test in a development environment first
4. Use the automated scanner to verify fixes

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: 🔴 Critical - Fix Immediately
