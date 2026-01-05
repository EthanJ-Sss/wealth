# 人生K线 - 账号系统设计文档

## 1. 概述

### 1.1 需求背景

- 用户不能自行注册账号
- 用户需从电商平台（淘宝、咸鱼、小红书等）购买后获得账号
- 每个账号预设 3 次生成次数
- 每次使用"生成"功能消耗 1 次

### 1.2 设计目标

| 目标 | 说明 |
|------|------|
| 安全性 | 防止账号盗用、密码泄露 |
| 易用性 | 用户收到账号后能快速上手 |
| 可追溯 | 每次使用都有记录，便于审计 |
| 可扩展 | 支持未来增加次数包、会员等 |

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端（React）                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐    │
│  │  登录页  │  │ 主应用  │  │路由守卫 │  │ 次数显示组件   │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘    │
└───────┼────────────┼───────────┼─────────────────┼─────────────┘
        │            │           │                 │
        ▼            ▼           ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       后端 API（Node.js）                        │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │ 认证模块  │  │ 生成模块  │  │ 用户模块  │  │ 日志模块  │    │
│  │AuthModule │  │GenModule │  │UserModule │  │LogModule │    │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘    │
└────────┼──────────────┼──────────────┼──────────────┼──────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       数据库（MySQL/PostgreSQL）                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  accounts   │  │ usage_logs  │  │    sessions (可选)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React + TypeScript | 现有技术栈 |
| 后端 | Node.js + Express | 轻量快速 |
| 数据库 | MySQL / PostgreSQL | 关系型，便于事务管理 |
| 缓存 | Redis（可选） | Session 存储、频率限制 |
| 认证 | JWT | 无状态，易于扩展 |

---

## 3. 数据库设计

### 3.1 账号表 (accounts)

```sql
CREATE TABLE accounts (
    -- 主键
    id              VARCHAR(36) PRIMARY KEY,        -- UUID
    
    -- 认证信息
    username        VARCHAR(32) UNIQUE NOT NULL,    -- 用户名（自动生成，如 LK2026010412345）
    password_hash   VARCHAR(128) NOT NULL,          -- 密码 bcrypt 哈希
    password_plain  VARCHAR(32) NULL,               -- 明文密码（仅发货时使用，可选保留）
    
    -- 使用额度
    remaining_uses  INT DEFAULT 3 NOT NULL,         -- 剩余生成次数
    total_uses      INT DEFAULT 3 NOT NULL,         -- 总次数（用于统计）
    
    -- 状态
    status          ENUM('unused', 'active', 'expired', 'disabled') DEFAULT 'unused',
    -- unused: 未使用（新生成）
    -- active: 已激活（已登录使用）
    -- expired: 次数用尽
    -- disabled: 已禁用（异常账号）
    
    -- 时间戳
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_login_at  TIMESTAMP NULL,                 -- 首次登录时间
    last_login_at   TIMESTAMP NULL,                 -- 最后登录时间
    expires_at      TIMESTAMP NULL,                 -- 过期时间（可选，不设则永久有效）
    
    -- 订单关联
    order_id        VARCHAR(64) NULL,               -- 电商平台订单号
    platform        VARCHAR(32) NULL,               -- 来源平台（taobao/xianyu/xiaohongshu）
    buyer_id        VARCHAR(64) NULL,               -- 买家ID（用于退款回收）
    
    -- 索引
    INDEX idx_status (status),
    INDEX idx_order (order_id),
    INDEX idx_platform (platform)
);
```

### 3.2 使用记录表 (usage_logs)

```sql
CREATE TABLE usage_logs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id      VARCHAR(36) NOT NULL,
    
    -- 操作类型
    action_type     ENUM('login', 'logout', 'generate_main', 'generate_wealth', 'generate_love', 'export') NOT NULL,
    
    -- 次数变化
    uses_before     INT NULL,                       -- 操作前次数
    uses_after      INT NULL,                       -- 操作后次数
    uses_consumed   INT DEFAULT 0,                  -- 本次消耗次数
    
    -- 客户端信息
    ip_address      VARCHAR(45),                    -- 支持 IPv6
    user_agent      TEXT,
    
    -- 额外数据（JSON，存储生成的八字信息等）
    extra_data      JSON NULL,
    
    -- 时间
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    INDEX idx_account (account_id),
    INDEX idx_action (action_type),
    INDEX idx_created (created_at)
);
```

