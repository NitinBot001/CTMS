# ==============================================================================
# AyuCTMS Development Runner (Windows PowerShell)
# Starts both Backend (FastAPI/uvicorn) and Frontend (Vite/React) concurrently.
# Gracefully stops both services on Ctrl+C.
#
# Usage:
#   .\run_dev.ps1
#   powershell -ExecutionPolicy Bypass -File .\run_dev.ps1
# ==============================================================================

$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Starting AyuCTMS (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Detect Python
$PythonCmd = ""
if (Test-Path "$RootDir\backend\.venv\Scripts\python.exe") {
    $PythonCmd = "$RootDir\backend\.venv\Scripts\python.exe"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $PythonCmd = "python"
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $PythonCmd = "py"
} else {
    Write-Host "[ERROR] Python not found. Please install Python or set up backend\.venv" -ForegroundColor Red
    exit 1
}

# 2. Detect npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] npm not found. Please install Node.js and npm." -ForegroundColor Red
    exit 1
}

$env:PYTHONUNBUFFERED = "1"

# 3. Start Backend process
Write-Host "▶ Starting Backend (FastAPI on http://127.0.0.1:8000)..." -ForegroundColor Yellow
$backend = Start-Process -FilePath $PythonCmd `
    -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload" `
    -WorkingDirectory "$RootDir\backend" `
    -PassThru

# 4. Start Frontend process
Write-Host "▶ Starting Frontend (Vite on http://localhost:5173)..." -ForegroundColor Yellow
$frontend = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm run dev -- --host" `
    -WorkingDirectory "$RootDir\frontend" `
    -PassThru

Write-Host "==================================================" -ForegroundColor Green
Write-Host "  AyuCTMS is live:" -ForegroundColor Green
Write-Host "  - Backend API:  http://localhost:8000" -ForegroundColor Green
Write-Host "  - API Docs:     http://localhost:8000/docs" -ForegroundColor Green
Write-Host "  - Frontend UI:  http://localhost:5173" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop both services." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Green

# 5. Cleanup function
function Stop-AyuCTMS {
    Write-Host "`nStopping AyuCTMS services..." -ForegroundColor Yellow

    if ($backend -and -not $backend.HasExited) {
        Write-Host "Stopping Backend (PID $($backend.Id))..."
        taskkill /pid $backend.Id /f /t 2>$null | Out-Null
        Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    }

    if ($frontend -and -not $frontend.HasExited) {
        Write-Host "Stopping Frontend (PID $($frontend.Id))..."
        taskkill /pid $frontend.Id /f /t 2>$null | Out-Null
        Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
    }

    Write-Host "All services stopped cleanly." -ForegroundColor Green
}

try {
    # Keep running while both processes are active
    while (-not $backend.HasExited -and -not $frontend.HasExited) {
        Start-Sleep -Milliseconds 500
    }
} finally {
    Stop-AyuCTMS
}
