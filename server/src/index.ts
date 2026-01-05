import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { generateRouter } from './routes/generate.js';
import { adminRouter } from './routes/admin.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件 - CORS 支持多个本地开发端口
app.use(cors({
  origin: (origin, callback) => {
    // 允许的来源列表
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      process.env.CORS_ORIGIN,
    ].filter(Boolean);
    
    // 允许没有 origin 的请求（如 curl、Postman）
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 路由
app.use('/api/auth', authRouter);
app.use('/api/generate', generateRouter);
app.use('/api/admin', adminRouter);

// 错误处理
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || '服务器内部错误',
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 人生K线服务器已启动: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
});
