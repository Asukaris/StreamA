<?php
// Server Environment Check Script
// This script checks if the server environment is properly configured

header('Content-Type: text/plain');
echo "=== Server Environment Check ===\n\n";

// Check PHP version
echo "PHP Version: " . phpversion() . "\n";

// Check if PDO SQLite is available
if (extension_loaded('pdo_sqlite')) {
    echo "PDO SQLite: Available\n";
} else {
    echo "PDO SQLite: NOT AVAILABLE - This is required!\n";
}

// Check current directory permissions
$currentDir = __DIR__;
echo "Current Directory: $currentDir\n";
echo "Directory Writable: " . (is_writable($currentDir) ? 'YES' : 'NO') . "\n";

// Try to create data directory
$dataDir = $currentDir . '/data';
echo "Data Directory: $dataDir\n";

if (!is_dir($dataDir)) {
    echo "Data Directory Exists: NO\n";
    echo "Attempting to create data directory...\n";
    
    if (@mkdir($dataDir, 0755, true)) {
        echo "Data Directory Created: YES\n";
    } else {
        echo "Data Directory Created: NO - Permission denied!\n";
        echo "Error: " . error_get_last()['message'] . "\n";
    }
} else {
    echo "Data Directory Exists: YES\n";
}

// Check data directory permissions
if (is_dir($dataDir)) {
    echo "Data Directory Writable: " . (is_writable($dataDir) ? 'YES' : 'NO') . "\n";
}

// Try to create a test database
$testDbPath = $dataDir . '/test.db';
echo "\nTesting SQLite Database Creation...\n";

try {
    $testDb = new PDO('sqlite:' . $testDbPath);
    $testDb->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Try to create a test table
    $testDb->exec("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)");
    $testDb->exec("INSERT INTO test (name) VALUES ('test')");
    
    echo "SQLite Database: Working\n";
    
    // Clean up test database
    unlink($testDbPath);
    
} catch (Exception $e) {
    echo "SQLite Database: FAILED - " . $e->getMessage() . "\n";
}

// Check error logging
echo "\nError Logging Test...\n";
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/test_errors.log');

error_log('Test error log entry');

if (file_exists(__DIR__ . '/test_errors.log')) {
    echo "Error Logging: Working\n";
    unlink(__DIR__ . '/test_errors.log');
} else {
    echo "Error Logging: Failed\n";
}

echo "\n=== Check Complete ===\n";
echo "If any items show as failed, contact your hosting provider.\n";
?>