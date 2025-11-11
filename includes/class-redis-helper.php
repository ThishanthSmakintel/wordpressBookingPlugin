<?php

if (!defined('ABSPATH')) {
    exit;
}

class Appointease_Redis_Helper {
    private static $instance = null;
    private $redis = null;
    private $enabled = false;

    private function __construct() {
        $this->enabled = $this->check_redis();
    }

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function check_redis() {
        if (function_exists('wp_cache_add_redis_hash_groups')) {
            return true; // Redis Object Cache plugin active
        }
        
        if (class_exists('Redis')) {
            try {
                $this->redis = new Redis();
                // Use pconnect for connection pooling (massive CPU/memory savings)
                $this->redis->pconnect('127.0.0.1', 6379, 2.5);
                
                if (!$this->redis->ping()) {
                    return false;
                }
                
                // Set health check key (5s TTL) - used by Heartbeat for fast availability checks
                $this->redis->setex('appointease:health:ping', 5, time());
                
                return true;
            } catch (Exception $e) {
                $sanitized_message = preg_replace('/host=[^\s]+/', 'host=***', $e->getMessage());
                $sanitized_message = preg_replace('/port=\d+/', 'port=***', $sanitized_message);
                $sanitized_message = preg_replace('/password=[^\s]+/', 'password=***', $sanitized_message);
                error_log('[Redis] Connection failed: ' . $sanitized_message);
                return false;
            }
        }
        
        return false;
    }
    
    /**
     * Fast health check using dedicated health key (avoids connection overhead)
     * Also writes to detect full write failures
     */
    public function health_check() {
        if (!$this->enabled || !$this->redis) return false;
        
        try {
            // Write health key to detect write failures
            $this->redis->setex('appointease:health:ping', 5, time());
            
            // Read health key to verify
            $health = $this->redis->get('appointease:health:ping');
            return $health !== false;
        } catch (Exception $e) {
            return false;
        }
    }

    public function is_enabled() {
        return $this->enabled;
    }
    
    public function get_connection() {
        return $this->redis;
    }

    /**
     * Atomic slot lock with client ownership
     * Lock stores client_id to prevent accidental unlocks from other users
     */
    public function lock_slot($key, $data, $ttl = 600) {
        if (!$this->enabled) return false;
        
        // Ensure lock has ownership info
        if (!isset($data['client_id'])) {
            error_log('[Redis] Lock requires client_id for ownership');
            return false;
        }
        
        $lock_data = array_merge($data, [
            'timestamp' => time(),
            'expires' => time() + $ttl
        ]);
        
        try {
            if ($this->redis) {
                return $this->redis->setex($key, $ttl, json_encode($lock_data));
            }
            return wp_cache_set($key, $lock_data, 'appointease_locks', $ttl);
        } catch (Exception $e) {
            error_log('[Redis] Lock failed: ' . $e->getMessage());
            return false;
        }
    }

