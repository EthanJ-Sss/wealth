# 人生K线 - AI 大模型集成技术方案

## 📋 概述

### 技术选型

| 项目 | 选择 |
|------|------|
| 后端架构 | Node.js + Express 代理服务 |
| AI 模型 | Google Gemini API |
| 部署方式 | 独立服务器 / VPS |

### 核心目标

- ✅ 用户无需 VPN，通过项目方服务器代理访问 Gemini API
- ✅ 实现三个生成功能：K线主分析、财富深度分析、桃花深度分析
- ✅ 用户点击按钮后直接生成，无需手动复制粘贴

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              用户浏览器                                       │
│                          (无需 VPN / 任意网络)                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS 请求
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     项目方后端代理服务器                                       │
│                  (部署在可访问 Google API 的服务器)                            │
│                                                                             │
│   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐                │
│   │ /api/generate │   │ /api/wealth   │   │ /api/love     │                │
│   │   K线主分析    │   │  财富深度分析  │   │  桃花深度分析  │                │
│   └───────┬───────┘   └───────┬───────┘   └───────┬───────┘                │
│           │                   │                   │                        │
│           └───────────────────┼───────────────────┘                        │
│                               ▼                                            │
│                    ┌─────────────────────┐                                 │
│                    │   Gemini API 调用    │                                 │
│                    │   (服务端代理请求)    │                                 │
│                    └─────────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ 服务器有外网访问能力
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Google Gemini API                                    │
│                   https://generativelanguage.googleapis.com                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 关键点

1. **用户端**：只需能访问项目方服务器即可，无需 VPN
2. **服务器端**：部署在可以访问 Google API 的服务器（海外 VPS 或配置代理）
3. **API Key**：存储在服务器环境变量中，对用户完全透明

---

## 📁 目录结构

### 后端服务（新建）

```
lifekline-server/
├── package.json
├── tsconfig.json
├── .env                      # 环境变量（不提交到 Git）
├── .env.example              # 环境变量示例
├── src/
│   ├── index.ts              # 入口文件
│   ├── routes/
│   │   ├── generate.ts       # K线主分析路由
│   │   ├── wealth.ts         # 财富深度分析路由
│   │   └── love.ts           # 桃花深度分析路由
│   ├── services/
│   │   └── gemini.ts         # Gemini API 封装
│   ├── prompts/
│   │   ├── main.ts           # K线主分析 Prompt
│   │   ├── wealth.ts         # 财富分析 Prompt
│   │   └── love.ts           # 桃花分析 Prompt
│   └── utils/
│       └── parseJson.ts      # JSON 解析工具
└── README.md
```

### 前端变更

```
lifekline-main/
├── services/
│   └── apiService.ts         # 新增：调用后端 API
├── components/
│   ├── ImportDataMode.tsx    # 修改：增加一键生成按钮
│   ├── DeepAnalysisPanel.tsx # 修改：增加一键生成按钮
│   └── GeneratingModal.tsx   # 新增：生成中弹窗
└── ...
```

---

## 🔧 后端实现

### 1. 环境配置

#### `.env.example`

```env
# 服务器端口
PORT=3001

# Gemini API 配置
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# 可选：如果服务器需要代理访问 Google
# HTTP_PROXY=http://127.0.0.1:7890
# HTTPS_PROXY=http://127.0.0.1:7890

# 允许的前端域名（CORS）
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com
```

#### `package.json`

```json
{
  "name": "lifekline-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

### 2. 入口文件

#### `src/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import generateRouter from './routes/generate.js';
import wealthRouter from './routes/wealth.js';
import loveRouter from './routes/love.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 配置
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如 Postman）
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/generate', generateRouter);
app.use('/api/wealth', wealthRouter);
app.use('/api/love', loveRouter);

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Gemini Model: ${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}`);
});
```

### 3. Gemini API 封装

