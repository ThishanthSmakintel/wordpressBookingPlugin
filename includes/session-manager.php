<?php
/**
 * Secure Session Management for Booking Plugin
 */

class BookingSessionManager {
    
    private static $instance = null;
    private $token_expiry = 3600; // 1 hour
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Generate secure session token after OTP verification
     */
    public function createSession($email) {
        // Find or create user
        $user = get_user_by('email', sanitize_email($email));
        if (!$user) {
            $user_id = wp_create_user($email, wp_generate_password(), $email);
            if (is_wp_error($user_id)) {
                return false;
            }
            $user = get_user_by('id', $user_id);
        }
        
        // Generate secure token
        $token = bin2hex(random_bytes(32));
        $expiry = time() + $this->token_expiry;
        
        // Store hashed token with expiry
        update_user_meta($user->ID, '_booking_session_token', hash('sha256', $token));
        update_user_meta($user->ID, '_booking_session_expiry', $expiry);
        update_user_meta($user->ID, '_booking_last_activity', time());
        
        // Set secure HTTP-only cookie
        $this->setSecureCookie($token, $expiry);
        
        return [
            'token' => $token,
            'expires_in' => $this->token_expiry,
            'user_id' => $user->ID
        ];
    }
    
    /**
     * Validate session token
     */
    public function validateSession($token = null) {
        if (!$token) {
            $token = $this->getTokenFromRequest();
        }
        
        if (!$token) {
            return false;
        }
        
        // Cache check
        $cache_key = 'booking_session_' . md5($token);
        $cached_user_id = wp_cache_get($cache_key, 'booking_sessions');
        
        if ($cached_user_id !== false) {
            $user = get_user_by('id', $cached_user_id);
            if ($user) {
                $expiry = get_user_meta($user->ID, '_booking_session_expiry', true);
                if (time() <= $expiry) {
                    update_user_meta($user->ID, '_booking_last_activity', time());
                    return $user;
                }
            }
        }
        
        // Find user by hashed token
        $user_query = new WP_User_Query([
            'meta_key' => '_booking_session_token',
            'meta_value' => hash('sha256', sanitize_text_field($token)),
            'number' => 1,
            'fields' => 'ID'
        ]);
        
        $users = $user_query->get_results();
        if (empty($users)) {
            return false;
        }
        
        $user = get_user_by('id', $users[0]);
        wp_cache_set($cache_key, $user->ID, 'booking_sessions', 300);
        $expiry = get_user_meta($user->ID, '_booking_session_expiry', true);
        
        // Check if token expired
        if (time() > $expiry) {
            $this->clearSession($user->ID);
            return false;
        }
        
        // Update last activity
        update_user_meta($user->ID, '_booking_last_activity', time());
        
        return $user;
    }
    
    /**
     * Clear session
     */
    public function clearSession($user_id = null) {
        if (!$user_id) {
            $token = $this->getTokenFromRequest();
            if ($token) {
                $cache_key = 'booking_session_' . md5($token);
                wp_cache_delete($cache_key, 'booking_sessions');
                
                $user = $this->validateSession($token);
                if ($user) {
                    $user_id = $user->ID;
                }
            }
        }
        
        if ($user_id) {
            delete_user_meta($user_id, '_booking_session_token');
            delete_user_meta($user_id, '_booking_session_expiry');
            delete_user_meta($user_id, '_booking_last_activity');
        }
        
        // Clear cookie
        $this->clearSecureCookie();
        
        return true;
    }
    
    /**
     * Get token from request (cookie or header)
     */
    private function getTokenFromRequest() {
        // Check Authorization header first
        $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (strpos($auth_header, 'Bearer ') === 0) {
            return substr($auth_header, 7);
        }
        
        // Check cookie
        return $_COOKIE['booking_session'] ?? null;
    }
    
    /**
     * Set secure HTTP-only cookie
     */
    private function setSecureCookie($token, $expiry) {
        setcookie(
            'booking_session',
            $token,
            [
                'expires' => $expiry,
                'path' => '/',
                'domain' => '',
                'secure' => is_ssl(),
                'httponly' => true,
                'samesite' => 'Strict'
            ]
        );
    }
    
    /**
     * Clear secure cookie
     */
    private function clearSecureCookie() {
        setcookie(
            'booking_session',
            '',
            [
                'expires' => time() - 3600,
                'path' => '/',
                'domain' => '',
                'secure' => is_ssl(),
                'httponly' => true,
                'samesite' => 'Strict'
            ]
        );
    }
    
