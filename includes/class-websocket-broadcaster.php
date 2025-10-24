<?php

/**
 * WebSocket Broadcaster - Real-time Conflict Detection
 * Industry standard real-time notifications for booking conflicts
 */
class WebSocket_Broadcaster {
    
    private static $instance = null;
    private $connections = [];
    private $slot_watchers = [];
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Initialize WebSocket server if available
        $this->init_websocket_server();
    }
    
    /**
     * Initialize WebSocket server for real-time updates
     */
    private function init_websocket_server() {
        // Check if ReactPHP is available
        $vendor_path = plugin_dir_path(dirname(__FILE__)) . 'vendor/autoload.php';
        if (!file_exists($vendor_path)) {
            error_log('[WebSocketBroadcaster] ReactPHP not found. Using polling fallback.');
            return;
        }
        
        // WebSocket server would be initialized here in production
        // For now, we use transients for polling-based real-time updates
    }
    
    /**
     * Broadcast slot conflict to all watching clients
     */
    public function broadcast_slot_conflict($conflict_data) {
        // Store conflict in transient for polling clients
        $this->store_realtime_update([
            'type' => 'slot_conflict',
            'data' => $conflict_data,
            'timestamp' => time()
        ]);
        
        // If WebSocket is available, broadcast immediately
        if ($this->is_websocket_available()) {
            $this->websocket_broadcast('slot_conflict', $conflict_data);
        }
        
        error_log('[WebSocketBroadcaster] Slot conflict broadcasted: ' . json_encode($conflict_data));
    }
    
    /**
     * Broadcast appointment update
     */
    public function broadcast_appointment_update($event_type, $appointment_data) {
        $update_data = [
            'type' => $event_type,
            'data' => $appointment_data,
            'timestamp' => time()
        ];
        
        $this->store_realtime_update($update_data);
        
        if ($this->is_websocket_available()) {
            $this->websocket_broadcast($event_type, $appointment_data);
        }
        
        error_log('[WebSocketBroadcaster] Appointment update broadcasted: ' . $event_type);
    }
    
    /**
     * Store update in transient for polling clients
     */
    private function store_realtime_update($update_data) {
        $updates = get_transient('appointease_realtime_updates') ?: [];
        
        // Add new update
        $updates[] = $update_data;
        
        // Keep only last 50 updates and expire after 5 minutes
        $updates = array_slice($updates, -50);
        set_transient('appointease_realtime_updates', $updates, 300);
        
        // Also store in user-specific transient if email is available
        if (isset($update_data['data']['email'])) {
            $user_key = 'appointease_user_updates_' . md5($update_data['data']['email']);
            $user_updates = get_transient($user_key) ?: [];
            $user_updates[] = $update_data;
            $user_updates = array_slice($user_updates, -10);
            set_transient($user_key, $user_updates, 300);
        }
    }
    
    /**
     * Check if WebSocket server is available
     */
    private function is_websocket_available() {
        // Check if WebSocket server is running on port 8080
        $connection = @fsockopen('localhost', 8080, $errno, $errstr, 1);
        if ($connection) {
            fclose($connection);
            return true;
        }
        return false;
    }
    
    /**
     * Send WebSocket broadcast (placeholder for actual implementation)
     */
    private function websocket_broadcast($event_type, $data) {
        // In a real implementation, this would send to WebSocket server
        // For now, we log the broadcast attempt
        error_log('[WebSocketBroadcaster] WebSocket broadcast: ' . $event_type . ' - ' . json_encode($data));
        
        // Could use wp_remote_post to send to WebSocket server endpoint
        $websocket_endpoint = 'http://localhost:8080/broadcast';
        wp_remote_post($websocket_endpoint, [
            'headers' => ['Content-Type' => 'application/json'],
            'body' => json_encode([
                'event' => $event_type,
                'data' => $data,
                'timestamp' => time()
            ]),
            'timeout' => 2 // Quick timeout for non-blocking
        ]);
    }
    
    /**
     * Register slot watcher for conflict detection
     */
    public function register_slot_watcher($date, $time, $employee_id, $client_id) {
        $slot_key = "{$date}_{$time}_{$employee_id}";
        
        if (!isset($this->slot_watchers[$slot_key])) {
            $this->slot_watchers[$slot_key] = [];
        }
        
        $this->slot_watchers[$slot_key][] = $client_id;
        
        // Store in transient for persistence
        set_transient('appointease_slot_watchers', $this->slot_watchers, 300);
        
        error_log("[WebSocketBroadcaster] Slot watcher registered: {$slot_key} by {$client_id}");
    }
    
    /**
     * Notify slot watchers of booking conflict
     */
    public function notify_slot_watchers($date, $time, $employee_id, $booking_data) {
        $slot_key = "{$date}_{$time}_{$employee_id}";
        
        // Get watchers from transient
        $watchers = get_transient('appointease_slot_watchers') ?: [];
        
        if (isset($watchers[$slot_key])) {
            $conflict_data = [
                'type' => 'slot_taken',
                'slot' => $slot_key,
                'date' => $date,
                'time' => $time,
                'employee_id' => $employee_id,
                'booking_data' => $booking_data,
                'timestamp' => time()
            ];
            
            foreach ($watchers[$slot_key] as $client_id) {
                // Store client-specific notification
                $client_key = 'appointease_client_notifications_' . $client_id;
                $notifications = get_transient($client_key) ?: [];
                $notifications[] = $conflict_data;
                set_transient($client_key, array_slice($notifications, -5), 60);
            }
            
            // Broadcast to all watchers
            $this->broadcast_slot_conflict($conflict_data);
            
            // Clean up watchers for this slot
            unset($watchers[$slot_key]);
            set_transient('appointease_slot_watchers', $watchers, 300);
        }
    }
    
    /**
     * Get real-time updates for polling clients
     */
    public function get_realtime_updates($last_timestamp = 0, $client_id = null) {
        $updates = get_transient('appointease_realtime_updates') ?: [];
        
        // Filter updates newer than last timestamp
        $new_updates = array_filter($updates, function($update) use ($last_timestamp) {
            return $update['timestamp'] > $last_timestamp;
        });
        
        // Get client-specific notifications if client_id provided
        if ($client_id) {
            $client_key = 'appointease_client_notifications_' . $client_id;
            $client_notifications = get_transient($client_key) ?: [];
            
            if (!empty($client_notifications)) {
                $new_updates = array_merge($new_updates, $client_notifications);
                // Clear client notifications after retrieval
                delete_transient($client_key);
            }
        }
        
        return array_values($new_updates);
    }
    
    /**
     * Clean up expired watchers and updates
     */
    public function cleanup_expired_data() {
        // This would be called by a cron job
        $watchers = get_transient('appointease_slot_watchers') ?: [];
        
        // Remove watchers for past time slots
        $current_time = time();
        foreach ($watchers as $slot_key => $clients) {
            list($date, $time, $employee_id) = explode('_', $slot_key);
            $slot_timestamp = strtotime($date . ' ' . $time);
            
            if ($slot_timestamp < $current_time) {
                unset($watchers[$slot_key]);
            }
        }
        
        set_transient('appointease_slot_watchers', $watchers, 300);
        
        error_log('[WebSocketBroadcaster] Cleanup completed. Active watchers: ' . count($watchers));
    }
    
    /**
     * Get connection statistics
     */
    public function get_stats() {
        $watchers = get_transient('appointease_slot_watchers') ?: [];
        $updates = get_transient('appointease_realtime_updates') ?: [];
        
        return [
            'active_watchers' => count($watchers),
            'total_slots_watched' => array_sum(array_map('count', $watchers)),
            'recent_updates' => count($updates),
            'websocket_available' => $this->is_websocket_available(),
            'last_cleanup' => get_transient('appointease_last_cleanup') ?: 'Never'
        ];
    }
}