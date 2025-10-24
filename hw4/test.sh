#!/bin/bash

echo "🚀 Starting Location Explorer Fullstack Application..."

# 檢查 Node.js 和 npm
echo "📋 Checking environment..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "請安裝 Node.js: https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# 後端相依性安裝
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# 檢查環境變數
if [ ! -f ".env" ]; then
    echo "⚠️  Backend .env not found, creating from example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ Created .env file, please edit it to set your Google Maps API key"
    else
        echo "❌ env.example not found, please create .env manually"
        exit 1
    fi
fi

# 測試後端編譯
echo "🔨 Building backend..."
if npm run build; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi
cd ..

# 前端相依性安裝和構建
echo "🎨 Building frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

# 檢查環境變數
if [ ! -f ".env" ]; then
    echo "⚠️  Frontend .env not found, creating from example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ Created .env file, please edit it to set your Google Maps API key"
    else
        echo "❌ env.example not found, please create .env manually"
        exit 1
    fi
fi

# 測試前端編譯
echo "🔨 Building frontend..."
if npm run build; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

# 啟動後端（會服務前端靜態檔案）
echo "🚀 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 等待後端啟動
echo "⏳ Waiting for backend to start..."
sleep 5

# 啟動前端
echo "🎨 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# 等待前端啟動
sleep 3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Application started successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 本地存取:  http://localhost:5173"
echo "🔧 後端 API:  http://localhost:3000"
echo ""
echo "💡 功能特色:"
echo "  • 點擊地圖任意位置新增地點"
echo "  • 搜尋地址並直接新增到清單"
echo "  • 評分和備註功能"
echo "  • 響應式設計，支援手機和桌面"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "按 Ctrl+C 停止所有服務"

# 清理函式
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    pkill -f "npm run dev" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    pkill -f "ts-node" 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

trap cleanup INT TERM

# 等待使用者中斷
wait
