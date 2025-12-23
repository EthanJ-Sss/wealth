import React, { useState, useMemo } from 'react';
import { WealthAnalysis } from '../types';
import {
  Coins,
  TrendingUp,
  Shield,
  Target,
  Users,
  Crown,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Gem,
  Wallet,
  PiggyBank,
  LineChart,
  Zap,
  MapPin,
  Calendar,
  Award,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  DollarSign,
  BarChart3,
  TrendingDown,
  CircleDollarSign,
  Sparkles,
  HandCoins
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Line,
  Legend
} from 'recharts';

interface WealthAnalysisPanelProps {
  wealthAnalysis: WealthAnalysis;
}

// ========== 财富等级徽章 ==========
const WealthLevelBadge = ({ level, size = 'normal' }: { level: string; size?: 'small' | 'normal' | 'large' }) => {
  const config: Record<string, { label: string; color: string; bgGradient: string; icon: string; description: string }> = {
    small: { 
      label: '小康级', 
      color: 'text-slate-700', 
      bgGradient: 'bg-gradient-to-r from-slate-100 to-slate-200 border-slate-300',
      icon: '🏠',
      description: '温饱有余'
    },
    medium: { 
      label: '中产级', 
      color: 'text-blue-700', 
      bgGradient: 'bg-gradient-to-r from-blue-100 to-sky-200 border-blue-300',
      icon: '🚗',
      description: '生活富足'
    },
    large: { 
      label: '富裕级', 
      color: 'text-amber-700', 
      bgGradient: 'bg-gradient-to-r from-amber-100 to-yellow-200 border-amber-300',
      icon: '💎',
      description: '财务自由'
    },
    super: { 
      label: '巨富级', 
      color: 'text-white', 
      bgGradient: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-400 border-amber-500',
      icon: '👑',
      description: '富甲一方'
    },
  };

  const cfg = config[level] || { label: '未知', color: 'text-gray-500', bgGradient: 'bg-gray-100', icon: '?', description: '' };
  
  const sizeClasses = {
    small: 'px-3 py-1 text-xs',
    normal: 'px-4 py-1.5 text-sm',
    large: 'px-6 py-2 text-base'
  };

  return (
    <div className="flex flex-col items-center">
      <span className={`inline-flex items-center gap-1.5 rounded-full font-bold border-2 shadow-lg ${cfg.bgGradient} ${cfg.color} ${sizeClasses[size]}`}>
        <span className={size === 'large' ? 'text-xl' : 'text-base'}>{cfg.icon}</span>
        {cfg.label}
      </span>
      {size === 'large' && (
        <span className="text-xs text-gray-500 mt-1">{cfg.description}</span>
      )}
    </div>
  );
};

