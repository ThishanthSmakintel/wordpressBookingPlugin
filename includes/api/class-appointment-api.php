<?php
/**
 * Appointment API Endpoints
 */

if (!defined('ABSPATH')) exit;

require_once plugin_dir_path(dirname(__FILE__)) . 'class-api-security.php';

class Appointease_Appointment_API {
    
    private $redis;
    
    public function __construct() {
        $this->redis = Appointease_Redis_Helper::get_instance();
    }
    
    public function register_routes() {
        register_rest_route('appointease/v1', '/appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_appointment'),
            'permission_callback' => array('Appointease_API_Security', 'nonce_permission_callback')
        ));
        
        register_rest_route('appointease/v1', '/appointments/(?P<id>[a-zA-Z0-9\\-]+)', array(
            array(
                'methods' => 'GET',
                'callback' => array($this, 'get_appointment'),
                'permission_callback' => array('Appointease_API_Security', 'public_permission_callback')
            ),
            array(
                'methods' => 'DELETE',
                'callback' => array($this, 'cancel_appointment'),
                'permission_callback' => array('Appointease_API_Security', 'nonce_permission_callback')
            ),
            array(
                'methods' => 'PUT',
                'callback' => array($this, 'reschedule_appointment'),
                'permission_callback' => array('Appointease_API_Security', 'nonce_permission_callback')
            )
        ));
        
        register_rest_route('appointease/v1', '/user-appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'get_user_appointments'),
            'permission_callback' => array('Appointease_API_Security', 'public_permission_callback')
        ));
    }
    
    public function create_appointment($request) {
        try {
            require_once plugin_dir_path(dirname(dirname(__FILE__))) . 'includes/class-atomic-booking.php';
            require_once plugin_dir_path(dirname(__FILE__)) . 'class-security-helper.php';
            
            $params = $request->get_json_params();
            
            // Validate required fields
            $validation = AppointEase_Security_Helper::validate_api_response($params, ['name', 'email', 'date']);
            if (is_wp_error($validation)) {
                return $validation;
            }
            
            $booking_data = [
                'name' => trim(sanitize_text_field($params['name'])),
                'email' => trim(strtolower(sanitize_email($params['email']))),
                'phone' => trim(sanitize_text_field($params['phone'] ?? '')),
                'appointment_date' => trim(sanitize_text_field($params['date'])),
                'service_id' => intval($params['service_id'] ?? 1),
                'employee_id' => intval($params['employee_id'] ?? 0),
                'idempotency_key' => $request->get_header('X-Idempotency-Key')
            ];
            
            if (empty($booking_data['employee_id'])) {
                return new WP_Error('invalid_data', 'Employee required', array('status' => 400));
            }
            
            $atomic_booking = Atomic_Booking::getInstance();
            $result = $atomic_booking->create_appointment_atomic($booking_data);
            
            if (is_wp_error($result)) {
                AppointEase_Security_Helper::log_error('Appointment creation failed', [
                    'error' => $result->get_error_message(),
                    'data' => $booking_data
                ]);
                return $result;
            }
            
            return rest_ensure_response($result);
            
        } catch (Exception $e) {
            AppointEase_Security_Helper::log_error('Exception in create_appointment', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return new WP_Error('server_error', 'Internal server error', array('status' => 500));
        }
    }
    
    public function get_appointment($request) {
        try {
            global $wpdb;
            require_once plugin_dir_path(dirname(__FILE__)) . 'class-security-helper.php';
            
            $appointment = $this->find_appointment_by_id($request['id']);
            
            // Check for database errors
            if ($wpdb->last_error) {
                AppointEase_Security_Helper::log_error('Database error in get_appointment', [
                    'error' => $wpdb->last_error,
                    'id' => $request['id']
                ]);
                return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
            }
            
            return $appointment ? rest_ensure_response($appointment) : new WP_Error('not_found', 'Not found', array('status' => 404));
            
        } catch (Exception $e) {
            AppointEase_Security_Helper::log_error('Exception in get_appointment', [
                'message' => $e->getMessage(),
                'id' => $request['id']
            ]);
            return new WP_Error('server_error', 'Internal server error', array('status' => 500));
        }
    }
    
    public function cancel_appointment($request) {
        try {
            global $wpdb;
            require_once plugin_dir_path(dirname(__FILE__)) . 'class-security-helper.php';
            
            $id = sanitize_text_field($request['id']);
            $appointment = $this->find_appointment_by_id($id);
            
            // Check for database errors in find operation
            if ($wpdb->last_error) {
                AppointEase_Security_Helper::log_error('Database error finding appointment', [
                    'error' => $wpdb->last_error,
                    'id' => $id
                ]);
                return new WP_Error('db_error', 'Database error occurred', array('status' => 500));
            }
            
            if (!$appointment) {
                return new WP_Error('not_found', 'Not found', array('status' => 404));
            }
            
            if ($appointment->status === 'cancelled') {
                return rest_ensure_response(array('success' => true));
            }
            
            $table = Appointease_API_Security::get_table_name('appointments');
            $where = strpos($id, 'APT-') === 0 ? array('strong_id' => $id) : array('id' => intval($id));
            $format = strpos($id, 'APT-') === 0 ? array('%s') : array('%d');
            
            $result = $wpdb->update($table, array('status' => 'cancelled'), $where, array('%s'), $format);
            
            // Check update result
            if ($result === false) {
                AppointEase_Security_Helper::log_error('Failed to cancel appointment', [
                    'error' => $wpdb->last_error,
                    'id' => $id
                ]);
                return new WP_Error('update_failed', 'Failed to cancel appointment', array('status' => 500));
            }
            
            return rest_ensure_response(array('success' => true));
            
        } catch (Exception $e) {
            AppointEase_Security_Helper::log_error('Exception in cancel_appointment', [
                'message' => $e->getMessage(),
                'id' => $request['id']
            ]);
            return new WP_Error('server_error', 'Internal server error', array('status' => 500));
        }
    }
    
    public function reschedule_appointment($request) {
        global $wpdb;
        $id = sanitize_text_field($request['id']);
        $params = $request->get_json_params();
        $new_date = sanitize_text_field($params['new_date'] ?? '');
        
        if (empty($new_date)) {
            return new WP_Error('missing_params', 'New date required', array('status' => 400));
        }
        
        $appointment = $this->find_appointment_by_id($id);
        if (!$appointment) {
            return new WP_Error('not_found', 'Not found', array('status' => 404));
        }
        
        $wpdb->query('START TRANSACTION');
        
        $table = Appointease_API_Security::get_table_name('appointments');
        $conflict = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM `{$table}` 
             WHERE appointment_date = %s AND employee_id = %d 
             AND status IN ('confirmed', 'created') AND id != %d FOR UPDATE",
            $new_date, $appointment->employee_id, $appointment->id
        ));
        
        if ($conflict) {
            $wpdb->query('ROLLBACK');
            return new WP_Error('slot_taken', 'Slot taken', array('status' => 409));
        }
        
        $table = Appointease_API_Security::get_table_name('appointments');
        $where = strpos($id, 'APT-') === 0 ? array('strong_id' => $id) : array('id' => intval($id));
        $format = strpos($id, 'APT-') === 0 ? array('%s') : array('%d');
        
        $wpdb->update($table, array('appointment_date' => $new_date), $where, array('%s'), $format);
        $wpdb->query('COMMIT');
        
        return rest_ensure_response(array('success' => true));
    }
    
    public function get_user_appointments($request) {
        global $wpdb;
        $params = $request->get_json_params();
        $email = sanitize_email($params['email'] ?? '');
        
        if (!is_email($email)) {
            return new WP_Error('invalid_email', 'Invalid email', array('status' => 400));
        }
        
        $table = Appointease_API_Security::get_table_name('appointments');
        $appointments = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM `{$table}` WHERE email = %s ORDER BY appointment_date DESC",
            $email
        ));
        
        return rest_ensure_response($appointments);
    }
    
    private function find_appointment_by_id($id) {
        global $wpdb;
        $table = Appointease_API_Security::get_table_name('appointments');
        
        if (strpos($id, 'APT-') === 0) {
            return $wpdb->get_row($wpdb->prepare("SELECT * FROM `{$table}` WHERE strong_id = %s", $id));
        }
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM `{$table}` WHERE id = %d", intval($id)));
    }
    
    public function verify_permission($request) {
        $nonce = $request->get_header('X-WP-Nonce');
        if ($nonce && wp_verify_nonce($nonce, 'wp_rest')) return true;
        
        if (class_exists('BookingSessionManager')) {
            $session_manager = BookingSessionManager::getInstance();
            return $session_manager->validateSession() !== false;
        }
        return false;
    }
}
