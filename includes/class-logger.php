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
        $this->log_dir = plugin_dir_path(__FILE__) . '../logs';
        if (!file_exists($this->log_dir)) {
            mkdir($this->log_dir, 0755, true);
        }
        $this->log_file = $this->log_dir . '/debug-' . date('Y-m-d') . '.log';
    }
    
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function log($message, $context = array()) {
        $timestamp = date('Y-m-d H:i:s');
        $log_entry = "[{$timestamp}] {$message}";
        
        if (!empty($context)) {
            $log_entry .= ' | Context: ' . json_encode($context);
        }
        
        $log_entry .= PHP_EOL;
        file_put_contents($this->log_file, $log_entry, FILE_APPEND);
    }
}
