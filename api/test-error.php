<?php
// Test file to check PHP error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', 'php_errors.log');

header('Content-Type: text/plain');

echo "PHP Error Test\n";
echo "Error reporting level: " . error_reporting() . "\n";
echo "Display errors: " . ini_get('display_errors') . "\n";
echo "Log errors: " . ini_get('log_errors') . "\n";
echo "Error log: " . ini_get('error_log') . "\n";

// Intentional error to test
$undefined_variable->nonexistent_method();

echo "This line should not be reached\n";
?>