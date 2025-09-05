<?php
class AppointEase_Admin {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        add_action('wp_ajax_save_service', array($this, 'save_service'));
        add_action('wp_ajax_save_staff', array($this, 'save_staff'));
        add_action('wp_ajax_get_service', array($this, 'get_service'));
        add_action('wp_ajax_get_staff', array($this, 'get_staff'));
        add_action('wp_ajax_delete_service', array($this, 'delete_service'));
        add_action('wp_ajax_delete_staff', array($this, 'delete_staff'));
        add_action('wp_ajax_update_appointment_status', array($this, 'update_appointment_status'));
        add_action('wp_ajax_delete_appointment', array($this, 'delete_appointment'));
        add_action('admin_init', array($this, 'init_settings'));
    }
    
    public function enqueue_admin_assets($hook) {
        if (strpos($hook, 'appointease') !== false) {
            wp_enqueue_style('appointease-admin', BOOKING_PLUGIN_URL . 'admin/appointease-admin.css', array(), '1.0.0');
            wp_enqueue_script('appointease-admin', BOOKING_PLUGIN_URL . 'admin/appointease-admin.js', array('jquery'), '1.0.0', true);
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
            'Settings',
            'Settings',
            'manage_options',
            'appointease-settings',
            array($this, 'settings_page')
        );
    }
    
    public function dashboard_page() {
        global $wpdb;
        $appointments_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointments");
        $services_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointease_services");
        $staff_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointease_staff");
        $appointments = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}appointments ORDER BY appointment_date DESC LIMIT 5");
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
                            <button class="am-button am-button--primary" onclick="openServiceModal()">
                                <span class="am-icon-plus"></span>
                                Add Service
                            </button>
                            <button class="am-button am-button--secondary" onclick="openStaffModal()">
                                <span class="am-icon-users"></span>
                                Add Employee
                            </button>
                        </div>
                    </div>
                </div>
            <div class="amelia-dashboard">
                <div class="amelia-stats">
                    <div class="stat-card bookings">
                        <div class="stat-info">
                            <h3><?php echo $appointments_count; ?></h3>
                            <p>Total Appointments</p>
                            <span class="trend">+12% this month</span>
                        </div>
                    </div>
                    <div class="stat-card services">
                        <div class="stat-info">
                            <h3><?php echo $services_count; ?></h3>
                            <p>Active Services</p>
                            <span class="trend">Ready to book</span>
                        </div>
                    </div>
                    <div class="stat-card team">
                        <div class="stat-info">
                            <h3><?php echo $staff_count; ?></h3>
                            <p>Team Members</p>
                            <span class="trend">Available today</span>
                        </div>
                    </div>
                </div>
                <div class="quick-actions">
                    <h3>Quick Actions</h3>
                    <div class="action-buttons">
                        <a href="admin.php?page=appointease-services" class="action-btn primary">
                            Add New Service
                        </a>
                        <a href="admin.php?page=appointease-staff" class="action-btn secondary">
                            Add Team Member
                        </a>
                        <a href="admin.php?page=appointease-appointments" class="action-btn tertiary">
                            View All Appointments
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
    
    public function services_page() {
        global $wpdb;
        $this->ensure_default_data();
        $services = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}appointease_services ORDER BY id DESC");
        ?>
        <div class="appointease-wrap">
            <div class="ae-page-header">
                <h1>Services</h1>
                <button class="ae-btn primary" onclick="openServiceModal()">+ ADD SERVICE</button>
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
        ?>
        <div class="appointease-wrap">
            <div class="ae-page-header">
                <h1>Staff</h1>
                <button class="ae-btn primary" onclick="openStaffModal()">+ ADD STAFF</button>
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
        
        if($id) {
            $wpdb->update(
                $wpdb->prefix . 'appointease_services',
                array('name' => $name, 'duration' => $duration, 'price' => $price, 'description' => $description),
                array('id' => $id)
            );
        } else {
            $wpdb->insert(
                $wpdb->prefix . 'appointease_services',
                array('name' => $name, 'duration' => $duration, 'price' => $price, 'description' => $description)
            );
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
        
        if($id) {
            $wpdb->update(
                $wpdb->prefix . 'appointease_staff',
                array('name' => $name, 'email' => $email, 'phone' => $phone),
                array('id' => $id)
            );
        } else {
            $wpdb->insert(
                $wpdb->prefix . 'appointease_staff',
                array('name' => $name, 'email' => $email, 'phone' => $phone)
            );
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
                <h1>Appointments</h1>
                <div class="ae-header-actions">
                    <input type="text" id="appointment-search" placeholder="Search appointments..." class="ae-search-input" />
                    <select id="status-filter" class="ae-filter-select">
                        <option value="">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>
            
            <div class="ae-table-container">
                <table class="ae-table">
                    <thead>
                        <tr>
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
        </div>
        <?php
    }
    
    public function update_appointment_status() {
        check_ajax_referer('appointease_nonce', '_wpnonce');
        global $wpdb;
        $id = intval($_POST['id']);
        $status = sanitize_text_field($_POST['status']);
        
        $result = $wpdb->update(
            $wpdb->prefix . 'appointments',
            array('status' => $status),
            array('id' => $id)
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
    
    public function init_settings() {
        register_setting('appointease_settings', 'appointease_options');
    }
    
    public function settings_page() {
        if (isset($_POST['submit'])) {
            update_option('appointease_options', $_POST['appointease_options']);
            echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
        }
        
        $options = get_option('appointease_options', array());
        $start_time = isset($options['start_time']) ? $options['start_time'] : '09:00';
        $end_time = isset($options['end_time']) ? $options['end_time'] : '17:00';
        $slot_duration = isset($options['slot_duration']) ? $options['slot_duration'] : 30;
        ?>
        <div class="appointease-wrap">
            <div class="ae-page-header">
                <h1>Settings</h1>
            </div>
            
            <form method="post" class="ae-settings-form">
                <div class="ae-card">
                    <h3>Business Hours</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Start Time</label>
                            <input type="time" name="appointease_options[start_time]" value="<?php echo $start_time; ?>" />
                        </div>
                        <div class="form-group">
                            <label>End Time</label>
                            <input type="time" name="appointease_options[end_time]" value="<?php echo $end_time; ?>" />
                        </div>
                    </div>
                </div>
                
                <div class="ae-card">
                    <h3>Time Slots</h3>
                    <div class="form-group">
                        <label>Slot Duration</label>
                        <select name="appointease_options[slot_duration]">
                            <option value="15" <?php selected($slot_duration, 15); ?>>15 minutes</option>
                            <option value="30" <?php selected($slot_duration, 30); ?>>30 minutes</option>
                            <option value="60" <?php selected($slot_duration, 60); ?>>60 minutes</option>
                        </select>
                    </div>
                </div>
                
                <button type="submit" name="submit" class="ae-btn primary">Save Settings</button>
            </form>
        </div>
        <?php
    }
    
    private function ensure_default_data() {
        global $wpdb;
        
        $services_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointease_services");
        if($services_count == 0) {
            $wpdb->insert(
                $wpdb->prefix . 'appointease_services',
                array('name' => 'Consultation', 'description' => 'Initial consultation session', 'duration' => 30, 'price' => 75.00)
            );
            $wpdb->insert(
                $wpdb->prefix . 'appointease_services',
                array('name' => 'Premium Service', 'description' => 'Extended premium service', 'duration' => 60, 'price' => 150.00)
            );
        }
        
        $staff_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}appointease_staff");
        if($staff_count == 0) {
            $wpdb->insert(
                $wpdb->prefix . 'appointease_staff',
                array('name' => 'Sarah Johnson', 'email' => 'sarah@appointease.com', 'phone' => '555-0123')
            );
            $wpdb->insert(
                $wpdb->prefix . 'appointease_staff',
                array('name' => 'Mike Wilson', 'email' => 'mike@appointease.com', 'phone' => '555-0124')
            );
        }
    }
}

new AppointEase_Admin();