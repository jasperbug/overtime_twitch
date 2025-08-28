// 簡化的 Twitch 聊天室監聽器
class TwitchChatListener {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.channelName = '';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // 預設訂閱積分規則 (分鐘)
        this.defaultSubscriptionPoints = {
            '1000': 1,  // Tier 1 = 1 分鐘
            '2000': 3,  // Tier 2 = 3 分鐘  
            '3000': 5   // Tier 3 = 5 分鐘
        };
        
        this.subscriptionPoints = { ...this.defaultSubscriptionPoints };
        
        // 預設 Bits 設定
        this.defaultBitsSettings = {
            rate: 0.1,      // 每 Bits = 0.1分鐘
            minAmount: 100, // 最小100 Bits
            maxTime: 30     // 最大30分鐘
        };
        
        this.loadSettings();
    }

    // 載入設定
    loadSettings() {
        const saved = localStorage.getItem('twitchChatSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.channelName = settings.channelName || '';
        }
        
        // 載入層級積分設定
        const tierSettings = localStorage.getItem('twitchTierSettings');
        if (tierSettings) {
            const tiers = JSON.parse(tierSettings);
            this.subscriptionPoints = {
                '1000': tiers.tier1 || 1,
                '2000': tiers.tier2 || 3,
                '3000': tiers.tier3 || 5
            };
        }
    }

    // 儲存設定
    saveSettings() {
        localStorage.setItem('twitchChatSettings', JSON.stringify({
            channelName: this.channelName
        }));
    }

    // 更新層級積分設定
    updateTierSettings(tier1, tier2, tier3) {
        this.subscriptionPoints = {
            '1000': tier1,
            '2000': tier2,
            '3000': tier3
        };
        
        localStorage.setItem('twitchTierSettings', JSON.stringify({
            tier1: tier1,
            tier2: tier2,
            tier3: tier3
        }));
        
        console.log('🔧 層級積分設定已更新:', this.subscriptionPoints);
    }

    // 重置層級積分為預設值
    resetTierSettings() {
        this.subscriptionPoints = { ...this.defaultSubscriptionPoints };
        localStorage.removeItem('twitchTierSettings');
        console.log('🔄 層級積分設定已重置為預設值');
    }

    // 獲取目前層級設定
    getTierSettings() {
        return {
            tier1: this.subscriptionPoints['1000'],
            tier2: this.subscriptionPoints['2000'],
            tier3: this.subscriptionPoints['3000']
        };
    }

    // 連接到 Twitch IRC (匿名)
    async connect(channelName) {
        if (this.isConnected) {
            await this.disconnect();
        }

        this.channelName = channelName.toLowerCase().replace('#', '');
        this.saveSettings();

        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
                
                this.socket.onopen = () => {
                    console.log('🔗 連接到 Twitch IRC...');
                    
                    // 匿名連接序列
                    this.socket.send('PASS SCHMOOPIIE');
                    this.socket.send('NICK justinfan12345'); // 匿名用戶名
                    this.socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
                    this.socket.send(`JOIN #${this.channelName}`);
                };
                
                this.socket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };
                
                this.socket.onclose = (event) => {
                    this.isConnected = false;
                    console.log('🔌 Twitch IRC 連接已關閉');
                    
                    // 如果不是主動關閉，嘗試重連
                    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                        console.log(`⏳ ${5}秒後嘗試重連... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
                        setTimeout(() => {
                            this.reconnectAttempts++;
                            this.connect(this.channelName);
                        }, 5000);
                    }
                };
                
                this.socket.onerror = (error) => {
                    console.error('❌ Twitch IRC 連接錯誤:', error);
                    reject(error);
                };
                
                // 5秒內沒連上就算失敗
                setTimeout(() => {
                    if (!this.isConnected) {
                        reject(new Error('連接超時'));
                    }
                }, 5000);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    // 處理收到的訊息
    handleMessage(rawMessage) {
        // 處理 PING
        if (rawMessage.startsWith('PING')) {
            this.socket.send('PONG :tmi.twitch.tv');
            return;
        }
        
        // 檢查是否成功加入頻道
        if (rawMessage.includes('End of /NAMES list')) {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log(`✅ 成功連接到 #${this.channelName}`);
            this.notifyConnectionStatus(true);
            return;
        }

        // 解析 IRC 訊息
        const message = this.parseIRCMessage(rawMessage);
        if (message && message.command === 'USERNOTICE') {
            this.handleUserNotice(message);
        } else if (message && message.command === 'PRIVMSG') {
            // 檢查是否為 Bits 訊息
            this.handleBitsMessage(message);
        }
    }

    // 解析 IRC 訊息
    parseIRCMessage(rawMessage) {
        const parts = rawMessage.trim().split(' ');
        if (parts.length < 3) return null;

        const message = {
            tags: {},
            source: '',
            command: '',
            channel: '',
            text: ''
        };

        let index = 0;

        // 解析 tags (@key=value;key2=value2)
        if (parts[0].startsWith('@')) {
            const tagString = parts[0].substring(1);
            tagString.split(';').forEach(tag => {
                const [key, value] = tag.split('=');
                message.tags[key] = value || '';
            });
            index++;
        }

        // 解析 source (:nick!user@host)
        if (parts[index] && parts[index].startsWith(':')) {
            message.source = parts[index].substring(1);
            index++;
        }

        // 解析 command
        if (parts[index]) {
            message.command = parts[index];
            index++;
        }

        // 解析 channel
        if (parts[index]) {
            message.channel = parts[index];
            index++;
        }

        // 解析 message text
        if (parts[index] && parts[index].startsWith(':')) {
            message.text = parts.slice(index).join(' ').substring(1);
        }

        return message;
    }

    // 處理 USERNOTICE (系統通知)
    handleUserNotice(message) {
        const tags = message.tags;
        const msgId = tags['msg-id'];
        
        console.log('📬 收到系統通知:', msgId, tags);

        // 檢查是否為訂閱相關事件
        if (msgId === 'sub' || msgId === 'resub') {
            // 新訂閱或續訂
            this.handleSubscription(tags);
        } else if (msgId === 'subgift') {
            // 單個禮物訂閱
            this.handleGiftSubscription(tags);
        } else if (msgId === 'submysterygift') {
            // 神秘禮物訂閱
            this.handleMysteryGiftSubscription(tags);
        }
    }

    // 處理 Bits 訊息
    handleBitsMessage(message) {
        const tags = message.tags;
        const bits = parseInt(tags.bits);
        
        // 只處理有 Bits 的訊息
        if (!bits || bits <= 0) {
            return;
        }
        
        console.log(`🎁 收到 Bits! 數量: ${bits}`);
        
        // 獲取 Bits 設定
        const bitsSettings = this.getBitsSettings();
        
        // 檢查最小數量
        if (bits < bitsSettings.minAmount) {
            console.log(`⚠️ Bits 數量 ${bits} 小於最小值 ${bitsSettings.minAmount}，跳過處理`);
            return;
        }
        
        // 計算時間（分鐘）
        let minutes = Math.floor(bits * bitsSettings.rate);
        
        // 檢查最大時間限制
        if (minutes > bitsSettings.maxTime) {
            minutes = bitsSettings.maxTime;
            console.log(`⚠️ 計算時間 ${Math.floor(bits * bitsSettings.rate)} 分鐘超過上限，限制為 ${minutes} 分鐘`);
        }
        
        // 添加時間到計時器
        this.addBitsToTimer(minutes, bits, tags['display-name'] || '匿名');
    }

    // 獲取 Bits 設定
    getBitsSettings() {
        try {
            const stored = localStorage.getItem('twitchTimer_donationSettings');
            return stored ? 
                { ...this.defaultBitsSettings, ...JSON.parse(stored) } : 
                this.defaultBitsSettings;
        } catch (error) {
            console.error('讀取 Bits 設定失敗:', error);
            return this.defaultBitsSettings;
        }
    }

    // 添加 Bits 時間到計時器
    addBitsToTimer(minutes, bits, username) {
        if (window.overtimeTimer) {
            const seconds = minutes * 60; // 轉換為秒
            window.overtimeTimer.addTime(seconds, 0); // 不算積分統計，只增加時間
            
            // 顯示通知
            this.showNotification(`+${minutes} 分鐘`, `${username} 贈送 ${bits} Bits`);
            
            // 播放音效
            if (window.overtimeTimer.audioManager) {
                window.overtimeTimer.audioManager.playPointsAddedSound();
            }
            
            console.log(`🎁 ${username} 贈送 ${bits} Bits，增加 ${minutes} 分鐘時間`);
        }
    }

    // 處理一般訂閱 (新訂閱/續訂)
    handleSubscription(tags) {
        const subPlan = tags['msg-param-sub-plan'] || '1000';
        const points = this.subscriptionPoints[subPlan] || 1;
        
        console.log(`🎉 偵測到訂閱! Tier: ${subPlan}, 積分: ${points}`);
        
        this.addPointsToTimer(points, '訂閱');
    }

    // 處理禮物訂閱
    handleGiftSubscription(tags) {
        const subPlan = tags['msg-param-sub-plan'] || '1000';
        const points = this.subscriptionPoints[subPlan] || 1;
        
        console.log(`🎁 偵測到禮物訂閱! Tier: ${subPlan}, 積分: ${points}`);
        
        this.addPointsToTimer(points, '禮物訂閱');
    }

    // 處理神秘禮物訂閱
    handleMysteryGiftSubscription(tags) {
        const subPlan = tags['msg-param-sub-plan'] || '1000';
        const giftCount = parseInt(tags['msg-param-mass-gift-count']) || 1;
        const pointsPerGift = this.subscriptionPoints[subPlan] || 1;
        const totalPoints = pointsPerGift * giftCount;
        
        console.log(`🎁✨ 偵測到神秘禮物! 數量: ${giftCount}, 總積分: ${totalPoints}`);
        
        this.addPointsToTimer(totalPoints, `${giftCount}個禮物訂閱`);
    }

    // 添加積分到計時器
    addPointsToTimer(points, source) {
        if (window.overtimeTimer) {
            const seconds = points * 60; // 轉換為秒
            window.overtimeTimer.addTime(seconds, points);
            
            // 顯示通知
            this.showNotification(`+${points} 分鐘`, `來自${source}`);
            
            // 播放音效
            if (window.overtimeTimer.audioManager) {
                window.overtimeTimer.audioManager.playPointsAddedSound();
            }
        }
    }

    // 顯示通知
    showNotification(title, message) {
        const notification = document.createElement('div');
        notification.className = 'twitch-notification';
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // 通知連接狀態變化
    notifyConnectionStatus(connected) {
        const event = new CustomEvent('twitchConnectionChange', {
            detail: { connected, channelName: this.channelName }
        });
        document.dispatchEvent(event);
    }

    // 斷開連接
    async disconnect() {
        if (this.socket) {
            this.socket.close(1000, '手動斷開'); // 1000 = 正常關閉
            this.socket = null;
        }
        this.isConnected = false;
        this.reconnectAttempts = 0;
        
        console.log('🔌 已斷開 Twitch 連接');
        this.notifyConnectionStatus(false);
    }

    // 檢查連接狀態
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            channelName: this.channelName
        };
    }
}