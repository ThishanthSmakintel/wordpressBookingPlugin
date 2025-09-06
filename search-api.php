<?php
class Appointease_REST_Controller extends WP_REST_Controller {
    
    public function __construct() {
        $this->namespace = 'appointease/v1';
        $this->rest_base = 'appointments';
    }
    
    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->rest_base . '/search', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'search_appointment'),
                'permission_callback' => array($this, 'search_permissions_check'),
                'args' => array(
                    'id' => array(
                        'required' => true,
                        'validate_callback' => function($param) {
                            return !empty($param);
                        }
                    )
                )
            )
        ));
    }
    
    public function search_permissions_check($request) {
        return true;
    }
    
    public function search_appointment($request) {
        global $wpdb;
        
        $search_id = sanitize_text_field($request->get_param('id'));
        $table_name = $wpdb->prefix . 'appointments';
        
        $appointment = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE id = %s OR strong_id = %s",
            $search_id,
            $search_id
        ));
        
        if ($appointment) {
            return rest_ensure_response(array(
                'found' => true,
                'id' => $appointment->id,
                'strong_id' => $appointment->strong_id,
                'name' => $appointment->name,
                'email' => $appointment->email,
                'appointment_date' => $appointment->appointment_date,
                'status' => $appointment->status
            ));
        }
        
        return rest_ensure_response(array(
            'found' => false,
            'message' => 'No data found in database'
        ));
    }
}

add_action('rest_api_init', function() {
    $controller = new Appointease_REST_Controller();
    $controller->register_routes();
});
?>