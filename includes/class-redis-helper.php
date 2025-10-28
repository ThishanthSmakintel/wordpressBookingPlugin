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
                $this->redis->connect('127.0.0.1', 6379);
                return $this->redis->ping();
            } catch (Exception $e) {
                error_log('[Redis] Connection failed: ' . $e->getMessage());
                return false;
            }
        }
        
        return false;
    }

    public function is_enabled() {
        return $this->enabled;
    }

    // Atomic slot lock with SETNX
    public function lock_slot($key, $data, $ttl = 600) {
        if (!$this->enabled) return false;
        
        try {
            if ($this->redis) {
                return $this->redis->setex($key, $ttl, json_encode($data));
            }
            return wp_cache_set($key, $data, 'appointease_locks', $ttl);
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

    public function delete_lock($key) {
        if (!$this->enabled) return false;
        
        try {
            if ($this->redis) {
                return $this->redis->del($key);
            }
            return wp_cache_delete($key, 'appointease_locks');
        } catch (Exception $e) {
            return false;
        }
    }

    // Get all locks for a date/employee
    public function get_locks_by_pattern($pattern) {
        if (!$this->enabled || !$this->redis) return [];
        
        try {
            $keys = $this->redis->keys($pattern);
            $locks = [];
            foreach ($keys as $key) {
                $data = $this->redis->get($key);
                if ($data) {
                    $locks[] = json_decode($data, true);
                }
            }
            return $locks;
        } catch (Exception $e) {
            return [];
        }
    }

    // Active selections (10 sec TTL)
    public function set_active_selection($date, $employee_id, $time, $client_id) {
        if (!$this->enabled) return false;
        
        $key = "appointease_active_{$date}_{$employee_id}_{$time}";
        $data = ['client_id' => $client_id, 'timestamp' => time()];
        
        try {
            if ($this->redis) {
                return $this->redis->setex($key, 10, json_encode($data));
            }
            return wp_cache_set($key, $data, 'appointease_active', 10);
        } catch (Exception $e) {
            return false;
        }
    }

    public function get_active_selections($date, $employee_id) {
        if (!$this->enabled || !$this->redis) return [];
        
        try {
            $pattern = "appointease_active_{$date}_{$employee_id}_*";
            $keys = $this->redis->keys($pattern);
            $selections = [];
            
            foreach ($keys as $key) {
                if (preg_match('/_(\d{2}:\d{2})$/', $key, $matches)) {
                    $data = $this->redis->get($key);
                    if ($data) {
                        $selections[$matches[1]] = json_decode($data, true);
                    }
                }
            }
            return $selections;
        } catch (Exception $e) {
            return [];
        }
    }

    public function clear_all_locks() {
        if (!$this->enabled || !$this->redis) return 0;
        
        try {
            $keys = $this->redis->keys('appointease_lock_*');
            $active_keys = $this->redis->keys('appointease_active_*');
            $all_keys = array_merge($keys, $active_keys);
            
            if (empty($all_keys)) return 0;
            return $this->redis->del($all_keys);
        } catch (Exception $e) {
            return 0;
        }
    }
}