#### `src/services/gemini.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface GenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export async function generateWithGemini(options: GenerateOptions): Promise<string> {
  const { systemPrompt, userPrompt, maxTokens = 30000, temperature = 0.7 } = options;

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const model = genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  });

  // Gemini 使用 system instruction
  const chat = model.startChat({
    history: [],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  });

  // 将 system prompt 和 user prompt 合并发送
  const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;
  
  const result = await chat.sendMessage(fullPrompt);
  const response = result.response;
  const text = response.text();

  return text;
}

export function parseJsonFromResponse(content: string): any {
  let jsonContent = content.trim();

  // 尝试提取 ```json ... ``` 中的内容
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1].trim();
  } else {
    // 尝试找到 JSON 对象
    const jsonStartIndex = content.indexOf('{');
    const jsonEndIndex = content.lastIndexOf('}');
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
      jsonContent = content.substring(jsonStartIndex, jsonEndIndex + 1);
    }
  }

  return JSON.parse(jsonContent);
}
```

### 4. K线主分析路由

#### `src/routes/generate.ts`

```typescript
import { Router, Request, Response } from 'express';
import { generateWithGemini, parseJsonFromResponse } from '../services/gemini.js';
import { BAZI_SYSTEM_INSTRUCTION, buildMainUserPrompt } from '../prompts/main.js';

const router = Router();

interface BaziInfo {
  name?: string;
  gender: 'Male' | 'Female';
  birthYear: string;
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  startAge: string;
  firstDaYun: string;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { baziInfo } = req.body as { baziInfo: BaziInfo };

    // 验证必填字段
    if (!baziInfo || !baziInfo.yearPillar || !baziInfo.monthPillar || 
        !baziInfo.dayPillar || !baziInfo.hourPillar) {
      return res.status(400).json({ error: '八字信息不完整' });
    }

    console.log(`[Generate] 开始生成 K线分析: ${baziInfo.yearPillar} ${baziInfo.monthPillar} ${baziInfo.dayPillar} ${baziInfo.hourPillar}`);

    const userPrompt = buildMainUserPrompt(baziInfo);
    
    const responseText = await generateWithGemini({
      systemPrompt: BAZI_SYSTEM_INSTRUCTION,
      userPrompt,
      maxTokens: 30000,
      temperature: 0.7,
    });

    const data = parseJsonFromResponse(responseText);

    // 验证返回数据
    if (!data.chartPoints || !Array.isArray(data.chartPoints)) {
      throw new Error('返回数据格式不正确：缺少 chartPoints');
    }

    console.log(`[Generate] 生成成功，共 ${data.chartPoints.length} 条数据`);

    res.json({ success: true, data });

  } catch (error: any) {
    console.error('[Generate] 错误:', error);
    res.status(500).json({ 
      error: error.message || '生成失败，请稍后重试',
      code: 'GENERATE_ERROR'
    });
  }
});

export default router;
```

### 5. 财富分析路由

#### `src/routes/wealth.ts`

```typescript
import { Router, Request, Response } from 'express';
import { generateWithGemini, parseJsonFromResponse } from '../services/gemini.js';
import { WEALTH_ANALYSIS_SYSTEM_INSTRUCTION, buildWealthUserPrompt } from '../prompts/wealth.js';

const router = Router();

interface WealthRequest {
  bazi: string[];
  birthYear: number;
  summary?: string;
  geJu?: string;
  yongShen?: string;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { bazi, birthYear, summary, geJu, yongShen } = req.body as WealthRequest;

    if (!bazi || bazi.length !== 4 || !birthYear) {
      return res.status(400).json({ error: '八字信息不完整' });
    }

    console.log(`[Wealth] 开始生成财富分析: ${bazi.join(' ')}`);

    const userPrompt = buildWealthUserPrompt({ bazi, birthYear, summary, geJu, yongShen });

    const responseText = await generateWithGemini({
      systemPrompt: WEALTH_ANALYSIS_SYSTEM_INSTRUCTION,
      userPrompt,
      maxTokens: 20000,
      temperature: 0.7,
    });

    const data = parseJsonFromResponse(responseText);

    // 提取 wealthAnalysis 对象
    const wealthAnalysis = data.wealthAnalysis || data;

