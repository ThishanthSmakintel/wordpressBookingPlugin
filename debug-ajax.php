<?php
// Emergency error display for AJAX
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/ajax-errors.log');

// Catch all errors
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    $msg = "[$errno] $errstr in $errfile:$errline\n";
    file_put_contents(__DIR__ . '/ajax-errors.log', $msg, FILE_APPEND);
    echo $msg;
});

// Catch fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        $msg = "FATAL: {$error['message']} in {$error['file']}:{$error['line']}\n";
        file_put_contents(__DIR__ . '/ajax-errors.log', $msg, FILE_APPEND);
        echo $msg;
    }
});

echo "Error handler installed\n";
