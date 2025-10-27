@echo off
echo Killing existing WebSocket server...
taskkill /F /PID 18396 2>nul
timeout /t 2 /nobreak > nul

echo Starting WebSocket server...
start "WebSocket Server - CHECK THIS WINDOW FOR ERRORS" cmd /k "node websocket-server.js"
timeout /t 3 /nobreak > nul

echo Running test...
node test-ws-client.js

echo.
echo CHECK THE "WebSocket Server" WINDOW FOR ERROR MESSAGES!
pause
