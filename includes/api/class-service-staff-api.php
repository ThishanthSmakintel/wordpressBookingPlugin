<?php
/**
 * Service & Staff API Endpoints
 */

if (!defined('ABSPATH')) exit;

require_once plugin_dir_path(dirname(__FILE__)) . 'class-api-security.php';

class Appointease_Service_Staff_API {
    
    public function register_routes() {
        register_rest_route('booking/v1', '/services', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_services'),
            'permission_callback' => array('Appointease_API_Security', 'public_permission_callback')
        ));
        
        register_rest_route('booking/v1', '/staff', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_staff'),
            'permission_callback' => array('Appointease_API_Security', 'public_permission_callback')
        ));
        
        register_rest_route('booking/v1', '/check-customer/(?P<email>[^/]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'check_customer_by_email'),
            'permission_callback' => array('Appointease_API_Security', 'public_permission_callback')
        ));
    }
    
    public function get_services() {
        try {
            global $wpdb;
            require_once plugin_dir_path(dirname(__FILE__)) . 'class-security-helper.php';
            
            $table = Appointease_API_Security::get_table_name('appointease_services');
            $services = $wpdb->get_results("SELECT * FROM `{$table}` ORDER BY name");
            
            if ($wpdb->last_error) {
                AppointEase_Security_Helper::log_error('Database error in get_services', [
                    'error' => $wpdb->last_error,
                    'table' => $table
                ]);
                return new WP_Error('db_error', 'Database error', array('status' => 500));
            }
            
            return rest_ensure_response($services ?: []);
        } catch (Exception $e) {
            AppointEase_Security_Helper::log_error('Exception in get_services', [
                'message' => $e->getMessage()
            ]);
            return new WP_Error('server_error', 'Internal server error', array('status' => 500));
        }
    }
    
    public function get_staff() {
        try {
            global $wpdb;
            require_once plugin_dir_path(dirname(__FILE__)) . 'class-security-helper.php';
            
            $table = Appointease_API_Security::get_table_name('appointease_staff');
            $staff = $wpdb->get_results("SELECT * FROM `{$table}` ORDER BY name");
            
            if ($wpdb->last_error) {
                AppointEase_Security_Helper::log_error('Database error in get_staff', [
                    'error' => $wpdb->last_error,
                    'table' => $table
                ]);
                return new WP_Error('db_error', 'Database error', array('status' => 500));
            }
            
            $response = rest_ensure_response($staff ?: []);
            $response->header('Cache-Control', 'no-cache, no-store, must-revalidate');
            return $response;
        } catch (Exception $e) {
            AppointEase_Security_Helper::log_error('Exception in get_staff', [
                'message' => $e->getMessage()
            ]);
            return new WP_Error('server_error', 'Internal server error', array('status' => 500));
        }
    }
    
    public function check_customer_by_email($request) {
        try {
            global $wpdb;
            require_once plugin_dir_path(dirname(__FILE__)) . 'class-security-helper.php';
            
            $email = sanitize_email(urldecode($request->get_param('email')));
            
            if (!is_email($email)) {
                return new WP_Error('invalid_email', 'Invalid email', array('status' => 400));
            }
            
            // Check customers table first
            $customer_table = Appointease_API_Security::get_table_name('appointease_customers');
            $customer = $wpdb->get_row($wpdb->prepare(
                "SELECT name, phone FROM `{$customer_table}` WHERE email = %s",
                $email
            ));
            
            if ($wpdb->last_error) {
                AppointEase_Security_Helper::log_error('Database error in check_customer_by_email (customers)', [
                    'error' => $wpdb->last_error,
                    'email' => $email
                ]);
                return new WP_Error('db_error', 'Database error', array('status' => 500));
            }
            
            if ($customer) {
                return rest_ensure_response(array(
                    'exists' => true,
                    'name' => $customer->name,
                    'phone' => $customer->phone
                ));
            }
            
            // Fallback to appointments table
            $appointment_table = Appointease_API_Security::get_table_name('appointments');
            $appointment = $wpdb->get_row($wpdb->prepare(
                "SELECT name, phone FROM `{$appointment_table}` WHERE email = %s ORDER BY id DESC LIMIT 1",
                $email
            ));
            
            if ($wpdb->last_error) {
                AppointEase_Security_Helper::log_error('Database error in check_customer_by_email (appointments)', [
                    'error' => $wpdb->last_error,
                    'email' => $email
                ]);
                return new WP_Error('db_error', 'Database error', array('status' => 500));
            }
            
            if ($appointment) {
                return rest_ensure_response(array(
                    'exists' => true,
                    'name' => $appointment->name,
                    'phone' => $appointment->phone
                ));
            }
            
            return rest_ensure_response(array('exists' => false));
        } catch (Exception $e) {
            AppointEase_Security_Helper::log_error('Exception in check_customer_by_email', [
                'message' => $e->getMessage(),
                'email' => $request->get_param('email')
            ]);
            return new WP_Error('server_error', 'Internal server error', array('status' => 500));
        }
    }
    

}
