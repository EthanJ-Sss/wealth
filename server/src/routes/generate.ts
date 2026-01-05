import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateBaziAnalysis, isQwenAvailable } from '../lib/qwen.js';

export const generateRouter = Router();

// 所有生成接口都需要认证
generateRouter.use(authMiddleware);

/**
 * POST /api/generate
 * 生成主K线分析（消耗1次）
 */
generateRouter.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { baziInfo } = req.body;
    
    // 检查次数
    if (user.remainingUses <= 0) {
      res.status(403).json({
        success: false,
        error: '生成次数已用完，请续购',
        errorCode: 'INSUFFICIENT_USES',
        remainingUses: 0,
      });
      return;
    }
    
    // 检查通义千问 API 是否可用
    if (!isQwenAvailable()) {
      res.status(503).json({
        success: false,
        error: '服务暂不可用，请联系管理员配置 API',
        errorCode: 'SERVICE_UNAVAILABLE',
      });
      return;
    }
    
    // 先调用 AI 生成（如果失败不扣次数）
    let generatedData: any;
    try {
      generatedData = await generateBaziAnalysis(baziInfo);
    } catch (aiError: any) {
      console.error('AI 生成失败:', aiError);
      res.status(500).json({
        success: false,
        error: 'AI 生成失败: ' + (aiError.message || '请稍后重试'),
        errorCode: 'AI_ERROR',
      });
      return;
    }
    
    // AI 生成成功，扣减次数（使用事务确保原子性）
    const updatedAccount = await prisma.$transaction(async (tx) => {
      // 再次检查次数（防止并发）
      const account = await tx.account.findUnique({
        where: { id: user.id },
        select: { remainingUses: true },
      });
      
      if (!account || account.remainingUses <= 0) {
        throw new Error('INSUFFICIENT_USES');
      }
      
      // 扣减次数
      const updated = await tx.account.update({
        where: { id: user.id },
        data: {
          remainingUses: { decrement: 1 },
          status: account.remainingUses === 1 ? 'expired' : 'active',
        },
      });
      
      // 记录使用日志
      await tx.usageLog.create({
        data: {
          accountId: user.id,
          actionType: 'generate_main',
          usesBefore: account.remainingUses,
          usesAfter: account.remainingUses - 1,
          usesConsumed: 1,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
          extraData: JSON.stringify(baziInfo),
        },
      });
      
      return updated;
    });
    
    res.json({
      success: true,
      data: generatedData,
      remainingUses: updatedAccount.remainingUses,
    });
  } catch (error: any) {
    console.error('Generate error:', error);
    
    if (error.message === 'INSUFFICIENT_USES') {
      res.status(403).json({
        success: false,
        error: '生成次数已用完，请续购',
        errorCode: 'INSUFFICIENT_USES',
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: '生成失败，请稍后重试',
    });
  }
});

/**
 * POST /api/generate/wealth
 * 生成财富深度分析（消耗1次）
 */
generateRouter.post('/wealth', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const params = req.body;
    
    // 检查次数
    if (user.remainingUses <= 0) {
      res.status(403).json({
        success: false,
        error: '生成次数已用完，请续购',
        errorCode: 'INSUFFICIENT_USES',
        remainingUses: 0,
      });
      return;
    }
    
    // 扣减次数
    const updatedAccount = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: user.id },
        select: { remainingUses: true },
      });
      
      if (!account || account.remainingUses <= 0) {
        throw new Error('INSUFFICIENT_USES');
      }
      
      const updated = await tx.account.update({
        where: { id: user.id },
        data: {
          remainingUses: { decrement: 1 },
          status: account.remainingUses === 1 ? 'expired' : 'active',
        },
      });
      
      await tx.usageLog.create({
        data: {
          accountId: user.id,
          actionType: 'generate_wealth',
          usesBefore: account.remainingUses,
          usesAfter: account.remainingUses - 1,
          usesConsumed: 1,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
          extraData: JSON.stringify(params),
        },
      });
      
      return updated;
    });
    
    res.json({
      success: true,
      message: '次数已扣减，请继续生成财富分析',
      remainingUses: updatedAccount.remainingUses,
    });
  } catch (error: any) {
    console.error('Generate wealth error:', error);
    
    if (error.message === 'INSUFFICIENT_USES') {
      res.status(403).json({
        success: false,
        error: '生成次数已用完，请续购',
        errorCode: 'INSUFFICIENT_USES',
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: '生成失败，请稍后重试',
    });
  }
});

/**
 * POST /api/generate/love
 * 生成桃花深度分析（消耗1次）
 */
generateRouter.post('/love', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const params = req.body;
    
    // 检查次数
    if (user.remainingUses <= 0) {
      res.status(403).json({
        success: false,
        error: '生成次数已用完，请续购',
        errorCode: 'INSUFFICIENT_USES',
        remainingUses: 0,
      });
      return;
    }
    
    // 扣减次数
    const updatedAccount = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: user.id },
        select: { remainingUses: true },
      });
      
      if (!account || account.remainingUses <= 0) {
        throw new Error('INSUFFICIENT_USES');
      }
      
      const updated = await tx.account.update({
        where: { id: user.id },
        data: {
          remainingUses: { decrement: 1 },
          status: account.remainingUses === 1 ? 'expired' : 'active',
        },
      });
      
      await tx.usageLog.create({
        data: {
          accountId: user.id,
          actionType: 'generate_love',
          usesBefore: account.remainingUses,
          usesAfter: account.remainingUses - 1,
          usesConsumed: 1,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
          extraData: JSON.stringify(params),
        },
      });
      
      return updated;
    });
    
    res.json({
      success: true,
      message: '次数已扣减，请继续生成桃花分析',
      remainingUses: updatedAccount.remainingUses,
    });
  } catch (error: any) {
    console.error('Generate love error:', error);
    
    if (error.message === 'INSUFFICIENT_USES') {
      res.status(403).json({
        success: false,
        error: '生成次数已用完，请续购',
        errorCode: 'INSUFFICIENT_USES',
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: '生成失败，请稍后重试',
    });
  }
});

/**
 * GET /api/generate/status
 * 获取当前生成次数状态
 */
generateRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    res.json({
      success: true,
      data: {
        remainingUses: user.remainingUses,
        canGenerate: user.remainingUses > 0,
      },
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      error: '获取状态失败',
    });
  }
});