    if (!wealthAnalysis.wealthYearlyData || !Array.isArray(wealthAnalysis.wealthYearlyData)) {
      throw new Error('返回数据格式不正确：缺少 wealthYearlyData');
    }

    console.log(`[Wealth] 生成成功，共 ${wealthAnalysis.wealthYearlyData.length} 条年度数据`);

    res.json({ success: true, data: wealthAnalysis });

  } catch (error: any) {
    console.error('[Wealth] 错误:', error);
    res.status(500).json({ 
      error: error.message || '生成失败，请稍后重试',
      code: 'WEALTH_ERROR'
    });
  }
});

export default router;
```

### 6. 桃花分析路由

#### `src/routes/love.ts`

```typescript
import { Router, Request, Response } from 'express';
import { generateWithGemini, parseJsonFromResponse } from '../services/gemini.js';
import { LOVE_ANALYSIS_SYSTEM_INSTRUCTION, buildLoveUserPrompt } from '../prompts/love.js';

const router = Router();

interface LoveRequest {
  bazi: string[];
  birthYear: number;
  summary?: string;
  geJu?: string;
  yongShen?: string;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { bazi, birthYear, summary, geJu, yongShen } = req.body as LoveRequest;

    if (!bazi || bazi.length !== 4 || !birthYear) {
      return res.status(400).json({ error: '八字信息不完整' });
    }

    console.log(`[Love] 开始生成桃花分析: ${bazi.join(' ')}`);

    const userPrompt = buildLoveUserPrompt({ bazi, birthYear, summary, geJu, yongShen });

    const responseText = await generateWithGemini({
      systemPrompt: LOVE_ANALYSIS_SYSTEM_INSTRUCTION,
      userPrompt,
      maxTokens: 20000,
      temperature: 0.7,
    });

    const data = parseJsonFromResponse(responseText);

    // 提取 loveAnalysis 对象
    const loveAnalysis = data.loveAnalysis || data;

    if (!loveAnalysis.loveYearlyData || !Array.isArray(loveAnalysis.loveYearlyData)) {
      throw new Error('返回数据格式不正确：缺少 loveYearlyData');
    }

    console.log(`[Love] 生成成功，共 ${loveAnalysis.loveYearlyData.length} 条年度数据`);

    res.json({ success: true, data: loveAnalysis });

  } catch (error: any) {
    console.error('[Love] 错误:', error);
    res.status(500).json({ 
      error: error.message || '生成失败，请稍后重试',
      code: 'LOVE_ERROR'
    });
  }
});

export default router;
```

### 7. Prompt 文件

#### `src/prompts/main.ts`

```typescript
// 从前端 constants.ts 复制 BAZI_SYSTEM_INSTRUCTION
export const BAZI_SYSTEM_INSTRUCTION = `
你是一位专业的八字命理分析师，精通子平八字命理学...
（完整内容从前端 constants.ts 复制）
`;

interface BaziInfo {
  name?: string;
  gender: 'Male' | 'Female';
  birthYear: string;
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  startAge: string;
  firstDaYun: string;
}

