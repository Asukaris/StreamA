<?php
require_once 'api/database.php';

try {
    $database = new Database('data/app.db');
    
    echo "Checking existing users...\n";
    $stmt = $database->query('SELECT username, email, role FROM users');
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($users)) {
        echo "No users found in database.\n";
        echo "Creating admin user...\n";
        
        // Create admin user
        $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $database->query(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            ['admin', 'admin@example.com', $hashedPassword, 'admin']
        );
        
        echo "Admin user created successfully!\n";
        echo "Username: admin\n";
        echo "Email: admin@example.com\n";
        echo "Password: admin123\n";
    } else {
        echo "Found " . count($users) . " users:\n";
        foreach ($users as $user) {
            echo "- {$user['username']} ({$user['email']}) - Role: {$user['role']}\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>