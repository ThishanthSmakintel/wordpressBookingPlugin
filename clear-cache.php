<?php
/**
 * Clear all caches - Run this once then delete this file
 */

// Clear OpCache
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "✓ OpCache cleared\n";
}

// Clear WordPress object cache
if (function_exists('wp_cache_flush')) {
    wp_cache_flush();
    echo "✓ WordPress cache cleared\n";
}

// Clear transients
global $wpdb;
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_%'");
echo "✓ Transients cleared\n";

echo "\n✓ All caches cleared! Now refresh your browser.\n";
echo "⚠ Delete this file after running it.\n";
