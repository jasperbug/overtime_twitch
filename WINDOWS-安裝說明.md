# Windows 安裝與使用說明

## 🚀 快速開始

### 方法一：使用批處理文件（推薦）
1. **下載並解壓** `twitch-overtime-timer-v3.3.2.zip`
2. **安裝 Node.js**：訪問 https://nodejs.org/ 下載並安裝 LTS 版本
3. **雙擊執行** `start-windows.bat`
4. **自動完成**：批處理文件會自動安裝依賴並啟動服務器

### 方法二：手動安裝
1. 解壓到任意目錄
2. 開啟命令提示字元（cmd）
3. 切換到程式目錄：`cd C:\path\to\twitch-overtime-timer`
4. 安裝依賴：`npm install`
5. 啟動程式：`npm start`

## 🖥️ 訪問地址

程式啟動後，在瀏覽器中開啟：
- **控制面板**: http://127.0.0.1:6969/
- **OBS顯示頁面**: http://127.0.0.1:6969/display  
- **Debug工具**: http://127.0.0.1:6969/debug

## 🛠️ 系統需求

- **Windows 10 或更高版本**
- **Node.js 16 或更高版本** (從 https://nodejs.org/ 下載)
- **現代瀏覽器**: Chrome, Firefox, Edge
- **網路連接** (用於 Twitch 整合功能)

## 🎮 OBS 設定

1. **新增 Browser Source**
2. **URL**: `http://127.0.0.1:6969/display`
3. **寬度**: 1920, **高度**: 1080
4. **勾選**: 關閉來源時關機、重新整理瀏覽器當場景啟用時

## 🔧 常見問題

### Q: 雙擊批處理文件沒有反應？
A: 請確認已安裝 Node.js，並以管理員身分執行批處理文件。

### Q: 瀏覽器顯示「無法連接」？
A: 確認命令提示字元視窗仍在執行，且顯示「伺服器已啟動」訊息。

### Q: OBS 顯示 00:00:00？
A: 確認服務器正在運行，並在控制面板中設定初始時間後點擊「開始」。

### Q: 如何停止程式？
A: 在命令提示字元視窗中按 `Ctrl+C`，或直接關閉視窗。

## 📞 技術支援

如遇到問題，請提供：
1. Windows 版本
2. Node.js 版本（執行 `node --version`）
3. 錯誤訊息截圖
4. 在 GitHub Issues 中回報：https://github.com/jasperbug/overtime_twitch/issues

---
**祝直播愉快！** 🎮✨