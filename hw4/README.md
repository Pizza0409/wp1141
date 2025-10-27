# Location Explorer - 地點探索應用

一個基於地圖的店家與景點探索應用，支援搜尋、收藏、評分與備註功能。

## 📋 專案概述

本專案是一個 Full-stack 地點管理應用，允許使用者在地圖上搜尋、標記、評分和管理喜愛的地點。

## 🏗️ 專案架構

```
hw4/
├── backend/              # Node.js + Express + TypeScript 後端
│   ├── src/
│   │   ├── controllers/  # 控制器
│   │   ├── services/     # 業務邏輯層
│   │   ├── routes/       # 路由定義
│   │   ├── middleware/   # 中介軟體（認證、錯誤處理）
│   │   ├── database/     # 資料庫設定
│   │   └── types/        # TypeScript 類型定義
│   ├── .env.example      # 環境變數範例
│   └── package.json
├── frontend/             # React + TypeScript + Vite 前端
│   ├── src/
│   │   ├── pages/        # 頁面組件
│   │   ├── components/   # 共用組件
│   │   ├── hooks/        # 自定義 Hooks
│   │   ├── services/     # API 服務
│   │   └── types/        # TypeScript 類型定義
│   ├── .env.example      # 環境變數範例
│   └── package.json
├── test.sh               # 測試腳本
├── start.sh              # 啟動腳本
└── README.md             # 本檔案
```

## 🛠️ 技術棧

### 前端
- **React 19** + **TypeScript** - UI 框架
- **Vite** - 建置工具
- **Material UI** - UI 元件庫
- **React Router** - 前端路由
- **Axios** - HTTP 客戶端
- **Google Maps JavaScript API** - 地圖功能（Geocoding、Places）

### 後端
- **Node.js** + **Express**を受くTypeScript 類型安全
- **SQLite** - 資料庫
- **JWT** - 認證機制
- **bcryptjs** - 密碼雜湊
- **express-validator** - 輸入驗證
- **Axios** - HTTP 客戶端（Google Maps API）

### Google Maps 整合
- **前端**：Google Maps JavaScript API + Places API + Geocoding API
- **後端**：Geocoding API（地址轉座標）

## ✨ 功能特色

### 前端功能
- ✅ Google Maps 地圖載入與操作（縮放、拖曳）
- ✅ 搜尋地點功能（使用 Geocoding API）
- ✅ 標記地點功能（點擊地圖或地標）
- ✅ 地點清單顯示與管理
- ✅ 評分系統（1-5 星）
- ✅ 備註功能
- ✅ 響應式設計（支援手機和桌面）
- ✅ 使用者認證（登入後才可進行 CRUD 操作）

### 後端功能
- ✅ RESTful API
- ✅ JWT 認證
- ✅ 密碼雜湊儲存（bcrypt）
- ✅ 輸入驗證
- ✅ 錯誤處理
- ✅ 權限控 intram (使用者只能操作自己的資料)
- ✅ Google Maps API 整合

## 🚀 快速開始

### 前置需求
- Node.js 18+ 和 npm
- Google Maps API 金鑰（詳見下方說明）

### 1. 複製專案

```bash
git clone <repository-url>
cd hw4
```

### 2. 安裝依賴

```bash
# 安裝後端依賴
cd backend
npm install

# 安裝前端依賴
cd ../frontend
npm install
```

### 3. 設定環境變數

**重要：前後端都必須設定環境變數！**

#### 後端環境變數

```bash
cd backend
cp .env.example .env
```

編輯 `backend/.env`：

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (請使用強密碼)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google Maps API Key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

#### 前端環境變數

```bash
cd frontend
cp .env.example .env
```

編輯 `frontend/.env`：

