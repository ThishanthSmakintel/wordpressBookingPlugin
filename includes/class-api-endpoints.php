<?php

class Booking_API_Endpoints {
    
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    public function register_routes() {
        register_rest_route('booking/v1', '/services', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_services'),
            'permission_callback' => '__return_true'
        ));
        
        register_rest_route('booking/v1', '/staff', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_staff'),
            'permission_callback' => '__return_true'
        ));
        
        register_rest_route('booking/v1', '/availability', array(
            'methods' => 'POST',
            'callback' => array($this, 'check_availability'),
            'permission_callback' => '__return_true'
        ));
        
        register_rest_route('booking/v1', '/appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_appointment'),
            'permission_callback' => '__return_true'
        ));
        
        register_rest_route('booking/v1', '/appointments/(?P<id>[a-zA-Z0-9\-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_appointment'),
            'permission_callback' => '__return_true'
        ));
        
        register_rest_route('booking/v1', '/appointments/(?P<id>[a-zA-Z0-9\-]+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'cancel_appointment'),
            'permission_callback' => '__return_true'
        ));
        
        register_rest_route('booking/v1', '/appointments/(?P<id>[a-zA-Z0-9\-]+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'reschedule_appointment'),
            'permission_callback' => '__return_true'
        ));
    }
    
    public function get_services() {
        global $wpdb;
        $table = $wpdb->prefix . 'booking_services';
        $services = $wpdb->get_results("SELECT * FROM $table ORDER BY name");
        return rest_ensure_response($services);
    }
    
    public function get_staff() {
        global $wpdb;
        $table = $wpdb->prefix . 'booking_staff';
        $staff = $wpdb->get_results("SELECT * FROM $table ORDER BY name");
        return rest_ensure_response($staff);
    }
    
    public function check_availability($request) {
        global $wpdb;
        $params = $request->get_json_params();
        $date = $params['date'];
        $employee_id = $params['employee_id'];
        
        $table = $wpdb->prefix . 'booking_availability';
        $unavailable = $wpdb->get_col($wpdb->prepare(
            "SELECT time_slot FROM $table WHERE staff_id = %d AND date = %s AND is_available = 0",
            $employee_id, $date
        ));
        
        return rest_ensure_response(array('unavailable' => $unavailable));
    }
    
    public function create_appointment($request) {
        global $wpdb;
        $params = $request->get_json_params();
        
        $table = $wpdb->prefix . 'appointments';
        $strong_id = $this->generate_strong_id();
        
        $result = $wpdb->insert($table, array(
            'name' => $params['name'],
            'email' => $params['email'],
            'phone' => $params['phone'],
            'appointment_date' => $params['date'],
            'status' => 'confirmed',
            'strong_id' => $strong_id
        ));
        
        if ($result) {
            return rest_ensure_response(array('id' => $wpdb->insert_id, 'strong_id' => $strong_id));
        }
        
        return new WP_Error('booking_failed', 'Failed to create appointment', array('status' => 500));
    }
    
    private function generate_strong_id() {
        $year = date('Y');
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $result = '';
        for ($i = 0; $i < 6; $i++) {
            $result .= $chars[rand(0, strlen($chars) - 1)];
        }
        return "APT-{$year}-{$result}";
    }
    
    public function get_appointment($request) {
        global $wpdb;
        $id = $request['id'];
        $table = $wpdb->prefix . 'appointments';
        
        // Try to find by strong_id first, then by numeric id
        if (strpos($id, 'APT-') === 0) {
            $appointment = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $table WHERE strong_id = %s", $id
            ));
        } else {
            $appointment = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $table WHERE id = %d", $id
            ));
        }
        
        if ($appointment) {
            return rest_ensure_response($appointment);
        }
        
        return new WP_Error('not_found', 'Appointment not found', array('status' => 404));
    }
    
    public function cancel_appointment($request) {
        global $wpdb;
        $id = $request['id'];
        $table = $wpdb->prefix . 'appointments';
        
        if (strpos($id, 'APT-') === 0) {
            $result = $wpdb->update($table, 
                array('status' => 'cancelled'),
                array('strong_id' => $id)
            );
        } else {
            $result = $wpdb->update($table, 
                array('status' => 'cancelled'),
                array('id' => $id)
            );
        }
        
        if ($result) {
            return rest_ensure_response(array('success' => true));
        }
        
        return new WP_Error('update_failed', 'Failed to cancel appointment', array('status' => 500));
    }
    
    public function reschedule_appointment($request) {
        global $wpdb;
        $id = $request['id'];
        $params = $request->get_json_params();
        $table = $wpdb->prefix . 'appointments';
        
        if (strpos($id, 'APT-') === 0) {
            $result = $wpdb->update($table, 
                array('appointment_date' => $params['new_date']),
                array('strong_id' => $id)
            );
        } else {
            $result = $wpdb->update($table, 
                array('appointment_date' => $params['new_date']),
                array('id' => $id)
            );
        }
        
        if ($result) {
            return rest_ensure_response(array('success' => true));
        }
        
        return new WP_Error('update_failed', 'Failed to reschedule appointment', array('status' => 500));
    }
}