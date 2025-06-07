# Simple authentication test
Write-Host "Testing authentication with session token..."

$token = "b08d2549d16bb0c2cce46cd0886d811c7e2dfe7ec717d60caa6b73f96d84ce5a"

try {
    $headers = @{
        'Authorization' = "Bearer $token"
        'Content-Type' = 'application/json'
    }
    
    $body = @{
        chatData = @{
            test = "authentication test"
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
    } | ConvertTo-Json -Depth 3
    
    Write-Host "Sending request..."
    $response = Invoke-WebRequest -Uri 'http://localhost/api/chat_data/1' -Method POST -Headers $headers -Body $body -UseBasicParsing
    
    Write-Host "SUCCESS!"
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
    
} catch {
    Write-Host "FAILED!"
    Write-Host "Error: $($_.Exception.Message)"
    
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody"
            $reader.Close()
        } catch {
            Write-Host "Could not read response body"
        }
    }
}