```env
# API Base URL
VITE_API_BASE_URL=http://localhost:3000/api

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

### 4. 取得 Google Maps API 金鑰

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用以下 API：
   - **Maps JavaScript API**（前端地圖顯示）
   - **Geocoding API**（後端地址轉座upakanpl-
   - **Places API**（前端地標點擊功能）
4. 在「憑證」頁面建立 API 金鑰
5. 設定 API 金鑰限制（建議）：
   - HTTP 參考網址：`http://localhost:5173/*`
   - IP 地址：僅您開發環境的 IP
6. 將 API 金鑰複製到前後端的 `.env` 檔案

### 5. 啟動應用

#### 方法 1：使用啟動腳本（推薦）

```bash
# 在專案根目錄
bash start.sh
```

#### 方法 2：手動啟動

```bash
# 終端 1：啟動後端 (port 3000)
cd backend
npm run dev

# 終端 2：啟動前端 (port 5173)
cd frontend
npm run dev
```

### 6. 使用應用

1. 開啟瀏覽器訪問 `http://localhost:5173`
2. 註冊新帳號（或使用帳號：`guest@example.com` / 密碼：`guest123`）
3. 登入後即可開始使用：
   - 點擊地圖任意位置新增地點
   - 使用搜尋框搜尋地址
   - 點擊地圖上的地標（如店家、景點）新增
   - 編輯或刪除自己的地點

## 📡 API 端點

### 認證端點 (/api/auth)

| 方法 | 端點 | 說明 | 認證 |
|------|------|------|------|
| POST | /api/auth/register | 註冊新使用者 | ❌ |
| POST | /api/auth/login | 登入 | ❌ |
| POST | /api/auth/logout | 登出 | ✅ |

**註冊請求範例**：
```json
{
  "emailOrUsername": "user@example.com",
  "password": "password123"
}
```

**登入請求範例**：
```json
{
  "emailOrUsername": "user@example.com",
  "password": "password123"
}
```

### 地點管理端點 (/api/locations)

| 方法 | 端點 | 說明 | 認證 |
|------|------|------|------|
| GET | /api/locations | 取得使用者的所有地點 | ✅ |
| GET | /api/locations/:id | 取得特定地點 | ✅ |
| POST | /api/locations | 新增地點 | ✅ |
| PUT | /api/locations/:id | 更新地點 | ✅ |
| DELETE | /api/locations/:id | 刪除地點 | ✅ |

**新增地點請求範例**：
```json
{
  "name": "台灣大學",
  "address": "台北市大安區羅斯福路四段1號",
  "rating": 5,
  "notes": "我的母校"
}
```

### 健康檢查端點

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | /api/health | 檢查 API 狀態 |

## 💾 資料庫結構

### Users 表

| 欄位 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY | 使用者 ID |
| email | TEXT | UNIQUE | 電子郵件（可選） |
| username | TEXT | UNIQUE | 使用者名稱（可選） |
| password | TEXT | NOT NULL | 雜湊密碼 |
| createdAt | DATETIME | DEFAULT CURRENT_TIMESTAMP | 建立時間 |
| updatedAt | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新時間 |

**注意**：email 或 username 至少需要一個

### Locations 表

| 欄位 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY | 地點 ID |
| name | TEXT | NOT NULL | 地點名稱 |
| address | TEXT | NOT NULL | 地址 |
| latitude | REAL | NOT NULL | 緯度 |
| longitude | REAL | NOT NULL | 經度 |
| rating | INTEGER | CHECK (1-5) | 評分（1-5星） |
| notes | TEXT | | 備註 |
| userId | INTEGER | NOT NULL, FOREIGN KEY | 使用者 ID |
| createdAt | DATETIME | DEFAULT CURRENT_TIMESTAMP | 建立時間 |
| updatedAt | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新時間 |

## 🔒 安全性

### 認證機制：JWT
- 使用 **JWT (JSON Web Token)** 進行使用者認證
- Token 有效期：7 天
- 儲存方式：前端 SessionStorage

### 密碼安全
- 使用 **bcryptjs** 進行密碼雜湊
- Salt 輪數：12（生產環境建議使用更高數值）

### 輸入驗證
- Email 格式驗證
- 密碼長度驗證（至少 6 字元）
- 必填欄位驗證
- 數值範圍驗證（評分 1-5）

