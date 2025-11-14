<?php
/**
 * Availability API Endpoints
 */

if (!defined('ABSPATH')) exit;

require_once plugin_dir_path(dirname(__FILE__)) . 'class-api-security.php';

class Appointease_Availability_API {
    
    private $redis;
    
    public function __construct() {
        $this->redis = Appointease_Redis_Helper::get_instance();
    }
    
    public function register_routes() {
        register_rest_route('booking/v1', '/availability', array(
            'methods' => 'POST',
            'callback' => array($this, 'check_availability'),
            'permission_callback' => array('Appointease_API_Security', 'public_permission_callback')
        ));
        
        register_rest_route('appointease/v1', '/reschedule-availability', array(
            'methods' => 'POST',
            'callback' => array($this, 'check_reschedule_availability'),
            'permission_callback' => array('Appointease_API_Security', 'public_permission_callback')
        ));
    }
    
    public function check_availability($request) {
        try {
            global $wpdb;
            require_once plugin_dir_path(dirname(__FILE__)) . 'class-security-helper.php';
            
            $params = $request->get_json_params();
            
            // Validate required parameters
            $validation = AppointEase_Security_Helper::validate_api_response($params, ['date', 'employee_id']);
            if (is_wp_error($validation)) {
                return $validation;
            }
            
            $date = sanitize_text_field($params['date']);
            $employee_id = intval($params['employee_id']);
            
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                return new WP_Error('invalid_date', 'Invalid date format', array('status' => 400));
            }
            
            $options = get_option('appointease_options', array());
            
            // Past date check
            if ($date < date('Y-m-d')) {
                return rest_ensure_response(array('unavailable' => 'all', 'reason' => 'past_date'));
            }
            
            // Working day check
            $working_days = $options['working_days'] ?? ['1','2','3','4','5'];
            $day_of_week = date('w', strtotime($date));
            
            if (!in_array((string)$day_of_week, $working_days)) {
                return rest_ensure_response(array('unavailable' => 'all', 'reason' => 'non_working_day'));
            }
            
            // Get booked appointments with error handling
            $table = Appointease_API_Security::get_table_name('appointments');
            $booked_appointments = $wpdb->get_results($wpdb->prepare(
                "SELECT TIME_FORMAT(appointment_date, '%%H:%%i') as time_slot, name, email, status, strong_id 
                 FROM `{$table}` 
                 WHERE employee_id = %d AND DATE(appointment_date) = %s AND status IN ('confirmed', 'created')",
                $employee_id, $date
            ));
            
            // Check for database errors
            if ($wpdb->last_error) {
                AppointEase_Security_Helper::log_error('Database error in check_availability', [
                    'error' => $wpdb->last_error,
                    'date' => $date,
                    'employee_id' => $employee_id
                ]);
                return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
            }
            
            $booked_times = array();
            $booking_details = array();
            
            // Check Redis locks with error handling
            if ($this->redis->is_enabled()) {
                $redis_result = AppointEase_Security_Helper::safe_redis_operation(function() use ($date, $employee_id) {
                    $pattern = "appointease_lock_{$date}_{$employee_id}_*";
                    return $this->redis->get_locks_by_pattern($pattern);
                });
                
                if ($redis_result !== false) {
                    foreach ($redis_result as $lock) {
                        $time_slot = substr($lock['time'] ?? '', 0, 5);
                        if ($time_slot && !in_array($time_slot, $booked_times)) {
                            $booked_times[] = $time_slot;
                            $booking_details[$time_slot] = array(
                                'customer_name' => 'Viewing by other user',
                                'status' => 'processing',
                                'is_locked' => true
                            );
                        }
                    }
                }
            }
            
            // Add confirmed appointments
            if ($booked_appointments) {
                foreach ($booked_appointments as $apt) {
                    if (!in_array($apt->time_slot, $booked_times)) {
                        $booked_times[] = $apt->time_slot;
                        $booking_details[$apt->time_slot] = array(
                            'customer_name' => $apt->name,
                            'customer_email' => $apt->email,
                            'status' => $apt->status,
                            'booking_id' => $apt->strong_id
                        );
                    }
                }
            }
            
            return rest_ensure_response(array(
                'unavailable' => $booked_times,
                'booking_details' => empty($booking_details) ? new stdClass() : $booking_details
            ));
            
        } catch (Exception $e) {
            AppointEase_Security_Helper::log_error('Exception in check_availability', [
                'message' => $e->getMessage(),
                'params' => $request->get_json_params()
            ]);
            return new WP_Error('server_error', 'Internal server error', array('status' => 500));
        }
    }
    
    public function check_reschedule_availability($request) {
        global $wpdb;
        $params = $request->get_json_params();
        
        if (!isset($params['date'], $params['employee_id'], $params['exclude_appointment_id'])) {
            return new WP_Error('missing_params', 'Required params missing', array('status' => 400));
        }
        
        $date = sanitize_text_field($params['date']);
        $employee_id = intval($params['employee_id']);
        $exclude_id = sanitize_text_field($params['exclude_appointment_id']);
        
        // Get appointments excluding current one
        $table = Appointease_API_Security::get_table_name('appointments');
        if (strpos($exclude_id, 'APT-') === 0) {
            $booked = $wpdb->get_results($wpdb->prepare(
                "SELECT TIME_FORMAT(appointment_date, '%%H:%%i') as time_slot 
                 FROM `{$table}` 
                 WHERE employee_id = %d AND DATE(appointment_date) = %s 
                 AND status IN ('confirmed', 'created') AND strong_id != %s",
                $employee_id, $date, $exclude_id
            ));
        } else {
            $booked = $wpdb->get_results($wpdb->prepare(
                "SELECT TIME_FORMAT(appointment_date, '%%H:%%i') as time_slot 
                 FROM `{$table}` 
                 WHERE employee_id = %d AND DATE(appointment_date) = %s 
                 AND status IN ('confirmed', 'created') AND id != %d",
                $employee_id, $date, intval($exclude_id)
            ));
        }
        
        $booked_times = array_column($booked, 'time_slot');
        
        return rest_ensure_response(array(
            'unavailable' => $booked_times,
            'excluded_appointment' => $exclude_id
        ));
    }
    

}
