# 🚀 项目改造快速入门指南

> 本文档帮助您快速完成从"娱乐风格"到"专业命理"的内容改造。

---

## 一、改造目标

将现有的"人生K线"项目中的娱乐性内容（币圈分析等）替换为专业的八字命理分析内容。

| 保持不变 | 需要修改 |
|----------|----------|
| ✅ 用户手动输入四柱干支 | 🔄 移除币圈相关内容 |
| ✅ 复制提示词到外部 AI | 🔄 添加专业命理分析维度 |
| ✅ 粘贴 JSON 数据导入 | 🔄 优化 AI 提示词 |
| ✅ K 线图表展示 | 🔄 调整分析报告卡片 |
| ✅ JSON 导入/导出 | 🔄 更新界面文案 |

---

## 二、涉及修改的文件

```
共 5 个文件需要修改：

├── types.ts                    # 数据类型定义
├── constants.ts                # AI 系统提示词
├── App.tsx                     # 主应用组件
├── components/
│   ├── AnalysisResult.tsx      # 分析报告展示
│   └── ImportDataMode.tsx      # 数据导入组件
```

---

## 三、详细修改步骤

### Step 1：修改类型定义 `types.ts`

**任务**：移除币圈字段，添加专业命理字段

```typescript
// ========== 在 AnalysisData 接口中 ==========

// ❌ 删除以下字段
crypto: string;
cryptoScore: number;
cryptoYear: string;
cryptoStyle: string;

// ✅ 添加以下字段
geJu: string;           // 格局分析
geJuScore: number;

yongShen: string;       // 用神忌神分析
yongShenScore: number;

shenSha: string;        // 神煞分析
shenShaScore: number;

liuNian: string;        // 近十年流年运势
liuNianScore: number;

kaiYun: string;         // 开运建议
kaiYunScore: number;
```

---

### Step 2：更新系统提示词 `constants.ts`

**任务**：重写 `BAZI_SYSTEM_INSTRUCTION`，移除币圈内容，添加专业分析要求

**主要修改点**：
1. 移除"币圈分析逻辑"部分
2. 添加格局分析要求
3. 添加用神忌神分析要求
4. 添加神煞分析要求
5. 添加开运建议要求
6. 更新 JSON 输出格式示例

**新版 JSON 结构**：
```json
{
  "bazi": ["年柱", "月柱", "日柱", "时柱"],
  "summary": "命理总评",
  "summaryScore": 8,
  "personality": "性格分析",
  "personalityScore": 8,
  "geJu": "格局分析",
  "geJuScore": 7,
  "yongShen": "用神忌神分析",
  "yongShenScore": 7,
  "shenSha": "神煞分析",
  "shenShaScore": 6,
  "industry": "事业分析",
  "industryScore": 7,
  "fengShui": "风水建议",
  "fengShuiScore": 8,
  "wealth": "财富分析",
  "wealthScore": 9,
  "marriage": "婚姻分析",
  "marriageScore": 6,
  "health": "健康分析",
  "healthScore": 5,
  "family": "六亲分析",
  "familyScore": 7,
  "liuNian": "近十年流年运势",
  "liuNianScore": 7,
  "kaiYun": "开运建议",
  "kaiYunScore": 8,
  "chartPoints": [...]
}
```

---

### Step 3：修改分析报告组件 `AnalysisResult.tsx`

**任务**：移除币圈卡片，添加专业分析卡片

#### 3.1 删除币圈卡片

找到并删除以下代码块：
```tsx
{/* Crypto Analysis */}
<Card
  title="币圈交易运势"
  icon={Bitcoin}
  content={analysis.crypto}
  score={analysis.cryptoScore}
  colorClass="text-amber-600"
  extraBadges={...}
/>
```

#### 3.2 添加新卡片

```tsx
// 导入新图标
import { Layers, Target, Sparkles, TrendingUp, Lightbulb } from 'lucide-react';

// 格局分析卡片
<Card
  title="格局分析"
  icon={Layers}
  content={analysis.geJu}
  score={analysis.geJuScore}
  colorClass="text-violet-600"
/>

// 用神忌神卡片
<Card
  title="用神忌神"
  icon={Target}
  content={analysis.yongShen}
  score={analysis.yongShenScore}
  colorClass="text-cyan-600"
/>

// 神煞解读卡片
<Card
  title="神煞解读"
  icon={Sparkles}
  content={analysis.shenSha}
  score={analysis.shenShaScore}
  colorClass="text-amber-600"
/>

// 近十年运势卡片
<Card
  title="近十年运势"
  icon={TrendingUp}
  content={analysis.liuNian}
  score={analysis.liuNianScore}
  colorClass="text-blue-600"
/>

// 开运建议卡片
<Card
  title="开运建议"
  icon={Lightbulb}
  content={analysis.kaiYun}
  score={analysis.kaiYunScore}
  colorClass="text-yellow-600"
/>
```

#### 3.3 推荐的卡片排列顺序

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 第一排：核心分析 */}
  <Card title="格局分析" ... />
  <Card title="用神忌神" ... />
  <Card title="性格分析" ... />
  
  {/* 第二排：事业财运 */}
  <Card title="事业行业" ... />
  <Card title="财富层级" ... />
  <Card title="婚姻情感" ... />
  
  {/* 第三排：健康六亲 */}
  <Card title="身体健康" ... />
  <Card title="六亲关系" ... />
  <Card title="神煞解读" ... />
  
  {/* 第四排：建议指导 */}
  <Card title="发展风水" ... />
  <Card title="近十年运势" ... />
  <Card title="开运建议" ... />
  
  {/* 评分讲解 */}
  <Card title="评分讲解" ... />
