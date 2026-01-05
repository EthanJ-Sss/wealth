# 人生K线 - 后端服务

账号系统后端服务，提供用户认证、生成次数管理、账号池管理等功能。

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库连接 (使用 SQLite)
DATABASE_URL="file:./dev.db"

# JWT 密钥 (请更换为随机字符串)
JWT_SECRET="your-secret-key-here"

# 管理 API 密钥 (发货机器人使用)
ADMIN_API_KEY="your-admin-api-key"

# 服务器端口
PORT=3001

# 前端地址
CORS_ORIGIN="http://localhost:5173"
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 创建数据库表
npm run db:push
```

### 4. 生成测试账号

```bash
# 生成 10 个账号，每个 3 次使用次数
npm run accounts:generate -- --count=10 --uses=3
```

### 5. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm run build
npm start
```

服务将在 http://localhost:3001 启动。

## API 接口

### 认证相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 登录 |
| `/api/auth/logout` | POST | 登出 |
| `/api/auth/me` | GET | 获取当前用户 |

### 生成相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/generate` | POST | 主分析（扣1次） |
| `/api/generate/wealth` | POST | 财富分析（扣1次） |
| `/api/generate/love` | POST | 桃花分析（扣1次） |
| `/api/generate/status` | GET | 获取次数状态 |

### 管理接口

需要在请求头中添加 `X-Admin-Key` 认证。

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/accounts/generate` | POST | 批量生成账号 |
| `/api/admin/accounts/allocate` | POST | 分配账号给订单 |
| `/api/admin/accounts/recycle` | POST | 回收账号 |
| `/api/admin/accounts/pool` | GET | 获取账号池状态 |
| `/api/admin/accounts/list` | GET | 获取账号列表 |

## 数据库管理

```bash
# 查看数据库（Web UI）
npm run db:studio

# 数据库迁移
npm run db:migrate
```

## 目录结构

```
server/
├── prisma/
│   └── schema.prisma      # 数据库模型
├── src/
│   ├── index.ts           # 入口文件
│   ├── lib/
│   │   ├── prisma.ts      # Prisma 客户端
│   │   ├── jwt.ts         # JWT 工具
│   │   └── password.ts    # 密码工具
│   ├── middleware/
│   │   └── auth.ts        # 认证中间件
│   ├── routes/
│   │   ├── auth.ts        # 认证路由
│   │   ├── generate.ts    # 生成路由
│   │   └── admin.ts       # 管理路由
│   └── scripts/
│       └── generateAccounts.ts  # 账号生成脚本
├── package.json
├── tsconfig.json
└── .env
```
