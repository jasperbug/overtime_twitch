# OBS 故障排除指南

## 🔍 問題：OBS 顯示 00:00:00，但瀏覽器顯示正常

### 原因分析
OBS Browser Source 使用獨立的 Chromium 進程，不會與你的主瀏覽器共享 localStorage 數據。

### ✅ 解決方案

我們已經實現了**服務器端狀態同步**來解決這個問題：

#### 1. 確保服務器運行
```bash
npm start
```

#### 2. 檢查服務器狀態
- 訪問 http://127.0.0.1:6969/api/timer
- 應該看到 JSON 格式的計時器狀態

#### 3. OBS Browser Source 設定
```
URL: http://127.0.0.1:6969/display
寬度: 1920
高度: 1080
```

#### 4. 測試步驟
1. 在控制面板設定5分鐘計時器並開始
2. 檢查瀏覽器：http://127.0.0.1:6969/display （應該正常倒數）
3. 檢查OBS Browser Source（現在應該也會倒數）

## 🔧 Debug 檢查清單

### 控制台訊息檢查
在 OBS Browser Source 中按 F12（或設定中勾選「檢查」）：

**應該看到：**
```
✅ 使用服務器API模式（解決OBS同步問題）
```

**如果看到：**
```
📂 使用localStorage模式
```
表示無法連接服務器，檢查：
1. `npm start` 是否正在運行
2. URL是否正確：`http://127.0.0.1:6969/display`

### API 測試
在瀏覽器訪問：http://127.0.0.1:6969/api/timer

**正常回應範例：**
```json
{
  "remainingTime": 300,
  "isRunning": true,
  "startTime": 1234567890123,
  "initialTime": 300,
  "actualRemainingTime": 298,
  "serverTime": 1234567892123
}
```

## 🚨 常見問題

### Q1: OBS 仍然顯示 00:00:00
**解決步驟：**
1. 確保 `npm start` 正在運行
2. 刪除並重新建立 OBS Browser Source
3. 確保 URL 是 `http://127.0.0.1:6969/display`
4. 在 OBS 中右鍵 Browser Source → 重新整理

### Q2: 控制台顯示網路錯誤
**可能原因：**
- 服務器未啟動
- 端口 6969 被佔用
- 防火牆阻擋

**解決方法：**
```bash
# 檢查端口是否被佔用
lsof -i :6969

# 重新啟動服務器
npm start
```

### Q3: 計時器不同步
**解決步驟：**
1. 在控制面板重新設定時間
2. 等待 1-2 秒讓同步完成
3. 檢查 OBS Browser Source

### Q4: Debug 資訊顯示
在 display 頁面按 `D` 鍵可以顯示/隱藏 debug 資訊：
```
剩餘: 298s
初始: 300s  
運行: true
顯示: 298s
時間到: false
```

## 🛠️ 高級故障排除

### 手動 API 測試
```bash
# 測試獲取狀態
curl http://127.0.0.1:6969/api/timer

# 測試設定狀態
curl -X POST http://127.0.0.1:6969/api/timer \
  -H "Content-Type: application/json" \
  -d '{"remainingTime":300,"isRunning":true,"startTime":1234567890123,"initialTime":300}'
```

### OBS Browser Source 設定檢查
確保以下設定：
- [x] 勾選「關閉來源時關機」
- [x] 勾選「重新整理瀏覽器當場景啟用時」
- [ ] 不要勾選「隱藏時控制音訊」（除非需要）

### 重置所有狀態
如果問題持續，訪問：http://127.0.0.1:6969/debug
點擊「清除所有數據」重新開始。

## 📞 仍然有問題？

1. 檢查 npm start 的控制台輸出
2. 檢查 OBS Browser Source 的控制台（F12）
3. 確保沒有其他程式佔用 6969 端口
4. 重新啟動 OBS

---
**💡 提示：** 新的服務器同步機制會自動處理 OBS 和瀏覽器之間的狀態同步問題！