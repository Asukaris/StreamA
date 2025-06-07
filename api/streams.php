<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'database.php';
require_once 'thumbnail_handler.php';

class StreamsAPI {
    private $db;
    private $thumbnailHandler;
    
    public function __construct() {
        $this->db = new Database();
        $this->thumbnailHandler = new ThumbnailHandler();
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = $_SERVER['PATH_INFO'] ?? '';
        
        try {
            switch ($method) {
                case 'GET':
                    if ($path === '' || $path === '/') {
                        echo $this->getStreams();
                        return;
                    } elseif (preg_match('/^\/([0-9]+)$/', $path, $matches)) {
                        echo $this->getStream($matches[1]);
                        return;
                    } elseif ($path === '/favorites') {
                        echo $this->getFavorites();
                        return;
                    }
                    break;
                case 'POST':
                    if ($path === '' || $path === '/') {
                        echo $this->createStream();
                        return;
                    } elseif (preg_match('/^\/([0-9]+)\/favorite$/', $path, $matches)) {
                        echo $this->addFavorite($matches[1]);
                        return;
                    }
                    break;
                case 'PUT':
                    if (preg_match('/^\/([0-9]+)$/', $path, $matches)) {
                        echo $this->updateStream($matches[1]);
                        return;
                    }
                    break;
                case 'DELETE':
                    if (preg_match('/^\/([0-9]+)$/', $path, $matches)) {
                        echo $this->deleteStream($matches[1]);
                        return;
                    } elseif (preg_match('/^\/([0-9]+)\/favorite$/', $path, $matches)) {
                        echo $this->removeFavorite($matches[1]);
                        return;
                    }
                    break;
            }
            
            throw new Exception('Endpoint not found', 404);
        } catch (Exception $e) {
            echo $this->errorResponse($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    private function getStreams() {
        $category = $_GET['category'] ?? null;
        $search = $_GET['search'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 20), 100);
        $offset = max((int)($_GET['offset'] ?? 0), 0);
        
        $sql = 'SELECT * FROM streams WHERE 1=1';
        $params = [];
        
        if ($category) {
            $sql .= ' AND category = ?';
            $params[] = $category;
        }
        
        if ($search) {
            $sql .= ' AND (title LIKE ? OR description LIKE ?)';
            $searchTerm = '%' . $search . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $sql .= ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $this->db->query($sql, $params);
        $streams = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get total count
        $countSql = 'SELECT COUNT(*) as total FROM streams WHERE 1=1';
        $countParams = [];
        
        if ($category) {
            $countSql .= ' AND category = ?';
            $countParams[] = $category;
        }
        
        if ($search) {
            $countSql .= ' AND (title LIKE ? OR description LIKE ?)';
            $searchTerm = '%' . $search . '%';
            $countParams[] = $searchTerm;
            $countParams[] = $searchTerm;
        }
        
        $countStmt = $this->db->query($countSql, $countParams);
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        return $this->successResponse([
            'streams' => $streams,
            'pagination' => [
                'total' => (int)$total,
                'limit' => $limit,
                'offset' => $offset,
                'has_more' => ($offset + $limit) < $total
            ]
        ]);
    }
    
    private function getStream($id) {
        $stmt = $this->db->query(
            'SELECT * FROM streams WHERE id = ?',
            [$id]
        );
        
        $stream = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$stream) {
            throw new Exception('Stream not found', 404);
        }
        
        return $this->successResponse($stream);
    }
    
    private function createStream() {
        $user = $this->getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['title'])) {
            throw new Exception('Missing required fields', 400);
        }
        
        $title = trim($input['title']);
        $description = trim($input['description'] ?? '');
        $streamUrl = trim($input['stream_url'] ?? '');
        $category = trim($input['category'] ?? '');
        $game = trim($input['game'] ?? '');
        $tags = trim($input['tags'] ?? '');
        $duration = max((int)($input['duration'] ?? 0), 0);
        $isLive = (bool)($input['is_live'] ?? false);
        $viewerCount = max((int)($input['viewer_count'] ?? 0), 0);
        $chatData = $input['chatData'] ?? null;
        
        // Process thumbnail if provided
        $thumbnailUrl = '';
        if (!empty($input['thumbnail_url'])) {
            try {
                $thumbnailUrl = $this->thumbnailHandler->saveBase64Image($input['thumbnail_url']);
            } catch (Exception $e) {
                throw new Exception('Failed to save thumbnail: ' . $e->getMessage(), 400);
            }
        }
        
        if (empty($title)) {
            throw new Exception('Title cannot be empty', 400);
        }
        
        $stmt = $this->db->query(
            'INSERT INTO streams (title, description, stream_url, thumbnail_url, category, game, tags, duration, is_live, viewer_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$title, $description, $streamUrl, $thumbnailUrl, $category, $game, $tags, $duration, $isLive, $viewerCount]
        );
        
        $streamId = $this->db->lastInsertId();
        
        // Save chat data if provided
        if ($chatData) {
            $this->db->query(
                'INSERT INTO chat_data (stream_id, json_content) VALUES (?, ?)',
                [$streamId, $chatData]
            );
        }
        
        return $this->successResponse([
            'message' => 'Stream created successfully',
            'stream_id' => $streamId
        ]);
    }
    
