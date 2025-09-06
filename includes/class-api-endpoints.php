<?php

class Booking_API_Endpoints {
    
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    public function register_routes() {
        // Register appointease/v1 routes
        register_rest_route('appointease/v1', '/appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_appointment'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        register_rest_route('appointease/v1', '/appointments/(?P<id>[a-zA-Z0-9\-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_appointment'),
            'permission_callback' => array($this, 'public_permission'),
            'args' => array(
                'id' => array(
                    'required' => true,
                    'sanitize_callback' => 'sanitize_text_field'
                )
            )
        ));
        
        register_rest_route('appointease/v1', '/appointments/(?P<id>[a-zA-Z0-9\-]+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'cancel_appointment'),
            'permission_callback' => array($this, 'public_permission'),
            'args' => array(
                'id' => array(
                    'required' => true,
                    'sanitize_callback' => 'sanitize_text_field'
                )
            )
        ));
        
        register_rest_route('appointease/v1', '/appointments/(?P<id>[a-zA-Z0-9\-]+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'reschedule_appointment'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        // Keep booking/v1 routes for compatibility
        register_rest_route('booking/v1', '/services', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_services'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        register_rest_route('booking/v1', '/staff', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_staff'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        register_rest_route('booking/v1', '/availability', array(
            'methods' => 'POST',
            'callback' => array($this, 'check_availability'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        register_rest_route('appointease/v1', '/user-appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'get_user_appointments'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        register_rest_route('booking/v1', '/user-appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'get_user_appointments'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        // Debug endpoint to see all appointments
        register_rest_route('appointease/v1', '/debug/appointments', array(
            'methods' => 'GET',
            'callback' => array($this, 'debug_appointments'),
            'permission_callback' => array($this, 'public_permission')
        ));
        
        // Fix existing appointments without strong_id
        register_rest_route('appointease/v1', '/fix-appointments', array(
            'methods' => 'POST',
            'callback' => array($this, 'fix_existing_appointments'),
            'permission_callback' => array($this, 'public_permission')
        ));
    }
    
    public function get_services() {
        global $wpdb;
        $table = $wpdb->prefix . 'appointease_services';
        $services = $wpdb->get_results($wpdb->prepare("SELECT * FROM {$table} ORDER BY name"));
        return rest_ensure_response($services);
    }
    
    public function get_staff() {
        global $wpdb;
        $table = $wpdb->prefix . 'appointease_staff';
        $staff = $wpdb->get_results($wpdb->prepare("SELECT * FROM {$table} ORDER BY name"));
        return rest_ensure_response($staff);
    }
    
    public function check_availability($request) {
        global $wpdb;
        $params = $request->get_json_params();
        
        if (!isset($params['date'], $params['employee_id'])) {
            return new WP_Error('missing_params', 'Date and employee ID are required', array('status' => 400));
        }
        
        $date = sanitize_text_field($params['date']);
        $employee_id = intval($params['employee_id']);
        
        // Check existing appointments for this staff member on this date
        $appointments_table = $wpdb->prefix . 'appointments';
        $booked_times = $wpdb->get_col($wpdb->prepare(
            "SELECT TIME_FORMAT(appointment_date, '%%H:%%i') as time_slot FROM {$appointments_table} WHERE employee_id = %d AND DATE(appointment_date) = %s AND status = 'confirmed'",
            $employee_id, $date
        ));
        
        return rest_ensure_response(array('unavailable' => $booked_times));
    }
    
    public function create_appointment($request) {
        global $wpdb;
        $params = $request->get_json_params();
        
        if (!isset($params['name'], $params['email'], $params['date'])) {
            return new WP_Error('missing_fields', 'Required fields missing', array('status' => 400));
        }
        
        $name = sanitize_text_field($params['name']);
        $email = sanitize_email($params['email']);
        $phone = sanitize_text_field($params['phone'] ?? '');
        $date = sanitize_text_field($params['date']);
        $service_id = intval($params['service_id'] ?? 1);
        $employee_id = intval($params['employee_id'] ?? 1);
        
        if (empty($name) || empty($email) || empty($date)) {
            return new WP_Error('invalid_data', 'Name, email and date are required', array('status' => 400));
        }
        
        $table = $wpdb->prefix . 'appointments';
        
        // Insert without strong_id first
        $result = $wpdb->insert($table, array(
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'appointment_date' => $date,
            'status' => 'confirmed',
            'service_id' => $service_id,
            'employee_id' => $employee_id
        ), array('%s', '%s', '%s', '%s', '%s', '%d', '%d'));
        
        if ($result) {
            $appointment_id = $wpdb->insert_id;
            
            // Generate strong_id using the actual database ID
            $strong_id = sprintf('APT-%d-%06d', date('Y'), $appointment_id);
            
            // Update the record with strong_id
            $wpdb->update(
                $table,
                array('strong_id' => $strong_id),
                array('id' => $appointment_id),
                array('%s'),
                array('%d')
            );
            
            return rest_ensure_response(array(
                'id' => $appointment_id, 
                'strong_id' => $strong_id,
                'message' => 'Appointment booked successfully!'
            ));
        }
        
        return new WP_Error('booking_failed', 'Failed to create appointment', array('status' => 500));
    }
    
    private function generate_strong_id() {
        global $wpdb;
        $table = $wpdb->prefix . 'appointments';
        
        do {
            $year = date('Y');
            $chars = '0123456789';
            $result = '';
            for ($i = 0; $i < 6; $i++) {
                $result .= $chars[random_int(0, strlen($chars) - 1)];
            }
            $strong_id = "APT-{$year}-{$result}";
            
            // Check if this ID already exists
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$table} WHERE strong_id = %s", $strong_id
            ));
        } while ($exists > 0);
        
        return $strong_id;
    }
    
    public function get_appointment($request) {
        global $wpdb;
        $id = $request['id'];
        $table = $wpdb->prefix . 'appointments';
        
        // Debug: Log the search ID
        error_log("Searching for appointment with ID: " . $id);
        
        $appointment = null;
        
        // Try to find by strong_id first
        if (strpos($id, 'APT-') === 0) {
            $appointment = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$table} WHERE strong_id = %s", $id
            ));
            
            // Debug: Log the query result
            error_log("Strong ID search result: " . ($appointment ? 'Found' : 'Not found'));
            
            // If not found by strong_id, try to find by numeric part
            if (!$appointment) {
                // Extract numeric part from APT-YYYY-XXXXXX format
                if (preg_match('/APT-\d{4}-(\d+)/', $id, $matches)) {
                    $numeric_id = intval($matches[1]);
                    $appointment = $wpdb->get_row($wpdb->prepare(
                        "SELECT * FROM {$table} WHERE id = %d", $numeric_id
                    ));
                    error_log("Numeric ID search for {$numeric_id}: " . ($appointment ? 'Found' : 'Not found'));
                }
            }
            
            // If still not found, try a broader search
            if (!$appointment) {
                $all_appointments = $wpdb->get_results($wpdb->prepare(
                    "SELECT id, strong_id, name, email FROM {$table} ORDER BY id DESC LIMIT 10"
                ));
                error_log("Recent appointments: " . print_r($all_appointments, true));
                
                // Try to find by partial match
                foreach ($all_appointments as $apt) {
                    if ($apt->strong_id === $id || $apt->id == $id) {
                        $appointment = $wpdb->get_row($wpdb->prepare(
                            "SELECT * FROM {$table} WHERE id = %d", $apt->id
                        ));
                        break;
                    }
                }
            }
        } else {
            // Direct numeric ID search
            $appointment = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$table} WHERE id = %d", intval($id)
            ));
        }
        
        if ($appointment) {
            return rest_ensure_response($appointment);
        }
        
        return new WP_Error('not_found', 'Appointment not found', array('status' => 404));
    }
    
    public function cancel_appointment($request) {
        global $wpdb;
        $id = sanitize_text_field($request['id']);
        
        if (empty($id)) {
            return new WP_Error('missing_id', 'Appointment ID is required', array('status' => 400));
        }
        
        $table = $wpdb->prefix . 'appointments';
        
        if (strpos($id, 'APT-') === 0) {
            $result = $wpdb->update($table, 
                array('status' => 'cancelled'),
                array('strong_id' => $id),
                array('%s'),
                array('%s')
            );
        } else {
            $result = $wpdb->update($table, 
                array('status' => 'cancelled'),
                array('id' => intval($id)),
                array('%s'),
                array('%d')
            );
        }
        
        if ($result) {
            return rest_ensure_response(array('success' => true));
        }
        
        return new WP_Error('update_failed', 'Failed to cancel appointment', array('status' => 500));
    }
    
    public function reschedule_appointment($request) {
        global $wpdb;
        $id = sanitize_text_field($request['id']);
        $params = $request->get_json_params();
        
        if (empty($id) || !isset($params['new_date'])) {
            return new WP_Error('missing_params', 'ID and new date are required', array('status' => 400));
        }
        
        $new_date = sanitize_text_field($params['new_date']);
        
        if (empty($new_date) || strtotime($new_date) === false) {
            return new WP_Error('invalid_date', 'Invalid date format', array('status' => 400));
        }
        
        $table = $wpdb->prefix . 'appointments';
        
        if (strpos($id, 'APT-') === 0) {
            $result = $wpdb->update($table, 
                array('appointment_date' => $new_date),
                array('strong_id' => $id),
                array('%s'),
                array('%s')
            );
        } else {
            $result = $wpdb->update($table, 
                array('appointment_date' => $new_date),
                array('id' => intval($id)),
                array('%s'),
                array('%d')
            );
        }
        
        if ($result) {
            return rest_ensure_response(array('success' => true));
        }
        
        return new WP_Error('update_failed', 'Failed to reschedule appointment', array('status' => 500));
    }
    
    public function get_user_appointments($request) {
        global $wpdb;
        $params = $request->get_json_params();
        
        if (!isset($params['email'])) {
            return new WP_Error('missing_email', 'Email is required', array('status' => 400));
        }
        
        $email = sanitize_email($params['email']);
        
        if (empty($email) || !is_email($email)) {
            return new WP_Error('invalid_email', 'Valid email is required', array('status' => 400));
        }
        
        $table = $wpdb->prefix . 'appointments';
        
        $appointments = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$table} WHERE email = %s ORDER BY appointment_date DESC",
            $email
        ));
        
        return rest_ensure_response($appointments);
    }
    
    public function public_permission($request) {
        return true;
    }
    
    public function appointment_permission($request) {
        return true; // Allow public access for appointment management
    }
    
    public function debug_appointments($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'appointments';
        
        $appointments = $wpdb->get_results($wpdb->prepare(
            "SELECT id, strong_id, name, email, appointment_date, status FROM {$table} ORDER BY id DESC LIMIT 20"
        ));
        
        return rest_ensure_response(array(
            'table_name' => $table,
            'appointments' => $appointments,
            'total_count' => $wpdb->get_var("SELECT COUNT(*) FROM {$table}"),
            'null_strong_ids' => $wpdb->get_var("SELECT COUNT(*) FROM {$table} WHERE strong_id IS NULL")
        ));
    }
    
    public function fix_existing_appointments($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'appointments';
        
        // Get all appointments without strong_id
        $appointments = $wpdb->get_results($wpdb->prepare(
            "SELECT id FROM {$table} WHERE strong_id IS NULL OR strong_id = ''"
        ));
        
        $fixed_count = 0;
        foreach ($appointments as $appointment) {
            $strong_id = sprintf('APT-%d-%06d', date('Y'), $appointment->id);
            $result = $wpdb->update(
                $table,
                array('strong_id' => $strong_id),
                array('id' => $appointment->id),
                array('%s'),
                array('%d')
            );
            if ($result) $fixed_count++;
        }
        
        return rest_ensure_response(array(
            'message' => "Fixed {$fixed_count} appointments",
            'fixed_count' => $fixed_count
        ));
    }
}