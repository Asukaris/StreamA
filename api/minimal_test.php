<?php
// Minimal test to isolate the issue
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/minimal_test.log');

header('Content-Type: application/json');

try {
    echo json_encode(['step' => 'Starting minimal test', 'time' => date('Y-m-d H:i:s')]);
    
    // Test 1: Include database
    echo "\n" . json_encode(['step' => 'Including database.php']);
    require_once 'database.php';
    echo "\n" . json_encode(['step' => 'Database included successfully']);
    
    // Test 2: Create database instance
    echo "\n" . json_encode(['step' => 'Creating database instance']);
    $database = new Database();
    echo "\n" . json_encode(['step' => 'Database instance created']);
    
    // Test 3: Include users.php class definition
    echo "\n" . json_encode(['step' => 'Reading users.php for class definition']);
    $usersContent = file_get_contents(__DIR__ . '/users.php');
    if (strpos($usersContent, 'class UserAPI') !== false) {
        echo "\n" . json_encode(['step' => 'UserAPI class found in users.php']);
    } else {
        echo "\n" . json_encode(['step' => 'ERROR: UserAPI class not found in users.php']);
    }
    
    // Test 4: Try to extract and eval just the class definition
    echo "\n" . json_encode(['step' => 'Attempting to define UserAPI class']);
    
    // Simple class definition test
    if (!class_exists('UserAPI')) {
        // Extract class definition from users.php
        $classStart = strpos($usersContent, 'class UserAPI');
        if ($classStart !== false) {
            // Find the end of the class (simplified approach)
            $classEnd = strrpos($usersContent, '}');
            if ($classEnd !== false) {
                $classDefinition = substr($usersContent, $classStart, $classEnd - $classStart + 1);
                echo "\n" . json_encode(['step' => 'Class definition extracted', 'length' => strlen($classDefinition)]);
                
                // Try to eval the class definition
                eval($classDefinition);
                echo "\n" . json_encode(['step' => 'Class definition evaluated successfully']);
            }
        }
    }
    
    // Test 5: Create UserAPI instance
    echo "\n" . json_encode(['step' => 'Creating UserAPI instance']);
    $userAPI = new UserAPI($database);
    echo "\n" . json_encode(['step' => 'UserAPI instance created successfully']);
    
    echo "\n" . json_encode(['step' => 'All tests completed', 'status' => 'SUCCESS']);
    
} catch (ParseError $e) {
    echo "\n" . json_encode([
        'step' => 'PARSE ERROR',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
} catch (Error $e) {
    echo "\n" . json_encode([
        'step' => 'FATAL ERROR',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
} catch (Exception $e) {
    echo "\n" . json_encode([
        'step' => 'EXCEPTION',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>