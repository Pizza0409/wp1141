import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth';
import { locationRoutes } from './routes/locations';
import { errorHandler } from './middleware/errorHandler';
import { initializeDatabase } from './database/init';

// 載入環境變數
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中介軟體設定
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由設定
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);

// 健康檢查端點
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Location Explorer API is running',
    timestamp: new Date().toISOString()
  });
});

// 錯誤處理中介軟體
app.use(errorHandler);

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// 初始化資料庫並啟動伺服器
const startServer = async () => {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
