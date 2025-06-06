<?php
// Database configuration and initialization
class Database {
    private $db;
    private $dbPath;
    
    public function __construct($dbPath = 'data/app.db') {
        $this->dbPath = $dbPath;
        $this->initDatabase();
    }
    
    private function initDatabase() {
        // Create data directory if it doesn't exist
        $dataDir = dirname($this->dbPath);
        if (!is_dir($dataDir)) {
            mkdir($dataDir, 0755, true);
        }
        
        try {
            $this->db = new PDO('sqlite:' . $this->dbPath);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->createTables();
        } catch (PDOException $e) {
            error_log('Database connection failed: ' . $e->getMessage());
            throw new Exception('Database initialization failed');
        }
    }
    
    private function createTables() {
        // Users table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        ");
        
        // Add role column to existing users table if it doesn't exist
        $this->addRoleColumnIfNotExists();
        
        // Sessions table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token VARCHAR(255) UNIQUE NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ");
        
        // Settings table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                setting_key VARCHAR(100) NOT NULL,
                setting_value TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ");
        
        // Streams table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS streams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title VARCHAR(255),
                description TEXT,
                stream_url VARCHAR(500),
                thumbnail_url VARCHAR(500),
                category VARCHAR(100),
                is_live BOOLEAN DEFAULT 0,
                viewer_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");
        
        // Favorites table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                stream_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE,
                UNIQUE(user_id, stream_id)
            )
        ");
        
        // Chat messages table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                username VARCHAR(50),
                message TEXT NOT NULL,
                stream_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE
            )
        ");
    }
    
    public function getConnection() {
        return $this->db;
    }
    
    public function query($sql, $params = []) {
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log('Database query failed: ' . $e->getMessage());
            throw new Exception('Database query failed');
        }
    }
    
    public function prepare($sql) {
        try {
            return $this->db->prepare($sql);
        } catch (PDOException $e) {
            error_log('Database prepare failed: ' . $e->getMessage());
            throw new Exception('Database prepare failed');
        }
    }
    
    public function lastInsertId() {
        return $this->db->lastInsertId();
    }
    
    private function addRoleColumnIfNotExists() {
        try {
            // Check if role column exists
            $result = $this->db->query("PRAGMA table_info(users)");
            $columns = $result->fetchAll(PDO::FETCH_ASSOC);
            
            $roleColumnExists = false;
            foreach ($columns as $column) {
                if ($column['name'] === 'role') {
                    $roleColumnExists = true;
                    break;
                }
            }
            
            // Add role column if it doesn't exist
            if (!$roleColumnExists) {
                $this->db->exec("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'");
                error_log('Added role column to users table');
            }
        } catch (PDOException $e) {
            error_log('Failed to add role column: ' . $e->getMessage());
            // Don't throw exception here to avoid breaking existing functionality
        }
    }
}

// Global database instance
$database = new Database();
?>