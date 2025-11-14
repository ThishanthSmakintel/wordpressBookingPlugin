<?php
/**
 * Settings & Configuration API
 */

if (!defined('ABSPATH')) exit;

require_once plugin_dir_path(dirname(__FILE__)) . 'class-api-security.php';

class Appointease_Settings_API {
    
    private $redis;
    
    public function __construct() {
        $this->redis = Appointease_Redis_Helper::get_instance();
    }
    
    public function register_routes() {
        register_rest_route('appointease/v1', '/settings', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_settings'),
            'permission_callback' => array('Appointease_API_Security', 'public_permission_callback')
        ));
        
        register_rest_route('appointease/v1', '/business-hours', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_business_hours'),
            'permission_callback' => array('Appointease_API_Security', 'public_permission_callback')
        ));
        
        register_rest_route('appointease/v1', '/time-slots', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_time_slots'),
            'permission_callback' => array('Appointease_API_Security', 'public_permission_callback')
        ));
        
        register_rest_route('appointease/v1', '/server-date', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_server_date'),
            'permission_callback' => array('Appointease_API_Security', 'public_permission_callback')
        ));
        
        register_rest_route('appointease/v1', '/redis/stats', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_redis_stats'),
            'permission_callback' => array('Appointease_API_Security', 'public_permission_callback')
        ));
    }
    
    public function get_settings() {
        try {
            require_once plugin_dir_path(dirname(__FILE__)) . 'class-security-helper.php';
            
            $options = get_option('appointease_options', array());
            
            $start_time = $options['start_time'] ?? '09:00';
            $end_time = $options['end_time'] ?? '17:00';
            $slot_duration = intval($options['slot_duration'] ?? 60);
            
            $time_slots = $this->generate_time_slots($start_time, $end_time, $slot_duration);
            
            return rest_ensure_response(array(
                'business_hours' => array('start' => $start_time, 'end' => $end_time),
                'working_days' => $options['working_days'] ?? ['1','2','3','4','5'],
                'time_slots' => $time_slots,
                'slot_duration' => $slot_duration
            ));
        } catch (Exception $e) {
            AppointEase_Security_Helper::log_error('Exception in get_settings', [
                'message' => $e->getMessage()
            ]);
            return new WP_Error('server_error', 'Failed to retrieve settings', array('status' => 500));
        }
    }
    
    public function get_business_hours() {
        $options = get_option('appointease_options', array());
        
        return rest_ensure_response(array(
            'working_days' => $options['working_days'] ?? ['1','2','3','4','5'],
            'start_time' => $options['start_time'] ?? '09:00',
            'end_time' => $options['end_time'] ?? '17:00',
            'lunch_start' => $options['lunch_start'] ?? '12:00',
            'lunch_end' => $options['lunch_end'] ?? '14:00'
        ));
    }
    
    public function get_time_slots() {
        $options = get_option('appointease_options', array());
        
        $start_time = $options['start_time'] ?? '09:00';
        $end_time = $options['end_time'] ?? '17:00';
        $slot_duration = intval($options['slot_duration'] ?? 60);
        
        $time_slots = $this->generate_time_slots($start_time, $end_time, $slot_duration);
        
        return rest_ensure_response(array(
            'time_slots' => $time_slots,
            'slot_duration' => $slot_duration
        ));
    }
    
    public function get_server_date() {
        return rest_ensure_response(array(
            'server_date' => date('Y-m-d'),
            'server_time' => date('Y-m-d H:i:s'),
            'server_timestamp' => time(),
            'timezone' => date_default_timezone_get()
        ));
    }
    
    public function get_redis_stats($request) {
        try {
            require_once plugin_dir_path(dirname(__FILE__)) . 'class-security-helper.php';
            
            if (!$this->redis->is_enabled()) {
                return rest_ensure_response(array(
                    'enabled' => false,
                    'message' => 'Redis not available'
                ));
            }
            
            $date = $request->get_param('date');
            $employee_id = $request->get_param('employee_id');
            $client_id = $request->get_param('client_id');
            
            $redis_ops = array('locks' => 0, 'selections' => 0, 'user_selection' => 0);
            
            if ($date && $employee_id) {
                $selections = AppointEase_Security_Helper::safe_redis_operation(function() use ($date, $employee_id) {
                    return $this->redis->get_active_selections($date, $employee_id);
                }, function() { return []; });
                
                $other_selections = 0;
                $user_has_selection = 0;
                
                foreach ($selections as $time => $sel_data) {
                    if (isset($sel_data['client_id'])) {
                        if ($client_id && $sel_data['client_id'] === $client_id) {
                            $user_has_selection = 1;
                        } else {
                            $other_selections++;
                        }
                    }
                }
                
                $redis_ops = array(
                    'locks' => 0,
                    'selections' => $other_selections,
                    'user_selection' => $user_has_selection
                );
            }
            
            $stats = AppointEase_Security_Helper::safe_redis_operation(function() {
                return $this->redis->get_stats();
            }, function() { return null; });
            
            $health = AppointEase_Security_Helper::safe_redis_operation(function() {
                return $this->redis->health_check();
            }, function() { return false; });
            
            return rest_ensure_response(array(
                'enabled' => true,
                'stats' => $stats,
                'health' => $health,
                'redis_ops' => $redis_ops
            ));
        } catch (Exception $e) {
            AppointEase_Security_Helper::log_error('Exception in get_redis_stats', [
                'message' => $e->getMessage(),
                'params' => $request->get_params()
            ]);
            return new WP_Error('server_error', 'Failed to retrieve Redis stats', array('status' => 500));
        }
    }
    
    private function generate_time_slots($start_time, $end_time, $duration_minutes) {
        $slots = array();
        $start = strtotime($start_time);
        $end = strtotime($end_time);
        
        for ($time = $start; $time < $end; $time += ($duration_minutes * 60)) {
            $slots[] = date('H:i', $time);
        }
        
        return $slots;
    }
}
