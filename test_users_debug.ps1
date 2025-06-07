# Debug script to test users API endpoints

Write-Host "Testing users API endpoints..."

# Test 1: Check if users API is accessible
Write-Host "\nTest 1: GET /api/users/debug"
try {
    $response = Invoke-WebRequest -Uri 'http://localhost/api/users/debug' -Method GET -UseBasicParsing
    Write-Host "Debug endpoint accessible: Status $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Debug endpoint error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Response Body: $($reader.ReadToEnd())"
        $reader.Close()
    }
}

# Test 2: Check login endpoint with detailed error info
Write-Host "\nTest 2: POST /api/users/login"
try {
    $headers = @{
        'Content-Type' = 'application/json'
    }
    $body = '{
        "email": "admin@example.com",
        "password": "admin123"
    }'
    
    Write-Host "Sending login request..."
    Write-Host "URL: http://localhost/api/users/login"
    Write-Host "Body: $body"
    
    $response = Invoke-WebRequest -Uri 'http://localhost/api/users/login' -Method POST -Headers $headers -Body $body -UseBasicParsing
    Write-Host "Login successful: Status $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
    
} catch {
    Write-Host "Login error: $($_.Exception.Message)"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
        $reader.Close()
    }
}

Write-Host "\nDebug test completed."