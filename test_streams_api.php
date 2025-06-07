<?php
header('Content-Type: text/html; charset=utf-8');

echo "<h2>Testing Streams API</h2>";

// Test direct database access
echo "<h3>1. Direct Database Test</h3>";
try {
    $pdo = new PDO('sqlite:api/data/app.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM streams');
    $result = $stmt->fetch();
    echo "Total streams in database: " . $result['count'] . "<br>";
    
    if ($result['count'] > 0) {
        $stmt = $pdo->query('SELECT id, title, created_at FROM streams LIMIT 3');
        echo "<ul>";
        while ($row = $stmt->fetch()) {
            echo "<li>ID: " . $row['id'] . ", Title: " . htmlspecialchars($row['title']) . ", Created: " . $row['created_at'] . "</li>";
        }
        echo "</ul>";
    }
} catch (Exception $e) {
    echo "Database Error: " . $e->getMessage() . "<br>";
}

// Test API endpoint
echo "<h3>2. API Endpoint Test</h3>";
$apiUrl = 'http://localhost/api/streams';

echo "Testing URL: " . $apiUrl . "<br>";

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'Content-Type: application/json'
    ]
]);

$response = file_get_contents($apiUrl, false, $context);

if ($response === false) {
    echo "Failed to fetch from API<br>";
} else {
    echo "API Response:<br>";
    echo "<pre>" . htmlspecialchars($response) . "</pre>";
    
    $data = json_decode($response, true);
    if ($data) {
        echo "<br>Parsed JSON:<br>";
        echo "Success: " . ($data['success'] ? 'true' : 'false') . "<br>";
        if (isset($data['data']['streams'])) {
            echo "Streams count: " . count($data['data']['streams']) . "<br>";
        }
    }
}
?>