### 3.3 账号生成规则

```
用户名格式：LK + YYYYMMDD + 5位序号
示例：LK2026010400001

密码格式：随机8-12位，包含大小写字母和数字
示例：Abc12345Xy
```

---

## 4. API 接口设计

### 4.1 认证相关

#### POST /api/auth/login

登录接口

**请求：**
```json
{
  "username": "LK2026010400001",
  "password": "Abc12345Xy"
}
```

**响应（成功）：**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "username": "LK2026010400001",
      "remainingUses": 3,
      "status": "active"
    }
  }
}
```

**响应（失败）：**
```json
{
  "success": false,
  "error": "用户名或密码错误"
}
```

#### POST /api/auth/logout

退出登录

**请求头：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "success": true,
  "message": "已退出登录"
}
```

#### GET /api/auth/me

获取当前用户信息

**请求头：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "success": true,
  "data": {
    "username": "LK2026010400001",
    "remainingUses": 2,
    "totalUses": 3,
    "status": "active",
    "firstLoginAt": "2026-01-04T10:30:00Z",
    "lastLoginAt": "2026-01-04T14:20:00Z"
  }
}
```

### 4.2 生成相关

#### POST /api/generate

生成命理分析（需登录，消耗次数）

**请求头：**
```
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "baziInfo": {
    "gender": "Male",
    "birthYear": "1990",
    "yearPillar": "庚午",
    "monthPillar": "戊寅",
    "dayPillar": "甲子",
    "hourPillar": "丙午"
  }
}
```

**响应（成功）：**
```json
{
  "success": true,
  "data": { /* 分析结果 */ },
  "remainingUses": 2
}
```

**响应（次数不足）：**
```json
{
  "success": false,
  "error": "生成次数已用完，请续购",
  "errorCode": "INSUFFICIENT_USES"
}
```

### 4.3 管理接口（内部使用）

#### POST /api/admin/accounts/generate

批量生成账号（供发货机器人调用）

**请求头：**
```
X-Admin-Key: <管理密钥>
```

**请求体：**
```json
{
  "count": 100,
  "usesPerAccount": 3
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "generated": 100,
    "accounts": [
      {
        "username": "LK2026010400001",
        "password": "Abc12345Xy"
      }
      // ...
    ]
  }
}
```

#### POST /api/admin/accounts/allocate

分配账号给订单

**请求体：**
```json
{
  "orderId": "TB123456789",
  "platform": "taobao",
  "buyerId": "buyer_12345"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "username": "LK2026010400001",
    "password": "Abc12345Xy"
  }
}
```

---

## 5. 前端改造

### 5.1 新增页面/组件

#### 5.1.1 登录页 (LoginPage.tsx)

```tsx
// 简洁的登录页面
// 包含：用户名输入、密码输入、登录按钮
// 可选：记住密码、忘记密码链接（跳转客服）
```

#### 5.1.2 认证上下文 (AuthContext.tsx)

```tsx
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
```

#### 5.1.3 路由守卫 (ProtectedRoute.tsx)

```tsx
// 检查是否登录
// 未登录 → 重定向到 /login
// 已登录 → 渲染子组件
```

#### 5.1.4 次数显示组件 (UsageCounter.tsx)

```tsx
// 显示在页面顶部
// 格式："剩余生成次数: 3 次"
// 次数为0时显示红色警告
```

### 5.2 改造现有组件

#### App.tsx 改动点：

1. 包裹 `AuthProvider`
2. 添加路由配置
3. 生成按钮增加次数检查

#### 生成逻辑改动：

```tsx
const handleGenerate = async () => {
  // 检查次数
  if (user.remainingUses <= 0) {
    showError('生成次数已用完，请续购');
    return;
  }
  
  // 调用 API
  const result = await generateMainAnalysis(baziInfo);
  
  // 更新本地次数显示
  if (result.success) {
    refreshUser();
  }
};
```

### 5.3 路由设计

```tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route element={<ProtectedRoute />}>
    <Route path="/" element={<App />} />
    <Route path="/analysis" element={<AnalysisPage />} />
  </Route>
