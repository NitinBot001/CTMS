@echo off
rem ==============================================================================
rem AyuCTMS Development Runner (Windows CMD / Batch)
rem Starts both Backend (FastAPI/uvicorn) and Frontend (Vite/React) concurrently.
rem ==============================================================================

setlocal EnableDelayedExpansion

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

rem Check if PowerShell is available to use native process lifecycle manager
where powershell >nul 2>nul
if %errorlevel% equ 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT_DIR%run_dev.ps1"
    exit /b %errorlevel%
)

rem Fallback: Pure CMD batch runner
title AyuCTMS Runner

echo ==================================================
echo   Starting AyuCTMS (Backend + Frontend)
echo ==================================================

rem 1. Check Python
if exist "%ROOT_DIR%backend\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%ROOT_DIR%backend\.venv\Scripts\python.exe"
) else (
    where python >nul 2>nul
    if !errorlevel! equ 0 (
        set "PYTHON_EXE=python"
    ) else (
        where py >nul 2>nul
        if !errorlevel! equ 0 (
            set "PYTHON_EXE=py"
        ) else (
            echo [ERROR] Python not found. Please install Python or set up backend\.venv
            pause
            exit /b 1
        )
    )
)

rem 2. Check npm
where npm >nul 2>nul
if !errorlevel! neq 0 (
    echo [ERROR] npm not found. Please install Node.js and npm.
    pause
    exit /b 1
)

echo [1/2] Starting Backend (FastAPI on http://127.0.0.1:8000)...
start "AyuCTMS-Backend" cmd /k "cd /d "%ROOT_DIR%backend" && "%PYTHON_EXE%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Frontend (Vite on http://localhost:5173)...
start "AyuCTMS-Frontend" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run dev -- --host"

echo ==================================================
echo   Both services are running!
echo   - Backend API:  http://localhost:8000
echo   - API Docs:     http://localhost:8000/docs
echo   - Frontend UI:  http://localhost:5173
echo.
echo   Press any key in this window to STOP all services.
echo ==================================================

pause >nul

echo.
echo Stopping AyuCTMS services...
taskkill /fi "WINDOWTITLE eq AyuCTMS-Backend*" /f /t >nul 2>nul
taskkill /fi "WINDOWTITLE eq AyuCTMS-Frontend*" /f /t >nul 2>nul

echo All services stopped cleanly.
timeout /t 2 >nul
exit /b 0
