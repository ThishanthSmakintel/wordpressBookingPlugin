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
        
        // Store token with expiry
        update_user_meta($user->ID, '_booking_session_token', $token);
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
        
        // Find user by token
        $user_query = new WP_User_Query([
            'meta_key' => '_booking_session_token',
            'meta_value' => sanitize_text_field($token),
            'number' => 1
        ]);
        
        $users = $user_query->get_results();
        if (empty($users)) {
            return false;
        }
        
        $user = $users[0];
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
            AND meta_value < %d
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
    $public_endpoints = ['/session', '/verify-otp', '/services', '/staff', '/appointments', '/user-appointments', '/availability', '/debug', '/fix-working-days', '/server-date', '/settings', '/business-hours', '/time-slots', '/check-slot', '/health'];
    
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