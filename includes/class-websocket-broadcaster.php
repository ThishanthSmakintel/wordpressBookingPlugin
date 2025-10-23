<?php
/**
 * WebSocket Broadcaster - Sends updates to WebSocket server
 */

class WebSocket_Broadcaster {
    private static $instance = null;
    private $ws_url = 'ws://localhost:8080';

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function broadcast_appointment_update($event, $data) {
        // Store in transient for polling fallback
        $this->store_update($event, $data);
        
        // Try WebSocket broadcast (non-blocking)
        $this->send_to_websocket($event, $data);
    }

    private function store_update($event, $data) {
        $updates = get_transient('appointease_realtime_updates') ?: [];
        $updates[] = [
            'event' => $event,
            'data' => $data,
            'timestamp' => time()
        ];
        
        // Keep last 50 updates
        $updates = array_slice($updates, -50);
        set_transient('appointease_realtime_updates', $updates, 300); // 5 minutes
    }

    private function send_to_websocket($event, $data) {
        // Non-blocking WebSocket send (requires socket extension)
        if (!function_exists('socket_create')) {
            return;
        }

        $message = json_encode(['type' => $event, 'data' => $data, 'timestamp' => time()]);
        
        // Send via HTTP to WebSocket server's broadcast endpoint
        wp_remote_post('http://localhost:8080/broadcast', [
            'body' => $message,
            'timeout' => 1,
            'blocking' => false
        ]);
    }
}
