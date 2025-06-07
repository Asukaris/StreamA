# Test script that logs in first to get a valid session token, then tests chat_data POST

Write-Host "Step 1: Attempting to login to get a valid session token..."

try {
    # First, let's try to login to get a valid session token
    $loginHeaders = @{
        'Content-Type' = 'application/json'
    }
    $loginBody = '{
        "email": "admin@example.com",
        "password": "admin123"
    }'
    
    $loginResponse = Invoke-WebRequest -Uri 'http://localhost/api/users/login' -Method POST -Headers $loginHeaders -Body $loginBody -UseBasicParsing
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginData.success) {
        Write-Host "Login successful!"
        $sessionToken = $loginData.data.session_token
        Write-Host "Session token obtained: $($sessionToken.Substring(0,10))..."
        
        Write-Host ""
        Write-Host "Step 2: Testing chat_data POST with valid session token..."
        
        # Now test the chat_data endpoint with the real session token
        $chatHeaders = @{
            'Content-Type' = 'application/json'
            'Authorization' = "Bearer $sessionToken"
        }
        $chatBody = '{"chatData":"Test chat content from PowerShell"}'
        
        $chatResponse = Invoke-WebRequest -Uri 'http://localhost/api/chat_data/1' -Method POST -Headers $chatHeaders -Body $chatBody -UseBasicParsing
        
        Write-Host "Chat data POST successful! Status: $($chatResponse.StatusCode)"
        Write-Host "Response: $($chatResponse.Content)"
        
    } else {
        Write-Host "Login failed: $($loginData.error)"
    }
    
} catch {
    Write-Host "Error occurred: $($_.Exception.Message)"
    
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
        $reader.Close()
    }
}

Write-Host ""
Write-Host "Test completed."