export function buildMainUserPrompt(baziInfo: BaziInfo): string {
  const genderStr = baziInfo.gender === 'Male' ? '男 (乾造)' : '女 (坤造)';
  const startAgeInt = parseInt(baziInfo.startAge) || 1;

  // 计算大运方向
  const firstChar = baziInfo.yearPillar.trim().charAt(0);
  const yangStems = ['甲', '丙', '戊', '庚', '壬'];
  const isYangYear = yangStems.includes(firstChar);
  const isForward = baziInfo.gender === 'Male' ? isYangYear : !isYangYear;
  const daYunDirectionStr = isForward ? '顺行 (Forward)' : '逆行 (Backward)';
  const yearStemPolarity = isYangYear ? '阳' : '阴';

  const directionExample = isForward
    ? "例如：第一步是【戊申】，第二步则是【己酉】（顺排）"
    : "例如：第一步是【戊申】，第二步则是【丁未】（逆排）";

  return `请根据以下**已经排好的**八字四柱和**指定的大运信息**进行分析。

【基本信息】
性别：${genderStr}
姓名：${baziInfo.name || "未提供"}
出生年份：${baziInfo.birthYear}年 (阳历)

【八字四柱】
年柱：${baziInfo.yearPillar} (天干属性：${yearStemPolarity})
月柱：${baziInfo.monthPillar}
日柱：${baziInfo.dayPillar}
时柱：${baziInfo.hourPillar}

【大运核心参数】
1. 起运年龄：${baziInfo.startAge} 岁 (虚岁)。
2. 第一步大运：${baziInfo.firstDaYun}。
3. **排序方向**：${daYunDirectionStr}。

【必须执行的算法 - 大运序列生成】
请严格按照以下步骤生成数据：

1. **锁定第一步**：确认【${baziInfo.firstDaYun}】为第一步大运。
2. **计算序列**：根据六十甲子顺序和方向（${daYunDirectionStr}），推算出接下来的 9 步大运。
   ${directionExample}
3. **填充 JSON**：
   - Age 1 到 ${startAgeInt - 1}: daYun = "童限"
   - Age ${startAgeInt} 到 ${startAgeInt + 9}: daYun = [第1步大运: ${baziInfo.firstDaYun}]
   - Age ${startAgeInt + 10} 到 ${startAgeInt + 19}: daYun = [第2步大运]
   - ...以此类推直到 100 岁。

【特别警告】
- **daYun 字段**：必须填大运干支（10年一变），**绝对不要**填流年干支。
- **ganZhi 字段**：填入该年份的**流年干支**（每年一变，例如 2024=甲辰，2025=乙巳）。

任务：
1. 确认格局与喜忌。
2. 生成 **1-100 岁 (虚岁)** 的人生流年K线数据。
3. 在 \`reason\` 字段中提供流年详批。
4. 生成带评分的命理分析报告。

请严格按照系统指令生成 JSON 数据。务必只返回纯JSON格式数据，不要包含任何markdown代码块标记或其他文字说明。`;
}
```

#### `src/prompts/wealth.ts`

```typescript
// 从前端 constants.ts 复制 WEALTH_ANALYSIS_SYSTEM_INSTRUCTION
export const WEALTH_ANALYSIS_SYSTEM_INSTRUCTION = `
你是一位专业的八字命理分析师，专精财运分析...
（完整内容从前端 constants.ts 复制）
`;

interface WealthPromptInput {
  bazi: string[];
  birthYear: number;
  summary?: string;
  geJu?: string;
  yongShen?: string;
}

export function buildWealthUserPrompt(input: WealthPromptInput): string {
  return `请根据以下八字信息生成财富深度分析报告。

【八字四柱】
${input.bazi.join('、')}
年柱：${input.bazi[0]}
月柱：${input.bazi[1]}
日柱：${input.bazi[2]}
时柱：${input.bazi[3]}

【出生年份】
${input.birthYear}年 (阳历)

【已有分析摘要】
命理总评：${input.summary || '待分析'}
格局分析：${input.geJu || '待分析'}
用神忌神：${input.yongShen || '待分析'}

请严格按照系统指令生成 JSON 数据。务必只返回纯JSON格式数据，不要包含任何markdown代码块标记或其他文字说明。
必须生成 wealthYearlyData 数组，包含 100 条数据（1-100岁）。`;
}
```

#### `src/prompts/love.ts`

```typescript
// 从前端 constants.ts 复制 LOVE_ANALYSIS_SYSTEM_INSTRUCTION
export const LOVE_ANALYSIS_SYSTEM_INSTRUCTION = `
你是一位专业的八字命理分析师，专精婚姻感情分析...
（完整内容从前端 constants.ts 复制）
`;

interface LovePromptInput {
  bazi: string[];
  birthYear: number;
  summary?: string;
  geJu?: string;
  yongShen?: string;
}

