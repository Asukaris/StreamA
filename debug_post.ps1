try {
    $headers = @{
        'Content-Type' = 'application/json'
        'Authorization' = 'Bearer test_token'
    }
    $body = '{"chatData":"test content"}'
    
    Write-Host "Making POST request to chat_data endpoint..."
    $response = Invoke-WebRequest -Uri 'http://localhost/api/chat_data/1' -Method POST -Headers $headers -Body $body -UseBasicParsing
    
    Write-Host "Success! Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
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