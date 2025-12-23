# 🧮 八字排盘工具 - 功能规划文档

> **目标**：为不了解八字的用户提供自动排盘功能，只需输入出生年月日时间，即可自动生成四柱干支和大运信息。

---

## 一、功能概述

### 1.1 当前问题

现有系统要求用户手动输入：
- 四柱干支（年柱、月柱、日柱、时柱）
- 起运年龄
- 第一步大运

**问题**：大多数用户不具备排盘知识，无法自行获取这些信息。

### 1.2 解决方案

添加"自动排盘"功能：
- 用户只需输入：**出生年、月、日、时、分、性别**
- 系统自动计算并填充：四柱干支、起运年龄、第一步大运、大运方向

### 1.3 功能流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户输入                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  年份   │ │  月份   │ │  日期   │ │  时辰   │ │  性别   │   │
│  │  1990   │ │   5     │ │   15    │ │  10:30  │ │   男    │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                     [ 点击"自动排盘" ]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      自动生成结果                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │  年柱   │ │  月柱   │ │  日柱   │ │  时柱   │               │
│  │  庚午   │ │  辛巳   │ │  甲申   │ │  己巳   │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                  │
│  起运年龄: 8岁    第一步大运: 壬午    大运方向: 顺行             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、技术方案

### 2.1 推荐方案：使用 lunar-javascript 库

**lunar-javascript** 是一个功能完善的农历/八字计算库，支持：
- 阳历转农历
- 八字四柱计算
- 大运计算
- 节气判断
- 神煞计算

```bash
npm install lunar-javascript
```

**优点**：
- ✅ 成熟稳定，GitHub 4k+ stars
- ✅ 纯 JavaScript，无需后端
- ✅ 功能全面，包含完整的八字计算
- ✅ 持续维护更新

### 2.2 备选方案

| 方案 | 优点 | 缺点 |
|------|------|------|
| 自行实现算法 | 无依赖、可定制 | 工作量大、易出错 |
| 调用第三方 API | 无需本地计算 | 需要网络、可能收费 |
| 使用其他库 | - | 功能可能不全 |

### 2.3 核心依赖

```json
{
  "dependencies": {
    "lunar-javascript": "^1.6.12"
  }
}
```

---

## 三、数据结构设计

### 3.1 用户输入

```typescript
interface BirthTimeInput {
  year: number;         // 出生年份 (阳历)，如 1990
  month: number;        // 出生月份 (阳历)，1-12
  day: number;          // 出生日期 (阳历)，1-31
  hour: number;         // 出生时辰，0-23
  minute: number;       // 出生分钟，0-59
  gender: 'male' | 'female';  // 性别
  isLunar?: boolean;    // 是否农历输入（可选，默认阳历）
}
```

### 3.2 排盘结果

```typescript
interface PaipanResult {
  // 四柱信息
  yearPillar: string;   // 年柱，如 "庚午"
  monthPillar: string;  // 月柱，如 "辛巳"
  dayPillar: string;    // 日柱，如 "甲申"
  hourPillar: string;   // 时柱，如 "己巳"
  
  // 大运信息
  startAge: number;     // 起运年龄（虚岁）
  firstDaYun: string;   // 第一步大运干支
  daYunDirection: 'forward' | 'backward';  // 大运方向
  
  // 附加信息
  lunarDate: string;    // 农历日期
  solarTerm: string;    // 节气
  zodiac: string;       // 生肖
  dayMaster: string;    // 日主（日干）
  
  // 大运列表（10步）
  daYunList: Array<{
    ganZhi: string;     // 大运干支
    startAge: number;   // 开始年龄
    endAge: number;     // 结束年龄
  }>;
}
```

---

## 四、核心实现

### 4.1 创建排盘服务

**文件**: `services/paipanService.ts`