// ========== 风险等级指示器（增强版） ==========
const RiskIndicator = ({ level }: { level: 'low' | 'medium' | 'high' }) => {
  const config = {
    low: { 
      label: '低风险', 
      color: 'text-emerald-600', 
      bgColor: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      icon: <Shield className="w-5 h-5" />,
      percentage: 33
    },
    medium: { 
      label: '中等风险', 
      color: 'text-amber-600', 
      bgColor: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: <AlertTriangle className="w-5 h-5" />,
      percentage: 66
    },
    high: { 
      label: '高风险', 
      color: 'text-red-600', 
      bgColor: 'bg-red-500',
      lightBg: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: <Zap className="w-5 h-5" />,
      percentage: 100
    },
  };

  const cfg = config[level];

  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl ${cfg.lightBg} border ${cfg.borderColor}`}>
      <div className={`p-2 rounded-lg ${cfg.bgColor} text-white`}>
        {cfg.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className={`font-bold ${cfg.color}`}>{cfg.label}</span>
          <span className={`text-sm ${cfg.color}`}>{cfg.percentage}%</span>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden">
          <div 
            className={`h-full ${cfg.bgColor} transition-all duration-1000`}
            style={{ width: `${cfg.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// ========== 投资类型徽章（增强版） ==========
const InvestTypeBadge = ({ type, showDetails = false }: { type: 'conservative' | 'balanced' | 'aggressive'; showDetails?: boolean }) => {
  const config: Record<string, { 
    label: string; 
    color: string; 
    bgColor: string;
    icon: React.ReactNode;
    description: string;
    allocation: { name: string; value: number; color: string }[];
  }> = {
    conservative: { 
      label: '保守型', 
      color: 'text-emerald-700',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-100',
      icon: <PiggyBank className="w-6 h-6" />,
      description: '稳健为主，风险厌恶',
      allocation: [
        { name: '固收类', value: 70, color: '#10b981' },
        { name: '权益类', value: 20, color: '#6ee7b7' },
        { name: '现金', value: 10, color: '#d1fae5' },
      ]
    },
    balanced: { 
      label: '稳健型', 
      color: 'text-blue-700',
      bgColor: 'bg-gradient-to-br from-blue-50 to-sky-100',
      icon: <Wallet className="w-6 h-6" />,
      description: '攻守兼备，均衡配置',
      allocation: [
        { name: '固收类', value: 50, color: '#3b82f6' },
        { name: '权益类', value: 40, color: '#93c5fd' },
        { name: '现金', value: 10, color: '#dbeafe' },
      ]
    },
    aggressive: { 
      label: '激进型', 
      color: 'text-red-700',
      bgColor: 'bg-gradient-to-br from-red-50 to-orange-100',
      icon: <LineChart className="w-6 h-6" />,
      description: '进取为主，追求高收益',
      allocation: [
        { name: '权益类', value: 60, color: '#ef4444' },
        { name: '固收类', value: 30, color: '#fca5a5' },
        { name: '现金', value: 10, color: '#fee2e2' },
      ]
    },
  };

  const cfg = config[type] || config.balanced;

  if (!showDetails) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold ${cfg.bgColor} ${cfg.color} shadow-sm`}>
        {cfg.icon}
        {cfg.label}
      </span>
    );
  }

  return (
    <div className={`p-5 rounded-xl ${cfg.bgColor} border border-opacity-50`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-xl bg-white/60 ${cfg.color}`}>
          {cfg.icon}
        </div>
        <div>
          <h4 className={`font-bold text-lg ${cfg.color}`}>{cfg.label}投资者</h4>
          <p className="text-sm text-gray-600">{cfg.description}</p>
        </div>
      </div>
      
      {/* 资产配置建议 */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 font-medium">建议资产配置</p>
        <div className="flex h-4 rounded-full overflow-hidden">
          {cfg.allocation.map((item, idx) => (
            <div
              key={idx}
              className="transition-all duration-500"
              style={{ width: `${item.value}%`, backgroundColor: item.color }}
              title={`${item.name}: ${item.value}%`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          {cfg.allocation.map((item, idx) => (
            <span key={idx} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name} {item.value}%
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ========== 核心指标卡片 ==========
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ElementType; 
  color: string;
  trend?: 'up' | 'down' | 'stable';
}) => {
  const trendIcons = {
    up: <ArrowUp className="w-4 h-4 text-emerald-500" />,
    down: <ArrowDown className="w-4 h-4 text-red-500" />,
    stable: <Minus className="w-4 h-4 text-gray-400" />
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {trend && trendIcons[trend]}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
};

// ========== 分析卡片组件（增强版） ==========
const AnalysisCard = ({
  title,
  icon: Icon,
  iconColor,
  bgColor = 'bg-white',
  children,
  score,
  badge
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor?: string;
  children: React.ReactNode;
  score?: number;
  badge?: React.ReactNode;
}) => {
  const getScoreColor = (s: number) => {
    if (s >= 8) return 'text-emerald-600 bg-emerald-50';
    if (s >= 6) return 'text-blue-600 bg-blue-50';
    if (s >= 4) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className={`${bgColor} p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-xl ${iconColor} bg-opacity-10`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-800">{title}</h4>
        </div>
        {typeof score === 'number' && (
          <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getScoreColor(score)}`}>
            {score}/10
          </span>
        )}
        {badge}
      </div>
      {children}
    </div>
  );
};

// ========== 自定义 Tooltip（财运曲线） ==========
const WealthChartTooltip = ({ active, payload }: any) => {
  if (active && payload?.[0]) {
    const data = payload[0].payload;
    const scoreColor = data.wealthScore >= 70 ? 'text-emerald-600' : 
                       data.wealthScore >= 50 ? 'text-amber-600' : 
                       data.wealthScore >= 30 ? 'text-orange-600' : 'text-red-600';
    
    const scoreBg = data.wealthScore >= 70 ? 'from-emerald-500 to-teal-500' : 
                    data.wealthScore >= 50 ? 'from-amber-500 to-yellow-500' : 
                    data.wealthScore >= 30 ? 'from-orange-500 to-red-400' : 'from-red-500 to-rose-500';
    
    return (
      <div className="bg-white/95 backdrop-blur-sm p-5 rounded-2xl shadow-2xl border border-amber-200 min-w-[200px]">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="font-bold text-gray-800">{data.age}岁</span>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{data.year}年</span>
        </div>
        <div className={`text-center py-3 rounded-xl bg-gradient-to-r ${scoreBg} mb-3`}>
          <p className="text-4xl font-bold text-white">{data.wealthScore}</p>
          <p className="text-xs text-white/80">财运指数</p>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed bg-amber-50 p-3 rounded-lg">
          💰 {data.event}
        </p>
      </div>
    );
  }
  return null;
};

// ========== 财运周期时间线节点 ==========
const CycleNode = ({ 
  period, 
  isFirst, 
  isLast 
}: { 
  period: { startAge: number; endAge: number; trend: string; description: string };
  isFirst: boolean;
  isLast: boolean;
}) => {
  const trendConfig: Record<string, { 
    color: string; 
    bgColor: string; 
    gradient: string;
    icon: string;
    label: string;
  }> = {
    peak: { 
      color: 'text-emerald-700', 
      bgColor: 'bg-emerald-500', 
      gradient: 'from-emerald-400 to-teal-500',
      icon: '🚀',
      label: '巅峰'
    },
    rise: { 
      color: 'text-teal-700', 
      bgColor: 'bg-teal-400', 
      gradient: 'from-teal-400 to-cyan-500',
      icon: '📈',
      label: '上升'
    },
    stable: { 
      color: 'text-blue-700', 
      bgColor: 'bg-blue-400', 
      gradient: 'from-blue-400 to-indigo-500',
      icon: '➡️',
      label: '平稳'
    },
    decline: { 
      color: 'text-orange-700', 
      bgColor: 'bg-orange-400', 
      gradient: 'from-orange-400 to-red-400',
      icon: '📉',
      label: '下降'
    },
    bottom: { 
      color: 'text-red-700', 
      bgColor: 'bg-red-400', 
      gradient: 'from-red-400 to-rose-500',
      icon: '⚠️',
      label: '低谷'
    },
  };

  const cfg = trendConfig[period.trend] || trendConfig.stable;

  return (
    <div className="flex flex-col items-center group cursor-pointer flex-1 min-w-0">
      {/* 节点 */}
      <div 
        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-white shadow-lg 
          transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:-translate-y-1`}
      >
        <span className="text-2xl">{cfg.icon}</span>
      </div>
      
      {/* 信息 */}
      <div className="mt-4 text-center max-w-full px-1">
        <p className="text-sm font-bold text-gray-800">{period.startAge}-{period.endAge}岁</p>
        <p className={`text-xs font-semibold ${cfg.color} mt-0.5`}>{cfg.label}期</p>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{period.description}</p>
      </div>
    </div>
  );
};

// ========== 主面板组件 ==========
const WealthAnalysisPanel: React.FC<WealthAnalysisPanelProps> = ({ wealthAnalysis }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'yearly' | 'advice'>('overview');

  // 计算统计数据
  const stats = useMemo(() => {
    const data = wealthAnalysis.wealthYearlyData || [];
    if (data.length === 0) return { peak: null, bottom: null, avg: 0, trend: 'stable' as const };
    
    const peak = data.reduce((max, item) => (item.wealthScore > max.wealthScore ? item : max), data[0]);
    const bottom = data.reduce((min, item) => (item.wealthScore < min.wealthScore ? item : min), data[0]);
    const avg = Math.round(data.reduce((sum, item) => sum + item.wealthScore, 0) / data.length);
    
    // 计算整体趋势
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    const firstAvg = firstHalf.reduce((s, i) => s + i.wealthScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, i) => s + i.wealthScore, 0) / secondHalf.length;
    const trend = secondAvg > firstAvg + 5 ? 'up' : secondAvg < firstAvg - 5 ? 'down' : 'stable';
    
    return { peak, bottom, avg, trend };
  }, [wealthAnalysis.wealthYearlyData]);

  // 雷达图数据
  const radarData = useMemo(() => [
    { subject: '财星', value: wealthAnalysis.wealthStarScore * 10, fullMark: 100 },
    { subject: '求财', value: wealthAnalysis.wealthMethodScore * 10, fullMark: 100 },
    { subject: '投资', value: wealthAnalysis.wealthInvestType === 'aggressive' ? 80 : wealthAnalysis.wealthInvestType === 'balanced' ? 60 : 40, fullMark: 100 },
    { subject: '贵人', value: 70, fullMark: 100 },
    { subject: '风控', value: wealthAnalysis.wealthRiskLevel === 'low' ? 90 : wealthAnalysis.wealthRiskLevel === 'medium' ? 60 : 30, fullMark: 100 },
    { subject: '潜力', value: wealthAnalysis.wealthCeilingLevel === 'super' ? 95 : wealthAnalysis.wealthCeilingLevel === 'large' ? 80 : wealthAnalysis.wealthCeilingLevel === 'medium' ? 60 : 40, fullMark: 100 },
  ], [wealthAnalysis]);

  // 十年周期对比数据
  const decadeData = useMemo(() => {
    const data = wealthAnalysis.wealthYearlyData || [];
    const decades: { decade: string; avg: number; max: number; min: number }[] = [];
    
    for (let i = 0; i < 10; i++) {
      const start = i * 10;
      const end = start + 10;
      const decadeItems = data.slice(start, end);
      
      if (decadeItems.length > 0) {
        const scores = decadeItems.map(d => d.wealthScore);
        decades.push({
          decade: `${start + 1}-${end}岁`,
          avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          max: Math.max(...scores),
          min: Math.min(...scores)
        });
      }
    }
    
    return decades;
  }, [wealthAnalysis.wealthYearlyData]);

  return (
    <div className="space-y-6 bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-6 md:p-8 rounded-3xl border-2 border-amber-200 shadow-xl">
      {/* ========== 标题栏 ========== */}
      <div
        className="flex items-center gap-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-4 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-400 rounded-2xl shadow-lg">
          <Coins className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl md:text-3xl font-bold font-serif-sc text-gray-900">财富运势深度分析</h2>
          <p className="text-sm text-amber-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Wealth Destiny Deep Analysis
          </p>
        </div>
        <div className="flex items-center gap-4">
          <WealthLevelBadge level={wealthAnalysis.wealthCeilingLevel} size="normal" />
          <button className="p-3 hover:bg-amber-100 rounded-xl transition-colors">
            {isExpanded ? <ChevronUp className="w-6 h-6 text-gray-500" /> : <ChevronDown className="w-6 h-6 text-gray-500" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* ========== 核心指标概览 ========== */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="财富等级"
              value={wealthAnalysis.wealthCeilingLevel === 'super' ? '巨富' : 
                     wealthAnalysis.wealthCeilingLevel === 'large' ? '富裕' : 
                     wealthAnalysis.wealthCeilingLevel === 'medium' ? '中产' : '小康'}
              subtitle={wealthAnalysis.wealthCeilingLevel === 'super' ? '富甲一方' : 
                       wealthAnalysis.wealthCeilingLevel === 'large' ? '财务自由' : 
                       wealthAnalysis.wealthCeilingLevel === 'medium' ? '生活富足' : '温饱有余'}
              icon={Crown}
              color="text-amber-500"
            />
            <MetricCard
              title="平均财运"
              value={`${stats.avg}分`}
              subtitle="一生财运均值"
              icon={BarChart3}
              color="text-blue-500"
              trend={stats.trend}
            />
            <MetricCard
              title="巅峰年份"
              value={`${stats.peak?.year || '--'}年`}
              subtitle={`${stats.peak?.age || '--'}岁 · ${stats.peak?.wealthScore || 0}分`}
              icon={TrendingUp}
              color="text-emerald-500"
              trend="up"
            />
            <MetricCard
              title="低谷年份"
              value={`${stats.bottom?.year || '--'}年`}
              subtitle={`${stats.bottom?.age || '--'}岁 · ${stats.bottom?.wealthScore || 0}分`}
              icon={TrendingDown}
              color="text-red-500"
              trend="down"
            />
          </div>

          {/* ========== 选项卡导航 ========== */}
          <div className="flex gap-2 bg-white/60 p-2 rounded-xl border border-amber-100">
            {[
              { key: 'overview', label: '总览分析', icon: Gem },
              { key: 'yearly', label: '流年财运', icon: Calendar },
              { key: 'advice', label: '开运建议', icon: Lightbulb },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-amber-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ========== 总览分析 Tab ========== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 双图表布局 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 财运雷达图 */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-500" />
                    财运综合评估
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                      />
                      <Radar
                        name="财运指数"
                        dataKey="value"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* 十年周期对比 */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    十年周期财运对比
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={decadeData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="decade" tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid #fcd34d',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value: number, name: string) => [
                          `${value}分`,
                          name === 'avg' ? '平均' : name === 'max' ? '最高' : '最低'
                        ]}
                      />
                      <Bar dataKey="avg" fill="#fbbf24" radius={[4, 4, 0, 0]} name="avg">
                        {decadeData.map((entry, index) => (
                          <Cell key={index} fill={entry.avg >= 60 ? '#10b981' : entry.avg >= 40 ? '#f59e0b' : '#ef4444'} />
                        ))}
                      </Bar>
                      <Line type="monotone" dataKey="max" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name="max" />
                      <Line type="monotone" dataKey="min" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} name="min" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 核心分析卡片 - 第一行 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 财富天花板 */}
                <AnalysisCard 
                  title="财富天花板" 
                  icon={Crown} 
                  iconColor="text-amber-600"
                  bgColor="bg-gradient-to-br from-amber-50 to-yellow-50"
                >
                  <div className="mb-4">
                    <WealthLevelBadge level={wealthAnalysis.wealthCeilingLevel} size="large" />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {wealthAnalysis.wealthCeiling}
                  </p>
                </AnalysisCard>

                {/* 财星状态 */}
                <AnalysisCard 
                  title="财星状态" 
                  icon={Gem} 
                  iconColor="text-purple-600" 
                  score={wealthAnalysis.wealthStarScore}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {[1,2,3,4,5].map(i => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i <= Math.round(wealthAnalysis.wealthStarScore / 2) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {wealthAnalysis.wealthStar}
                  </p>
                </AnalysisCard>

                {/* 求财方式 */}
                <AnalysisCard 
                  title="求财方式" 
                  icon={HandCoins} 
                  iconColor="text-blue-600" 
                  score={wealthAnalysis.wealthMethodScore}
                >
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {wealthAnalysis.wealthMethod}
                  </p>
                </AnalysisCard>
              </div>

              {/* 核心分析卡片 - 第二行 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 破财风险 */}
                <AnalysisCard 
                  title="破财风险" 
                  icon={Shield} 
                  iconColor="text-orange-600"
                >
                  <RiskIndicator level={wealthAnalysis.wealthRiskLevel} />
                  <p className="text-sm text-gray-600 leading-relaxed mt-4">
                    {wealthAnalysis.wealthRisk}
                  </p>
                </AnalysisCard>

                {/* 投资倾向 */}
                <AnalysisCard 
                  title="投资倾向" 
                  icon={TrendingUp} 
                  iconColor="text-emerald-600"
                >
                  <InvestTypeBadge type={wealthAnalysis.wealthInvestType} showDetails />
                </AnalysisCard>

                {/* 财运贵人 */}
                <AnalysisCard 
                  title="财运贵人" 
                  icon={Users} 
                  iconColor="text-pink-600"
                >
                  <div className="flex items-center gap-3 mb-3 p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <MapPin className="w-5 h-5 text-pink-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">贵人方位</p>
                      <p className="text-lg font-bold text-pink-600">{wealthAnalysis.wealthNobleDirection}方</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {wealthAnalysis.wealthNoble}
                  </p>
                </AnalysisCard>
              </div>

              {/* 财运周期时间线 */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-8 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  人生财运周期
                  <span className="text-xs text-gray-400 font-normal ml-2">（点击查看详情）</span>
                </h3>
                
                <div className="relative">
                  {/* 时间线背景 */}
                  <div className="absolute top-7 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 rounded-full" />
                  
                  {/* 时间节点 */}
                  <div className="flex justify-between gap-2 relative">
                    {wealthAnalysis.wealthCycle?.map((period, idx) => (
                      <CycleNode 
                        key={idx} 
                        period={period} 
                        isFirst={idx === 0}
                        isLast={idx === (wealthAnalysis.wealthCycle?.length || 0) - 1}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== 流年财运 Tab ========== */}
          {activeTab === 'yearly' && (
            <div className="space-y-6">
              {/* 财运走势曲线 */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  一生财运走势曲线
                  <span className="text-xs text-gray-400 font-normal ml-2">（悬停查看每年详情）</span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={wealthAnalysis.wealthYearlyData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="wealthGradientNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                        <stop offset="50%" stopColor="#fbbf24" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#fef3c7" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="age"
                      tickFormatter={(v) => `${v}岁`}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      interval={9}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickCount={6}
                    />
                    <Tooltip content={<WealthChartTooltip />} />
                    <ReferenceLine 
                      y={70} 
                      stroke="#10b981" 
                      strokeDasharray="4 4" 
                      label={{ value: '优秀线', fill: '#10b981', fontSize: 10, position: 'right' }} 
                    />
                    <ReferenceLine 
                      y={50} 
                      stroke="#f59e0b" 
                      strokeDasharray="4 4" 
                      label={{ value: '及格线', fill: '#f59e0b', fontSize: 10, position: 'right' }} 
                    />
                    <ReferenceLine 
                      y={30} 
                      stroke="#ef4444" 
                      strokeDasharray="4 4" 
                      label={{ value: '警戒线', fill: '#ef4444', fontSize: 10, position: 'right' }} 
                    />
                    <Area
                      type="monotone"
                      dataKey="wealthScore"
                      stroke="#f59e0b"
                      fill="url(#wealthGradientNew)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 8, fill: '#f59e0b', stroke: '#fff', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 关键年份标记 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 财运高峰期 */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-200">
                  <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    财运高峰期 TOP 5
                  </h4>
                  <div className="space-y-2">
                    {wealthAnalysis.wealthYearlyData
                      ?.slice()
                      .sort((a, b) => b.wealthScore - a.wealthScore)
                      .slice(0, 5)
                      .map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/60 p-3 rounded-xl">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-amber-400 text-white' : 
                            idx === 1 ? 'bg-gray-300 text-gray-700' : 
                            idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <span className="font-bold text-gray-800">{item.year}年</span>
                            <span className="text-gray-400 mx-2">·</span>
                            <span className="text-gray-600">{item.age}岁</span>
                          </div>
                          <span className="text-lg font-bold text-emerald-600">{item.wealthScore}分</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 财运低谷期 */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl border border-red-200">
                  <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    财运低谷期 警示
                  </h4>
                  <div className="space-y-2">
                    {wealthAnalysis.wealthYearlyData
                      ?.slice()
                      .sort((a, b) => a.wealthScore - b.wealthScore)
                      .slice(0, 5)
                      .map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/60 p-3 rounded-xl">
                          <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                            ⚠
                          </span>
                          <div className="flex-1">
                            <span className="font-bold text-gray-800">{item.year}年</span>
                            <span className="text-gray-400 mx-2">·</span>
                            <span className="text-gray-600">{item.age}岁</span>
                          </div>
                          <span className="text-lg font-bold text-red-600">{item.wealthScore}分</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== 开运建议 Tab ========== */}
          {activeTab === 'advice' && (
            <div className="space-y-6">
              {/* 增财之道 */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 p-6 rounded-2xl border border-emerald-200">
                <h3 className="text-xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-xl text-white">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  增财之道
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* 喜用颜色 */}
                  <div className="bg-white/70 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400" />
                      喜用颜色
                    </p>
                    <p className="font-bold text-gray-800">金色、白色、黑色</p>
                  </div>
                  
                  {/* 有利方位 */}
                  <div className="bg-white/70 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-pink-500" />
                      有利方位
                    </p>
                    <p className="font-bold text-gray-800">{wealthAnalysis.wealthNobleDirection}方</p>
                  </div>
                  
                  {/* 投资风格 */}
                  <div className="bg-white/70 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-blue-500" />
                      投资风格
                    </p>
                    <p className="font-bold text-gray-800">
                      {wealthAnalysis.wealthInvestType === 'conservative' ? '保守稳健' :
                       wealthAnalysis.wealthInvestType === 'balanced' ? '攻守兼备' : '积极进取'}
                    </p>
                  </div>
                  
                  {/* 财富等级 */}
                  <div className="bg-white/70 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-500" />
                      财富潜力
                    </p>
                    <p className="font-bold text-gray-800">
                      {wealthAnalysis.wealthCeilingLevel === 'super' ? '巨富级' :
                       wealthAnalysis.wealthCeilingLevel === 'large' ? '富裕级' :
                       wealthAnalysis.wealthCeilingLevel === 'medium' ? '中产级' : '小康级'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/60 p-5 rounded-xl">
                  <p className="text-gray-700 leading-relaxed">
                    💡 {wealthAnalysis.wealthAdvice}
                  </p>
                </div>
              </div>

              {/* 守财要点 */}
              <div className="bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 p-6 rounded-2xl border border-red-200">
                <h3 className="text-xl font-bold text-red-800 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-red-500 rounded-xl text-white">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  守财要点
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/70 p-4 rounded-xl border-l-4 border-red-400">
                    <p className="text-xs text-gray-500 mb-1">风险等级</p>
                    <p className="font-bold text-red-700">
                      {wealthAnalysis.wealthRiskLevel === 'high' ? '高风险' :
                       wealthAnalysis.wealthRiskLevel === 'medium' ? '中等风险' : '低风险'}
                    </p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-xl border-l-4 border-orange-400">
                    <p className="text-xs text-gray-500 mb-1">重点防范期</p>
                    <p className="font-bold text-orange-700">
                      {wealthAnalysis.wealthYearlyData
                        ?.filter(d => d.wealthScore < 40)
                        .slice(0, 3)
                        .map(d => `${d.age}岁`)
                        .join('、') || '暂无'}
                    </p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-xl border-l-4 border-amber-400">
                    <p className="text-xs text-gray-500 mb-1">投资建议</p>
                    <p className="font-bold text-amber-700">
                      {wealthAnalysis.wealthInvestType === 'conservative' ? '以储蓄为主' :
                       wealthAnalysis.wealthInvestType === 'balanced' ? '均衡配置' : '适度冒险'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/60 p-5 rounded-xl">
                  <p className="text-gray-700 leading-relaxed">
                    ⚠️ {wealthAnalysis.wealthRisk}
                  </p>
                </div>
              </div>

              {/* 财运贵人详解 */}
              <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 p-6 rounded-2xl border border-pink-200">
                <h3 className="text-xl font-bold text-pink-800 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-pink-500 rounded-xl text-white">
                    <Users className="w-6 h-6" />
                  </div>
                  财运贵人
                </h3>
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <div className="text-center text-white">
                        <MapPin className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{wealthAnalysis.wealthNobleDirection}</p>
                        <p className="text-xs opacity-80">贵人方位</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 bg-white/60 p-5 rounded-xl">
                    <p className="text-gray-700 leading-relaxed">
                      🌟 {wealthAnalysis.wealthNoble}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WealthAnalysisPanel;
