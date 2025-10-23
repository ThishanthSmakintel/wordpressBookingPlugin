<?php
/**
 * WebSocket Server Manager
 * Auto-starts Node.js WebSocket server when plugin loads
 */

if (!defined('ABSPATH')) {
    exit;
}

class Appointease_WebSocket_Manager {
    
    private static $instance = null;
    private $server_running = false;
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function __construct() {
        add_action('init', array($this, 'check_and_start_server'));
        add_action('admin_notices', array($this, 'show_server_status'));
    }
    
    /**
     * Check if WebSocket server is running, start if not
     */
    public function check_and_start_server() {
        if ($this->is_server_running()) {
            $this->server_running = true;
            return;
        }
        
        $this->start_server();
    }
    
    /**
     * Check if WebSocket server is running on port 8080
     */
    private function is_server_running() {
        $connection = @fsockopen('localhost', 8080, $errno, $errstr, 1);
        if (is_resource($connection)) {
            fclose($connection);
            return true;
        }
        return false;
    }
    
    /**
     * Start WebSocket server
     */
    private function start_server() {
        $plugin_dir = plugin_dir_path(dirname(__FILE__));
        $server_file = $plugin_dir . 'websocket-server.js';
        
        if (!file_exists($server_file)) {
            return false;
        }
        
        // Check if Node.js is installed
        if (!$this->is_node_installed()) {
            return false;
        }
        
        // Start server in background
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            // Windows
            $command = "start /B node \"$server_file\" > NUL 2>&1";
            pclose(popen($command, 'r'));
        } else {
            // Linux/Mac
            $command = "node \"$server_file\" > /dev/null 2>&1 &";
            exec($command);
        }
        
        // Wait a moment for server to start
        sleep(1);
        
        $this->server_running = $this->is_server_running();
        
        return $this->server_running;
    }
    
    /**
     * Check if Node.js is installed
     */
    private function is_node_installed() {
        $output = array();
        $return_var = 0;
        
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            exec('where node 2>NUL', $output, $return_var);
        } else {
            exec('which node 2>/dev/null', $output, $return_var);
        }
        
        return $return_var === 0 && !empty($output);
    }
    
    /**
     * Show admin notice about server status
     */
    public function show_server_status() {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        $screen = get_current_screen();
        if (!$screen || strpos($screen->id, 'appointease') === false) {
            return;
        }
        
        if ($this->is_server_running()) {
            echo '<div class="notice notice-success"><p>';
            echo '<strong>AppointEase:</strong> WebSocket server is running on port 8080 ⚡';
            echo '</p></div>';
        } else {
            echo '<div class="notice notice-warning"><p>';
            echo '<strong>AppointEase:</strong> WebSocket server is not running. ';
            echo 'Real-time updates will use HTTP polling. ';
            echo '<a href="' . admin_url('admin.php?page=appointease-websocket') . '">Start Server</a>';
            echo '</p></div>';
        }
    }
    
    /**
     * Get server status
     */
    public function get_status() {
        return array(
            'running' => $this->is_server_running(),
            'port' => 8080,
            'node_installed' => $this->is_node_installed()
        );
    }
}

// Initialize WebSocket manager
Appointease_WebSocket_Manager::getInstance();
