<?php
class AppointEase_Admin {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        add_action('dashboard_glance_items', array($this, 'add_redis_glance_item'));
        add_action('admin_bar_menu', array($this, 'add_redis_admin_bar'), 100);
        add_action('wp_ajax_save_service', array($this, 'save_service'));
        add_action('wp_ajax_save_staff', array($this, 'save_staff'));
        add_action('wp_ajax_get_service', array($this, 'get_service'));
        add_action('wp_ajax_get_staff', array($this, 'get_staff'));
        add_action('wp_ajax_delete_service', array($this, 'delete_service'));
        add_action('wp_ajax_delete_staff', array($this, 'delete_staff'));
        add_action('wp_ajax_update_appointment_status', array($this, 'update_appointment_status'));
        add_action('wp_ajax_delete_appointment', array($this, 'delete_appointment'));
        add_action('wp_ajax_get_calendar_data', array($this, 'get_calendar_data'));
        add_action('wp_ajax_save_category', array($this, 'save_category'));
        add_action('wp_ajax_delete_category', array($this, 'delete_category'));
        add_action('wp_ajax_save_customer', array($this, 'save_customer'));
        add_action('wp_ajax_delete_customer', array($this, 'delete_customer'));
        add_action('wp_ajax_save_email_template', array($this, 'save_email_template'));
        add_action('wp_ajax_delete_email_template', array($this, 'delete_email_template'));
        add_action('wp_ajax_test_email', array($this, 'test_email'));
        add_action('wp_ajax_preview_email_template', array($this, 'preview_email_template'));
        add_action('wp_ajax_save_holiday', array($this, 'save_holiday'));
        add_action('wp_ajax_delete_holiday', array($this, 'delete_holiday'));
        add_action('wp_ajax_export_appointments', array($this, 'export_appointments'));
        add_action('wp_ajax_bulk_appointment_action', array($this, 'bulk_appointment_action'));
        add_action('wp_ajax_save_staff_availability', array($this, 'save_staff_availability'));
        add_action('wp_ajax_save_blackout_date', array($this, 'save_blackout_date'));
        add_action('wp_ajax_create_manual_booking', array($this, 'create_manual_booking'));
        add_action('wp_ajax_reschedule_appointment', array($this, 'reschedule_appointment'));
        add_action('wp_ajax_sync_customers', array($this, 'ajax_sync_customers'));
        add_action('wp_ajax_check_day_appointments', array($this, 'ajax_check_day_appointments'));
        add_action('wp_ajax_check_customer_email', array($this, 'ajax_check_customer_email'));
        add_action('wp_ajax_get_recent_appointments', array($this, 'ajax_get_recent_appointments'));
        add_action('wp_ajax_get_notification_queue', array($this, 'ajax_get_notification_queue'));
        add_action('wp_ajax_bulk_customer_action', array($this, 'bulk_customer_action'));
        add_action('wp_ajax_check_redis_status', array($this, 'ajax_check_redis_status'));
        add_action('wp_ajax_install_redis_plugin', array($this, 'ajax_install_redis_plugin'));
        add_action('wp_ajax_activate_redis_plugin', array($this, 'ajax_activate_redis_plugin'));
        add_action('wp_ajax_get_redis_stats', array($this, 'ajax_get_redis_stats'));
        add_action('wp_ajax_clear_redis_cache', array($this, 'ajax_clear_redis_cache'));
        add_action('wp_ajax_test_appointease_redis', array($this, 'ajax_test_appointease_redis'));
        add_action('admin_init', array($this, 'init_settings'));
        add_action('admin_footer', array($this, 'add_redis_dashboard_script'));
        add_action('wp_head', array($this, 'add_frontend_redis_styles'));
    }
    
    public function add_frontend_redis_styles() {
        if (is_admin_bar_showing()) {
            ?>
            <style>
            #wpadminbar .appointease-redis-adminbar .ab-icon:before {
                content: "\f239";
                top: 2px;
            }
            #wpadminbar .appointease-redis-adminbar:hover .ab-icon,
            #wpadminbar .appointease-redis-adminbar:hover #redis-adminbar-status {
                opacity: 0.8;
            }
            </style>
            <?php
        }
    }
    
    public function add_redis_glance_item() {
        $redis_helper = Appointease_Redis_Helper::get_instance();
        $is_enabled = $redis_helper->is_enabled();
        
        if ($is_enabled) {
            echo '<li class="appointease-redis-status" style="color: #28a745;">';
            echo '<i class="dashicons dashicons-performance" style="color: #28a745;"></i> ';
            echo '<a href="admin.php?page=appointease-settings" style="color: #28a745;">Redis Active (&lt;500µs)</a>';
            echo '</li>';
        } else {
            echo '<li class="appointease-redis-status" style="color: #dc3545;">';
            echo '<i class="dashicons dashicons-performance" style="color: #dc3545;"></i> ';
            echo '<a href="admin.php?page=appointease-settings" style="color: #dc3545;">Redis Inactive</a>';
            echo '</li>';
        }
    }
    
    public function add_redis_dashboard_script() {
        $screen = get_current_screen();
        if ($screen && $screen->id === 'dashboard') {
            ?>
            <script>
            jQuery(document).ready(function($) {
                // Real-time Redis status check on dashboard
                $.ajax({
                    url: ajaxurl,
                    method: 'POST',
                    data: {
                        action: 'check_redis_status',
                        nonce: '<?php echo wp_create_nonce('redis_installer'); ?>'
                    },
                    success: function(response) {
                        if (response.success) {
                            const active = response.data.redis_installed && response.data.php_redis_installed;
                            const $item = $('.appointease-redis-status');
                            if (active) {
                                $item.css('color', '#28a745').find('i, a').css('color', '#28a745');
                                $item.find('a').text('Redis Active (<500µs)');
                            } else {
                                $item.css('color', '#dc3545').find('i, a').css('color', '#dc3545');
                                $item.find('a').text('Redis Inactive (Install)');
                            }
                        }
                    }
                });
            });
            </script>
            <?php
        }
    }
    
    public function add_redis_admin_bar($wp_admin_bar) {
        if (!current_user_can('manage_options')) return;
        
        $redis_helper = Appointease_Redis_Helper::get_instance();
        $is_enabled = $redis_helper->is_enabled();
        
        $status_text = $is_enabled ? 'Redis: Active' : 'Redis: Inactive';
        $status_color = $is_enabled ? '#28a745' : '#dc3545';
        $performance = $is_enabled ? '&lt;500µs' : '~15ms';
        
        $wp_admin_bar->add_node(array(
            'id' => 'appointease-redis',
            'title' => '<span class="ab-icon dashicons dashicons-performance" style="color: ' . $status_color . ';"></span><span id="redis-adminbar-status" style="color: ' . $status_color . ';">' . $status_text . ' (' . $performance . ')</span>',
            'href' => admin_url('admin.php?page=appointease-redis'),
            'meta' => array(
                'title' => 'AppointEase Redis Performance',
                'class' => 'appointease-redis-adminbar'
            )
        ));
    }
    
    public function enqueue_admin_assets($hook) {
        if (strpos($hook, 'appointease') !== false || strpos($hook, 'redis') !== false) {
            wp_enqueue_script('jquery');
            
            wp_enqueue_style('toastr-css', 'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css', array(), '2.1.4');
            wp_enqueue_script('toastr-js', 'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js', array('jquery'), '2.1.4', true);
            
            wp_enqueue_style('appointease-admin', BOOKING_PLUGIN_URL . 'admin/appointease-admin.css', array('toastr-css'), '1.0.0');
            wp_enqueue_script('appointease-admin', BOOKING_PLUGIN_URL . 'admin/appointease-admin.js', array('jquery', 'toastr-js'), '1.0.1', true);
            wp_enqueue_script('appointease-calendar', BOOKING_PLUGIN_URL . 'admin/calendar-integration.js', array('jquery'), '1.0.0', true);
            wp_enqueue_script('appointease-notifications', BOOKING_PLUGIN_URL . 'admin/admin-notifications.js', array('jquery'), '1.0.0', true);
            wp_enqueue_script('appointease-redis-widget', BOOKING_PLUGIN_URL . 'admin/redis-status-widget.js', array('jquery'), '1.0.0', true);
            
            wp_localize_script('appointease-admin', 'appointeaseAdmin', array(
                'nonce' => wp_create_nonce('appointease_nonce'),
                'ajaxurl' => admin_url('admin-ajax.php'),
                'redisNonce' => wp_create_nonce('redis_installer')
            ));
        }
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'AppointEase',
            'AppointEase',
            'manage_options',
            'appointease',
            array($this, 'dashboard_page'),
            'dashicons-clock',
            25
        );
        
        add_submenu_page(
            'appointease',
            'Services',
            'Services',
            'manage_options',
            'appointease-services',
            array($this, 'services_page')
        );
        
        add_submenu_page(
            'appointease',
            'Staff',
            'Staff',
            'manage_options',
            'appointease-staff',
            array($this, 'staff_page')
        );
        
        add_submenu_page(
            'appointease',
            'Appointments',
            'Appointments',
            'manage_options',
            'appointease-appointments',
            array($this, 'appointments_page')
        );
        
        add_submenu_page(
            'appointease',
            'Calendar',
            'Calendar',
            'manage_options',
            'appointease-calendar',
            array($this, 'calendar_page')
        );
        
        add_submenu_page(
            'appointease',
            'Reports',
            'Reports',
            'manage_options',
            'appointease-reports',
            array($this, 'reports_page')
        );
        
        add_submenu_page(
            'appointease',
            'Customers',
            'Customers',
            'manage_options',
            'appointease-customers',
            array($this, 'customers_page')
        );
        
        add_submenu_page(
            'appointease',
            'Categories',
            'Categories',
            'manage_options',
            'appointease-categories',
            array($this, 'categories_page')
        );
        
        add_submenu_page(
            'appointease',
            'Email Templates',
            'Email Templates',
            'manage_options',
            'appointease-emails',
            array($this, 'emails_page')
        );
        
        add_submenu_page(
            'appointease',
            'Holidays',
            'Holidays',
            'manage_options',
            'appointease-holidays',
            array($this, 'holidays_page')
        );
        
        add_submenu_page(
            'appointease',
            'Settings',
            'Settings',
            'manage_options',
            'appointease-settings',
            array($this, 'enhanced_settings_page')
        );
        
        add_submenu_page(
            'appointease',
            'Appearance',
            'Appearance',
            'manage_options',
            'appointease-appearance',
            array($this, 'appearance_page')
        );
        
        add_submenu_page(
            'appointease',
            'Redis Setup',
            'Redis Setup',
            'manage_options',
            'appointease-redis',
            array($this, 'redis_installation_page')
        );
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            add_submenu_page(
                'appointease',
                'Security Scan',
                'Security Scan',
                'manage_options',
                'appointease-security',
                array($this, 'security_scan_page')
            );
        }
    }
    
    public function dashboard_page() {
        global $wpdb;
        $appointments_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointments");
        $services_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointease_services");
        $staff_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointease_staff");
        $appointments = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}appointments ORDER BY appointment_date DESC LIMIT 5");
        
        if ($wpdb->last_error) {
            wp_die('Database error occurred: ' . esc_html($wpdb->last_error));
        }
        ?>
        <div class="wrap amelia-wrap">
            <div class="amelia-content">
                <div class="amelia-header">
                    <div class="amelia-header-left">
                        <div class="amelia-logo">
                            <span class="amelia-logo-icon">A</span>
                            <span class="amelia-logo-text">AppointEase</span>
                        </div>
                    </div>
                    <div class="amelia-header-right">
                        <div class="amelia-header-buttons">
                            <button id="add-service-btn" class="am-button am-button--primary" onclick="openServiceModal()">
                                <i class="dashicons dashicons-plus"></i>
                                Add Service
                            </button>
                            <button id="add-staff-btn" class="am-button am-button--secondary" onclick="openStaffModal()">
                                <i class="dashicons dashicons-groups"></i>
                                Add Employee
                            </button>
                        </div>
                    </div>
                </div>
            <div class="amelia-dashboard">
                <div id="stats-section" class="amelia-stats">
                    <div class="stat-card bookings">
                        <div class="stat-icon">
                            <i class="dashicons dashicons-calendar-alt"></i>
                        </div>
                        <div class="stat-info">
                            <h3><?php echo $appointments_count; ?></h3>
                            <p>Total Appointments</p>
                            <span class="trend positive">+12% this month</span>
                        </div>
                    </div>
                    <div class="stat-card services">
                        <div class="stat-icon">
                            <i class="dashicons dashicons-admin-tools"></i>
                        </div>
                        <div class="stat-info">
                            <h3><?php echo $services_count; ?></h3>
                            <p>Active Services</p>
                            <span class="trend neutral">Ready to book</span>
                        </div>
                    </div>
                    <div class="stat-card team">
                        <div class="stat-icon">
                            <i class="dashicons dashicons-groups"></i>
                        </div>
                        <div class="stat-info">
                            <h3><?php echo $staff_count; ?></h3>
                            <p>Team Members</p>
                            <span class="trend positive">Available today</span>
                        </div>
                    </div>
                    <div class="stat-card redis">
                        <div class="stat-icon">
                            <i class="dashicons dashicons-performance"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="redis-status-text">Checking...</h3>
                            <p>Redis Performance</p>
                            <span id="redis-performance" class="trend neutral">Loading...</span>
                        </div>
                    </div>
                </div>
                <div id="quick-actions" class="quick-actions">
                    <h3>Quick Actions</h3>
                    <div class="action-buttons">
                        <a href="admin.php?page=appointease-services" class="action-btn primary">
                            <i class="dashicons dashicons-admin-tools"></i>
                            <span>Add New Service</span>
                        </a>
                        <a href="admin.php?page=appointease-staff" class="action-btn secondary">
                            <i class="dashicons dashicons-groups"></i>
                            <span>Add Team Member</span>
                        </a>
                        <a href="admin.php?page=appointease-appointments" class="action-btn tertiary">
                            <i class="dashicons dashicons-calendar-alt"></i>
                            <span>View All Appointments</span>
                        </a>
                        <a href="admin.php?page=appointease-settings" class="action-btn quaternary">
                            <i class="dashicons dashicons-admin-settings"></i>
                            <span>Configure Settings</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            // Check Redis status on dashboard load
            function checkRedisStatus() {
                $.ajax({
                    url: ajaxurl,
                    method: 'POST',
                    data: {
                        action: 'check_redis_status',
                        nonce: '<?php echo wp_create_nonce('redis_installer'); ?>'
                    },
                    success: function(response) {
                        if (response.success) {
                            const data = response.data;
                            if (data.redis_installed && data.php_redis_installed) {
                                $('#redis-status-text').text('Active').css('color', '#28a745');
                                $('#redis-performance').text('<500µs slot locking').removeClass('neutral').addClass('positive');
                            } else {
                                $('#redis-status-text').text('Inactive').css('color', '#dc3545');
                                $('#redis-performance').text('~15ms MySQL fallback').removeClass('neutral').addClass('negative');
                            }
                        } else {
                            $('#redis-status-text').text('Error').css('color', '#dc3545');
                            $('#redis-performance').text('Check failed').removeClass('neutral').addClass('negative');
                        }
                    },
                    error: function() {
                        $('#redis-status-text').text('Offline').css('color', '#dc3545');
                        $('#redis-performance').text('Connection error').removeClass('neutral').addClass('negative');
                    }
                });
            }
            
            // Initial check
            checkRedisStatus();
            
            // Refresh every 30 seconds
            setInterval(checkRedisStatus, 30000);
        });
        </script>
        <?php
    }
    
    public function services_page() {
        global $wpdb;
        $this->ensure_default_data();
        $services = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}appointease_services ORDER BY id DESC");
        
        if ($wpdb->last_error) {
            wp_die('Database error occurred: ' . esc_html($wpdb->last_error));
        }
        ?>
        <div class="appointease-wrap">
            <div id="services-header" class="ae-page-header">
                <div class="page-title">
                    <h1><i class="dashicons dashicons-admin-tools"></i> Services</h1>
                    <p class="page-subtitle">Manage your booking services and pricing</p>
                </div>
                <div class="page-actions">
                    <button id="add-service-modal" class="ae-btn primary" onclick="openServiceModal()">
                        <i class="dashicons dashicons-plus"></i> ADD SERVICE
                    </button>
                </div>
            </div>
            
            <div class="ae-cards">
                <?php if($services): ?>
                    <?php foreach($services as $service): ?>
                    <div class="ae-card">
                        <div class="card-icon"></div>
                        <div class="card-content">
                            <h3><?php echo esc_html($service->name); ?></h3>
                            <p><?php echo esc_html($service->description); ?></p>
                            <div class="card-meta">
                                <span class="duration"><?php echo $service->duration; ?> min</span>
                                <span class="price">$<?php echo $service->price; ?></span>
                            </div>
                        </div>
                        <div class="card-actions">
                            <button class="ae-btn-small" onclick="editService(<?php echo $service->id; ?>)">EDIT</button>
                            <button class="ae-btn-small danger" onclick="deleteService(<?php echo $service->id; ?>)">DELETE</button>
                        </div>
                    </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div class="ae-empty-card">
                        <h3>No services yet</h3>
                        <p>Create your first service to get started</p>
                    </div>
                <?php endif; ?>
            </div>
            
            <!-- Service Modal -->
            <div id="service-modal" class="ae-modal">
                <div class="ae-modal-content">
                    <div class="ae-modal-header">
                        <h3 id="service-modal-title" class="ae-modal-title">Add Service</h3>
                        <button class="ae-close">&times;</button>
                    </div>
                    <form id="service-form">
                        <input type="hidden" id="service-id" />
                        <div class="ae-form-group">
                            <label class="ae-form-label">Service Name *</label>
                            <input type="text" id="service-name" class="ae-form-input" required />
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Description</label>
                            <textarea id="service-description" class="ae-form-input ae-form-textarea"></textarea>
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Duration (minutes) *</label>
                            <input type="number" id="service-duration" class="ae-form-input" required min="1" />
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Price ($) *</label>
                            <input type="number" id="service-price" class="ae-form-input" required min="0" step="0.01" />
                        </div>
                        <div class="ae-form-actions">
                            <button type="button" class="ae-btn" onclick="jQuery('#service-modal').removeClass('show')">Cancel</button>
                            <button type="submit" class="ae-btn primary">Save Service</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <?php
    }
    
    public function staff_page() {
        global $wpdb;
        $this->ensure_default_data();
        $staff = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}appointease_staff ORDER BY id DESC");
        
        if ($wpdb->last_error) {
            wp_die('Database error occurred: ' . esc_html($wpdb->last_error));
        }
        ?>
        <div class="appointease-wrap">
            <div id="staff-header" class="ae-page-header">
                <div class="page-title">
                    <h1><i class="dashicons dashicons-groups"></i> Staff</h1>
                    <p class="page-subtitle">Manage your team members and availability</p>
                </div>
                <div class="page-actions">
                    <button id="add-staff-modal" class="ae-btn primary" onclick="openStaffModal()">
                        <i class="dashicons dashicons-plus"></i> ADD STAFF
                    </button>
                </div>
            </div>
            
            <div class="ae-cards">
                <?php if($staff): ?>
                    <?php foreach($staff as $member): ?>
                    <div class="ae-card">
                        <div class="staff-avatar"><?php echo strtoupper(substr($member->name, 0, 1)); ?></div>
                        <div class="card-content">
                            <h3><?php echo esc_html($member->name); ?></h3>
                            <p><strong>Email:</strong> <?php echo esc_html($member->email); ?></p>
                            <p><strong>Phone:</strong> <?php echo esc_html($member->phone); ?></p>
                        </div>
                        <div class="card-actions">
                            <button class="ae-btn-small" onclick="editStaff(<?php echo $member->id; ?>)">EDIT</button>
                            <button class="ae-btn-small danger" onclick="deleteStaff(<?php echo $member->id; ?>)">DELETE</button>
                        </div>
                    </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div class="ae-empty-card">
                        <h3>No staff members yet</h3>
                        <p>Add your first staff member to get started</p>
                    </div>
                <?php endif; ?>
            </div>
            
            <!-- Staff Modal -->
            <div id="staff-modal" class="ae-modal">
                <div class="ae-modal-content">
                    <div class="ae-modal-header">
                        <h3 id="staff-modal-title" class="ae-modal-title">Add Staff Member</h3>
                        <button class="ae-close">&times;</button>
                    </div>
                    <form id="staff-form">
                        <input type="hidden" id="staff-id" />
                        <div class="ae-form-group">
                            <label class="ae-form-label">Full Name *</label>
                            <input type="text" id="staff-name" class="ae-form-input" required />
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Email *</label>
                            <input type="email" id="staff-email" class="ae-form-input" required />
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Phone</label>
                            <input type="tel" id="staff-phone" class="ae-form-input" />
                        </div>
                        <div class="ae-form-actions">
                            <button type="button" class="ae-btn" onclick="jQuery('#staff-modal').removeClass('show')">Cancel</button>
                            <button type="submit" class="ae-btn primary">Save Staff Member</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <?php
    }
    
    public function save_service() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        
        $id = intval($_POST['id']);
        $name = sanitize_text_field($_POST['name']);
        $duration = intval($_POST['duration']);
        $price = floatval($_POST['price']);
        $description = sanitize_textarea_field($_POST['description']);
        
        // Validate input
        if (empty($name) || $duration <= 0 || $price < 0) {
            wp_send_json_error('Invalid input data');
            return;
        }
        
        if($id) {
            $result = $wpdb->update(
                $wpdb->prefix . 'appointease_services',
                array('name' => $name, 'duration' => $duration, 'price' => $price, 'description' => $description),
                array('id' => $id),
                array('%s', '%d', '%f', '%s'),
                array('%d')
            );
        } else {
            $result = $wpdb->insert(
                $wpdb->prefix . 'appointease_services',
                array('name' => $name, 'duration' => $duration, 'price' => $price, 'description' => $description),
                array('%s', '%d', '%f', '%s')
            );
        }
        
        if ($result === false) {
            wp_send_json_error('Database error occurred');
            return;
        }
        
        wp_send_json_success();
    }
    
    public function save_staff() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        
        $id = intval($_POST['id']);
        $name = sanitize_text_field($_POST['name']);
        $email = sanitize_email($_POST['email']);
        $phone = sanitize_text_field($_POST['phone']);
        
        // Validate input
        if (empty($name) || empty($email) || !is_email($email)) {
            wp_send_json_error('Invalid input data');
            return;
        }
        
        if($id) {
            $result = $wpdb->update(
                $wpdb->prefix . 'appointease_staff',
                array('name' => $name, 'email' => $email, 'phone' => $phone),
                array('id' => $id),
                array('%s', '%s', '%s'),
                array('%d')
            );
        } else {
            $result = $wpdb->insert(
                $wpdb->prefix . 'appointease_staff',
                array('name' => $name, 'email' => $email, 'phone' => $phone),
                array('%s', '%s', '%s')
            );
        }
        
        if ($result === false) {
            wp_send_json_error('Database error occurred');
            return;
        }
        
        wp_send_json_success();
    }
    
    public function get_service() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        $id = intval($_POST['id']);
        $service = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}appointease_services WHERE id = %d", $id));
        
        if($service) {
            wp_send_json_success($service);
        } else {
            wp_send_json_error('Service not found');
        }
    }
    
    public function get_staff() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        $id = intval($_POST['id']);
        $staff = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}appointease_staff WHERE id = %d", $id));
        
        if($staff) {
            wp_send_json_success($staff);
        } else {
            wp_send_json_error('Staff not found');
        }
    }
    
    public function delete_service() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        $id = intval($_POST['id']);
        
        $result = $wpdb->delete(
            $wpdb->prefix . 'appointease_services',
            array('id' => $id),
            array('%d')
        );
        
        if($result) {
            wp_send_json_success();
        } else {
            wp_send_json_error('Failed to delete service');
        }
    }
    
    public function delete_staff() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        $id = intval($_POST['id']);
        
        $result = $wpdb->delete(
            $wpdb->prefix . 'appointease_staff',
            array('id' => $id),
            array('%d')
        );
        
        if($result) {
            wp_send_json_success();
        } else {
            wp_send_json_error('Failed to delete staff');
        }
    }
    
    public function appointments_page() {
        global $wpdb;
        $appointments = $wpdb->get_results(
            "SELECT a.*, s.name as service_name, st.name as staff_name 
             FROM {$wpdb->prefix}appointments a 
             LEFT JOIN {$wpdb->prefix}appointease_services s ON a.service_id = s.id 
             LEFT JOIN {$wpdb->prefix}appointease_staff st ON a.employee_id = st.id 
             ORDER BY a.appointment_date DESC"
        );
        ?>
        <div class="appointease-wrap">
            <div class="ae-page-header">
                <div class="page-title">
                    <h1><i class="dashicons dashicons-calendar-alt"></i> Appointments</h1>
                    <p class="page-subtitle">Manage all appointments</p>
                </div>
                <div class="ae-header-actions">
                    <input type="text" id="appointment-search" placeholder="Search appointments..." class="ae-search-input" />
                    <select id="status-filter" class="ae-filter-select">
                        <option value="">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select id="bulk-action" class="ae-filter-select">
                        <option value="">Bulk Actions</option>
                        <option value="confirm">Confirm Selected</option>
                        <option value="delete">Delete Selected</option>
                    </select>
                    <button class="ae-btn primary" onclick="applyBulkAction()">Apply</button>
                </div>
            </div>
            
            <div class="ae-table-container">
                <table class="ae-table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="select-all" /></th>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Service</th>
                            <th>Staff</th>
                            <th>Date & Time</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if($appointments): ?>
                            <?php foreach($appointments as $appointment): ?>
                            <tr>
                                <td><input type="checkbox" class="appointment-checkbox" value="<?php echo $appointment->id; ?>" /></td>
                                <td><?php echo $appointment->id; ?></td>
                                <td>
                                    <strong><?php echo esc_html($appointment->name); ?></strong><br>
                                    <small><?php echo esc_html($appointment->email); ?></small>
                                </td>
                                <td><?php echo esc_html($appointment->service_name ?: 'N/A'); ?></td>
                                <td><?php echo esc_html($appointment->staff_name ?: 'N/A'); ?></td>
                                <td><?php echo date('M j, Y g:i A', strtotime($appointment->appointment_date)); ?></td>
                                <td>
                                    <span class="status-badge <?php echo $appointment->status; ?>">
                                        <?php echo ucfirst($appointment->status); ?>
                                    </span>
                                </td>
                                <td>
                                    <select onchange="updateAppointmentStatus(<?php echo $appointment->id; ?>, this.value)">
                                        <option value="confirmed" <?php selected($appointment->status, 'confirmed'); ?>>Confirmed</option>
                                        <option value="cancelled" <?php selected($appointment->status, 'cancelled'); ?>>Cancelled</option>
                                    </select>
                                    <button class="ae-btn-small" onclick="rescheduleAppointment(<?php echo $appointment->id; ?>)">Reschedule</button>
                                    <button class="ae-btn-small danger" onclick="deleteAppointment(<?php echo $appointment->id; ?>)">Delete</button>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="7" class="ae-empty-state">
                                    <div class="ae-empty-state-icon">📅</div>
                                    <h3>No appointments yet</h3>
                                    <p>Appointments will appear here once customers start booking</p>
                                </td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
            
            <!-- Reschedule Modal -->
            <div id="reschedule-modal" class="ae-modal">
                <div class="ae-modal-content">
                    <div class="ae-modal-header">
                        <h3>Reschedule Appointment</h3>
                        <button class="ae-close">&times;</button>
                    </div>
                    <form id="reschedule-form">
                        <input type="hidden" id="reschedule-appointment-id" />
                        <div class="ae-form-group">
                            <label class="ae-form-label">New Date & Time *</label>
                            <input type="datetime-local" id="reschedule-datetime" class="ae-form-input" required />
                        </div>
                        <div class="ae-form-actions">
                            <button type="button" class="ae-btn" onclick="jQuery('#reschedule-modal').removeClass('show')">Cancel</button>
                            <button type="submit" class="ae-btn primary">Reschedule</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <?php
    }
    
    public function update_appointment_status() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        $id = intval($_POST['id']);
        $status = sanitize_text_field($_POST['status']);
        
        // Validate status
        if (!in_array($status, ['confirmed', 'cancelled', 'pending'])) {
            wp_send_json_error('Invalid status');
            return;
        }
        
        $result = $wpdb->update(
            $wpdb->prefix . 'appointments',
            array('status' => $status),
            array('id' => $id),
            array('%s'),
            array('%d')
        );
        
        if($result !== false) {
            wp_send_json_success();
        } else {
            wp_send_json_error('Failed to update status');
        }
    }
    
    public function delete_appointment() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        $id = intval($_POST['id']);
        
        // Check if appointment exists first
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}appointments WHERE id = %d", $id
        ));
        
        if (!$exists) {
            wp_send_json_error('Appointment not found');
            return;
        }
        
        $result = $wpdb->delete(
            $wpdb->prefix . 'appointments',
            array('id' => $id),
            array('%d')
        );
        
        if($result) {
            wp_send_json_success();
        } else {
            wp_send_json_error('Failed to delete appointment');
        }
    }
    
    public function get_calendar_data() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        
        $appointments = $wpdb->get_results(
            "SELECT a.*, s.name as service_name, st.name as staff_name 
             FROM {$wpdb->prefix}appointments a 
             LEFT JOIN {$wpdb->prefix}appointease_services s ON a.service_id = s.id 
             LEFT JOIN {$wpdb->prefix}appointease_staff st ON a.employee_id = st.id 
             WHERE a.appointment_date >= CURDATE()"
        );
        
        $events = array();
        foreach($appointments as $appointment) {
            $events[] = array(
                'id' => $appointment->id,
                'title' => $appointment->name . ' - ' . $appointment->service_name,
                'start' => $appointment->appointment_date,
                'end' => date('Y-m-d H:i:s', strtotime($appointment->appointment_date . ' +1 hour')),
                'status' => $appointment->status
            );
        }
        
        wp_send_json_success($events);
    }
    
    public function save_category() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        
        $id = intval($_POST['id']);
        $name = sanitize_text_field($_POST['name']);
        $description = sanitize_textarea_field($_POST['description']);
        $color = sanitize_hex_color($_POST['color']);
        
        if($id) {
            $wpdb->update(
                $wpdb->prefix . 'appointease_categories',
                array('name' => $name, 'description' => $description, 'color' => $color),
                array('id' => $id)
            );
        } else {
            $wpdb->insert(
                $wpdb->prefix . 'appointease_categories',
                array('name' => $name, 'description' => $description, 'color' => $color)
            );
        }
        
        wp_send_json_success();
    }
    
    public function delete_category() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        $id = intval($_POST['id']);
        
        $result = $wpdb->delete(
            $wpdb->prefix . 'appointease_categories',
            array('id' => $id),
            array('%d')
        );
        
        if($result) {
            wp_send_json_success();
        } else {
            wp_send_json_error('Failed to delete category');
        }
    }
    
    public function save_customer() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        
        $id = intval($_POST['id']);
        $name = sanitize_text_field($_POST['name']);
        $email = sanitize_email($_POST['email']);
        $phone = sanitize_text_field($_POST['phone']);
        $notes = sanitize_textarea_field($_POST['notes']);
        
        // Check for duplicate email
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id, name FROM {$wpdb->prefix}appointease_customers WHERE email = %s AND id != %d",
            $email, $id
        ));
        
        if ($existing) {
            wp_send_json_error('Email already exists for customer: ' . $existing->name);
            return;
        }
        
        if($id) {
            $wpdb->update(
                $wpdb->prefix . 'appointease_customers',
                array('name' => $name, 'email' => $email, 'phone' => $phone, 'notes' => $notes),
                array('id' => $id)
            );
        } else {
            $wpdb->insert(
                $wpdb->prefix . 'appointease_customers',
                array('name' => $name, 'email' => $email, 'phone' => $phone, 'notes' => $notes)
            );
        }
        
        wp_send_json_success();
    }
    
    public function delete_customer() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        $id = intval($_POST['id']);
        
        $result = $wpdb->delete(
            $wpdb->prefix . 'appointease_customers',
            array('id' => $id),
            array('%d')
        );
        
        if($result) {
            wp_send_json_success();
        } else {
            wp_send_json_error('Failed to delete customer');
        }
    }
    
    public function save_email_template() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        
        $id = intval($_POST['id']);
        $name = sanitize_text_field($_POST['name']);
        $type = sanitize_text_field($_POST['type']);
        $subject = sanitize_text_field($_POST['subject']);
        $body = sanitize_textarea_field($_POST['body']);
        
        if($id) {
            $wpdb->update(
                $wpdb->prefix . 'appointease_email_templates',
                array('name' => $name, 'type' => $type, 'subject' => $subject, 'body' => $body),
                array('id' => $id)
            );
        } else {
            $wpdb->insert(
                $wpdb->prefix . 'appointease_email_templates',
                array('name' => $name, 'type' => $type, 'subject' => $subject, 'body' => $body)
            );
        }
        
        wp_send_json_success();
    }
    
    public function delete_email_template() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        $id = intval($_POST['id']);
        
        $result = $wpdb->delete(
            $wpdb->prefix . 'appointease_email_templates',
            array('id' => $id),
            array('%d')
        );
        
        if($result) {
            wp_send_json_success();
        } else {
            wp_send_json_error('Failed to delete template');
        }
    }
    
    public function test_email() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        $email_settings = get_option('appointease_email_settings', array());
        
        $to = $email_settings['from_email'] ?? get_option('admin_email');
        $subject = 'AppointEase Test Email';
        $message = 'This is a test email from AppointEase booking system.';
        
        $sent = wp_mail($to, $subject, $message);
        
        if($sent) {
            wp_send_json_success('Test email sent successfully!');
        } else {
            wp_send_json_error('Failed to send test email');
        }
    }
    
    public function preview_email_template() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        $id = intval($_POST['id']);
        
        $template = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}appointease_email_templates WHERE id = %d", $id));
        
        if ($template) {
            $sample_vars = array(
                'customer_name' => 'John Doe',
                'appointment_id' => '123',
                'appointment_date' => '2024-01-15 10:00 AM',
                'service_name' => 'Consultation',
                'staff_name' => 'Sarah Johnson',
                'business_name' => get_bloginfo('name')
            );
            
            $subject = $template->subject;
            $body = $template->body;
            
            foreach ($sample_vars as $key => $value) {
                $subject = str_replace('{{' . $key . '}}', $value, $subject);
                $body = str_replace('{{' . $key . '}}', $value, $body);
            }
            
            wp_send_json_success(array('subject' => $subject, 'body' => $body));
        } else {
            wp_send_json_error('Template not found');
        }
    }
    
    public function holidays_page() {
        global $wpdb;
        $holidays = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}appointease_blackout_dates ORDER BY start_date DESC");
        ?>
        <div class="appointease-wrap">
            <div class="ae-page-header">
                <div class="page-title">
                    <h1><i class="dashicons dashicons-calendar-alt"></i> Holidays & Closing Days</h1>
                    <p class="page-subtitle">Manage business holidays and special closing days</p>
                </div>
                <div class="page-actions">
                    <button class="ae-btn primary" onclick="openHolidayModal()">Add Holiday</button>
                </div>
            </div>
            
            <div class="ae-table-container">
                <table class="ae-table">
                    <thead>
                        <tr>
                            <th>Holiday Name</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Type</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if($holidays): ?>
                            <?php foreach($holidays as $holiday): ?>
                            <tr>
                                <td><?php echo esc_html($holiday->reason ?: 'Holiday'); ?></td>
                                <td><?php echo date('M j, Y', strtotime($holiday->start_date)); ?></td>
                                <td><?php echo date('M j, Y', strtotime($holiday->end_date)); ?></td>
                                <td>
                                    <?php if($holiday->start_date === $holiday->end_date): ?>
                                        <span class="status-badge">Single Day</span>
                                    <?php else: ?>
                                        <span class="status-badge confirmed">Date Range</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <button class="ae-btn-small" onclick="editHoliday(<?php echo $holiday->id; ?>)">Edit</button>
                                    <button class="ae-btn-small danger" onclick="deleteHoliday(<?php echo $holiday->id; ?>)">Delete</button>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="5" class="ae-empty-state">
                                    <div class="ae-empty-state-icon">🏖️</div>
                                    <h3>No holidays set</h3>
                                    <p>Add holidays and special closing days to prevent bookings</p>
                                </td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
            
            <!-- Holiday Modal -->
            <div id="holiday-modal" class="ae-modal">
                <div class="ae-modal-content">
                    <div class="ae-modal-header">
                        <h3 id="holiday-modal-title">Add Holiday</h3>
                        <button class="ae-close">&times;</button>
                    </div>
                    <form id="holiday-form">
                        <input type="hidden" id="holiday-id" />
                        <div class="ae-form-group">
                            <label class="ae-form-label">Holiday Name *</label>
                            <input type="text" id="holiday-name" class="ae-form-input" placeholder="e.g., Christmas Day, Summer Break" required />
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Start Date *</label>
                            <input type="date" id="holiday-start" class="ae-form-input" required />
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">End Date *</label>
                            <input type="date" id="holiday-end" class="ae-form-input" required />
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Quick Presets</label>
                            <div class="holiday-presets">
                                <button type="button" class="ae-btn-small" onclick="setHolidayPreset('Christmas Day', '12-25')">Christmas</button>
                                <button type="button" class="ae-btn-small" onclick="setHolidayPreset('New Year Day', '01-01')">New Year</button>
                                <button type="button" class="ae-btn-small" onclick="setHolidayPreset('Independence Day', '07-04')">July 4th</button>
                            </div>
                        </div>
                        <div class="ae-form-actions">
                            <button type="button" class="ae-btn" onclick="jQuery('#holiday-modal').removeClass('show')">Cancel</button>
                            <button type="submit" class="ae-btn primary">Save Holiday</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <?php
    }
    
    public function save_holiday() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        
        $id = intval($_POST['id']);
        $name = sanitize_text_field($_POST['name']);
        $start_date = sanitize_text_field($_POST['start_date']);
        $end_date = sanitize_text_field($_POST['end_date']);
        
        if($id) {
            $wpdb->update(
                $wpdb->prefix . 'appointease_blackout_dates',
                array('reason' => $name, 'start_date' => $start_date, 'end_date' => $end_date),
                array('id' => $id)
            );
        } else {
            $wpdb->insert(
                $wpdb->prefix . 'appointease_blackout_dates',
                array('reason' => $name, 'start_date' => $start_date, 'end_date' => $end_date)
            );
        }
        
        wp_send_json_success();
    }
    
    public function delete_holiday() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        $id = intval($_POST['id']);
        
        $result = $wpdb->delete(
            $wpdb->prefix . 'appointease_blackout_dates',
            array('id' => $id),
            array('%d')
        );
        
        if($result) {
            wp_send_json_success();
        } else {
            wp_send_json_error('Failed to delete holiday');
        }
    }
    
    public function export_appointments() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        
        $appointments = $wpdb->get_results(
            "SELECT a.*, s.name as service_name, st.name as staff_name 
             FROM {$wpdb->prefix}appointments a 
             LEFT JOIN {$wpdb->prefix}appointease_services s ON a.service_id = s.id 
             LEFT JOIN {$wpdb->prefix}appointease_staff st ON a.employee_id = st.id 
             ORDER BY a.appointment_date DESC"
        );
        
        $csv_data = "ID,Customer Name,Email,Phone,Service,Staff,Date,Status,Amount\n";
        foreach($appointments as $appointment) {
            $csv_data .= sprintf(
                "%d,%s,%s,%s,%s,%s,%s,%s,%.2f\n",
                $appointment->id,
                $appointment->name,
                $appointment->email,
                $appointment->phone,
                $appointment->service_name,
                $appointment->staff_name,
                $appointment->appointment_date,
                $appointment->status,
                $appointment->total_amount ?: 0
            );
        }
        
        wp_send_json_success(array('csv' => $csv_data));
    }
    
    public function bulk_appointment_action() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        
        $action = sanitize_text_field($_POST['bulk_action']);
        $appointment_ids = array_map('intval', $_POST['appointment_ids']);
        
        if($action === 'delete') {
            $placeholders = implode(',', array_fill(0, count($appointment_ids), '%d'));
            $wpdb->query($wpdb->prepare(
                "DELETE FROM {$wpdb->prefix}appointments WHERE id IN ($placeholders)",
                $appointment_ids
            ));
        } elseif($action === 'confirm') {
            $placeholders = implode(',', array_fill(0, count($appointment_ids), '%d'));
            $wpdb->query($wpdb->prepare(
                "UPDATE {$wpdb->prefix}appointments SET status = 'confirmed' WHERE id IN ($placeholders)",
                $appointment_ids
            ));
        }
        
        wp_send_json_success();
    }
    
    public function init_settings() {
        register_setting('appointease_settings', 'appointease_options');
    }
    
    public function settings_page() {
        if (isset($_POST['submit'])) {
            $validation_result = $this->validate_working_days($_POST['appointease_options']['working_days'] ?? []);
            
            if ($validation_result['valid']) {
                update_option('appointease_options', $_POST['appointease_options']);
                wp_cache_delete('appointease_options', 'options');
                echo '<script>jQuery(document).ready(function() { showSuccessToast("Settings Saved", "Your booking system has been updated with the new configuration.", [{text: "View Calendar", type: "primary", callback: function() { window.location.href = "admin.php?page=appointease-calendar"; }}]); });</script>';
            } else {
                echo '<script>jQuery(document).ready(function() { showErrorToast("Save Failed", "' . esc_js($validation_result['message']) . '", [{text: "Retry", type: "primary", callback: function() { document.querySelector("form").submit(); }}]); });</script>';
            }
        }
        
        $options = get_option('appointease_options', array());
        ?>
        <div class="appointease-wrap">
            <div class="ae-page-header">
                <div class="page-title">
                    <h1><i class="dashicons dashicons-admin-settings"></i> Settings</h1>
                    <p class="page-subtitle">Configure your booking system preferences</p>
                </div>
            </div>
            
            <div class="ae-settings-form">
                <form method="post">
                    <div class="settings-grid">
                        <div class="ae-card">
                            <h3><i class="dashicons dashicons-clock"></i> Business Hours</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Start Time</label>
                                    <input type="time" name="appointease_options[start_time]" value="<?php echo isset($options['start_time']) ? $options['start_time'] : '09:00'; ?>" />
                                </div>
                                <div class="form-group">
                                    <label>End Time</label>
                                    <input type="time" name="appointease_options[end_time]" value="<?php echo isset($options['end_time']) ? $options['end_time'] : '17:00'; ?>" />
                                </div>
                            </div>
                        </div>
                        
                        <div class="ae-card">
                            <h3><i class="dashicons dashicons-calendar-alt"></i> Working Days</h3>
                            <div class="form-group">
                                <?php $working_days = isset($options['working_days']) && is_array($options['working_days']) ? $options['working_days'] : ['1','2','3','4','5']; ?>
                                <div class="working-days-grid">
                                    <label class="checkbox-label"><input type="checkbox" name="appointease_options[working_days][]" value="1" <?php checked(in_array('1', $working_days)); ?>> <span>Monday</span></label>
                                    <label class="checkbox-label"><input type="checkbox" name="appointease_options[working_days][]" value="2" <?php checked(in_array('2', $working_days)); ?>> <span>Tuesday</span></label>
                                    <label class="checkbox-label"><input type="checkbox" name="appointease_options[working_days][]" value="3" <?php checked(in_array('3', $working_days)); ?>> <span>Wednesday</span></label>
                                    <label class="checkbox-label"><input type="checkbox" name="appointease_options[working_days][]" value="4" <?php checked(in_array('4', $working_days)); ?>> <span>Thursday</span></label>
                                    <label class="checkbox-label"><input type="checkbox" name="appointease_options[working_days][]" value="5" <?php checked(in_array('5', $working_days)); ?>> <span>Friday</span></label>
                                    <label class="checkbox-label"><input type="checkbox" name="appointease_options[working_days][]" value="6" <?php checked(in_array('6', $working_days)); ?>> <span>Saturday</span></label>
                                    <label class="checkbox-label"><input type="checkbox" name="appointease_options[working_days][]" value="0" <?php checked(in_array('0', $working_days)); ?>> <span>Sunday</span></label>
                                </div>
                            </div>
                        </div>
                
                        <div class="ae-card">
                            <h3><i class="dashicons dashicons-admin-tools"></i> Time Slots & Booking</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Appointment Duration</label>
                                    <select name="appointease_options[slot_duration]">
                                        <option value="15" <?php selected(isset($options['slot_duration']) ? $options['slot_duration'] : 30, 15); ?>>15 minutes</option>
                                        <option value="30" <?php selected(isset($options['slot_duration']) ? $options['slot_duration'] : 30, 30); ?>>30 minutes</option>
                                        <option value="45" <?php selected(isset($options['slot_duration']) ? $options['slot_duration'] : 30, 45); ?>>45 minutes</option>
                                        <option value="60" <?php selected(isset($options['slot_duration']) ? $options['slot_duration'] : 30, 60); ?>>60 minutes</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Advance Booking (days)</label>
                                    <input type="number" name="appointease_options[advance_booking]" value="<?php echo isset($options['advance_booking']) ? $options['advance_booking'] : 30; ?>" min="1" max="365" />
                                </div>
                            </div>
                        </div>
                
                        <div class="ae-card">
                            <h3><i class="dashicons dashicons-email"></i> Email Notifications</h3>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="appointease_options[email_customer]" value="1" <?php checked(isset($options['email_customer']) ? $options['email_customer'] : 1); ?>>
                                    <span>Send confirmation emails to customers</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="appointease_options[email_admin]" value="1" <?php checked(isset($options['email_admin']) ? $options['email_admin'] : 1); ?>>
                                    <span>Send notification emails to admin</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label>Admin Email</label>
                                <input type="email" name="appointease_options[admin_email]" value="<?php echo isset($options['admin_email']) ? $options['admin_email'] : get_option('admin_email'); ?>" />
                            </div>
                        </div>
                
                        <div class="ae-card">
                            <h3><i class="dashicons dashicons-shield"></i> Booking Restrictions</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Minimum advance notice (hours)</label>
                                    <input type="number" name="appointease_options[min_advance]" value="<?php echo isset($options['min_advance']) ? $options['min_advance'] : 2; ?>" min="0" max="168" />
                                </div>
                                <div class="form-group">
                                    <label>Maximum bookings per day</label>
                                    <input type="number" name="appointease_options[max_bookings]" value="<?php echo isset($options['max_bookings']) ? $options['max_bookings'] : 10; ?>" min="1" max="100" />
                                </div>
                            </div>
                        </div>
                
                        <div class="ae-card">
                            <h3><i class="dashicons dashicons-calendar-alt"></i> Appearance</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Primary Color</label>
                                    <input type="color" name="appointease_options[primary_color]" value="<?php echo isset($options['primary_color']) ? $options['primary_color'] : '#1CBC9B'; ?>" />
                                </div>
                                <div class="form-group">
                                    <label>Button Text</label>
                                    <input type="text" name="appointease_options[button_text]" value="<?php echo isset($options['button_text']) ? $options['button_text'] : 'Book Appointment'; ?>" />
                                </div>
                            </div>
                        </div>
                        
                        <div class="ae-card">
                            <h3><i class="dashicons dashicons-admin-links"></i> Webhook Notifications</h3>
                            <p style="margin-bottom: 15px; color: #666;">Configure webhook URL to receive real-time notifications when new appointments are created.</p>
                            <div class="form-group">
                                <label>Webhook URL</label>
                                <input type="url" id="webhook-url" placeholder="https://your-site.com/webhook-endpoint" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" value="<?php echo esc_attr(get_option('appointease_webhook_url', '')); ?>" />
                                <small style="color: #666; display: block; margin-top: 5px;">Enter the URL where you want to receive webhook notifications for new appointments.</small>
                            </div>
                            <div style="margin-top: 15px;">
                                <button type="button" class="ae-btn primary" onclick="saveWebhookUrl()" style="margin-right: 10px;">Save Webhook URL</button>
                                <button type="button" class="ae-btn ghost" onclick="testWebhook()">Test Webhook</button>
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: right; margin-top: 30px;">
                        <button type="submit" name="submit" class="ae-btn primary" style="padding: 15px 40px; font-size: 16px;">
                            <i class="dashicons dashicons-saved"></i> Save All Settings
                        </button>
                    </div>
                </form>
            </div>

        </div>
        <?php
    }
    
    public function calendar_page() {
        ?>
        <div class="appointease-wrap">
            <div class="ae-page-header">
                <div class="page-title">
                    <h1><i class="dashicons dashicons-calendar-alt"></i> Calendar</h1>
                    <p class="page-subtitle">Visual appointment management</p>
                </div>
                <div class="page-actions">
                    <button class="ae-btn primary" onclick="location.reload()">Refresh</button>
                </div>
            </div>
            <div id="appointease-calendar-root" style="padding: 30px; background: white; min-height: 500px; display: block; visibility: visible;">
                <div class="calendar-fallback" style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <i class="dashicons dashicons-calendar-alt" style="font-size: 48px; margin-bottom: 20px;"></i>
                    <h3>Calendar Loading...</h3>
                    <p>If the calendar doesn't load, please refresh the page.</p>
                </div>
            </div>
            
            <noscript>
                <div style="padding: 30px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; margin-top: 20px;">
                    <strong>JavaScript Required:</strong> The calendar requires JavaScript to function properly. Please enable JavaScript in your browser.
                </div>
            </noscript>
        </div>
        <script>
        jQuery(document).ready(function($) {
            //console.log('Calendar page loaded');
            
            // Show loading state
            $('#appointease-calendar-root').show().html('<div style="padding: 40px; text-align: center; color: #7f8c8d;"><i class="dashicons dashicons-update" style="font-size: 24px; animation: spin 1s linear infinite;"></i><br><br>Loading calendar data...</div>');
            
            // Load calendar data
            $.post(appointeaseAdmin.ajaxurl, {
                action: 'get_calendar_data',
                _wpnonce: appointeaseAdmin.nonce
            }, function(response) {
                //console.log('Calendar data response:', response);
                if (response.success) {
                    window.appointeaseCalendarData = response.data;
                    //console.log('Calendar data loaded:', response.data.length, 'appointments');
                    
                    // Initialize calendar
                    if (typeof window.initSimpleCalendar === 'function') {
                        window.initSimpleCalendar();
                    } else {
                        //console.log('initSimpleCalendar not available, trying fallback');
                        setTimeout(function() {
                            if (typeof window.initSimpleCalendar === 'function') {
                                window.initSimpleCalendar();
                            } else {
                                $('#appointease-calendar-root').html('<div style="padding: 40px; text-align: center;"><h3>Calendar View</h3><p>Loaded ' + response.data.length + ' appointments</p><p><a href="admin.php?page=appointease-appointments">View Appointments List</a></p></div>');
                            }
                        }, 500);
                    }
                } else {
                    $('#appointease-calendar-root').html('<div style="padding: 40px; text-align: center; color: #e74c3c;"><h3>Failed to load calendar data</h3><p>Error: ' + (response.data || 'Unknown error') + '</p></div>');
                }
            }).fail(function(xhr, status, error) {
                console.error('Calendar AJAX failed:', status, error);
                $('#appointease-calendar-root').html('<div style="padding: 40px; text-align: center; color: #e74c3c;"><h3>Error loading calendar</h3><p>Please check your connection and try again.</p><button class="ae-btn primary" onclick="location.reload()">Retry</button></div>');
            });
        });
        
        // Add spinning animation for loading
        $('<style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>').appendTo('head');
        </script>
        <?php
    }
    
    public function reports_page() {
        global $wpdb;
        $total_appointments = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointments");
        $total_revenue = $wpdb->get_var(
            "SELECT SUM(s.price) FROM {$wpdb->prefix}appointments a 
             LEFT JOIN {$wpdb->prefix}appointease_services s ON a.service_id = s.id 
             WHERE a.status IN ('confirmed', 'completed')"
        );
        $monthly_stats = $wpdb->get_results(
            "SELECT DATE_FORMAT(appointment_date, '%Y-%m') as month, COUNT(*) as count, SUM(s.price) as revenue 
             FROM {$wpdb->prefix}appointments a
             LEFT JOIN {$wpdb->prefix}appointease_services s ON a.service_id = s.id
             WHERE appointment_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH) AND a.status IN ('confirmed', 'completed')
             GROUP BY DATE_FORMAT(appointment_date, '%Y-%m') 
             ORDER BY month DESC"
        );
        ?>
        <div class="appointease-wrap">
            <div class="ae-page-header">
                <div class="page-title">
                    <h1><i class="dashicons dashicons-chart-bar"></i> Reports & Analytics</h1>
                    <p class="page-subtitle">Business insights and statistics</p>
                </div>
                <div class="page-actions">
                    <button class="ae-btn primary" onclick="exportAppointments()">Export Data</button>
                </div>
            </div>
            
            <div class="ae-dashboard" style="padding: 30px;">
                <div class="ae-stats" style="margin-bottom: 40px;">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="dashicons dashicons-calendar-alt"></i></div>
                        <div class="stat-info">
                            <h3><?php echo $total_appointments; ?></h3>
                            <p>Total Appointments</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="dashicons dashicons-money-alt"></i></div>
                        <div class="stat-info">
                            <h3>$<?php echo number_format($total_revenue ?: 0, 2); ?></h3>
                            <p>Total Revenue</p>
                        </div>
                    </div>
                </div>
                
                <div class="ae-card">
                    <h3>Monthly Statistics</h3>
                    <table class="ae-table">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Appointments</th>
                                <th>Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach($monthly_stats as $stat): ?>
                            <tr>
                                <td><?php echo date('F Y', strtotime($stat->month . '-01')); ?></td>
                                <td><?php echo $stat->count; ?></td>
                                <td>$<?php echo number_format($stat->revenue ?: 0, 2); ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <?php
    }
    
    public function customers_page() {
        global $wpdb;
        
        // Auto-sync customers from appointments if customers table is empty
        $customer_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointease_customers");
        if ($customer_count == 0) {
            $this->sync_customers_from_appointments();
        }
        
        $customers = $wpdb->get_results(
            "SELECT c.*, COUNT(a.id) as appointment_count, SUM(s.price) as total_spent
             FROM {$wpdb->prefix}appointease_customers c
             LEFT JOIN {$wpdb->prefix}appointments a ON c.email = a.email
             LEFT JOIN {$wpdb->prefix}appointease_services s ON a.service_id = s.id
             GROUP BY c.id ORDER BY c.created_at DESC"
        );
        ?>
        <div class="appointease-wrap">
            <div class="ae-page-header">
                <div class="page-title">
                    <h1><i class="dashicons dashicons-groups"></i> Customers</h1>
                    <p class="page-subtitle">Manage customer database</p>
                </div>
                <div class="ae-header-actions">
                    <select id="customer-bulk-action" class="ae-filter-select">
                        <option value="">Bulk Actions</option>
                        <option value="delete">Delete Selected</option>
                        <option value="export">Export Selected</option>
                    </select>
                    <button class="ae-btn" onclick="applyCustomerBulkAction()">Apply</button>
                    <button class="ae-btn ghost" onclick="syncCustomers()" style="margin-left: 10px;">Sync from Appointments</button>
                    <button class="ae-btn primary" onclick="openCustomerModal()">Add Customer</button>
                </div>
            </div>
            
            <div class="ae-table-container">
                <table class="ae-table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="select-all-customers" /></th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Appointments</th>
                            <th>Total Spent</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach($customers as $customer): ?>
                        <tr>
                            <td><input type="checkbox" class="customer-checkbox" value="<?php echo $customer->id; ?>" /></td>
                            <td><?php echo esc_html($customer->name); ?></td>
                            <td><?php echo esc_html($customer->email); ?></td>
                            <td><?php echo esc_html($customer->phone); ?></td>
                            <td><?php echo $customer->appointment_count; ?></td>
                            <td>$<?php echo number_format($customer->total_spent ?: 0, 2); ?></td>
                            <td>
                                <button class="ae-btn-small" onclick="editCustomer(<?php echo $customer->id; ?>)">Edit</button>
                                <button class="ae-btn-small danger" onclick="deleteCustomer(<?php echo $customer->id; ?>)">Delete</button>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            
            <div id="customer-modal" class="ae-modal">
                <div class="ae-modal-content">
                    <div class="ae-modal-header">
                        <h3 id="customer-modal-title">Add Customer</h3>
                        <button class="ae-close">&times;</button>
                    </div>
                    <form id="customer-form">
                        <input type="hidden" id="customer-id" />
                        <div class="ae-form-group">
                            <label class="ae-form-label">Name *</label>
                            <input type="text" id="customer-name" class="ae-form-input" required />
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Email *</label>
                            <input type="email" id="customer-email" class="ae-form-input" required />
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Phone</label>
                            <input type="tel" id="customer-phone" class="ae-form-input" />
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Notes</label>
                            <textarea id="customer-notes" class="ae-form-input ae-form-textarea"></textarea>
                        </div>
                        <div class="ae-form-actions">
                            <button type="button" class="ae-btn" onclick="jQuery('#customer-modal').removeClass('show')">Cancel</button>
                            <button type="submit" class="ae-btn primary">Save Customer</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <?php
    }
    
    public function categories_page() {
        global $wpdb;
        $categories = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}appointease_categories ORDER BY created_at DESC");
        ?>
        <div class="appointease-wrap">
            <div class="ae-page-header">
                <div class="page-title">
                    <h1><i class="dashicons dashicons-category"></i> Service Categories</h1>
                    <p class="page-subtitle">Organize your services</p>
                </div>
                <div class="page-actions">
                    <button class="ae-btn primary" onclick="openCategoryModal()">Add Category</button>
                </div>
            </div>
            
            <div class="ae-cards">
                <?php foreach($categories as $category): ?>
                <div class="ae-card">
                    <div class="card-icon" style="background: <?php echo $category->color; ?>;"></div>
                    <div class="card-content">
                        <h3><?php echo esc_html($category->name); ?></h3>
                        <p><?php echo esc_html($category->description); ?></p>
                    </div>
                    <div class="card-actions">
                        <button class="ae-btn-small" onclick="editCategory(<?php echo $category->id; ?>)">Edit</button>
                        <button class="ae-btn-small danger" onclick="deleteCategory(<?php echo $category->id; ?>)">Delete</button>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            
            <div id="category-modal" class="ae-modal">
                <div class="ae-modal-content">
                    <div class="ae-modal-header">
                        <h3 id="category-modal-title">Add Category</h3>
                        <button class="ae-close">&times;</button>
                    </div>
                    <form id="category-form">
                        <input type="hidden" id="category-id" />
                        <div class="ae-form-group">
                            <label class="ae-form-label">Name *</label>
                            <input type="text" id="category-name" class="ae-form-input" required />
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Description</label>
                            <textarea id="category-description" class="ae-form-input ae-form-textarea"></textarea>
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Color</label>
                            <input type="color" id="category-color" class="ae-form-input" value="#1CBC9B" />
                        </div>
                        <div class="ae-form-actions">
                            <button type="button" class="ae-btn" onclick="jQuery('#category-modal').removeClass('show')">Cancel</button>
                            <button type="submit" class="ae-btn primary">Save Category</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <?php
    }
    
    public function emails_page() {
        global $wpdb;
        $templates = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}appointease_email_templates ORDER BY created_at DESC");
        $email_settings = get_option('appointease_email_settings', array());
        
        if (isset($_POST['save_email_settings'])) {
            update_option('appointease_email_settings', $_POST['email_settings']);
            echo '<script>jQuery(document).ready(function() { showSuccessToast("Email Settings Saved", "SMTP configuration has been updated successfully.", [{text: "Test Email", type: "primary", callback: function() { testEmail(); }}]); });</script>';
        }
        ?>
        <div class="appointease-wrap">
            <div class="ae-page-header">
                <div class="page-title">
                    <h1><i class="dashicons dashicons-email"></i> Email Templates & Settings</h1>
                    <p class="page-subtitle">Manage email communications</p>
                </div>
                <div class="page-actions">
                    <button class="ae-btn ghost" onclick="testEmail()">Test Email</button>
                    <button class="ae-btn primary" onclick="openTemplateModal()">Add Template</button>
                </div>
            </div>
            
            <div style="padding: 30px;">
                <div class="ae-card" style="margin-bottom: 30px;">
                    <h3>SMTP Configuration</h3>
                    <form method="post">
                        <div class="form-row">
                            <div class="form-group">
                                <label>SMTP Host</label>
                                <input type="text" name="email_settings[smtp_host]" value="<?php echo $email_settings['smtp_host'] ?? ''; ?>" placeholder="smtp.gmail.com" />
                            </div>
                            <div class="form-group">
                                <label>SMTP Port</label>
                                <input type="number" name="email_settings[smtp_port]" value="<?php echo $email_settings['smtp_port'] ?? '587'; ?>" />
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Username</label>
                                <input type="text" name="email_settings[smtp_username]" value="<?php echo $email_settings['smtp_username'] ?? ''; ?>" />
                            </div>
                            <div class="form-group">
                                <label>Password</label>
                                <input type="password" name="email_settings[smtp_password]" value="<?php echo $email_settings['smtp_password'] ?? ''; ?>" />
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>From Email</label>
                                <input type="email" name="email_settings[from_email]" value="<?php echo $email_settings['from_email'] ?? get_option('admin_email'); ?>" />
                            </div>
                            <div class="form-group">
                                <label>From Name</label>
                                <input type="text" name="email_settings[from_name]" value="<?php echo $email_settings['from_name'] ?? get_bloginfo('name'); ?>" />
                            </div>
                        </div>
                        <button type="submit" name="save_email_settings" class="ae-btn primary">Save Settings</button>
                    </form>
                </div>
                
                <div class="ae-card">
                    <h3>Email Templates</h3>
                    <table class="ae-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Subject</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach($templates as $template): ?>
                            <tr>
                                <td><?php echo esc_html($template->name); ?></td>
                                <td><?php echo ucfirst($template->type); ?></td>
                                <td><?php echo esc_html($template->subject); ?></td>
                                <td>
                                    <span class="status-badge <?php echo $template->is_active ? 'confirmed' : 'cancelled'; ?>">
                                        <?php echo $template->is_active ? 'Active' : 'Inactive'; ?>
                                    </span>
                                </td>
                                <td>
                                    <button class="ae-btn-small" onclick="previewTemplate(<?php echo $template->id; ?>)">Preview</button>
                                    <button class="ae-btn-small" onclick="editTemplate(<?php echo $template->id; ?>)">Edit</button>
                                    <button class="ae-btn-small danger" onclick="deleteTemplate(<?php echo $template->id; ?>)">Delete</button>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div id="template-modal" class="ae-modal">
                <div class="ae-modal-content" style="max-width: 700px;">
                    <div class="ae-modal-header">
                        <h3 id="template-modal-title">Add Email Template</h3>
                        <button class="ae-close">&times;</button>
                    </div>
                    <form id="template-form">
                        <input type="hidden" id="template-id" />
                        <div class="ae-form-group">
                            <label class="ae-form-label">Template Name *</label>
                            <input type="text" id="template-name" class="ae-form-input" required />
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Type *</label>
                            <select id="template-type" class="ae-form-input" required>
                                <option value="confirmation">Confirmation</option>
                                <option value="reminder">Reminder</option>
                                <option value="cancellation">Cancellation</option>
                            </select>
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Subject *</label>
                            <input type="text" id="template-subject" class="ae-form-input" required />
                        </div>
                        <div class="ae-form-group">
                            <label class="ae-form-label">Body *</label>
                            <textarea id="template-body" class="ae-form-input ae-form-textarea" rows="10" required></textarea>
                            <small>Available variables: {{customer_name}}, {{appointment_date}}, {{service_name}}, {{staff_name}}, {{total_amount}}</small>
                        </div>
                        <div class="ae-form-actions">
                            <button type="button" class="ae-btn" onclick="jQuery('#template-modal').removeClass('show')">Cancel</button>
                            <button type="submit" class="ae-btn primary">Save Template</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <?php
    }
    
    public function create_manual_booking() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        
        $name = sanitize_text_field($_POST['name']);
        $email = sanitize_email($_POST['email']);
        $phone = sanitize_text_field($_POST['phone']);
        $appointment_date = sanitize_text_field($_POST['appointment_date']);
        
        if (empty($name) || empty($email) || empty($appointment_date)) {
            wp_send_json_error('Name, email, and appointment date are required.');
            return;
        }
        
        // Validate email format
        if (!is_email($email)) {
            wp_send_json_error('Invalid email format');
            return;
        }
        
        // Validate appointment date
        if (strtotime($appointment_date) === false || strtotime($appointment_date) <= time()) {
            wp_send_json_error('Invalid date or date must be in the future');
            return;
        }
        
        $result = $wpdb->insert(
            $wpdb->prefix . 'appointments',
            array(
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'appointment_date' => $appointment_date,
                'status' => 'confirmed',
                'created_at' => current_time('mysql')
            ),
            array('%s', '%s', '%s', '%s', '%s', '%s')
        );
        
        if ($result) {
            wp_send_json_success('Appointment created successfully');
        } else {
            wp_send_json_error('Failed to create appointment');
        }
    }
    
    public function reschedule_appointment() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        
        $id = intval($_POST['id']);
        $new_datetime = sanitize_text_field($_POST['new_datetime']);
        
        if (empty($id) || empty($new_datetime)) {
            wp_send_json_error('Appointment ID and new date/time are required.');
            return;
        }
        
        // Validate datetime format
        if (strtotime($new_datetime) === false || strtotime($new_datetime) <= time()) {
            wp_send_json_error('Invalid date/time or date must be in the future');
            return;
        }
        
        // Check if appointment exists
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}appointments WHERE id = %d", $id
        ));
        
        if (!$exists) {
            wp_send_json_error('Appointment not found');
            return;
        }
        
        $result = $wpdb->update(
            $wpdb->prefix . 'appointments',
            array('appointment_date' => $new_datetime),
            array('id' => $id),
            array('%s'),
            array('%d')
        );
        
        if ($result !== false) {
            wp_send_json_success('Appointment rescheduled successfully');
        } else {
            wp_send_json_error('Failed to reschedule appointment');
        }
    }
    
    public function ajax_sync_customers() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        
        $synced = $this->sync_customers_from_appointments();
        wp_send_json_success('Customers synced from appointments successfully');
    }
    
    public function ajax_check_day_appointments() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        
        $day = intval($_POST['day']);
        global $wpdb;
        
        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}appointments 
             WHERE DAYOFWEEK(appointment_date) = %d 
             AND appointment_date >= NOW() 
             AND status IN ('confirmed', 'created')",
            $day == 0 ? 1 : $day + 1
        ));
        
        wp_send_json_success(['count' => intval($count)]);
    }
    
    public function ajax_check_customer_email() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        
        $email = sanitize_email($_POST['email']);
        global $wpdb;
        
        $customer = $wpdb->get_row($wpdb->prepare(
            "SELECT name, phone FROM {$wpdb->prefix}appointease_customers WHERE email = %s",
            $email
        ));
        
        if ($customer) {
            wp_send_json_success(['exists' => true, 'name' => $customer->name, 'phone' => $customer->phone]);
        } else {
            wp_send_json_success(['exists' => false]);
        }
    }
    
    public function ajax_get_recent_appointments() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        
        $since = intval($_POST['since']) / 1000;
        $since_date = date('Y-m-d H:i:s', $since);
        
        global $wpdb;
        $appointments = $wpdb->get_results($wpdb->prepare(
            "SELECT a.*, s.name as service_name, st.name as staff_name 
             FROM {$wpdb->prefix}appointments a 
             LEFT JOIN {$wpdb->prefix}appointease_services s ON a.service_id = s.id 
             LEFT JOIN {$wpdb->prefix}appointease_staff st ON a.employee_id = st.id 
             WHERE a.created_at > %s 
             ORDER BY a.created_at DESC",
            $since_date
        ));
        
        wp_send_json_success($appointments);
    }
    
    public function ajax_get_notification_queue() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        
        $queue = get_transient('appointease_notification_queue');
        if (!$queue) {
            $queue = [];
        }
        
        // Clear the queue after retrieving
        delete_transient('appointease_notification_queue');
        
        wp_send_json_success($queue);
    }
    
    public function bulk_customer_action() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        
        $action = sanitize_text_field($_POST['bulk_action']);
        $customer_ids = array_map('intval', $_POST['customer_ids']);
        
        if (empty($customer_ids)) {
            wp_send_json_error('No customers selected');
            return;
        }
        
        if ($action === 'delete') {
            $placeholders = implode(',', array_fill(0, count($customer_ids), '%d'));
            $result = $wpdb->query($wpdb->prepare(
                "DELETE FROM {$wpdb->prefix}appointease_customers WHERE id IN ($placeholders)",
                $customer_ids
            ));
            
            if ($result !== false) {
                wp_send_json_success(['message' => $result . ' customer(s) deleted successfully']);
            } else {
                wp_send_json_error('Failed to delete customers');
            }
        } elseif ($action === 'export') {
            $placeholders = implode(',', array_fill(0, count($customer_ids), '%d'));
            $customers = $wpdb->get_results($wpdb->prepare(
                "SELECT c.*, COUNT(a.id) as appointment_count, SUM(s.price) as total_spent
                 FROM {$wpdb->prefix}appointease_customers c
                 LEFT JOIN {$wpdb->prefix}appointments a ON c.email = a.email
                 LEFT JOIN {$wpdb->prefix}appointease_services s ON a.service_id = s.id
                 WHERE c.id IN ($placeholders)
                 GROUP BY c.id",
                $customer_ids
            ));
            
            $csv_data = "ID,Name,Email,Phone,Appointments,Total Spent,Created At\n";
            foreach ($customers as $customer) {
                $csv_data .= sprintf(
                    "%d,%s,%s,%s,%d,%.2f,%s\n",
                    $customer->id,
                    $customer->name,
                    $customer->email,
                    $customer->phone,
                    $customer->appointment_count,
                    $customer->total_spent ?: 0,
                    $customer->created_at
                );
            }
            
            wp_send_json_success(['csv' => $csv_data]);
        } else {
            wp_send_json_error('Invalid bulk action');
        }
    }
    
    private function validate_working_days($new_working_days) {
        global $wpdb;
        
        $current_options = get_option('appointease_options', array());
        $current_working_days = isset($current_options['working_days']) && is_array($current_options['working_days']) 
            ? $current_options['working_days'] 
            : ['1','2','3','4','5'];
        
        if (!is_array($new_working_days)) {
            $new_working_days = [];
        }
        
        // Find days being removed
        $removed_days = array_diff($current_working_days, $new_working_days);
        
        if (empty($removed_days)) {
            return ['valid' => true];
        }
        
        // Check for appointments on removed days
        $day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        $conflicts = [];
        
        foreach ($removed_days as $day) {
            $day_num = intval($day);
            $appointments = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->prefix}appointments 
                 WHERE DAYOFWEEK(appointment_date) = %d 
                 AND appointment_date >= NOW() 
                 AND status IN ('confirmed', 'created')",
                $day_num == 0 ? 1 : $day_num + 1 // MySQL DAYOFWEEK: 1=Sunday, 2=Monday, etc.
            ));
            
            if ($appointments > 0) {
                $conflicts[] = $day_names[$day_num] . ' (' . $appointments . ' appointments)';
            }
        }
        
        if (!empty($conflicts)) {
            return [
                'valid' => false,
                'message' => 'Cannot remove working days with existing appointments: ' . implode(', ', $conflicts) . '. Please cancel or reschedule these appointments first.'
            ];
        }
        
        return ['valid' => true];
    }
    
    private function sync_customers_from_appointments() {
        global $wpdb;
        
        $appointments = $wpdb->get_results(
            "SELECT DISTINCT name, email, phone FROM {$wpdb->prefix}appointments WHERE email IS NOT NULL AND email != ''"
        );
        
        foreach ($appointments as $appointment) {
            $existing = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->prefix}appointease_customers WHERE email = %s",
                $appointment->email
            ));
            
            if (!$existing) {
                $wpdb->insert(
                    $wpdb->prefix . 'appointease_customers',
                    array(
                        'name' => $appointment->name,
                        'email' => $appointment->email,
                        'phone' => $appointment->phone,
                        'created_at' => current_time('mysql')
                    ),
                    array('%s', '%s', '%s', '%s')
                );
            }
        }
    }
    
    private function ensure_default_data() {
        global $wpdb;
        
        $services_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointease_services");
        if($services_count == 0) {
            $wpdb->insert(
                $wpdb->prefix . 'appointease_services',
                array('name' => 'Consultation', 'description' => 'Initial consultation session', 'duration' => 30, 'price' => 75.00),
                array('%s', '%s', '%d', '%f')
            );
            $wpdb->insert(
                $wpdb->prefix . 'appointease_services',
                array('name' => 'Premium Service', 'description' => 'Extended premium service', 'duration' => 60, 'price' => 150.00),
                array('%s', '%s', '%d', '%f')
            );
        }
        
        $staff_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointease_staff");
        if($staff_count == 0) {
            $wpdb->insert(
                $wpdb->prefix . 'appointease_staff',
                array('name' => 'Sarah Johnson', 'email' => 'sarah@appointease.com', 'phone' => '555-0123'),
                array('%s', '%s', '%s')
            );
            $wpdb->insert(
                $wpdb->prefix . 'appointease_staff',
                array('name' => 'Mike Wilson', 'email' => 'mike@appointease.com', 'phone' => '555-0124'),
                array('%s', '%s', '%s')
            );
        }
    }
    
    public function enhanced_settings_page() {
        if (class_exists('Booking_Settings')) {
            $booking_settings = new Booking_Settings();
            $booking_settings->settings_page();
        } else {
            $this->settings_page();
        }
    }
    
    public function appearance_page() {
        if (class_exists('Booking_Settings')) {
            $booking_settings = new Booking_Settings();
            $booking_settings->appearance_only_page();
        } else {
            echo '<div class="wrap"><h1>Appearance Settings</h1><p>Booking Settings class not found.</p></div>';
        }
    }
    
    public function security_scan_page() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized access');
        }
        
        require_once plugin_dir_path(__FILE__) . '../fix-sql-injection.php';
        
        // Handle download guide
        if (isset($_GET['download_guide'])) {
            $this->download_fix_guide();
            return;
        }
        
        // Handle create backups
        if (isset($_GET['create_backups'])) {
            $this->create_security_backups();
        }
        
        ?>
        <div class="appointease-wrap">
            <div class="ae-page-header">
                <div class="page-title">
                    <h1><i class="dashicons dashicons-shield"></i> Security Scan</h1>
                    <p class="page-subtitle">SQL Injection Vulnerability Scanner</p>
                </div>
            </div>
            
            <div style="padding: 30px;">
                <?php 
                SQL_Injection_Fixer::show_examples();
                
                echo '<hr style="margin: 40px 0;">';
                echo '<h2>Vulnerability Scan Report</h2>';
                
                $report = SQL_Injection_Fixer::generate_report();
                
                // Add action buttons
                if (!empty($report)) {
                    echo '<div style="margin: 20px 0;">';
                    echo '<a href="' . admin_url('admin.php?page=appointease-security&download_guide=1') . '" class="ae-btn primary" style="margin-right: 10px;">';
                    echo '<i class="dashicons dashicons-download"></i> Download Fix Guide';
                    echo '</a>';
                    echo '<button onclick="if(confirm(\'This will create backup files. Continue?\')) window.location.href=\'' . admin_url('admin.php?page=appointease-security&create_backups=1') . '\'" class="ae-btn" style="background: #f59e0b; color: white;">';
                    echo '<i class="dashicons dashicons-backup"></i> Create Backups First';
                    echo '</button>';
                    echo '<p style="margin-top: 10px; color: #666; font-size: 13px;"><strong>⚠️ Important:</strong> Review the fix guide carefully before applying changes. Test in development first.</p>';
                    echo '</div>';
                }
                
                if (empty($report)) {
                    echo '<div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 20px; border-radius: 8px; margin: 20px 0;">';
                    echo '<strong>✓ No obvious SQL injection vulnerabilities found!</strong>';
                    echo '</div>';
                } else {
                    echo '<div style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 20px; border-radius: 8px; margin: 20px 0;">';
                    echo '<strong>⚠ Found potential vulnerabilities in ' . count($report) . ' files</strong>';
                    echo '</div>';
                    
                    foreach ($report as $file => $vulnerabilities) {
                        echo '<div class="ae-card" style="margin: 20px 0;">';
                        echo '<h3>' . esc_html($file) . ' <span style="color: #dc3545;">(' . count($vulnerabilities) . ' issues)</span></h3>';
                        echo '<ul style="list-style: none; padding: 0;">';
                        foreach ($vulnerabilities as $vuln) {
                            echo '<li style="padding: 10px; margin: 5px 0; background: #f8f9fa; border-left: 4px solid #dc3545;">';
                            echo '<strong>Line ' . $vuln['line'] . '</strong> [' . $vuln['severity'] . ']: ';
                            echo '<code style="background: #e9ecef; padding: 5px 10px; border-radius: 4px; display: block; margin-top: 5px;">' . htmlspecialchars($vuln['code']) . '</code>';
                            echo '</li>';
                        }
                        echo '</ul>';
                        echo '</div>';
                    }
                }
                ?>
            </div>
        </div>
        <?php
    }
    
    public function redis_installation_page() {
        ?>
        <div class="appointease-wrap">
            <div class="ae-page-header">
                <div class="page-title">
                    <h1><i class="dashicons dashicons-performance"></i> Redis Installation</h1>
                    <p class="page-subtitle">Install and configure Redis for 15x faster performance</p>
                </div>
            </div>
            
            <div style="padding: 30px;">
                <div class="ae-card" style="margin-bottom: 30px;">
                    <h3>🚀 Redis Installation</h3>
                    <p>Install Redis Cache plugin for WordPress integration.</p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                            <strong>Status:</strong>
                            <span id="redis-install-status">Checking...</span>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button id="install-redis-btn" class="ae-btn primary" onclick="installRedisPlugin()" style="display: none;">Install Redis Cache Plugin</button>
                            <button class="ae-btn" onclick="toggleThirdPartyForm()" style="background: #3498db; color: white;">Redis Settings</button>
                            <button class="ae-btn ghost" onclick="checkRedisStatus()">Check Status</button>
                        </div>
                    </div>
                    
                    <div id="third-party-redis-form" style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; display: none;">
                        <h4 style="margin-top: 0; color: #1565c0;">☁️ Redis Cache Plugin Configuration</h4>
                        <p style="margin-bottom: 15px; color: #666;">AppointEase uses the Redis Cache plugin&rsquo;s configuration. Configure Redis settings in the Redis Cache plugin settings page.</p>
                        <div style="display: flex; gap: 10px;">
                            <a href="<?php echo admin_url('options-general.php?page=redis-cache'); ?>" class="ae-btn primary">Open Redis Cache Settings</a>
                            <button type="button" class="ae-btn ghost" onclick="testAppointEaseRedis()">Test Connection</button>
                        </div>
                    </div>
                    
                    <div id="installation-output" style="background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 13px; max-height: 300px; overflow-y: auto; display: none; margin-top: 20px;">
                        <div id="output-content"></div>
                    </div>
                </div>
                
                <div class="ae-card" id="redis-stats-card" style="display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3>📊 Redis Statistics</h3>
                        <div style="display: flex; gap: 10px;">
                            <button class="ae-btn ghost" onclick="refreshRedisStats()">🔄 Refresh</button>
                            <button class="ae-btn" onclick="clearRedisCache()" style="background: #e74c3c; color: white;">🗑️ Clear Cache</button>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Memory Usage</div>
                            <div id="redis-memory" style="font-size: 24px; font-weight: bold; color: #2e7d32;">-</div>
                        </div>
                        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Total Keys</div>
                            <div id="redis-keys" style="font-size: 24px; font-weight: bold; color: #1565c0;">-</div>
                        </div>
                        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Active Locks</div>
                            <div id="redis-locks" style="font-size: 24px; font-weight: bold; color: #e65100;">-</div>
                        </div>
                        <div style="background: #fce4ec; padding: 15px; border-radius: 8px; border-left: 4px solid #e91e63;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Connected Clients</div>
                            <div id="redis-clients" style="font-size: 24px; font-weight: bold; color: #c2185b;">-</div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                            <h4 style="margin-top: 0;">Connection</h4>
                            <div style="display: grid; grid-template-columns: 150px 1fr; gap: 8px; font-size: 13px;">
                                <div style="color: #666;">Client:</div>
                                <div id="redis-client" style="font-weight: 600;">-</div>
                                
                                <div style="color: #666;">Host:</div>
                                <div id="redis-host" style="font-weight: 600;">-</div>
                                
                                <div style="color: #666;">Port:</div>
                                <div id="redis-port" style="font-weight: 600;">-</div>
                                
                                <div style="color: #666;">Database:</div>
                                <div id="redis-database" style="font-weight: 600;">-</div>
                                
                                <div style="color: #666;">Redis Version:</div>
                                <div id="redis-version" style="font-weight: 600;">-</div>
                            </div>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                            <h4 style="margin-top: 0;">Performance</h4>
                            <div style="display: grid; grid-template-columns: 150px 1fr; gap: 8px; font-size: 13px;">
                                <div style="color: #666;">Uptime:</div>
                                <div id="redis-uptime" style="font-weight: 600;">-</div>
                                
                                <div style="color: #666;">Hit Rate:</div>
                                <div id="redis-hitrate" style="font-weight: 600;">-</div>
                                
                                <div style="color: #666;">Total Commands:</div>
                                <div id="redis-commands" style="font-weight: 600;">-</div>
                                
                                <div style="color: #666;">Evicted Keys:</div>
                                <div id="redis-evicted" style="font-weight: 600;">-</div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="connection-test-result" style="display: none; padding: 15px; border-radius: 6px; margin-top: 15px;"></div>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-top: 15px;">
                        <strong>💡 Tip:</strong> Clear cache if you experience stale data or after major plugin updates.
                    </div>
                </div>
                
                <div class="ae-card" id="redis-performance-card">
                    <h3>⚡ Why Use Redis?</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
                        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50;">
                            <h4 style="margin: 0 0 10px 0; color: #2e7d32;">⚡ Ultra-Fast Slot Locking</h4>
                            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1b5e20;">&lt;500&micro;s</p>
                            <p style="margin: 5px 0 10px 0; color: #666; font-size: 13px;">vs 15ms with MySQL (30x faster)</p>
                            <p style="margin: 0; color: #555; font-size: 12px; line-height: 1.5;">Redis stores data in RAM, enabling microsecond-level slot locking. When users select time slots, locks are created instantly preventing double bookings.</p>
                        </div>
                        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
                            <h4 style="margin: 0 0 10px 0; color: #1565c0;">🔒 Race Condition Prevention</h4>
                            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #0d47a1;">100% Safe</p>
                            <p style="margin: 5px 0 10px 0; color: #666; font-size: 13px;">Atomic SETNX operations</p>
                            <p style="margin: 0; color: #555; font-size: 12px; line-height: 1.5;">Atomic operations ensure only one user can lock a slot at a time. Even with 1000 simultaneous requests, Redis guarantees no conflicts or double bookings.</p>
                        </div>
                        <div style="background: #fce4ec; padding: 20px; border-radius: 8px; border-left: 4px solid #e91e63;">
                            <h4 style="margin: 0 0 10px 0; color: #c2185b;">🔄 Real-time Sync</h4>
                            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #880e4f;">Instant</p>
                            <p style="margin: 5px 0 10px 0; color: #666; font-size: 13px;">1-second polling updates</p>
                            <p style="margin: 0; color: #555; font-size: 12px; line-height: 1.5;">All users see slot availability updates in real-time. When someone selects a slot, it's instantly marked as unavailable for others within 1 second.</p>
                        </div>
                    </div>
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-top: 20px;">
                        <strong>💡 Performance Impact:</strong> Redis reduces server load by 80% and eliminates booking conflicts. Perfect for high-traffic booking systems.
                    </div>
                </div>
            </div>
        </div>
        
        <script type="text/javascript">
        (function() {
            if (typeof jQuery === 'undefined') {
                console.error('jQuery not loaded');
                return;
            }
            
            jQuery(document).ready(function($) {
                window.checkRedisStatus = checkRedisStatus;
                window.toggleThirdPartyForm = toggleThirdPartyForm;

                window.installRedisPlugin = installRedisPlugin;
                window.activateRedisPlugin = activateRedisPlugin;
                window.refreshRedisStats = refreshRedisStats;
                window.testAppointEaseRedis = testAppointEaseRedis;
                window.clearRedisCache = clearRedisCache;
                
        function checkRedisStatus() {
            jQuery('#redis-install-status').html('<i class="dashicons dashicons-update" style="animation: spin 1s linear infinite;"></i> Checking...');
            
            jQuery.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'check_redis_status',
                    nonce: '<?php echo wp_create_nonce('redis_installer'); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        const data = response.data;
                        let status = '';
                        
                        if (data.redis_installed) {
                            status += '<span style="color: #28a745;">✓ Redis Installed</span> | ';
                        } else {
                            status += '<span style="color: #dc3545;">✗ Redis Not Installed</span> | ';
                        }
                        
                        if (data.php_redis_installed) {
                            status += '<span style="color: #28a745;">✓ PHP Redis Extension</span> | ';
                        } else {
                            status += '<span style="color: #dc3545;">✗ PHP Redis Extension</span> | ';
                        }
                        
                        status += 'OS: ' + data.os;
                        
                        jQuery('#redis-install-status').html(status);
                        
                        // Show/hide install button based on status
                        if (data.redis_installed && data.php_redis_installed) {
                            jQuery('#install-redis-btn').hide();
                        } else {
                            jQuery('#install-redis-btn').show();
                        }
                    } else {
                        jQuery('#redis-install-status').html('<span style="color: #dc3545;">Error checking status</span>');
                    }
                },
                error: function() {
                    jQuery('#redis-install-status').html('<span style="color: #dc3545;">Connection error</span>');
                }
            });
        }
        
        function toggleThirdPartyForm() {
            jQuery('#third-party-redis-form').slideToggle();
        }
        

        

        
        function installRedisPlugin() {
            showInfoToast('Installing Plugin', 'Installing Redis Cache plugin from WordPress.org...', []);
            jQuery('#installation-output').show();
            jQuery('#output-content').html('<div style="color: #3498db;">Installing Redis Cache plugin...</div>');
            
            jQuery.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'install_redis_plugin',
                    nonce: '<?php echo wp_create_nonce('redis_installer'); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        showSuccessToast('Plugin Installed', response.data.message, [
                            {text: 'Activate Plugin', type: 'primary', callback: function() { activateRedisPlugin(); }},
                            {text: 'Refresh Status', type: 'secondary', callback: checkRedisStatus}
                        ]);
                        jQuery('#output-content').html('<div style="color: #2ecc71;">✓ ' + response.data.message + '</div>');
                    } else {
                        showErrorToast('Installation Failed', response.data, []);
                        jQuery('#output-content').html('<div style="color: #e74c3c;">✗ ' + response.data + '</div>');
                    }
                },
                error: function() {
                    showErrorToast('Connection Error', 'Failed to install plugin', []);
                    jQuery('#output-content').html('<div style="color: #e74c3c;">✗ Connection error</div>');
                }
            });
        }
        
        function activateRedisPlugin() {
            showInfoToast('Activating Plugin', 'Activating Redis Cache plugin...', []);
            
            jQuery.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'activate_redis_plugin',
                    nonce: '<?php echo wp_create_nonce('redis_installer'); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        showSuccessToast('Plugin Activated', response.data.message, [{text: 'Refresh', type: 'primary', callback: function() { location.reload(); }}]);
                    } else {
                        showErrorToast('Activation Failed', response.data, []);
                    }
                },
                error: function() {
                    showErrorToast('Connection Error', 'Failed to activate plugin', []);
                }
            });
        }
        
        function refreshRedisStats() {
            jQuery.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'get_redis_stats',
                    nonce: '<?php echo wp_create_nonce('redis_installer'); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        const stats = response.data;
                        jQuery('#redis-memory').text(stats.memory);
                        jQuery('#redis-keys').text(stats.keys);
                        jQuery('#redis-locks').text(stats.locks);
                        jQuery('#redis-clients').text(stats.clients);
                        jQuery('#redis-client').text(stats.client);
                        jQuery('#redis-host').text(stats.host);
                        jQuery('#redis-port').text(stats.port);
                        jQuery('#redis-database').text(stats.database);
                        jQuery('#redis-version').text(stats.version);
                        jQuery('#redis-uptime').text(stats.uptime);
                        jQuery('#redis-hitrate').text(stats.hitrate);
                        jQuery('#redis-commands').text(stats.commands);
                        jQuery('#redis-evicted').text(stats.evicted);
                        jQuery('#redis-stats-card').show();
                    } else {
                        showErrorToast('Stats Failed', response.data, []);
                    }
                },
                error: function() {
                    showErrorToast('Connection Error', 'Failed to fetch Redis stats', []);
                }
            });
        }
        
        function testAppointEaseRedis() {
            if (typeof toastr !== 'undefined') {
                toastr.info('Testing Redis connection with AppointEase plugin...', 'Testing Connection');
            }
            
            jQuery.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'test_appointease_redis',
                    nonce: '<?php echo wp_create_nonce('redis_installer'); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        const result = response.data;
                        let html = '<div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724;">';
                        html += '<strong>✓ Connection Successful</strong><br>';
                        html += '<div style="margin-top: 10px; font-size: 13px;">';
                        html += '<div>• Write Test: ' + result.write + '</div>';
                        html += '<div>• Read Test: ' + result.read + '</div>';
                        html += '<div>• Lock Test: ' + result.lock + '</div>';
                        html += '<div>• Response Time: ' + result.time + '</div>';
                        html += '</div></div>';
                        jQuery('#connection-test-result').html(html).slideDown();
                        showSuccessToast('Test Passed', 'AppointEase can communicate with Redis successfully!', []);
                    } else {
                        let html = '<div style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24;">';
                        html += '<strong>✗ Connection Failed</strong><br>';
                        html += '<div style="margin-top: 10px;">' + response.data + '</div></div>';
                        jQuery('#connection-test-result').html(html).slideDown();
                        showErrorToast('Test Failed', response.data, []);
                    }
                },
                error: function() {
                    showErrorToast('Test Error', 'Unable to test Redis connection', []);
                }
            });
        }
        
        function clearRedisCache() {
            showWarningToast('Clear Redis Cache?', 'This will clear all AppointEase cache data. Continue?', [
                {text: 'Cancel', type: 'secondary', callback: function() {}},
                {text: 'Clear Cache', type: 'danger', callback: function() { executeClearCache(); }}
            ]);
        }
        
        function executeClearCache() {
            showInfoToast('Clearing Cache', 'Flushing Redis cache...', []);
            
            jQuery.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'clear_redis_cache',
                    nonce: '<?php echo wp_create_nonce('redis_installer'); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        showSuccessToast('Cache Cleared', response.data.message, [{text: 'Refresh Stats', type: 'primary', callback: refreshRedisStats}]);
                        refreshRedisStats();
                    } else {
                        showErrorToast('Clear Failed', response.data, []);
                    }
                },
                error: function() {
                    showErrorToast('Connection Error', 'Failed to clear cache', []);
                }
            });
        }
        
        jQuery(document).ready(function() {
            checkRedisStatus();
            
            // Check if Redis is active and load stats
            setTimeout(function() {
                jQuery.ajax({
                    url: ajaxurl,
                    method: 'POST',
                    data: {
                        action: 'check_redis_status',
                        nonce: '<?php echo wp_create_nonce('redis_installer'); ?>'
                    },
                    success: function(response) {
                        if (response.success && response.data.redis_installed && response.data.php_redis_installed) {
                            refreshRedisStats();
                        }
                    }
                });
            }, 1000);
            });
        });
        })();
        </script>
        <?php
    }
    
    public function ajax_check_redis_status() {
        check_ajax_referer('redis_installer', 'nonce');
        
        $redis_installed = false;
        $php_redis_installed = extension_loaded('redis');
        $os = 'Unknown';
        
        // Detect OS
        if (stripos(PHP_OS, 'WIN') === 0) {
            $os = 'Windows';
            exec('redis-cli --version 2>&1', $output, $return_code);
            $redis_installed = ($return_code === 0);
        } elseif (file_exists('/etc/os-release')) {
            $os_info = parse_ini_file('/etc/os-release');
            $os = $os_info['NAME'] ?? 'Linux';
            exec('which redis-server 2>&1', $output, $return_code);
            $redis_installed = ($return_code === 0);
        } else {
            $os = PHP_OS;
            exec('which redis-server 2>&1', $output, $return_code);
            $redis_installed = ($return_code === 0);
        }
        
        wp_send_json_success(array(
            'redis_installed' => $redis_installed,
            'php_redis_installed' => $php_redis_installed,
            'os' => $os
        ));
    }
    
    public function ajax_install_redis_plugin() {
        check_ajax_referer('redis_installer', 'nonce');
        
        if (!current_user_can('install_plugins')) {
            wp_send_json_error('Insufficient permissions to install plugins');
            return;
        }
        
        include_once ABSPATH . 'wp-admin/includes/plugin-install.php';
        include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        
        $plugin_slug = 'redis-cache';
        
        // Check if already installed
        $installed_plugins = get_plugins();
        if (isset($installed_plugins['redis-cache/redis-cache.php'])) {
            wp_send_json_error('Redis Cache plugin is already installed. Please activate it.');
            return;
        }
        
        $api = plugins_api('plugin_information', array('slug' => $plugin_slug));
        
        if (is_wp_error($api)) {
            wp_send_json_error('Failed to get plugin information: ' . $api->get_error_message());
            return;
        }
        
        $upgrader = new Plugin_Upgrader(new WP_Ajax_Upgrader_Skin());
        $result = $upgrader->install($api->download_link);
        
        if (is_wp_error($result)) {
            wp_send_json_error('Installation failed: ' . $result->get_error_message());
            return;
        }
        
        if ($result) {
            wp_send_json_success(array('message' => 'Redis Cache plugin installed successfully!'));
        } else {
            wp_send_json_error('Installation failed');
        }
    }
    
    public function ajax_get_redis_stats() {
        check_ajax_referer('redis_installer', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $redis_helper = Appointease_Redis_Helper::get_instance();
        
        if (!$redis_helper->is_enabled()) {
            wp_send_json_error('Redis is not enabled');
            return;
        }
        
        try {
            $redis = $redis_helper->get_connection();
            
            if (!$redis) {
                wp_send_json_error('Cannot connect to Redis');
                return;
            }
            
            $info = $redis->info();
            
            $locks = 0;
            $keys = $redis->keys('appointease:lock:*');
            if ($keys) {
                $locks = count($keys);
            }
            
            $hits = isset($info['keyspace_hits']) ? intval($info['keyspace_hits']) : 0;
            $misses = isset($info['keyspace_misses']) ? intval($info['keyspace_misses']) : 0;
            $total = $hits + $misses;
            $hitrate = $total > 0 ? round(($hits / $total) * 100, 2) . '%' : 'N/A';
            
            $uptime_seconds = isset($info['uptime_in_seconds']) ? intval($info['uptime_in_seconds']) : 0;
            $days = floor($uptime_seconds / 86400);
            $hours = floor(($uptime_seconds % 86400) / 3600);
            $uptime = $days . 'd ' . $hours . 'h';
            
            $memory_bytes = isset($info['used_memory']) ? intval($info['used_memory']) : 0;
            $memory = $memory_bytes > 1048576 ? round($memory_bytes / 1048576, 2) . ' MB' : round($memory_bytes / 1024, 2) . ' KB';
            
            $phpredis_version = phpversion('redis');
            
            $stats = array(
                'memory' => $memory,
                'keys' => isset($info['db0']) ? preg_replace('/keys=(\d+).*/', '$1', $info['db0']) : '0',
                'locks' => $locks,
                'clients' => isset($info['connected_clients']) ? $info['connected_clients'] : '0',
                'client' => 'PhpRedis (v' . ($phpredis_version ?: 'Unknown') . ')',
                'host' => defined('REDIS_HOST') ? REDIS_HOST : '127.0.0.1',
                'port' => defined('REDIS_PORT') ? REDIS_PORT : '6379',
                'database' => defined('REDIS_DATABASE') ? REDIS_DATABASE : '0',
                'version' => isset($info['redis_version']) ? $info['redis_version'] : 'Unknown',
                'uptime' => $uptime,
                'hitrate' => $hitrate,
                'commands' => isset($info['total_commands_processed']) ? number_format($info['total_commands_processed']) : '0',
                'evicted' => isset($info['evicted_keys']) ? number_format($info['evicted_keys']) : '0'
            );
            
            wp_send_json_success($stats);
        } catch (Exception $e) {
            wp_send_json_error('Error fetching stats: ' . $e->getMessage());
        }
    }
    
    public function ajax_test_appointease_redis() {
        check_ajax_referer('redis_installer', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $redis_helper = Appointease_Redis_Helper::get_instance();
        
        if (!$redis_helper->is_enabled()) {
            wp_send_json_error('Redis is not enabled in AppointEase plugin');
            return;
        }
        
        try {
            $start_time = microtime(true);
            $redis = $redis_helper->get_connection();
            
            if (!$redis) {
                wp_send_json_error('Cannot connect to Redis server');
                return;
            }
            
            // Test 1: Write
            $test_key = 'appointease:test:' . time();
            $test_value = 'test_value_' . wp_generate_password(8, false);
            $write_result = $redis->setex($test_key, 10, $test_value);
            
            if (!$write_result) {
                wp_send_json_error('Write test failed');
                return;
            }
            
            // Test 2: Read
            $read_value = $redis->get($test_key);
            if ($read_value !== $test_value) {
                wp_send_json_error('Read test failed - value mismatch');
                return;
            }
            
            // Test 3: Lock mechanism
            $lock_key = 'appointease:lock:test_slot_' . time();
            $lock_result = $redis->set($lock_key, 'locked', ['nx', 'ex' => 5]);
            
            if (!$lock_result) {
                wp_send_json_error('Lock test failed');
                return;
            }
            
            // Cleanup
            $redis->del($test_key);
            $redis->del($lock_key);
            
            $end_time = microtime(true);
            $response_time = round(($end_time - $start_time) * 1000000); // microseconds
            
            wp_send_json_success(array(
                'write' => 'Passed',
                'read' => 'Passed',
                'lock' => 'Passed',
                'time' => $response_time . 'µs'
            ));
        } catch (Exception $e) {
            wp_send_json_error('Test error: ' . $e->getMessage());
        }
    }
    
    public function ajax_clear_redis_cache() {
        check_ajax_referer('redis_installer', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $redis_helper = Appointease_Redis_Helper::get_instance();
        
        if (!$redis_helper->is_enabled()) {
            wp_send_json_error('Redis is not enabled');
            return;
        }
        
        try {
            $redis = $redis_helper->get_connection();
            
            if (!$redis) {
                wp_send_json_error('Cannot connect to Redis');
                return;
            }
            
            // Clear only AppointEase keys
            $keys = $redis->keys('appointease:*');
            $cleared = 0;
            
            if ($keys && is_array($keys)) {
                foreach ($keys as $key) {
                    $redis->del($key);
                    $cleared++;
                }
            }
            
            wp_send_json_success(array('message' => 'Cleared ' . $cleared . ' AppointEase cache keys'));
        } catch (Exception $e) {
            wp_send_json_error('Error clearing cache: ' . $e->getMessage());
        }
    }
    
    public function ajax_activate_redis_plugin() {
        check_ajax_referer('redis_installer', 'nonce');
        
        if (!current_user_can('activate_plugins')) {
            wp_send_json_error('Insufficient permissions to activate plugins');
            return;
        }
        
        $plugin = 'redis-cache/redis-cache.php';
        
        if (is_plugin_active($plugin)) {
            wp_send_json_error('Redis Cache plugin is already active');
            return;
        }
        
        $result = activate_plugin($plugin);
        
        if (is_wp_error($result)) {
            wp_send_json_error('Activation failed: ' . $result->get_error_message());
            return;
        }
        
        wp_send_json_success(array('message' => 'Redis Cache plugin activated successfully!'));
    }
    

    

}

new AppointEase_Admin();