    private function updateStream($id) {
        $user = $this->getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            throw new Exception('Invalid input', 400);
        }
        
        // Check if stream exists
        $stmt = $this->db->query('SELECT id FROM streams WHERE id = ?', [$id]);
        if (!$stmt->fetch()) {
            throw new Exception('Stream not found', 404);
        }
        
        $updates = [];
        $params = [];
        
        if (isset($input['title'])) {
            $title = trim($input['title']);
            if (empty($title)) {
                throw new Exception('Title cannot be empty', 400);
            }
            $updates[] = 'title = ?';
            $params[] = $title;
        }
        
        if (isset($input['description'])) {
            $updates[] = 'description = ?';
            $params[] = trim($input['description']);
        }
        
        if (isset($input['stream_url'])) {
            $updates[] = 'stream_url = ?';
            $params[] = trim($input['stream_url']);
        }
        
        if (isset($input['thumbnail_url'])) {
            // Get current thumbnail to delete it later
            $currentThumbnail = null;
            $stmt = $this->db->query('SELECT thumbnail_url FROM streams WHERE id = ?', [$id]);
            $stream = $stmt->fetch();
            if ($stream) {
                $currentThumbnail = $stream['thumbnail_url'];
            }
            
            try {
                $newThumbnailUrl = $this->thumbnailHandler->saveBase64Image($input['thumbnail_url']);
                $updates[] = 'thumbnail_url = ?';
                $params[] = $newThumbnailUrl;
                
                // Delete old thumbnail if it exists and is different
                if ($currentThumbnail && $currentThumbnail !== $newThumbnailUrl) {
                    $this->thumbnailHandler->deleteThumbnail($currentThumbnail);
                }
            } catch (Exception $e) {
                throw new Exception('Failed to save thumbnail: ' . $e->getMessage(), 400);
            }
        }
        
        if (isset($input['game'])) {
            $updates[] = 'game = ?';
            $params[] = trim($input['game']);
        }
        
        if (isset($input['tags'])) {
            $updates[] = 'tags = ?';
            $params[] = trim($input['tags']);
        }
        
        if (isset($input['duration'])) {
            $updates[] = 'duration = ?';
            $params[] = max((int)$input['duration'], 0);
        }
        
        if (isset($input['is_live'])) {
            $updates[] = 'is_live = ?';
            $params[] = (bool)$input['is_live'];
        }
        
        if (isset($input['viewer_count'])) {
            $updates[] = 'viewer_count = ?';
            $params[] = max((int)$input['viewer_count'], 0);
        }
        
        if (empty($updates)) {
            throw new Exception('No fields to update', 400);
        }
        
        $updates[] = 'updated_at = CURRENT_TIMESTAMP';
        $params[] = $id;
        
        $this->db->query(
            'UPDATE streams SET ' . implode(', ', $updates) . ' WHERE id = ?',
            $params
        );
        
        return $this->successResponse(['message' => 'Stream updated successfully']);
    }
    
    private function deleteStream($id) {
        $user = $this->getCurrentUser();
        
        // Get thumbnail URL before deleting the stream
        $stmt = $this->db->query('SELECT thumbnail_url FROM streams WHERE id = ?', [$id]);
        $stream = $stmt->fetch();
        
        // Delete the stream from database
        $stmt = $this->db->query('DELETE FROM streams WHERE id = ?', [$id]);
        
        // Delete thumbnail file if it exists
        if ($stream && !empty($stream['thumbnail_url'])) {
            $this->thumbnailHandler->deleteThumbnail($stream['thumbnail_url']);
        }
        
        return $this->successResponse(['message' => 'Stream deleted successfully']);
    }
    
    private function getFavorites() {
        $user = $this->getCurrentUser();
        
        $stmt = $this->db->query(
            'SELECT s.* FROM streams s 
             JOIN favorites f ON s.id = f.stream_id 
             WHERE f.user_id = ? 
             ORDER BY f.created_at DESC',
            [$user['id']]
        );
        
        $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return $this->successResponse($favorites);
    }
    
    private function addFavorite($streamId) {
        $user = $this->getCurrentUser();
        
        // Check if stream exists
        $stmt = $this->db->query('SELECT id FROM streams WHERE id = ?', [$streamId]);
        if (!$stmt->fetch()) {
            throw new Exception('Stream not found', 404);
        }
        
        try {
            $this->db->query(
                'INSERT INTO favorites (user_id, stream_id) VALUES (?, ?)',
                [$user['id'], $streamId]
            );
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'UNIQUE constraint failed') !== false) {
                throw new Exception('Stream already in favorites', 409);
            }
            throw $e;
        }
        
        return $this->successResponse(['message' => 'Stream added to favorites']);
    }
    
    private function removeFavorite($streamId) {
        $user = $this->getCurrentUser();
        
        $this->db->query(
            'DELETE FROM favorites WHERE user_id = ? AND stream_id = ?',
            [$user['id'], $streamId]
        );
        
        return $this->successResponse(['message' => 'Stream removed from favorites']);
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
$streamsAPI = new StreamsAPI();
$streamsAPI->handleRequest();
?>