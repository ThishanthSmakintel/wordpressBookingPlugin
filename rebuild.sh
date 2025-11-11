#!/bin/bash

# Clean and rebuild script for WordPress Booking Plugin

echo "🧹 Cleaning build directory..."
rm -rf build/

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building production assets..."
npm run build

echo "✅ Build complete!"
