@echo off
echo ========================================
echo   AppointEase WebSocket Server
echo ========================================
echo.
echo Starting WebSocket server on port 8080...
echo Press Ctrl+C to stop
echo.
cd /d "%~dp0"
node websocket-server.js
pause
