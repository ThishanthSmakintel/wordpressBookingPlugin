<?php
/**
 * Main plugin class
 */
class Booking_Plugin {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->init_hooks();
    }
    
    private function init_hooks() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_ajax_book_appointment', array($this, 'book_appointment'));
        add_action('wp_ajax_nopriv_book_appointment', array($this, 'book_appointment'));
        add_action('wp_ajax_get_appointment', array($this, 'get_appointment'));
        add_action('wp_ajax_nopriv_get_appointment', array($this, 'get_appointment'));
        add_action('wp_ajax_cancel_appointment', array($this, 'cancel_appointment'));
        add_action('wp_ajax_reschedule_appointment', array($this, 'reschedule_appointment'));
        add_action('wp_ajax_nopriv_reschedule_appointment', array($this, 'reschedule_appointment'));
        add_action('wp_ajax_get_services', array($this, 'get_services'));
        add_action('wp_ajax_nopriv_get_services', array($this, 'get_services'));
        add_action('wp_ajax_get_staff', array($this, 'get_staff_list'));
        add_action('wp_ajax_nopriv_get_staff', array($this, 'get_staff_list'));
        add_action('wp_ajax_check_availability', array($this, 'check_availability'));
        add_action('wp_ajax_nopriv_check_availability', array($this, 'check_availability'));
    }
    
    public function init() {
        load_plugin_textdomain('booking-plugin', false, dirname(plugin_basename(__FILE__)) . '/languages/');
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_block_editor_assets'));
        $this->register_blocks();
    }
    
    public function register_blocks() {
        register_block_type('appointease/booking-form', [
            'render_callback' => array($this, 'render_booking_block'),
            'editor_script' => 'booking-plugin-blocks',
            'supports' => [
                'html' => false,
                'align' => true
            ],
            'attributes' => [
                'formTitle' => ['type' => 'string', 'default' => 'AppointEase Booking']
            ]
        ]);
    }
    
    public function render_booking_block($attributes, $content) {
        ob_start();
        ?>
        <div class="appointease-booking-wrapper">
            <div class="appointease-booking-container" id="appointease-booking">
                <div class="appointease-booking">
                    <div class="appointease-booking-header">
                        <div class="appointease-logo">
                            <span class="logo-icon">A</span>
                            <span class="logo-text">AppointEase</span>
                        </div>
                        <div class="manage-appointment">
                            <input type="text" placeholder="Enter Appointment ID" id="manage-appointment-id" />
                            <button onclick="handleManageFromInput()">Manage</button>
                        </div>
                    </div>
                    <div class="appointease-booking-content">
                        <div class="loading-initial">
                            <div class="spinner"></div>
                            <p>Loading booking system...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script>
        function handleManageFromInput() {
            const id = document.getElementById('manage-appointment-id').value;
            if (window.BookingApp && window.BookingApp.handleManageAppointment) {
                window.BookingApp.setAppointmentId(id);
                window.BookingApp.handleManageAppointment();
            }
        }
        </script>
        <?php
        return ob_get_clean();
    }
    
    public function enqueue_block_editor_assets() {
        // Check if build file exists, fallback to src
        $script_path = file_exists(BOOKING_PLUGIN_PATH . 'build/index.js') 
            ? BOOKING_PLUGIN_URL . 'build/index.js'
            : BOOKING_PLUGIN_URL . 'blocks/index.js';
        
        $asset_file = BOOKING_PLUGIN_PATH . 'build/index.asset.php';
        $asset_data = file_exists($asset_file) ? include $asset_file : [
            'dependencies' => ['wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n'],
            'version' => BOOKING_PLUGIN_VERSION
        ];
        
        wp_register_script(
            'booking-plugin-blocks',
            $script_path,
            $asset_data['dependencies'],
            $asset_data['version'],
            true
        );
        
        wp_enqueue_script('booking-plugin-blocks');
        
        // Enqueue editor styles
        wp_enqueue_style(
            'booking-plugin-editor',
            BOOKING_PLUGIN_URL . 'build/index.css',
            array(),
            $asset_data['version']
        );
        
        // Enqueue frontend styles for editor preview
        wp_enqueue_style(
            'booking-plugin-frontend-editor',
            BOOKING_PLUGIN_URL . 'build/frontend.css',
            array(),
            $asset_data['version']
        );
        
        // Set script translations
        wp_set_script_translations('booking-plugin-blocks', 'booking-plugin');
    }
    
    public function enqueue_scripts() {
        // Use bundled frontend build
        $frontend_asset_file = BOOKING_PLUGIN_PATH . 'build/frontend.asset.php';
        $frontend_asset_data = file_exists($frontend_asset_file) ? include $frontend_asset_file : [
            'dependencies' => [],
            'version' => BOOKING_PLUGIN_VERSION
        ];
        
        wp_enqueue_script('toastify', 'https://unpkg.com/toastify-js@1.12.0/src/toastify.js', array(), '1.12.0', true);
        wp_enqueue_style('toastify-css', 'https://unpkg.com/toastify-js@1.12.0/src/toastify.css', array(), '1.12.0');
        
        wp_enqueue_script(
            'booking-frontend',
            BOOKING_PLUGIN_URL . 'build/frontend.js',
            array_merge($frontend_asset_data['dependencies'], ['toastify']),
            $frontend_asset_data['version'],
            true
        );
        
        wp_enqueue_style(
            'booking-frontend-css',
            BOOKING_PLUGIN_URL . 'build/frontend.css',
            [],
            $frontend_asset_data['version']
        );
        

        wp_localize_script('booking-frontend', 'booking_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('booking_nonce')
        ));
        
        // Add admin scripts
        if (is_admin()) {
            wp_localize_script('appointease-admin', 'appointease_ajax', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('appointease_nonce')
            ));
        }
    }
    
    public function book_appointment() {
        check_ajax_referer('booking_nonce', 'nonce');
        
        global $wpdb;
        
        $name = sanitize_text_field($_POST['name']);
        $email = sanitize_email($_POST['email']);
        $phone = sanitize_text_field($_POST['phone']);
        $date = sanitize_text_field($_POST['date']);
        $service_id = isset($_POST['service_id']) ? intval($_POST['service_id']) : null;
        $employee_id = isset($_POST['employee_id']) ? intval($_POST['employee_id']) : null;
        
        $result = $wpdb->insert(
            $wpdb->prefix . 'appointments',
            array(
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'appointment_date' => $date,
                'status' => 'confirmed',
                'service_id' => $service_id,
                'employee_id' => $employee_id
            )
        );
        
        if ($result) {
            $appointment_id = $wpdb->insert_id;
            $this->send_booking_email($name, $email, $appointment_id, $date);
            wp_send_json_success(array('message' => __('Appointment booked successfully!', 'booking-plugin'), 'id' => $appointment_id));
        } else {
            wp_send_json_error(__('Failed to book appointment', 'booking-plugin'));
        }
    }
    
    public function cancel_appointment() {
        check_ajax_referer('booking_nonce', 'nonce');
        
        global $wpdb;
        
        $id = intval($_POST['id']);
        
        $result = $wpdb->update(
            $wpdb->prefix . 'appointments',
            array('status' => 'cancelled'),
            array('id' => $id)
        );
        
        if ($result !== false) {
            $appointment = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}appointments WHERE id = %d", $id));
            if ($appointment) {
                $this->send_cancellation_email($appointment->name, $appointment->email, $id);
            }
            wp_send_json_success(__('Appointment cancelled successfully!', 'booking-plugin'));
        } else {
            wp_send_json_error(__('Failed to cancel appointment', 'booking-plugin'));
        }
    }
    
    public function get_appointment() {
        check_ajax_referer('booking_nonce', 'nonce');
        
        global $wpdb;
        
        $id = intval($_POST['id']);
        
        $appointment = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}appointments WHERE id = %d",
                $id
            ),
            ARRAY_A
        );
        
        if ($appointment) {
            wp_send_json_success($appointment);
        } else {
            wp_send_json_error(__('Appointment not found', 'booking-plugin'));
        }
    }
    
    public function reschedule_appointment() {
        check_ajax_referer('booking_nonce', 'nonce');
        
        global $wpdb;
        
        $id = intval($_POST['id']);
        $new_date = sanitize_text_field($_POST['new_date']);
        
        $result = $wpdb->update(
            $wpdb->prefix . 'appointments',
            array('appointment_date' => $new_date),
            array('id' => $id)
        );
        
        if ($result !== false) {
            $appointment = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}appointments WHERE id = %d", $id));
            if ($appointment) {
                $this->send_reschedule_email($appointment->name, $appointment->email, $id, $new_date);
            }
            wp_send_json_success(__('Appointment rescheduled successfully!', 'booking-plugin'));
        } else {
            wp_send_json_error(__('Failed to reschedule appointment', 'booking-plugin'));
        }
    }
    
    public function get_services() {
        global $wpdb;
        $services = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}appointease_services ORDER BY name");
        wp_send_json_success($services);
    }
    
    public function get_staff_list() {
        global $wpdb;
        $staff = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}appointease_staff ORDER BY name");
        wp_send_json_success($staff);
    }
    
    public function check_availability() {
        check_ajax_referer('booking_nonce', 'nonce');
        global $wpdb;
        
        $date = sanitize_text_field($_POST['date']);
        $time = sanitize_text_field($_POST['time']);
        $employee_id = intval($_POST['employee_id']);
        
        $datetime = $date . ' ' . $time . ':00';
        
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}appointments WHERE appointment_date = %s AND employee_id = %d AND status = 'confirmed'",
            $datetime, $employee_id
        ));
        
        wp_send_json_success(array('available' => $existing == 0));
    }
    
    private function send_booking_email($name, $email, $appointment_id, $date) {
        $subject = 'Appointment Confirmation - ID: ' . $appointment_id;
        $message = "Dear {$name},\n\nYour appointment has been confirmed.\n\nAppointment ID: {$appointment_id}\nDate: {$date}\n\nUse your appointment ID to manage your booking.\n\nThank you!";
        wp_mail($email, $subject, $message);
    }
    
    private function send_cancellation_email($name, $email, $appointment_id) {
        $subject = 'Appointment Cancelled - ID: ' . $appointment_id;
        $message = "Dear {$name},\n\nYour appointment (ID: {$appointment_id}) has been cancelled.\n\nThank you!";
        wp_mail($email, $subject, $message);
    }
    
    private function send_reschedule_email($name, $email, $appointment_id, $new_date) {
        $subject = 'Appointment Rescheduled - ID: ' . $appointment_id;
        $message = "Dear {$name},\n\nYour appointment (ID: {$appointment_id}) has been rescheduled.\n\nNew Date: {$new_date}\n\nThank you!";
        wp_mail($email, $subject, $message);
    }
}