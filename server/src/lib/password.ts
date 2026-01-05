import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 生成随机密码 (8-12位，包含大小写字母和数字)
 */
export function generateRandomPassword(): string {
  // 排除容易混淆的字符: 0, O, l, I, 1
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const length = 8 + Math.floor(Math.random() * 4); // 8-11位
  
  let password = '';
  
  // 确保至少有一个大写、一个小写、一个数字
  const uppercase = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  
  // 填充剩余字符
  for (let i = 3; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // 打乱顺序
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
