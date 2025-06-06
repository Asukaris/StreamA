<?php
// Debug information - log all request details
error_log('=== REQUEST DEBUG ===');
error_log('REQUEST_METHOD: ' . ($_SERVER['REQUEST_METHOD'] ?? 'not set'));
error_log('REQUEST_URI: ' . ($_SERVER['REQUEST_URI'] ?? 'not set'));
error_log('PATH_INFO: ' . ($_SERVER['PATH_INFO'] ?? 'not set'));
error_log('QUERY_STRING: ' . ($_SERVER['QUERY_STRING'] ?? 'not set'));
error_log('GET params: ' . print_r($_GET, true));
error_log('POST params: ' . print_r($_POST, true));

// Simple test to check if PHP is working - check both GET and query string
if (isset($_GET['test']) || strpos($_SERVER['QUERY_STRING'] ?? '', 'test') !== false) {
    header('Content-Type: text/plain');
    echo 'PHP is working! Time: ' . date('Y-m-d H:i:s') . "\n";
    echo 'Request Method: ' . ($_SERVER['REQUEST_METHOD'] ?? 'unknown') . "\n";
    echo 'Query String: ' . ($_SERVER['QUERY_STRING'] ?? 'none') . "\n";
    echo 'Path Info: ' . ($_SERVER['PATH_INFO'] ?? 'none') . "\n";
    exit;
}

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// Also log errors to file in case display_errors is disabled by server
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'database.php';

class UserAPI {
    private $database;
    
    public function __construct($database) {
        $this->database = $database;
    }
    
