<?php
/**
 * Screenshot Handler
 * Saves base64 screenshots to debug-screenshots folder
 */

class Screenshot_Handler {
    
    private $upload_dir;
    
    public function __construct() {
        $this->upload_dir = plugin_dir_path(dirname(__FILE__)) . 'debug-screenshots/';
        $this->ensure_directories();
    }
    
    private function ensure_directories() {
        $dirs = [
            $this->upload_dir,
            $this->upload_dir . 'ui-states/',
            $this->upload_dir . 'errors/',
            $this->upload_dir . 'flows/'
        ];
        
        foreach ($dirs as $dir) {
            if (!file_exists($dir)) {
                wp_mkdir_p($dir);
            }
        }
    }
    
    public function save_screenshot($request) {
        // Verify nonce
        if (!wp_verify_nonce($request->get_header('X-WP-Nonce'), 'wp_rest')) {
            return new WP_Error('invalid_nonce', 'Security check failed', ['status' => 403]);
        }
        
        $params = $request->get_json_params();
        
        if (empty($params['image']) || empty($params['filename'])) {
            return new WP_Error('missing_data', 'Image data or filename missing', ['status' => 400]);
        }
        
        // Extract base64 data
        $image_data = $params['image'];
        if (strpos($image_data, 'data:image/png;base64,') === 0) {
            $image_data = str_replace('data:image/png;base64,', '', $image_data);
        }
        
        $image_data = base64_decode($image_data);
        
        if ($image_data === false) {
            return new WP_Error('invalid_image', 'Invalid image data', ['status' => 400]);
        }
        
        // Sanitize filename
        $filename = sanitize_file_name($params['filename']);
        if (!preg_match('/\.png$/', $filename)) {
            $filename .= '.png';
        }
        
        // Determine subfolder based on filename
        $subfolder = 'ui-states/';
        if (strpos($filename, 'error-') === 0) {
            $subfolder = 'errors/';
        } elseif (strpos($filename, 'flow-') === 0) {
            $subfolder = 'flows/';
        }
        
        $filepath = $this->upload_dir . $subfolder . $filename;
        
        // Save file
        $result = file_put_contents($filepath, $image_data);
        
        if ($result === false) {
            return new WP_Error('save_failed', 'Failed to save screenshot', ['status' => 500]);
        }
        
        // Log the screenshot
        $this->log_screenshot($filename, $subfolder, $params);
        
        return [
            'success' => true,
            'message' => 'Screenshot saved successfully',
            'filename' => $filename,
            'path' => $subfolder . $filename,
            'size' => size_format($result)
        ];
    }
    
    private function log_screenshot($filename, $subfolder, $params) {
        $log_file = $this->upload_dir . 'SCREENSHOT-LOG.md';
        
        $date = current_time('Y-m-d');
        $time = current_time('H:i:s');
        $step = isset($params['step']) ? $params['step'] : 'N/A';
        $mode = isset($params['mode']) ? $params['mode'] : 'N/A';
        $user_state = isset($params['userState']) ? $params['userState'] : 'N/A';
        $notes = isset($params['notes']) ? $params['notes'] : 'Auto-captured';
        
        $log_entry = sprintf(
            "- `%s` | Step %s | %s | %s | `%s%s` | %s\n",
            $time,
            $step,
            ucfirst($mode),
            ucfirst($user_state),
            $subfolder,
            $filename,
            $notes
        );
        
        // Check if date header exists
        $log_content = file_exists($log_file) ? file_get_contents($log_file) : '';
        
        if (strpos($log_content, "### $date") === false) {
            // Add new date section
            $log_entry = "\n### $date\n" . $log_entry;
        }
        
        // Append to log
        file_put_contents($log_file, $log_entry, FILE_APPEND);
    }
    
    public function get_screenshots($request) {
        $subfolder = $request->get_param('folder') ?: 'ui-states';
        $dir = $this->upload_dir . $subfolder . '/';
        
        if (!file_exists($dir)) {
            return ['screenshots' => []];
        }
        
        $files = array_diff(scandir($dir), ['.', '..']);
        $screenshots = [];
        
        foreach ($files as $file) {
            if (preg_match('/\.png$/', $file)) {
                $filepath = $dir . $file;
                $screenshots[] = [
                    'filename' => $file,
                    'size' => size_format(filesize($filepath)),
                    'date' => date('Y-m-d H:i:s', filemtime($filepath)),
                    'url' => plugins_url('debug-screenshots/' . $subfolder . '/' . $file, dirname(__FILE__))
                ];
            }
        }
        
        return ['screenshots' => $screenshots];
    }
}
