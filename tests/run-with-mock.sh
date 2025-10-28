#!/bin/bash

echo "🚀 AppointEase Booking System Test with Mock Server"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Navigate to tests directory
cd "$(dirname "$0")"

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🖥️  Starting mock server..."
# Start mock server in background
node mock-server.js &
MOCK_PID=$!

# Wait for server to start
sleep 2

echo "🏁 Running stress tests against mock server..."
echo ""

# Run tests
node booking-stress-test.js

echo ""
echo "🛑 Stopping mock server..."
kill $MOCK_PID 2>/dev/null

echo "✨ Tests completed!"