    public function handleRequest() {
        try {
            $method = $_SERVER['REQUEST_METHOD'];
            $path = $_SERVER['PATH_INFO'] ?? '';
            
            // Fallback: if PATH_INFO is empty, try to extract from REQUEST_URI
            if (empty($path)) {
                $requestUri = $_SERVER['REQUEST_URI'] ?? '';
                // Extract path after /api/users
                if (preg_match('#/api/users(/.*?)(?:\?|$)#', $requestUri, $matches)) {
                    $path = $matches[1];
                } elseif (preg_match('#/users(/.*?)(?:\?|$)#', $requestUri, $matches)) {
                    $path = $matches[1];
                }
            }
            
            // Log the routing information for debugging
            error_log('UserAPI Routing - Method: ' . $method . ', PATH_INFO: ' . ($_SERVER['PATH_INFO'] ?? 'empty') . ', Extracted Path: ' . $path . ', REQUEST_URI: ' . ($_SERVER['REQUEST_URI'] ?? 'empty'));
            
            // Add debug endpoint
            if ($path === '/debug' && $method === 'GET') {
                return $this->debug();
            }
            
            switch ($method) {
                case 'POST':
                    if ($path === '/register') {
                        return $this->register();
                    } elseif ($path === '/login') {
                        return $this->login();
                    } elseif ($path === '/logout') {
                        return $this->logout();
                    }
                    break;
                case 'GET':
                    if ($path === '/profile') {
                        return $this->getProfile();
                    } elseif ($path === '/verify') {
                        return $this->verifySession();
                    } elseif ($path === '/list') {
                        return $this->listUsers();
                    } elseif ($path === '/register') {
                        return $this->errorResponse('Register endpoint requires POST method with JSON data: {"username": "...", "email": "...", "password": "..."}', 405);
                    }
                    break;
                case 'PUT':
                    if (preg_match('#^/([0-9]+)$#', $path, $matches)) {
                        return $this->updateUser($matches[1]);
                    } elseif ($path === '/profile') {
                        return $this->updateProfile();
                    }
                    break;
                case 'DELETE':
                    if (preg_match('#^/([0-9]+)$#', $path, $matches)) {
                        return $this->deleteUser($matches[1]);
                    }
                    break;
            }
            
            return $this->errorResponse('Endpoint not found', 404);
        } catch (Exception $e) {
            error_log('UserAPI Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine());
            $statusCode = $e->getCode() ?: 500;
            $message = $statusCode === 500 ? 'Internal server error: ' . $e->getMessage() : $e->getMessage();
            return $this->errorResponse($message, $statusCode);
        }
    }
    
    private function debug() {
        return $this->successResponse([
            'php_version' => phpversion(),
            'error_reporting' => error_reporting(),
            'display_errors' => ini_get('display_errors'),
            'log_errors' => ini_get('log_errors'),
            'error_log' => ini_get('error_log'),
            'database_connected' => $this->database ? 'yes' : 'no',
            'server_time' => date('Y-m-d H:i:s'),
            'request_method' => $_SERVER['REQUEST_METHOD'],
            'path_info' => $_SERVER['PATH_INFO'] ?? 'none'
        ]);
    }
    
    private function register() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['username'], $input['email'], $input['password'])) {
            throw new Exception('Missing required fields', 400);
        }
        
        $username = trim($input['username']);
        $email = trim($input['email']);
        $password = $input['password'];
        
        // Validation
        if (strlen($username) < 3 || strlen($username) > 50) {
            throw new Exception('Username must be between 3 and 50 characters', 400);
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email format', 400);
        }
        
        if (strlen($password) < 6) {
            throw new Exception('Password must be at least 6 characters', 400);
        }
        
        // Check if user already exists
        $stmt = $this->database->query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [$username, $email]
        );
        
        if ($stmt->fetch()) {
            throw new Exception('Username or email already exists', 409);
        }
        
        // Check if this is the first user (should be admin)
        $countStmt = $this->database->query('SELECT COUNT(*) as count FROM users');
        $userCount = $countStmt->fetch()['count'];
        $isFirstUser = ($userCount == 0);
        
        // Create user
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $role = $isFirstUser ? 'admin' : 'user';
        $stmt = $this->database->query(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [$username, $email, $passwordHash, $role]
        );
        
        $userId = $this->database->lastInsertId();
        
        $message = $isFirstUser ? 'First user registered successfully as admin' : 'User registered successfully';
        
        return $this->successResponse([
            'message' => $message,
            'user_id' => $userId,
            'role' => $role
        ]);
    }
    
    private function login() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['password'])) {
            throw new Exception('Missing login credentials', 400);
        }
        
        // Accept both 'login' and 'email' as login identifier
        $login = '';
        if (isset($input['login'])) {
            $login = trim($input['login']);
        } elseif (isset($input['email'])) {
            $login = trim($input['email']);
        } else {
            throw new Exception('Missing login credentials', 400);
        }
        $password = $input['password'];
        
        // Find user by username or email
        $stmt = $this->database->query(
            'SELECT id, username, email, password_hash FROM users WHERE (username = ? OR email = ?) AND is_active = 1',
            [$login, $login]
        );
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            throw new Exception('Invalid credentials', 401);
        }
        
        // Create session
        $sessionToken = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
        
        $this->database->query(
            'INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
            [$user['id'], $sessionToken, $expiresAt]
        );
        
        return $this->successResponse([
            'message' => 'Login successful',
            'session_token' => $sessionToken,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email']
            ]
        ]);
    }
    
    private function logout() {
        $sessionToken = $this->getSessionToken();
        
        if ($sessionToken) {
            $this->database->query(
                'DELETE FROM sessions WHERE session_token = ?',
                [$sessionToken]
            );
        }
        
        return $this->successResponse(['message' => 'Logout successful']);
    }
    
    private function getProfile() {
        $user = $this->getCurrentUser();
        
        return $this->successResponse([
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role'] ?? 'user',
                'created_at' => $user['created_at']
            ]
        ]);
    }
    
    private function verifySession() {
        try {
            $user = $this->getCurrentUser();
            return $this->successResponse([
                'valid' => true,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'role' => $user['role'] ?? 'user'
                ]
            ]);
        } catch (Exception $e) {
            return $this->successResponse(['valid' => false]);
        }
    }
    
    private function updateProfile() {
        $user = $this->getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            throw new Exception('Invalid input', 400);
        }
        
        $updates = [];
        $params = [];
        
        if (isset($input['username'])) {
            $username = trim($input['username']);
            if (strlen($username) < 3 || strlen($username) > 50) {
                throw new Exception('Username must be between 3 and 50 characters', 400);
            }
            $updates[] = 'username = ?';
            $params[] = $username;
        }
        
        if (isset($input['email'])) {
            $email = trim($input['email']);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Invalid email format', 400);
            }
            $updates[] = 'email = ?';
            $params[] = $email;
        }
        
        if (empty($updates)) {
            throw new Exception('No fields to update', 400);
        }
        
        $updates[] = 'updated_at = CURRENT_TIMESTAMP';
        $params[] = $user['id'];
        
        $this->database->query(
            'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?',
            $params
        );
        
        return $this->successResponse(['message' => 'Profile updated successfully']);
    }

    private function updateUser($userId) {
        $currentUser = $this->getCurrentUser();
        
        // Check if current user is admin
        if ($currentUser['role'] !== 'admin') {
            throw new Exception('Access denied. Admin privileges required.', 403);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            throw new Exception('Invalid input', 400);
        }
        
        // Check if target user exists
        $stmt = $this->database->query(
            'SELECT id, username, email, role FROM users WHERE id = ?',
            [$userId]
        );
        
        $targetUser = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$targetUser) {
            throw new Exception('User not found', 404);
        }
        
        $updates = [];
        $params = [];
        
        if (isset($input['username'])) {
            $username = trim($input['username']);
            if (strlen($username) < 3 || strlen($username) > 50) {
                throw new Exception('Username must be between 3 and 50 characters', 400);
            }
            
            // Check if username is already taken by another user
            $stmt = $this->database->query(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [$username, $userId]
            );
            if ($stmt->fetch()) {
                throw new Exception('Username already exists', 400);
            }
            
            $updates[] = 'username = ?';
            $params[] = $username;
        }
        
        if (isset($input['email'])) {
            $email = trim($input['email']);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Invalid email format', 400);
            }
            
            // Check if email is already taken by another user
            $stmt = $this->database->query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [$email, $userId]
            );
            if ($stmt->fetch()) {
                throw new Exception('Email already exists', 400);
            }
            
            $updates[] = 'email = ?';
            $params[] = $email;
        }
        
        if (isset($input['role'])) {
            $role = trim($input['role']);
            if (!in_array($role, ['user', 'admin'])) {
                throw new Exception('Invalid role. Must be "user" or "admin"', 400);
            }
            $updates[] = 'role = ?';
            $params[] = $role;
        }
        
        if (isset($input['is_active'])) {
            $isActive = (bool)$input['is_active'];
            $updates[] = 'is_active = ?';
            $params[] = $isActive ? 1 : 0;
        }
        
        if (empty($updates)) {
            throw new Exception('No fields to update', 400);
        }
        
        $updates[] = 'updated_at = CURRENT_TIMESTAMP';
        $params[] = $userId;
        
        $this->database->query(
            'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?',
            $params
        );
        
        return $this->successResponse(['message' => 'User updated successfully']);
    }
    
    private function deleteUser($userId) {
        $currentUser = $this->getCurrentUser();
        
        // Check if current user is admin
        if ($currentUser['role'] !== 'admin') {
            throw new Exception('Access denied. Admin privileges required.', 403);
        }
        
        // Prevent self-deletion
        if ($currentUser['id'] == $userId) {
            throw new Exception('Cannot delete your own account', 400);
        }
        
        // Check if target user exists
        $stmt = $this->database->query(
            'SELECT id, username FROM users WHERE id = ?',
            [$userId]
        );
        
        $targetUser = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$targetUser) {
            throw new Exception('User not found', 404);
        }
        
        // Delete user (this will cascade delete sessions due to foreign key constraints)
        $this->database->query('DELETE FROM users WHERE id = ?', [$userId]);
        
        return $this->successResponse([
            'message' => 'User deleted successfully',
            'deleted_user' => $targetUser['username']
        ]);
    }

    private function listUsers() {
        $currentUser = $this->getCurrentUser();
        
        // Check if current user is admin
        if ($currentUser['role'] !== 'admin') {
            throw new Exception('Access denied. Admin privileges required.', 403);
        }
        
        // Get all users with basic information
        $stmt = $this->database->query(
            'SELECT id, username, email, role, created_at, is_active FROM users ORDER BY created_at DESC'
        );
        
        $users = [];
        while ($user = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $users[] = [
                'id' => (int)$user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role'] ?? 'user',
                'registered' => $user['created_at'],
                'active' => (bool)$user['is_active'],
                'avatar' => 'https://via.placeholder.com/40x40/007bff/ffffff?text=' . strtoupper(substr($user['username'], 0, 1))
            ];
        }
        
        return $this->successResponse($users);
    }
    
    private function getCurrentUser() {
        $sessionToken = $this->getSessionToken();
        
        if (!$sessionToken) {
            throw new Exception('No session token provided', 401);
        }
        
        $stmt = $this->database->query(
            'SELECT u.id, u.username, u.email, u.role, u.created_at 
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
    
    private function getSessionToken() {
        // Check Authorization header first
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (strpos($authHeader, 'Bearer ') === 0) {
            return substr($authHeader, 7);
        }
        
        // Check cookies for session token
        if (isset($_COOKIE['streamapp_session_token'])) {
            return $_COOKIE['streamapp_session_token'];
        }
        
        return $_GET['token'] ?? $_POST['token'] ?? null;
    }
    
    private function successResponse($data) {
        return json_encode(['success' => true, 'data' => $data]);
    }
    
    private function errorResponse($message, $code = 500) {
        http_response_code($code);
        return json_encode(['success' => false, 'error' => $message]);
    }
}

// Handle the request with enhanced error handling
try {
    // Check if we can write to current directory
    if (!is_writable(__DIR__)) {
        throw new Exception('API directory is not writable. Please check file permissions.');
    }
    
    // Check if PDO SQLite extension is loaded
    if (!extension_loaded('pdo_sqlite')) {
        throw new Exception('PDO SQLite extension is not loaded. Please contact your hosting provider.');
    }
    
    $database = new Database();
    $userAPI = new UserAPI($database);
    echo $userAPI->handleRequest();
    
} catch (Exception $e) {
    // Log the error
    error_log('Critical API Error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    
    // Return a proper JSON error response
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Server configuration error: ' . $e->getMessage(),
        'debug_info' => [
            'php_version' => phpversion(),
            'pdo_sqlite' => extension_loaded('pdo_sqlite'),
            'directory_writable' => is_writable(__DIR__),
            'server_check_url' => 'Run server_check.php to diagnose issues'
        ]
    ]);
}
?>