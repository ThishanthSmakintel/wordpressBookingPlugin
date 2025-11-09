# CRITICAL SECURITY PATCHES REQUIRED

**⚠️ DO NOT USE IN PRODUCTION UNTIL THESE PATCHES ARE APPLIED ⚠️**

## Immediate Security Fixes Required

### 1. SQL Injection Fixes (CRITICAL)

**File:** `includes/class-api-endpoints.php`

**Lines 18, 32, 95 - Replace with:**
```php
// Line 18 - get_services() method
public function get_services() {
    try {
        global $wpdb;
        $table = $wpdb->prefix . 'appointease_services';
        $services = $wpdb->get_results($wpdb->prepare("SELECT * FROM `{$table}` ORDER BY name"));
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
        }
        
        return rest_ensure_response($services);
    } catch (Exception $e) {
        return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
    }
}

// Line 32 - get_staff() method  
public function get_staff() {
    try {
        global $wpdb;
        $table = $wpdb->prefix . 'appointease_staff';
        $staff = $wpdb->get_results($wpdb->prepare("SELECT * FROM `{$table}` ORDER BY name"));
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
        }
        
        $response = rest_ensure_response($staff);
        $response->header('Cache-Control', 'no-cache, no-store, must-revalidate');
        $response->header('Pragma', 'no-cache');
        return $response;
    } catch (Exception $e) {
        return new WP_Error('exception', 'Error: ' . $e->getMessage(), array('status' => 500));
    }
}
```

### 2. XSS Protection Fixes (CRITICAL)

**File:** `admin/appointease-admin.php`

**Replace all unescaped output with:**
```php
// Before (VULNERABLE):
echo $appointment->name;
echo $service->description;
echo $staff->email;

// After (SECURE):
echo esc_html($appointment->name);
echo esc_html($service->description);
echo esc_html($staff->email);

// For HTML attributes:
echo esc_attr($appointment->status);

// For URLs:
echo esc_url($appointment->link);
```

### 3. CSRF Protection (CRITICAL)

**File:** `includes/class-api-endpoints.php`

**Add to all public endpoints:**
```php
public function verify_nonce_permission($request) {
    $nonce = $request->get_header('X-WP-Nonce');
    if (!$nonce) {
        $nonce = $request->get_param('_wpnonce');
    }
    return wp_verify_nonce($nonce, 'wp_rest');
}

// Update permission callbacks:
'permission_callback' => array($this, 'verify_nonce_permission')
```

### 4. Input Validation (HIGH PRIORITY)

**File:** `admin/appointease-admin.php`

**Add validation to all AJAX handlers:**
```php
public function save_service() {
    // Add nonce verification
    check_ajax_referer('appointease_nonce', '_wpnonce');
    
    // Add capability check
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Unauthorized access');
        return;
    }
    
    global $wpdb;
    
    // Validate and sanitize input
    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    $name = isset($_POST['name']) ? sanitize_text_field($_POST['name']) : '';
    $duration = isset($_POST['duration']) ? intval($_POST['duration']) : 0;
    $price = isset($_POST['price']) ? floatval($_POST['price']) : 0;
    $description = isset($_POST['description']) ? sanitize_textarea_field($_POST['description']) : '';
    
    // Validate required fields
    if (empty($name) || $duration <= 0 || $price < 0) {
        wp_send_json_error('Invalid input data');
        return;
    }
    
    // Continue with database operations...
}
```

### 5. File Include Security (MEDIUM PRIORITY)

**File:** `booking-plugin.php`

**Replace file inclusion function:**
```php
function booking_plugin_require_file($file) {
    // Whitelist allowed files
    $allowed_files = [
        'includes/class-security-helper.php',
        'includes/class-activator.php',
        'includes/class-deactivator.php',
        'includes/class-booking-plugin.php',
        'includes/class-settings.php',
        'includes/class-db-seeder.php',
        'includes/class-db-reset.php',
        'includes/class-db-reset-filters.php',
        'includes/class-redis-helper.php',
        'includes/class-api-endpoints.php',
        'includes/class-heartbeat-handler.php',
        'includes/session-manager.php',
        'blocks/register-block.php'
    ];
    
    // Validate file is in whitelist
    if (!in_array($file, $allowed_files)) {
        wp_die('Invalid file requested: ' . esc_html($file));
    }
    
    $full_path = BOOKING_PLUGIN_PATH . $file;
    
    // Additional security checks
    if (!file_exists($full_path) || !is_readable($full_path)) {
        wp_die('Required plugin file not found: ' . esc_html($file));
    }
    
    // Ensure file is within plugin directory
    $real_path = realpath($full_path);
    $plugin_path = realpath(BOOKING_PLUGIN_PATH);
    
    if (strpos($real_path, $plugin_path) !== 0) {
        wp_die('File access denied: ' . esc_html($file));
    }
    
    require_once $full_path;
}
```

### 6. Redis Security Improvements

**File:** `includes/class-redis-helper.php`

**Add error sanitization:**
```php
private function sanitize_error_message($message) {
    // Remove sensitive connection details
    $message = preg_replace('/host=[^\s]+/', 'host=***', $message);
    $message = preg_replace('/port=\d+/', 'port=***', $message);
    $message = preg_replace('/password=[^\s]+/', 'password=***', $message);
    return $message;
}

// Update error logging:
catch (Exception $e) {
    error_log('[Redis] Connection failed: ' . $this->sanitize_error_message($e->getMessage()));
    return false;
}
```

## Security Testing Checklist

After applying patches, verify:

- [ ] All database queries use wpdb->prepare()
- [ ] All user output is escaped (esc_html, esc_attr, esc_url)
- [ ] All forms include nonce verification
- [ ] All AJAX handlers check capabilities
- [ ] All user input is validated and sanitized
- [ ] File inclusion uses whitelist approach
- [ ] Error messages don't expose sensitive data
- [ ] Redis operations have proper limits
- [ ] All endpoints have appropriate permission callbacks

## Testing Commands

```bash
# Test SQL injection protection
curl -X POST "http://site.com/wp-json/booking/v1/services" \
  -H "Content-Type: application/json" \
  -d '{"malicious": "'; DROP TABLE wp_posts; --"}'

# Test XSS protection  
curl -X POST "http://site.com/wp-admin/admin-ajax.php" \
  -d "action=save_service&name=<script>alert('xss')</script>"

# Test CSRF protection
curl -X POST "http://site.com/wp-json/appointease/v1/appointments" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "email": "test@test.com"}'
```

## Deployment Steps

1. **Backup current installation**
2. **Apply security patches in development**
3. **Run security tests**
4. **Deploy to staging environment**
5. **Perform penetration testing**
6. **Deploy to production with monitoring**

## Emergency Contacts

If security incident occurs:
- **Disable plugin immediately**
- **Contact security team**
- **Review access logs**
- **Notify affected users**

---

**CRITICAL:** Do not ignore these security fixes. The vulnerabilities found can lead to complete site compromise.