import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        remainingUses: number;
        status: string;
      };
    }
  }
}

/**
 * 认证中间件 - 验证 JWT Token
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: '未提供认证令牌',
        errorCode: 'AUTH_REQUIRED',
      });
      return;
    }
    
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      res.status(401).json({
        success: false,
        error: '认证令牌无效或已过期',
        errorCode: 'AUTH_EXPIRED',
      });
      return;
    }
    
    // 查询用户信息
    const account = await prisma.account.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        remainingUses: true,
        status: true,
      },
    });
    
    if (!account) {
      res.status(401).json({
        success: false,
        error: '账号不存在',
        errorCode: 'AUTH_INVALID',
      });
      return;
    }
    
    if (account.status === 'disabled') {
      res.status(403).json({
        success: false,
        error: '账号已被禁用',
        errorCode: 'ACCOUNT_DISABLED',
      });
      return;
    }
    
    req.user = account;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * 管理员认证中间件 - 验证管理 API 密钥
 */
export function adminAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_API_KEY;
  
  if (!expectedKey) {
    res.status(500).json({
      success: false,
      error: '服务器未配置管理密钥',
    });
    return;
  }
  
  if (!adminKey || adminKey !== expectedKey) {
    res.status(403).json({
      success: false,
      error: '管理密钥无效',
    });
    return;
  }
  
  next();
}
