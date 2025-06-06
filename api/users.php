<?php
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
                    }
                    break;
            }
            
            return $this->errorResponse('Endpoint not found', 404);
        } catch (Exception $e) {
            error_log('UserAPI Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine());
            return $this->errorResponse('Internal server error: ' . $e->getMessage(), 500);
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
        
        // Create user
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->database->query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [$username, $email, $passwordHash]
        );
        
        $userId = $this->database->lastInsertId();
        
        return $this->successResponse([
            'message' => 'User registered successfully',
            'user_id' => $userId
        ]);
    }
    
    private function login() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['login'], $input['password'])) {
            throw new Exception('Missing login credentials', 400);
        }
        
        $login = trim($input['login']); // Can be username or email
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
                    'email' => $user['email']
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
    
    private function getCurrentUser() {
        $sessionToken = $this->getSessionToken();
        
        if (!$sessionToken) {
            throw new Exception('No session token provided', 401);
        }
        
        $stmt = $this->database->query(
            'SELECT u.id, u.username, u.email, u.created_at 
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
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (strpos($authHeader, 'Bearer ') === 0) {
            return substr($authHeader, 7);
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

// Handle the request
$database = new Database();
$userAPI = new UserAPI($database);
echo $userAPI->handleRequest();
?>