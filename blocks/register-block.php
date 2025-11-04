<?php
/**
 * Register Gutenberg Block
 */

if (!defined('ABSPATH')) {
    exit;
}

// Prevent duplicate registration
if (function_exists('appointease_register_block')) {
    return;
}

function appointease_register_block() {
    // Check if already registered
    if (WP_Block_Type_Registry::get_instance()->is_registered('appointease/booking-form')) {
        return;
    }
    
    // Register block script
    wp_register_script(
        'appointease-block-editor',
        BOOKING_PLUGIN_URL . 'build/index.js',
        array('wp-blocks', 'wp-element', 'wp-editor', 'wp-components', 'wp-i18n'),
        BOOKING_PLUGIN_VERSION,
        true
    );

    // Register block styles
    wp_register_style(
        'appointease-block-editor',
        BOOKING_PLUGIN_URL . 'build/index.css',
        array('wp-edit-blocks'),
        BOOKING_PLUGIN_VERSION
    );

    // Register frontend script
    wp_register_script(
        'appointease-frontend',
        BOOKING_PLUGIN_URL . 'build/frontend.js',
        array('wp-element'),
        BOOKING_PLUGIN_VERSION,
        true
    );

    // Register frontend style
    wp_register_style(
        'appointease-block-frontend',
        BOOKING_PLUGIN_URL . 'build/frontend.css',
        array(),
        BOOKING_PLUGIN_VERSION
    );

    // Register block
    register_block_type('appointease/booking-form', array(
        'editor_script' => 'appointease-block-editor',
        'editor_style' => 'appointease-block-editor',
        'script' => 'appointease-frontend',
        'style' => 'appointease-block-frontend',
        'render_callback' => 'appointease_render_block',
        'attributes' => array(
            'columns' => array(
                'type' => 'number',
                'default' => 2
            ),
            'width' => array(
                'type' => 'number',
                'default' => 100
            ),
            'height' => array(
                'type' => 'number',
                'default' => 600
            )
        )
    ));
}
add_action('init', 'appointease_register_block');

/**
 * Render block on frontend
 */
function appointease_render_block($attributes) {
    $columns = isset($attributes['columns']) ? intval($attributes['columns']) : 2;
    $width = isset($attributes['width']) ? intval($attributes['width']) : 100;
    $height = isset($attributes['height']) ? intval($attributes['height']) : 600;
    
    ob_start();
    ?>
    <div class="appointease-booking-wrapper" data-columns="<?php echo esc_attr($columns); ?>" data-width="<?php echo esc_attr($width); ?>" data-height="<?php echo esc_attr($height); ?>">
        <div id="appointease-booking"></div>
    </div>
    <?php
    return ob_get_clean();
}
