// 核心計時器管理
class TwitchOvertimeTimer {
    constructor() {
        this.timerInterval = null;
        this.audioManager = new AudioManager();
        this.lastWarningTime = -1;
        this.isFinished = false;
        this.twitchChat = new TwitchChatListener();
        
        // 性能優化：快取設定值
        this.cachedSettings = null;
        this.settingsCacheTime = 0;
        this.lastSyncTime = 0;
        
        this.initializeElements();
        this.loadTimerData();
        this.bindEvents();
        this.updateDisplay();
        this.updateStats();
        this.setObsUrl();
        this.setupTwitchIntegration();
        this.setupDonationSystem();
        
        // 如果計時器正在運行，恢復計時
        if (this.timerData.isRunning) {
            this.startTimer();
        }
    }

    initializeElements() {
        // 控制元素
        this.hoursInput = document.getElementById('hours');
        this.minutesInput = document.getElementById('minutes');
        this.setTimeBtn = document.getElementById('setTime');
        this.startPauseBtn = document.getElementById('startPause');
        this.resetBtn = document.getElementById('reset');
        
        // 積分元素
        this.pointsInput = document.getElementById('pointsInput');
        this.addPointsBtn = document.getElementById('addPoints');
        this.quickBtns = document.querySelectorAll('.quick-btn');
        
        // 顯示元素
        this.timeDisplay = document.getElementById('timeDisplay');
        this.totalPointsDisplay = document.getElementById('totalPoints');
        this.totalTimeDisplay = document.getElementById('totalTime');
        
        // OBS URL
        this.obsUrlInput = document.getElementById('obsUrl');
        this.copyUrlBtn = document.getElementById('copyUrl');
        
        // Twitch 聊天室元素
        this.channelNameInput = document.getElementById('channelName');
        this.connectChatBtn = document.getElementById('connectChat');
        this.disconnectChatBtn = document.getElementById('disconnectChat');
        this.chatStatusDisplay = document.getElementById('chatStatus');
        
        // 層級設定元素
        this.tier1MinutesInput = document.getElementById('tier1Minutes');
        this.tier2MinutesInput = document.getElementById('tier2Minutes');
        this.tier3MinutesInput = document.getElementById('tier3Minutes');
        this.saveTierSettingsBtn = document.getElementById('saveTierSettings');
        this.resetTierSettingsBtn = document.getElementById('resetTierSettings');
        
        // 抖內功能元素
        this.donationRateInput = document.getElementById('donationRate');
        this.minDonationInput = document.getElementById('minDonation');
        this.maxDonationInput = document.getElementById('maxDonation');
        this.saveDonationSettingsBtn = document.getElementById('saveDonationSettings');
        this.resetDonationSettingsBtn = document.getElementById('resetDonationSettings');
        this.donationAmountInput = document.getElementById('donationAmount');
        this.addDonationBtn = document.getElementById('addDonation');
    }

    loadTimerData() {
        this.timerData = Storage.getTimerData();
    }

    saveTimerData(forceSync = false) {
        Storage.saveTimerData(this.timerData);
        
        // 性能優化：限制同步頻率，避免每秒HTTP請求
        const now = Date.now();
        if (forceSync || (now - this.lastSyncTime) >= 5000) { // 最多每5秒同步一次
            this.syncToServer();
            this.lastSyncTime = now;
        }
    }

