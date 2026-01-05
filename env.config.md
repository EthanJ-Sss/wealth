# 前端环境变量配置说明

## 开发环境

创建 `.env.development` 文件：

```env
VITE_API_BASE_URL=http://localhost:3001
```

## 生产环境

创建 `.env.production` 文件：

```env
VITE_API_BASE_URL=https://api.your-domain.com
```

> 注意：`.env` 文件会被 git 忽略，请确保手动创建
