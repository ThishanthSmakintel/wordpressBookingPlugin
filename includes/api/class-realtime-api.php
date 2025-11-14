<?php
/**
 * Real-time Slot Selection API
 */

if (!defined('ABSPATH')) exit;

require_once plugin_dir_path(dirname(__FILE__)) . 'class-api-security.php';

class Appointease_Realtime_API {
    
    private $redis;
    
    public function __construct() {
        $this->redis = Appointease_Redis_Helper::get_instance();
    }
    
    public function register_routes() {
        register_rest_route('appointease/v1', '/slots/select', array(
            'methods' => 'POST',
            'callback' => array($this, 'realtime_select'),
            'permission_callback' => array('Appointease_API_Security', 'nonce_permission_callback')
        ));
        
        register_rest_route('appointease/v1', '/slots/deselect', array(
            'methods' => 'POST',
            'callback' => array($this, 'realtime_deselect'),
            'permission_callback' => array('Appointease_API_Security', 'nonce_permission_callback')
        ));
        
        register_rest_route('appointease/v1', '/slots/poll', array(
            'methods' => 'GET',
            'callback' => array($this, 'poll_slots'),
            'permission_callback' => array('Appointease_API_Security', 'public_permission_callback')
        ));
    }
    
    public function realtime_select($request) {
        try {
            require_once plugin_dir_path(dirname(__FILE__)) . 'class-security-helper.php';
            
            $params = $request->get_json_params();
            
            // Validate required parameters
            $validation = AppointEase_Security_Helper::validate_api_response($params, ['date', 'time', 'employee_id', 'client_id']);
            if (is_wp_error($validation)) {
                return $validation;
            }
            
            $date = sanitize_text_field($params['date']);
            $time = sanitize_text_field($params['time']);
            $employee_id = intval($params['employee_id']);
            $client_id = sanitize_text_field($params['client_id']);
            
            if ($this->redis->is_enabled()) {
                $success = AppointEase_Security_Helper::safe_redis_operation(function() use ($date, $employee_id, $time, $client_id) {
                    return $this->redis->set_active_selection($date, $employee_id, $time, $client_id);
                });
                
                if ($success === false) {
                    AppointEase_Security_Helper::log_error('Redis selection failed', [
                        'date' => $date,
                        'time' => $time,
                        'employee_id' => $employee_id,
                        'client_id' => $client_id
                    ]);
                    return new WP_Error('selection_failed', 'Failed to set selection', array('status' => 500));
                }
                
                return rest_ensure_response(array(
                    'success' => true,
                    'client_id' => $client_id,
                    'storage' => 'redis',
                    'ttl' => 10
                ));
            }
            
            // Fallback to transients with error handling
            $key = "appointease_active_{$date}_{$employee_id}";
            $selections = get_transient($key) ?: array();
            
            if (isset($selections[$time])) {
                return new WP_Error('already_locked', 'Slot already locked', array('status' => 409));
            }
            
            $selections[$time] = array('timestamp' => time(), 'client_id' => $client_id);
            $transient_result = set_transient($key, $selections, 600);
            
            if (!$transient_result) {
                AppointEase_Security_Helper::log_error('Transient selection failed', [
                    'key' => $key,
                    'selections' => $selections
                ]);
                return new WP_Error('selection_failed', 'Failed to set selection', array('status' => 500));
            }
            
            return rest_ensure_response(array(
                'success' => true,
                'client_id' => $client_id,
                'storage' => 'transient'
            ));
            
        } catch (Exception $e) {
            AppointEase_Security_Helper::log_error('Exception in realtime_select', [
                'message' => $e->getMessage(),
                'params' => $request->get_json_params()
            ]);
            return new WP_Error('server_error', 'Internal server error', array('status' => 500));
        }
    }
    
    public function realtime_deselect($request) {
        $params = $request->get_json_params();
        
        if (!isset($params['date'], $params['time'], $params['employee_id'])) {
            return new WP_Error('missing_params', 'Required params missing', array('status' => 400));
        }
        
        $date = sanitize_text_field($params['date']);
        $time = sanitize_text_field($params['time']);
        $employee_id = intval($params['employee_id']);
        
        if ($this->redis->is_enabled()) {
            $slot_key = "appointease_active_{$date}_{$employee_id}_{$time}";
            $this->redis->delete_lock($slot_key);
        } else {
            $key = "appointease_active_{$date}_{$employee_id}";
            $selections = get_transient($key) ?: array();
            unset($selections[$time]);
            
            if (empty($selections)) {
                delete_transient($key);
            } else {
                set_transient($key, $selections, 600);
            }
        }
        
        return rest_ensure_response(array('success' => true));
    }
    
    public function poll_slots($request) {
        global $wpdb;
        
        $date = $request->get_param('date');
        $employee_id = intval($request->get_param('employee_id'));
        $client_id = $request->get_param('client_id');
        $selected_time = $request->get_param('selected_time');
        
        if (!$date || !$employee_id) {
            return new WP_Error('missing_params', 'Date and employee_id required', array('status' => 400));
        }
        
        // Get booked slots
        $table = Appointease_API_Security::get_table_name('appointments');
        $booked_slots = $wpdb->get_col($wpdb->prepare(
            "SELECT TIME_FORMAT(TIME(appointment_date), '%%H:%%i') 
             FROM `{$table}` 
             WHERE DATE(appointment_date) = %s AND employee_id = %d AND status IN ('confirmed', 'created')",
            $date, $employee_id
        ));
        
        // Get active selections
        $active_selections = array();
        
        if ($this->redis->is_enabled()) {
            $selections = $this->redis->get_active_selections($date, $employee_id);
            
            foreach ($selections as $time => $sel_data) {
                if (isset($sel_data['client_id']) && (!$client_id || $sel_data['client_id'] !== $client_id)) {
                    $active_selections[] = $time;
                }
            }
            
            // Refresh user's selection
            if ($client_id && $selected_time) {
                $this->redis->set_active_selection($date, $employee_id, $selected_time, $client_id);
            }
        }
        
        return rest_ensure_response(array(
            'active_selections' => $active_selections,
            'booked_slots' => $booked_slots,
            'timestamp' => time()
        ));
    }
}
