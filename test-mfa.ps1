# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Read UserDirectory.json
$userDirectoryPath = Join-Path $scriptDir "RadiusServer\UserDirectory.json"
$userDirectory = Get-Content $userDirectoryPath | ConvertFrom-Json

# Collect all Phone IDs from all users
$allPhoneIDs = @()
foreach ($user in $userDirectory.PSObject.Properties) {
    $phoneList = $user.Value.PHONELIST
    if ($phoneList -and $phoneList.Count -gt 0) {
        $allPhoneIDs += $phoneList
    }
}

if ($allPhoneIDs.Count -eq 0) {
    Write-Host "ERROR: No Phone IDs found in UserDirectory.json" -ForegroundColor Red
    Write-Host "Add a Phone ID to PHONELIST for at least one user."
    exit 1
}

Write-Host "Found $($allPhoneIDs.Count) Phone ID(s) in UserDirectory.json:"
foreach ($id in $allPhoneIDs) {
    Write-Host "  - $id"
}
Write-Host ""

$body = @{
    port = 5556
    Email = @()
    PhoneID = $allPhoneIDs
    minApproval = 1
    TTL = 120
    Description = "Please Approve Your Identity - 10Root MFA"
    allowTotp = $false
    passWord = "demo_password"
    WayOfNotification = "Phone"
    userName = "demo"
    MinPhoneApproval = 0
    privatekey = Join-Path $scriptDir "PushAppServer\10Root-privateKey.pem"
    UrlIpType = "Private"
    location = @{
        longitude = 34.78
        latitude = 32.05
    }
} | ConvertTo-Json -Depth 3

Write-Host "Sending MFA request to PushAppServer..."
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5555" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Response received:"
    $response | ConvertTo-Json

    # Interpret response code
    switch ($response.code) {
        0 { Write-Host "`nResult: APPROVED" -ForegroundColor Green }
        1 { Write-Host "`nResult: DENIED" -ForegroundColor Red }
        2 { Write-Host "`nResult: TIMEOUT" -ForegroundColor Yellow }
        5 { Write-Host "`nResult: ERROR" -ForegroundColor Red }
        10 { Write-Host "`nResult: WRONG PASSWORD" -ForegroundColor Red }
        11 { Write-Host "`nResult: PORT IN USE" -ForegroundColor Red }
        default { Write-Host "`nResult: Unknown code $($response.code)" -ForegroundColor Yellow }
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
