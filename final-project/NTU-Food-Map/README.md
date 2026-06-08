# NTU Food Map · 台大美食推薦平台

專為台大學生與外籍生設計的雙語美食推薦平台。在地圖上瀏覽台大周邊店家、依條件篩選、查看推薦分數，並可登入後評論、收藏。

**線上 Demo：** https://ntu-food-map.vercel.app

---

## 功能

- 互動式地圖（Google Maps）瀏覽周邊美食
- 進階篩選：距離、評分、價位、類別、營業狀態
- 智慧推薦分數（距離、評分、人氣、營業、情境加權）
- 食物轉盤：從篩選結果隨機選店
- 店家詳情頁（含 Google Places 評論）
- Google / LINE OAuth 登入
- 使用者評論、評分、按讚／倒讚
- 收藏店家、個人頁面、頭像上傳
- 中／英雙語介面（`next-intl`）

---

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | Next.js 14 (App Router)、React 18、TypeScript、Tailwind CSS |
| 地圖 | Google Maps JavaScript API、`@react-google-maps/api` |
| 國際化 | next-intl（`/zh`、`/en` 路由） |
| 後端 | Next.js Route Handlers（Vercel Serverless） |
| 資料庫 | MongoDB Atlas（`2dsphere` 地理空間查詢） |
| 認證 | NextAuth.js v5、自訂 MongoDB Adapter |
| 檔案儲存 | Vercel Blob（使用者頭像） |
| 外部 API | Google Places API |
| 部署 | Vercel（Root Directory: `client`） |

> **備註：** `server/` 為可選的 Express 後端，僅供本地開發；正式環境以 `client/app/api/` 為主。

---

## 專案結構

```
/
├── client/                 # Next.js 全端應用（前端 + API）
│   ├── app/
│   │   ├── [locale]/       # 頁面（首頁、店家詳情、個人頁、登入）
│   │   └── api/            # Serverless API Routes
│   ├── components/         # React 元件
│   ├── lib/                # DB、認證、推薦演算法
│   └── utils/              # 型別、API 工具
├── server/                 # Express 後端（可選，port 3001）
├── db/                     # seed 資料與 schema 說明
└── scripts/                # 資料匯入腳本
```

更完整的結構說明見 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)。

---

## 快速開始

### 需求

- Node.js 18+
- MongoDB Atlas（或本地 MongoDB）
- Google Cloud 專案（Maps / Places / OAuth）
- LINE Developers 帳號（選填，用於 LINE 登入）

### 1. 安裝依賴

```bash
npm run install:all
```

### 2. 設定環境變數

在 `client/.env.local` 建立設定檔。最少需要：

```env
MONGODB_URI=mongodb+srv://...
DB_NAME=ntu_food_map
NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY=your-google-api-key
AUTH_URL=http://localhost:3000
AUTH_SECRET=your-secret-at-least-32-chars
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

完整變數說明、OAuth 設定步驟見 [ENV_SETUP.md](./ENV_SETUP.md)。

產生 `AUTH_SECRET`：

```bash
openssl rand -base64 32
```

### 3. 匯入種子資料

```bash
# 根目錄 .env 或 client/.env.local 需已設定 MONGODB_URI
node scripts/import_to_db.js
```

### 4. 啟動開發伺服器

```bash
cd client && npm run dev
```

開啟 http://localhost:3000

**可選：** 使用獨立 Express 後端時，另開 terminal 執行 `cd server && npm run dev`，並在 `client/.env.local` 設定 `NEXT_PUBLIC_API_URL=http://localhost:3001`。

---

## 部署

部署於 Vercel，Root Directory 設為 `client`。

詳細步驟與環境變數清單見 [DEPLOYMENT.md](./DEPLOYMENT.md)。

---

## API 概覽

所有 API 由 `client/app/api/` 提供（生產環境無需獨立後端）。

| 路徑 | 說明 |
|------|------|
| `GET /api/places` | 依位置與篩選條件查詢店家 |
| `GET /api/places/:id` | 店家詳情 |
| `POST /api/roulette` | 從篩選池隨機選一家 |
| `GET/POST /api/auth/*` | NextAuth 認證 |
| `GET/POST /api/comments` | 評論 CRUD |
| `POST /api/comments/:id/like` | 按讚評論 |
| `POST /api/comments/:id/dislike` | 倒讚評論 |
| `GET/POST /api/favorites` | 收藏管理 |
| `GET/PUT /api/user/profile` | 個人資料 |
| `POST /api/user/avatar` | 上傳頭像（Vercel Blob） |

`GET /api/places` 常用查詢參數：`lat`、`lng`、`radius`、`price_max`、`rating_min`、`categories[]`、`features[]`、`open_now`。

---

## 資料庫

MongoDB collections：

| Collection | 用途 |
|------------|------|
| `places` | 店家資料（含 GeoJSON `location`） |
| `users` | 使用者 |
| `accounts` / `sessions` | NextAuth OAuth 與 Session |
| `comments` | 使用者評論 |
| `favorites` | 收藏 |

詳細 schema 見 [db/schema.md](./db/schema.md)。

---

## 推薦分數

`client/lib/scoring.ts` 以加權公式計算 0–1 分：

| 因子 | 權重 |
|------|------|
| 評分 | 30% |
| 距離（指數衰減） | 25% |
| 人氣（評論數） | 20% |
| 營業狀態 | 15% |
| 情境（素食、WiFi 等） | 10% |

---

## 相關文件

| 文件 | 內容 |
|------|------|
| [ENV_SETUP.md](./ENV_SETUP.md) | 環境變數與 OAuth 設定 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel 部署 |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | 目錄結構 |
| [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) | 架構說明 |
| [db/schema.md](./db/schema.md) | 資料庫 schema |

---

## 授權

MIT
