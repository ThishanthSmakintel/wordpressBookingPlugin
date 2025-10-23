@echo off
echo Starting AppointEase WebSocket Server...
cd /d "%~dp0"
npm install
node websocket-server.js
pause