```typescript
import { Solar, Lunar } from 'lunar-javascript';

export interface BirthTimeInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: 'male' | 'female';
}

export interface PaipanResult {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  startAge: number;
  firstDaYun: string;
  daYunDirection: 'forward' | 'backward';
  lunarDate: string;
  solarTerm: string;
  zodiac: string;
  dayMaster: string;
  daYunList: Array<{
    ganZhi: string;
    startAge: number;
    endAge: number;
  }>;
}

/**
 * 根据出生时间自动排盘
 */
export function calculateBazi(input: BirthTimeInput): PaipanResult {
  // 1. 创建阳历日期对象
  const solar = Solar.fromYmdHms(
    input.year,
    input.month,
    input.day,
    input.hour,
    input.minute,
    0
  );
  
  // 2. 获取农历信息
  const lunar = solar.getLunar();
  
  // 3. 获取八字
  const bazi = lunar.getEightChar();
  
  // 4. 获取四柱
  const yearPillar = bazi.getYear();
  const monthPillar = bazi.getMonth();
  const dayPillar = bazi.getDay();
  const hourPillar = bazi.getTime();
  
  // 5. 获取大运（1=男, 0=女）
  const genderValue = input.gender === 'male' ? 1 : 0;
  const yun = bazi.getYun(genderValue);
  
  // 6. 获取起运年龄
  const startAge = yun.getStartYear();
  
  // 7. 获取大运列表
  const daYunArr = yun.getDaYun();
  const daYunList = daYunArr.slice(1, 11).map((dy: any, index: number) => ({
    ganZhi: dy.getGanZhi(),
    startAge: startAge + index * 10,
    endAge: startAge + (index + 1) * 10 - 1,
  }));
  
  // 8. 判断大运方向（顺行/逆行）
  const yearGan = yearPillar.charAt(0);
  const yangGans = ['甲', '丙', '戊', '庚', '壬'];
  const isYangYear = yangGans.includes(yearGan);
  const isForward = input.gender === 'male' ? isYangYear : !isYangYear;
  
  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    startAge,
    firstDaYun: daYunList[0]?.ganZhi || '',
    daYunDirection: isForward ? 'forward' : 'backward',
    lunarDate: lunar.toString(),
    solarTerm: lunar.getJieQi() || '无',
    zodiac: lunar.getYearShengXiao(),
    dayMaster: dayPillar.charAt(0),
    daYunList,
  };
}

/**
 * 获取十二时辰列表（用于下拉选择）
 */
export function getShiChenList(): Array<{ value: number; label: string; range: string }> {
  return [
    { value: 0, label: '子时', range: '23:00-01:00' },
    { value: 2, label: '丑时', range: '01:00-03:00' },
    { value: 4, label: '寅时', range: '03:00-05:00' },
    { value: 6, label: '卯时', range: '05:00-07:00' },
    { value: 8, label: '辰时', range: '07:00-09:00' },
    { value: 10, label: '巳时', range: '09:00-11:00' },
    { value: 12, label: '午时', range: '11:00-13:00' },
    { value: 14, label: '未时', range: '13:00-15:00' },
    { value: 16, label: '申时', range: '15:00-17:00' },
    { value: 18, label: '酉时', range: '17:00-19:00' },
    { value: 20, label: '戌时', range: '19:00-21:00' },
    { value: 22, label: '亥时', range: '21:00-23:00' },
  ];
}
```

### 4.2 创建排盘表单组件

**文件**: `components/AutoPaipanForm.tsx`

```typescript
import React, { useState } from 'react';
import { calculateBazi, PaipanResult, getShiChenList } from '../services/paipanService';
import { Calendar, Clock, User, Sparkles, AlertCircle } from 'lucide-react';

interface AutoPaipanFormProps {
  onResult: (result: PaipanResult) => void;
}

const AutoPaipanForm: React.FC<AutoPaipanFormProps> = ({ onResult }) => {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear() - 30,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    gender: 'male' as 'male' | 'female',
    useShiChen: true,  // 是否使用时辰选择
  });
  
  const [result, setResult] = useState<PaipanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const shiChenList = getShiChenList();
  
  const handleCalculate = () => {
    try {
      setError(null);
      const paipanResult = calculateBazi(formData);
      setResult(paipanResult);
      onResult(paipanResult);
    } catch (err: any) {
      setError(`排盘失败：${err.message}`);
    }
  };
  
  // 生成年份选项（1900-2100）
  const yearOptions = Array.from({ length: 201 }, (_, i) => 1900 + i);
  
  // 生成月份选项
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // 生成日期选项（根据年月动态计算）
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };
  const dayOptions = Array.from(
    { length: getDaysInMonth(formData.year, formData.month) },
    (_, i) => i + 1
  );
  
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-purple-600" />
        <h3 className="font-bold text-purple-800">自动排盘</h3>
        <span className="text-xs text-purple-500">输入出生时间，自动生成八字</span>
      </div>
      
      {/* 出生日期 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">年</label>
          <select
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">月</label>
          <select
            value={formData.month}
            onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          >
            {monthOptions.map(m => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">日</label>
          <select
            value={formData.day}
            onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          >
            {dayOptions.map(d => (
              <option key={d} value={d}>{d}日</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* 出生时辰 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            <Clock className="w-3 h-3 inline mr-1" />
            时辰
          </label>
          <select
            value={formData.hour}
            onChange={(e) => setFormData({ ...formData, hour: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          >
            {shiChenList.map(sc => (
              <option key={sc.value} value={sc.value}>
                {sc.label} ({sc.range})
              </option>
            ))}
            <option value={-1}>不知道时辰</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            <User className="w-3 h-3 inline mr-1" />
            性别
          </label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
            className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="male">男 (乾造)</option>
            <option value="female">女 (坤造)</option>
          </select>
        </div>
      </div>
      
      {/* 排盘按钮 */}
      <button
        onClick={handleCalculate}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        自动排盘
      </button>
      
      {/* 错误提示 */}
      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {/* 排盘结果预览 */}
      {result && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-purple-100">
          <h4 className="font-bold text-gray-800 mb-3">排盘结果</h4>
          
          {/* 四柱 */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: '年柱', value: result.yearPillar },
              { label: '月柱', value: result.monthPillar },
              { label: '日柱', value: result.dayPillar },
              { label: '时柱', value: result.hourPillar },
            ].map((item, i) => (
              <div key={i} className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="text-xl font-serif-sc font-bold text-gray-800">{item.value}</div>
              </div>
            ))}
          </div>
          
          {/* 附加信息 */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">农历:</span>
              <span className="font-medium">{result.lunarDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">生肖:</span>
              <span className="font-medium">{result.zodiac}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">起运:</span>
              <span className="font-medium">{result.startAge}岁</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">首运:</span>
              <span className="font-medium">{result.firstDaYun}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoPaipanForm;
```

