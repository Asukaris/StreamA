<?php
// Disable error display and ensure only JSON output
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

require_once 'database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Set error handler to return JSON errors
set_error_handler(function($severity, $message, $file, $line) {
    error_log("PHP Error: $message in $file on line $line");
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
    exit;
});

// Set exception handler to return JSON errors
set_exception_handler(function($exception) {
    error_log("PHP Exception: " . $exception->getMessage() . " in " . $exception->getFile() . " on line " . $exception->getLine());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
    exit;
});

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$database = new Database();

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '';

// Get stream ID from PATH_INFO
$streamId = null;
if (preg_match('/^\/([0-9]+)$/', $path, $matches)) {
    $streamId = intval($matches[1]);
}

switch ($method) {
    case 'GET':
        if ($streamId) {
            getChatData($streamId);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Stream ID required']);
        }
        break;
        
    case 'POST':
        error_log('POST request to chat_data - Stream ID: ' . $streamId);
        try {
            $user = getCurrentUser($database);
            error_log('User retrieved: ' . json_encode($user));
            if (!isAdmin($user, $database)) {
                error_log('User is not admin');
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Admin access required']);
                exit;
            }
            error_log('User is admin, proceeding');
        } catch (Exception $e) {
            error_log('Exception in user auth: ' . $e->getMessage());
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            exit;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        error_log('Input data: ' . json_encode($input));
        if ($streamId) {
            saveChatData($streamId, $input);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Stream ID required']);
        }
        break;
        
    case 'DELETE':
        try {
            $user = getCurrentUser($database);
            if (!isAdmin($user, $database)) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Admin access required']);
                exit;
            }
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            exit;
        }
        
        if ($streamId) {
            deleteChatData($streamId);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Stream ID required']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}

function getChatData($streamId) {
    global $database;
    
    try {
        $stmt = $database->query(
            'SELECT json_content, created_at, updated_at FROM chat_data WHERE stream_id = ?',
            [$streamId]
        );
        
        $chatData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($chatData) {
            echo json_encode([
                'success' => true,
                'data' => [
                    'stream_id' => $streamId,
                    'chat_data' => json_decode($chatData['json_content'], true),
                    'created_at' => $chatData['created_at'],
                    'updated_at' => $chatData['updated_at']
                ]
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'No chat data found for this stream'
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

function saveChatData($streamId, $input) {
    global $database;
    
    if (!isset($input['chatData'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Chat data required']);
        return;
    }
    
    $chatData = is_string($input['chatData']) ? $input['chatData'] : json_encode($input['chatData']);
    
    try {
        // Check if chat data already exists for this stream
        $stmt = $database->query(
            'SELECT id FROM chat_data WHERE stream_id = ?',
            [$streamId]
        );
        
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Update existing record
            $database->query(
                'UPDATE chat_data SET json_content = ?, updated_at = CURRENT_TIMESTAMP WHERE stream_id = ?',
                [$chatData, $streamId]
            );
        } else {
            // Insert new record
            $database->query(
                'INSERT INTO chat_data (stream_id, json_content) VALUES (?, ?)',
                [$streamId, $chatData]
            );
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Chat data saved successfully'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

function deleteChatData($streamId) {
    global $database;
    
    try {
        $database->query(
            'DELETE FROM chat_data WHERE stream_id = ?',
            [$streamId]
        );
        
        echo json_encode([
            'success' => true,
            'message' => 'Chat data deleted successfully'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

function getCurrentUser($database) {
    $sessionToken = getSessionToken();
    
    if (!$sessionToken) {
        throw new Exception('No session token provided', 401);
    }
    
    $stmt = $database->query(
        'SELECT u.id, u.username, u.email, u.role 
         FROM users u 
         JOIN sessions s ON u.id = s.user_id 
         WHERE s.session_token = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = 1',
        [$sessionToken]
    );
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        throw new Exception('Invalid or expired session', 401);
    }
    
    return $user;
}

function getSessionToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (strpos($authHeader, 'Bearer ') === 0) {
        return substr($authHeader, 7);
    }
    
    return $_GET['token'] ?? $_POST['token'] ?? null;
}

function isAdmin($user, $database) {
    return isset($user['role']) && $user['role'] === 'admin';
}

// Execute the routing logic
// Functions are defined below, execution happens at the end of the file
?>