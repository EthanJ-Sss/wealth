
import { UserInput, LifeDestinyResult, Gender, WealthAnalysis } from "../types";
import { BAZI_SYSTEM_INSTRUCTION } from "../constants";

// 生成默认的财富分析数据（当 API 未返回时使用）
const generateDefaultWealthAnalysis = (chartPoints: any[]): WealthAnalysis => {
  // 从流年数据中提取财运数据
  const wealthYearlyData = chartPoints?.map((point: any) => ({
    age: point.age,
    year: point.year,
    wealthScore: Math.max(20, Math.min(90, point.score + Math.floor(Math.random() * 20 - 10))),
    event: point.reason?.substring(0, 15) || "财运平稳"
  })) || [];

  return {
    wealthStar: "财星状态待分析，请使用 AI 模型生成完整分析。",
    wealthStarScore: 5,
    wealthMethod: "求财方式待分析，请使用 AI 模型生成完整分析。",
    wealthMethodScore: 5,
    wealthCycle: [
      { startAge: 1, endAge: 15, trend: 'stable', description: "童年期" },
      { startAge: 16, endAge: 30, trend: 'rise', description: "成长期" },
      { startAge: 31, endAge: 50, trend: 'peak', description: "发展期" },
      { startAge: 51, endAge: 70, trend: 'stable', description: "稳定期" },
      { startAge: 71, endAge: 100, trend: 'decline', description: "守成期" }
    ],
    wealthRisk: "破财风险待分析。",
    wealthRiskLevel: 'medium',
    wealthInvest: "投资建议待分析。",
    wealthInvestType: 'balanced',
    wealthNoble: "财运贵人待分析。",
    wealthNobleDirection: "待定",
    wealthCeiling: "财富上限待分析。",
    wealthCeilingLevel: 'medium',
    wealthAdvice: "开源节流建议待生成。",
    wealthYearlyData
  };
};

// Helper to determine stem polarity
const getStemPolarity = (pillar: string): 'YANG' | 'YIN' => {
  if (!pillar) return 'YANG'; // default
  const firstChar = pillar.trim().charAt(0);
  const yangStems = ['甲', '丙', '戊', '庚', '壬'];
  const yinStems = ['乙', '丁', '己', '辛', '癸'];

  if (yangStems.includes(firstChar)) return 'YANG';
  if (yinStems.includes(firstChar)) return 'YIN';
  return 'YANG'; // fallback
};

