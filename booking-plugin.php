<?php
/**
 * Plugin Name: AppointEase
 * Plugin URI: https://appointease.com
 * Description: Smart appointment booking system with intuitive design and powerful scheduling tools
 * Version: 1.0.0
 * Author: AppointEase Team
 * Author URI: https://appointease.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: appointease
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    wp_die('Direct access not allowed.');
}

define('BOOKING_PLUGIN_VERSION', '1.0.0');
define('BOOKING_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('BOOKING_PLUGIN_URL', plugin_dir_url(__FILE__));

// Secure file includes with validation
function booking_plugin_require_file($file) {
    $full_path = BOOKING_PLUGIN_PATH . $file;
    if (file_exists($full_path) && is_readable($full_path)) {
        require_once $full_path;
    } else {
        wp_die('Required plugin file not found: ' . esc_html($file));
    }
}

booking_plugin_require_file('includes/class-activator.php');
booking_plugin_require_file('includes/class-deactivator.php');
booking_plugin_require_file('includes/class-booking-plugin.php');
booking_plugin_require_file('includes/class-settings.php');
booking_plugin_require_file('includes/class-db-seeder.php');
booking_plugin_require_file('includes/class-db-reset.php');
booking_plugin_require_file('includes/class-db-reset-filters.php');
booking_plugin_require_file('includes/class-api-endpoints.php');
booking_plugin_require_file('includes/class-heartbeat-handler.php');
booking_plugin_require_file('includes/session-manager.php');

register_activation_hook(__FILE__, array('Booking_Activator', 'activate'));
register_deactivation_hook(__FILE__, array('Booking_Deactivator', 'deactivate'));

function run_booking_plugin() {
    $plugin = Booking_Plugin::get_instance();
    
    // Initialize API endpoints, heartbeat handler, and reset filters
    add_action('init', function() {
        new Booking_API_Endpoints();
        new Appointease_Heartbeat_Handler();
        new Booking_DB_Reset_Filters();
    });
    
    // Localize script with WordPress REST API URL
    add_action('wp_enqueue_scripts', function() {
        if (wp_script_is('booking-frontend', 'registered')) {
            wp_localize_script('booking-frontend', 'bookingAPI', array(
                'root' => esc_url_raw(rest_url()),
                'nonce' => wp_create_nonce('wp_rest')
            ));
        }
    });
    
    // Disable caching for development
    add_action('init', function() {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            header('Cache-Control: no-cache, no-store, must-revalidate');
            header('Pragma: no-cache');
            header('Expires: 0');
        }
    });
}
run_booking_plugin();

if (is_admin()) {
    require_once BOOKING_PLUGIN_PATH . 'admin/appointease-admin.php';
    require_once BOOKING_PLUGIN_PATH . 'admin/db-reset-admin.php';
    
    // Add seeder menu item
    add_action('admin_menu', function() {
        add_submenu_page(
            'booking-admin',
            'Seed Database',
            'Seed Database',
            'manage_options',
            'booking-seeder',
            'booking_plugin_seeder_page'
        );
    });
}

function booking_plugin_seeder_page() {
    if (isset($_POST['seed_data']) && wp_verify_nonce($_POST['_wpnonce'], 'seed_data_action')) {
        if (class_exists('Booking_DB_Seeder')) {
            Booking_DB_Seeder::seed_data();
            echo '<div class="notice notice-success"><p>Database seeded successfully!</p></div>';
        } else {
            echo '<div class="notice notice-error"><p>Seeder class not found!</p></div>';
        }
    }
    if (isset($_POST['clear_data']) && wp_verify_nonce($_POST['_wpnonce'], 'clear_data_action')) {
        if (class_exists('Booking_DB_Seeder')) {
            Booking_DB_Seeder::clear_data();
            echo '<div class="notice notice-success"><p>Database cleared successfully!</p></div>';
        } else {
            echo '<div class="notice notice-error"><p>Seeder class not found!</p></div>';
        }
    }
    ?>
    <div class="wrap">
        <h1>Database Seeder</h1>
        <form method="post">
            <?php wp_nonce_field('seed_data_action'); ?>
            <p>Populate the database with sample data for testing.</p>
            <p class="submit">
                <input type="submit" name="seed_data" class="button-primary" value="Seed Database" />
            </p>
        </form>
        <form method="post">
            <?php wp_nonce_field('clear_data_action'); ?>
            <p class="submit">
                <input type="submit" name="clear_data" class="button-secondary" value="Clear Data" onclick="return confirm('Are you sure?')" />
            </p>
        </form>
    </div>
    <?php
}