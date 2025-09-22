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
    

    
    private function init_hooks() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
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
                'align' => ['wide', 'full'],
                'spacing' => [
                    'margin' => true,
                    'padding' => true
                ],
                'color' => [
                    'background' => true,
                    'text' => true,
                    'gradients' => true,
                    'link' => true,
                    '__experimentalDefaultControls' => [
                        'background' => true,
                        'text' => true
                    ]
                ],
                'typography' => [
                    'fontSize' => true,
                    'lineHeight' => true,
                    'fontFamily' => true,
                    'fontWeight' => true
                ],
                'dimensions' => [
                    'minHeight' => true
                ],
                '__experimentalBorder' => [
                    'color' => true,
                    'radius' => true,
                    'style' => true,
                    'width' => true
                ]
            ],
            'attributes' => [
                'formTitle' => ['type' => 'string', 'default' => 'AppointEase Booking'],
                'headerBgColor' => ['type' => 'string', 'default' => ''],
                'headerTextColor' => ['type' => 'string', 'default' => ''],
                'cardBgColor' => ['type' => 'string', 'default' => ''],
                'cardBorderColor' => ['type' => 'string', 'default' => ''],
                'buttonBgColor' => ['type' => 'string', 'default' => ''],
                'buttonTextColor' => ['type' => 'string', 'default' => '']
            ]
        ]);
    }
    
    public function render_booking_block($attributes, $content) {
        $custom_styles = '';
        
        // Handle WordPress color attributes
        if (!empty($attributes['backgroundColor'])) {
            $custom_styles .= '--card-bg:var(--wp--preset--color--' . esc_attr($attributes['backgroundColor']) . ');';
        }
        if (!empty($attributes['textColor'])) {
            $custom_styles .= '--text-primary:var(--wp--preset--color--' . esc_attr($attributes['textColor']) . ');';
        }
        if (!empty($attributes['style']['color']['background'])) {
            $custom_styles .= '--card-bg:' . esc_attr($attributes['style']['color']['background']) . ';';
        }
        if (!empty($attributes['style']['color']['text'])) {
            $custom_styles .= '--text-primary:' . esc_attr($attributes['style']['color']['text']) . ';';
        }
        
        // Legacy custom color attributes
        if (!empty($attributes['headerBgColor'])) {
            $custom_styles .= '--header-bg:' . esc_attr($attributes['headerBgColor']) . ';';
        }
        if (!empty($attributes['headerTextColor'])) {
            $custom_styles .= '--header-text:' . esc_attr($attributes['headerTextColor']) . ';';
        }
        if (!empty($attributes['cardBgColor'])) {
            $custom_styles .= '--card-bg:' . esc_attr($attributes['cardBgColor']) . ';';
        }
        if (!empty($attributes['cardBorderColor'])) {
            $custom_styles .= '--card-border:' . esc_attr($attributes['cardBorderColor']) . ';';
        }
        if (!empty($attributes['buttonBgColor'])) {
            $custom_styles .= '--button-bg:' . esc_attr($attributes['buttonBgColor']) . ';';
        }
        if (!empty($attributes['buttonTextColor'])) {
            $custom_styles .= '--button-text:' . esc_attr($attributes['buttonTextColor']) . ';';
        }
        
        // Get custom button text from settings
        $button_text = Booking_Settings::get_button_text();
        
        $wrapper_attributes = get_block_wrapper_attributes([
            'style' => $custom_styles,
            'class' => 'appointease-booking-wrapper',
            'data-button-text' => esc_attr($button_text)
        ]);
        
        ob_start();
        ?>
        <div <?php echo $wrapper_attributes; ?>>
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
                        <!-- React app will load here -->
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
            array('wp-edit-blocks'),
            $asset_data['version']
        );
        
        wp_add_inline_style('booking-plugin-editor', '
            .editor-loading {
                text-align: center;
                padding: 60px 20px;
                color: #666;
            }
            .editor-loading .spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #1CBC9B;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            .appointment-card.current-appointment {
                background-color: #fff7ed !important;
                border-left: 4px solid #f97316 !important;
            }
            .appointment-list-item.current-appointment {
                background-color: #fff7ed !important;
                border-left: 4px solid #f97316 !important;
            }
        ');
        
        // Enqueue frontend styles for editor preview
        wp_enqueue_style(
            'booking-plugin-frontend-editor',
            BOOKING_PLUGIN_URL . 'build/frontend.css',
            array('remixicon'),
            $asset_data['version']
        );
        
        wp_enqueue_style('remixicon-editor', 'https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.css', array(), '4.0.0');
        

        
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
        wp_enqueue_style('fontawesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', array(), '6.4.0');
        
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
            ['fontawesome'],
            $frontend_asset_data['version']
        );
        

        

        wp_localize_script('booking-frontend', 'bookingAPI', array(
            'root' => esc_url_raw(rest_url('appointease/v1/')),
            'nonce' => wp_create_nonce('wp_rest')
        ));
        
        wp_localize_script('booking-frontend', 'bookingApiSettings', array(
            'root' => esc_url_raw(rest_url()),
            'nonce' => wp_create_nonce('wp_rest')
        ));
        
        wp_localize_script('booking-frontend', 'booking_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('wp_rest')
        ));
        
        // Pass appearance settings to frontend
        wp_localize_script('booking-frontend', 'appointeaseSettings', array(
            'buttonText' => Booking_Settings::get_button_text(),
            'primaryColor' => Booking_Settings::get_primary_color()
        ));
        
        // Add admin scripts
        if (is_admin()) {
            wp_localize_script('appointease-admin', 'appointeaseAPI', array(
                'root' => esc_url_raw(rest_url('appointease/v1/')),
                'nonce' => wp_create_nonce('wp_rest')
            ));
        }
    }
    

    
    private function send_booking_email($name, $email, $appointment_id, $date) {
        $this->send_template_email('confirmation', $email, array(
            'customer_name' => $name,
            'appointment_id' => $appointment_id,
            'appointment_date' => $date,
            'customer_email' => $email
        ));
        $this->send_admin_notification($name, $email, $appointment_id, $date);
    }
    
    private function send_cancellation_email($name, $email, $appointment_id) {
        $this->send_template_email('cancellation', $email, array(
            'customer_name' => $name,
            'appointment_id' => $appointment_id
        ));
    }
    
    private function send_reschedule_email($name, $email, $appointment_id, $new_date) {
        $this->send_template_email('reschedule', $email, array(
            'customer_name' => $name,
            'appointment_id' => $appointment_id,
            'appointment_date' => $new_date
        ));
    }
    
    private function send_template_email($type, $email, $variables = array()) {
        global $wpdb;
        
        $template = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}appointease_email_templates WHERE type = %s AND is_active = 1 LIMIT 1",
            $type
        ));
        
        if (!$template) return false;
        
        $defaults = array(
            'business_name' => get_bloginfo('name'),
            'service_name' => 'General Service',
            'staff_name' => 'Staff Member',
            'duration' => '30',
            'total_amount' => '0.00'
        );
        
        $variables = array_merge($defaults, $variables);
        
        $subject = $template->subject;
        $body = $template->body;
        
        foreach ($variables as $key => $value) {
            $subject = str_replace('{{' . $key . '}}', $value, $subject);
            $body = str_replace('{{' . $key . '}}', $value, $body);
        }
        
        return wp_mail($email, $subject, $body);
    }
    
    private function send_admin_notification($name, $email, $appointment_id, $date) {
        $admin_email = get_option('admin_email');
        $this->send_template_email('admin_notification', $admin_email, array(
            'customer_name' => $name,
            'customer_email' => $email,
            'appointment_id' => $appointment_id,
            'appointment_date' => $date
        ));
    }
    
    public function __construct() {
        $this->init_hooks();
        $this->init_ajax_hooks();
    }
    
    private function init_ajax_hooks() {
        add_action('wp_ajax_book_appointment', array($this, 'ajax_book_appointment'));
        add_action('wp_ajax_nopriv_book_appointment', array($this, 'ajax_book_appointment'));
        add_action('wp_ajax_cancel_appointment', array($this, 'ajax_cancel_appointment'));
        add_action('wp_ajax_reschedule_appointment', array($this, 'ajax_reschedule_appointment'));
    }
    
    public function ajax_book_appointment() {
        check_ajax_referer('wp_rest', 'nonce');
        
        if (!isset($_POST['name'], $_POST['email'], $_POST['phone'], $_POST['date'])) {
            wp_send_json_error('Missing required fields');
        }
        
        global $wpdb;
        $name = sanitize_text_field($_POST['name']);
        $email = sanitize_email($_POST['email']);
        $phone = sanitize_text_field($_POST['phone']);
        $date = sanitize_text_field($_POST['date']);
        
        if (empty($name) || empty($email) || empty($date)) {
            wp_send_json_error('Name, email and date are required');
        }
        
        $result = $wpdb->insert(
            $wpdb->prefix . 'appointments',
            array(
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'appointment_date' => $date,
                'status' => 'confirmed'
            ),
            array('%s', '%s', '%s', '%s', '%s')
        );
        
        if ($result) {
            $appointment_id = $wpdb->insert_id;
            $this->send_booking_email($name, $email, $appointment_id, $date);
            wp_send_json_success(array('message' => 'Appointment booked successfully!', 'id' => $appointment_id));
        } else {
            wp_send_json_error('Failed to book appointment');
        }
    }
    
    public function ajax_cancel_appointment() {
        check_ajax_referer('wp_rest', 'nonce');
        
        if (!current_user_can('manage_options') && !isset($_POST['id'])) {
            wp_send_json_error('Unauthorized or missing ID');
        }
        
        global $wpdb;
        $id = intval($_POST['id']);
        
        $result = $wpdb->update(
            $wpdb->prefix . 'appointments',
            array('status' => 'cancelled'),
            array('id' => $id),
            array('%s'),
            array('%d')
        );
        
        if ($result !== false) {
            $appointment = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}appointments WHERE id = %d", $id));
            if ($appointment) {
                $this->send_cancellation_email($appointment->name, $appointment->email, $id);
            }
            wp_send_json_success('Appointment cancelled successfully!');
        } else {
            wp_send_json_error('Failed to cancel appointment');
        }
    }
    
    public function ajax_reschedule_appointment() {
        check_ajax_referer('wp_rest', 'nonce');
        
        if (!current_user_can('manage_options') && (!isset($_POST['id']) || !isset($_POST['new_date']))) {
            wp_send_json_error('Unauthorized or missing parameters');
        }
        
        global $wpdb;
        $id = intval($_POST['id']);
        $new_date = sanitize_text_field($_POST['new_date']);
        
        if (empty($new_date) || strtotime($new_date) === false) {
            wp_send_json_error('Invalid date format');
        }
        
        $result = $wpdb->update(
            $wpdb->prefix . 'appointments',
            array('appointment_date' => $new_date),
            array('id' => $id),
            array('%s'),
            array('%d')
        );
        
        if ($result !== false) {
            $appointment = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}appointments WHERE id = %d", $id));
            if ($appointment) {
                $this->send_reschedule_email($appointment->name, $appointment->email, $id, $new_date);
            }
            wp_send_json_success('Appointment rescheduled successfully!');
        } else {
            wp_send_json_error('Failed to reschedule appointment');
        }
    }
    

}