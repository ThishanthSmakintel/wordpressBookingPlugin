<?php
/**
 * Security Patch Application Script
 * Run once to apply automated security fixes
 * 
 * Usage: wp eval-file apply-security-patches.php
 * Or visit: /wp-content/plugins/wordpressBookingPlugin/apply-security-patches.php?key=YOUR_SECRET_KEY
 */

// Security check
if (!defined('ABSPATH')) {
    // If not in WordPress context, require manual key
    $secret_key = 'CHANGE_THIS_TO_RANDOM_STRING'; // CHANGE THIS!
    if (!isset($_GET['key']) || $_GET['key'] !== $secret_key) {
        die('Unauthorized access');
    }
    require_once('../../../wp-load.php');
}

// Verify admin
if (!current_user_can('manage_options')) {
    wp_die('You do not have permission to run this script');
}

echo "<h1>AppointEase Security Patch Application</h1>\n";
echo "<pre>\n";

$fixes_applied = 0;
$errors = [];

/**
 * Fix 1: Add .htaccess protection for debug files
 */
function fix_htaccess_protection() {
    global $fixes_applied, $errors;
    
    $htaccess_file = BOOKING_PLUGIN_PATH . '.htaccess';
    $protection_rules = "\n# AppointEase Security - Block debug files\n";
    $protection_rules .= "<FilesMatch \"^(debug-|test-|add-test-|check-|fix-|search-|seed-|update-db|test_|detailed_).*\\.(php|py)$\">\n";
    $protection_rules .= "    Order allow,deny\n";
    $protection_rules .= "    Deny from all\n";
    $protection_rules .= "</FilesMatch>\n";
    
    if (file_exists($htaccess_file)) {
        $current_content = file_get_contents($htaccess_file);
        if (strpos($current_content, 'AppointEase Security') === false) {
            file_put_contents($htaccess_file, $current_content . $protection_rules);
            echo "✓ Added .htaccess protection rules\n";
            $fixes_applied++;
        } else {
            echo "- .htaccess protection already exists\n";
        }
    } else {
        file_put_contents($htaccess_file, $protection_rules);
        echo "✓ Created .htaccess with protection rules\n";
        $fixes_applied++;
    }
}

/**
 * Fix 2: Update wp-config.php with security constants
 */
function fix_wp_config_security() {
    global $fixes_applied, $errors;
    
    $security_constants = [
        'DISALLOW_FILE_EDIT' => true,
        'FORCE_SSL_ADMIN' => true,
    ];
    
    foreach ($security_constants as $constant => $value) {
        if (!defined($constant)) {
            echo "⚠ Add to wp-config.php: define('$constant', " . ($value ? 'true' : 'false') . ");\n";
        } else {
            echo "- $constant already defined\n";
        }
    }
}

/**
 * Fix 3: Create security headers file
 */
function fix_security_headers() {
    global $fixes_applied, $errors;
    
    $headers_file = BOOKING_PLUGIN_PATH . 'includes/security-headers.php';
    $headers_content = "<?php\n";
    $headers_content .= "// Security Headers\n";
    $headers_content .= "if (!defined('ABSPATH')) exit;\n\n";
    $headers_content .= "add_action('send_headers', function() {\n";
    $headers_content .= "    header('X-Content-Type-Options: nosniff');\n";
    $headers_content .= "    header('X-Frame-Options: SAMEORIGIN');\n";
    $headers_content .= "    header('X-XSS-Protection: 1; mode=block');\n";
    $headers_content .= "    header('Referrer-Policy: strict-origin-when-cross-origin');\n";
    $headers_content .= "});\n";
    
    if (!file_exists($headers_file)) {
        file_put_contents($headers_file, $headers_content);
        echo "✓ Created security headers file\n";
        $fixes_applied++;
    } else {
        echo "- Security headers file already exists\n";
    }
}

/**
 * Fix 4: Scan and report vulnerable patterns
 */
