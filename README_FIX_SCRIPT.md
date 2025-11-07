# SQL Injection Auto-Fix Script

## 🚀 Quick Start

### Run the Script:
```bash
cd C:\xampp\htdocs\wordpress\blog.promoplus.com\wp-content\plugins\wordpressBookingPlugin
python fix_sql_injection.py
```

## ✅ What It Does

The script automatically fixes these SQL injection patterns:

### 1. Simple SELECT Queries
```php
# BEFORE
$wpdb->get_row("SELECT * FROM {$wpdb->prefix}appointments WHERE id = $id");

# AFTER
$wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}appointments WHERE id = %d", $id));
```

### 2. INSERT Queries
```php
# BEFORE
$wpdb->query("INSERT INTO {$wpdb->prefix}appointments (name, email) VALUES ('$name', '$email')");

# AFTER
$wpdb->insert($wpdb->prefix . 'appointments', array('name' => $name, 'email' => $email), array('%s', '%s'));
```

### 3. UPDATE Queries
```php
# BEFORE
$wpdb->query("UPDATE {$wpdb->prefix}appointments SET status = '$status' WHERE id = $id");

# AFTER
$wpdb->update($wpdb->prefix . 'appointments', array('status' => $status), array('id' => $id), array('%s'), array('%d'));
```

### 4. DELETE Queries
```php
# BEFORE
$wpdb->query("DELETE FROM {$wpdb->prefix}appointments WHERE id = $id");

# AFTER
$wpdb->delete($wpdb->prefix . 'appointments', array('id' => $id), array('%d'));
```

## 📋 Files Processed

- `includes/class-api-endpoints.php`
- `admin/appointease-admin.php`
- `includes/class-activator.php`
- `includes/class-db-seeder.php`
- `includes/class-db-reset.php`
- `includes/class-atomic-booking.php`
- `includes/class-booking-plugin.php`
- `includes/session-manager.php`
- `includes/debug-data-endpoint.php`
- `includes/class-heartbeat-handler.php`

## 🔒 Safety Features

1. **Automatic Backups**: Creates timestamped backups before any changes
2. **Confirmation Required**: Asks for confirmation before running
3. **Detailed Logging**: Shows exactly what was changed
4. **Rollback Ready**: All originals saved in `backups/` folder

## 📊 Output Example

```
==============================================================
SQL Injection Auto-Fixer
==============================================================
Plugin directory: C:\xampp\htdocs\wordpress\...
Backup directory: C:\xampp\htdocs\wordpress\.../backups/20240115_143022

Processing files...

Processing: includes/class-api-endpoints.php
✓ Backed up: includes/class-api-endpoints.php
  ✓ Fixed and backed up

Processing: admin/appointease-admin.php
✓ Backed up: admin/appointease-admin.php
  ✓ Fixed and backed up

==============================================================
SUMMARY
==============================================================
Total fixes applied: 47
Files modified: 8
Backups saved to: .../backups/20240115_143022

Modified files:
  - includes/class-api-endpoints.php
  - admin/appointease-admin.php
  - includes/class-activator.php
  ...

⚠️  IMPORTANT: Test thoroughly before deploying!
```

## 🔄 Rollback Instructions

If something breaks, restore from backup:

```bash
# Windows
xcopy /E /Y backups\20240115_143022\* .

# Or manually copy files from backups folder
```

## ⚠️ Important Notes

1. **Test First**: Run on development/staging environment first
2. **Review Changes**: Check the modified files before deploying
3. **Keep Backups**: Don't delete the backups folder
4. **Manual Review**: Some complex queries may need manual fixes
5. **Test Functionality**: Test all booking flows after running

## 🧪 Testing Checklist

After running the script, test:

- [ ] Create new appointment
- [ ] View appointments list
- [ ] Cancel appointment
- [ ] Reschedule appointment
- [ ] Admin operations (add/edit services, staff)
- [ ] Search functionality
- [ ] Bulk operations
- [ ] API endpoints

## 🐛 Troubleshooting

### Script won't run
```bash
# Install Python 3 if needed
python --version

# Should show Python 3.x
```

### Permission errors
```bash
# Run as administrator (Windows)
# Right-click Command Prompt → Run as administrator
```

### Syntax errors after fix
- Restore from backup
- Review the specific file manually
- Some complex queries may need manual fixing

## 📞 Support

If you encounter issues:
1. Check the backup folder for originals
2. Review the modified files
3. Test in development first
4. Manually fix complex patterns if needed

## 🎯 Success Criteria

After running successfully:
- ✅ All files backed up
- ✅ SQL queries use `$wpdb->prepare()`
- ✅ No direct variable interpolation
- ✅ All functionality still works
- ✅ Security scan shows no issues
