/**
 * 通义千问 AI 服务
 * 使用 OpenAI 兼容的 API 格式
 */

import { BAZI_SYSTEM_INSTRUCTION } from './constants.js';

// 通义千问 API 配置
const QWEN_API_KEY = process.env.QWEN_API_KEY || '';
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen-plus';
const QWEN_BASE_URL = process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

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

/**
 * 获取天干阴阳属性
 */
function getStemPolarity(pillar: string): 'YANG' | 'YIN' {
  if (!pillar) return 'YANG';
  const firstChar = pillar.trim().charAt(0);
  const yangStems = ['甲', '丙', '戊', '庚', '壬'];
  return yangStems.includes(firstChar) ? 'YANG' : 'YIN';
}

/**
 * 生成用户提示词
 */
function generateUserPrompt(input: BaziInfo): string {
  const genderStr = input.gender === 'Male' ? '男 (乾造)' : '女 (坤造)';
  const startAgeInt = parseInt(input.startAge) || 1;
  const yearStemPolarity = getStemPolarity(input.yearPillar);
  
  const isForward = input.gender === 'Male' 
    ? yearStemPolarity === 'YANG' 
    : yearStemPolarity === 'YIN';
  
  const daYunDirectionStr = isForward ? '顺行 (Forward)' : '逆行 (Backward)';
  const directionExample = isForward
    ? "例如：第一步是【戊申】，第二步则是【己酉】（顺排）"
    : "例如：第一步是【戊申】，第二步则是【丁未】（逆排）";

  return `
请根据以下**已经排好的**八字四柱和**指定的大运信息**进行分析。

【基本信息】
性别：${genderStr}
姓名：${input.name || "未提供"}
出生年份：${input.birthYear}年 (阳历)

【八字四柱】
年柱：${input.yearPillar} (天干属性：${yearStemPolarity === 'YANG' ? '阳' : '阴'})
月柱：${input.monthPillar}
日柱：${input.dayPillar}
时柱：${input.hourPillar}

【大运核心参数】
1. 起运年龄：${input.startAge} 岁 (虚岁)。
2. 第一步大运：${input.firstDaYun}。
3. **排序方向**：${daYunDirectionStr}。

【必须执行的算法 - 大运序列生成】
请严格按照以下步骤生成数据：

1. **锁定第一步**：确认【${input.firstDaYun}】为第一步大运。
2. **计算序列**：根据六十甲子顺序和方向（${daYunDirectionStr}），推算出接下来的 9 步大运。
   ${directionExample}
3. **填充 JSON**：
   - Age 1 到 ${startAgeInt - 1}: daYun = "童限"
   - Age ${startAgeInt} 到 ${startAgeInt + 9}: daYun = [第1步大运: ${input.firstDaYun}]
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

请严格按照系统指令生成 JSON 数据。务必只返回纯JSON格式数据，不要包含任何markdown代码块标记。
  `.trim();
}

/**
 * 调用通义千问 API 生成命理分析
 */
export async function generateBaziAnalysis(baziInfo: BaziInfo): Promise<any> {
  if (!QWEN_API_KEY) {
    throw new Error('QWEN_API_KEY 未配置');
  }

  const userPrompt = generateUserPrompt(baziInfo);
  
  console.log('[通义千问] 调用 AI 生成分析...');
  console.log('[通义千问] 模型:', QWEN_MODEL);
  
  try {
    const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [
          {
            role: 'system',
            content: BAZI_SYSTEM_INSTRUCTION + '\n\n请务必只返回纯JSON格式数据，不要包含任何markdown代码块标记。'
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 30000,
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[通义千问] API 错误:', errText);
      throw new Error(`通义千问 API 错误: ${response.status} - ${errText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('通义千问未返回内容');
    }

    console.log('[通义千问] 收到响应，正在解析...');

    // 从可能包含 markdown 的内容中提取 JSON
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    } else {
      const jsonStartIndex = content.indexOf('{');
      const jsonEndIndex = content.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        jsonContent = content.substring(jsonStartIndex, jsonEndIndex + 1);
      }
    }

    const data = JSON.parse(jsonContent);

    if (!data.chartPoints || !Array.isArray(data.chartPoints)) {
      throw new Error('返回数据格式不正确（缺失 chartPoints）');
    }

    console.log('[通义千问] 生成成功，共', data.chartPoints.length, '条数据');
    return data;
  } catch (error: any) {
    console.error('[通义千问] 生成失败:', error);
    throw error;
  }
}

/**
 * 检查通义千问 API 是否可用
 */
export function isQwenAvailable(): boolean {
  return !!QWEN_API_KEY;
}
