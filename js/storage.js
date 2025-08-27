// localStorage 管理模組
class Storage {
    static KEYS = {
        TIMER_DATA: 'twitchTimer_data',
        DAILY_STATS: 'twitchTimer_dailyStats',
        SETTINGS: 'twitchTimer_settings'
    };

    // 獲取計時器數據
    static getTimerData() {
        const defaultData = {
            remainingTime: 0, // 剩餘秒數
            isRunning: false,
            startTime: 0,
            initialTime: 0
        };
        
        try {
            const stored = localStorage.getItem(this.KEYS.TIMER_DATA);
            return stored ? { ...defaultData, ...JSON.parse(stored) } : defaultData;
        } catch (error) {
            console.error('讀取計時器數據失敗:', error);
            return defaultData;
        }
    }

    // 保存計時器數據
    static saveTimerData(data) {
        try {
            localStorage.setItem(this.KEYS.TIMER_DATA, JSON.stringify(data));
        } catch (error) {
            console.error('保存計時器數據失敗:', error);
        }
    }

    // 獲取今日統計
    static getDailyStats() {
        const today = new Date().toDateString();
        const defaultStats = {
            date: today,
            totalPoints: 0,
            totalTimeAdded: 0, // 總增加的秒數
            sessions: []
        };

        try {
            const stored = localStorage.getItem(this.KEYS.DAILY_STATS);
            const stats = stored ? JSON.parse(stored) : defaultStats;
            
            // 如果是新的一天，重置統計
            if (stats.date !== today) {
                return defaultStats;
            }
            
            return stats;
        } catch (error) {
            console.error('讀取每日統計失敗:', error);
            return defaultStats;
        }
    }

    // 保存今日統計
    static saveDailyStats(stats) {
        try {
            stats.date = new Date().toDateString();
            localStorage.setItem(this.KEYS.DAILY_STATS, JSON.stringify(stats));
        } catch (error) {
            console.error('保存每日統計失敗:', error);
        }
    }

    // 添加積分記錄
    static addPointsToStats(points, timeAdded) {
        const stats = this.getDailyStats();
        stats.totalPoints += points;
        stats.totalTimeAdded += timeAdded;
        stats.sessions.push({
            timestamp: Date.now(),
            points: points,
            timeAdded: timeAdded
        });
        this.saveDailyStats(stats);
    }

    // 獲取設定
    static getSettings() {
        const defaultSettings = {
            soundEnabled: true,
            warningTime: 300, // 5分鐘警告
            autoSave: true
        };

        try {
            const stored = localStorage.getItem(this.KEYS.SETTINGS);
            return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
        } catch (error) {
            console.error('讀取設定失敗:', error);
            return defaultSettings;
        }
    }

    // 保存設定
    static saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
        } catch (error) {
            console.error('保存設定失敗:', error);
        }
    }

    // 清除所有數據
    static clearAll() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (error) {
            console.error('清除數據失敗:', error);
        }
    }
}