    // 同步狀態到服務器
    async syncToServer() {
        try {
            const response = await fetch('/api/timer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.timerData)
            });
            
            if (response.ok) {
                console.log('✅ 狀態已同步到服務器');
            }
        } catch (error) {
            console.log('⚠️ 服務器同步失敗，使用本地存儲:', error.message);
        }
    }

    bindEvents() {
        // 設定時間
        this.setTimeBtn.addEventListener('click', () => this.setInitialTime());
        
        // 控制按鈕
        this.startPauseBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        
        // 積分管理
        this.addPointsBtn.addEventListener('click', () => this.addPoints());
        this.pointsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPoints();
        });
        
        // 快速按鈕
        this.quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.minutes);
                this.addTime(minutes * 60, minutes);
            });
        });
        
        // OBS URL複製
        this.copyUrlBtn.addEventListener('click', () => this.copyObsUrl());
        
        // Twitch 聊天室連接
        this.connectChatBtn.addEventListener('click', () => this.connectToTwitchChat());
        this.disconnectChatBtn.addEventListener('click', () => this.disconnectFromTwitchChat());
        
        // 層級設定
        this.saveTierSettingsBtn.addEventListener('click', () => this.saveTierSettings());
        this.resetTierSettingsBtn.addEventListener('click', () => this.resetTierSettings());
        
        // 抖內功能
        this.saveDonationSettingsBtn.addEventListener('click', () => this.saveDonationSettings());
        this.resetDonationSettingsBtn.addEventListener('click', () => this.resetDonationSettings());
        this.addDonationBtn.addEventListener('click', () => this.addDonation());
        this.donationAmountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addDonation();
        });
        
        // 啟用音效（需要用戶互動）
        document.addEventListener('click', () => {
            this.audioManager.enableAudio();
        }, { once: true });
    }

    setInitialTime() {
        const hours = parseInt(this.hoursInput.value) || 0;
        const minutes = parseInt(this.minutesInput.value) || 0;
        const totalSeconds = hours * 3600 + minutes * 60;
        
        if (totalSeconds <= 0) {
            alert('請輸入有效的時間');
            return;
        }
        
        this.timerData.remainingTime = totalSeconds;
        this.timerData.initialTime = totalSeconds;
        this.timerData.isRunning = false;
        this.isFinished = false;
        
        this.saveTimerData(true); // 強制同步重要操作
        this.updateDisplay();
        this.updateStartPauseButton();
    }

    toggleTimer() {
        if (this.timerData.remainingTime <= 0) {
            alert('請先設定初始時間');
            return;
        }
        
        if (this.timerData.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        const currentTime = Date.now();
        this.timerData.isRunning = true;
        this.timerData.startTime = currentTime;
        this.isFinished = false;
        
        // 設定絕對結束時間（解決背景標籤節流問題）
        this.timerData.absoluteStartTime = currentTime;
        this.timerData.absoluteEndTime = Math.floor(currentTime / 1000) + this.timerData.remainingTime;
        
        this.saveTimerData(true); // 強制同步狀態變更
        this.updateStartPauseButton();
        
        // 同步到整秒邊界啟動定時器
        const now = Date.now();
        const msUntilNextSecond = 1000 - (now % 1000);
        
        setTimeout(() => {
            this.updateTimer();
            this.timerInterval = setInterval(() => {
                this.updateTimer();
            }, 1000);
        }, msUntilNextSecond);
    }

    pauseTimer() {
        this.timerData.isRunning = false;
        
        // 計算當前真實剩餘時間並保存
        if (this.timerData.absoluteEndTime) {
            const currentTime = Date.now();
            this.timerData.remainingTime = Math.max(0, this.timerData.absoluteEndTime - Math.floor(currentTime / 1000));
        }
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.saveTimerData(true); // 強制同步狀態變更
        this.updateStartPauseButton();
    }

    resetTimer() {
        this.pauseTimer();
        this.timerData.remainingTime = this.timerData.initialTime || 0;
        this.timerData.startTime = 0;
        this.timerData.absoluteStartTime = 0;
        this.timerData.absoluteEndTime = 0;
        this.isFinished = false;
        this.lastWarningTime = -1;
        
        this.saveTimerData(true); // 強制同步重置操作
        this.updateDisplay();
    }

    updateTimer() {
        const currentTime = Date.now();
        
        // 計算真實剩餘時間（基於絕對時間，不受setInterval影響）
        const actualElapsed = Math.floor((currentTime - this.timerData.absoluteStartTime) / 1000);
        const actualRemainingTime = Math.max(0, this.timerData.absoluteEndTime - Math.floor(currentTime / 1000));
        
        // 性能優化：快取設定值，避免每秒讀取localStorage
        if (!this.cachedSettings || (currentTime - this.settingsCacheTime) > 10000) { // 每10秒更新快取
            this.cachedSettings = Storage.getSettings();
            this.settingsCacheTime = currentTime;
        }
        
        // 檢查是否需要播放警告音
        const warningTime = this.cachedSettings.warningTime;
        if (actualRemainingTime <= warningTime && actualRemainingTime > 0 && this.lastWarningTime !== actualRemainingTime) {
            if (actualRemainingTime % 60 === 0) { // 每分鐘播放一次警告音
                this.audioManager.playWarningSound();
                this.lastWarningTime = actualRemainingTime;
            }
        }
        
        // 檢查是否結束
        if (actualRemainingTime === 0 && !this.isFinished) {
            this.isFinished = true;
            this.timerData.isRunning = false;
            this.timerData.remainingTime = 0;
            this.pauseTimer();
            this.audioManager.playFinishedSound();
            this.saveTimerData(true); // 強制同步
        } else if (actualRemainingTime > 0) {
            // 更新計時器數據
            this.timerData.remainingTime = actualRemainingTime;
            
            // 只在特定情況下才保存數據，避免每秒localStorage寫入
            const shouldSave = (actualElapsed % 10 === 0) || // 每10秒保存一次
                              (actualRemainingTime <= 60 && actualElapsed % 5 === 0) || // 最後1分鐘每5秒保存
                              (actualRemainingTime <= 10); // 最後10秒每秒保存
                              
            if (shouldSave) {
                this.timerData.startTime = currentTime;
                this.saveTimerData();
            }
        }
        
        this.updateDisplay();
    }

    addPoints() {
        const points = parseInt(this.pointsInput.value);
        if (!points || points <= 0) {
            alert('請輸入有效的積分數量');
            return;
        }
        
        this.addTime(points * 60, points); // 1積分 = 1分鐘 = 60秒
        this.pointsInput.value = '';
    }

    addTime(seconds, points = 0) {
        if (seconds === 0) return;
        
        // 如果計時器正在運行，需要更新絕對結束時間
        if (this.timerData.isRunning) {
            const currentTime = Date.now();
            
            // 計算當前實際剩餘時間
            const actualRemainingTime = Math.max(0, this.timerData.absoluteEndTime - Math.floor(currentTime / 1000));
            
            // 更新剩餘時間和絕對結束時間
            this.timerData.remainingTime = Math.max(0, actualRemainingTime + seconds);
            this.timerData.absoluteEndTime = Math.floor(currentTime / 1000) + this.timerData.remainingTime;
            this.timerData.startTime = currentTime;
        } else {
            this.timerData.remainingTime = Math.max(0, this.timerData.remainingTime + seconds);
        }
        
        this.isFinished = false;
        this.saveTimerData(true); // 強制同步時間變更
        
        // 記錄統計
        if (points > 0) {
            Storage.addPointsToStats(points, seconds);
            this.audioManager.playPointsAddedSound();
            this.updateStats();
        } else if (seconds > 0) {
            // 正數但沒有積分（如抖內）
            this.audioManager.playPointsAddedSound();
        }
        
        this.updateDisplay();
    }

    updateDisplay() {
        let displayTime;
        
        if (this.timerData.isRunning && this.timerData.remainingTime > 0) {
            // 使用絕對時間計算，與updateTimer保持一致
            if (this.timerData.absoluteEndTime) {
                const currentTime = Date.now();
                displayTime = Math.max(0, this.timerData.absoluteEndTime - Math.floor(currentTime / 1000));
            } else {
                // 回退到舊邏輯（向後兼容）
                const currentTime = Date.now();
                const elapsed = Math.floor((currentTime - this.timerData.startTime) / 1000);
                displayTime = Math.max(0, this.timerData.remainingTime - elapsed);
            }
        } else {
            displayTime = this.timerData.remainingTime;
        }
        
        const hours = Math.floor(displayTime / 3600);
        const minutes = Math.floor((displayTime % 3600) / 60);
        const seconds = displayTime % 60;
        
        this.timeDisplay.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 更新顏色
        if (displayTime === 0 && (this.isFinished || this.timerData.initialTime > 0)) {
            this.timeDisplay.style.color = '#ffaa00';
        } else if (displayTime <= 300 && displayTime > 0) { // 最後5分鐘
            this.timeDisplay.style.color = '#ff4444';
        } else {
            this.timeDisplay.style.color = '#00ff88';
        }
    }

    updateStats() {
        const stats = Storage.getDailyStats();
        this.totalPointsDisplay.textContent = stats.totalPoints;
        
        const totalHours = Math.floor(stats.totalTimeAdded / 3600);
        const totalMinutes = Math.floor((stats.totalTimeAdded % 3600) / 60);
        const totalSeconds = stats.totalTimeAdded % 60;
        
        this.totalTimeDisplay.textContent = 
            `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`;
    }

    updateStartPauseButton() {
        if (this.timerData.isRunning) {
            this.startPauseBtn.textContent = '暫停';
            this.startPauseBtn.style.backgroundColor = '#ff4444';
        } else {
            this.startPauseBtn.textContent = this.timerData.remainingTime > 0 ? '繼續' : '開始';
            this.startPauseBtn.style.backgroundColor = '#00ff88';
        }
    }

    setObsUrl() {
        // 如果是通過npm伺服器運行，使用/display路由
        if (window.location.origin.includes('127.0.0.1:6969') || window.location.origin.includes('localhost:6969')) {
            this.obsUrlInput.value = `${window.location.origin}/display`;
        } else {
            // 保持原有的靜態文件邏輯
            const displayUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}display.html`;
            this.obsUrlInput.value = displayUrl;
        }
    }

    copyObsUrl() {
        this.obsUrlInput.select();
        document.execCommand('copy');
        
        const originalText = this.copyUrlBtn.textContent;
        this.copyUrlBtn.textContent = '已複製！';
        setTimeout(() => {
            this.copyUrlBtn.textContent = originalText;
        }, 2000);
    }

    // 設定 Twitch 整合
    setupTwitchIntegration() {
        // 載入之前的頻道名稱
        const settings = this.twitchChat.getConnectionStatus();
        if (settings.channelName) {
            this.channelNameInput.value = settings.channelName;
        }

        // 載入層級設定
        this.loadTierSettings();

        // 監聽連接狀態變化
        document.addEventListener('twitchConnectionChange', (event) => {
            this.updateTwitchConnectionUI(event.detail);
        });

        this.updateTwitchConnectionUI(settings);
    }

    // 連接到 Twitch 聊天室
    async connectToTwitchChat() {
        const channelName = this.channelNameInput.value.trim();
        
        if (!channelName) {
            alert('請輸入頻道名稱');
            return;
        }

        // 更新 UI 狀態
        this.updateChatStatus('連接中...', 'connecting');
        this.connectChatBtn.disabled = true;

        try {
            await this.twitchChat.connect(channelName);
            console.log('✅ Twitch 聊天室連接成功');
        } catch (error) {
            console.error('❌ Twitch 聊天室連接失敗:', error);
            alert('連接失敗: ' + error.message);
            this.updateChatStatus('連接失敗', 'disconnected');
        } finally {
            this.connectChatBtn.disabled = false;
        }
    }

    // 斷開 Twitch 聊天室連接
    async disconnectFromTwitchChat() {
        await this.twitchChat.disconnect();
        console.log('🔌 已斷開 Twitch 聊天室連接');
    }

    // 更新 Twitch 連接 UI
    updateTwitchConnectionUI(status) {
        if (status.connected) {
            this.connectChatBtn.style.display = 'none';
            this.disconnectChatBtn.style.display = 'inline-block';
            this.channelNameInput.disabled = true;
            this.updateChatStatus(`已連接到 #${status.channelName}`, 'connected');
        } else {
            this.connectChatBtn.style.display = 'inline-block';
            this.disconnectChatBtn.style.display = 'none';
            this.channelNameInput.disabled = false;
            this.updateChatStatus('未連接', 'disconnected');
        }
    }

    // 更新聊天室狀態顯示
    updateChatStatus(message, status) {
        this.chatStatusDisplay.textContent = message;
        this.chatStatusDisplay.className = `status-indicator ${status}`;
    }

    // 載入層級設定到 UI
    loadTierSettings() {
        const tierSettings = this.twitchChat.getTierSettings();
        this.tier1MinutesInput.value = tierSettings.tier1;
        this.tier2MinutesInput.value = tierSettings.tier2;
        this.tier3MinutesInput.value = tierSettings.tier3;
    }

    // 儲存層級設定
    saveTierSettings() {
        const tier1 = parseInt(this.tier1MinutesInput.value) || 1;
        const tier2 = parseInt(this.tier2MinutesInput.value) || 3;
        const tier3 = parseInt(this.tier3MinutesInput.value) || 5;

        // 驗證輸入值
        if (tier1 < 1 || tier1 > 60 || tier2 < 1 || tier2 > 60 || tier3 < 1 || tier3 > 60) {
            alert('請輸入 1-60 分鐘之間的有效數值');
            return;
        }

        // 更新設定
        this.twitchChat.updateTierSettings(tier1, tier2, tier3);

        // 顯示成功訊息
        const originalText = this.saveTierSettingsBtn.textContent;
        this.saveTierSettingsBtn.textContent = '已儲存！';
        this.saveTierSettingsBtn.style.backgroundColor = '#00ff88';
        
        setTimeout(() => {
            this.saveTierSettingsBtn.textContent = originalText;
            this.saveTierSettingsBtn.style.backgroundColor = '';
        }, 2000);

        console.log(`✅ 層級設定已更新: Tier 1=${tier1}分鐘, Tier 2=${tier2}分鐘, Tier 3=${tier3}分鐘`);
    }

    // 重置層級設定
    resetTierSettings() {
        if (confirm('確定要重置為預設設定嗎？\n(Tier 1=1分鐘, Tier 2=3分鐘, Tier 3=5分鐘)')) {
            this.twitchChat.resetTierSettings();
            this.loadTierSettings();

            // 顯示重置訊息
            const originalText = this.resetTierSettingsBtn.textContent;
            this.resetTierSettingsBtn.textContent = '已重置！';
            this.resetTierSettingsBtn.style.backgroundColor = '#00ff88';
            
            setTimeout(() => {
                this.resetTierSettingsBtn.textContent = originalText;
                this.resetTierSettingsBtn.style.backgroundColor = '';
            }, 2000);

            console.log('🔄 層級設定已重置為預設值');
        }
    }

    // 設定抖內系統
    setupDonationSystem() {
        this.loadDonationSettings();
    }

    // 載入抖內設定
    loadDonationSettings() {
        const settings = this.getDonationSettings();
        this.donationRateInput.value = settings.rate;
        this.minDonationInput.value = settings.minAmount;
        this.maxDonationInput.value = settings.maxTime;
    }

    // 獲取 Bits 設定
    getDonationSettings() {
        const defaultSettings = {
            rate: 0.1,      // 每 Bits = 0.1分鐘
            minAmount: 100, // 最小100 Bits
            maxTime: 30     // 最大30分鐘
        };

        try {
            const stored = localStorage.getItem('twitchTimer_donationSettings');
            return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
        } catch (error) {
            console.error('讀取 Bits 設定失敗:', error);
            return defaultSettings;
        }
    }

    // 儲存 Bits 設定
    saveDonationSettings() {
        const rate = parseFloat(this.donationRateInput.value) || 0.1;
        const minAmount = parseInt(this.minDonationInput.value) || 100;
        const maxTime = parseInt(this.maxDonationInput.value) || 30;

        // 驗證輸入值
        if (rate < 0.01 || rate > 10 || minAmount < 1 || minAmount > 10000 || maxTime < 1 || maxTime > 180) {
            alert('請輸入有效的設定值');
            return;
        }

        const settings = { rate, minAmount, maxTime };
        
        try {
            localStorage.setItem('twitchTimer_donationSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('儲存 Bits 設定失敗:', error);
        }

        // 顯示成功訊息
        const originalText = this.saveDonationSettingsBtn.textContent;
        this.saveDonationSettingsBtn.textContent = '已儲存！';
        this.saveDonationSettingsBtn.style.backgroundColor = '#00ff88';
        
        setTimeout(() => {
            this.saveDonationSettingsBtn.textContent = originalText;
            this.saveDonationSettingsBtn.style.backgroundColor = '';
        }, 2000);

        console.log(`✅ Bits 設定已更新: 每 Bits ${rate}分鐘, 最小${minAmount} Bits, 最大${maxTime}分鐘`);
    }

    // 重置 Bits 設定
    resetDonationSettings() {
        if (confirm('確定要重置 Bits 設定為預設值嗎？\n(每 Bits 0.1分鐘, 最小100 Bits, 最大30分鐘)')) {
            this.donationRateInput.value = 0.1;
            this.minDonationInput.value = 100;
            this.maxDonationInput.value = 30;

            const settings = { rate: 0.1, minAmount: 100, maxTime: 30 };
            localStorage.setItem('twitchTimer_donationSettings', JSON.stringify(settings));

            // 顯示重置訊息
            const originalText = this.resetDonationSettingsBtn.textContent;
            this.resetDonationSettingsBtn.textContent = '已重置！';
            this.resetDonationSettingsBtn.style.backgroundColor = '#00ff88';
            
            setTimeout(() => {
                this.resetDonationSettingsBtn.textContent = originalText;
                this.resetDonationSettingsBtn.style.backgroundColor = '';
            }, 2000);

            console.log('🔄 Bits 設定已重置為預設值');
        }
    }

    // 新增 Bits
    addDonation() {
        const amount = parseInt(this.donationAmountInput.value);
        if (!amount || amount <= 0) {
            alert('請輸入有效的 Bits 數量');
            return;
        }

        const settings = this.getDonationSettings();
        
        // 檢查最小數量
        if (amount < settings.minAmount) {
            alert(`最小 Bits 數量為 ${settings.minAmount} Bits`);
            return;
        }

        // 計算時間（分鐘）
        let minutes = Math.floor(amount * settings.rate);
        
        // 檢查最大時間限制
        if (minutes > settings.maxTime) {
            minutes = settings.maxTime;
            alert(`單次最大增加時間為 ${settings.maxTime} 分鐘`);
        }

        // 新增時間
        this.addTime(minutes * 60); // 轉換為秒數
        
        // 清除輸入框
        this.donationAmountInput.value = '';

        // 顯示成功訊息
        const originalText = this.addDonationBtn.textContent;
        this.addDonationBtn.textContent = `已新增${minutes}分鐘！`;
        
        setTimeout(() => {
            this.addDonationBtn.textContent = originalText;
        }, 2000);

        console.log(`🎁 收到 ${amount} Bits，增加 ${minutes} 分鐘時間`);
    }
}

// 當頁面載入完成時初始化
document.addEventListener('DOMContentLoaded', () => {
    window.overtimeTimer = new TwitchOvertimeTimer();
});