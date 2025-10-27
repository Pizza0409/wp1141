#!/bin/bash

echo "🚀 Starting Location Explorer Fullstack Application..."
echo ""

# 檢查 Node.js 和 npm
echo "📋 Checking environment..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please install Node.js: https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# 後端相依性檢查
echo "📦 Checking backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📥 Installing backend dependencies..."
    npm install
fi

# 檢查後端環境變數
if [ ! -f ".env" ]; then
    echo "⚠️  Backend .env not found!"
    if [ -f ".env.example" ]; then
        echo "📝 Creating .env from .env.example..."
        cp .env.example .env
        echo "✅ Created .env file"
        echo "⚠️  Please edit backend/.env to set your API keys before running again"
        exit 1
    else
        echo "❌ .env.example not found in backend directory"
        exit 1
    fi
fi

# 檢查必要的環境變數
if grep -q "your-google-maps-api-key-here" .env || grep -q "your-secret-key-change-this-in-production" .env; then
    echo "⚠️  You need to set your API keys in backend/.env"
    echo "   Please edit .env and set:"
    echo "   - JWT_SECRET"
    echo "   - GOOGLE_MAPS_API_KEY"
    exit 1
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

# 前端相依性檢查
echo ""
echo "📦 Checking frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install
fi

# 檢查前端環境變數
if [ ! -f ".env" ]; then
    echo "⚠️  Frontend .env not found!"
    if [ -f ".env.example" ]; then
        echo "📝 Creating .env from .env.example..."
        cp .env.example .env
        echo "✅ Created .env file"
        echo "⚠️  Please edit frontend/.env to set your API keys before running again"
        exit 1
    else
        echo "❌ .env.example not found in frontend directory"
        exit 1
    fi
fi

# 檢查前端必要的環境變數
if grep -q "your-google-maps-api-key-here" .env; then
    echo "⚠️  You need to set your API keys in frontend/.env"
    echo "   Please edit .env and set:"
    echo "   - VITE_GOOGLE_MAPS_API_KEY"
    exit 1
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

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All checks passed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 清理函式
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    pkill -f "npm run dev" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    pkill -f "ts-node-dev" 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

trap cleanup INT TERM

# 啟動後端
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
echo "⏳ Waiting for frontend to start..."
sleep 5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Application started successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Local Access:     http://localhost:5173"
echo "🔧 Backend API:      http://localhost:3000"
echo "📊 Health Check:     http://localhost:3000/api/health"
echo ""
echo "💡 Features:"
echo "  • Click anywhere on the map to add a location"
echo "  • Search for addresses and add them to your list"
echo "  • Click on map markers (shops, attractions) to add them"
echo "  • Rate and add notes to locations"
echo "  • Responsive design, works on mobile and desktop"
echo ""
echo "🔑 Test Account:"
echo "  Email:    guest@example.com"
echo "  Password: guest123"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# 等待使用者中斷
wait
