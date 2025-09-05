<?php
class Booking_Settings {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'init_settings'));
    }
    
    public function add_settings_page() {
        add_submenu_page(
            'appointease',
            'Settings',
            'Settings',
            'manage_options',
            'appointease-settings',
            array($this, 'settings_page')
        );
    }
    
    public function init_settings() {
        register_setting('appointease_settings', 'appointease_options');
        
        add_settings_section(
            'appointease_general',
            'General Settings',
            null,
            'appointease_settings'
        );
        
        add_settings_field(
            'business_hours',
            'Business Hours',
            array($this, 'business_hours_field'),
            'appointease_settings',
            'appointease_general'
        );
    }
    
    public function settings_page() {
        ?>
        <div class="wrap">
            <h1>AppointEase Settings</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('appointease_settings');
                do_settings_sections('appointease_settings');
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }
    
    public function business_hours_field() {
        $options = get_option('appointease_options', array());
        $start_time = isset($options['start_time']) ? $options['start_time'] : '09:00';
        $end_time = isset($options['end_time']) ? $options['end_time'] : '17:00';
        ?>
        <input type="time" name="appointease_options[start_time]" value="<?php echo $start_time; ?>" />
        to
        <input type="time" name="appointease_options[end_time]" value="<?php echo $end_time; ?>" />
        <?php
    }
}

new Booking_Settings();