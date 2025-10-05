<?php
/**
 * Unit tests for main booking plugin class
 */

class Test_Booking_Plugin extends WP_UnitTestCase {

    public function setUp(): void {
        parent::setUp();
        $this->plugin = new Booking_Plugin();
    }

    public function test_plugin_activation() {
        $this->plugin->activate();
        
        // Test database tables created
        global $wpdb;
        $tables = [
            $wpdb->prefix . 'appointments',
            $wpdb->prefix . 'appointease_services',
            $wpdb->prefix . 'appointease_staff',
            $wpdb->prefix . 'appointease_settings'
        ];
        
        foreach ($tables as $table) {
            $this->assertEquals($table, $wpdb->get_var("SHOW TABLES LIKE '$table'"));
        }
    }

    public function test_rest_api_routes_registered() {
        $routes = rest_get_server()->get_routes();
        
        $expected_routes = [
            '/appointease/v1/appointments',
            '/appointease/v1/services',
            '/appointease/v1/staff',
            '/appointease/v1/availability'
        ];
        
        foreach ($expected_routes as $route) {
            $this->assertArrayHasKey($route, $routes);
        }
    }

    public function test_gutenberg_block_registered() {
        $registered_blocks = WP_Block_Type_Registry::get_instance()->get_all_registered();
        $this->assertArrayHasKey('appointease/booking-form', $registered_blocks);
    }
}