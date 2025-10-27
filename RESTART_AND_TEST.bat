@echo off
echo ========================================
echo WebSocket Server Restart and Test
echo ========================================
echo.

echo Step 1: Checking if WebSocket server is running...
netstat -ano | findstr :8080 > nul
if %errorlevel% equ 0 (
    echo [WARNING] WebSocket server is already running on port 8080
    echo Please manually stop it with Ctrl+C in its terminal window
    echo Then run this script again
    pause
    exit /b 1
) else (
    echo [OK] Port 8080 is available
)

echo.
echo Step 2: Starting WebSocket server in background...
start "WebSocket Server" cmd /k "node websocket-server.js"
timeout /t 3 /nobreak > nul

echo.
echo Step 3: Verifying server started...
netstat -ano | findstr :8080 > nul
if %errorlevel% equ 0 (
    echo [OK] WebSocket server is running
) else (
    echo [ERROR] Failed to start WebSocket server
    pause
    exit /b 1
)

echo.
echo Step 4: Running lock test...
node test-ws-client.js

echo.
echo Step 5: Checking database for locks...
php check-locks.php

echo.
echo ========================================
echo Test Complete!
echo ========================================
echo.
echo Check the WebSocket Server window for error messages
echo Look for lines starting with: [WebSocket] ❌ Error locking slot:
echo.
pause
