const express = require('express');
const path = require('path');

const app = express();
const PORT = 6969;

// 設置靜態文件目錄
app.use(express.static(path.join(__dirname)));

// 根路徑重定向到index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 顯示頁面路由
app.get('/display', (req, res) => {
    res.sendFile(path.join(__dirname, 'display.html'));
});

// Debug工具路由
app.get('/debug', (req, res) => {
    res.sendFile(path.join(__dirname, 'debug.html'));
});

// 404 錯誤處理
app.use((req, res) => {
    res.status(404).send(`
        <h1>404 - 頁面未找到</h1>
        <p>可用的頁面:</p>
        <ul>
            <li><a href="/">控制面板 (index.html)</a></li>
            <li><a href="/display">OBS 顯示頁面 (display.html)</a></li>
            <li><a href="/debug">Debug 工具 (debug.html)</a></li>
        </ul>
    `);
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 Twitch 加班台倒數計時工具已啟動！`);
    console.log(`📱 控制面板: http://127.0.0.1:${PORT}/`);
    console.log(`🖥️  OBS顯示頁面: http://127.0.0.1:${PORT}/display`);
    console.log(`🔧 Debug工具: http://127.0.0.1:${PORT}/debug`);
    console.log(`⏹️  按 Ctrl+C 停止伺服器`);
});

// 優雅關閉處理
process.on('SIGINT', () => {
    console.log('\n🛑 正在關閉伺服器...');
    process.exit(0);
});