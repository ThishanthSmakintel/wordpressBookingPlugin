@echo off
echo 🚀 AppointEase Booking System Stress Test
echo ==========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is required but not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected
echo.

REM Install required packages if needed
if not exist node_modules\node-fetch (
    echo 📦 Installing dependencies...
    npm install node-fetch
    echo.
)

echo 🏁 Starting stress tests...
echo.

REM Run quick tests (skip 35-second abandonment test)
node booking-stress-test.js

echo.
echo 📊 Test completed!
echo.

REM Ask if user wants to run full test suite
set /p fulltest="Run full test suite including abandonment test? (y/N): "
if /i "%fulltest%"=="y" (
    echo.
    echo ⏳ Running full test suite (this will take ~40 seconds)...
    node booking-stress-test.js --full
)

echo.
echo ✨ All tests completed!
pause