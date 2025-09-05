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
                        <a href="#" class="action-btn tertiary">
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
        </div>
        <?php
    }
    
    public function save_service() {
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