@echo off
REM Clean and rebuild script for WordPress Booking Plugin

echo Cleaning build directory...
if exist build rmdir /s /q build

echo Installing dependencies...
call npm install

echo Building production assets...
call npm run build

echo Build complete!
