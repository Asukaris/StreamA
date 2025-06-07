<?php

class ThumbnailHandler {
    private $uploadDir;
    
    public function __construct($uploadDir = '../thumbnails/') {
        $this->uploadDir = rtrim($uploadDir, '/') . '/';
        
        // Create directory if it doesn't exist
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }
    
    /**
     * Save a base64 encoded image to a file
     * @param string $base64Data The base64 encoded image data
     * @param string $originalName Optional original filename for extension detection
     * @return string The relative path to the saved file
     * @throws Exception If saving fails
     */
    public function saveBase64Image($base64Data, $originalName = null) {
        // Extract the image data from base64 string
        if (strpos($base64Data, 'data:') === 0) {
            // Remove data:image/jpeg;base64, or similar prefix
            $base64Data = preg_replace('/^data:image\/[^;]+;base64,/', '', $base64Data);
        }
        
        // Decode base64 data
        $imageData = base64_decode($base64Data);
        if ($imageData === false) {
            throw new Exception('Invalid base64 image data');
        }
        
        // Detect image type from binary data
        $imageInfo = getimagesizefromstring($imageData);
        if ($imageInfo === false) {
            throw new Exception('Invalid image data');
        }
        
        // Get file extension based on MIME type
        $extension = $this->getExtensionFromMimeType($imageInfo['mime']);
        if (!$extension) {
            throw new Exception('Unsupported image type: ' . $imageInfo['mime']);
        }
        
        // Generate unique filename
        $filename = $this->generateUniqueFilename($extension);
        $filePath = $this->uploadDir . $filename;
        
        // Save the file
        if (file_put_contents($filePath, $imageData) === false) {
            throw new Exception('Failed to save image file');
        }
        
        // Return relative path from project root
        return 'thumbnails/' . $filename;
    }
    
    /**
     * Save an uploaded file
     * @param array $uploadedFile The $_FILES array element
     * @return string The relative path to the saved file
     * @throws Exception If saving fails
     */
    public function saveUploadedFile($uploadedFile) {
        if (!isset($uploadedFile['tmp_name']) || !is_uploaded_file($uploadedFile['tmp_name'])) {
            throw new Exception('Invalid uploaded file');
        }
        
        // Validate image
        $imageInfo = getimagesize($uploadedFile['tmp_name']);
        if ($imageInfo === false) {
            throw new Exception('Invalid image file');
        }
        
        // Get file extension
        $extension = $this->getExtensionFromMimeType($imageInfo['mime']);
        if (!$extension) {
            throw new Exception('Unsupported image type: ' . $imageInfo['mime']);
        }
        
        // Generate unique filename
        $filename = $this->generateUniqueFilename($extension);
        $filePath = $this->uploadDir . $filename;
        
        // Move uploaded file
        if (!move_uploaded_file($uploadedFile['tmp_name'], $filePath)) {
            throw new Exception('Failed to save uploaded file');
        }
        
        // Return relative path from project root
        return 'thumbnails/' . $filename;
    }
    
    /**
     * Delete a thumbnail file
     * @param string $thumbnailPath The relative path to the thumbnail
     * @return bool True if deleted successfully
     */
    public function deleteThumbnail($thumbnailPath) {
        if (empty($thumbnailPath) || strpos($thumbnailPath, 'thumbnails/') !== 0) {
            return false;
        }
        
        $fullPath = '../' . $thumbnailPath;
        if (file_exists($fullPath)) {
            return unlink($fullPath);
        }
        
        return true; // File doesn't exist, consider it deleted
    }
    
    /**
     * Generate a unique filename
     * @param string $extension File extension
     * @return string Unique filename
     */
    private function generateUniqueFilename($extension) {
        do {
            $filename = uniqid('thumb_', true) . '.' . $extension;
        } while (file_exists($this->uploadDir . $filename));
        
        return $filename;
    }
    
    /**
     * Get file extension from MIME type
     * @param string $mimeType MIME type
     * @return string|null File extension or null if unsupported
     */
    private function getExtensionFromMimeType($mimeType) {
        $mimeToExt = [
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'image/bmp' => 'bmp'
        ];
        
        return $mimeToExt[$mimeType] ?? null;
    }
}