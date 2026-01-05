import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { hashPassword, generateRandomPassword } from '../lib/password.js';
import { adminAuthMiddleware } from '../middleware/auth.js';

export const adminRouter = Router();

// 所有管理接口都需要管理员认证
adminRouter.use(adminAuthMiddleware);

/**
 * 生成唯一用户名
 * 格式：LK + YYYYMMDD + 5位序号
 */
async function generateUniqueUsername(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  
  // 使用事务更新序列号
  const seq = await prisma.$transaction(async (tx) => {
    // 查找或创建当日序列
    let seqRecord = await tx.accountSequence.findUnique({
      where: { date: dateStr },
    });
    
    if (!seqRecord) {
      seqRecord = await tx.accountSequence.create({
        data: { date: dateStr, sequence: 1 },
      });
      return 1;
    }
    
    // 递增序列号
    const updated = await tx.accountSequence.update({
      where: { date: dateStr },
      data: { sequence: { increment: 1 } },
    });
    
    return updated.sequence;
  });
  
  const seqStr = String(seq).padStart(5, '0');
  return `LK${dateStr}${seqStr}`;
}

/**
 * POST /api/admin/accounts/generate
 * 批量生成账号
 */
adminRouter.post('/accounts/generate', async (req: Request, res: Response) => {
  try {
    const { count = 10, usesPerAccount = 3 } = req.body;
    
    // 限制单次生成数量
    const generateCount = Math.min(Math.max(1, count), 1000);
    
    const accounts: Array<{
      username: string;
      password: string;
    }> = [];
    
    // 批量生成账号
    for (let i = 0; i < generateCount; i++) {
      const username = await generateUniqueUsername();
      const password = generateRandomPassword();
      const passwordHash = await hashPassword(password);
      
      await prisma.account.create({
        data: {
          username,
          passwordHash,
          passwordPlain: password, // 保留明文用于发货
          remainingUses: usesPerAccount,
          totalUses: usesPerAccount,
          status: 'unused',
        },
      });
      
      accounts.push({ username, password });
    }
    
    res.json({
      success: true,
      data: {
        generated: accounts.length,
        usesPerAccount,
        accounts,
      },
    });
  } catch (error) {
    console.error('Generate accounts error:', error);
    res.status(500).json({
      success: false,
      error: '批量生成账号失败',
    });
  }
});

/**
 * POST /api/admin/accounts/allocate
 * 分配账号给订单（发货机器人调用）
 */
adminRouter.post('/accounts/allocate', async (req: Request, res: Response) => {
  try {
    const { orderId, platform, buyerId } = req.body;
    
    if (!orderId) {
      res.status(400).json({
        success: false,
        error: '订单号不能为空',
      });
      return;
    }
    
    // 检查订单是否已分配
    const existing = await prisma.account.findFirst({
      where: { orderId },
    });
    
    if (existing) {
      // 返回已分配的账号
      res.json({
        success: true,
        data: {
          username: existing.username,
          password: existing.passwordPlain,
          alreadyAllocated: true,
        },
      });
      return;
    }
    
    // 分配一个未使用的账号
    const account = await prisma.$transaction(async (tx) => {
      // 查找一个未使用的账号
      const available = await tx.account.findFirst({
        where: { status: 'unused', orderId: null },
        orderBy: { createdAt: 'asc' },
      });
      
      if (!available) {
        throw new Error('POOL_EXHAUSTED');
      }
      
      // 标记为已分配
      const updated = await tx.account.update({
        where: { id: available.id },
        data: {
          orderId,
          platform,
          buyerId,
        },
      });
      
      return updated;
    });
    
    res.json({
      success: true,
      data: {
        username: account.username,
        password: account.passwordPlain,
        alreadyAllocated: false,
      },
    });
  } catch (error: any) {
    console.error('Allocate account error:', error);
    
    if (error.message === 'POOL_EXHAUSTED') {
      res.status(503).json({
        success: false,
        error: '账号池已耗尽，请生成新账号',
        errorCode: 'POOL_EXHAUSTED',
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: '分配账号失败',
    });
  }
});

/**
 * POST /api/admin/accounts/recycle
 * 回收账号（订单取消/退款时）
 */
adminRouter.post('/accounts/recycle', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      res.status(400).json({
        success: false,
        error: '订单号不能为空',
      });
      return;
    }
    
    // 查找关联的账号
    const account = await prisma.account.findFirst({
      where: { orderId },
    });
    
    if (!account) {
      res.status(404).json({
        success: false,
        error: '未找到关联账号',
      });
      return;
    }
    
    // 检查是否已被使用（首次登录时间为空表示未使用）
    if (account.firstLoginAt) {
      res.json({
        success: true,
        data: {
          recycled: false,
          reason: '账号已被使用，无法回收',
        },
      });
      return;
    }
    
    // 回收账号（重置为未使用状态）
    await prisma.account.update({
      where: { id: account.id },
      data: {
        orderId: null,
        platform: null,
        buyerId: null,
        status: 'unused',
      },
    });
    
    res.json({
      success: true,
      data: {
        recycled: true,
        username: account.username,
      },
    });
  } catch (error) {
    console.error('Recycle account error:', error);
    res.status(500).json({
      success: false,
      error: '回收账号失败',
    });
  }
});

/**
 * GET /api/admin/accounts/pool
 * 获取账号池状态
 */
adminRouter.get('/accounts/pool', async (_req: Request, res: Response) => {
  try {
    const [total, unused, active, expired, disabled] = await Promise.all([
      prisma.account.count(),
      prisma.account.count({ where: { status: 'unused' } }),
      prisma.account.count({ where: { status: 'active' } }),
      prisma.account.count({ where: { status: 'expired' } }),
      prisma.account.count({ where: { status: 'disabled' } }),
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        unused,
        active,
        expired,
        disabled,
        available: unused, // 可分配的账号数
      },
    });
  } catch (error) {
    console.error('Get pool status error:', error);
    res.status(500).json({
      success: false,
      error: '获取账号池状态失败',
    });
  }
});

/**
 * GET /api/admin/accounts/list
 * 获取账号列表
 */
adminRouter.get('/accounts/list', async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;
    
    const where = status ? { status: status as string } : {};
    
    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where,
        select: {
          id: true,
          username: true,
          remainingUses: true,
          totalUses: true,
          status: true,
          createdAt: true,
          firstLoginAt: true,
          lastLoginAt: true,
          orderId: true,
          platform: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.account.count({ where }),
    ]);
    
    res.json({
      success: true,
      data: {
        accounts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('List accounts error:', error);
    res.status(500).json({
      success: false,
      error: '获取账号列表失败',
    });
  }
});
