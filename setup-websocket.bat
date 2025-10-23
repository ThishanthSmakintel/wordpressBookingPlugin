@echo off
REM AppointEase WebSocket Setup Script for Windows
REM One-click installation for WebSocket real-time updates

setlocal enabledelayedexpansion

echo ==========================================
echo   AppointEase WebSocket Setup (Windows)
echo ==========================================
echo.

cd /d "%~dp0"

REM Check Composer
echo [1/4] Checking Composer...
where composer >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Composer not found!
    echo Install from: https://getcomposer.org/download/
    pause
    exit /b 1
)
echo [OK] Composer found
echo.

REM Install Dependencies
echo [2/4] Installing dependencies...
call composer install --no-dev --optimize-autoloader
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Check port 8080
echo [3/4] Checking port 8080...
netstat -ano | findstr ":8080" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 8080 is already in use
    echo You may need to stop the existing service or use a different port
    echo.
)

REM Start WebSocket Server
echo [4/4] Starting WebSocket server...
echo.
echo Choose startup method:
echo 1) Start in new window (manual)
echo 2) Start in background (requires NSSM)
echo 3) Exit (I'll start manually)
echo.
set /p choice="Enter choice [1-3]: "

if "%choice%"=="1" (
    echo Starting WebSocket server in new window...
    start "AppointEase WebSocket" cmd /k "php websocket-server.php"
    timeout /t 2 >nul
    echo.
    echo [OK] WebSocket server started in new window
    echo Close the window to stop the server
    
) else if "%choice%"=="2" (
    echo Checking for NSSM...
    where nssm >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] NSSM not found!
        echo Download from: https://nssm.cc/download
        echo Or choose option 1 instead
        pause
        exit /b 1
    )
    
    echo Installing as Windows service...
    nssm install AppointEaseWebSocket "%CD%\websocket-server.php"
    nssm set AppointEaseWebSocket AppDirectory "%CD%"
    nssm set AppointEaseWebSocket AppParameters ""
    nssm set AppointEaseWebSocket DisplayName "AppointEase WebSocket Server"
    nssm set AppointEaseWebSocket Description "Real-time WebSocket server for AppointEase booking plugin"
    nssm set AppointEaseWebSocket Start SERVICE_AUTO_START
    
    net start AppointEaseWebSocket
    
    if %errorlevel% equ 0 (
        echo [OK] Service installed and started
        echo Manage: services.msc
    ) else (
        echo [ERROR] Failed to start service
        pause
        exit /b 1
    )
    
) else if "%choice%"=="3" (
    echo.
    echo [OK] Dependencies installed. Start manually with:
    echo   php websocket-server.php
    pause
    exit /b 0
    
) else (
    echo Invalid choice
    pause
    exit /b 1
)

REM Test connection
echo.
echo Testing WebSocket connection...
timeout /t 3 >nul

powershell -Command "try { $client = New-Object System.Net.Sockets.TcpClient('localhost', 8080); $client.Close(); Write-Host '[OK] WebSocket server is responding' -ForegroundColor Green } catch { Write-Host '[ERROR] Cannot connect to WebSocket server' -ForegroundColor Red }"

echo.
echo ==========================================
echo   WebSocket Setup Complete!
echo ==========================================
echo.
echo WebSocket URL: ws://localhost:8080
echo.
echo Next steps:
echo 1. Test at: http://yoursite.com/wp-content/plugins/wordpressBookingPlugin/test-websocket.html
echo 2. Check WordPress admin for connection status
echo.
echo Troubleshooting:
echo   Check if running: tasklist ^| findstr php
echo   View window: Look for "AppointEase WebSocket" window
echo.
pause
