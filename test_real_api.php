<?php
// Test the actual API response using a real session token

try {
    $db = new PDO('sqlite:api/data/app.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== Testing Real API Response ===\n";
    
    // Get the latest session token for user 3
    $stmt = $db->prepare('SELECT session_token FROM sessions WHERE user_id = 3 ORDER BY created_at DESC LIMIT 1');
    $stmt->execute();
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        echo "No session found for user 3\n";
        exit;
    }
    
    $token = $session['session_token'];
    echo "Using session token: " . substr($token, 0, 20) . "...\n\n";
    
    // Make a real API call
    $url = 'http://localhost/api/users/profile';
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'Content-Type: application/json',
                'Cookie: session_token=' . $token
            ]
        ]
    ]);
    
    $response = file_get_contents($url, false, $context);
    
    if ($response === false) {
        echo "Failed to make API call\n";
        exit;
    }
    
    echo "Raw API Response:\n";
    echo $response . "\n\n";
    
    $data = json_decode($response, true);
    if ($data) {
        echo "Parsed Response:\n";
        echo json_encode($data, JSON_PRETTY_PRINT) . "\n\n";
        
        if (isset($data['user']['role'])) {
            echo "✓ Role found in response: " . $data['user']['role'] . "\n";
            
            if ($data['user']['role'] === 'admin') {
                echo "✓ User is correctly identified as admin\n";
            } else {
                echo "✗ User role is not admin: " . $data['user']['role'] . "\n";
            }
        } else {
            echo "✗ No role field in user data!\n";
            echo "Available user fields: " . implode(', ', array_keys($data['user'] ?? [])) . "\n";
        }
    } else {
        echo "Failed to parse JSON response\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>