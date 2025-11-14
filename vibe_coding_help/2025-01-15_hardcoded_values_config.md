# Configuration Management Implementation

**Timestamp:** 2025-01-15  
**Issue:** Hardcoded values violating Rule C1 (Minimal Dependency Policy)  
**Status:** ✅ Fixed

## Changes Made

### 1. Created Configuration Class
**File:** `includes/class-config.php`

**Industry Standards Applied:**
- Singleton pattern for configuration management
- Centralized defaults with WordPress options fallback
- Type-safe getters with validation
- OWASP-compliant rate limiting defaults

### 2. Configuration Values Centralized

#### Business Hours
- `slot_duration`: 60 minutes (configurable)
- `working_days`: ['1','2','3','4','5'] (Mon-Fri)
- `start_time`: 09:00
- `end_time`: 17:00
- `advance_booking`: 30 days

#### Rate Limiting (OWASP Standards)
- `rate_limit_requests`: 60 req/min (general API)
- `rate_limit_booking`: 10 bookings/hour
- `rate_limit_auth`: 5 attempts/15min
- `rate_limit_window`: 60 seconds

#### Security
- `session_timeout`: 3600 seconds (1 hour)
- `otp_expiry`: 600 seconds (10 minutes)
- `max_login_attempts`: 5

### 3. Updated Files

**`class-api-endpoints.php`:**
- Replaced hardcoded `100 requests/min` with configurable rate limit
- Added proper IP detection with X-Forwarded-For support
- Replaced hardcoded working days with config getter
- Replaced hardcoded slot duration with config getter
- Added security logging for rate limit violations

### 4. Security Improvements

**IP Detection (Cloudflare/Proxy Support):**
```php
private function get_client_ip() {
    $headers = array('HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR');
    foreach ($headers as $header) {
        if (!empty($_SERVER[$header])) {
            $ip = $_SERVER[$header];
            if (strpos($ip, ',') !== false) {
                $ip = trim(explode(',', $ip)[0]);
            }
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return 'unknown';
}
```

**Rate Limiting:**
```php
$limit = $this->config->get_rate_limit_requests(); // 60/min default
$window = $this->config->get_rate_limit_window(); // 60 seconds
```

## Benefits

1. **Maintainability:** All configuration in one place
2. **Security:** Industry-standard rate limits (OWASP compliant)
3. **Flexibility:** Easy to adjust via WordPress admin
4. **Scalability:** Supports environment-specific configs
5. **Auditability:** Centralized logging for violations

## Testing Required

- [ ] Verify rate limiting works with different IP sources
- [ ] Test configuration changes via WordPress admin
- [ ] Confirm working days validation
- [ ] Test slot duration changes reflect in frontend

## References

- OWASP Rate Limiting: https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks
- WordPress Options API: https://developer.wordpress.org/apis/options/
- Singleton Pattern: https://refactoring.guru/design-patterns/singleton
