<?php
try {
    $db = new PDO('sqlite:api/data/app.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== Database Schema ===\n";
    
    // Check sessions table
    echo "Sessions table schema:\n";
    $result = $db->query('PRAGMA table_info(sessions)');
    while($row = $result->fetch(PDO::FETCH_ASSOC)) {
        echo "Column: {$row['name']}, Type: {$row['type']}, NotNull: {$row['notnull']}, Default: {$row['dflt_value']}\n";
    }
    
    echo "\nUsers table schema:\n";
    $result = $db->query('PRAGMA table_info(users)');
    while($row = $result->fetch(PDO::FETCH_ASSOC)) {
        echo "Column: {$row['name']}, Type: {$row['type']}, NotNull: {$row['notnull']}, Default: {$row['dflt_value']}\n";
    }
    
    echo "\n=== Current Sessions ===\n";
    $result = $db->query('SELECT * FROM sessions LIMIT 5');
    while($row = $result->fetch(PDO::FETCH_ASSOC)) {
        echo json_encode($row) . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>