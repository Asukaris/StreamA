<?php
try {
    $db = new PDO('sqlite:api/data/app.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== Testing User Role Data ===\n";
    
    // Check user 3 (Asukaris) specifically
    $stmt = $db->prepare('SELECT id, username, email, role FROM users WHERE id = 3');
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "User 3 data:\n";
    echo json_encode($user, JSON_PRETTY_PRINT) . "\n\n";
    
    // Check all users to see roles
    echo "=== All Users ===\n";
    $stmt = $db->prepare('SELECT id, username, email, role FROM users ORDER BY id');
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($users as $user) {
        echo "ID: {$user['id']}, Username: {$user['username']}, Role: {$user['role']}\n";
    }
    
    echo "\n=== Testing API Response Format ===\n";
    
    // Simulate what the API should return
    $user3 = null;
    foreach ($users as $user) {
        if ($user['id'] == 3) {
            $user3 = $user;
            break;
        }
    }
    
    if ($user3) {
        $apiResponse = [
            'success' => true,
            'user' => [
                'id' => (int)$user3['id'],
                'username' => $user3['username'],
                'email' => $user3['email'],
                'role' => $user3['role'] ?? 'user'
            ]
        ];
        
        echo "Expected API response for user 3:\n";
        echo json_encode($apiResponse, JSON_PRETTY_PRINT) . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>