    public function get_lock($key) {
        if (!$this->enabled) return null;
        
        try {
            if ($this->redis) {
                $data = $this->redis->get($key);
                return $data ? json_decode($data, true) : null;
            }
            return wp_cache_get($key, 'appointease_locks');
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Delete lock with ownership verification
     * Only allows deletion if client_id matches (prevents accidental unlocks)
     */
    public function delete_lock($key, $client_id = null) {
        if (!$this->enabled) return false;
        
        try {
            // Verify ownership before deletion
            if ($client_id && $this->redis) {
                $lock = $this->get_lock($key);
                if ($lock && isset($lock['client_id']) && $lock['client_id'] !== $client_id) {
                    error_log('[Redis] Lock deletion denied: ownership mismatch');
                    return false;
                }
            }
            
            if ($this->redis) {
                return $this->redis->del($key);
            }
            return wp_cache_delete($key, 'appointease_locks');
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Get all locks using SCAN (non-blocking)
     * Safer than KEYS for production
     */
    public function get_locks_by_pattern($pattern) {
        if (!$this->enabled || !$this->redis) return [];
        
        try {
            $locks = [];
            $iterator = null;
            $max_iterations = 1000;
            $current_iteration = 0;
            
            // Use SCAN instead of KEYS (non-blocking)
            while ($keys = $this->redis->scan($iterator, $pattern, 100) && $current_iteration < $max_iterations) {
                $current_iteration++;
                foreach ($keys as $key) {
                    $data = $this->redis->get($key);
                    if ($data) {
                        $lock = json_decode($data, true);
                        if ($lock) {
                            $lock['_ttl'] = $this->redis->ttl($key);
                            $locks[] = $lock;
                        }
                    }
                }
                if ($iterator === 0 || $current_iteration >= $max_iterations) break;
            }
            return $locks;
        } catch (Exception $e) {
            error_log('[Redis] SCAN failed: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Set active selection - uses Redis Hash for O(1) operations
     * HSET is 1000x faster than SCAN
     */
    public function set_active_selection($date, $employee_id, $time, $client_id) {
        if (!$this->enabled) return false;
        
        try {
            if ($this->redis) {
                $time = substr($time, 0, 5);
                $hash_key = "appointease_active_{$date}_{$employee_id}";
                
                // Get user's old selection from hash
                $all_selections = $this->redis->hGetAll($hash_key);
                $old_time = null;
                
                foreach ($all_selections as $t => $data_json) {
                    $data = json_decode($data_json, true);
                    if ($data && $data['client_id'] === $client_id) {
                        $old_time = $t;
                        break;
                    }
                }
                
                // Delete old selection
                if ($old_time && $old_time !== $time) {
                    $this->redis->hDel($hash_key, $old_time);
                }
                
                // Set new selection in hash (O(1))
                $data = ['client_id' => $client_id, 'timestamp' => time(), 'time' => $time];
                $this->redis->hSet($hash_key, $time, json_encode($data));
                $this->redis->expire($hash_key, 300);
                
                return true;
            }
            return false;
        } catch (Exception $e) {
            error_log('[Redis] set_active_selection error: ' . $e->getMessage());
            return false;
        }
    }

    public function get_active_selections($date, $employee_id) {
        if (!$this->enabled || !$this->redis) return [];
        
        try {
            $hash_key = "appointease_active_{$date}_{$employee_id}";
            
            // HGETALL is O(N) where N = number of slots (max ~20)
            // Persistent connection (pconnect) reuses TCP connection = <1ms
            // Perfect for 1-second polling
            $raw_selections = $this->redis->hGetAll($hash_key);
            
            $selections = [];
            foreach ($raw_selections as $time => $data_json) {
                $data = json_decode($data_json, true);
                if ($data) {
                    $selections[$time] = $data;
                }
            }
            
            return $selections;
        } catch (Exception $e) {
            error_log('[Redis] get_active_selections error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Clear all locks using SCAN (production-safe)
     */
    public function clear_all_locks() {
        if (!$this->enabled || !$this->redis) return 0;
        
        try {
            $deleted = 0;
            $patterns = ['appointease_lock_*', 'appointease_active_*'];
            
            foreach ($patterns as $pattern) {
                $iterator = null;
                while ($keys = $this->redis->scan($iterator, $pattern, 100)) {
                    if (!empty($keys)) {
                        $deleted += $this->redis->del($keys);
                    }
                    if ($iterator === 0) break;
                }
            }
            return $deleted;
        } catch (Exception $e) {
            error_log('[Redis] Clear locks failed: ' . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Sync MySQL transients to Redis after recovery (graceful failback)
     * Prevents short desync period when Redis comes back online
     */
    public function sync_transients_to_redis($date, $employee_id) {
        if (!$this->enabled || !$this->redis) return false;
        
        try {
            // Get transient data
            $key = "appointease_active_{$date}_{$employee_id}";
            $transient_data = get_transient($key);
            
            if (!$transient_data || !is_array($transient_data)) {
                return true; // Nothing to sync
            }
            
            // Sync each selection to Redis
            foreach ($transient_data as $time => $selection) {
                if (isset($selection['client_id'])) {
                    $this->set_active_selection($date, $employee_id, $time, $selection['client_id']);
                }
            }
            
            error_log('[Redis] Synced ' . count($transient_data) . ' selections from MySQL to Redis');
            return true;
        } catch (Exception $e) {
            error_log('[Redis] Sync failed: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Redis Pub/Sub for real-time events (future-proofing)
     * Can be used for async notifications, updates, etc.
     */
    public function publish_event($channel, $message) {
        if (!$this->enabled || !$this->redis) return false;
        
        try {
            return $this->redis->publish($channel, json_encode($message));
        } catch (Exception $e) {
            error_log('[Redis] Publish failed: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Add to Redis Stream for async task queue (future-proofing)
     * Example: Email notifications, webhook calls, etc.
     */
    public function add_to_stream($stream, $data) {
        if (!$this->enabled || !$this->redis) return false;
        
        try {
            // Redis Stream: XADD stream * field1 value1 field2 value2
            return $this->redis->xAdd($stream, '*', $data);
        } catch (Exception $e) {
            error_log('[Redis] Stream add failed: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Atomic SETNX - Set if not exists (atomic lock)
     * Returns true if key was set, false if already exists
     */
    public function atomic_lock($key, $value, $ttl = 600) {
        if (!$this->enabled || !$this->redis) return false;
        
        try {
            // SET key value NX EX ttl (atomic operation)
            return $this->redis->set($key, json_encode($value), ['nx', 'ex' => $ttl]);
        } catch (Exception $e) {
            error_log('[Redis] Atomic lock failed: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Atomic GETDEL - Get and delete in one operation (Redis 6+)
     */
    public function get_and_delete($key) {
        if (!$this->enabled || !$this->redis) return null;
        
        try {
            $value = $this->redis->getDel($key);
            return $value ? json_decode($value, true) : null;
        } catch (Exception $e) {
            // Fallback for Redis < 6.2
            $value = $this->redis->get($key);
            if ($value) {
                $this->redis->del($key);
                return json_decode($value, true);
            }
            return null;
        }
    }
    
    /**
     * Hash operations for structured booking data
     * Store booking info in one key: booking:123 -> {user_id, service, time}
     */
    public function set_booking_hash($booking_id, $data, $ttl = 600) {
        if (!$this->enabled || !$this->redis) return false;
        
        try {
            $key = "appointease:booking:{$booking_id}";
            $this->redis->hMSet($key, $data);
            $this->redis->expire($key, $ttl);
            return true;
        } catch (Exception $e) {
            error_log('[Redis] Hash set failed: ' . $e->getMessage());
            return false;
        }
    }
    
    public function get_booking_hash($booking_id) {
        if (!$this->enabled || !$this->redis) return null;
        
        try {
            $key = "appointease:booking:{$booking_id}";
            return $this->redis->hGetAll($key);
        } catch (Exception $e) {
            return null;
        }
    }
    
    /**
     * Lua script for atomic slot locking with conflict check
     * Prevents race conditions in multi-step operations
     */
    public function atomic_slot_lock_lua($date, $time, $employee_id, $client_id, $ttl = 600) {
        if (!$this->enabled || !$this->redis) return false;
        
        try {
            $lock_key = "appointease:lock:{$date}:{$time}:{$employee_id}";
            $selection_key = "appointease:selection:{$date}:{$time}:{$employee_id}";
            
            // Lua script: check if unlocked, set lock, set selection, set TTL atomically
            $lua = <<<LUA
local lock_key = KEYS[1]
local selection_key = KEYS[2]
local client_id = ARGV[1]
local ttl = tonumber(ARGV[2])
local timestamp = ARGV[3]

if redis.call('EXISTS', lock_key) == 1 then
    return 0
end

local lock_data = cjson.encode({client_id = client_id, timestamp = timestamp})
redis.call('SETEX', lock_key, ttl, lock_data)
redis.call('SETEX', selection_key, 10, client_id)
return 1
LUA;
            
            $result = $this->redis->eval($lua, [$lock_key, $selection_key, $client_id, $ttl, time()], 2);
            return $result === 1;
        } catch (Exception $e) {
            error_log('[Redis] Lua lock failed: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get Redis stats for monitoring
     */
    public function get_stats() {
        if (!$this->enabled || !$this->redis) return null;
        
        try {
            $info = $this->redis->info();
            return [
                'used_memory' => $info['used_memory_human'] ?? 'N/A',
                'connected_clients' => $info['connected_clients'] ?? 0,
                'total_commands' => $info['total_commands_processed'] ?? 0,
                'keyspace_hits' => $info['keyspace_hits'] ?? 0,
                'keyspace_misses' => $info['keyspace_misses'] ?? 0,
                'hit_rate' => $this->calculate_hit_rate($info),
                'uptime_seconds' => $info['uptime_in_seconds'] ?? 0
            ];
        } catch (Exception $e) {
            return null;
        }
    }
    
    private function calculate_hit_rate($info) {
        $hits = $info['keyspace_hits'] ?? 0;
        $misses = $info['keyspace_misses'] ?? 0;
        $total = $hits + $misses;
        
        if ($total === 0) return 0;
        return round(($hits / $total) * 100, 2);
    }
    
    /**
     * Get TTL for a key
     */
    public function get_ttl($key) {
        if (!$this->enabled || !$this->redis) return -1;
        
        try {
            return $this->redis->ttl($key);
        } catch (Exception $e) {
            return -1;
        }
    }
    
    /**
     * Check if key exists
     */
    public function exists($key) {
        if (!$this->enabled || !$this->redis) return false;
        
        try {
            return $this->redis->exists($key) > 0;
        } catch (Exception $e) {
            return false;
        }
    }
    
    /**
     * Redis Hash operations for grouped slot data
     * Store all slots for a date in one hash
     */
    public function lock_slot_hash($date, $employee_id, $time, $data, $ttl = 600) {
        if (!$this->enabled || !$this->redis) return false;
        
        try {
            $hash_key = "appointease:locks:{$date}:{$employee_id}";
            $field = $time;
            
            // Check if slot already locked
            if ($this->redis->hExists($hash_key, $field)) {
                return false;
            }
            
            // Set field and update hash TTL
            $this->redis->hSet($hash_key, $field, json_encode($data));
            $this->redis->expire($hash_key, $ttl);
            return true;
        } catch (Exception $e) {
            error_log('[Redis] Hash lock failed: ' . $e->getMessage());
            return false;
        }
    }
    
    public function unlock_slot_hash($date, $employee_id, $time) {
        if (!$this->enabled || !$this->redis) return false;
        
        try {
            $hash_key = "appointease:locks:{$date}:{$employee_id}";
            return $this->redis->hDel($hash_key, $time) > 0;
        } catch (Exception $e) {
            return false;
        }
    }
    
    public function get_all_locks_hash($date, $employee_id) {
        if (!$this->enabled || !$this->redis) return [];
        
        try {
            $hash_key = "appointease:locks:{$date}:{$employee_id}";
            $locks = $this->redis->hGetAll($hash_key);
            
            $result = [];
            foreach ($locks as $time => $data) {
                $result[$time] = json_decode($data, true);
            }
            return $result;
        } catch (Exception $e) {
            return [];
        }
    }
    
    /**
     * Enable keyspace notifications for expiration events
     */
    public function enable_expiration_events() {
        if (!$this->enabled || !$this->redis) return false;
        
        try {
            return $this->redis->config('SET', 'notify-keyspace-events', 'Ex');
        } catch (Exception $e) {
            error_log('[Redis] Failed to enable keyspace events: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get Redis persistence config
     */
    public function get_persistence_config() {
        if (!$this->enabled || !$this->redis) return null;
        
        try {
            $config = $this->redis->config('GET', 'appendonly');
            return [
                'aof_enabled' => $config['appendonly'] === 'yes',
                'save_config' => $this->redis->config('GET', 'save')
            ];
        } catch (Exception $e) {
            return null;
        }
    }
    
    /**
     * Increment counter atomically
     */
    public function increment($key, $amount = 1) {
        if (!$this->enabled || !$this->redis) return false;
        
        try {
            return $this->redis->incrBy($key, $amount);
        } catch (Exception $e) {
            return false;
        }
    }
}
