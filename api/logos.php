<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'database.php';

class LogosAPI {
    private $database;
    
    public function __construct($database) {
        $this->database = $database;
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = $_SERVER['PATH_INFO'] ?? '';
        
        try {
            switch ($method) {
                case 'GET':
                    if ($path === '' || $path === '/') {
                        return $this->getLogos();
                    } elseif (preg_match('/^\/([0-9]+)$/', $path, $matches)) {
                        return $this->getLogo($matches[1]);
                    }
                    break;
                case 'POST':
                    if ($path === '' || $path === '/') {
                        return $this->createLogo();
                    } elseif ($path === '/init-defaults') {
                        return $this->initDefaultLogos();
                    }
                    break;
                case 'PUT':
                    if (preg_match('/^\/([0-9]+)$/', $path, $matches)) {
                        return $this->updateLogo($matches[1]);
                    }
                    break;
                case 'DELETE':
                    if (preg_match('/^\/([0-9]+)$/', $path, $matches)) {
                        return $this->deleteLogo($matches[1]);
                    }
                    break;
            }
            
            throw new Exception('Endpoint not found', 404);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    private function getLogos() {
        $stmt = $this->database->query('SELECT * FROM game_logos ORDER BY game_name');
        $logos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse aliases from JSON string
        foreach ($logos as &$logo) {
            $logo['aliases'] = json_decode($logo['aliases'] ?: '[]', true);
        }
        
        return $this->successResponse($logos);
    }
    
    private function getLogo($id) {
        $stmt = $this->database->query('SELECT * FROM game_logos WHERE id = ?', [$id]);
        $logo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$logo) {
            throw new Exception('Logo not found', 404);
        }
        
        $logo['aliases'] = json_decode($logo['aliases'] ?: '[]', true);
        
        return $this->successResponse($logo);
    }
    
    private function createLogo() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['gameName']) || !isset($input['logoUrl'])) {
            throw new Exception('Game name and logo URL are required', 400);
        }
        
        $aliases = json_encode($input['aliases'] ?? []);
        
        $stmt = $this->database->query(
            'INSERT INTO game_logos (game_name, logo_url, aliases) VALUES (?, ?, ?)',
            [$input['gameName'], $input['logoUrl'], $aliases]
        );
        
        $logoId = $this->database->lastInsertId();
        
        return $this->successResponse([
            'id' => $logoId,
            'gameName' => $input['gameName'],
            'logoUrl' => $input['logoUrl'],
            'aliases' => $input['aliases'] ?? []
        ]);
    }
    
    private function updateLogo($id) {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $updates = [];
        $params = [];
        
        if (isset($input['gameName'])) {
            $updates[] = 'game_name = ?';
            $params[] = $input['gameName'];
        }
        
        if (isset($input['logoUrl'])) {
            $updates[] = 'logo_url = ?';
            $params[] = $input['logoUrl'];
        }
        
        if (isset($input['aliases'])) {
            $updates[] = 'aliases = ?';
            $params[] = json_encode($input['aliases']);
        }
        
        if (empty($updates)) {
            throw new Exception('No fields to update', 400);
        }
        
        $updates[] = 'updated_at = CURRENT_TIMESTAMP';
        $params[] = $id;
        
        $this->database->query(
            'UPDATE game_logos SET ' . implode(', ', $updates) . ' WHERE id = ?',
            $params
        );
        
        return $this->successResponse(['message' => 'Logo updated successfully']);
    }
    
    private function deleteLogo($id) {
        $stmt = $this->database->query('DELETE FROM game_logos WHERE id = ?', [$id]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception('Logo not found', 404);
        }
        
        return $this->successResponse(['message' => 'Logo deleted successfully']);
    }
    
    private function initDefaultLogos() {
        // Check if logos already exist
        $stmt = $this->database->query('SELECT COUNT(*) as count FROM game_logos');
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($count > 0) {
            return $this->successResponse(['message' => 'Default logos already initialized']);
        }
        
        $defaultLogos = [
            [
                'gameName' => 'Minecraft',
                'logoUrl' => 'https://www.minecraft.net/etc.clientlibs/minecraft/clientlibs/main/resources/favicon-96x96.png',
                'aliases' => ['MC', 'Minecraft Java', 'Minecraft Bedrock']
            ],
            [
                'gameName' => 'Fortnite',
                'logoUrl' => 'https://cdn2.unrealengine.com/Fortnite%2Ffn-game-icon-285x285-285x285-0b364143e0c9.png',
                'aliases' => ['Fortnite Battle Royale']
            ],
            [
                'gameName' => 'Valorant',
                'logoUrl' => 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt5c6a35b51b0e8c7e/5eb26f5e31bb7e28d2444b7e/V_LOGOMARK_1920x1080_Red.png',
                'aliases' => ['Valorant Riot']
            ],
            [
                'gameName' => 'League of Legends',
                'logoUrl' => 'https://universe-meeps.leagueoflegends.com/v1/assets/images/factions/demacia-crest.png',
                'aliases' => ['LoL', 'League']
            ],
            [
                'gameName' => 'World of Warcraft',
                'logoUrl' => 'https://bnetcmsus-a.akamaihd.net/cms/gallery/LKXYBFP8ZZ6D1509472919930.png',
                'aliases' => ['WoW', 'World of Warcraft Classic']
            ],
            [
                'gameName' => 'Overwatch',
                'logoUrl' => 'https://d15f34w2p8l1cc.cloudfront.net/overwatch/images/logos/overwatch-share-icon.jpg',
                'aliases' => ['Overwatch 2', 'OW', 'OW2']
            ],
            [
                'gameName' => 'Counter-Strike',
                'logoUrl' => 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg',
                'aliases' => ['CS', 'CS:GO', 'Counter-Strike 2', 'CS2']
            ],
            [
                'gameName' => 'Dota 2',
                'logoUrl' => 'https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg',
                'aliases' => ['Dota']
            ],
            [
                'gameName' => 'Apex Legends',
                'logoUrl' => 'https://media.contentapi.ea.com/content/dam/apex-legends/images/2019/01/apex-legends-meta-image.jpg',
                'aliases' => ['Apex']
            ]
        ];
        
        foreach ($defaultLogos as $logo) {
            $this->database->query(
                'INSERT INTO game_logos (game_name, logo_url, aliases) VALUES (?, ?, ?)',
                [$logo['gameName'], $logo['logoUrl'], json_encode($logo['aliases'])]
            );
        }
        
        return $this->successResponse(['message' => 'Default logos initialized successfully']);
    }
    
    private function successResponse($data) {
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
    }
    
    private function errorResponse($message, $code = 500) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
    }
}

try {
    $database = new Database();
    $api = new LogosAPI($database);
    $api->handleRequest();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error: ' . $e->getMessage()
    ]);
}
?>