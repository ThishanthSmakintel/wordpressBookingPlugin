<?php
/**
 * Simple File Logger
 * Logs to wp-content/plugins/wordpressBookingPlugin/logs/
 */

if (!defined('ABSPATH')) {
    exit;
}

class Appointease_Logger {
    private static $instance = null;
    private $log_dir;
    private $log_file;
    
    private function __construct() {
        try {
            $this->log_dir = plugin_dir_path(__FILE__) . '../logs';
            
            if (!file_exists($this->log_dir)) {
                if (!mkdir($this->log_dir, 0755, true)) {
                    error_log('AppointEase Logger: Failed to create log directory: ' . $this->log_dir);
                    throw new Exception('Cannot create log directory');
                }
            }
            
            $this->log_file = $this->log_dir . '/debug-' . date('Y-m-d') . '.log';
            
            // Create .htaccess to protect log files
            $htaccess_file = $this->log_dir . '/.htaccess';
            if (!file_exists($htaccess_file)) {
                file_put_contents($htaccess_file, "Deny from all\n");
            }
            
        } catch (Exception $e) {
            error_log('AppointEase Logger Constructor Error: ' . $e->getMessage());
            // Fallback to WordPress uploads directory
            $upload_dir = wp_upload_dir();
            $this->log_dir = $upload_dir['basedir'] . '/appointease-logs';
            if (!file_exists($this->log_dir)) {
                mkdir($this->log_dir, 0755, true);
            }
            $this->log_file = $this->log_dir . '/debug-' . date('Y-m-d') . '.log';
        }
    }
    
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function log($message, $context = array()) {
        try {
            $timestamp = date('Y-m-d H:i:s');
            $log_entry = "[{$timestamp}] {$message}";
            
            if (!empty($context)) {
                $log_entry .= ' | Context: ' . json_encode($context);
            }
            
            $log_entry .= PHP_EOL;
            
            // Check if log directory is writable
            if (!is_writable($this->log_dir)) {
                error_log('AppointEase Logger: Log directory not writable: ' . $this->log_dir);
                return false;
            }
            
            $result = file_put_contents($this->log_file, $log_entry, FILE_APPEND | LOCK_EX);
            
            if ($result === false) {
                error_log('AppointEase Logger: Failed to write to log file: ' . $this->log_file);
                return false;
            }
            
            return true;
        } catch (Exception $e) {
            error_log('AppointEase Logger Exception: ' . $e->getMessage());
            return false;
        }
    }
    
    public function error($message, $context = array()) {
        return $this->log('[ERROR] ' . $message, $context);
    }
    
    public function warning($message, $context = array()) {
        return $this->log('[WARNING] ' . $message, $context);
    }
    
    public function info($message, $context = array()) {
        return $this->log('[INFO] ' . $message, $context);
    }
}
