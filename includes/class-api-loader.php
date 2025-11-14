<?php
/**
 * API Loader - Loads all API endpoint classes
 */

if (!defined('ABSPATH')) exit;

class Appointease_API_Loader {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('rest_api_init', array($this, 'register_all_routes'));
    }
    
    public function register_all_routes() {
        // Load security helper first
        require_once plugin_dir_path(__FILE__) . 'class-api-security.php';
        
        // Load API classes
        require_once plugin_dir_path(__FILE__) . 'api/class-appointment-api.php';
        require_once plugin_dir_path(__FILE__) . 'api/class-availability-api.php';
        require_once plugin_dir_path(__FILE__) . 'api/class-service-staff-api.php';
        require_once plugin_dir_path(__FILE__) . 'api/class-realtime-api.php';
        require_once plugin_dir_path(__FILE__) . 'api/class-settings-api.php';
        
        // Initialize and register routes
        $appointment_api = new Appointease_Appointment_API();
        $appointment_api->register_routes();
        
        $availability_api = new Appointease_Availability_API();
        $availability_api->register_routes();
        
        $service_staff_api = new Appointease_Service_Staff_API();
        $service_staff_api->register_routes();
        
        $realtime_api = new Appointease_Realtime_API();
        $realtime_api->register_routes();
        
        $settings_api = new Appointease_Settings_API();
        $settings_api->register_routes();
    }
}

// Initialize
Appointease_API_Loader::get_instance();