</Routes>
```

---

## 6. 安全设计

### 6.1 密码安全

- **存储**：使用 bcrypt 加盐哈希，成本因子 ≥ 10
- **传输**：全站 HTTPS
- **生成**：随机 8-12 位，包含大小写字母和数字

### 6.2 Token 安全

```typescript
// JWT 配置
const jwtConfig = {
  secret: process.env.JWT_SECRET,  // 至少 256 位随机字符串
  expiresIn: '7d',                 // 7天有效期
  algorithm: 'HS256'
};
```

### 6.3 防护措施

| 威胁 | 防护措施 |
|------|---------|
| 暴力破解 | 登录失败 5 次后锁定 15 分钟 |
| 账号共享 | 可选：单设备登录，新登录踢出旧设备 |
| 重放攻击 | Token 中包含时间戳 |
| CSRF | 使用 HttpOnly Cookie 或验证 Origin |
| XSS | 前端使用 React 自带转义 |

### 6.4 审计日志

所有敏感操作都记录到 `usage_logs`：
- 登录/登出
- 每次生成
- 导出操作
- IP 和 UserAgent

---

## 7. 部署方案

### 7.1 环境变量

```bash
# 数据库
DATABASE_URL=mysql://user:pass@host:3306/lifekline

# JWT
JWT_SECRET=your-256-bit-secret-key-here

# 管理密钥（发货机器人使用）
ADMIN_API_KEY=your-admin-api-key

# Redis（可选）
REDIS_URL=redis://localhost:6379
```

### 7.2 数据库迁移

```bash
# 使用 Prisma 或其他 ORM 管理迁移
npx prisma migrate dev --name init_account_system
```

### 7.3 初始化脚本

```bash
# 生成初始账号池（1000个）
node scripts/generate-accounts.js --count=1000
```

---

## 8. 扩展性设计

### 8.1 次数包购买

未来可支持用户购买额外次数：

```sql
ALTER TABLE accounts ADD COLUMN bonus_uses INT DEFAULT 0;
-- 总可用次数 = remaining_uses + bonus_uses
```

### 8.2 会员等级

```sql
CREATE TABLE membership_tiers (
    id          INT PRIMARY KEY,
    name        VARCHAR(32),        -- 普通/VIP/SVIP
    uses_limit  INT,                -- 每月次数上限
    features    JSON                -- 额外功能
);
```

### 8.3 邀请系统

```sql
ALTER TABLE accounts ADD COLUMN referrer_id VARCHAR(36) NULL;
ALTER TABLE accounts ADD COLUMN referral_code VARCHAR(16) UNIQUE;
-- 邀请奖励逻辑
```

---

## 9. 实施计划

### Phase 1: 基础账号系统（1-2周）

- [ ] 数据库表创建
- [ ] 后端认证 API
- [ ] 前端登录页面
- [ ] 路由守卫

### Phase 2: 次数管理（1周）

- [ ] 生成时扣减次数
- [ ] 次数显示组件
- [ ] 次数不足提示

### Phase 3: 管理功能（1周）

- [ ] 账号批量生成脚本
- [ ] 账号分配 API
- [ ] 对接发货机器人

### Phase 4: 安全加固（持续）

- [ ] 频率限制
- [ ] 日志审计
- [ ] 异常检测

---

## 10. 附录

### 10.1 错误码定义

| 错误码 | 说明 |
|--------|------|
| AUTH_INVALID | 用户名或密码错误 |
| AUTH_LOCKED | 账号已锁定 |
| AUTH_EXPIRED | Token 已过期 |
| INSUFFICIENT_USES | 次数不足 |
| ACCOUNT_DISABLED | 账号已禁用 |

### 10.2 账号状态流转

```
[unused] ──登录──▶ [active] ──次数用尽──▶ [expired]
    │                 │
    │                 └──管理员禁用──▶ [disabled]
    │
    └──过期未使用──▶ [expired]
```
