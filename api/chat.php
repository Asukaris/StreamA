<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'database.php';

class ChatAPI {
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
                    if ($path === '' || $path === '/') {
                        return $this->getMessages();
                    } elseif (preg_match('/^\/stream\/([0-9]+)$/', $path, $matches)) {
                        return $this->getStreamMessages($matches[1]);
                    }
                    break;
                case 'POST':
                    if ($path === '' || $path === '/') {
                        return $this->sendMessage();
                    }
                    break;
                case 'DELETE':
                    if (preg_match('/^\/([0-9]+)$/', $path, $matches)) {
                        return $this->deleteMessage($matches[1]);
                    }
                    break;
            }
            
            throw new Exception('Endpoint not found', 404);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    private function getMessages() {
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = max((int)($_GET['offset'] ?? 0), 0);
        $streamId = $_GET['stream_id'] ?? null;
        
        $sql = 'SELECT cm.*, u.username 
                FROM chat_messages cm 
                LEFT JOIN users u ON cm.user_id = u.id 
                WHERE 1=1';
        $params = [];
        
        if ($streamId) {
            $sql .= ' AND cm.stream_id = ?';
            $params[] = $streamId;
        }
        
        $sql .= ' ORDER BY cm.created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $this->db->query($sql, $params);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format messages
        foreach ($messages as &$message) {
            $message['username'] = $message['username'] ?? 'Anonymous';
            $message['created_at'] = date('c', strtotime($message['created_at']));
        }
        
        return $this->successResponse($messages);
    }
    
    private function getStreamMessages($streamId) {
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = max((int)($_GET['offset'] ?? 0), 0);
        
        $stmt = $this->db->query(
            'SELECT cm.*, u.username 
             FROM chat_messages cm 
             LEFT JOIN users u ON cm.user_id = u.id 
             WHERE cm.stream_id = ? 
             ORDER BY cm.created_at DESC 
             LIMIT ? OFFSET ?',
            [$streamId, $limit, $offset]
        );
        
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format messages
        foreach ($messages as &$message) {
            $message['username'] = $message['username'] ?? 'Anonymous';
            $message['created_at'] = date('c', strtotime($message['created_at']));
        }
        
        return $this->successResponse($messages);
    }
    
    private function sendMessage() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['message'])) {
            throw new Exception('Missing required fields', 400);
        }
        
        $message = trim($input['message']);
        $streamId = $input['stream_id'] ?? null;
        $username = trim($input['username'] ?? '');
        
        if (empty($message)) {
            throw new Exception('Message cannot be empty', 400);
        }
        
        if (strlen($message) > 500) {
            throw new Exception('Message too long (max 500 characters)', 400);
        }
        
        // Try to get current user, but allow anonymous messages
        $user = null;
        try {
            $user = $this->getCurrentUser();
        } catch (Exception $e) {
            // Allow anonymous messages
        }
        
        $userId = $user ? $user['id'] : null;
        
        // If no user and no username provided, use Anonymous
        if (!$user && empty($username)) {
            $username = 'Anonymous';
        } elseif ($user) {
            $username = $user['username'];
        }
        
        // Validate stream exists if stream_id provided
        if ($streamId) {
            $stmt = $this->db->query('SELECT id FROM streams WHERE id = ?', [$streamId]);
            if (!$stmt->fetch()) {
                throw new Exception('Stream not found', 404);
            }
        }
        
        $stmt = $this->db->query(
            'INSERT INTO chat_messages (user_id, stream_id, username, message) VALUES (?, ?, ?, ?)',
            [$userId, $streamId, $username, $message]
        );
        
        $messageId = $this->db->lastInsertId();
        
        // Get the created message
        $stmt = $this->db->query(
            'SELECT cm.*, u.username as user_username 
             FROM chat_messages cm 
             LEFT JOIN users u ON cm.user_id = u.id 
             WHERE cm.id = ?',
            [$messageId]
        );
        
        $createdMessage = $stmt->fetch(PDO::FETCH_ASSOC);
        $createdMessage['username'] = $createdMessage['user_username'] ?? $createdMessage['username'];
        unset($createdMessage['user_username']);
        $createdMessage['created_at'] = date('c', strtotime($createdMessage['created_at']));
        
        return $this->successResponse([
            'message' => 'Message sent successfully',
            'chat_message' => $createdMessage
        ]);
    }
    
    private function deleteMessage($id) {
        $user = $this->getCurrentUser();
        
        // Check if message exists and user owns it
        $stmt = $this->db->query(
            'SELECT user_id FROM chat_messages WHERE id = ?',
            [$id]
        );
        
        $message = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$message) {
            throw new Exception('Message not found', 404);
        }
        
        if ($message['user_id'] !== $user['id']) {
            throw new Exception('You can only delete your own messages', 403);
        }
        
        $this->db->query('DELETE FROM chat_messages WHERE id = ?', [$id]);
        
        return $this->successResponse(['message' => 'Message deleted successfully']);
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
    
    private function successResponse($data) {
        return json_encode(['success' => true, 'data' => $data]);
    }
    
    private function errorResponse($message, $code = 500) {
        http_response_code($code);
        return json_encode(['success' => false, 'error' => $message]);
    }
}

// Handle the request
$chatAPI = new ChatAPI($database);
echo $chatAPI->handleRequest();
?>