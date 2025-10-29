<?php

if (!defined('ABSPATH')) {
    exit;
}

class Appointease_Redis_PubSub {
    private static $instance = null;
    private $redis = null;
    private $enabled = false;
    private $config = [];

    private function __construct() {
        $this->load_config();
        $this->init_redis();
    }

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function load_config() {
        $this->config = [
            'host' => get_option('appointease_redis_host', '127.0.0.1'),
            'port' => get_option('appointease_redis_port', 6379),
            'timeout' => get_option('appointease_redis_timeout', 2.5),
            'password' => get_option('appointease_redis_password', ''),
            'database' => get_option('appointease_redis_database', 0)
        ];
    }

    private function init_redis() {
        if (!class_exists('Redis')) {
            error_log('[Redis PubSub] Redis extension not available');
            return;
        }

        try {
            $this->redis = new Redis();
            
            // Connect with timeout
            $connected = $this->redis->connect(
                $this->config['host'], 
                $this->config['port'], 
                $this->config['timeout']
            );
            
            if (!$connected) {
                throw new Exception('Connection failed');
            }

            // Authenticate if password provided
            if (!empty($this->config['password'])) {
                $this->redis->auth($this->config['password']);
            }

            // Select database
            if ($this->config['database'] > 0) {
                $this->redis->select($this->config['database']);
            }

            // Proper ping validation
            $ping_result = $this->redis->ping();
            $this->enabled = ($ping_result === '+PONG' || $ping_result === 'PONG');
            
            if (!$this->enabled) {
                throw new Exception('Ping validation failed');
            }
            
        } catch (Exception $e) {
            error_log('[Redis PubSub] Connection failed: ' . $e->getMessage());
            $this->enabled = false;
            $this->redis = null;
        }
    }

    public function is_enabled() {
        return $this->enabled && $this->redis !== null;
    }

    /**
     * Publish with structured channel naming
     * Channel format: appointease:slots:{date}:{employee_id}
     */
    public function publish($channel, $message) {
        if (!$this->is_enabled()) {
            return false;
        }
        
        try {
            // Add timestamp and event metadata
            $enriched_message = array_merge($message, [
                'timestamp' => time(),
                'server_time' => current_time('mysql')
            ]);
            
            $json_message = json_encode($enriched_message, JSON_THROW_ON_ERROR);
            
            if ($json_message === false) {
                throw new Exception('JSON encoding failed');
            }
            
            $subscribers = $this->redis->publish($channel, $json_message);
            
            // Log if no subscribers (debugging)
            if ($subscribers === 0) {
                error_log("[Redis PubSub] No subscribers for channel: {$channel}");
            }
            
            return $subscribers !== false;
            
        } catch (Exception $e) {
            error_log('[Redis PubSub] Publish failed: ' . $e->getMessage());
            $this->handle_connection_error();
            return false;
        }
    }
    
    /**
     * Publish to scoped channel (date-specific)
     */
    public function publish_slot_event($action, $date, $employee_id, $time, $data = []) {
        $channel = "appointease:slots:{$date}:{$employee_id}";
        $message = array_merge([
            'action' => $action,
            'date' => $date,
            'employee_id' => $employee_id,
            'time' => $time
        ], $data);
        
        return $this->publish($channel, $message);
    }

    public function get_messages($channel, $timeout = 1) {
        if (!$this->is_enabled()) {
            return [];
        }
        
        try {
            // Non-blocking message retrieval using psubscribe with timeout
            $this->redis->setOption(Redis::OPT_READ_TIMEOUT, $timeout);
            
            $messages = [];
            $this->redis->psubscribe([$channel], function($redis, $pattern, $channel, $message) use (&$messages) {
                $messages[] = [
                    'channel' => $channel,
                    'message' => json_decode($message, true)
                ];
            });
            
            return $messages;
            
        } catch (Exception $e) {
            error_log('[Redis PubSub] Get messages failed: ' . $e->getMessage());
            return [];
        }
    }

    private function handle_connection_error() {
        $this->enabled = false;
        if ($this->redis) {
            try {
                $this->redis->close();
            } catch (Exception $e) {
                // Ignore close errors
            }
            $this->redis = null;
        }
    }

    public function reconnect() {
        $this->handle_connection_error();
        $this->init_redis();
        return $this->is_enabled();
    }

    /**
     * Get channel stats
     */
    public function get_channel_stats() {
        if (!$this->is_enabled()) {
            return null;
        }
        
        try {
            $info = $this->redis->info('stats');
            return [
                'pubsub_channels' => $this->redis->pubsub('CHANNELS', 'appointease:*'),
                'pubsub_patterns' => $this->redis->pubsub('NUMPAT')
            ];
        } catch (Exception $e) {
            return null;
        }
    }
    
    public function __destruct() {
        if ($this->redis) {
            try {
                $this->redis->close();
            } catch (Exception $e) {
                // Ignore close errors during destruction
            }
        }
    }
}
