# 部署指南

本文件說明如何將 Line Bot AI 記帳系統部署到 Vercel。

## 前置準備

### 1. MongoDB Atlas 設定

1. 前往 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 建立免費帳號（Free Tier）
3. 建立新的 Cluster
4. 建立資料庫使用者（Database Access）
5. 設定網路存取（Network Access），允許所有 IP 或特定 IP
6. 取得連接字串（Connection String）
   - 格式：`mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

### 2. Line Developer Console 設定

1. 前往 [Line Developers Console](https://developers.line.biz/console/)
2. 登入或註冊帳號
3. 建立新的 Provider（如果還沒有）
4. 建立新的 Channel，選擇 "Messaging API"
5. 記錄以下資訊：
   - Channel Access Token
   - Channel Secret
6. 在 Channel 設定中：
   - 啟用 "Use webhook"
   - 稍後設定 Webhook URL（部署後）

### 3. OpenAI API 設定

1. 前往 [OpenAI Platform](https://platform.openai.com/)
2. 建立帳號並登入
3. 前往 API Keys 頁面
4. 建立新的 API Key
5. 記錄 API Key（只會顯示一次，請妥善保存）

## Vercel 部署步驟

### 方法一：透過 Vercel CLI

1. **安裝 Vercel CLI**

```bash
npm i -g vercel
```

2. **登入 Vercel**

```bash
vercel login
```

3. **部署專案**

```bash
cd /path/to/hw6
vercel
```

4. **設定環境變數**

在 Vercel Dashboard 中：
- 前往專案設定（Project Settings）
- 選擇 Environment Variables
- 新增以下變數：

```
LINE_CHANNEL_ACCESS_TOKEN=your_token
LINE_CHANNEL_SECRET=your_secret
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-3.5-turbo
MONGODB_URI=your_mongodb_uri
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

5. **重新部署**

```bash
vercel --prod
```

### 方法二：透過 GitHub

1. **推送程式碼到 GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

2. **連接 Vercel**

- 前往 [Vercel Dashboard](https://vercel.com/dashboard)
- 點擊 "Add New Project"
- 選擇 GitHub repository
- 設定專案名稱
- 在 Environment Variables 中新增所有環境變數
- 點擊 Deploy

3. **等待部署完成**

部署完成後，Vercel 會提供一個 URL（例如：`https://your-app.vercel.app`）

## Line Webhook 設定

1. **取得部署 URL**

部署完成後，記錄 Vercel 提供的 URL。

2. **設定 Webhook URL**

- 前往 Line Developers Console
- 選擇你的 Channel
- 前往 "Messaging API" 頁籤
- 在 "Webhook URL" 欄位輸入：`https://your-app.vercel.app/api/line`
- 點擊 "Update"
- 點擊 "Verify" 驗證連線

3. **啟用 Webhook**

- 確保 "Use webhook" 選項已啟用
- 在 "Webhook events" 中選擇要接收的事件：
  - `message`（必要）
  - `follow`（可選）
  - `unfollow`（可選）

## 測試部署

### 1. 測試 Webhook

在 Line Developers Console 中點擊 "Verify" 按鈕，應該會顯示 "Success"。

### 2. 測試 Bot

1. 在 Line 中搜尋你的 Bot（使用 Channel 的 QR Code 或 ID）
2. 加入好友
3. 發送測試訊息：`午餐 50`
4. 應該會收到確認訊息

### 3. 測試管理後台

1. 訪問 `https://your-app.vercel.app/admin`
2. 應該能看到對話紀錄和統計資料

## 常見問題

### Webhook 驗證失敗

- 檢查 Webhook URL 是否正確
- 確認 Vercel 部署已成功
- 檢查環境變數是否正確設定
- 查看 Vercel 的 Function Logs

### MongoDB 連接失敗

- 檢查 MongoDB Atlas 的網路存取設定
- 確認連接字串格式正確
- 檢查資料庫使用者權限

### OpenAI API 錯誤

- 確認 API Key 正確
- 檢查 API 配額是否足夠
- 查看 OpenAI Dashboard 的使用情況

### 環境變數未生效

- 在 Vercel 中重新部署專案
- 確認環境變數名稱正確
- 檢查是否有拼寫錯誤

## 監控與維護

### Vercel 監控

- 在 Vercel Dashboard 中查看：
  - Function Logs
  - Analytics
  - Errors

### 日誌查看

所有日誌都會輸出到 Vercel 的 Function Logs，可以在 Dashboard 中查看。

### 更新部署

每次推送程式碼到 GitHub 時，Vercel 會自動重新部署。也可以手動觸發：

```bash
vercel --prod
```

## 安全建議

1. **環境變數安全**
   - 永遠不要將 `.env.local` 提交到 Git
   - 使用 Vercel 的環境變數功能管理敏感資訊

2. **API 金鑰管理**
   - 定期輪換 API 金鑰
   - 使用最小權限原則

3. **MongoDB 安全**
   - 限制網路存取 IP
   - 使用強密碼
   - 定期備份資料

4. **Line Channel 安全**
   - 保護 Channel Secret
   - 定期檢查 Webhook 設定

## 支援

如有問題，請檢查：
- Vercel Function Logs
- Line Developers Console 的 Webhook 狀態
- MongoDB Atlas 的連接狀態
- OpenAI API 的使用情況


