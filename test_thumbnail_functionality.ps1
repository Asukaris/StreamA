# Test script for thumbnail functionality
$baseUrl = "http://localhost:8000"
$sessionToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdHJlYW1hcHAiLCJhdWQiOiJzdHJlYW1hcHAiLCJpYXQiOjE3MzM1NDI0NjIsImV4cCI6MTczMzU0NjA2MiwidXNlcl9pZCI6MX0.mJhNOGNhZGY4ZjU4ZjU4ZjU4ZjU4ZjU4ZjU4ZjU4ZjU4"

Write-Host "Testing thumbnail functionality..."

# Create a simple test thumbnail (1x1 pixel red PNG in base64)
$testThumbnail = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

# Test data for creating a stream with thumbnail
$testStreamData = @{
    title = "Test Stream with Thumbnail"
    description = "Testing thumbnail file storage"
    stream_url = "https://example.com/test.m3u8"
    thumbnail_url = $testThumbnail
    category = "Test"
    game = "Test Game"
    tags = "test,thumbnail"
    duration = 3600
    is_live = $false
    viewer_count = 0
} | ConvertTo-Json

try {
    # Test creating a stream with thumbnail
    Write-Host "Creating stream with thumbnail..."
    $response = Invoke-RestMethod -Uri "$baseUrl/api/streams" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Cookie" = "streamapp_session_token=$sessionToken"
        } `
        -Body $testStreamData
    
    if ($response.success) {
        Write-Host "SUCCESS: Stream created with ID: $($response.data.stream_id)"
        $streamId = $response.data.stream_id
        
        # Test retrieving the stream to check thumbnail path
        Write-Host "Retrieving stream to check thumbnail path..."
        $getResponse = Invoke-RestMethod -Uri "$baseUrl/api/streams/$streamId" `
            -Method GET `
            -Headers @{
                "Cookie" = "streamapp_session_token=$sessionToken"
            }
        
        if ($getResponse.success) {
            $thumbnailPath = $getResponse.data.thumbnail_url
            Write-Host "Thumbnail path: $thumbnailPath"
            
            # Test if thumbnail file is accessible
            if ($thumbnailPath -and $thumbnailPath -ne "") {
                try {
                    $thumbnailResponse = Invoke-WebRequest -Uri "$baseUrl/$thumbnailPath" -Method GET
                    Write-Host "SUCCESS: Thumbnail file is accessible (Status: $($thumbnailResponse.StatusCode))"
                } catch {
                    Write-Host "WARNING: Thumbnail file not accessible: $($_.Exception.Message)"
                }
            } else {
                Write-Host "WARNING: No thumbnail path returned"
            }
        } else {
            Write-Host "ERROR: Failed to retrieve stream: $($getResponse.error)"
        }
        
        # Test updating thumbnail
        Write-Host "Testing thumbnail update..."
        $updateData = @{
            thumbnail_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        } | ConvertTo-Json
        
        $updateResponse = Invoke-RestMethod -Uri "$baseUrl/api/streams/$streamId" `
            -Method PUT `
            -Headers @{
                "Content-Type" = "application/json"
                "Cookie" = "streamapp_session_token=$sessionToken"
            } `
            -Body $updateData
        
        if ($updateResponse.success) {
            Write-Host "SUCCESS: Thumbnail updated successfully"
        } else {
            Write-Host "ERROR: Failed to update thumbnail: $($updateResponse.error)"
        }
        
        # Clean up - delete the test stream
        Write-Host "Cleaning up test stream..."
        $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/api/streams/$streamId" `
            -Method DELETE `
            -Headers @{
                "Cookie" = "streamapp_session_token=$sessionToken"
            }
        
        if ($deleteResponse.success) {
            Write-Host "SUCCESS: Test stream deleted successfully"
        } else {
            Write-Host "WARNING: Failed to delete test stream: $($deleteResponse.error)"
        }
        
    } else {
        Write-Host "ERROR: Failed to create stream: $($response.error)"
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}

Write-Host "Thumbnail functionality test completed."