    /**
     * Clean expired sessions (run via cron)
     */
    public function cleanExpiredSessions() {
        global $wpdb;
        
        $expired_time = time();
        
        $expired_users = $wpdb->get_results($wpdb->prepare("
            SELECT user_id FROM {$wpdb->usermeta} 
            WHERE meta_key = '_booking_session_expiry' 
            AND CAST(meta_value AS UNSIGNED) < %d
            LIMIT 100
        ", $expired_time));
        
        foreach ($expired_users as $user) {
            $this->clearSession($user->user_id);
        }
    }
}

// Initialize session manager
add_action('init', function() {
    BookingSessionManager::getInstance();
});

// Add REST API middleware for token validation
add_filter('rest_pre_dispatch', function($response, $server, $request) {
    $route = $request->get_route();
    
    // Only check booking plugin routes
    if (strpos($route, '/appointease/v1/') !== 0) {
        return $response;
    }
    
    // Skip session endpoints and public endpoints
    $public_endpoints = ['/session', '/verify-otp', '/services', '/staff', '/appointments', '/user-appointments', '/availability', '/debug', '/fix-working-days', '/server-date', '/settings', '/business-hours', '/time-slots', '/check-slot', '/health', '/realtime/poll', '/realtime/select', '/realtime/deselect', '/slots/select', '/slots/deselect', '/test-heartbeat', '/generate-otp', '/unlock-slot', '/clear-locks', '/save-browser-logs', '/collect-logs'];
    
    foreach ($public_endpoints as $endpoint) {
        if (strpos($route, $endpoint) !== false) {
            return $response;
        }
    }
    
    $session_manager = BookingSessionManager::getInstance();
    $user = $session_manager->validateSession();
    
    if (!$user) {
        return new WP_Error('session_invalid', 'Invalid or expired session', ['status' => 401]);
    }
    
    // Set current user for this request
    wp_set_current_user($user->ID);
    
    return $response;
}, 10, 3);

// Schedule cleanup of expired sessions
add_action('wp', function() {
    if (!wp_next_scheduled('booking_cleanup_sessions')) {
        wp_schedule_event(time(), 'hourly', 'booking_cleanup_sessions');
    }
});

add_action('booking_cleanup_sessions', function() {
    BookingSessionManager::getInstance()->cleanExpiredSessions();
});

// WordPress Heartbeat API integration for real-time slot visibility
add_filter('heartbeat_received', function($response, $data) {
    if (isset($data['appointease_poll'])) {
        $date = sanitize_text_field($data['appointease_poll']['date']);
        $employee_id = intval($data['appointease_poll']['employee_id']);
        
        if ($date && $employee_id) {
            $key = "selection_{$date}_{$employee_id}";
            $selections = get_transient($key) ?: array();
            
            $now = time();
            $active_slots = array();
            
            foreach ($selections as $time => $sessions) {
                foreach ($sessions as $session_id => $timestamp) {
                    if ($now - $timestamp < 30) {
                        $active_slots[] = $time;
                        break;
                    }
                }
            }
            
            $response['appointease_active_selections'] = array_unique($active_slots);
        }
    }
    
    return $response;
}, 10, 2);

add_filter('heartbeat_settings', function($settings) {
    $settings['interval'] = 1; // Match frontend 1-second interval
    return $settings;
});

// Cache heartbeat responses to reduce DB queries
add_filter('heartbeat_received', function($response, $data, $screen_id) {
    if (!isset($data['appointease_poll'])) {
        return $response;
    }
    
    $poll_data = $data['appointease_poll'];
    $date = sanitize_text_field($poll_data['date'] ?? '');
    $employee_id = intval($poll_data['employee_id'] ?? 0);
    
    if (!$date || !$employee_id) {
        return $response;
    }
    
    // Cache key for this specific query
    $cache_key = "heartbeat_{$date}_{$employee_id}";
    $cached = wp_cache_get($cache_key, 'appointease_heartbeat');
    
    if ($cached !== false) {
        return array_merge($response, $cached);
    }
    
    // Cache response for 500ms to reduce DB load
    wp_cache_set($cache_key, $response, 'appointease_heartbeat', 0.5);
    
    return $response;
}, 11, 3);