# NTU Web Programming 114-1 網頁程式設計

國立台灣大學 114 學年度第一學期「網頁程式設計」課程作業彙整。本 repository 展示從前端基礎到全端應用、第三方整合與 AI 應用的完整學習歷程，適合作為作品集與求職／求學時的技術能力說明。

---

## 課程學習地圖與技能摘要

| 作業 | 主題 | 技術重點 | 學習成果 |
|------|------|----------|----------|
| **HW1** | 個人網站 | HTML5、CSS3、JavaScript（原生） | 語意化標記、響應式設計、雙語切換、動畫與互動 |
| **HW2** | 國際象棋遊戲 | React、TypeScript、Vite | 元件化開發、狀態管理、遊戲邏輯與簡易 AI |
| **HW3** | 課程選課系統 | React、TypeScript、MUI、Vite | 資料篩選、虛擬化列表、衝堂檢查、Context API |
| **HW4** | 地點探索應用 | React、Node.js、Express、SQLite、JWT、Google Maps API | Full-stack、RESTful API、認證授權、地圖整合 |
| **HW5** | X-like 社群應用 | Next.js、NextAuth、MongoDB、Tailwind、Vercel | OAuth、NoSQL、即時動態、部署上線 |
| **HW6** | LINE Bot AI 記帳 | Next.js、OpenAI、MongoDB、LINE Messaging API | Webhook、LLM 語意解析、Flex Message、管理後台 |

---

## 各作業簡介與技術亮點

### HW1 — 個人網站
- **內容**：求職導向的個人簡介頁，含學經歷、技能、聯絡方式。
- **技術**：純 HTML/CSS/JavaScript，無框架；雙語切換、響應式、滾動動畫、技能條動畫。
- **能力**：語意化 HTML、Flexbox/Grid、DOM 操作、基礎動畫與 UX。

### HW2 — 國際象棋遊戲
- **內容**：可與 AI 或雙人對戰的網頁象棋，含完整規則（王車易位、升變、吃過路兵等）。
- **技術**：React 18、TypeScript、Vite；自訂 Hooks 管理棋局與 AI 評分。
- **能力**：元件設計、TypeScript 型別、遊戲狀態與規則邏輯、簡易 AI 策略。

### HW3 — NTU 課程選課系統
- **內容**：課程瀏覽、預選、衝堂檢查、課表視覺化、送出記錄（純前端，資料來自 CSV）。
- **技術**：React、TypeScript、Material-UI、Vite、PapaParse；Context、自訂 Hooks、虛擬化列表。
- **能力**：大量資料呈現與搜尋、防抖、虛擬化效能、時間衝突演算法、狀態架構設計。

### HW4 — Location Explorer（地點探索）
- **內容**：地圖搜尋、標記地點、評分與備註；需登入後才能 CRUD，資料持久化。
- **技術**：前端 React + MUI + Google Maps（Places/Geocoding）；後端 Node.js + Express + TypeScript、SQLite、JWT、bcrypt。
- **能力**：前後端分離、RESTful API、JWT 認證、密碼雜湊、輸入驗證、權限控管、第三方 API 整合。

### HW5 — X-like 社群應用
- **內容**：類 Twitter/X 的發文、評論、按讚、轉發、關注、Hashtag、草稿；OAuth 登入與 UserID 系統。
- **技術**：Next.js（App Router）、NextAuth.js v5、MongoDB（Mongoose）、Tailwind CSS、Vercel 部署。
- **能力**：全端 Next.js、OAuth（Google/GitHub/Facebook）、NoSQL 資料模型、Session/JWT、雲端部署。

### HW6 — LINE Bot AI 記帳系統
- **內容**：LINE 官方帳號記帳機器人，自然語言記帳（支出/收入）、語意更正/刪除、統計、Flex 圖卡、管理後台。
- **技術**：Next.js、OpenAI API（GPT）、MongoDB、LINE Messaging API、Webhook、Zod 驗證、SSE 即時更新。
- **能力**：Webhook 設計、LLM 語意解析、LINE Flex Message、Repository/Service 分層、錯誤處理與降級。

---

## 技術棧總覽

- **前端**：HTML5 / CSS3、React 18、TypeScript、Vite、Next.js（App Router）、Material-UI、Tailwind CSS
- **後端 / 全端**：Node.js、Express、Next.js API Routes
- **資料庫**：SQLite、MongoDB（Mongoose）
- **認證與安全**：JWT、NextAuth.js、OAuth、bcrypt
- **第三方服務**：Google Maps API、LINE Messaging API、OpenAI API
- **部署與工具**：Vercel、Git

---

## 目錄結構

```
wp1141/
├── hw1/     # 個人網站（靜態）
├── hw2/     # 國際象棋（React + Vite）
├── hw3/     # 課程選課系統（React + MUI）
├── hw4/     # 地點探索（前後端分離：frontend/ + backend/）
├── hw5/     # X-like 社群（Next.js 全端）
├── hw6/     # LINE Bot AI 記帳（Next.js + LINE + OpenAI）
└── README.md
```

各作業的安裝、執行方式與詳細說明請見各資料夾內的 `README.md`。

---

## 適用情境

- **求職**：可依應徵職位挑選對應作業（例如前端強調 HW1–HW3，全端/後端強調 HW4–HW6），並在履歷或作品集中附上本 repo 或各作業連結。
- **求學**：可作為「網頁程式設計」或「全端開發」相關課程的學習成果說明，搭配上表與技術棧總覽簡述能力範圍。
- **自用**：快速回顧各作業主題與技術重點，方便日後擴充或面試準備。

---

*本 repository 為課程作業彙整，僅供學習與作品展示使用。*
