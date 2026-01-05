import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { verifyPassword } from '../lib/password.js';
import { generateToken } from '../lib/jwt.js';
import { authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

// 登录接口限流：5次/15分钟
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: '登录尝试次数过多，请15分钟后再试',
    errorCode: 'AUTH_LOCKED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/login
 * 登录接口
 */
authRouter.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: '请输入用户名和密码',
      });
      return;
    }
    
    // 查找账号
    const account = await prisma.account.findUnique({
      where: { username: username.toUpperCase() },
    });
    
    if (!account) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
        errorCode: 'AUTH_INVALID',
      });
      return;
    }
    
    // 检查账号状态
    if (account.status === 'disabled') {
      res.status(403).json({
        success: false,
        error: '账号已被禁用',
        errorCode: 'ACCOUNT_DISABLED',
      });
      return;
    }
    
    // 验证密码
    const isValid = await verifyPassword(password, account.passwordHash);
    if (!isValid) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
        errorCode: 'AUTH_INVALID',
      });
      return;
    }
    
    // 更新登录状态
    const now = new Date();
    const isFirstLogin = !account.firstLoginAt;
    
    await prisma.account.update({
      where: { id: account.id },
      data: {
        status: 'active',
        firstLoginAt: isFirstLogin ? now : undefined,
        lastLoginAt: now,
      },
    });
    
    // 记录登录日志
    await prisma.usageLog.create({
      data: {
        accountId: account.id,
        actionType: 'login',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    });
    
    // 生成 Token
    const token = generateToken({
      userId: account.id,
      username: account.username,
    });
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          username: account.username,
          remainingUses: account.remainingUses,
          totalUses: account.totalUses,
          status: account.status === 'unused' ? 'active' : account.status,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试',
    });
  }
});

/**
 * POST /api/auth/logout
 * 退出登录
 */
authRouter.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    // 记录登出日志
    if (req.user) {
      await prisma.usageLog.create({
        data: {
          accountId: req.user.id,
          actionType: 'logout',
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        },
      });
    }
    
    res.json({
      success: true,
      message: '已退出登录',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: '退出失败',
    });
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
authRouter.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const account = await prisma.account.findUnique({
      where: { id: req.user!.id },
      select: {
        username: true,
        remainingUses: true,
        totalUses: true,
        status: true,
        firstLoginAt: true,
        lastLoginAt: true,
      },
    });
    
    if (!account) {
      res.status(404).json({
        success: false,
        error: '账号不存在',
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        username: account.username,
        remainingUses: account.remainingUses,
        totalUses: account.totalUses,
        status: account.status,
        firstLoginAt: account.firstLoginAt?.toISOString() || null,
        lastLoginAt: account.lastLoginAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
    });
  }
});
