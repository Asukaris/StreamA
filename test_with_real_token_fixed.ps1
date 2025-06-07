# Test script using the real session token with correct data format

Write-Host "Testing chat_data POST endpoint with real session token and correct format..."

# Use the session token from browser cookies
$sessionToken = "b08d2549d16bb0c2cce46cd0886d811c7e2dfe7ec717d60caa6b73f96d84ce5a"

# Test POST request to chat_data endpoint
try {
    $headers = @{
        'Content-Type' = 'application/json'
        'Authorization' = "Bearer $sessionToken"
    }
    
    # Correct format: the function expects 'chatData' not 'json_content'
    $body = '{
        "chatData": {
            "test": "data",
            "timestamp": "' + (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ") + '",
            "message": "Test message from PowerShell"
        }
    }'
    
    Write-Host "Making POST request to: http://localhost/api/chat_data/1"
    Write-Host "Using session token: $sessionToken"
    Write-Host "Request body: $body"
    
    $response = Invoke-WebRequest -Uri 'http://localhost/api/chat_data/1' -Method POST -Headers $headers -Body $body -UseBasicParsing
    
    Write-Host "SUCCESS! Status Code: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
        $reader.Close()
    }
}

Write-Host "\nTest completed."