### 權限控管
- 未登入使用者無法存取受保護資源
- 使用者僅能查看、修改、刪除自己的資料
- 所有 API 請求使用 Bearer Token 認證

### CORS 設定
- 允許來源：http://localhost:5173 和 http://127.0.0.1:5173
- 支援 credentials

### 錯誤處理
- 統一的錯誤處理中介軟體
- 正確的 HTTP 狀態碼：
  - 400: 驗證錯誤
  - 401: 未授權
  - 403: 無權限
  - 404: 資源不存在
  - 409: 資源衝突
  - 500: 伺服器錯誤

## 🧪 測試

運行測試腳本檢查環境設定：

```bash
bash test.sh
```

此腳本會檢查：
- Node.js 和 npm 環境
- 前後端依賴安裝
- 編譯是否成功

## 📝 開發說明

### 後端開發

```bash
cd backend
npm run dev    # 開發模式（自動重啟）
npm run build  # 編譯 TypeScript
npm start      # 生產模式（需先 build）
```

### 前端開發

```bash
cd frontend
npm run dev       # 開發模式（port 5173）
npm run build     # 建置生產版本
npm run preview   # 預覽建置結果
```

## 📋 作業要求檢查清單

### ✅ 前端需求
- [x] 技術棧：React + TypeScript + Vite
- [x] React Router（前端 routing）
- [x] Axios（HTTP 溝通）
- [x] UI 框架：Material UI
- [x] Google Maps JavaScript API
- [x] 地圖載入與基本操作（縮放、拖曳）
- [x] 搜尋地點功能
- [x] 標記地點功能
- [x] 登入後才能進行 CRUD 操作

### ✅ 後端需求
- [x] 技術棧：Node.js + Express + TypeScript
- [x] RESTful API
- [x] /auth 端點（註冊、登入、登出）
- [x] /locations 資源（完整 CRUD）
- [x] Google Maps 伺服器端整合（Geocoding API）
- [x] 資料庫：SQLite
- [x] 儲存使用者登入資訊
- [x] 儲存主要資源資料

### ✅ 安全性需求
- [x] 帳號欄位：email/username + password
- [x] 密碼雜湊：bcryptjs
- [x] 認證機制：JWT
- [x] .env 檔不上傳，提供 .env.example
- [x] CORS 允許 http://localhost:5173 和 http://127.0.0.1:5173
- [x] 輸入驗證（email 格式、密碼長度、必填欄位、數值型態）
- [x] 正確的錯誤狀態碼和訊息
- [x] 未登入者無法操作受保護資源
- [x] 使用者僅能修改/刪除自己的資料

## 🐛 故障排除

### 常見問題

#### 1. 地圖無法載入
批量檢查 frontend/.env 中 VITE_GOOGLE_MAPS_API_KEY 是否正確設定
- 確認 Google Maps JavaScript API 已啟用
- 檢查瀏覽器控制台錯誤訊息

#### 2. API 請求失敗
- 檢查後端是否正常運行在 port 3000
- 確認 backend/.env 中 JWT_SECRET 已設定
- 檢查 CORS 設定
- 查看後端終端錯誤訊息

#### 3. 認證問題
- 確認已正確設定 JWT_SECRET
- 檢查 Token 是否過期
- 清除瀏覽器 SessionStorage 重新登入

#### 4. Geocoding 失敗
- 確認 backend/.env 中 GOOGLE_MAPS_API_KEY 已設定
- 確認 Geocoding API 已啟用
- 檢查 API 配額是否用完

#### 5. 資料庫錯誤
- 刪除 backend/database/locations.db 讓程式自動重建
- 確認資料庫檔案權限正確

#### 6. Port 衝突
- 如果 frontend port 不是 5173，需調整 backend CORS 設定
- 檢查是否有其他程式佔用 port 3000 或 5173

## 📄 授權

MIT License

## 👥 作者

NTU CSIE 2024
