#!/bin/bash

echo "🚀 AppointEase Booking System Stress Test"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js detected"
echo ""

# Navigate to tests directory
cd "$(dirname "$0")"

# Install required packages if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🏁 Starting stress tests..."
echo ""

# Run quick tests (skip 35-second abandonment test)
node booking-stress-test.js

echo ""
echo "📊 Test completed!"
echo ""

# Ask if user wants to run full test suite
read -p "Run full test suite including abandonment test? (y/N): " fulltest
if [[ $fulltest =~ ^[Yy]$ ]]; then
    echo ""
    echo "⏳ Running full test suite (this will take ~40 seconds)..."
    node booking-stress-test.js --full
fi

echo ""
echo "✨ All tests completed!"