# 🚀 Start LawGenie Backend with ngrok

Write-Host "Starting LawGenie Backend..."

# Kill anything already using port 5000
Write-Host "Checking for processes on port 5000..."
$portInUse = netstat -ano | findstr :5000
if ($portInUse) {
    $pid = ($portInUse -split "\s+")[-1]
    try {
        Stop-Process -Id $pid -Force
        Write-Host "Stopped process using port 5000 (PID $pid)"
    } catch {
        Write-Host "Could not stop process on port 5000, maybe it closed already."
    }
}

# Start the backend in a new window
Start-Process powershell -ArgumentList "npm run dev" -NoNewWindow

# Wait 5 seconds to let the backend boot
Start-Sleep -Seconds 5

# Start ngrok with reserved domain
Write-Host "Starting ngrok tunnel..."
Start-Process "ngrok" -ArgumentList "http --domain=pollenlike-tenorless-clemmie.ngrok-free.app 5000"

Write-Host "✅ Backend and ngrok are running!"
Write-Host "🌍 Public URL: https://pollenlike-tenorless-clemmie.ngrok-free.app"