</div>
```

---

### Step 4：修改数据导入组件 `ImportDataMode.tsx`

**任务**：更新提示词生成和 JSON 解析

#### 4.1 更新 `generateUserPrompt` 函数

在生成的用户提示词中，移除币圈相关要求，改为：

```typescript
const userPrompt = `...
任务：
1. 确认格局与喜忌。
2. 生成 **1-100 岁 (虚岁)** 的人生流年K线数据。
3. 在 \`reason\` 字段中提供流年详批。
4. 生成带评分的命理分析报告（包含格局分析、用神忌神、神煞解读、开运建议）。

请严格按照系统指令生成 JSON 数据。务必只返回纯JSON格式数据。`;
```

#### 4.2 更新 `handleImport` 函数

```typescript
const result: LifeDestinyResult = {
  chartData: data.chartPoints,
  analysis: {
    // ... 保留原有字段 ...
    
    // 移除币圈字段，添加新字段
    geJu: data.geJu || "格局待分析",
    geJuScore: data.geJuScore || 5,
    yongShen: data.yongShen || "用神待分析",
    yongShenScore: data.yongShenScore || 5,
    shenSha: data.shenSha || "神煞待分析",
    shenShaScore: data.shenShaScore || 5,
    liuNian: data.liuNian || "流年运势待分析",
    liuNianScore: data.liuNianScore || 5,
    kaiYun: data.kaiYun || "开运建议待生成",
    kaiYunScore: data.kaiYunScore || 5,
  },
};
```

---

### Step 5：修改主应用 `App.tsx`

**任务**：适配新数据结构，更新文案

#### 5.1 更新 `handleExportJson` 函数

```typescript
const exportData = {
  // ... 保留原有字段 ...
  
  // 移除币圈字段
  // crypto: result.analysis.crypto,  // ❌ 删除
  // cryptoScore: ...                  // ❌ 删除
  // cryptoYear: ...                   // ❌ 删除
  // cryptoStyle: ...                  // ❌ 删除
  
  // 添加新字段
  geJu: result.analysis.geJu,
  geJuScore: result.analysis.geJuScore,
  yongShen: result.analysis.yongShen,
  yongShenScore: result.analysis.yongShenScore,
  shenSha: result.analysis.shenSha,
  shenShaScore: result.analysis.shenShaScore,
  liuNian: result.analysis.liuNian,
  liuNianScore: result.analysis.liuNianScore,
  kaiYun: result.analysis.kaiYun,
  kaiYunScore: result.analysis.kaiYunScore,
  chartPoints: result.chartData,
};
```

#### 5.2 更新 `handleImportJsonFile` 函数

同样的逻辑，解析新字段，移除旧字段。

#### 5.3 更新首页文案（可选）

```tsx
{/* 使用说明 */}
<div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl">
  <h3 className="font-bold text-indigo-800 mb-2">📝 使用方法</h3>
  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
    <li>填写八字信息，生成专属提示词</li>
    <li>复制提示词到任意 AI（ChatGPT、Claude、Gemini 等）</li>
    <li>将 AI 返回的 JSON 数据粘贴回来</li>
  </ol>
</div>

{/* 功能特点（可选添加） */}
<ul className="text-sm text-gray-600 space-y-1">
  <li>📊 可视化运势K线图</li>
  <li>🎯 格局分析与用神忌神</li>
  <li>✨ 神煞解读与开运建议</li>
  <li>📅 1-100岁流年详批</li>
</ul>
```

---

## 四、测试验证

### 4.1 启动开发服务器

```bash
npm run dev
```

### 4.2 测试清单

- [ ] 输入八字信息，复制提示词
- [ ] 在外部 AI 生成 JSON 数据
- [ ] 粘贴 JSON 数据导入
- [ ] 检查 K 线图正常显示
- [ ] 检查新的分析卡片正常显示
- [ ] 检查没有币圈相关内容残留
- [ ] 检查 JSON 导出包含新字段
- [ ] 检查 JSON 文件导入正常

### 4.3 常见问题

**Q: AI 返回的 JSON 缺少新字段怎么办？**

A: 代码中已设置默认值，缺失字段会显示默认文案。

**Q: 旧版 JSON 文件还能导入吗？**

A: 可以，代码会为缺失的新字段提供默认值，旧版数据仍可正常使用。

---

## 五、修改检查清单

### 代码检查
- [ ] `types.ts` 已移除币圈字段
- [ ] `types.ts` 已添加新字段
- [ ] `constants.ts` 提示词已更新
- [ ] `AnalysisResult.tsx` 币圈卡片已移除
- [ ] `AnalysisResult.tsx` 新卡片已添加
- [ ] `ImportDataMode.tsx` 已适配新字段
- [ ] `App.tsx` 导入导出逻辑已更新

### 内容检查
- [ ] 无"币圈"、"加密货币"、"Web3"字眼残留
- [ ] 新增的专业术语使用正确
- [ ] 免责声明内容合适

---

## 六、预计工作量

| 步骤 | 预计时间 |
|------|----------|
| Step 1: 修改类型定义 | 15 分钟 |
| Step 2: 更新系统提示词 | 30 分钟 |
| Step 3: 修改分析报告组件 | 45 分钟 |
| Step 4: 修改数据导入组件 | 30 分钟 |
| Step 5: 修改主应用 | 30 分钟 |
| 测试与调整 | 30 分钟 |
| **总计** | **约 3 小时** |

---

> 💡 **提示**：建议按照 Step 1 → Step 5 的顺序依次修改，每完成一步进行测试，确保功能正常后再进行下一步。
