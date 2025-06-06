<?php
echo "=== Debug API Response ===\n";

try {
    // First, let's check if we can connect to the database
    $db = new PDO('sqlite:api/data/app.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get user 3 data directly
    $stmt = $db->prepare('SELECT id, username, email, role FROM users WHERE id = 3');
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "Direct database query for user 3:\n";
    echo json_encode($user, JSON_PRETTY_PRINT) . "\n\n";
    
    // Now let's manually test what the getProfile function should return
    if ($user) {
        $profileResponse = [
            'success' => true,
            'user' => [
                'id' => (int)$user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role'] ?? 'user'
            ]
        ];
        
        echo "Expected getProfile response:\n";
        echo json_encode($profileResponse, JSON_PRETTY_PRINT) . "\n\n";
        
        // Test the isAdmin logic
        $isAdmin = ($user['role'] === 'admin');
        echo "isAdmin() should return: " . ($isAdmin ? 'true' : 'false') . "\n";
        echo "Role value: '" . $user['role'] . "'\n";
        echo "Role === 'admin': " . ($user['role'] === 'admin' ? 'true' : 'false') . "\n";
    }
    
    // Check if there are any sessions for this user
    echo "\n=== Session Check ===\n";
    $stmt = $db->prepare('SELECT COUNT(*) as count FROM sessions WHERE user_id = 3 AND expires_at > datetime("now")');
    $stmt->execute();
    $sessionCount = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Active sessions for user 3: " . $sessionCount['count'] . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}
?>