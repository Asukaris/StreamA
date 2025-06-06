<?php
/**
 * Simple script to automatically make the first user an admin
 * This script directly modifies the database without requiring admin privileges
 */

try {
    // Database path
    $dbPath = __DIR__ . '/api/data/app.db';
    
    if (!file_exists($dbPath)) {
        die("Database file not found at: $dbPath\n");
    }
    
    // Connect to SQLite database
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to database successfully.\n";
    
    // Check if role column exists
    $stmt = $pdo->query("PRAGMA table_info(users)");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $hasRoleColumn = false;
    foreach ($columns as $column) {
        if ($column['name'] === 'role') {
            $hasRoleColumn = true;
            break;
        }
    }
    
    // Add role column if it doesn't exist
    if (!$hasRoleColumn) {
        echo "Adding role column to users table...\n";
        $pdo->exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
        echo "Role column added successfully.\n";
    } else {
        echo "Role column already exists.\n";
    }
    
    // Get the first user (oldest by ID)
    $stmt = $pdo->query("SELECT id, username, email, role FROM users ORDER BY id ASC LIMIT 1");
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo "No users found in the database.\n";
        exit(1);
    }
    
    echo "Found user: ID: {$user['id']}, Username: {$user['username']}, Email: {$user['email']}, Current Role: " . ($user['role'] ?? 'user') . "\n";
    
    // Check if already admin
    if ($user['role'] === 'admin') {
        echo "User '{$user['username']}' is already an admin!\n";
        exit(0);
    }
    
    // Update user role to admin
    $stmt = $pdo->prepare("UPDATE users SET role = 'admin' WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    echo "\nUser '{$user['username']}' (ID: {$user['id']}) has been made an admin!\n";
    echo "You can now log in with admin privileges.\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>