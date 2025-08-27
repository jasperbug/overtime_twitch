// 音效管理模組
class AudioManager {
    constructor() {
        this.sounds = {};
        this.settings = Storage.getSettings();
        this.initializeSounds();
    }

    // 初始化音效
    initializeSounds() {
        // 使用 Web Audio API 生成簡單的提示音
        this.audioContext = null;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('音效功能不可用:', error);
        }
    }

    // 播放積分增加音效
    playPointsAddedSound() {
        if (!this.settings.soundEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 正面的提示音：上升音階
            oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.type = 'sine';
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (error) {
            console.warn('播放積分音效失敗:', error);
        }
    }

    // 播放警告音效
    playWarningSound() {
        if (!this.settings.soundEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 警告音：重複的高音
            oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5
            
            gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime + 0.4);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
            
            oscillator.type = 'square';
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.6);
        } catch (error) {
            console.warn('播放警告音效失敗:', error);
        }
    }

    // 播放結束音效
    playFinishedSound() {
        if (!this.settings.soundEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 結束音：下降音階
            oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(392.00, this.audioContext.currentTime + 0.2); // G4
            oscillator.frequency.setValueAtTime(261.63, this.audioContext.currentTime + 0.4); // C4
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
            
            oscillator.type = 'triangle';
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.8);
        } catch (error) {
            console.warn('播放結束音效失敗:', error);
        }
    }

    // 更新設定
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        Storage.saveSettings(this.settings);
    }

    // 啟用音效（需要用戶互動才能啟動音效上下文）
    enableAudio() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}