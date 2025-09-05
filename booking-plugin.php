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
    exit;
}

define('BOOKING_PLUGIN_VERSION', '1.0.0');
define('BOOKING_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('BOOKING_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once BOOKING_PLUGIN_PATH . 'includes/class-activator.php';
require_once BOOKING_PLUGIN_PATH . 'includes/class-deactivator.php';
require_once BOOKING_PLUGIN_PATH . 'includes/class-booking-plugin.php';

register_activation_hook(__FILE__, array('Booking_Activator', 'activate'));
register_deactivation_hook(__FILE__, array('Booking_Deactivator', 'deactivate'));

function run_booking_plugin() {
    $plugin = Booking_Plugin::get_instance();
}
run_booking_plugin();

if (is_admin()) {
    require_once BOOKING_PLUGIN_PATH . 'admin/appointease-admin.php';
}