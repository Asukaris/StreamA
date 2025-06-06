<?php
/**
 * Script to make the first user an admin
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
    
    // Get all users
    $stmt = $pdo->query("SELECT id, username, email, role FROM users ORDER BY id ASC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($users)) {
        echo "No users found in the database.\n";
        exit(1);
    }
    
    echo "Found " . count($users) . " user(s):\n";
    foreach ($users as $index => $user) {
        echo ($index + 1) . ". ID: {$user['id']}, Username: {$user['username']}, Email: {$user['email']}, Role: " . ($user['role'] ?? 'user') . "\n";
    }
    
    // Ask which user to make admin
    echo "\nWhich user should be made admin? Enter the number (1-" . count($users) . "): ";
    $handle = fopen("php://stdin", "r");
    $choice = trim(fgets($handle));
    fclose($handle);
    
    $choice = intval($choice);
    if ($choice < 1 || $choice > count($users)) {
        echo "Invalid choice. Exiting.\n";
        exit(1);
    }
    
    $selectedUser = $users[$choice - 1];
    
    // Update user role to admin
    $stmt = $pdo->prepare("UPDATE users SET role = 'admin' WHERE id = ?");
    $stmt->execute([$selectedUser['id']]);
    
    echo "\nUser '{$selectedUser['username']}' (ID: {$selectedUser['id']}) has been made an admin!\n";
    echo "You can now log in with admin privileges.\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>