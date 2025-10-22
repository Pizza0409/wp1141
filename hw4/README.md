# 店家/景點探索應用

一個基於地圖的店家與景點探索應用，支援搜尋、收藏、評分與備註功能。

## 專案架構

```
├── frontend/          # React + TypeScript + Vite 前端
├── backend/           # Node.js + Express + TypeScript 後端
├── .gitignore         # Git 忽略檔案
└── README.md          # 專案說明文件
```

## 技術棧

### 前端
- React 18 + TypeScript
- Vite (建置工具)
- Material UI (UI 框架)
- React Router (路由)
- Axios (HTTP 客戶端)
- Google Maps JavaScript API

### 後端
- Node.js + Express
- TypeScript
- SQLite (資料庫)
- JWT (認證)
- bcrypt (密碼雜湊)
- Google Maps Geocoding API

## 功能特色

- 🗺️ 地圖搜尋與瀏覽
- 📍 地點標記與收藏
- ⭐ 評分與備註系統
- 🔐 使用者認證系統
- 📱 響應式設計

## 快速開始

### 1. 安裝依賴

```bash
# 安裝後端依賴
cd backend
npm install

# 安裝前端依賴
cd ../frontend
npm install
```

### 2. 環境設定

**重要：前後端都必須設定環境變數！**

#### 後端環境變數
複製 `backend/env.example` 為 `backend/.env` 並設定：

```bash
cp backend/env.example backend/.env
```

編輯 `backend/.env`：
```env
NODE_ENV=development
PORT=3000

# JWT 設定
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# 資料庫設定
DATABASE_PATH=./database/locations.db

# CORS 設定
FRONTEND_URL=http://localhost:5173
```

#### 前端環境變數
複製 `frontend/env.example` 為 `frontend/.env` 並設定：

```bash
cp frontend/env.example frontend/.env
```

編輯 `frontend/.env`：
```env
# API 基礎 URL
VITE_API_BASE_URL=http://localhost:3000/api

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# 應用程式設定
VITE_APP_TITLE=Location Explorer
```

### 3. Google Maps API 設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用以下 API：
   - Maps JavaScript API
   - Geocoding API
4. 建立 API 金鑰
5. 將 API 金鑰設定到前後端的環境變數中

### 4. 啟動應用

```bash
# 啟動後端 (port 3000)
cd backend
npm run dev

# 啟動前端 (port 5173)
cd frontend
npm run dev
```

### 5. 使用應用

1. 開啟瀏覽器訪問 `http://localhost:5173`
2. 註冊新帳號或登入
3. 開始新增和管理你的地點！

## 快速測試

我們提供了一個測試腳本來驗證應用是否正常設定：

```bash
# 運行測試腳本
./test.sh
```

這個腳本會：
- 檢查 Node.js 和 npm 環境
- 驗證前後端依賴是否安裝
- 測試前後端編譯
- 檢查環境變數設定

## API 端點

### 認證
- `POST /api/auth/register` - 註冊
- `POST /api/auth/login` - 登入
- `POST /api/auth/logout` - 登出

### 地點管理
- `GET /api/locations` - 取得所有地點
- `POST /api/locations` - 新增地點
- `PUT /api/locations/:id` - 更新地點
- `DELETE /api/locations/:id` - 刪除地點

### 健康檢查
- `GET /api/health` - 檢查 API 狀態

## 資料庫結構

### Users 表
- id (主鍵)
- email (唯一)
- password (雜湊)
- createdAt
- updatedAt

### Locations 表
- id (主鍵)
- name (地點名稱)
- address (地址)
- latitude (緯度)
- longitude (經度)
- rating (評分 1-5)
- notes (備註)
- userId (外鍵)
- createdAt
- updatedAt

## 功能說明

### 地圖功能
- 自動載入 Google Maps
- 顯示所有已儲存的地點
- 點擊標記查看地點詳細資訊
- 自動調整地圖視野以包含所有地點

### 地點管理
- 新增地點（自動取得座標）
- 編輯地點資訊
- 評分系統（1-5星）
- 備註功能
- 刪除地點

### 認證系統
- JWT Token 認證
- 密碼雜湊儲存
- 自動登入狀態管理
- 路由保護

## 開發說明

### 後端開發
```bash
cd backend
npm run dev    # 開發模式
npm run build  # 建置
npm start      # 生產模式
```

### 前端開發
```bash
cd frontend
npm run dev    # 開發模式
npm run build  # 建置
npm run preview # 預覽建置結果
```

## 注意事項

1. **環境變數**：確保前後端都正確設定 `.env` 檔案
2. **Google Maps API**：需要有效的 API 金鑰才能使用地圖功能
3. **資料庫**：SQLite 資料庫會自動建立，無需手動設定
4. **CORS**：後端已設定允許前端域名存取
5. **安全性**：生產環境請更改 JWT_SECRET

## 故障排除

### 常見問題

1. **地圖無法載入**
   - 檢查 Google Maps API 金鑰是否正確設定
   - 確認已啟用 Maps JavaScript API

2. **API 請求失敗**
   - 檢查後端是否正常運行
   - 確認 CORS 設定正確

3. **認證問題**
   - 檢查 JWT_SECRET 是否設定
   - 確認前後端環境變數一致

4. **資料庫錯誤**
   - 檢查資料庫檔案權限
   - 確認 DATABASE_PATH 設定正確