---

## 五、UI 集成方案

### 5.1 修改 ImportDataMode.tsx

在现有的八字输入表单中添加"自动排盘"选项卡：

```
┌─────────────────────────────────────────────────────────────────┐
│   ┌──────────────────┐  ┌──────────────────┐                    │
│   │  🔮 自动排盘     │  │  ✏️ 手动输入     │   ← 切换选项卡    │
│   └──────────────────┘  └──────────────────┘                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [自动排盘表单]                                                 │
│   或                                                             │
│   [手动输入表单（现有）]                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 交互流程

```
用户选择"自动排盘"
       ↓
输入出生年月日时
       ↓
点击"自动排盘"按钮
       ↓
显示排盘结果预览
       ↓
自动填充到八字表单
       ↓
继续后续流程（生成提示词 → 复制到 AI → 导入结果）
```

---

## 六、实现步骤

### Step 1: 安装依赖

```bash
npm install lunar-javascript
```

### Step 2: 创建排盘服务

创建 `services/paipanService.ts`，实现核心排盘逻辑。

### Step 3: 创建排盘组件

创建 `components/AutoPaipanForm.tsx`，实现 UI 表单。

### Step 4: 集成到 ImportDataMode

修改 `components/ImportDataMode.tsx`：
- 添加选项卡切换（自动/手动）
- 集成 AutoPaipanForm 组件
- 实现排盘结果自动填充

### Step 5: 测试验证

- 测试不同年份、时辰的排盘结果
- 验证大运方向计算
- 验证起运年龄计算

---

## 七、注意事项

### 7.1 时辰处理

- 子时需要特殊处理（跨日问题）
  - 早子时（00:00-01:00）：属于当日
  - 晚子时（23:00-24:00）：属于当日
- 提供"不知道时辰"选项，默认按午时（12:00）计算

### 7.2 节气边界

- 八字月柱以节气为界，不是农历初一
- lunar-javascript 已正确处理此逻辑

### 7.3 真太阳时（可选增强）

- 不同地区的真太阳时有差异
- 可添加出生地点输入，进行时间校正
- 简化版本可忽略此问题

### 7.4 闰月处理

- 农历闰月的排盘需要特殊处理
- lunar-javascript 已正确处理此逻辑

---

## 八、预计工作量

| 任务 | 预计时间 |
|------|----------|
| 安装配置 lunar-javascript | 10 分钟 |
| 创建 paipanService.ts | 30 分钟 |
| 创建 AutoPaipanForm.tsx | 1 小时 |
| 集成到 ImportDataMode.tsx | 30 分钟 |
| 测试与调试 | 30 分钟 |
| **总计** | **约 2.5-3 小时** |

---

## 九、扩展功能（可选）

### 9.1 农历输入支持

- 添加阳历/农历切换
- 支持用户直接输入农历日期

### 9.2 出生地点

- 添加省市选择
- 根据经度计算真太阳时校正

### 9.3 排盘结果增强

- 显示五行分布
- 显示十神关系
- 显示命中神煞

### 9.4 历史记录

- 保存最近排盘记录
- 方便快速重新分析

---

## 十、参考资料

### lunar-javascript 文档

- GitHub: https://github.com/6tail/lunar-javascript
- 示例: https://6tail.cn/calendar/api.html

### 核心 API

```javascript
import { Solar, Lunar } from 'lunar-javascript';

// 阳历转农历
const solar = Solar.fromYmdHms(1990, 5, 15, 10, 30, 0);
const lunar = solar.getLunar();

// 获取八字
const bazi = lunar.getEightChar();
bazi.getYear();   // 年柱
bazi.getMonth();  // 月柱
bazi.getDay();    // 日柱
bazi.getTime();   // 时柱

// 获取大运
const yun = bazi.getYun(1);  // 1=男, 0=女
yun.getStartYear();          // 起运年龄
yun.getDaYun();              // 大运数组
```

---

> 💡 **下一步**：如果确认此方案，可以开始实施。建议先安装 lunar-javascript 并测试基本功能，确保计算结果准确。

