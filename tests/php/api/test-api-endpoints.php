<?php
/**
 * API endpoint tests
 */

class Test_API_Endpoints extends WP_UnitTestCase {

    public function setUp(): void {
        parent::setUp();
        global $wp_rest_server;
        $this->server = $wp_rest_server = new WP_REST_Server;
        do_action('rest_api_init');
    }

    public function test_create_appointment_endpoint() {
        $request = new WP_REST_Request('POST', '/appointease/v1/appointments');
        $request->set_body_params([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '1234567890',
            'date' => date('Y-m-d H:i:s', strtotime('+1 day')),
            'service_id' => 1,
            'employee_id' => 1
        ]);
        
        $response = $this->server->dispatch($request);
        $this->assertEquals(200, $response->get_status());
        
        $data = $response->get_data();
        $this->assertArrayHasKey('appointment_id', $data);
        $this->assertArrayHasKey('strong_id', $data);
    }

    public function test_get_services_endpoint() {
        $request = new WP_REST_Request('GET', '/appointease/v1/services');
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(200, $response->get_status());
        $this->assertIsArray($response->get_data());
    }

    public function test_availability_check_endpoint() {
        $request = new WP_REST_Request('POST', '/appointease/v1/availability');
        $request->set_body_params([
            'date' => date('Y-m-d', strtotime('+1 day')),
            'employee_id' => 1
        ]);
        
        $response = $this->server->dispatch($request);
        $this->assertEquals(200, $response->get_status());
        
        $data = $response->get_data();
        $this->assertArrayHasKey('unavailable', $data);
    }

    public function test_reschedule_availability_endpoint() {
        // Create test appointment first
        global $wpdb;
        $wpdb->insert($wpdb->prefix . 'appointments', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'appointment_date' => date('Y-m-d H:i:s', strtotime('+1 day')),
            'employee_id' => 1,
            'service_id' => 1,
            'strong_id' => 'APT-2025-000001',
            'status' => 'confirmed'
        ]);
        
        $request = new WP_REST_Request('POST', '/appointease/v1/reschedule-availability');
        $request->set_body_params([
            'date' => date('Y-m-d', strtotime('+1 day')),
            'employee_id' => 1,
            'exclude_appointment_id' => 'APT-2025-000001'
        ]);
        
        $response = $this->server->dispatch($request);
        $this->assertEquals(200, $response->get_status());
        
        $data = $response->get_data();
        $this->assertArrayHasKey('unavailable', $data);
        $this->assertArrayHasKey('excluded_appointment', $data);
    }
}