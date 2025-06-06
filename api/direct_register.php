<?php
// Direct registration endpoint that doesn't rely on .htaccess rewriting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/direct_register.log');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Only handle POST requests for registration
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }
    
    // Include required files
    require_once 'database.php';
    
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Invalid JSON input');
    }
    
    // Validate required fields
    if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
        throw new Exception('Missing required fields: username, email, password');
    }
    
    $username = trim($data['username']);
    $email = trim($data['email']);
    $password = $data['password'];
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Validate password length
    if (strlen($password) < 6) {
        throw new Exception('Password must be at least 6 characters long');
    }
    
    // Create database instance
    $database = new Database();
    
    // Check if user already exists
    $stmt = $database->prepare('SELECT id FROM users WHERE username = ? OR email = ?');
    $stmt->execute([$username, $email]);
    
    if ($stmt->fetch()) {
        throw new Exception('Username or email already exists');
    }
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert new user
    $stmt = $database->prepare('INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, ?)');
    $result = $stmt->execute([$username, $email, $hashedPassword, date('Y-m-d H:i:s')]);
    
    if (!$result) {
        throw new Exception('Failed to create user account');
    }
    
    // Success response
    echo json_encode([
        'success' => true,
        'message' => 'User registered successfully',
        'user_id' => $database->lastInsertId()
    ]);
    
} catch (Exception $e) {
    error_log('Direct Registration Error: ' . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'debug_info' => [
            'method' => $_SERVER['REQUEST_METHOD'],
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
            'input_received' => !empty($input),
            'json_valid' => json_last_error() === JSON_ERROR_NONE
        ]
    ]);
}
?>