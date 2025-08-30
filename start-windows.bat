@echo off
chcp 65001 >nul
echo ==========================================
echo   Twitch Overtime Timer v3.3.2
echo ==========================================
echo.
echo Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js not installed
    echo Please install Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Checking dependencies...
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Installation failed
        pause
        exit /b 1
    )
)

echo.
echo Starting Twitch Overtime Timer...
echo Control Panel: http://127.0.0.1:6969/
echo OBS Display: http://127.0.0.1:6969/display
echo Debug Tools: http://127.0.0.1:6969/debug
echo.
echo Press Ctrl+C to stop server
echo ==========================================
echo.

node server.js