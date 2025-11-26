# Rich Menu 設置指南

## 問題修復

已修復以下問題：
1. ✅ **PNG 圖片支援**：現在會自動將 PNG 轉換為 JPEG（LINE API 要求）
2. ✅ **Form-data 上傳**：支援使用 `multipart/form-data` 上傳圖片
3. ✅ **圖片處理**：使用 sharp 自動處理圖片格式和品質

## 快速設置（推薦）

### 方法一：使用一鍵設置腳本

```bash
# 使用預設圖片（richmenue.png）
./scripts/setup-richmenu-all-in-one.sh

# 或指定圖片路徑
./scripts/setup-richmenu-all-in-one.sh /path/to/your/image.png
```

### 方法二：使用 API 端點

#### 1. 建立 Rich Menu

```bash
curl -X POST http://localhost:3000/api/line/richmenu
```

回應會包含 `richMenuId`，例如：
```json
{
  "success": true,
  "data": {
    "richMenuId": "richmenu-xxxxx",
    "message": "Rich Menu 建立成功"
  }
}
```

#### 2. 上傳圖片（支援 PNG 和 JPEG）

```bash
# 使用 form-data（推薦）
curl -X POST http://localhost:3000/api/line/richmenu/{richMenuId}/image \
  -F "image=@richmenue.png"

# 或直接上傳二進位
curl -X POST http://localhost:3000/api/line/richmenu/{richMenuId}/image \
  -H "Content-Type: image/png" \
  --data-binary @richmenue.png
```

**注意**：圖片會自動轉換為 JPEG 格式。

#### 3. 設定為預設選單

```bash
curl -X POST http://localhost:3000/api/line/richmenu/{richMenuId}/set-default
```

### 方法三：使用 Setup API（一次完成所有步驟）

```bash
curl -X POST http://localhost:3000/api/line/richmenu/setup \
  -F "image=@richmenue.png"
```

## 圖片要求

### Compact Menu（預設）
- **尺寸**：1038 x 635 像素
- **格式**：PNG 或 JPEG（會自動轉換為 JPEG）
- **檔案大小**：建議小於 1MB

### Wide Menu
- **尺寸**：2500 x 843 像素
- **格式**：PNG 或 JPEG（會自動轉換為 JPEG）

### Full Menu
- **尺寸**：2500 x 1686 像素
- **格式**：PNG 或 JPEG（會自動轉換為 JPEG）

## 檢查 Rich Menu 狀態

### 取得所有 Rich Menu 列表

```bash
curl http://localhost:3000/api/line/richmenu
```

### 取得特定 Rich Menu 資訊

```bash
curl http://localhost:3000/api/line/richmenu/{richMenuId}
```

## 常見問題

### Q: Rich Menu 沒有顯示？

1. **確認圖片已上傳**：Rich Menu 必須先上傳圖片才能顯示
2. **確認已設為預設**：使用 `set-default` API 設定為預設選單
3. **檢查圖片尺寸**：確保圖片符合要求的尺寸
4. **重新啟動 Line App**：有時需要重新啟動 Line App 才能看到更新

### Q: 圖片上傳失敗？

1. **檢查圖片格式**：支援 PNG 和 JPEG，會自動轉換為 JPEG
2. **檢查檔案大小**：建議小於 1MB
3. **檢查圖片尺寸**：必須符合 Rich Menu 的尺寸要求
4. **查看日誌**：檢查伺服器日誌以獲取詳細錯誤訊息

### Q: 如何刪除 Rich Menu？

```bash
curl -X DELETE http://localhost:3000/api/line/richmenu/{richMenuId}
```

## 測試步驟

1. **建立 Rich Menu**
   ```bash
   curl -X POST http://localhost:3000/api/line/richmenu
   ```
   記錄返回的 `richMenuId`

2. **上傳圖片**
   ```bash
   curl -X POST http://localhost:3000/api/line/richmenu/{richMenuId}/image \
     -F "image=@richmenue.png"
   ```

3. **設定為預設**
   ```bash
   curl -X POST http://localhost:3000/api/line/richmenu/{richMenuId}/set-default
   ```

4. **驗證**
   - 在 Line App 中打開與 Bot 的對話
   - 應該能看到 Rich Menu 顯示在聊天輸入框上方
   - 點擊按鈕應該能觸發對應的訊息

## 部署後設置

如果部署到 Vercel，請使用 Vercel 的 URL：

```bash
export NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
./scripts/setup-richmenu-all-in-one.sh richmenue.png
```

或直接使用 curl：

```bash
curl -X POST https://your-app.vercel.app/api/line/richmenu/setup \
  -F "image=@richmenue.png"
```