export function buildLoveUserPrompt(input: LovePromptInput): string {
  return `请根据以下八字信息生成桃花运势深度分析报告。

【八字四柱】
${input.bazi.join('、')}
年柱：${input.bazi[0]}
月柱：${input.bazi[1]}
日柱：${input.bazi[2]}
时柱：${input.bazi[3]}

【出生年份】
${input.birthYear}年 (阳历)

【已有分析摘要】
命理总评：${input.summary || '待分析'}
格局分析：${input.geJu || '待分析'}
用神忌神：${input.yongShen || '待分析'}

请严格按照系统指令生成 JSON 数据。务必只返回纯JSON格式数据，不要包含任何markdown代码块标记或其他文字说明。
必须生成 loveYearlyData 数组，包含 100 条数据（1-100岁）。`;
}
```

---

## 🌐 前端实现

### 1. API 服务封装

#### `services/apiService.ts`（新建）

```typescript
// services/apiService.ts

// 后端服务地址（开发环境 / 生产环境）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface BaziInfo {
  name?: string;
  gender: 'Male' | 'Female';
  birthYear: string;
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  startAge: string;
  firstDaYun: string;
}

export interface GenerateResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * 生成 K线主分析
 */
export async function generateMainAnalysis(baziInfo: BaziInfo): Promise<GenerateResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baziInfo }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || '生成失败' };
    }

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('generateMainAnalysis error:', error);
    return { success: false, error: '网络错误，请检查网络连接' };
  }
}

/**
 * 生成财富深度分析
 */
export async function generateWealthAnalysis(params: {
  bazi: string[];
  birthYear: number;
  summary?: string;
  geJu?: string;
  yongShen?: string;
}): Promise<GenerateResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wealth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || '生成失败' };
    }

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('generateWealthAnalysis error:', error);
    return { success: false, error: '网络错误，请检查网络连接' };
  }
}

/**
 * 生成桃花深度分析
 */
export async function generateLoveAnalysis(params: {
  bazi: string[];
  birthYear: number;
  summary?: string;
  geJu?: string;
  yongShen?: string;
}): Promise<GenerateResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/love`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || '生成失败' };
    }

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('generateLoveAnalysis error:', error);
    return { success: false, error: '网络错误，请检查网络连接' };
  }
}
```

### 2. 环境变量配置

#### `.env.development`

```env
VITE_API_BASE_URL=http://localhost:3001
```

#### `.env.production`

```env
VITE_API_BASE_URL=https://api.your-domain.com
```

### 3. 生成中弹窗组件

#### `components/GeneratingModal.tsx`（新建）

```typescript
import React from 'react';
import { Loader2 } from 'lucide-react';

interface GeneratingModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
}

const GeneratingModal: React.FC<GeneratingModalProps> = ({
  isOpen,
  title = '正在生成分析报告',
  message = '请稍候，AI 正在为您分析命盘...'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center gap-6">
          {/* 加载动画 */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
            <Loader2 className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-500">{message}</p>
          </div>

          {/* 进度提示 */}
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full animate-pulse" 
                 style={{ width: '60%' }} />
          </div>
          
          <p className="text-sm text-gray-400">预计需要 30-60 秒</p>
        </div>
      </div>
    </div>
  );
};

export default GeneratingModal;
```

### 4. 修改 ImportDataMode.tsx

在现有组件基础上，增加"一键生成"按钮：

