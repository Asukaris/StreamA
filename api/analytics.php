<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'database.php';

class AnalyticsAPI {
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
                        return $this->getAllMetrics();
                    } elseif (preg_match('/^\/([^/]+)$/', $path, $matches)) {
                        return $this->getMetric($matches[1]);
                    } elseif ($path === '/dashboard') {
                        return $this->getDashboardData();
                    }
                    break;
                case 'POST':
                    if ($path === '' || $path === '/') {
                        return $this->recordMetric();
                    } elseif ($path === '/batch') {
                        return $this->recordBatchMetrics();
                    }
                    break;
                case 'PUT':
                    if (preg_match('/^\/([^/]+)$/', $path, $matches)) {
                        return $this->updateMetric($matches[1]);
                    }
                    break;
                case 'DELETE':
                    if (preg_match('/^\/([^/]+)$/', $path, $matches)) {
                        return $this->deleteMetric($matches[1]);
                    } elseif ($path === '/all') {
                        return $this->clearAllMetrics();
                    }
                    break;
            }
            
            throw new Exception('Endpoint not found', 404);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    private function getAllMetrics() {
        $stmt = $this->database->query(
            'SELECT * FROM analytics_data ORDER BY date_recorded DESC, metric_name'
        );
        $metrics = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse JSON values
        foreach ($metrics as &$metric) {
            $decoded = json_decode($metric['metric_value'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $metric['metric_value'] = $decoded;
            }
        }
        
        return $this->successResponse($metrics);
    }
    
    private function getMetric($metricName) {
        $stmt = $this->database->query(
            'SELECT * FROM analytics_data WHERE metric_name = ? ORDER BY date_recorded DESC LIMIT 1',
            [$metricName]
        );
        $metric = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$metric) {
            throw new Exception('Metric not found', 404);
        }
        
        $decoded = json_decode($metric['metric_value'], true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $metric['metric_value'] = $decoded;
        }
        
        return $this->successResponse($metric);
    }
    
    private function getDashboardData() {
        // Get latest metrics for dashboard
        $metrics = [];
        
        // Get total streams
        $stmt = $this->database->query('SELECT COUNT(*) as count FROM streams');
        $metrics['totalStreams'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Get total users
        $stmt = $this->database->query('SELECT COUNT(*) as count FROM users');
        $metrics['totalUsers'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Get total favorites
        $stmt = $this->database->query('SELECT COUNT(*) as count FROM favorites');
        $metrics['totalFavorites'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Get streams by category
        $stmt = $this->database->query(
            'SELECT category, COUNT(*) as count FROM streams GROUP BY category ORDER BY count DESC'
        );
        $metrics['streamsByCategory'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get recent activity (last 30 days)
        $stmt = $this->database->query(
            'SELECT DATE(created_at) as date, COUNT(*) as count FROM streams WHERE created_at >= date(\'now\', \'-30 days\') GROUP BY DATE(created_at) ORDER BY date'
        );
        $metrics['recentActivity'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return $this->successResponse($metrics);
    }
    
    private function recordMetric() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['metric_name']) || !isset($input['metric_value'])) {
            throw new Exception('Metric name and value are required', 400);
        }
        
        $metricValue = is_array($input['metric_value']) || is_object($input['metric_value']) 
            ? json_encode($input['metric_value']) 
            : $input['metric_value'];
        
        $dateRecorded = $input['date_recorded'] ?? date('Y-m-d');
        
        // Use INSERT OR REPLACE to handle duplicates
        $stmt = $this->database->query(
            'INSERT OR REPLACE INTO analytics_data (metric_name, metric_value, date_recorded) VALUES (?, ?, ?)',
            [$input['metric_name'], $metricValue, $dateRecorded]
        );
        
        return $this->successResponse([
            'message' => 'Metric recorded successfully',
            'metric_name' => $input['metric_name'],
            'date_recorded' => $dateRecorded
        ]);
    }
    
    private function recordBatchMetrics() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['metrics']) || !is_array($input['metrics'])) {
            throw new Exception('Metrics array is required', 400);
        }
        
        $recorded = 0;
        foreach ($input['metrics'] as $metric) {
            if (!isset($metric['metric_name']) || !isset($metric['metric_value'])) {
                continue;
            }
            
            $metricValue = is_array($metric['metric_value']) || is_object($metric['metric_value']) 
                ? json_encode($metric['metric_value']) 
                : $metric['metric_value'];
            
            $dateRecorded = $metric['date_recorded'] ?? date('Y-m-d');
            
            $this->database->query(
                'INSERT OR REPLACE INTO analytics_data (metric_name, metric_value, date_recorded) VALUES (?, ?, ?)',
                [$metric['metric_name'], $metricValue, $dateRecorded]
            );
            
            $recorded++;
        }
        
        return $this->successResponse([
            'message' => "$recorded metrics recorded successfully"
        ]);
    }
    
    private function updateMetric($metricName) {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['metric_value'])) {
            throw new Exception('Metric value is required', 400);
        }
        
        $metricValue = is_array($input['metric_value']) || is_object($input['metric_value']) 
            ? json_encode($input['metric_value']) 
            : $input['metric_value'];
        
        $dateRecorded = $input['date_recorded'] ?? date('Y-m-d');
        
        $stmt = $this->database->query(
            'UPDATE analytics_data SET metric_value = ? WHERE metric_name = ? AND date_recorded = ?',
            [$metricValue, $metricName, $dateRecorded]
        );
        
        if ($stmt->rowCount() === 0) {
            throw new Exception('Metric not found for the specified date', 404);
        }
        
        return $this->successResponse(['message' => 'Metric updated successfully']);
    }
    
    private function deleteMetric($metricName) {
        $input = json_decode(file_get_contents('php://input'), true);
        $dateRecorded = $input['date_recorded'] ?? date('Y-m-d');
        
        $stmt = $this->database->query(
            'DELETE FROM analytics_data WHERE metric_name = ? AND date_recorded = ?',
            [$metricName, $dateRecorded]
        );
        
        if ($stmt->rowCount() === 0) {
            throw new Exception('Metric not found', 404);
        }
        
        return $this->successResponse(['message' => 'Metric deleted successfully']);
    }
    
    private function clearAllMetrics() {
        $this->database->query('DELETE FROM analytics_data');
        
        return $this->successResponse(['message' => 'All metrics cleared successfully']);
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
    $api = new AnalyticsAPI($database);
    $api->handleRequest();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error: ' . $e->getMessage()
    ]);
}
?>