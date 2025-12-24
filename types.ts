
export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

export interface UserInput {
  name?: string;
  gender: Gender;
  birthYear: string;   // 出生年份 (如 1990)
  yearPillar: string;  // 年柱
  monthPillar: string; // 月柱
  dayPillar: string;   // 日柱
  hourPillar: string;  // 时柱
  startAge: string;    // 起运年龄 (虚岁) - Changed to string to handle input field state easily, parse later
  firstDaYun: string;  // 第一步大运干支
  
  // New API Configuration Fields
  modelName: string;   // 使用的模型名称
  apiBaseUrl: string;
  apiKey: string;
}

export interface KLinePoint {
  age: number;
  year: number;
  ganZhi: string; // 当年的流年干支 (如：甲辰)
  daYun?: string; // 当前所在的大运（如：甲子大运），用于图表标记
  open: number;
  close: number;
  high: number;
  low: number;
  score: number;
  reason: string; // 这里现在需要存储详细的流年描述
}

export interface AnalysisData {
  bazi: string[]; // [Year, Month, Day, Hour] pillars
  summary: string;
  summaryScore: number; // 0-10
  
  personality: string;      // 性格分析
  personalityScore: number; // 0-10
  
  industry: string;
  industryScore: number; // 0-10

  fengShui: string;       // 发展风水 (New)
  fengShuiScore: number;  // 0-10 (New)
  
  wealth: string;
  wealthScore: number; // 0-10
  
  marriage: string;
  marriageScore: number; // 0-10
  
  health: string;
  healthScore: number; // 0-10
  
  family: string;
  familyScore: number; // 0-10

  // 专业命理分析字段
  geJu: string;           // 格局分析（正官格、七杀格、食神格等）
  geJuScore: number;      // 格局评分 0-10
  
  yongShen: string;       // 用神忌神分析（喜用五行、忌讳五行）
  yongShenScore: number;  // 用神评分 0-10
  
  shenSha: string;        // 神煞分析（天乙贵人、文昌、驿马、桃花等）
  shenShaScore: number;   // 神煞评分 0-10
  
  liuNian: string;        // 近十年流年运势概述
  liuNianScore: number;   // 流年评分 0-10
  
  kaiYun: string;         // 开运建议（颜色、方位、行业、佩戴等）
  kaiYunScore: number;    // 开运评分 0-10

  // 财富深度分析（可选，新增模块）
  wealthAnalysis?: WealthAnalysis;

  // 桃花运深度分析（可选，新增模块）
  loveAnalysis?: LoveAnalysis;
}

// 财运周期
export interface WealthCyclePeriod {
  startAge: number;
  endAge: number;
  trend: 'peak' | 'rise' | 'stable' | 'decline' | 'bottom';
  description: string;
}

// 财运流年数据点
export interface WealthYearlyPoint {
  age: number;
  year: number;
  wealthScore: number;  // 0-100 财运专属评分
  event: string;        // 该年财运事件/趋势
}

// 财富深度分析接口
export interface WealthAnalysis {
  // 财星状态
  wealthStar: string;           // 正财偏财分析
  wealthStarScore: number;      // 0-10
  
  // 求财方式
  wealthMethod: string;         // 适合的求财方式
  wealthMethodScore: number;    // 0-10
  
  // 财运周期
  wealthCycle: WealthCyclePeriod[];  // 财运高峰/低谷期
  
  // 破财风险
  wealthRisk: string;           // 破财风险分析
  wealthRiskLevel: 'low' | 'medium' | 'high';  // 风险等级
  
  // 投资倾向
  wealthInvest: string;         // 投资建议
  wealthInvestType: 'conservative' | 'balanced' | 'aggressive';
  
  // 财运贵人
  wealthNoble: string;          // 贵人分析
  wealthNobleDirection: string; // 贵人方位
  
  // 财富天花板
  wealthCeiling: string;        // 财富上限分析
  wealthCeilingLevel: 'small' | 'medium' | 'large' | 'super'; // 小康/中产/富裕/巨富
  
  // 开源节流建议
  wealthAdvice: string;         // 增财与避险建议
  
  // 财运流年数据
  wealthYearlyData: WealthYearlyPoint[];
}

export interface LifeDestinyResult {
  chartData: KLinePoint[];
  analysis: AnalysisData;
}

// ========== 桃花运深度分析相关类型 ==========

// 桃花运周期
export interface LoveCyclePeriod {
  startAge: number;
  endAge: number;
  trend: 'bloom' | 'rise' | 'stable' | 'decline' | 'dormant';  // 盛开/上升/平稳/下降/休眠
  description: string;
}

// 桃花运流年数据点
export interface LoveYearlyPoint {
  age: number;
  year: number;
  loveScore: number;      // 0-100 桃花运评分
  event: string;          // 该年感情事件/趋势
}

// 桃花运深度分析接口
export interface LoveAnalysis {
  // 桃花星状态
  loveStar: string;               // 桃花星（咸池、红鸾、天喜等）分析
  loveStarScore: number;          // 0-10
  
  // 正缘类型（配偶特征）
  spouseType: string;             // 配偶的性格、外貌、职业特征
  spouseTypeScore: number;        // 0-10
  
  // 婚恋模式
  lovePattern: string;            // 恋爱婚姻模式（早婚/晚婚/多婚等）
  lovePatternType: 'early' | 'normal' | 'late' | 'multiple';  // 早婚/正常/晚婚/多婚
  
  // 桃花运周期
  loveCycle: LoveCyclePeriod[];   // 桃花运高峰/低谷期
  
  // 感情风险
  loveRisk: string;               // 烂桃花、婚姻危机分析
  loveRiskLevel: 'low' | 'medium' | 'high';  // 风险等级
  
  // 感情贵人
  loveNoble: string;              // 感情贵人分析
  loveNobleDirection: string;     // 贵人方位
  
  // 最佳婚配
  bestMatch: string;              // 最佳婚配属相、五行
  avoidMatch: string;             // 需避开的属相、五行
  
  // 婚姻宫分析
  marriagePalace: string;         // 日支婚姻宫分析
  marriagePalaceScore: number;    // 0-10
  
  // 子女缘
  childrenFortune: string;        // 子女缘分析
  childrenFortuneScore: number;   // 0-10
  
  // 开桃花建议
  loveAdvice: string;             // 增桃花与避烂桃花建议
  
  // 桃花运流年数据
  loveYearlyData: LoveYearlyPoint[];
}
