<?php
// Simple registration test script
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Enable all error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/test_errors.log');

try {
    echo json_encode([
        'step' => 'Starting test',
        'php_version' => phpversion(),
        'time' => date('Y-m-d H:i:s')
    ]) . "\n";
    
    // Test 1: Check if we can include database.php
    echo json_encode(['step' => 'Including database.php']) . "\n";
    require_once 'database.php';
    echo json_encode(['step' => 'Database.php included successfully']) . "\n";
    
    // Test 2: Create database instance
    echo json_encode(['step' => 'Creating database instance']) . "\n";
    $database = new Database();
    echo json_encode(['step' => 'Database instance created successfully']) . "\n";
    
    // Test 3: Test database connection
    echo json_encode(['step' => 'Testing database connection']) . "\n";
    $connection = $database->getConnection();
    echo json_encode(['step' => 'Database connection successful']) . "\n";
    
    // Test 4: Test a simple query
    echo json_encode(['step' => 'Testing simple query']) . "\n";
    $stmt = $database->query('SELECT COUNT(*) as count FROM users', []);
    $result = $stmt->fetch();
    echo json_encode(['step' => 'Query successful', 'user_count' => $result['count']]) . "\n";
    
    // Test 5: Test JSON input parsing
    echo json_encode(['step' => 'Testing JSON input']) . "\n";
    $testInput = '{"username":"testuser","email":"test@example.com","password":"testpass123"}';
    $parsed = json_decode($testInput, true);
    echo json_encode(['step' => 'JSON parsing successful', 'parsed' => $parsed]) . "\n";
    
    // Test 6: Test password hashing
    echo json_encode(['step' => 'Testing password hashing']) . "\n";
    $hash = password_hash('testpass123', PASSWORD_DEFAULT);
    echo json_encode(['step' => 'Password hashing successful', 'hash_length' => strlen($hash)]) . "\n";
    
    echo json_encode(['step' => 'All tests completed successfully', 'status' => 'OK']) . "\n";
    
} catch (Exception $e) {
    echo json_encode([
        'step' => 'ERROR',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]) . "\n";
} catch (Error $e) {
    echo json_encode([
        'step' => 'FATAL ERROR',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]) . "\n";
}
?>