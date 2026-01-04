import React, { useState } from 'react';
import { WealthAnalysis, LoveAnalysis, AnalysisData } from '../types';
import { WEALTH_ANALYSIS_SYSTEM_INSTRUCTION, LOVE_ANALYSIS_SYSTEM_INSTRUCTION } from '../constants';
import WealthAnalysisPanel from './WealthAnalysisPanel';
import LoveAnalysisPanel from './LoveAnalysisPanel';
import {
  Coins,
  Heart,
  Copy,
  CheckCircle,
  AlertCircle,
  Upload,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  MessageSquare,
  X
} from 'lucide-react';

interface DeepAnalysisPanelProps {
  analysis: AnalysisData;
  birthYear: number;
  onWealthAnalysisUpdate: (wealthAnalysis: WealthAnalysis) => void;
  onLoveAnalysisUpdate: (loveAnalysis: LoveAnalysis) => void;
}

type AnalysisType = 'wealth' | 'love';
type PanelStep = 'entry' | 'generate' | 'result';

const DeepAnalysisPanel: React.FC<DeepAnalysisPanelProps> = ({
  analysis,
  birthYear,
  onWealthAnalysisUpdate,
  onLoveAnalysisUpdate
}) => {
  // 财富分析状态
  const [wealthStep, setWealthStep] = useState<PanelStep>(
    analysis.wealthAnalysis ? 'result' : 'entry'
  );
  const [wealthCopied, setWealthCopied] = useState(false);
  const [wealthJsonInput, setWealthJsonInput] = useState('');
  const [wealthError, setWealthError] = useState<string | null>(null);

  // 姻缘分析状态
  const [loveStep, setLoveStep] = useState<PanelStep>(
    analysis.loveAnalysis ? 'result' : 'entry'
  );
  const [loveCopied, setLoveCopied] = useState(false);
  const [loveJsonInput, setLoveJsonInput] = useState('');
  const [loveError, setLoveError] = useState<string | null>(null);

  // 生成用户提示词
  const generateUserPrompt = (type: AnalysisType) => {
    const baziStr = analysis.bazi.join('、');
    const genderHint = '请根据八字推断性别特征';
    
    return `请根据以下八字信息生成${type === 'wealth' ? '财富' : '桃花运'}深度分析报告。

【八字四柱】
${baziStr}
年柱：${analysis.bazi[0]}
月柱：${analysis.bazi[1]}
日柱：${analysis.bazi[2]}
时柱：${analysis.bazi[3]}

【出生年份】
${birthYear}年 (阳历)

【性别】
${genderHint}

【已有分析摘要】
命理总评：${analysis.summary}
格局分析：${analysis.geJu}
用神忌神：${analysis.yongShen}

请严格按照系统指令生成 JSON 数据。务必只返回纯JSON格式数据，不要包含任何markdown代码块标记或其他文字说明。
${type === 'wealth' ? '必须生成 wealthYearlyData 数组，包含 100 条数据（1-100岁）。' : '必须生成 loveYearlyData 数组，包含 100 条数据（1-100岁）。'}`;
  };

  // 复制完整提示词（兼容 HTTP 环境）
  const copyFullPrompt = async (type: AnalysisType) => {
    const systemPrompt = type === 'wealth' 
      ? WEALTH_ANALYSIS_SYSTEM_INSTRUCTION 
      : LOVE_ANALYSIS_SYSTEM_INSTRUCTION;
    const userPrompt = generateUserPrompt(type);
    const fullPrompt = `=== 系统指令 (System Prompt) ===\n\n${systemPrompt}\n\n=== 用户提示词 (User Prompt) ===\n\n${userPrompt}`;

    try {
      // 优先使用现代 Clipboard API（需要 HTTPS）
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullPrompt);
      } else {
        // HTTP 环境下的回退方案：使用 execCommand
        const textArea = document.createElement('textarea');
        textArea.value = fullPrompt;
        // 设置样式使其不可见
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('execCommand 复制失败');
        }
      }
      if (type === 'wealth') {
        setWealthCopied(true);
        setTimeout(() => setWealthCopied(false), 2000);
      } else {
        setLoveCopied(true);
        setTimeout(() => setLoveCopied(false), 2000);
      }
    } catch (err) {
      console.error('复制失败', err);
      alert('复制失败，请手动选择文本复制');
    }
  };

  // 解析导入的 JSON
  const handleImport = (type: AnalysisType) => {
    const jsonInput = type === 'wealth' ? wealthJsonInput : loveJsonInput;
    const setError = type === 'wealth' ? setWealthError : setLoveError;

    setError(null);

    if (!jsonInput.trim()) {
      setError('请粘贴 AI 返回的 JSON 数据');
      return;
    }

    try {
      // 尝试从可能包含 markdown 的内容中提取 JSON
      let jsonContent = jsonInput.trim();

      // 提取 ```json ... ``` 中的内容
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      } else {
        // 尝试找到 JSON 对象
        const jsonStartIndex = jsonContent.indexOf('{');
        const jsonEndIndex = jsonContent.lastIndexOf('}');
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
          jsonContent = jsonContent.substring(jsonStartIndex, jsonEndIndex + 1);
        }
      }

      const data = JSON.parse(jsonContent);

      if (type === 'wealth') {
        // 验证财富分析数据
        const wealthData = data.wealthAnalysis || data;
        if (!wealthData.wealthYearlyData || !Array.isArray(wealthData.wealthYearlyData)) {
          throw new Error('数据格式不正确：缺少 wealthYearlyData 数组');
        }
        if (wealthData.wealthYearlyData.length < 50) {
          throw new Error('数据不完整：wealthYearlyData 数量太少（至少需要50条）');
        }
        
        const wealthAnalysis: WealthAnalysis = {
          wealthStar: wealthData.wealthStar || '待分析',
          wealthStarScore: wealthData.wealthStarScore || 5,
          wealthMethod: wealthData.wealthMethod || '待分析',
          wealthMethodScore: wealthData.wealthMethodScore || 5,
          wealthCycle: wealthData.wealthCycle || [],
          wealthRisk: wealthData.wealthRisk || '待分析',
          wealthRiskLevel: wealthData.wealthRiskLevel || 'medium',
          wealthInvest: wealthData.wealthInvest || '待分析',
          wealthInvestType: wealthData.wealthInvestType || 'balanced',
          wealthNoble: wealthData.wealthNoble || '待分析',
          wealthNobleDirection: wealthData.wealthNobleDirection || '东方',
          wealthCeiling: wealthData.wealthCeiling || '待分析',
          wealthCeilingLevel: wealthData.wealthCeilingLevel || 'medium',
          wealthAdvice: wealthData.wealthAdvice || '待分析',
          wealthYearlyData: wealthData.wealthYearlyData,
        };

        onWealthAnalysisUpdate(wealthAnalysis);
        setWealthStep('result');
        setWealthJsonInput('');
      } else {
        // 验证姻缘分析数据
        const loveData = data.loveAnalysis || data;
        if (!loveData.loveYearlyData || !Array.isArray(loveData.loveYearlyData)) {
          throw new Error('数据格式不正确：缺少 loveYearlyData 数组');
        }
        if (loveData.loveYearlyData.length < 50) {
          throw new Error('数据不完整：loveYearlyData 数量太少（至少需要50条）');
        }

        const loveAnalysis: LoveAnalysis = {
          loveStar: loveData.loveStar || '待分析',
          loveStarScore: loveData.loveStarScore || 5,
          spouseType: loveData.spouseType || '待分析',
          spouseTypeScore: loveData.spouseTypeScore || 5,
          lovePattern: loveData.lovePattern || '待分析',
          lovePatternType: loveData.lovePatternType || 'normal',
          loveCycle: loveData.loveCycle || [],
          loveRisk: loveData.loveRisk || '待分析',
          loveRiskLevel: loveData.loveRiskLevel || 'medium',
          loveNoble: loveData.loveNoble || '待分析',
          loveNobleDirection: loveData.loveNobleDirection || '东方',
          bestMatch: loveData.bestMatch || '待分析',
          avoidMatch: loveData.avoidMatch || '待分析',
          marriagePalace: loveData.marriagePalace || '待分析',
          marriagePalaceScore: loveData.marriagePalaceScore || 5,
          childrenFortune: loveData.childrenFortune || '待分析',
          childrenFortuneScore: loveData.childrenFortuneScore || 5,
          loveAdvice: loveData.loveAdvice || '待分析',
          loveYearlyData: loveData.loveYearlyData,
        };

        onLoveAnalysisUpdate(loveAnalysis);
        setLoveStep('result');
        setLoveJsonInput('');
      }
    } catch (err: any) {
      setError(`解析失败：${err.message}`);
    }
  };

  // 入口卡片组件
  const EntryCard = ({ 
    type, 
    title, 
    subtitle, 
    icon: Icon, 
    gradient, 
    onClick,
    isLocked 
  }: { 
    type: AnalysisType;
    title: string; 
    subtitle: string; 
    icon: React.ElementType; 
    gradient: string;
    onClick: () => void;
    isLocked: boolean;
  }) => (
    <div 
      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer group
        ${isLocked 
          ? 'border-gray-200 bg-gray-50 hover:border-gray-300' 
          : `border-transparent ${gradient} hover:scale-[1.02] hover:shadow-xl`
        }`}
      onClick={onClick}
    >
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl shadow-lg ${
            isLocked ? 'bg-gray-200' : 'bg-white/20 backdrop-blur-sm'
          }`}>
            <Icon className={`w-8 h-8 ${isLocked ? 'text-gray-400' : 'text-white'}`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-xl md:text-2xl font-bold font-serif-sc ${
              isLocked ? 'text-gray-500' : 'text-white'
            }`}>
              {title}
            </h3>
            <p className={`text-sm ${isLocked ? 'text-gray-400' : 'text-white/80'}`}>
              {subtitle}
            </p>
          </div>
          <div className={`p-3 rounded-full transition-transform group-hover:translate-x-1 ${
            isLocked ? 'bg-gray-100' : 'bg-white/20'
          }`}>
            {isLocked ? (
              <Lock className={`w-5 h-5 ${isLocked ? 'text-gray-400' : 'text-white'}`} />
            ) : (
              <ArrowRight className="w-5 h-5 text-white" />
            )}
          </div>
        </div>
        
        {!isLocked && (
          <div className="mt-4 flex items-center gap-2 text-white/70 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>点击开始生成深度分析</span>
          </div>
        )}
      </div>
    </div>
  );

  // 生成面板组件
  const GeneratePanel = ({ 
    type, 
    title,
    gradient,
    copied, 
    jsonInput, 
    setJsonInput, 
    error,
    onCopy,
    onImport,
    onBack 
  }: { 
    type: AnalysisType;
    title: string;
    gradient: string;
    copied: boolean;
    jsonInput: string;
    setJsonInput: (val: string) => void;
    error: string | null;
    onCopy: () => void;
    onImport: () => void;
    onBack: () => void;
  }) => (
    <div className={`rounded-2xl border-2 border-transparent ${gradient} overflow-hidden`}>
      {/* 标题栏 */}
      <div className="p-4 md:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {type === 'wealth' ? (
            <Coins className="w-6 h-6 text-white" />
          ) : (
            <Heart className="w-6 h-6 text-white" />
          )}
          <h3 className="text-xl font-bold text-white font-serif-sc">{title}</h3>
        </div>
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* 内容区 */}
      <div className="bg-white p-6 space-y-6">
        {/* 步骤1: 复制提示词 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">1</div>
            <h4 className="font-bold text-gray-800">复制提示词到 AI</h4>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">支持：ChatGPT、Claude、Gemini、通义千问 等</span>
          </div>

          <button
            onClick={onCopy}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {copied ? (
              <>
                <CheckCircle className="w-5 h-5" />
                已复制到剪贴板！
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                复制{type === 'wealth' ? '财富分析' : '姻缘分析'}提示词
              </>
            )}
          </button>
        </div>

        {/* 步骤2: 导入JSON */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">2</div>
            <h4 className="font-bold text-gray-800">粘贴 AI 返回的 JSON</h4>
          </div>

          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={`将 AI 返回的 ${type === 'wealth' ? '财富分析' : '姻缘分析'} JSON 数据粘贴到这里...`}
            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs resize-none"
          />

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200 mt-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={onImport}
            className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            导入并生成分析
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 mt-8">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-gradient-to-b from-amber-400 to-pink-500 rounded-full" />
        <h2 className="text-xl md:text-2xl font-bold font-serif-sc text-gray-800">
          深度分析模块
        </h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          可选生成
        </span>
      </div>

      {/* 财富深度分析 */}
      {wealthStep === 'entry' && (
        <EntryCard
          type="wealth"
          title="财富运势深度分析"
          subtitle="财星、求财方式、投资倾向、财运周期、财富天花板"
          icon={Coins}
          gradient="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500"
          onClick={() => setWealthStep('generate')}
          isLocked={false}
        />
      )}

      {wealthStep === 'generate' && (
        <GeneratePanel
          type="wealth"
          title="生成财富深度分析"
          gradient="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500"
          copied={wealthCopied}
          jsonInput={wealthJsonInput}
          setJsonInput={setWealthJsonInput}
          error={wealthError}
          onCopy={() => copyFullPrompt('wealth')}
          onImport={() => handleImport('wealth')}
          onBack={() => setWealthStep('entry')}
        />
      )}

      {wealthStep === 'result' && analysis.wealthAnalysis && (
        <WealthAnalysisPanel wealthAnalysis={analysis.wealthAnalysis} />
      )}

      {/* 姻缘深度分析 */}
      {loveStep === 'entry' && (
        <EntryCard
          type="love"
          title="桃花运势深度分析"
          subtitle="桃花星、正缘配偶、婚恋模式、桃花周期、婚配建议"
          icon={Heart}
          gradient="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500"
          onClick={() => setLoveStep('generate')}
          isLocked={false}
        />
      )}

      {loveStep === 'generate' && (
        <GeneratePanel
          type="love"
          title="生成桃花运深度分析"
          gradient="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500"
          copied={loveCopied}
          jsonInput={loveJsonInput}
          setJsonInput={setLoveJsonInput}
          error={loveError}
          onCopy={() => copyFullPrompt('love')}
          onImport={() => handleImport('love')}
          onBack={() => setLoveStep('entry')}
        />
      )}

      {loveStep === 'result' && analysis.loveAnalysis && (
        <LoveAnalysisPanel loveAnalysis={analysis.loveAnalysis} />
      )}
    </div>
  );
};

export default DeepAnalysisPanel;

