# Chatbot 測試指南

本文件說明如何測試 chatbot 是否正常運作。

## 📋 目錄

1. [環境檢查](#環境檢查)
2. [測試方法](#測試方法)
3. [OpenAI Credit 說明](#openai-credit-說明)
4. [功能測試](#功能測試)
5. [常見問題](#常見問題)

## 🔍 環境檢查

### 1. 確認環境變數設定

確保 `.env.local` 檔案已正確設定：

```bash
# 必要環境變數
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo  # 可選，預設為 gpt-3.5-turbo
MONGODB_URI=mongodb+srv://...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. 安裝依賴

```bash
npm install
```

### 3. 安裝測試工具（可選）

如果需要執行測試腳本，安裝 `tsx`：

```bash
npm install -D tsx
```

## 🧪 測試方法

### 方法一：使用測試腳本（推薦）

這是最簡單的測試方法，可以快速驗證 OpenAI API 連接和基本功能：

```bash
npx tsx scripts/test-chatbot.ts
```

測試腳本會執行：
- ✅ OpenAI API 連接測試
- ✅ 記帳訊息解析測試
- ✅ 對話回應生成測試

### 方法二：啟動開發伺服器並測試

1. **啟動開發伺服器**

```bash
npm run dev
```

伺服器會在 `http://localhost:3000` 啟動。

2. **測試 Webhook 端點**

使用 curl 或 Postman 測試 webhook：

```bash
# 測試 GET 端點（應該返回 { "status": "ok" }）
curl http://localhost:3000/api/webhook
```

3. **透過 Line Bot 測試**

- 在 Line Developers Console 設定 Webhook URL 為 `https://your-ngrok-url.ngrok.io/api/webhook`
- 使用 ngrok 將本地伺服器暴露到公網：
  ```bash
  ngrok http 3000
  ```
- 在 Line 中發送訊息給你的 Bot

### 方法三：使用管理後台

1. 啟動開發伺服器
2. 訪問 `http://localhost:3000/admin`
3. 查看對話記錄和統計資料

## 💰 OpenAI Credit 說明

### 是否會消耗 Credit？

**是的**，每次使用 chatbot 都會消耗 OpenAI 的 credit：

1. **記帳訊息解析**：每次解析記帳訊息（如「午餐 50」）會調用一次 OpenAI API
2. **對話回應生成**：當使用者發送非記帳相關訊息時，會調用 OpenAI API 生成回應

### 費用估算

使用 `gpt-3.5-turbo` 模型（預設）：
- **輸入 tokens**：約 $0.50 / 1M tokens
- **輸出 tokens**：約 $1.50 / 1M tokens

**範例**：
- 解析一條記帳訊息：約 $0.0001 - $0.0005
- 生成一條對話回應：約 $0.0001 - $0.0005

**建議**：
- 使用 `gpt-3.5-turbo` 較為經濟實惠
- 可以在 OpenAI Dashboard 設定使用量限制
- 定期檢查使用量和費用

### 查看使用量

1. 前往 [OpenAI Dashboard](https://platform.openai.com/usage)
2. 查看 API 使用量和費用
3. 設定使用量警告

## 🎯 功能測試

### 1. 記帳功能測試

發送以下訊息測試記帳功能：

```
午餐 50
今天晚餐花了100元
星巴克 120
買了一台筆電 30000
健身房月費 1500
```

**預期結果**：
- Bot 應該正確解析類別、細節和金額
- 回覆確認訊息（如：「✅ 已記錄：餐點 - 午餐 $50」）

### 2. 查詢功能測試

```
這個月花了多少
今天的記錄
統計
```

**預期結果**：
- 顯示本月統計資料
- 顯示今日所有記帳記錄

### 3. 對話功能測試

```
你好
謝謝
幫我記錄一下今天的支出
```

**預期結果**：
- Bot 使用 LLM 生成友善的回應
- 回應應該與上下文相關

### 4. 項目管理測試

```
新增項目：交通
新增項目：醫療
```

**預期結果**：
- 成功新增自訂類別
- 之後的記帳可以使用新類別

## 🔧 增強功能說明

### 已實現的增強功能

1. **詳細的 Prompt 規則**
   - 明確的類別判斷規則
   - 詳細的提取規則
   - 錯誤處理指引

2. **對話歷史上下文**
   - Bot 會記住最近 10 條對話
   - 提供更連貫的對話體驗
   - 根據歷史調整回應

3. **統計資料上下文**
   - 在生成回應時提供使用者記帳統計
   - 讓 Bot 能回答更準確的問題

### Prompt 規則說明

系統已設定以下規則來提高準確性：

1. **類別判斷規則**：
   - 餐點：早餐、午餐、晚餐等
   - 飲品：咖啡、茶、飲料等
   - 交通：捷運、公車、計程車等
   - ...（更多規則見 `lib/services/openaiService.ts`）

2. **金額提取規則**：
   - 支援多種格式：50、50元、50塊等
   - 必須是正數
   - 如果無法提取，設為 0

3. **細節描述規則**：
   - 提取具體描述，不要重複類別名稱
   - 例如：「午餐 50」→ detail: "午餐"（不是「餐點」）

## ❓ 常見問題

### Q1: 測試腳本執行失敗，顯示「未設定 OPENAI_API_KEY」

**A**: 確認 `.env.local` 檔案存在且包含 `OPENAI_API_KEY`。注意：
- 檔案名稱必須是 `.env.local`（不是 `.env`）
- 檔案必須在專案根目錄
- 重新啟動開發伺服器以載入環境變數

### Q2: OpenAI API 返回「配額不足」錯誤

**A**: 
- 檢查 OpenAI 帳戶餘額
- 確認 API Key 有效
- 可以在 OpenAI Dashboard 查看使用量和限制

### Q3: 記帳解析不準確

**A**: 
- 系統已設定詳細的 prompt 規則
- 如果仍有問題，可以：
  1. 檢查對話歷史是否正確傳遞
  2. 調整 `lib/services/openaiService.ts` 中的 prompt
  3. 使用更明確的記帳格式（如：「午餐 50」）

### Q4: 如何減少 OpenAI API 調用次數？

**A**: 
- 系統已有降級機制：當 LLM 失敗時會使用規則解析
- 可以調整 `messageParser.ts` 中的判斷邏輯，減少不必要的 LLM 調用
- 對於簡單的記帳訊息（如「午餐 50」），可以優先使用規則解析

### Q5: 如何測試而不消耗太多 Credit？

**A**: 
- 使用測試腳本進行基本測試
- 在本地環境測試，避免在生產環境大量測試
- 使用 `gpt-3.5-turbo` 而非 `gpt-4`（更便宜）
- 設定 OpenAI Dashboard 的使用量限制

## 📝 測試檢查清單

- [ ] 環境變數已正確設定
- [ ] 測試腳本可以成功執行
- [ ] OpenAI API 連接正常
- [ ] 記帳功能正常運作
- [ ] 查詢功能正常運作
- [ ] 對話功能正常運作
- [ ] 對話歷史上下文正常
- [ ] 管理後台可以查看記錄

## 🚀 下一步

測試完成後，你可以：
1. 部署到 Vercel
2. 設定 Line Webhook URL
3. 開始使用你的記帳 Bot！

如有問題，請查看：
- `README.md` - 專案說明
- `ENV_SETUP.md` - 環境設定說明
- `DEPLOYMENT.md` - 部署說明

