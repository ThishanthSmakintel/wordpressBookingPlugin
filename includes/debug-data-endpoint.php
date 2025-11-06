<?php
// Temporary debug endpoint - add to class-api-endpoints.php register_routes()
/*
register_rest_route('appointease/v1', '/debug-data', array(
    'methods' => 'GET',
    'callback' => array($this, 'debug_database_data'),
    'permission_callback' => array($this, 'public_permission')
));
*/

// Add this method to class-api-endpoints.php
public function debug_database_data($request) {
    global $wpdb;
    
    // Get all staff
    $staff = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}appointease_staff ORDER BY id");
    
    // Get appointment at 09:15 on 2025-11-06
    $appointment = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}appointments WHERE DATE(appointment_date) = %s AND TIME(appointment_date) = %s LIMIT 1",
        '2025-11-06', '09:15:00'
    ));
    
    // Get employee for that appointment
    $employee_data = null;
    if ($appointment && $appointment->employee_id) {
        $employee_data = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}appointease_staff WHERE id = %d",
            $appointment->employee_id
        ));
    }
    
    return rest_ensure_response(array(
        'all_staff' => $staff,
        'appointment_09_15' => $appointment,
        'appointment_employee' => $employee_data,
        'staff_count' => count($staff),
        'timestamp' => current_time('mysql')
    ));
}