```typescript
// 在 ImportDataMode.tsx 中添加

import { generateMainAnalysis } from '../services/apiService';
import GeneratingModal from './GeneratingModal';

// 在组件内添加状态
const [isGenerating, setIsGenerating] = useState(false);
const [generateError, setGenerateError] = useState<string | null>(null);

// 添加一键生成函数
const handleAutoGenerate = async () => {
  if (!isStep1Valid) return;
  
  setIsGenerating(true);
  setGenerateError(null);
  
  try {
    const result = await generateMainAnalysis({
      name: baziInfo.name,
      gender: baziInfo.gender as 'Male' | 'Female',
      birthYear: baziInfo.birthYear,
      yearPillar: baziInfo.yearPillar,
      monthPillar: baziInfo.monthPillar,
      dayPillar: baziInfo.dayPillar,
      hourPillar: baziInfo.hourPillar,
      startAge: baziInfo.startAge,
      firstDaYun: baziInfo.firstDaYun,
    });
    
    if (result.success && result.data) {
      // 转换数据格式
      const importedResult = {
        chartData: result.data.chartPoints,
        analysis: {
          bazi: result.data.bazi || [],
          summary: result.data.summary || "无摘要",
          // ... 其他字段
        },
      };
      onDataImport(importedResult);
    } else {
      setGenerateError(result.error || '生成失败');
    }
  } catch (error: any) {
    setGenerateError(error.message || '未知错误');
  } finally {
    setIsGenerating(false);
  }
};

// 在 JSX 中添加按钮（步骤1完成后显示）
{isStep1Valid && (
  <button
    onClick={handleAutoGenerate}
    disabled={isGenerating}
    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mb-4"
  >
    <Sparkles className="w-5 h-5" />
    ✨ 一键生成命理分析
  </button>
)}

{generateError && (
  <div className="text-red-500 bg-red-50 p-3 rounded-lg mb-4">
    {generateError}
  </div>
)}

{/* 生成中弹窗 */}
<GeneratingModal isOpen={isGenerating} />
```

### 5. 修改 DeepAnalysisPanel.tsx

类似地，为财富和桃花分析添加一键生成：

```typescript
// 在 DeepAnalysisPanel.tsx 中添加

import { generateWealthAnalysis, generateLoveAnalysis } from '../services/apiService';
import GeneratingModal from './GeneratingModal';

// 添加状态
const [isGeneratingWealth, setIsGeneratingWealth] = useState(false);
const [isGeneratingLove, setIsGeneratingLove] = useState(false);

// 财富一键生成
const handleAutoGenerateWealth = async () => {
  setIsGeneratingWealth(true);
  setWealthError(null);
  
  try {
    const result = await generateWealthAnalysis({
      bazi: analysis.bazi,
      birthYear,
      summary: analysis.summary,
      geJu: analysis.geJu,
      yongShen: analysis.yongShen,
    });
    
    if (result.success && result.data) {
      onWealthAnalysisUpdate(result.data);
      setWealthStep('result');
    } else {
      setWealthError(result.error || '生成失败');
    }
  } catch (error: any) {
    setWealthError(error.message);
  } finally {
    setIsGeneratingWealth(false);
  }
};

// 桃花一键生成
const handleAutoGenerateLove = async () => {
  setIsGeneratingLove(true);
  setLoveError(null);
  
  try {
    const result = await generateLoveAnalysis({
      bazi: analysis.bazi,
      birthYear,
      summary: analysis.summary,
      geJu: analysis.geJu,
      yongShen: analysis.yongShen,
    });
    
    if (result.success && result.data) {
      onLoveAnalysisUpdate(result.data);
      setLoveStep('result');
    } else {
      setLoveError(result.error || '生成失败');
    }
  } catch (error: any) {
    setLoveError(error.message);
  } finally {
    setIsGeneratingLove(false);
  }
};
```

---

## 🚀 部署指南

### 服务器要求

- 可访问 Google API（海外 VPS 或配置代理）
- Node.js 18+
- 建议配置：1 核 CPU / 1GB RAM 起步

### 推荐 VPS 服务商

| 服务商 | 最低价格 | 位置 | 推荐度 |
|--------|----------|------|--------|
| Vultr | $5/月 | 日本/新加坡 | ⭐⭐⭐⭐⭐ |
| DigitalOcean | $6/月 | 新加坡 | ⭐⭐⭐⭐ |
| Linode | $5/月 | 日本 | ⭐⭐⭐⭐ |
| AWS Lightsail | $3.5/月 | 东京 | ⭐⭐⭐⭐ |

### 部署步骤

```bash
# 1. 克隆后端代码到服务器
git clone your-repo lifekline-server
cd lifekline-server

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
nano .env  # 编辑填入 GEMINI_API_KEY 等

# 4. 构建
npm run build

# 5. 使用 PM2 运行
npm install -g pm2
pm2 start dist/index.js --name lifekline-api

# 6. 设置开机自启
pm2 startup
pm2 save
```

### Nginx 反向代理配置

