<?php
// Simulate the actual API call to see what's being returned

// Set up a fake session for user 3
$_COOKIE['session_token'] = 'test_token';

// Include the users API file
require_once 'api/users.php';

echo "=== Testing Actual API Response ===\n";

try {
    // Create a mock session in the database for user 3
    $db = new PDO('sqlite:api/data/app.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Insert a test session
    $stmt = $db->prepare('INSERT OR REPLACE INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)');
    $stmt->execute(['test_token', 3, date('Y-m-d H:i:s', strtotime('+1 hour'))]);
    
    echo "Created test session for user 3\n";
    
    // Now test the API
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['REQUEST_URI'] = '/api/users/profile';
    $_SERVER['HTTP_CONTENT_TYPE'] = 'application/json';
    
    // Capture output
    ob_start();
    
    $userAPI = new UserAPI();
    $response = $userAPI->handleRequest();
    
    $output = ob_get_clean();
    
    echo "API Response:\n";
    echo $response . "\n";
    
    if ($output) {
        echo "Additional output: $output\n";
    }
    
    // Parse the JSON response
    $data = json_decode($response, true);
    if ($data) {
        echo "\nParsed response:\n";
        echo json_encode($data, JSON_PRETTY_PRINT) . "\n";
        
        if (isset($data['user']['role'])) {
            echo "\nUser role in response: " . $data['user']['role'] . "\n";
        } else {
            echo "\nWARNING: No role field in user data!\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>