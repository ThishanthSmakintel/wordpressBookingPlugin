#!/bin/bash

echo "Killing old server..."
taskkill //F //PID 18396 2>/dev/null
sleep 2

echo "Starting server with logging..."
node websocket-server.js > ws-server.log 2>&1 &
WS_PID=$!
echo "WebSocket server started with PID: $WS_PID"
sleep 3

echo "Running test..."
node test-ws-client.js

echo ""
echo "=== WebSocket Server Log ==="
cat ws-server.log

echo ""
echo "=== Database Check ==="
php check-locks.php

echo ""
echo "Full log saved to: ws-server.log"