export const generateLifeAnalysis = async (input: UserInput): Promise<LifeDestinyResult> => {

  const { apiKey, apiBaseUrl, modelName } = input;

  // FIX: Trim whitespace which causes header errors if copied with newlines
  const cleanApiKey = apiKey ? apiKey.trim() : "";
  const cleanBaseUrl = apiBaseUrl ? apiBaseUrl.trim().replace(/\/+$/, "") : "";
  const targetModel = modelName && modelName.trim() ? modelName.trim() : "gemini-3-pro-preview";

  // 本地演示模式：当 API Key 为 'demo' 时，使用预生成的本地数据
  if (cleanApiKey.toLowerCase() === 'demo') {
    console.log('🎯 使用本地演示模式');
    const mockData = await fetch('/mock-data.json').then(r => r.json());
    return {
      chartData: mockData.chartPoints,
      analysis: {
        bazi: mockData.bazi || [],
        summary: mockData.summary || "无摘要",
        summaryScore: mockData.summaryScore || 5,
        personality: mockData.personality || "无性格分析",
        personalityScore: mockData.personalityScore || 5,
        industry: mockData.industry || "无",
        industryScore: mockData.industryScore || 5,
        fengShui: mockData.fengShui || "建议多亲近自然，保持心境平和。",
        fengShuiScore: mockData.fengShuiScore || 5,
        wealth: mockData.wealth || "无",
        wealthScore: mockData.wealthScore || 5,
        marriage: mockData.marriage || "无",
        marriageScore: mockData.marriageScore || 5,
        health: mockData.health || "无",
        healthScore: mockData.healthScore || 5,
        family: mockData.family || "无",
        familyScore: mockData.familyScore || 5,
        // 专业命理分析字段
        geJu: mockData.geJu || "格局待分析",
        geJuScore: mockData.geJuScore || 5,
        yongShen: mockData.yongShen || "用神待分析",
        yongShenScore: mockData.yongShenScore || 5,
        shenSha: mockData.shenSha || "神煞待分析",
        shenShaScore: mockData.shenShaScore || 5,
        liuNian: mockData.liuNian || "流年运势待分析",
        liuNianScore: mockData.liuNianScore || 5,
        kaiYun: mockData.kaiYun || "开运建议待生成",
        kaiYunScore: mockData.kaiYunScore || 5,
        // 财富深度分析
        wealthAnalysis: mockData.wealthAnalysis || generateDefaultWealthAnalysis(mockData.chartPoints),
      },
    };
  }

  if (!cleanApiKey) {
    throw new Error("请在表单中填写有效的 API Key（输入 'demo' 可使用本地演示模式）");
  }

  // Check for non-ASCII characters to prevent obscure 'Failed to construct Request' errors
  // If user accidentally pastes Chinese characters or emojis in the API key field
  if (/[^\x00-\x7F]/.test(cleanApiKey)) {
    throw new Error("API Key 包含非法字符（如中文或全角符号），请检查输入是否正确。");
  }

  if (!cleanBaseUrl) {
    throw new Error("请在表单中填写有效的 API Base URL");
  }

  const genderStr = input.gender === Gender.MALE ? '男 (乾造)' : '女 (坤造)';
  const startAgeInt = parseInt(input.startAge) || 1;

  // Calculate Da Yun Direction accurately
  const yearStemPolarity = getStemPolarity(input.yearPillar);
  let isForward = false;

  if (input.gender === Gender.MALE) {
    isForward = yearStemPolarity === 'YANG';
  } else {
    isForward = yearStemPolarity === 'YIN';
  }

  const daYunDirectionStr = isForward ? '顺行 (Forward)' : '逆行 (Backward)';

  const directionExample = isForward
    ? "例如：第一步是【戊申】，第二步则是【己酉】（顺排）"
    : "例如：第一步是【戊申】，第二步则是【丁未】（逆排）";

  const userPrompt = `
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
       - Age ${startAgeInt + 20} 到 ${startAgeInt + 29}: daYun = [第3步大运]
       - ...以此类推直到 100 岁。
    
    【特别警告】
    - **daYun 字段**：必须填大运干支（10年一变），**绝对不要**填流年干支。
    - **ganZhi 字段**：填入该年份的**流年干支**（每年一变，例如 2024=甲辰，2025=乙巳）。
    
    任务：
    1. 确认格局与喜忌，判断日主强弱。
    2. 生成 **1-100 岁 (虚岁)** 的人生流年K线数据。
    3. 在 \`reason\` 字段中提供流年详批。
    4. 生成带评分的命理分析报告（包含格局分析、用神忌神、神煞解读、开运建议等）。
    
    请严格按照系统指令生成 JSON 数据。
  `;

  try {
    const response = await fetch(`${cleanBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanApiKey}`
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          { role: "system", content: BAZI_SYSTEM_INSTRUCTION + "\n\n请务必只返回纯JSON格式数据，不要包含任何markdown代码块标记。" },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 30000
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API 请求失败: ${response.status} - ${errText}`);
    }

    const jsonResult = await response.json();
    const content = jsonResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("模型未返回任何内容。");
    }

    // 从可能包含 markdown 代码块的内容中提取 JSON
    let jsonContent = content;

    // 尝试提取 ```json ... ``` 中的内容
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    } else {
      // 如果没有代码块，尝试找到 JSON 对象
      const jsonStartIndex = content.indexOf('{');
      const jsonEndIndex = content.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        jsonContent = content.substring(jsonStartIndex, jsonEndIndex + 1);
      }
    }

    // 解析 JSON
    const data = JSON.parse(jsonContent);

    // 简单校验数据完整性
    if (!data.chartPoints || !Array.isArray(data.chartPoints)) {
      throw new Error("模型返回的数据格式不正确（缺失 chartPoints）。");
    }

    return {
      chartData: data.chartPoints,
      analysis: {
        bazi: data.bazi || [],
        summary: data.summary || "无摘要",
        summaryScore: data.summaryScore || 5,
        personality: data.personality || "无性格分析",
        personalityScore: data.personalityScore || 5,
        industry: data.industry || "无",
        industryScore: data.industryScore || 5,
        fengShui: data.fengShui || "建议多亲近自然，保持心境平和。",
        fengShuiScore: data.fengShuiScore || 5,
        wealth: data.wealth || "无",
        wealthScore: data.wealthScore || 5,
        marriage: data.marriage || "无",
        marriageScore: data.marriageScore || 5,
        health: data.health || "无",
        healthScore: data.healthScore || 5,
        family: data.family || "无",
        familyScore: data.familyScore || 5,
        // 专业命理分析字段
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
        // 财富深度分析
        wealthAnalysis: data.wealthAnalysis || generateDefaultWealthAnalysis(data.chartPoints),
      },
    };
  } catch (error) {
    console.error("Gemini/OpenAI API Error:", error);
    throw error;
  }
};
