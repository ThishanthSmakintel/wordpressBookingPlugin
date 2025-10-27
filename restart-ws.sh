#!/bin/bash

echo "=== WebSocket Server Restart ==="
echo ""

echo "Step 1: Killing old WebSocket server (PID 18396)..."
taskkill //F //PID 18396 2>/dev/null
sleep 2

echo "Step 2: Starting new WebSocket server..."
echo "NOTE: Check the new terminal window for error messages!"
echo ""

# Start in new window (Windows)
cmd.exe //c "start cmd.exe //k node websocket-server.js"
sleep 3

echo "Step 3: Running test..."
node test-ws-client.js

echo ""
echo "Step 4: Checking database..."
php check-locks.php

echo ""
echo "=== IMPORTANT ==="
echo "Check the WebSocket Server window for lines like:"
echo "  [WebSocket] ✅ Lock inserted successfully!"
echo "  OR"
echo "  [WebSocket] ❌ Error locking slot: <error message>"
echo ""
