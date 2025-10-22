#!/bin/bash

# 測試腳本 - 驗證 Location Explorer 應用

echo "🚀 Location Explorer 測試腳本"
echo "================================"

# 檢查 Node.js 和 npm
echo "📋 檢查環境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安裝"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 檢查後端
echo ""
echo "🔧 檢查後端..."
cd backend

if [ ! -f "package.json" ]; then
    echo "❌ 後端 package.json 不存在"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "⚠️  後端依賴未安裝，正在安裝..."
    npm install
fi

# 檢查環境變數
if [ ! -f ".env" ]; then
    echo "⚠️  後端 .env 不存在，請複製 env.example 並設定"
    echo "   cp env.example .env"
    echo "   然後編輯 .env 設定 Google Maps API 金鑰"
fi

# 測試後端編譯
echo "🔨 測試後端編譯..."
if npm run build; then
    echo "✅ 後端編譯成功"
else
    echo "❌ 後端編譯失敗"
    exit 1
fi

# 檢查前端
echo ""
echo "🎨 檢查前端..."
cd ../frontend

if [ ! -f "package.json" ]; then
    echo "❌ 前端 package.json 不存在"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "⚠️  前端依賴未安裝，正在安裝..."
    npm install
fi

# 檢查環境變數
if [ ! -f ".env" ]; then
    echo "⚠️  前端 .env 不存在，請複製 env.example 並設定"
    echo "   cp env.example .env"
    echo "   然後編輯 .env 設定 Google Maps API 金鑰"
fi

# 測試前端編譯
echo "🔨 測試前端編譯..."
if npm run build; then
    echo "✅ 前端編譯成功"
else
    echo "❌ 前端編譯失敗"
    exit 1
fi

echo ""
echo "🎉 所有檢查通過！"
echo ""
echo "📝 下一步："
echo "1. 設定 Google Maps API 金鑰到前後端的 .env 檔案"
echo "2. 啟動後端: cd backend && npm run dev"
echo "3. 啟動前端: cd frontend && npm run dev"
echo "4. 開啟瀏覽器訪問 http://localhost:5173"
echo ""
echo "📚 詳細說明請參考 README.md"
