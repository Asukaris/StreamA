<?php
try {
    $pdo = new PDO('sqlite:api/data/app.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check if streams table exists
    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='streams'");
    $tableExists = $stmt->fetch();
    
    if (!$tableExists) {
        echo "Streams table does not exist!\n";
        exit;
    }
    
    // Count total streams
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM streams');
    $result = $stmt->fetch();
    echo "Total streams in database: " . $result['count'] . "\n";
    
    if ($result['count'] > 0) {
        echo "\nFirst 5 streams:\n";
        $stmt = $pdo->query('SELECT id, title, created_at FROM streams LIMIT 5');
        while ($row = $stmt->fetch()) {
            echo "ID: " . $row['id'] . ", Title: " . $row['title'] . ", Created: " . $row['created_at'] . "\n";
        }
    } else {
        echo "No streams found in database.\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>