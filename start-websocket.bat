@echo off
echo Starting AppointEase WebSocket Server...
echo.
cd /d "%~dp0"
php websocket-server.php
pause
