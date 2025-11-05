<?php
class Booking_Settings {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'init_settings'));
        add_action('wp_head', array($this, 'output_custom_css'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_custom_styles'), 20);
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
        
        // Appearance Settings Section
        add_settings_section(
            'appointease_appearance',
            'Appearance Settings',
            array($this, 'appearance_section_callback'),
            'appointease_settings'
        );
        
        add_settings_field(
            'primary_color',
            'Primary Color',
            array($this, 'primary_color_field'),
            'appointease_settings',
            'appointease_appearance'
        );
        
        add_settings_field(
            'button_text',
            'Book Appointment Button Text',
            array($this, 'button_text_field'),
            'appointease_settings',
            'appointease_appearance'
        );
        
        add_settings_field(
            'secondary_color',
            'Secondary Color',
            array($this, 'secondary_color_field'),
            'appointease_settings',
            'appointease_appearance'
        );
        
        add_settings_field(
            'success_color',
            'Success Color',
            array($this, 'success_color_field'),
            'appointease_settings',
            'appointease_appearance'
        );
        
        add_settings_field(
            'border_radius',
            'Border Radius',
            array($this, 'border_radius_field'),
            'appointease_settings',
            'appointease_appearance'
        );
        
        add_settings_field(
            'font_size',
            'Font Size',
            array($this, 'font_size_field'),
            'appointease_settings',
            'appointease_appearance'
        );
        
        add_settings_field(
            'background_color',
            'Background Color',
            array($this, 'background_color_field'),
            'appointease_settings',
            'appointease_appearance'
        );
        
        add_settings_field(
            'text_color',
            'Text Color',
            array($this, 'text_color_field'),
            'appointease_settings',
            'appointease_appearance'
        );
        
        add_settings_field(
            'header_color',
            'Header Color',
            array($this, 'header_color_field'),
            'appointease_settings',
            'appointease_appearance'
        );
        
        add_settings_field(
            'heading_color',
            'Heading Color',
            array($this, 'heading_color_field'),
            'appointease_settings',
            'appointease_appearance'
        );
        
        add_settings_field(
            'active_step_color',
            'Active Step Color',
            array($this, 'active_step_color_field'),
            'appointease_settings',
            'appointease_appearance'
        );
        
        add_settings_field(
            'inactive_step_color',
            'Inactive Step Color',
            array($this, 'inactive_step_color_field'),
            'appointease_settings',
            'appointease_appearance'
        );
        
        add_settings_field(
            'border_color',
            'Border Color',
            array($this, 'border_color_field'),
            'appointease_settings',
            'appointease_appearance'
        );
        
        // Redis Settings Section
        add_settings_section(
            'appointease_redis',
            'Redis Installation',
            array($this, 'redis_section_callback'),
            'appointease_settings'
        );
        
        add_settings_field(
            'redis_installer',
            'Install Redis on VPS',
            array($this, 'redis_installer_field'),
            'appointease_settings',
            'appointease_redis'
        );
    }
    
    public function settings_page() {
        ?>
        <div class="wrap">
            <h1>AppointEase Settings</h1>
            
            <div class="appointease-settings-container" style="display: flex; gap: 30px;">
                <div class="settings-form" style="flex: 1;">
                    <form method="post" action="options.php">
                        <?php
                        settings_fields('appointease_settings');
                        do_settings_sections('appointease_settings');
                        submit_button();
                        ?>
                    </form>
                </div>
                
                <div class="settings-preview" style="flex: 1; max-width: 400px;">
                    <h3>Preview</h3>
                    <div class="preview-container" id="preview-container" style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #f9f9f9;">
                        <div class="preview-header" id="preview-header" style="background: #1CBC9B; color: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; text-align: center;">
                            <strong>AppointEase</strong>
                        </div>
                        <div class="preview-card" id="preview-card" style="background: white; border: 1px solid #e0e0e0; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                            <p id="preview-text" style="color: #333; margin: 0 0 10px;">Sample booking form text</p>
                            <input type="text" id="preview-input" placeholder="Your name" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px; margin-bottom: 10px;" />
                        </div>
                        <div class="preview-button" id="preview-button" style="background: #1CBC9B; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; width: 100%; text-align: center; font-weight: 600;">
                            <span id="preview-button-text">Book Appointment</span>
                        </div>
                        <div class="preview-success" id="preview-success" style="background: #28a745; color: white; padding: 10px; border-radius: 6px; margin-top: 15px; text-align: center; font-size: 14px;">
                            ✓ Success Message
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .appointease-settings-container {
                    margin-top: 20px;
                }
                
                .preview-container {
                    position: sticky;
                    top: 32px;
                }
                
                @media (max-width: 1200px) {
                    .appointease-settings-container {
                        flex-direction: column;
                    }
                    
                    .settings-preview {
                        max-width: none;
                    }
                }
            </style>
            
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    const primaryColorInput = document.querySelector('input[name="appointease_options[primary_color]"]');
                    const successColorInput = document.querySelector('input[name="appointease_options[success_color]"]');
                    const buttonTextInput = document.querySelector('input[name="appointease_options[button_text]"]');
                    
                    const previewHeader = document.querySelector('.preview-header');
                    const previewButton = document.querySelector('.preview-button');
                    const previewSuccess = document.querySelector('.preview-success');
                    const previewButtonText = document.getElementById('preview-button-text');
                    
                    function updatePreview() {
                        const primaryColor = document.querySelector('input[name="appointease_options[primary_color]"]')?.value || '#1CBC9B';
                        const successColor = document.querySelector('input[name="appointease_options[success_color]"]')?.value || '#28a745';
                        const backgroundColor = document.querySelector('input[name="appointease_options[background_color]"]')?.value || '#ffffff';
                        const textColor = document.querySelector('input[name="appointease_options[text_color]"]')?.value || '#333333';
                        const borderColor = document.querySelector('input[name="appointease_options[border_color]"]')?.value || '#e0e0e0';
                        const borderRadius = document.querySelector('input[name="appointease_options[border_radius]"]')?.value || '8';
                        const fontSize = document.querySelector('select[name="appointease_options[font_size]"]')?.value || '16';
                        const buttonText = document.querySelector('input[name="appointease_options[button_text]"]')?.value || 'Book Appointment';
                        
                        const container = document.getElementById('preview-container');
                        const header = document.getElementById('preview-header');
                        const card = document.getElementById('preview-card');
                        const text = document.getElementById('preview-text');
                        const input = document.getElementById('preview-input');
                        const button = document.getElementById('preview-button');
                        const success = document.getElementById('preview-success');
                        const buttonTextEl = document.getElementById('preview-button-text');
                        
                        if (container) container.style.fontSize = fontSize + 'px';
                        if (header) {
                            header.style.background = primaryColor;
                            header.style.borderRadius = borderRadius + 'px';
                        }
                        if (card) {
                            card.style.background = backgroundColor;
                            card.style.borderColor = borderColor;
                            card.style.borderRadius = borderRadius + 'px';
                        }
                        if (text) text.style.color = textColor;
                        if (input) {
                            input.style.borderColor = borderColor;
                            input.style.borderRadius = borderRadius + 'px';
                            input.style.background = backgroundColor;
                            input.style.color = textColor;
                        }
                        if (button) {
                            button.style.background = primaryColor;
                            button.style.borderRadius = borderRadius + 'px';
                        }
                        if (success) {
                            success.style.background = successColor;
                            success.style.borderRadius = borderRadius + 'px';
                        }
                        if (buttonTextEl) buttonTextEl.textContent = buttonText;
                    }
                    
                    // Update preview on any input change
                    document.addEventListener('input', updatePreview);
                    document.addEventListener('change', updatePreview);
                    
                    // Initial preview update
                    updatePreview();
                });
            </script>
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
    
    public function appearance_section_callback() {
        echo '<p>Customize the appearance of your booking form.</p>';
    }
    
    public function redis_section_callback() {
        echo '<p>Install Redis on your VPS for <1ms slot locking performance. Optional - MySQL fallback available.</p>';
    }
    
    public function redis_installer_field() {
        ?>
        <div id="redis-installer" style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #1CBC9B;">
            <h3 style="margin-top: 0;">🚀 One-Click Redis Installation</h3>
            <p>Detect your VPS OS and install Redis automatically with PHP extension.</p>
            
            <div id="redis-status" style="margin: 15px 0; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
                <strong>Status:</strong> <span id="redis-status-text">Checking...</span>
            </div>
            
            <button type="button" id="install-redis-btn" class="button button-primary" style="margin-right: 10px;">
                <span class="dashicons dashicons-download" style="margin-top: 3px;"></span> Install Redis
            </button>
            
            <button type="button" id="check-redis-btn" class="button">
                <span class="dashicons dashicons-update" style="margin-top: 3px;"></span> Check Status
            </button>
            
            <div id="redis-output" style="margin-top: 15px; padding: 12px; background: #263238; color: #00ff00; border-radius: 6px; font-family: monospace; font-size: 13px; max-height: 300px; overflow-y: auto; display: none;">
                <div id="redis-log"></div>
            </div>
            
            <details style="margin-top: 15px;">
                <summary style="cursor: pointer; font-weight: 600; color: #1CBC9B;">📖 Manual Installation Commands</summary>
                <div style="margin-top: 10px; padding: 15px; background: white; border-radius: 6px;">
                    <h4>Ubuntu/Debian:</h4>
                    <code style="display: block; background: #263238; color: #00ff00; padding: 10px; border-radius: 4px; margin-bottom: 10px;">sudo apt update && sudo apt install -y redis-server php-redis && sudo systemctl enable redis-server && sudo systemctl start redis-server</code>
                    
                    <h4>CentOS/RHEL:</h4>
                    <code style="display: block; background: #263238; color: #00ff00; padding: 10px; border-radius: 4px; margin-bottom: 10px;">sudo yum install -y epel-release && sudo yum install -y redis php-pecl-redis && sudo systemctl enable redis && sudo systemctl start redis</code>
                    
                    <h4>Verify Installation:</h4>
                    <code style="display: block; background: #263238; color: #00ff00; padding: 10px; border-radius: 4px;">redis-cli ping</code>
                    <p style="margin-top: 5px; color: #666; font-size: 13px;">Should return: PONG</p>
                </div>
            </details>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            function logOutput(message, type = 'info') {
                const log = $('#redis-log');
                const color = type === 'error' ? '#ff4444' : type === 'success' ? '#00ff00' : '#00bfff';
                log.append(`<div style="color: ${color}; margin-bottom: 5px;">[${new Date().toLocaleTimeString()}] ${message}</div>`);
                $('#redis-output').show();
                log.parent().scrollTop(log.parent()[0].scrollHeight);
            }
            
            function checkRedisStatus() {
                $('#redis-status-text').html('<span class="spinner is-active" style="float: none; margin: 0 5px;"></span>Checking...');
                
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
                            let statusHtml = '';
                            
                            if (data.redis_installed) {
                                statusHtml = '<span style="color: #28a745;">✓ Redis Installed</span>';
                            } else {
                                statusHtml = '<span style="color: #dc3545;">✗ Redis Not Installed</span>';
                            }
                            
                            if (data.php_redis_installed) {
                                statusHtml += ' | <span style="color: #28a745;">✓ PHP Redis Extension</span>';
                            } else {
                                statusHtml += ' | <span style="color: #dc3545;">✗ PHP Redis Extension Missing</span>';
                            }
                            
                            statusHtml += ` | <strong>OS:</strong> ${data.os}`;
                            
                            $('#redis-status-text').html(statusHtml);
                        } else {
                            $('#redis-status-text').html('<span style="color: #dc3545;">Error checking status</span>');
                        }
                    },
                    error: function() {
                        $('#redis-status-text').html('<span style="color: #dc3545;">Connection error</span>');
                    }
                });
            }
            
            $('#check-redis-btn').on('click', function() {
                checkRedisStatus();
            });
            
            $('#install-redis-btn').on('click', function() {
                const btn = $(this);
                btn.prop('disabled', true).html('<span class="spinner is-active" style="float: none; margin: 0 5px;"></span>Installing...');
                $('#redis-log').empty();
                $('#redis-output').show();
                
                logOutput('Starting Redis installation...', 'info');
                
                $.ajax({
                    url: ajaxurl,
                    method: 'POST',
                    data: {
                        action: 'install_redis',
                        nonce: '<?php echo wp_create_nonce('redis_installer'); ?>'
                    },
                    success: function(response) {
                        if (response.success) {
                            logOutput(response.data.message, 'success');
                            if (response.data.output) {
                                response.data.output.forEach(line => logOutput(line, 'info'));
                            }
                            setTimeout(checkRedisStatus, 2000);
                        } else {
                            logOutput('Installation failed: ' + response.data, 'error');
                        }
                        btn.prop('disabled', false).html('<span class="dashicons dashicons-download" style="margin-top: 3px;"></span> Install Redis');
                    },
                    error: function(xhr) {
                        logOutput('AJAX error: ' + xhr.statusText, 'error');
                        btn.prop('disabled', false).html('<span class="dashicons dashicons-download" style="margin-top: 3px;"></span> Install Redis');
                    }
                });
            });
            
            // Initial status check
            checkRedisStatus();
        });
        </script>
        <?php
    }
    
    public function primary_color_field() {
        $options = get_option('appointease_options', array());
        $primary_color = isset($options['primary_color']) ? $options['primary_color'] : '#1CBC9B';
        $this->render_color_field_with_palette('primary_color', $primary_color, 'Primary color for buttons, headers, and highlights.');
    }
    
    public function button_text_field() {
        $options = get_option('appointease_options', array());
        $button_text = isset($options['button_text']) ? $options['button_text'] : 'Book Appointment';
        ?>
        <input type="text" name="appointease_options[button_text]" value="<?php echo esc_attr($button_text); ?>" class="regular-text" />
        <p class="description">Text displayed on the main booking button.</p>
        <?php
    }
    
    public function secondary_color_field() {
        $options = get_option('appointease_options', array());
        $secondary_color = isset($options['secondary_color']) ? $options['secondary_color'] : '#6c757d';
        $this->render_color_field_with_palette('secondary_color', $secondary_color, 'Secondary color for less prominent elements.');
    }
    
    public function success_color_field() {
        $options = get_option('appointease_options', array());
        $success_color = isset($options['success_color']) ? $options['success_color'] : '#28a745';
        $this->render_color_field_with_palette('success_color', $success_color, 'Color for success messages and confirmations.');
    }
    
    public function border_radius_field() {
        $options = get_option('appointease_options', array());
        $border_radius = isset($options['border_radius']) ? $options['border_radius'] : '8';
        ?>
        <input type="range" name="appointease_options[border_radius]" value="<?php echo esc_attr($border_radius); ?>" min="0" max="20" step="1" oninput="this.nextElementSibling.value = this.value + 'px'" />
        <output><?php echo esc_attr($border_radius); ?>px</output>
        <p class="description">Roundness of buttons and cards (0-20px).</p>
        <?php
    }
    
    public function font_size_field() {
        $options = get_option('appointease_options', array());
        $font_size = isset($options['font_size']) ? $options['font_size'] : '16';
        ?>
        <select name="appointease_options[font_size]">
            <option value="14" <?php selected($font_size, '14'); ?>>Small (14px)</option>
            <option value="16" <?php selected($font_size, '16'); ?>>Medium (16px)</option>
            <option value="18" <?php selected($font_size, '18'); ?>>Large (18px)</option>
            <option value="20" <?php selected($font_size, '20'); ?>>Extra Large (20px)</option>
        </select>
        <p class="description">Base font size for the booking form.</p>
        <?php
    }
    
    public function background_color_field() {
        $options = get_option('appointease_options', array());
        $background_color = isset($options['background_color']) ? $options['background_color'] : '#ffffff';
        $this->render_color_field_with_palette('background_color', $background_color, 'Background color for cards and forms.');
    }
    
    public function text_color_field() {
        $options = get_option('appointease_options', array());
        $text_color = isset($options['text_color']) ? $options['text_color'] : '#333333';
        $this->render_color_field_with_palette('text_color', $text_color, 'Main text color.');
    }
    
    public function border_color_field() {
        $options = get_option('appointease_options', array());
        $border_color = isset($options['border_color']) ? $options['border_color'] : '#e0e0e0';
        $this->render_color_field_with_palette('border_color', $border_color, 'Border color for cards and inputs.');
    }
    
    public function header_color_field() {
        $options = get_option('appointease_options', array());
        $header_color = isset($options['header_color']) ? $options['header_color'] : '#004D40';
        $this->render_color_field_with_palette('header_color', $header_color, 'Color for the top header bar.');
    }
    
    public function heading_color_field() {
        $options = get_option('appointease_options', array());
        $heading_color = isset($options['heading_color']) ? $options['heading_color'] : '#263238';
        $this->render_color_field_with_palette('heading_color', $heading_color, 'Color for main page headings.');
    }
    
    public function active_step_color_field() {
        $options = get_option('appointease_options', array());
        $active_step_color = isset($options['active_step_color']) ? $options['active_step_color'] : '#1DE9B6';
        $this->render_color_field_with_palette('active_step_color', $active_step_color, 'Color for the current active step.');
    }
    
    public function inactive_step_color_field() {
        $options = get_option('appointease_options', array());
        $inactive_step_color = isset($options['inactive_step_color']) ? $options['inactive_step_color'] : '#B0BEC5';
        $this->render_color_field_with_palette('inactive_step_color', $inactive_step_color, 'Color for inactive steps.');
    }
    
    private function render_color_field_with_palette($field_name, $current_value, $description) {
        $palette_colors = array(
            // Primary Colors
            '#1CBC9B', '#007cba', '#e74c3c', '#f39c12', '#9b59b6',
            '#2ecc71', '#3498db', '#e67e22', '#1abc9c', '#34495e',
            // Neutral Colors
            '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da',
            '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529',
            // Success/Warning/Danger
            '#28a745', '#20c997', '#17a2b8', '#ffc107', '#fd7e14',
            '#dc3545', '#6f42c1', '#e83e8c', '#20c997', '#6610f2'
        );
        ?>
        <div class="color-field-container">
            <input type="color" name="appointease_options[<?php echo $field_name; ?>]" value="<?php echo esc_attr($current_value); ?>" class="color-picker" />
            <div class="color-palette">
                <?php foreach ($palette_colors as $color): ?>
                    <button type="button" class="palette-color" style="background-color: <?php echo $color; ?>" data-color="<?php echo $color; ?>" title="<?php echo $color; ?>"></button>
                <?php endforeach; ?>
            </div>
            <p class="description"><?php echo $description; ?></p>
        </div>
        
        <style>
            .color-field-container {
                margin-bottom: 20px;
            }
            .color-palette {
                display: grid;
                grid-template-columns: repeat(10, 30px);
                gap: 5px;
                margin: 10px 0;
                padding: 10px;
                background: #f9f9f9;
                border-radius: 8px;
                border: 1px solid #ddd;
            }
            .palette-color {
                width: 30px;
                height: 30px;
                border: 2px solid #fff;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .palette-color:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            .palette-color.selected {
                border-color: #007cba;
                border-width: 3px;
                transform: scale(1.1);
            }
        </style>
        
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                const container = document.querySelector('.color-field-container:last-of-type');
                if (!container) return;
                
                const colorPicker = container.querySelector('.color-picker');
                const paletteColors = container.querySelectorAll('.palette-color');
                
                // Update selected palette color
                function updateSelectedColor(selectedColor) {
                    paletteColors.forEach(btn => {
                        btn.classList.toggle('selected', btn.dataset.color === selectedColor);
                    });
                }
                
                // Set initial selected color
                updateSelectedColor(colorPicker.value);
                
                // Handle palette color clicks
                paletteColors.forEach(btn => {
                    btn.addEventListener('click', function() {
                        const color = this.dataset.color;
                        colorPicker.value = color;
                        updateSelectedColor(color);
                        
                        // Trigger change event for preview
                        colorPicker.dispatchEvent(new Event('input'));
                    });
                });
                
                // Handle color picker changes
                colorPicker.addEventListener('input', function() {
                    updateSelectedColor(this.value);
                });
            });
        </script>
        <?php
    }
    
    public function enqueue_custom_styles() {
        // Enqueue appearance CSS file
        wp_enqueue_style(
            'appointease-appearance',
            BOOKING_PLUGIN_URL . 'src/assets/styles/frontend/appearance.css',
            array('booking-frontend-css'),
            BOOKING_PLUGIN_VERSION
        );
        
        // Add custom CSS variables
        wp_add_inline_style('appointease-appearance', $this->get_custom_css());
    }
    
    public function output_custom_css() {
        $custom_css = $this->get_custom_css();
        if (!empty($custom_css)) {
            echo '<style id="appointease-custom-styles">' . $custom_css . '</style>';
        }
    }
    
    public function get_custom_css() {
        $options = get_option('appointease_options', array());
        $theme = isset($options['appearance_theme']) ? $options['appearance_theme'] : 'light';
        
        // Apply theme-based defaults
        if ($theme === 'light') {
            $defaults = [
                'primary_color' => '#1CBC9B',
                'header_color' => '#004D40', 
                'text_color' => '#263238',
                'background_color' => '#ffffff',
                'success_color' => '#27AE60',
                'border_color' => '#e5e7eb'
            ];
        } elseif ($theme === 'dark') {
            $defaults = [
                'primary_color' => '#8E44AD',
                'header_color' => '#1D2125',
                'text_color' => '#FFFFFF', 
                'background_color' => '#363A3F',
                'success_color' => '#9C27B0',
                'border_color' => '#4A5568'
            ];
        } else {
            $defaults = [
                'primary_color' => '#1CBC9B',
                'header_color' => '#004D40',
                'text_color' => '#263238',
                'background_color' => '#ffffff', 
                'success_color' => '#27AE60',
                'border_color' => '#e5e7eb'
            ];
        }
        
        $primary_color = isset($options['primary_color']) ? $options['primary_color'] : $defaults['primary_color'];
        $header_color = isset($options['header_color']) ? $options['header_color'] : $defaults['header_color'];
        $text_color = isset($options['text_color']) ? $options['text_color'] : $defaults['text_color'];
        $background_color = isset($options['background_color']) ? $options['background_color'] : $defaults['background_color'];
        $success_color = isset($options['success_color']) ? $options['success_color'] : $defaults['success_color'];
        $border_color = isset($options['border_color']) ? $options['border_color'] : $defaults['border_color'];
        $border_radius = isset($options['border_radius']) ? $options['border_radius'] : '8';
        $font_size = isset($options['font_size']) ? $options['font_size'] : '16';
        
        // Smart color calculations
        $primary_dark = $this->darken_color($primary_color, 15);
        $primary_light = $this->lighten_color($primary_color, 20);
        $primary_alpha = $this->hex_to_rgba($primary_color, 0.1);
        $primary_text = $this->get_contrast_color($primary_color);
        $header_text = $this->get_contrast_color($header_color);
        
        // Extract RGB values for rgba usage
        $primary_rgb = $this->hex_to_rgb($primary_color);
        
        $css = "
        .wp-block-appointease-booking-form,
        .appointease-booking {
            --header-bg: {$header_color} !important;
            --header-text: {$header_text} !important;
            --card-bg: {$background_color} !important;
            --card-border: {$border_color} !important;
            --button-bg: {$primary_color} !important;
            --button-bg-rgb: {$primary_rgb} !important;
            --button-bg-hover: {$primary_dark} !important;
            --button-text: {$primary_text} !important;
            --text-primary: {$text_color} !important;
            --text-secondary: #666666 !important;
            font-size: {$font_size}px !important;
            color: {$text_color} !important;
        }
        
        /* Button hover states */
        .wp-block-appointease-booking-form .confirm-btn:hover,
        .wp-block-appointease-booking-form .primary-btn:hover {
            background: {$primary_dark} !important;
        }
        
        /* Header styling */
        .wp-block-appointease-booking-form .appointease-booking-header {
            background: {$header_color} !important;
            color: {$header_text} !important;
        }
        
        /* Target login button by class */
        .wp-block-appointease-booking-form .login-button {
            background: {$primary_color} !important;
            box-shadow: 0 2px 4px rgba(28, 188, 155, 0.2) !important;
        }
        
        .wp-block-appointease-booking-form .login-button:hover {
            background: {$primary_dark} !important;
        }
        
        /* Success elements */
        .wp-block-appointease-booking-form .success-icon,
        .wp-block-appointease-booking-form .preview-success {
            background: {$success_color} !important;
        }
        ";
        
        return $css;
    }
    
    private function hex_to_rgba($hex, $alpha = 1) {
        $hex = str_replace('#', '', $hex);
        if (strlen($hex) == 3) {
            $hex = str_repeat(substr($hex, 0, 1), 2) . str_repeat(substr($hex, 1, 1), 2) . str_repeat(substr($hex, 2, 1), 2);
        }
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
        return "rgba({$r}, {$g}, {$b}, {$alpha})";
    }
    
    private function hex_to_rgb($hex) {
        $hex = str_replace('#', '', $hex);
        if (strlen($hex) == 3) {
            $hex = str_repeat(substr($hex, 0, 1), 2) . str_repeat(substr($hex, 1, 1), 2) . str_repeat(substr($hex, 2, 1), 2);
        }
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
        return "{$r}, {$g}, {$b}";
    }
    
    private function darken_color($hex, $percent) {
        $hex = str_replace('#', '', $hex);
        if (strlen($hex) == 3) {
            $hex = str_repeat(substr($hex, 0, 1), 2) . str_repeat(substr($hex, 1, 1), 2) . str_repeat(substr($hex, 2, 1), 2);
        }
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
        
        $r = max(0, min(255, $r - ($r * $percent / 100)));
        $g = max(0, min(255, $g - ($g * $percent / 100)));
        $b = max(0, min(255, $b - ($b * $percent / 100)));
        
        return sprintf('#%02x%02x%02x', $r, $g, $b);
    }
    
    private function lighten_color($hex, $percent) {
        $hex = str_replace('#', '', $hex);
        if (strlen($hex) == 3) {
            $hex = str_repeat(substr($hex, 0, 1), 2) . str_repeat(substr($hex, 1, 1), 2) . str_repeat(substr($hex, 2, 1), 2);
        }
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
        
        $r = max(0, min(255, $r + ((255 - $r) * $percent / 100)));
        $g = max(0, min(255, $g + ((255 - $g) * $percent / 100)));
        $b = max(0, min(255, $b + ((255 - $b) * $percent / 100)));
        
        return sprintf('#%02x%02x%02x', $r, $g, $b);
    }
    
    private function get_contrast_color($hex) {
        $hex = str_replace('#', '', $hex);
        if (strlen($hex) == 3) {
            $hex = str_repeat(substr($hex, 0, 1), 2) . str_repeat(substr($hex, 1, 1), 2) . str_repeat(substr($hex, 2, 1), 2);
        }
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
        
        // Calculate luminance
        $luminance = (0.299 * $r + 0.587 * $g + 0.114 * $b) / 255;
        
        // Return white for dark colors, dark for light colors
        return $luminance > 0.5 ? '#263238' : '#FFFFFF';
    }
    
    public static function get_button_text() {
        $options = get_option('appointease_options', array());
        return isset($options['button_text']) ? $options['button_text'] : 'Book Appointment';
    }
    
    public static function get_primary_color() {
        $options = get_option('appointease_options', array());
        return isset($options['primary_color']) ? $options['primary_color'] : '#1CBC9B';
    }
    
    public static function get_secondary_color() {
        $options = get_option('appointease_options', array());
        return isset($options['secondary_color']) ? $options['secondary_color'] : '#6c757d';
    }
    
    public static function get_success_color() {
        $options = get_option('appointease_options', array());
        return isset($options['success_color']) ? $options['success_color'] : '#28a745';
    }
    
    public static function get_border_radius() {
        $options = get_option('appointease_options', array());
        return isset($options['border_radius']) ? $options['border_radius'] : '8';
    }
    
    public static function get_font_size() {
        $options = get_option('appointease_options', array());
        return isset($options['font_size']) ? $options['font_size'] : '16';
    }
    
    public static function get_background_color() {
        $options = get_option('appointease_options', array());
        return isset($options['background_color']) ? $options['background_color'] : '#ffffff';
    }
    
    public static function get_text_color() {
        $options = get_option('appointease_options', array());
        return isset($options['text_color']) ? $options['text_color'] : '#333333';
    }
    
    public static function get_border_color() {
        $options = get_option('appointease_options', array());
        return isset($options['border_color']) ? $options['border_color'] : '#e0e0e0';
    }
    

    
    public function appearance_only_page() {
        ?>
        <div class="wrap">
            <h1><i class="dashicons dashicons-admin-appearance"></i> Appearance Settings</h1>
            <p class="description">Match your brand in under a minute! Choose a ready-made theme or set just 3 brand colors. We automatically handle text contrast, hover effects, and accessibility.</p>
            
            <div class="appointease-settings-container" style="display: flex; gap: 30px; margin-top: 30px;">
                <div class="settings-form" style="flex: 2;">
                    <form method="post" action="options.php">
                        <?php settings_fields('appointease_settings'); ?>
                        
                        <!-- Theme Selection -->
                        <div class="ae-card" style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 25px;">
                            <h2 style="margin-top: 0; color: #2c3e50; border-bottom: 2px solid #1CBC9B; padding-bottom: 10px;">🎨 Choose Your Style</h2>
                            <p style="color: #666; margin-bottom: 25px;">Pick a professionally designed theme that works perfectly out of the box, or customize with your brand colors.</p>
                            
                            <div class="theme-options" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                                <?php $current_theme = get_option('appointease_options')['appearance_theme'] ?? 'light'; ?>
                                
                                <label class="theme-option <?php echo $current_theme === 'light' ? 'selected' : ''; ?>" style="border: 2px solid <?php echo $current_theme === 'light' ? '#1CBC9B' : '#e5e7eb'; ?>; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s;">
                                    <input type="radio" name="appointease_options[appearance_theme]" value="light" <?php checked($current_theme, 'light'); ?> style="margin-bottom: 15px;">
                                    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                                        <div style="width: 20px; height: 20px; background: #1CBC9B; border-radius: 4px;"></div>
                                        <div style="width: 20px; height: 20px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px;"></div>
                                        <div style="width: 20px; height: 20px; background: #263238; border-radius: 4px;"></div>
                                    </div>
                                    <strong>✨ Light Mode (Recommended)</strong>
                                    <p style="margin: 8px 0 0; color: #666; font-size: 14px;">Professional design that works perfectly out of the box. Great for most businesses.</p>
                                </label>
                                
                                <label class="theme-option <?php echo $current_theme === 'dark' ? 'selected' : ''; ?>" style="border: 2px solid <?php echo $current_theme === 'dark' ? '#1CBC9B' : '#e5e7eb'; ?>; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s;">
                                    <input type="radio" name="appointease_options[appearance_theme]" value="dark" <?php checked($current_theme, 'dark'); ?> style="margin-bottom: 15px;">
                                    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                                        <div style="width: 20px; height: 20px; background: #8E44AD; border-radius: 4px;"></div>
                                        <div style="width: 20px; height: 20px; background: #363A3F; border-radius: 4px;"></div>
                                        <div style="width: 20px; height: 20px; background: #ffffff; border-radius: 4px;"></div>
                                    </div>
                                    <strong>🌙 Dark Mode</strong>
                                    <p style="margin: 8px 0 0; color: #666; font-size: 14px;">Modern, sleek design for contemporary brands. Perfect for tech companies.</p>
                                </label>
                                
                                <label class="theme-option <?php echo $current_theme === 'custom' ? 'selected' : ''; ?>" style="border: 2px solid <?php echo $current_theme === 'custom' ? '#1CBC9B' : '#e5e7eb'; ?>; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s;">
                                    <input type="radio" name="appointease_options[appearance_theme]" value="custom" <?php checked($current_theme, 'custom'); ?> style="margin-bottom: 15px;">
                                    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                                        <div style="width: 20px; height: 20px; background: linear-gradient(45deg, #1CBC9B, #8E44AD); border-radius: 4px;"></div>
                                        <div style="width: 20px; height: 20px; background: linear-gradient(45deg, #ffffff, #363A3F); border-radius: 4px;"></div>
                                        <div style="width: 20px; height: 20px; background: linear-gradient(45deg, #263238, #E91E63); border-radius: 4px;"></div>
                                    </div>
                                    <strong>🎨 Custom Brand Colors</strong>
                                    <p style="margin: 8px 0 0; color: #666; font-size: 14px;">Match your exact brand with just 3 colors. We handle the rest automatically.</p>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Custom Brand Colors (only show when Custom is selected) -->
                        <div id="custom-colors-section" class="ae-card" style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); display: <?php echo $current_theme === 'custom' ? 'block' : 'none'; ?>;">
                            <h2 style="margin-top: 0; color: #2c3e50; border-bottom: 2px solid #1CBC9B; padding-bottom: 10px;">🎯 Your Brand Colors</h2>
                            <p style="color: #666; margin-bottom: 25px;"><strong>Only 3 colors needed!</strong> We'll automatically handle text contrast, hover effects, and accessibility for you.</p>
                            
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; margin-top: 25px;">
                                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #1CBC9B;">
                                    <h3 style="margin-bottom: 8px; color: #1CBC9B;">🎯 Primary Action Color</h3>
                                    <p style="font-size: 14px; color: #666; margin-bottom: 15px;">Your most important color. Used for buttons, selected items, and active steps to guide users forward.</p>
                                    <?php $this->primary_color_field(); ?>
                                </div>
                                
                                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #004D40;">
                                    <h3 style="margin-bottom: 8px; color: #004D40;">🏢 Header Background</h3>
                                    <p style="font-size: 14px; color: #666; margin-bottom: 15px;">The color for your branding header. We'll automatically choose white or dark text for perfect readability.</p>
                                    <?php $this->header_color_field(); ?>
                                </div>
                                
                                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #263238;">
                                    <h3 style="margin-bottom: 8px; color: #263238;">📝 Main Text Color</h3>
                                    <p style="font-size: 14px; color: #666; margin-bottom: 15px;">Color for headings and main text. This ensures your content is readable and professional.</p>
                                    <?php $this->text_color_field(); ?>
                                </div>
                            </div>
                            
                            <div style="background: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 8px; padding: 15px; margin-top: 20px;">
                                <p style="margin: 0; color: #2d5a2d; font-size: 14px;"><strong>✨ Smart Features:</strong> Hover effects, text contrast, and accessibility are automatically handled. No need to pick colors for every element!</p>
                            </div>
                        </div>
                        
                        <div class="ae-card" style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-top: 25px;">
                            <h2 style="margin-top: 0; color: #2c3e50; border-bottom: 2px solid #1CBC9B; padding-bottom: 10px;">📝 Text & Layout</h2>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 25px; margin-top: 25px;">
                                <div>
                                    <h3>Button Text</h3>
                                    <?php $this->button_text_field(); ?>
                                </div>
                                <div>
                                    <h3>Border Radius</h3>
                                    <?php $this->border_radius_field(); ?>
                                </div>
                                <div>
                                    <h3>Font Size</h3>
                                    <?php $this->font_size_field(); ?>
                                </div>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <?php submit_button('Save Appearance Settings', 'primary', 'submit', false, array('style' => 'padding: 15px 40px; font-size: 16px; background: linear-gradient(135deg, #1CBC9B, #16a085); border: none; border-radius: 8px;')); ?>
                        </div>
                    </form>
                </div>
                
                <div class="settings-preview" style="flex: 1; position: sticky; top: 32px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="margin: 0;">Live Preview</h3>
                        <select id="preview-selector" style="padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                            <option value="service">Service Selection</option>
                            <option value="staff">Staff Selection</option>
                            <option value="date">Date Selection</option>
                            <option value="time">Time Selection</option>
                            <option value="form">Customer Form</option>
                            <option value="review">Review & Confirm</option>
                            <option value="success">Success Page</option>
                            <option value="dashboard">Dashboard</option>
                            <option value="login">Login Form</option>
                        </select>
                    </div>
                    
                    <div class="preview-container" id="preview-container" style="border: 1px solid #ddd; border-radius: 12px; background: #f9f9f9; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 600px; overflow-y: auto;">
                        <!-- Common Header -->
                        <div class="preview-header" id="preview-header" style="background: var(--header-color, #004D40); color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 18px;">A</div>
                                <div>
                                    <div style="font-size: 24px; font-weight: 500;">AppointEase</div>
                                    <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 2px;">Dec 15 • 2:30:45 PM EST</div>
                                </div>
                            </div>
                            <button class="secondary-btn" style="background: transparent; border: 2px solid white; color: white; padding: 10px 20px; border-radius: 8px; font-size: 0.9rem; font-weight: 500; transition: all 0.2s;">Login</button>
                        </div>
                        
                        <!-- Step Progress -->
                        <div id="step-progress" style="display: flex; justify-content: center; padding: 20px 30px; background: #f8f9fa; border-bottom: 1px solid #e9ecef;">
                            <div style="display: flex; align-items: center; gap: 40px;">
                                <div style="display: flex; flex-direction: column; align-items: center;">
                                    <div id="step-1" style="width: 30px; height: 30px; border-radius: 50%; background: var(--active-step-color, #1DE9B6); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; margin-bottom: 8px;">1</div>
                                    <div id="step-1-label" style="font-size: 12px; color: var(--active-step-color, #1DE9B6); font-weight: 500; text-transform: uppercase;">Service</div>
                                </div>
                                <div style="width: 40px; height: 2px; background: #e9ecef; margin-top: -20px;"></div>
                                <div style="display: flex; flex-direction: column; align-items: center;">
                                    <div id="step-2" style="width: 30px; height: 30px; border-radius: 50%; background: var(--inactive-step-color, #B0BEC5); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; margin-bottom: 8px;">2</div>
                                    <div id="step-2-label" style="font-size: 12px; color: var(--inactive-step-color, #B0BEC5); font-weight: 500; text-transform: uppercase;">Staff</div>
                                </div>
                                <div style="width: 40px; height: 2px; background: #e9ecef; margin-top: -20px;"></div>
                                <div style="display: flex; flex-direction: column; align-items: center;">
                                    <div id="step-3" style="width: 30px; height: 30px; border-radius: 50%; background: var(--inactive-step-color, #B0BEC5); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; margin-bottom: 8px;">3</div>
                                    <div id="step-3-label" style="font-size: 12px; color: var(--inactive-step-color, #B0BEC5); font-weight: 500; text-transform: uppercase;">Date</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Dynamic Content -->
                        <div id="preview-content" style="padding: 40px 30px;">
                            <!-- Content will be dynamically loaded here -->
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    const previewTemplates = {
                        service: `
                            <h2 style="font-size: 2rem; font-weight: 700; text-align: center; margin-bottom: 2rem; color: var(--heading-color, #263238);">Choose Your Service</h2>
                            <div class="preview-card selected-card" style="display: flex; align-items: center; padding: 24px; margin-bottom: 16px; background: var(--primary-color, #10b981); border: 3px solid var(--primary-color, #10b981); border-radius: var(--border-radius, 12px);">
                                <div class="radio-btn" style="width: 24px; height: 24px; border-radius: 50%; background: white; margin-right: 20px; display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary-color, #10b981);"></div></div>
                                <div style="flex: 1;"><h3 class="preview-text" style="font-size: 1.25rem; font-weight: 600; color: white; margin-bottom: 8px;">Consultation</h3><p style="color: white; opacity: 0.9; margin-bottom: 12px;">Initial consultation and assessment</p><div style="display: flex; gap: 16px;"><span style="font-size: 0.875rem; color: white;">⏱ 30 min</span><span style="font-size: 0.875rem; color: white; font-weight: 600;">💰 $50</span></div></div>
                            </div>
                            <div style="text-align: center; margin-top: 32px;"><div class="preview-button" style="background: var(--primary-color, #10b981); color: white; border: none; border-radius: var(--border-radius, 12px); padding: 16px 32px; font-size: 1.1rem; font-weight: 600; display: inline-block;"><span class="preview-button-text">Next: Choose Employee →</span></div></div>
                        `,
                        staff: `
                            <h2 style="font-size: 2rem; font-weight: 700; text-align: center; margin-bottom: 2rem; color: var(--heading-color, #263238);">Choose Your Staff</h2>
                            <div class="preview-card selected-card" style="display: flex; align-items: center; padding: 24px; margin-bottom: 16px; background: var(--primary-color, #10b981); border: 3px solid var(--primary-color, #10b981); border-radius: var(--border-radius, 12px);">
                                <div class="radio-btn" style="width: 24px; height: 24px; border-radius: 50%; background: white; margin-right: 20px; display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary-color, #10b981);"></div></div>
                                <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-right: 20px; font-weight: 600; color: white;">DS</div>
                                <div style="flex: 1;"><h3 class="preview-text" style="font-size: 1.25rem; font-weight: 600; color: white; margin-bottom: 8px;">Dr. Smith</h3><p style="color: white; opacity: 0.9; margin-bottom: 8px;">General Practice</p><div style="display: flex; gap: 16px;"><span style="font-size: 0.875rem; color: white;">⭐ 4.8 (50 reviews)</span></div></div>
                            </div>
                            <div style="text-align: center; margin-top: 32px;"><div class="preview-button" style="background: var(--primary-color, #10b981); color: white; border: none; border-radius: var(--border-radius, 12px); padding: 16px 32px; font-size: 1.1rem; font-weight: 600; display: inline-block;"><span class="preview-button-text">Next: Choose Date →</span></div></div>
                        `,
                        date: `
                            <h2 style="font-size: 2rem; font-weight: 700; text-align: center; margin-bottom: 2rem; color: var(--heading-color, #263238);">Select Date</h2>
                            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 24px;">
                                <div style="text-align: center; padding: 8px; font-weight: 600; color: #6b7280;">Sun</div>
                                <div style="text-align: center; padding: 8px; font-weight: 600; color: #6b7280;">Mon</div>
                                <div style="text-align: center; padding: 8px; font-weight: 600; color: #6b7280;">Tue</div>
                                <div style="text-align: center; padding: 8px; font-weight: 600; color: #6b7280;">Wed</div>
                                <div style="text-align: center; padding: 8px; font-weight: 600; color: #6b7280;">Thu</div>
                                <div style="text-align: center; padding: 8px; font-weight: 600; color: #6b7280;">Fri</div>
                                <div style="text-align: center; padding: 8px; font-weight: 600; color: #6b7280;">Sat</div>
                                <div class="preview-card" style="text-align: center; padding: 12px; background: var(--bg-color, white); border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 8px); cursor: pointer;">1</div>
                                <div class="preview-card" style="text-align: center; padding: 12px; background: var(--bg-color, white); border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 8px); cursor: pointer;">2</div>
                                <div class="preview-card selected-card" style="text-align: center; padding: 12px; background: var(--primary-color, #10b981); color: white; border: 2px solid var(--primary-color, #10b981); border-radius: var(--border-radius, 8px); cursor: pointer; font-weight: 600;">15</div>
                                <div class="preview-card" style="text-align: center; padding: 12px; background: var(--bg-color, white); border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 8px); cursor: pointer;">16</div>
                            </div>
                            <div style="text-align: center;"><div class="preview-button" style="background: var(--primary-color, #10b981); color: white; border: none; border-radius: var(--border-radius, 12px); padding: 16px 32px; font-size: 1.1rem; font-weight: 600; display: inline-block;"><span class="preview-button-text">Next: Choose Time →</span></div></div>
                        `,
                        time: `
                            <h2 style="font-size: 2rem; font-weight: 700; text-align: center; margin-bottom: 2rem; color: var(--heading-color, #263238);">Select Time</h2>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
                                <div class="preview-card" style="text-align: center; padding: 16px; background: var(--bg-color, white); border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 8px); cursor: pointer;">9:00 AM</div>
                                <div class="preview-card" style="text-align: center; padding: 16px; background: var(--bg-color, white); border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 8px); cursor: pointer;">9:30 AM</div>
                                <div class="preview-card selected-card" style="text-align: center; padding: 16px; background: var(--primary-color, #10b981); color: white; border: 2px solid var(--primary-color, #10b981); border-radius: var(--border-radius, 8px); cursor: pointer; font-weight: 600;">10:00 AM</div>
                                <div class="preview-card" style="text-align: center; padding: 16px; background: var(--bg-color, white); border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 8px); cursor: pointer;">10:30 AM</div>
                                <div style="text-align: center; padding: 16px; background: #f3f4f6; color: #9ca3af; border: 2px solid #e5e7eb; border-radius: var(--border-radius, 8px);">11:00 AM</div>
                                <div class="preview-card" style="text-align: center; padding: 16px; background: var(--bg-color, white); border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 8px); cursor: pointer;">11:30 AM</div>
                            </div>
                            <div style="text-align: center;"><div class="preview-button" style="background: var(--primary-color, #10b981); color: white; border: none; border-radius: var(--border-radius, 12px); padding: 16px 32px; font-size: 1.1rem; font-weight: 600; display: inline-block;"><span class="preview-button-text">Next: Your Details →</span></div></div>
                        `,
                        form: `
                            <h2 style="font-size: 2rem; font-weight: 700; text-align: center; margin-bottom: 2rem; color: var(--heading-color, #263238);">Your Details</h2>
                            <div class="preview-card" style="background: var(--bg-color, white); padding: 24px; border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 12px); margin-bottom: 24px;">
                                <div style="margin-bottom: 16px;"><label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-color, #374151);">First Name</label><input type="text" placeholder="John" style="width: 100%; padding: 12px; border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 8px); font-size: 16px;"></div>
                                <div style="margin-bottom: 16px;"><label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-color, #374151);">Email</label><input type="email" placeholder="john@example.com" style="width: 100%; padding: 12px; border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 8px); font-size: 16px;"></div>
                                <div style="margin-bottom: 16px;"><label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-color, #374151);">Phone</label><input type="tel" placeholder="(555) 123-4567" style="width: 100%; padding: 12px; border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 8px); font-size: 16px;"></div>
                            </div>
                            <div style="text-align: center;"><div class="preview-button" style="background: var(--primary-color, #10b981); color: white; border: none; border-radius: var(--border-radius, 12px); padding: 16px 32px; font-size: 1.1rem; font-weight: 600; display: inline-block;"><span class="preview-button-text">Review Booking →</span></div></div>
                        `,
                        review: `
                            <h2 style="font-size: 2rem; font-weight: 700; text-align: center; margin-bottom: 2rem; color: var(--heading-color, #263238);">Review & Confirm</h2>
                            <div class="preview-card" style="background: var(--bg-color, white); padding: 24px; border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 12px); margin-bottom: 24px;">
                                <h3 style="margin-bottom: 16px; color: var(--text-color, #374151);">Appointment Summary</h3>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>Service:</span><span class="preview-text" style="font-weight: 600;">Consultation</span></div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>Staff:</span><span style="font-weight: 600;">Dr. Smith</span></div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>Date:</span><span style="font-weight: 600;">Dec 15, 2024</span></div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>Time:</span><span style="font-weight: 600;">10:00 AM</span></div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 16px; padding-top: 16px; border-top: 2px solid var(--border-color, #e5e7eb);"><span style="font-size: 1.1rem; font-weight: 600;">Total:</span><span style="font-size: 1.1rem; font-weight: 600;">$50</span></div>
                            </div>
                            <div style="text-align: center;"><div class="preview-button" style="background: var(--primary-color, #10b981); color: white; border: none; border-radius: var(--border-radius, 12px); padding: 16px 32px; font-size: 1.1rem; font-weight: 600; display: inline-block;"><span class="preview-button-text">Confirm Booking</span></div></div>
                        `,
                        success: `
                            <div style="text-align: center;">
                                <div style="width: 80px; height: 80px; background: var(--success-color, #10b981); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 2rem; color: white;">✓</div>
                                <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 1rem; color: var(--heading-color, #263238);">Booking Confirmed!</h2>
                                <div class="preview-success" style="background: var(--success-color, #10b981); color: white; padding: 20px; border-radius: var(--border-radius, 12px); margin: 24px 0; text-align: center;">
                                    <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 8px;">Appointment #12345</div>
                                    <div>Confirmation sent to john@example.com</div>
                                </div>
                                <div class="preview-card" style="background: var(--bg-color, white); padding: 20px; border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 12px); margin-bottom: 24px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>Service:</span><span class="preview-text" style="font-weight: 600;">Consultation</span></div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>Date & Time:</span><span style="font-weight: 600;">Dec 15, 2024 at 10:00 AM</span></div>
                                </div>
                                <div class="preview-button" style="background: var(--primary-color, #10b981); color: white; border: none; border-radius: var(--border-radius, 12px); padding: 16px 32px; font-size: 1.1rem; font-weight: 600; display: inline-block; margin-right: 12px;"><span class="preview-button-text">Book Another</span></div>
                            </div>
                        `,
                        dashboard: `
                            <h2 style="font-size: 2rem; font-weight: 700; text-align: center; margin-bottom: 2rem; color: var(--heading-color, #263238);">My Appointments</h2>
                            <div class="preview-card" style="background: var(--bg-color, white); padding: 24px; border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 12px); margin-bottom: 16px;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                                    <div><h3 class="preview-text" style="font-size: 1.25rem; font-weight: 600; color: var(--text-color, #1f2937); margin-bottom: 8px;">Consultation</h3><p style="color: #6b7280; margin-bottom: 8px;">Dr. Smith • Dec 15, 2024 at 10:00 AM</p><span style="background: var(--success-color, #10b981); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.875rem; font-weight: 500;">Confirmed</span></div>
                                    <div style="display: flex; gap: 8px;"><button style="background: #f59e0b; color: white; border: none; padding: 8px 16px; border-radius: var(--border-radius, 6px); font-size: 0.875rem;">Reschedule</button><button style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: var(--border-radius, 6px); font-size: 0.875rem;">Cancel</button></div>
                                </div>
                            </div>
                            <div class="preview-card" style="background: var(--bg-color, white); padding: 24px; border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 12px); margin-bottom: 24px;">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div><h3 class="preview-text" style="font-size: 1.25rem; font-weight: 600; color: var(--text-color, #1f2937); margin-bottom: 8px;">Follow-up</h3><p style="color: #6b7280; margin-bottom: 8px;">Dr. Smith • Dec 22, 2024 at 2:00 PM</p><span style="background: #6b7280; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.875rem; font-weight: 500;">Pending</span></div>
                                    <div style="display: flex; gap: 8px;"><button style="background: #f59e0b; color: white; border: none; padding: 8px 16px; border-radius: var(--border-radius, 6px); font-size: 0.875rem;">Reschedule</button><button style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: var(--border-radius, 6px); font-size: 0.875rem;">Cancel</button></div>
                                </div>
                            </div>
                            <div style="text-align: center;"><div class="preview-button" style="background: var(--primary-color, #10b981); color: white; border: none; border-radius: var(--border-radius, 12px); padding: 16px 32px; font-size: 1.1rem; font-weight: 600; display: inline-block;"><span class="preview-button-text">Book New Appointment</span></div></div>
                        `,
                        login: `
                            <h2 style="font-size: 2rem; font-weight: 700; text-align: center; margin-bottom: 2rem; color: var(--heading-color, #263238);">Customer Login</h2>
                            <div class="preview-card" style="background: var(--bg-color, white); padding: 24px; border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 12px); margin-bottom: 24px;">
                                <div style="margin-bottom: 16px;"><label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-color, #374151);">Email Address</label><input type="email" placeholder="Enter your email" style="width: 100%; padding: 12px; border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 8px); font-size: 16px;"></div>
                                <div style="text-align: center; margin-bottom: 16px;"><div class="preview-button" style="background: var(--primary-color, #10b981); color: white; border: none; border-radius: var(--border-radius, 12px); padding: 16px 32px; font-size: 1.1rem; font-weight: 600; display: inline-block;"><span class="preview-button-text">Send Login Code</span></div></div>
                                <div style="text-align: center; padding: 16px; background: #f3f4f6; border-radius: var(--border-radius, 8px); margin-bottom: 16px;"><p style="margin: 0; color: #6b7280;">We'll send a secure 6-digit code to your email</p></div>
                                <div style="margin-bottom: 16px;"><label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-color, #374151);">Verification Code</label><input type="text" placeholder="Enter 6-digit code" style="width: 100%; padding: 12px; border: 2px solid var(--border-color, #e5e7eb); border-radius: var(--border-radius, 8px); font-size: 16px; text-align: center; letter-spacing: 0.5em;"></div>
                            </div>
                            <div style="text-align: center;"><div class="preview-button" style="background: var(--primary-color, #10b981); color: white; border: none; border-radius: var(--border-radius, 12px); padding: 16px 32px; font-size: 1.1rem; font-weight: 600; display: inline-block;"><span class="preview-button-text">Verify & Login</span></div></div>
                        `
                    };
                    
                    function loadPreview(type) {
                        const content = document.getElementById('preview-content');
                        const stepProgress = document.getElementById('step-progress');
                        
                        // Hide step progress for certain pages
                        if (['success', 'dashboard', 'login'].includes(type)) {
                            stepProgress.style.display = 'none';
                        } else {
                            stepProgress.style.display = 'flex';
                            updateStepProgress(type);
                        }
                        
                        content.innerHTML = previewTemplates[type] || previewTemplates.service;
                        updatePreview();
                    }
                    
                    function updateStepProgress(type) {
                        const steps = ['service', 'staff', 'date', 'time', 'form', 'review'];
                        const currentStep = steps.indexOf(type) + 1;
                        
                        for (let i = 1; i <= 3; i++) {
                            const step = document.getElementById(`step-${i}`);
                            const label = document.getElementById(`step-${i}-label`);
                            
                            if (i <= currentStep) {
                                step.style.background = '#1CBC9B';
                                step.style.color = 'white';
                                label.style.color = '#1CBC9B';
                            } else {
                                step.style.background = '#e9ecef';
                                step.style.color = '#6c757d';
                                label.style.color = '#6c757d';
                            }
                        }
                    }
                    
                    function updatePreview() {
                        const primaryColor = document.querySelector('input[name="appointease_options[primary_color]"]')?.value || '#1CBC9B';
                        const successColor = document.querySelector('input[name="appointease_options[success_color]"]')?.value || '#28a745';
                        const backgroundColor = document.querySelector('input[name="appointease_options[background_color]"]')?.value || '#ffffff';
                        const textColor = document.querySelector('input[name="appointease_options[text_color]"]')?.value || '#333333';
                        const headerColor = document.querySelector('input[name="appointease_options[header_color]"]')?.value || '#004D40';
                        const headingColor = document.querySelector('input[name="appointease_options[heading_color]"]')?.value || '#263238';
                        const activeStepColor = document.querySelector('input[name="appointease_options[active_step_color]"]')?.value || '#1DE9B6';
                        const inactiveStepColor = document.querySelector('input[name="appointease_options[inactive_step_color]"]')?.value || '#B0BEC5';
                        const borderColor = document.querySelector('input[name="appointease_options[border_color]"]')?.value || '#e0e0e0';
                        const borderRadius = document.querySelector('input[name="appointease_options[border_radius]"]')?.value || '8';
                        const fontSize = document.querySelector('select[name="appointease_options[font_size]"]')?.value || '16';
                        
                        // Apply theme defaults and smart colors
                        const theme = document.querySelector('input[name="appointease_options[appearance_theme]"]:checked')?.value || 'light';
                        const currentPrimary = primaryColor || (theme === 'dark' ? '#8E44AD' : '#1CBC9B');
                        const currentHeader = headerColor || (theme === 'dark' ? '#1D2125' : '#004D40');
                        const currentText = textColor || (theme === 'dark' ? '#FFFFFF' : '#263238');
                        
                        const primaryTextColor = getContrastColor(currentPrimary);
                        const headerTextColor = getContrastColor(currentHeader);
                        const primaryDark = darkenColor(currentPrimary, 15);
                        
                        // Update CSS custom properties for instant updates
                        const container = document.getElementById('preview-container');
                        if (container) {
                            container.style.setProperty('--primary-color', currentPrimary);
                            container.style.setProperty('--primary-text', primaryTextColor);
                            container.style.setProperty('--primary-dark', primaryDark);
                            container.style.setProperty('--header-color', currentHeader);
                            container.style.setProperty('--header-text', headerTextColor);
                            container.style.setProperty('--success-color', successColor);
                            container.style.setProperty('--bg-color', backgroundColor);
                            container.style.setProperty('--text-color', currentText);
                            container.style.setProperty('--heading-color', headingColor || currentText);
                            container.style.setProperty('--border-color', borderColor);
                            container.style.setProperty('--border-radius', borderRadius + 'px');
                            container.style.fontSize = fontSize + 'px';
                        }
                        
                        // Update header with smart text
                        const header = document.getElementById('preview-header');
                        if (header) {
                            header.style.setProperty('background', currentHeader, 'important');
                            header.style.setProperty('color', headerTextColor, 'important');
                            header.querySelectorAll('*').forEach(child => {
                                child.style.setProperty('color', headerTextColor, 'important');
                            });
                        }
                        
                        // Update all elements with classes
                        requestAnimationFrame(() => {
                            // Update cards
                            document.querySelectorAll('.preview-card').forEach(card => {
                                if (!card.classList.contains('selected-card')) {
                                    card.style.setProperty('background', backgroundColor, 'important');
                                    card.style.setProperty('border-color', borderColor, 'important');
                                }
                                card.style.setProperty('border-radius', borderRadius + 'px', 'important');
                            });
                            
                            // Update primary elements
                            document.querySelectorAll('.selected-card, .radio-btn, .preview-button').forEach(el => {
                                el.style.setProperty('background', currentPrimary, 'important');
                                el.style.setProperty('color', primaryTextColor, 'important');
                                el.style.setProperty('border-radius', borderRadius + 'px', 'important');
                                el.querySelectorAll('*').forEach(child => {
                                    child.style.setProperty('color', primaryTextColor, 'important');
                                });
                            });
                            
                            // Dynamic hover styles
                            let hoverStyle = document.getElementById('hover-styles');
                            if (!hoverStyle) {
                                hoverStyle = document.createElement('style');
                                hoverStyle.id = 'hover-styles';
                                document.head.appendChild(hoverStyle);
                            }
                            hoverStyle.textContent = `.preview-button:hover { background: ${primaryDark} !important; }`;
                            
                            // Update secondary buttons (like login)
                            document.querySelectorAll('.secondary-btn').forEach(el => {
                                el.style.setProperty('background', 'transparent', 'important');
                                el.style.setProperty('border-color', 'white', 'important');
                                el.style.setProperty('color', 'white', 'important');
                            });
                            
                            // Update success elements
                            document.querySelectorAll('.preview-success').forEach(el => {
                                el.style.setProperty('background', successColor, 'important');
                                el.style.setProperty('border-radius', borderRadius + 'px', 'important');
                            });
                            
                            // Update text elements
                            document.querySelectorAll('.preview-text').forEach(el => {
                                el.style.setProperty('color', currentText, 'important');
                            });
                            
                            // Update step progress
                            const step1 = document.getElementById('step-1');
                            const label1 = document.getElementById('step-1-label');
                            if (step1) step1.style.setProperty('background', currentPrimary, 'important');
                            if (label1) label1.style.setProperty('color', currentPrimary, 'important');
                            
                            // Update input fields
                            document.querySelectorAll('input').forEach(input => {
                                input.style.setProperty('border-color', borderColor, 'important');
                                input.style.setProperty('border-radius', borderRadius + 'px', 'important');
                            });
                        });
                    }
                    
                    // Preview selector change
                    document.getElementById('preview-selector').addEventListener('change', function() {
                        loadPreview(this.value);
                    });
                    

                    
                    // Theme selection
                    const themeRadios = document.querySelectorAll('input[name="appointease_options[appearance_theme]"]');
                    const customSection = document.getElementById('custom-colors-section');
                    
                    themeRadios.forEach(radio => {
                        radio.addEventListener('change', function() {
                            document.querySelectorAll('.theme-option').forEach(option => {
                                option.style.borderColor = '#e5e7eb';
                            });
                            this.closest('.theme-option').style.borderColor = '#1CBC9B';
                            
                            if (this.value === 'custom') {
                                customSection.style.display = 'block';
                            } else {
                                customSection.style.display = 'none';
                                applyTheme(this.value);
                            }
                            updatePreview();
                        });
                    });
                    
                    function applyTheme(theme) {
                        const themes = {
                            light: { primary_color: '#1CBC9B', header_color: '#004D40', text_color: '#263238' },
                            dark: { primary_color: '#8E44AD', header_color: '#1D2125', text_color: '#FFFFFF' }
                        };
                        
                        if (themes[theme]) {
                            Object.keys(themes[theme]).forEach(colorKey => {
                                const input = document.querySelector(`input[name="appointease_options[${colorKey}]"]`);
                                if (input) input.value = themes[theme][colorKey];
                            });
                        }
                    }
                    
                    // Smart color functions
                    function getContrastColor(hexColor) {
                        const r = parseInt(hexColor.slice(1, 3), 16);
                        const g = parseInt(hexColor.slice(3, 5), 16);
                        const b = parseInt(hexColor.slice(5, 7), 16);
                        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                        return luminance > 0.5 ? '#263238' : '#FFFFFF';
                    }
                    
                    function darkenColor(hex, percent) {
                        const num = parseInt(hex.replace('#', ''), 16);
                        const amt = Math.round(2.55 * percent);
                        const R = Math.max(0, Math.min(255, (num >> 16) - amt));
                        const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) - amt));
                        const B = Math.max(0, Math.min(255, (num & 0x0000FF) - amt));
                        return '#' + ((R << 16) + (G << 8) + B).toString(16).padStart(6, '0');
                    }
                    
                    // Real-time updates
                    document.addEventListener('input', updatePreview);
                    document.addEventListener('change', updatePreview);
                    
                    // Initial load
                    loadPreview('service');
                });
            </script>
        </div>
        <?php
    }
}

new Booking_Settings();