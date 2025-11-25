# Line Bot AI 記帳系統

這是以 Next.js + TypeScript + MongoDB + OpenAI 打造的 LINE 智慧記帳機器人，結合 Flex UI 與 AI 語意理解，提供自然語言記帳、統計分析與管理後台。
- Line 官方帳號：`@601plank`
- 一鍵加入好友：<a href="https://lin.ee/80pqE1f"><img src="https://scdn.line-apps.com/n/line_add_friends/btn/zh-Hant.png" alt="加入好友" height="36" border="0"></a>
- 管理後台入口：https://my-chat-bot-blush.vercel.app/

## 功能特色

- 🤖 **AI 記帳助手**：使用 OpenAI 解析自然語言記帳訊息，支援支出與收入
- ✏️ **語意更正與刪除**：輸入「第一筆改成飲品」「刪除昨天餐點」，AI 會自動鎖定紀錄進行修正
- 📊 **雙向統計**：Rich Menu 與指令查詢同時顯示支出與收入，並即時計算淨收入、推送鼓勵或毒舌提醒
- 📈 **Flex 圖卡**：以 LINE 原生 Flex Message 呈現支出 / 收入類別占比（條圖 / 圓餅圖）
- 🔎 **細項查詢**：支援「餐點細項」「11/25 花費細項」「收入明細」等情境
- 🎯 **項目管理**：預設類別 + 自訂類別映射（含「食」→「餐點」等語意別名）
- 💬 **對話記錄**：完整保存所有對話歷史，方便追蹤上下文
- 📱 **管理後台**：即時監控對話、檢視統計、管理歷程
- 🛡️ **錯誤處理**：優雅降級機制，處理 LLM/資料庫/Line API 失敗情況

## 技術棧

- **框架**: Next.js 14+ (App Router) with TypeScript
- **LLM**: OpenAI API (GPT-4)
- **資料庫**: MongoDB Atlas + Mongoose ODM
- **樣式**: Tailwind CSS
- **驗證**: Zod
- **部署**: Vercel

## 專案結構

```
hw6/
├── app/
│   ├── api/
│   │   ├── line/route.ts             # Line webhook 端點
│   │   └── admin/                     # 管理後台 API
│   │       ├── conversations/route.ts
│   │       ├── statistics/route.ts
│   │       ├── expenses/route.ts
│   │       └── events/route.ts        # SSE 即時更新
│   ├── admin/
│   │   └── page.tsx                   # 管理後台 UI
│   └── layout.tsx
├── lib/
│   ├── services/                      # 服務層
│   │   ├── openaiService.ts
│   │   ├── messageParser.ts
│   │   ├── expenseService.ts
│   │   ├── lineService.ts
│   │   └── logger.ts
│   ├── repositories/                  # 資料存取層
│   │   ├── expenseRepository.ts
│   │   ├── userRepository.ts
│   │   └── conversationRepository.ts
│   ├── models/                        # Mongoose 模型
│   │   ├── expense.ts
│   │   ├── user.ts
│   │   └── conversation.ts
│   ├── db/
│   │   └── mongodb.ts                 # MongoDB 連接
│   └── utils/
│       └── errorHandler.ts            # 錯誤處理
├── types/
│   └── index.ts                       # TypeScript 類型定義
└── package.json
```

## 環境變數設定

複製 `.env.local.example` 為 `.env.local` 並填入以下變數：

```bash
# Line Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# OpenAI API
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# 應用程式 URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 安裝與執行

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

建立 `.env.local` 檔案並填入必要的環境變數。

### 3. 本地開發

```bash
npm run dev
```

應用程式將在 `http://localhost:3000` 啟動。

### 4. 建置生產版本

```bash
npm run build
npm start
```

## Line Bot 設定

### 1. 建立 Line Channel

1. 前往 [Line Developers Console](https://developers.line.biz/console/)
2. 建立新的 Provider 和 Channel
3. 選擇 "Messaging API" 作為 Channel 類型
4. 取得 Channel Access Token 和 Channel Secret

### 2. 設定 Webhook URL

部署到 Vercel 後，在 Line Developers Console 設定 Webhook URL：

```
https://your-app.vercel.app/api/line
```

### 3. 啟用 Webhook

在 Line Developers Console 中啟用 Webhook，並驗證連線狀態。

## 使用方式

### 記帳 / 語意指令

- `午餐 50`、`今天晚餐花了100`：自動判斷為支出
- `收入 50000`、`薪水 30000`、`投資收益 8000`：記錄收入
- `第一筆要改成飲品`、`更正今天午餐為120`：AI 協助更正現有紀錄
- `刪除第3筆`、`刪除昨天的餐點`：語意刪除

### 查詢功能

- `查詢統計` / Rich Menu「本月統計」：顯示本月支出、收入、淨收入與 Flex 圖卡
- `上個月花多少`、`這半年花多少`、`今年花多少`：範圍統計
- `餐點細項`、`11/25 花費細項`、`收入細項`：查看類別或日期明細
- `今天的記錄`：列出今日所有紀錄

### Rich Menu 快捷

- **使用說明**：快速查看所有指令
- **每月開銷**：跳出年份 / 月份快速選單
- **本月統計**：即時統計 + Flex 圖卡
- **今日記錄**：列出今日支出

### 管理功能

- `新增項目：交通`：新增自訂類別
- 後台 `/admin`：可檢視統計、對話紀錄、即時事件

## 管理後台

訪問 `/admin` 路徑可進入管理後台，功能包括：

- 📋 對話紀錄列表（即時更新）
- 🔍 篩選功能（使用者 ID、月份）
- 📊 統計圖表（每月花費趨勢、項目分布）
- 🔄 即時更新（Server-Sent Events）

## 錯誤處理

系統實作了完整的錯誤處理機制：

- **OpenAI API 失敗**：降級為規則解析，回覆友善錯誤訊息
- **MongoDB 連接失敗**：記錄錯誤，回覆「服務暫時無法使用」
- **Line API 失敗**：記錄錯誤日誌
- **429 速率限制**：回覆「處理中，請稍候...」

## 部署到 Vercel

### 1. 準備專案

確保所有環境變數都已設定在 `.env.local`。

### 2. 部署

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel
```

或透過 GitHub 連接自動部署。

### 3. 設定環境變數

在 Vercel 專案設定中新增所有環境變數。

### 4. 設定 Line Webhook

更新 Line Developers Console 中的 Webhook URL 為 Vercel 部署的 URL。

## 開發注意事項

- 使用 TypeScript 確保型別安全
- 所有 API 請求都使用 Zod 進行驗證
- 使用結構化日誌記錄所有操作
- 遵循 Repository Pattern 分離資料存取邏輯
- 使用 Service Layer 處理業務邏輯

## 授權

本專案為作業專案，僅供學習使用。
