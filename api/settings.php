<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'database.php';

class SettingsAPI {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = $_SERVER['PATH_INFO'] ?? '';
        
        try {
            switch ($method) {
                case 'GET':
                    if ($path === '/all') {
                        return $this->getAllSettings();
                    } elseif (preg_match('/^\/([^/]+)$/', $path, $matches)) {
                        return $this->getSetting($matches[1]);
                    }
                    break;
                case 'POST':
                case 'PUT':
                    return $this->setSetting();
                case 'DELETE':
                    if (preg_match('/^\/([^/]+)$/', $path, $matches)) {
                        return $this->deleteSetting($matches[1]);
                    }
                    break;
            }
            
            throw new Exception('Endpoint not found', 404);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    private function getAllSettings() {
        $user = $this->getCurrentUser();
        
        $stmt = $this->db->query(
            'SELECT setting_key, setting_value FROM settings WHERE user_id = ? OR user_id IS NULL ORDER BY setting_key',
            [$user['id']]
        );
        
        $settings = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $settings[$row['setting_key']] = $this->parseValue($row['setting_value']);
        }
        
        return $this->successResponse($settings);
    }
    
    private function getSetting($key) {
        $user = $this->getCurrentUser();
        
        $stmt = $this->db->query(
            'SELECT setting_value FROM settings WHERE setting_key = ? AND (user_id = ? OR user_id IS NULL) ORDER BY user_id DESC LIMIT 1',
            [$key, $user['id']]
        );
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$row) {
            return $this->successResponse(null);
        }
        
        return $this->successResponse($this->parseValue($row['setting_value']));
    }
    
    private function setSetting() {
        $user = $this->getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['key'])) {
            throw new Exception('Missing setting key', 400);
        }
        
        $key = trim($input['key']);
        $value = $input['value'] ?? null;
        
        if (empty($key)) {
            throw new Exception('Setting key cannot be empty', 400);
        }
        
        // Check if setting exists for this user
        $stmt = $this->db->query(
            'SELECT id FROM settings WHERE setting_key = ? AND user_id = ?',
            [$key, $user['id']]
        );
        
        $existing = $stmt->fetch();
        
        $valueString = $this->serializeValue($value);
        
        if ($existing) {
            // Update existing setting
            $this->db->query(
                'UPDATE settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ? AND user_id = ?',
                [$valueString, $key, $user['id']]
            );
        } else {
            // Create new setting
            $this->db->query(
                'INSERT INTO settings (user_id, setting_key, setting_value) VALUES (?, ?, ?)',
                [$user['id'], $key, $valueString]
            );
        }
        
        return $this->successResponse([
            'message' => 'Setting saved successfully',
            'key' => $key,
            'value' => $value
        ]);
    }
    
    private function deleteSetting($key) {
        $user = $this->getCurrentUser();
        
        $stmt = $this->db->query(
            'DELETE FROM settings WHERE setting_key = ? AND user_id = ?',
            [$key, $user['id']]
        );
        
        return $this->successResponse([
            'message' => 'Setting deleted successfully',
            'key' => $key
        ]);
    }
    
    private function getCurrentUser() {
        $sessionToken = $this->getSessionToken();
        
        if (!$sessionToken) {
            throw new Exception('No session token provided', 401);
        }
        
        $stmt = $this->db->query(
            'SELECT u.id, u.username, u.email 
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
    
    private function parseValue($value) {
        if ($value === null) {
            return null;
        }
        
        // Try to decode as JSON first
        $decoded = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }
        
        // Return as string if not valid JSON
        return $value;
    }
    
    private function serializeValue($value) {
        if ($value === null) {
            return null;
        }
        
        if (is_string($value)) {
            return $value;
        }
        
        return json_encode($value);
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
$settingsAPI = new SettingsAPI($database);
echo $settingsAPI->handleRequest();
?>