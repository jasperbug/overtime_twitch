const express = require('express');
const path = require('path');

const app = express();
const PORT = 6969;

// 全局狀態存儲（解決OBS Browser Source localStorage問題）
let globalTimerState = {
    remainingTime: 0,
    isRunning: false,
    startTime: 0,
    initialTime: 0,
    lastUpdate: Date.now()
};

// 中間件
app.use(express.json());
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

// API路由：獲取計時器狀態
app.get('/api/timer', (req, res) => {
    // 如果計時器正在運行，計算實際剩餘時間
    if (globalTimerState.isRunning && globalTimerState.remainingTime > 0) {
        const currentTime = Date.now();
        const elapsed = Math.floor((currentTime - globalTimerState.startTime) / 1000);
        const actualRemaining = Math.max(0, globalTimerState.remainingTime - elapsed);
        
        res.json({
            ...globalTimerState,
            actualRemainingTime: actualRemaining,
            serverTime: currentTime
        });
    } else {
        res.json({
            ...globalTimerState,
            actualRemainingTime: globalTimerState.remainingTime,
            serverTime: Date.now()
        });
    }
});

// API路由：更新計時器狀態
app.post('/api/timer', (req, res) => {
    const newState = req.body;
    
    // 更新全局狀態
    globalTimerState = {
        ...globalTimerState,
        ...newState,
        lastUpdate: Date.now()
    };
    
    console.log('⏱️ 計時器狀態已更新:', globalTimerState);
    res.json({ success: true, state: globalTimerState });
});

// API路由：重置計時器狀態
app.post('/api/timer/reset', (req, res) => {
    globalTimerState = {
        remainingTime: 0,
        isRunning: false,
        startTime: 0,
        initialTime: 0,
        lastUpdate: Date.now()
    };
    
    console.log('🔄 計時器狀態已重置');
    res.json({ success: true, state: globalTimerState });
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