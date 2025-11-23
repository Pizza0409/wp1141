# 環境變數設定說明

請在專案根目錄建立 `.env.local` 檔案，並填入以下環境變數：

## 必要環境變數

### Line Messaging API

```bash
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
```

**取得方式：**
1. 前往 [Line Developers Console](https://developers.line.biz/console/)
2. 建立 Provider 和 Channel（選擇 Messaging API）
3. 在 Channel 設定中取得 Channel Access Token 和 Channel Secret

### OpenAI API

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo
```

**取得方式：**
1. 前往 [OpenAI Platform](https://platform.openai.com/)
2. 建立帳號並登入
3. 前往 API Keys 頁面建立新的 API Key
4. `OPENAI_MODEL` 可選，預設為 `gpt-3.5-turbo`，也可使用 `gpt-4`

### MongoDB Atlas

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**取得方式：**
1. 前往 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 建立免費帳號（Free Tier）
3. 建立 Cluster
4. 建立資料庫使用者（Database Access）
5. 設定網路存取（Network Access），允許所有 IP 或特定 IP
6. 點擊 "Connect" → "Connect your application"
7. 複製連接字串並替換 `<password>` 和 `<dbname>`

### 應用程式 URL（部署後）

```bash
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**說明：**
- 本地開發時可設為 `http://localhost:3000`
- 部署到 Vercel 後設為實際的 Vercel URL

## 完整範例

```bash
# Line Messaging API
LINE_CHANNEL_ACCESS_TOKEN=1234567890abcdefghijklmnopqrstuvwxyz
LINE_CHANNEL_SECRET=abcdefghijklmnopqrstuvwxyz1234567890

# OpenAI API
OPENAI_API_KEY=sk-1234567890abcdefghijklmnopqrstuvwxyz
OPENAI_MODEL=gpt-3.5-turbo

# MongoDB Atlas
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/expensebot?retryWrites=true&w=majority

# Application URL
NEXT_PUBLIC_APP_URL=https://my-expense-bot.vercel.app
```

## 注意事項

1. **安全性**：永遠不要將 `.env.local` 檔案提交到 Git
2. **Vercel 部署**：在 Vercel Dashboard 的 Environment Variables 中設定所有環境變數
3. **本地開發**：確保 `.env.local` 檔案在專案根目錄
4. **變數名稱**：確保變數名稱完全正確，大小寫敏感

## 驗證設定

設定完成後，可以執行以下命令驗證：

```bash
npm run dev
```

如果環境變數設定正確，應用程式應該能正常啟動。如果有錯誤，請檢查：
- 環境變數名稱是否正確
- 值是否正確（沒有多餘的空格或引號）
- MongoDB URI 中的密碼是否正確編碼（特殊字元需要 URL 編碼）


