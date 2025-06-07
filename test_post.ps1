# Test chat_data endpoint on Python server
$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = 'Bearer test_session_token_123'
}
$body = '{"chatData":"test chat content"}'
try {
    Write-Host "Testing chat_data endpoint on Python server..."
    $response = Invoke-WebRequest -Uri 'http://localhost:8000/api/chat_data/1' -Method POST -Headers $headers -Body $body -UseBasicParsing
    Write-Host "Success: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Response: $($reader.ReadToEnd())"
    }
}