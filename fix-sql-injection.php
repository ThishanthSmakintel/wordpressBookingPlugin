<?php
/**
 * SQL Injection Fix Script
 * 
 * This script provides examples of how to fix SQL injection vulnerabilities
 * Run this to see the patterns that need to be applied throughout the codebase
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    die('Direct access not permitted');
}

class SQL_Injection_Fixer {
    
    /**
     * Example fixes for common SQL injection patterns
     */
    public static function show_examples() {
        global $wpdb;
        
        echo "<h2>SQL Injection Fix Examples</h2>";
        
        // Example 1: Simple SELECT with ID
        echo "<h3>1. SELECT with ID</h3>";
        echo "<strong>BEFORE (VULNERABLE):</strong><br>";
        echo "<code>\$wpdb->get_row(\"SELECT * FROM {\$wpdb->prefix}appointments WHERE id = \$id\");</code><br><br>";
        
        echo "<strong>AFTER (SECURE):</strong><br>";
        echo "<code>\$wpdb->get_row(\$wpdb->prepare(\"SELECT * FROM {\$wpdb->prefix}appointments WHERE id = %d\", \$id));</code><br><br>";
        
        // Example 2: SELECT with multiple conditions
        echo "<h3>2. SELECT with Multiple Conditions</h3>";
        echo "<strong>BEFORE (VULNERABLE):</strong><br>";
        echo "<code>\$wpdb->get_results(\"SELECT * FROM {\$wpdb->prefix}appointments WHERE email = '\$email' AND status = '\$status'\");</code><br><br>";
        
        echo "<strong>AFTER (SECURE):</strong><br>";
        echo "<code>\$wpdb->get_results(\$wpdb->prepare(\"SELECT * FROM {\$wpdb->prefix}appointments WHERE email = %s AND status = %s\", \$email, \$status));</code><br><br>";
        
        // Example 3: INSERT statement
        echo "<h3>3. INSERT Statement</h3>";
        echo "<strong>BEFORE (VULNERABLE):</strong><br>";
        echo "<code>\$wpdb->query(\"INSERT INTO {\$wpdb->prefix}appointments (name, email) VALUES ('\$name', '\$email')\");</code><br><br>";
        
        echo "<strong>AFTER (SECURE - Method 1):</strong><br>";
        echo "<code>\$wpdb->insert(\$wpdb->prefix . 'appointments', array('name' => \$name, 'email' => \$email), array('%s', '%s'));</code><br><br>";
        
        echo "<strong>AFTER (SECURE - Method 2):</strong><br>";
        echo "<code>\$wpdb->query(\$wpdb->prepare(\"INSERT INTO {\$wpdb->prefix}appointments (name, email) VALUES (%s, %s)\", \$name, \$email));</code><br><br>";
        
        // Example 4: UPDATE statement
        echo "<h3>4. UPDATE Statement</h3>";
        echo "<strong>BEFORE (VULNERABLE):</strong><br>";
        echo "<code>\$wpdb->query(\"UPDATE {\$wpdb->prefix}appointments SET status = '\$status' WHERE id = \$id\");</code><br><br>";
        
        echo "<strong>AFTER (SECURE - Method 1):</strong><br>";
        echo "<code>\$wpdb->update(\$wpdb->prefix . 'appointments', array('status' => \$status), array('id' => \$id), array('%s'), array('%d'));</code><br><br>";
        
        echo "<strong>AFTER (SECURE - Method 2):</strong><br>";
        echo "<code>\$wpdb->query(\$wpdb->prepare(\"UPDATE {\$wpdb->prefix}appointments SET status = %s WHERE id = %d\", \$status, \$id));</code><br><br>";
        
        // Example 5: DELETE statement
        echo "<h3>5. DELETE Statement</h3>";
        echo "<strong>BEFORE (VULNERABLE):</strong><br>";
        echo "<code>\$wpdb->query(\"DELETE FROM {\$wpdb->prefix}appointments WHERE id = \$id\");</code><br><br>";
        
        echo "<strong>AFTER (SECURE - Method 1):</strong><br>";
        echo "<code>\$wpdb->delete(\$wpdb->prefix . 'appointments', array('id' => \$id), array('%d'));</code><br><br>";
        
        echo "<strong>AFTER (SECURE - Method 2):</strong><br>";
        echo "<code>\$wpdb->query(\$wpdb->prepare(\"DELETE FROM {\$wpdb->prefix}appointments WHERE id = %d\", \$id));</code><br><br>";
        
        // Example 6: IN clause
        echo "<h3>6. IN Clause with Multiple Values</h3>";
        echo "<strong>BEFORE (VULNERABLE):</strong><br>";
        echo "<code>\$ids = implode(',', \$id_array);<br>\$wpdb->get_results(\"SELECT * FROM {\$wpdb->prefix}appointments WHERE id IN (\$ids)\");</code><br><br>";
        
        echo "<strong>AFTER (SECURE):</strong><br>";
        echo "<code>\$placeholders = implode(',', array_fill(0, count(\$id_array), '%d'));<br>\$wpdb->get_results(\$wpdb->prepare(\"SELECT * FROM {\$wpdb->prefix}appointments WHERE id IN (\$placeholders)\", \$id_array));</code><br><br>";
        
        // Example 7: LIKE clause
        echo "<h3>7. LIKE Clause</h3>";
        echo "<strong>BEFORE (VULNERABLE):</strong><br>";
        echo "<code>\$wpdb->get_results(\"SELECT * FROM {\$wpdb->prefix}appointments WHERE name LIKE '%\$search%'\");</code><br><br>";
        
        echo "<strong>AFTER (SECURE):</strong><br>";
        echo "<code>\$like = '%' . \$wpdb->esc_like(\$search) . '%';<br>\$wpdb->get_results(\$wpdb->prepare(\"SELECT * FROM {\$wpdb->prefix}appointments WHERE name LIKE %s\", \$like));</code><br><br>";
    }
    
    /**
     * Scan a file for potential SQL injection vulnerabilities
     */
    public static function scan_file($file_path) {
        if (!file_exists($file_path)) {
            return array('error' => 'File not found');
        }
        
        $content = file_get_contents($file_path);
        $lines = explode("\n", $content);
        $vulnerabilities = array();
        
        foreach ($lines as $line_num => $line) {
            // Check for direct variable interpolation in SQL
            if (preg_match('/\$wpdb->(query|get_.*)\s*\(\s*["\'].*\$/', $line)) {
                if (!preg_match('/\$wpdb->prepare/', $line)) {
                    $vulnerabilities[] = array(
                        'line' => $line_num + 1,
                        'code' => trim($line),
                        'severity' => 'HIGH'
                    );
                }
            }
            
            // Check for string concatenation in SQL
            if (preg_match('/\$wpdb->(query|get_.*)\s*\(.*\..*\$/', $line)) {
                if (!preg_match('/\$wpdb->prepare/', $line)) {
                    $vulnerabilities[] = array(
                        'line' => $line_num + 1,
                        'code' => trim($line),
                        'severity' => 'HIGH'
                    );
                }
            }
        }
        
        return $vulnerabilities;
    }
    
    /**
     * Generate a report of all files needing fixes
     */
    public static function generate_report() {
        $plugin_dir = plugin_dir_path(__FILE__);
        $files_to_check = array(
            'includes/class-api-endpoints.php',
            'admin/appointease-admin.php',
            'includes/class-activator.php',
            'includes/class-db-seeder.php',
            'includes/class-db-reset.php',
            'includes/class-atomic-booking.php',
            'includes/class-booking-plugin.php',
            'includes/session-manager.php',
            'includes/debug-data-endpoint.php'
        );
        
        $report = array();
        foreach ($files_to_check as $file) {
            $full_path = $plugin_dir . $file;
            if (file_exists($full_path)) {
                $vulnerabilities = self::scan_file($full_path);
                if (!empty($vulnerabilities)) {
                    $report[$file] = $vulnerabilities;
                }
            }
        }
        
        return $report;
    }
}

// Only run if accessed directly (not in production)
if (defined('WP_DEBUG') && WP_DEBUG && isset($_GET['show_sql_fixes'])) {
    SQL_Injection_Fixer::show_examples();
    
    echo "<hr><h2>Vulnerability Scan Report</h2>";
    $report = SQL_Injection_Fixer::generate_report();
    
    if (empty($report)) {
        echo "<p style='color: green;'><strong>✓ No obvious SQL injection vulnerabilities found!</strong></p>";
    } else {
        echo "<p style='color: red;'><strong>⚠ Found potential vulnerabilities in " . count($report) . " files:</strong></p>";
        foreach ($report as $file => $vulnerabilities) {
            echo "<h3>$file (" . count($vulnerabilities) . " issues)</h3>";
            echo "<ul>";
            foreach ($vulnerabilities as $vuln) {
                echo "<li><strong>Line {$vuln['line']}</strong> [{$vuln['severity']}]: <code>" . htmlspecialchars($vuln['code']) . "</code></li>";
            }
            echo "</ul>";
        }
    }
}
