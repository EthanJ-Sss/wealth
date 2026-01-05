/**
 * 批量生成账号脚本
 * 用法: npm run accounts:generate -- --count=100 --uses=3
 */

import { prisma } from '../lib/prisma.js';
import { hashPassword, generateRandomPassword } from '../lib/password.js';
import dotenv from 'dotenv';

dotenv.config();

async function generateUniqueUsername(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  
  const seq = await prisma.$transaction(async (tx) => {
    let seqRecord = await tx.accountSequence.findUnique({
      where: { date: dateStr },
    });
    
    if (!seqRecord) {
      seqRecord = await tx.accountSequence.create({
        data: { date: dateStr, sequence: 1 },
      });
      return 1;
    }
    
    const updated = await tx.accountSequence.update({
      where: { date: dateStr },
      data: { sequence: { increment: 1 } },
    });
    
    return updated.sequence;
  });
  
  const seqStr = String(seq).padStart(5, '0');
  return `LK${dateStr}${seqStr}`;
}

async function main() {
  // 解析命令行参数
  const args = process.argv.slice(2);
  let count = 10;
  let usesPerAccount = 3;
  
  for (const arg of args) {
    if (arg.startsWith('--count=')) {
      count = parseInt(arg.split('=')[1]) || 10;
    } else if (arg.startsWith('--uses=')) {
      usesPerAccount = parseInt(arg.split('=')[1]) || 3;
    }
  }
  
  console.log(`\n🔧 开始生成账号...`);
  console.log(`   数量: ${count}`);
  console.log(`   每账号次数: ${usesPerAccount}\n`);
  
  const accounts: Array<{ username: string; password: string }> = [];
  
  for (let i = 0; i < count; i++) {
    const username = await generateUniqueUsername();
    const password = generateRandomPassword();
    const passwordHash = await hashPassword(password);
    
    await prisma.account.create({
      data: {
        username,
        passwordHash,
        passwordPlain: password,
        remainingUses: usesPerAccount,
        totalUses: usesPerAccount,
        status: 'unused',
      },
    });
    
    accounts.push({ username, password });
    
    // 进度显示
    if ((i + 1) % 10 === 0 || i === count - 1) {
      process.stdout.write(`\r   进度: ${i + 1}/${count}`);
    }
  }
  
  console.log('\n\n✅ 生成完成！\n');
  console.log('='.repeat(50));
  console.log('账号列表:');
  console.log('='.repeat(50));
  
  accounts.forEach((acc, i) => {
    console.log(`${String(i + 1).padStart(4, ' ')}. ${acc.username}  |  ${acc.password}`);
  });
  
  console.log('='.repeat(50));
  
  // 获取账号池状态
  const poolStatus = await prisma.account.groupBy({
    by: ['status'],
    _count: true,
  });
  
  console.log('\n📊 账号池状态:');
  poolStatus.forEach(s => {
    console.log(`   ${s.status}: ${s._count} 个`);
  });
  
  console.log('\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
