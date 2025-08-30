@echo off
echo ==========================================
echo   Twitch 加班台倒數計時工具 v3.3.2
echo ==========================================
echo.
echo 正在檢查 Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 錯誤: 未安裝 Node.js
    echo 請先安裝 Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo 正在檢查依賴套件...
if not exist node_modules (
    echo 正在安裝依賴套件...
    npm install
    if %errorlevel% neq 0 (
        echo 錯誤: 安裝失敗
        pause
        exit /b 1
    )
)

echo.
echo 🚀 啟動 Twitch 加班台倒數計時工具...
echo 📱 控制面板: http://127.0.0.1:6969/
echo 🖥️  OBS顯示頁面: http://127.0.0.1:6969/display
echo 🔧 Debug工具: http://127.0.0.1:6969/debug
echo.
echo ⏹️  按 Ctrl+C 停止伺服器
echo ==========================================
echo.

node server.js