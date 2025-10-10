# NTU 課程選課系統

一個基於 React TypeScript 的純前端課程選課系統，支援課程瀏覽、選課管理、衝堂檢測和送出記錄功能。

## 功能特色

### 1. 課程瀏覽
- **關鍵字搜尋**: 支援課程名稱、代碼、教師姓名搜尋
- **條件篩選**: 可依系所、學分、星期、時段、教師篩選
- **課程資訊**: 顯示課程詳細資訊，包括時間、教室、學分等
- **衝堂提示**: 自動檢測與已選課程的時間衝突

### 2. 選課管理
- **預選表單**: 管理已選課程列表
- **課程時間表**: 視覺化顯示選課時間安排
- **衝堂檢測**: 即時顯示時間衝突警告
- **學分統計**: 自動計算總學分數

### 3. 送出記錄
- **記錄管理**: 保存選課送出記錄
- **狀態追蹤**: 草稿 → 已送出 → 已確認
- **修改限制**: 送出後24小時內可修改，確認後不可修改
- **歷史查詢**: 查看所有送出記錄

### 4. 技術特色
- **純前端**: 無需後端伺服器，所有資料存於瀏覽器
- **自動更新**: CSV 檔案更新後自動重新載入
- **響應式設計**: 支援各種螢幕尺寸
- **Material-UI**: 現代化 UI 設計

## 技術架構

### 前端技術
- **React 18**: 使用最新版本 React
- **TypeScript**: 完整型別安全
- **Material-UI**: UI 元件庫
- **Vite**: 快速建置工具
- **PapaParse**: CSV 解析

### 專案結構
```
src/
├── components/          # React 組件
│   ├── CourseBrowser.tsx      # 課程瀏覽
│   ├── CourseSelection.tsx     # 選課管理
│   ├── CourseSchedule.tsx     # 課程時間表
│   └── SubmissionHistory.tsx  # 送出記錄
├── context/             # React Context
│   └── CourseContext.tsx      # 課程資料管理
├── hooks/               # 自定義 Hooks
│   ├── useCourseSearch.ts     # 搜尋邏輯
│   ├── useCourseSelection.ts  # 選課邏輯
│   └── useCSVReload.ts        # CSV 重載
├── types/               # TypeScript 型別
│   └── course.ts              # 課程資料型別
├── utils/               # 工具函數
│   └── csvParser.ts           # CSV 解析
├── App.tsx              # 主應用程式
└── main.tsx             # 應用程式入口
```

## 安裝與執行

### 1. 安裝依賴
```bash
npm install
```

### 2. 準備資料
將 CSV 檔案放置於 `public/data/` 目錄：
```
public/
└── data/
    └── hw3-ntucourse-data-1002.csv
```

### 3. 啟動開發伺服器
```bash
npm run dev
```

### 4. 建置生產版本
```bash
npm run build
```

## 使用說明

### 1. 課程瀏覽
- 在搜尋框輸入關鍵字搜尋課程
- 使用篩選條件縮小搜尋範圍
- 點擊「選課」按鈕加入預選清單
- 展開課程查看詳細資訊

### 2. 選課管理
- 查看已選課程列表
- 使用時間表檢視課程安排
- 移除不需要的課程
- 送出選課記錄

### 3. 送出記錄
- 查看所有送出記錄
- 修改未確認的記錄
- 確認最終選課決定

## 資料格式

### CSV 檔案格式
系統支援 NTU 課程資料 CSV 格式，包含以下欄位：
- `cou_cname`: 課程中文名稱
- `cou_ename`: 課程英文名稱
- `cou_code`: 課程代碼
- `tea_cname`: 教師中文姓名
- `credit`: 學分數
- `dpt_abbr`: 系所簡稱
- `day1-day6`: 星期 (1-7)
- `st1-st6`: 開始時間
- `clsrom_1-clsrom_6`: 教室

### 自動更新機制
- 系統每30秒檢查 CSV 檔案更新
- 檔案修改後自動重新載入資料
- 支援熱重載，無需重啟應用程式

## 開發規範

### 程式碼結構
- **組件分離**: UI 組件與業務邏輯分離
- **Hook 模式**: 使用自定義 Hooks 管理狀態
- **Context 管理**: 全域狀態使用 React Context
- **型別安全**: 完整的 TypeScript 型別定義

### 狀態管理
- 使用 `useReducer` 管理複雜狀態
- Context 提供全域狀態共享
- Hooks 封裝業務邏輯

### 錯誤處理
- 完整的錯誤邊界處理
- 使用者友善的錯誤訊息
- 優雅的降級處理

## 瀏覽器支援

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 授權

此專案僅供學習使用，請勿用於商業用途。

## 聯絡資訊

如有問題或建議，請聯絡開發團隊。
