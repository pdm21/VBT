# Set fixed IP address
$IP = "192.168.0.100"

# Remove any existing server ready signal file
$readyFile = ".server-ready"
if (Test-Path $readyFile) {
    Remove-Item $readyFile -Force
}

# Kill any process using port 3001
Write-Host "Checking for existing processes on port 3001..."
$PID3001 = Get-NetTCPConnection -LocalPort 3001 -State Listen | Select-Object -First 1 | ForEach-Object { (Get-Process -Id $_.OwningProcess).Id }
if ($PID3001) {
    Write-Host "Killing process on port 3001 (PID: $PID3001)..."
    Stop-Process -Id $PID3001 -Force
} else {
    Write-Host "No existing process on port 3001."
}

# Kill any process using port 8000
Write-Host "Checking for existing processes on port 8000..."
$PID8000 = Get-NetTCPConnection -LocalPort 8000 -State Listen | Select-Object -First 1 | ForEach-Object { (Get-Process -Id $_.OwningProcess).Id }
if ($PID8000) {
    Write-Host "Killing process on port 8000 (PID: $PID8000)..."
    Stop-Process -Id $PID8000 -Force
} else {
    Write-Host "No existing process on port 8000."
}

# Update config.js with current IP
$configPath = "config.js"
(Get-Content $configPath) -replace "serverIp: '.*?'", "serverIp: '$IP'" | Set-Content $configPath

# Make logs directory if not exists
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs"
}

# Start Backend
Write-Host "Starting backend on port 8000..."
Start-Process powershell -ArgumentList "cd backend; uvicorn main:app --host 0.0.0.0 --port 8000 *> ../logs/backend.log" -WindowStyle Hidden

# Update frontend .env.local
"NEXT_PUBLIC_SERVER_IP=$IP" | Set-Content "frontend/.env.local"

# Output URL
Write-Host "SERVER_URL=http://$IP:3001"

# Start frontend (assuming npm is globally available)
Start-Process powershell -ArgumentList "npm run start:prod" -WindowStyle Hidden

# Wait for server to be ready
Write-Host "Waiting for server to be ready..."
while (-not (Test-Path ".server-ready")) {
    Start-Sleep -Seconds 1
}

# Clean up
Remove-Item .server-ready -Force

# Notification (uses Windows toast)
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText01)
$template.GetElementsByTagName("text")[0].AppendChild($template.CreateTextNode("Please open the following link on your iPad: http://$IP:3001")) | Out-Null
$toast = [Windows.UI.Notifications.ToastNotification]::new($template)
$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("VBT Server")
$notifier.Show($toast)