```nginx
server {
    listen 443 ssl;
    server_name api.your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        
        # 增加超时时间（Gemini 生成可能需要较长时间）
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

---

## 📊 API 接口文档

### 1. K线主分析

**POST** `/api/generate`

**请求体：**
```json
{
  "baziInfo": {
    "name": "张三",
    "gender": "Male",
    "birthYear": "1990",
    "yearPillar": "庚午",
    "monthPillar": "丁亥",
    "dayPillar": "甲子",
    "hourPillar": "壬申",
    "startAge": "8",
    "firstDaYun": "丙戌"
  }
}
```

**成功响应：**
```json
{
  "success": true,
  "data": {
    "bazi": ["庚午", "丁亥", "甲子", "壬申"],
    "summary": "...",
    "chartPoints": [
      {"age": 1, "year": 1990, ...},
      ...
    ]
  }
}
```

### 2. 财富深度分析

**POST** `/api/wealth`

**请求体：**
```json
{
  "bazi": ["庚午", "丁亥", "甲子", "壬申"],
  "birthYear": 1990,
  "summary": "命理总评...",
  "geJu": "格局分析...",
  "yongShen": "用神忌神..."
}
```

**成功响应：**
```json
{
  "success": true,
  "data": {
    "wealthStar": "...",
    "wealthStarScore": 7,
    "wealthYearlyData": [...]
  }
}
```

### 3. 桃花深度分析

**POST** `/api/love`

**请求体：**
```json
{
  "bazi": ["庚午", "丁亥", "甲子", "壬申"],
  "birthYear": 1990,
  "summary": "命理总评...",
  "geJu": "格局分析...",
  "yongShen": "用神忌神..."
}
```

**成功响应：**
```json
{
  "success": true,
  "data": {
    "loveStar": "...",
    "loveStarScore": 8,
    "loveYearlyData": [...]
  }
}
```

---

## ⚠️ 注意事项

### Gemini API 配额

| 模型 | 免费额度 | 付费价格 |
|------|----------|----------|
| Gemini 1.5 Flash | 15 RPM / 100万 tokens/天 | $0.075/M 输入, $0.30/M 输出 |
| Gemini 1.5 Pro | 2 RPM / 5万 tokens/天 | $1.25/M 输入, $5.00/M 输出 |

> RPM = Requests Per Minute（每分钟请求数）

### 错误处理

| 错误码 | 说明 | 解决方案 |
|--------|------|---------|
| 429 | 超出 API 配额 | 升级付费计划或等待重置 |
| 503 | Gemini 服务不可用 | 稍后重试 |
| ENOTFOUND | 无法连接 Google API | 检查服务器网络/代理配置 |

---

## 📝 实施清单

### 后端开发（1-2 天）

- [ ] 初始化后端项目 `lifekline-server`
- [ ] 配置 Express + TypeScript
- [ ] 实现 Gemini API 封装 `services/gemini.ts`
- [ ] 实现 K线主分析路由 `routes/generate.ts`
- [ ] 实现财富分析路由 `routes/wealth.ts`
- [ ] 实现桃花分析路由 `routes/love.ts`
- [ ] 从前端复制 Prompt 常量
- [ ] 本地测试 API

### 前端开发（0.5-1 天）

- [ ] 创建 `services/apiService.ts`
- [ ] 创建 `GeneratingModal.tsx` 组件
- [ ] 修改 `ImportDataMode.tsx` - 添加一键生成
- [ ] 修改 `DeepAnalysisPanel.tsx` - 添加一键生成
- [ ] 配置环境变量 `.env.development` / `.env.production`

### 部署（0.5 天）

- [ ] 购买/配置海外 VPS
- [ ] 部署后端服务
- [ ] 配置 Nginx 反向代理
- [ ] 配置 SSL 证书
- [ ] 更新前端生产环境配置
- [ ] 端到端测试

---

## 📞 下一步

文档已更新完成，确认后我可以开始实现代码：

1. **先创建后端项目** - `lifekline-server` 完整代码
2. **再修改前端代码** - 添加 API 调用和生成按钮

是否开始实现？