function scan_vulnerable_patterns() {
    global $errors;
    
    echo "\n=== Vulnerability Scan ===\n";
    
    $patterns = [
        'SQL Injection' => '/\$wpdb->(query|get_results|get_row|get_var|get_col)\s*\(\s*["\'](?!.*prepare)/',
        'XSS innerHTML' => '/\.innerHTML\s*=/',
        'Insecure HTTP' => '/["\']http:\/\//',
        'eval() usage' => '/\beval\s*\(/',
        'Missing nonce' => '/function\s+\w+\s*\([^)]*\)\s*\{(?!.*check_ajax_referer)/',
    ];
    
    $php_files = glob(BOOKING_PLUGIN_PATH . '{includes,admin}/*.php', GLOB_BRACE);
    $js_files = glob(BOOKING_PLUGIN_PATH . '{admin,src}/*.{js,ts,tsx}', GLOB_BRACE);
    
    foreach ($patterns as $name => $pattern) {
        $found = 0;
        $files_to_scan = ($name === 'XSS innerHTML' || $name === 'Insecure HTTP' || $name === 'eval() usage') 
            ? $js_files 
            : $php_files;
        
        foreach ($files_to_scan as $file) {
            $content = file_get_contents($file);
            if (preg_match($pattern, $content)) {
                $found++;
            }
        }
        
        if ($found > 0) {
            echo "⚠ $name: Found in $found file(s)\n";
        }
    }
}

/**
 * Fix 5: Create JavaScript security helper
 */
function fix_js_security_helper() {
    global $fixes_applied;
    
    $js_helper_file = BOOKING_PLUGIN_PATH . 'admin/security-helper.js';
    $js_content = "/**\n * Security Helper Functions\n */\n\n";
    $js_content .= "function escapeHtml(text) {\n";
    $js_content .= "    const div = document.createElement('div');\n";
    $js_content .= "    div.textContent = text;\n";
    $js_content .= "    return div.innerHTML;\n";
    $js_content .= "}\n\n";
    $js_content .= "function sanitizeLog(data) {\n";
    $js_content .= "    if (typeof data === 'object') {\n";
    $js_content .= "        data = JSON.stringify(data);\n";
    $js_content .= "    }\n";
    $js_content .= "    return String(data).replace(/[\\n\\r]/g, '');\n";
    $js_content .= "}\n\n";
    $js_content .= "function safeAjax(action, data, callback) {\n";
    $js_content .= "    if (typeof appointeaseAdmin === 'undefined') {\n";
    $js_content .= "        console.error('appointeaseAdmin not defined');\n";
    $js_content .= "        return;\n";
    $js_content .= "    }\n";
    $js_content .= "    jQuery.post(appointeaseAdmin.ajaxurl, {\n";
    $js_content .= "        action: action,\n";
    $js_content .= "        _wpnonce: appointeaseAdmin.nonce,\n";
    $js_content .= "        ...data\n";
    $js_content .= "    }, callback);\n";
    $js_content .= "}\n";
    
    if (!file_exists($js_helper_file)) {
        file_put_contents($js_helper_file, $js_content);
        echo "✓ Created JavaScript security helper\n";
        $fixes_applied++;
    } else {
        echo "- JavaScript security helper already exists\n";
    }
}

// Run all fixes
echo "Starting security patch application...\n\n";

try {
    fix_htaccess_protection();
    fix_wp_config_security();
    fix_security_headers();
    fix_js_security_helper();
    scan_vulnerable_patterns();
    
    echo "\n=== Summary ===\n";
    echo "Fixes applied: $fixes_applied\n";
    echo "Errors: " . count($errors) . "\n";
    
    if (!empty($errors)) {
        echo "\nErrors encountered:\n";
        foreach ($errors as $error) {
            echo "- $error\n";
        }
    }
    
    echo "\n✓ Automated patches completed!\n";
    echo "\n⚠ MANUAL FIXES STILL REQUIRED:\n";
    echo "1. Review APPLY-SECURITY-FIXES.md for manual patterns\n";
    echo "2. Add capability checks to all admin functions\n";
    echo "3. Fix SQL injection in bulk operations\n";
    echo "4. Update JavaScript files to use security helpers\n";
    echo "5. Test all functionality after fixes\n";
    
} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
}

echo "</pre>\n";

// Self-destruct option
if (isset($_GET['delete_script']) && $_GET['delete_script'] === 'yes') {
    unlink(__FILE__);
    echo "<p><strong>Script deleted for security.</strong></p>\n";
}

echo "<p><a href='?key=" . ($_GET['key'] ?? '') . "&delete_script=yes'>Delete this script</a> (recommended after running)</p>\n";
