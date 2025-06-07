Write-Host "Testing GET request to chat_data endpoint:"
try {
    $response = Invoke-WebRequest -Uri 'http://localhost/api/chat_data/1' -Method GET -UseBasicParsing
    Write-Host "GET Success: Status $($response.StatusCode)"
    Write-Host "GET Response: $($response.Content)"
} catch {
    Write-Host "GET Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "GET Response Body: $($reader.ReadToEnd())"
    }
}

Write-Host ""
Write-Host "Testing POST request to chat_data endpoint (without auth):"
try {
    $headers = @{
        'Content-Type' = 'application/json'
    }
    $body = '{"chatData":"test content"}'
    $response = Invoke-WebRequest -Uri 'http://localhost/api/chat_data/1' -Method POST -Headers $headers -Body $body -UseBasicParsing
    Write-Host "POST Success: Status $($response.StatusCode)"
    Write-Host "POST Response: $($response.Content)"
} catch {
    Write-Host "POST Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "POST Response Body: $($reader.ReadToEnd())"
    }
}

Write-Host ""
Write-Host "Testing POST request to chat_data endpoint (with mock auth):"
try {
    $headers = @{
        'Content-Type' = 'application/json'
        'Authorization' = 'Bearer test_session_token_123'
    }
    $body = '{"chatData":"test content"}'
    $response = Invoke-WebRequest -Uri 'http://localhost/api/chat_data/1' -Method POST -Headers $headers -Body $body -UseBasicParsing
    Write-Host "POST with Auth Success: Status $($response.StatusCode)"
    Write-Host "POST with Auth Response: $($response.Content)"
} catch {
    Write-Host "POST with Auth Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "POST with Auth Response Body: $($reader.ReadToEnd())"
    }
}