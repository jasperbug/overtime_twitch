@echo off
echo Starting Twitch Overtime Timer...
echo.
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found. Please install from: https://nodejs.org/
    pause
    exit /b 1
)

if not exist node_modules (
    echo Installing dependencies...
    npm install
)

echo.
echo Server starting...
echo Open: http://127.0.0.1:6969/
echo.
node server.js