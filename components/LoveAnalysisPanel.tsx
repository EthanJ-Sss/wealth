import React, { useState, useMemo } from 'react';
import { LoveAnalysis } from '../types';
import {
  Heart,
  HeartHandshake,
  Users,
  Crown,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calendar,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  MapPin,
  Baby,
  ShieldCheck,
  ShieldAlert,
  Zap,
  CircleUser,
  Gem,
  Church,
  Clock,
  HeartCrack,
  Flower2
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
  Line
} from 'recharts';

interface LoveAnalysisPanelProps {
  loveAnalysis: LoveAnalysis;
}

// ========== 婚恋类型徽章 ==========
const LovePatternBadge = ({ type, size = 'normal' }: { type: string; size?: 'small' | 'normal' | 'large' }) => {
  const config: Record<string, { label: string; color: string; bgGradient: string; icon: string; description: string }> = {
    early: { 
      label: '早婚型', 
      color: 'text-pink-700', 
      bgGradient: 'bg-gradient-to-r from-pink-100 to-rose-200 border-pink-300',
      icon: '💒',
      description: '25岁前成婚为佳'
    },
    normal: { 
      label: '正常型', 
      color: 'text-purple-700', 
      bgGradient: 'bg-gradient-to-r from-purple-100 to-violet-200 border-purple-300',
      icon: '💑',
      description: '25-30岁成婚为佳'
    },
    late: { 
      label: '晚婚型', 
      color: 'text-blue-700', 
      bgGradient: 'bg-gradient-to-r from-blue-100 to-sky-200 border-blue-300',
      icon: '⏰',
      description: '30岁后成婚更稳'
    },
    multiple: { 
      label: '多婚型', 
      color: 'text-orange-700', 
      bgGradient: 'bg-gradient-to-r from-orange-100 to-amber-200 border-orange-300',
      icon: '💔',
      description: '婚姻需多加经营'
    },
  };

  const cfg = config[type] || config.normal;
  
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

// ========== 风险等级指示器 ==========
const LoveRiskIndicator = ({ level }: { level: 'low' | 'medium' | 'high' }) => {
  const config = {
    low: { 
      label: '低风险', 
      color: 'text-emerald-600', 
      bgColor: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      icon: <ShieldCheck className="w-5 h-5" />,
      percentage: 33
    },
    medium: { 
      label: '中等风险', 
      color: 'text-amber-600', 
      bgColor: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: <ShieldAlert className="w-5 h-5" />,
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

// ========== 分析卡片组件 ==========
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

// ========== 自定义 Tooltip（桃花运曲线） ==========
const LoveChartTooltip = ({ active, payload }: any) => {
  if (active && payload?.[0]) {
    const data = payload[0].payload;
    const scoreColor = data.loveScore >= 70 ? 'text-pink-600' : 
                       data.loveScore >= 50 ? 'text-purple-600' : 
                       data.loveScore >= 30 ? 'text-orange-600' : 'text-gray-600';
    
    const scoreBg = data.loveScore >= 70 ? 'from-pink-500 to-rose-500' : 
                    data.loveScore >= 50 ? 'from-purple-500 to-violet-500' : 
                    data.loveScore >= 30 ? 'from-orange-500 to-amber-500' : 'from-gray-500 to-slate-500';
    
    return (
      <div className="bg-white/95 backdrop-blur-sm p-5 rounded-2xl shadow-2xl border border-pink-200 min-w-[200px]">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="font-bold text-gray-800">{data.age}岁</span>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{data.year}年</span>
        </div>
        <div className={`text-center py-3 rounded-xl bg-gradient-to-r ${scoreBg} mb-3`}>
          <p className="text-4xl font-bold text-white">{data.loveScore}</p>
          <p className="text-xs text-white/80">桃花指数</p>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed bg-pink-50 p-3 rounded-lg">
          💕 {data.event}
        </p>
      </div>
    );
  }
  return null;
};

// ========== 桃花周期时间线节点 ==========
const LoveCycleNode = ({ 
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
    bloom: { 
      color: 'text-pink-700', 
      bgColor: 'bg-pink-500', 
      gradient: 'from-pink-400 to-rose-500',
      icon: '🌸',
      label: '盛开'
    },
    rise: { 
      color: 'text-purple-700', 
      bgColor: 'bg-purple-400', 
      gradient: 'from-purple-400 to-violet-500',
      icon: '🌷',
      label: '上升'
    },
    stable: { 
      color: 'text-blue-700', 
      bgColor: 'bg-blue-400', 
      gradient: 'from-blue-400 to-indigo-500',
      icon: '💑',
      label: '平稳'
    },
    decline: { 
      color: 'text-orange-700', 
      bgColor: 'bg-orange-400', 
      gradient: 'from-orange-400 to-amber-500',
      icon: '🍂',
      label: '下降'
    },
    dormant: { 
      color: 'text-gray-700', 
      bgColor: 'bg-gray-400', 
      gradient: 'from-gray-400 to-slate-500',
      icon: '🌱',
      label: '休眠'
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

// ========== 婚配分析展示 ==========
const MatchDisplay = ({ bestMatch, avoidMatch }: { bestMatch: string; avoidMatch: string }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-green-500 rounded-lg text-white">
            <CheckCircle className="w-4 h-4" />
          </div>
          <span className="font-bold text-green-800">最佳婚配</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{bestMatch}</p>
      </div>
      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-xl border border-red-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-red-500 rounded-lg text-white">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span className="font-bold text-red-800">需避婚配</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{avoidMatch}</p>
      </div>
    </div>
  );
};

// ========== 主面板组件 ==========
const LoveAnalysisPanel: React.FC<LoveAnalysisPanelProps> = ({ loveAnalysis }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'yearly' | 'advice'>('overview');

  // 计算统计数据
  const stats = useMemo(() => {
    const data = loveAnalysis.loveYearlyData || [];
    if (data.length === 0) return { peak: null, bottom: null, avg: 0, trend: 'stable' as const };
    
    const peak = data.reduce((max, item) => (item.loveScore > max.loveScore ? item : max), data[0]);
    const bottom = data.reduce((min, item) => (item.loveScore < min.loveScore ? item : min), data[0]);
    const avg = Math.round(data.reduce((sum, item) => sum + item.loveScore, 0) / data.length);
    
    // 计算整体趋势
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    const firstAvg = firstHalf.reduce((s, i) => s + i.loveScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, i) => s + i.loveScore, 0) / secondHalf.length;
    const trend = secondAvg > firstAvg + 5 ? 'up' : secondAvg < firstAvg - 5 ? 'down' : 'stable';
    
    return { peak, bottom, avg, trend };
  }, [loveAnalysis.loveYearlyData]);

  // 雷达图数据
  const radarData = useMemo(() => [
    { subject: '桃花', value: loveAnalysis.loveStarScore * 10, fullMark: 100 },
    { subject: '正缘', value: loveAnalysis.spouseTypeScore * 10, fullMark: 100 },
    { subject: '婚宫', value: loveAnalysis.marriagePalaceScore * 10, fullMark: 100 },
    { subject: '贵人', value: 70, fullMark: 100 },
    { subject: '风控', value: loveAnalysis.loveRiskLevel === 'low' ? 90 : loveAnalysis.loveRiskLevel === 'medium' ? 60 : 30, fullMark: 100 },
    { subject: '子女', value: loveAnalysis.childrenFortuneScore * 10, fullMark: 100 },
  ], [loveAnalysis]);

  // 十年周期对比数据
  const decadeData = useMemo(() => {
    const data = loveAnalysis.loveYearlyData || [];
    const decades: { decade: string; avg: number; max: number; min: number }[] = [];
    
    for (let i = 0; i < 10; i++) {
      const start = i * 10;
      const end = start + 10;
      const decadeItems = data.slice(start, end);
      
      if (decadeItems.length > 0) {
        const scores = decadeItems.map(d => d.loveScore);
        decades.push({
          decade: `${start + 1}-${end}岁`,
          avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          max: Math.max(...scores),
          min: Math.min(...scores)
        });
      }
    }
    
    return decades;
  }, [loveAnalysis.loveYearlyData]);

  // 获取桃花等级描述
  const getLoveLevel = () => {
    const avg = stats.avg;
    if (avg >= 70) return { level: '极旺', desc: '桃花朵朵开' };
    if (avg >= 55) return { level: '旺盛', desc: '异性缘佳' };
    if (avg >= 40) return { level: '平平', desc: '随缘而遇' };
    return { level: '淡薄', desc: '专注事业' };
  };

  const loveLevel = getLoveLevel();

  return (
    <div className="space-y-6 bg-gradient-to-br from-pink-50 via-white to-rose-50 p-6 md:p-8 rounded-3xl border-2 border-pink-200 shadow-xl">
      {/* ========== 标题栏 ========== */}
      <div
        className="flex items-center gap-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-4 bg-gradient-to-br from-pink-400 via-rose-500 to-red-400 rounded-2xl shadow-lg">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl md:text-3xl font-bold font-serif-sc text-gray-900">桃花运势深度分析</h2>
          <p className="text-sm text-pink-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Love Destiny Deep Analysis
          </p>
        </div>
        <div className="flex items-center gap-4">
          <LovePatternBadge type={loveAnalysis.lovePatternType} size="normal" />
          <button className="p-3 hover:bg-pink-100 rounded-xl transition-colors">
            {isExpanded ? <ChevronUp className="w-6 h-6 text-gray-500" /> : <ChevronDown className="w-6 h-6 text-gray-500" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* ========== 核心指标概览 ========== */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="桃花等级"
              value={loveLevel.level}
              subtitle={loveLevel.desc}
              icon={Flower2}
              color="text-pink-500"
            />
            <MetricCard
              title="平均桃花"
              value={`${stats.avg}分`}
              subtitle="一生桃花均值"
              icon={Heart}
              color="text-rose-500"
              trend={stats.trend}
            />
            <MetricCard
              title="桃花巅峰"
              value={`${stats.peak?.year || '--'}年`}
              subtitle={`${stats.peak?.age || '--'}岁 · ${stats.peak?.loveScore || 0}分`}
              icon={Sparkles}
              color="text-purple-500"
              trend="up"
            />
            <MetricCard
              title="最佳婚期"
              value={loveAnalysis.lovePatternType === 'early' ? '25岁前' : 
                     loveAnalysis.lovePatternType === 'late' ? '30岁后' : '25-30岁'}
              subtitle={loveAnalysis.lovePatternType === 'multiple' ? '需多经营' : '适婚年龄'}
              icon={Church}
              color="text-indigo-500"
            />
          </div>

          {/* ========== 选项卡导航 ========== */}
          <div className="flex gap-2 bg-white/60 p-2 rounded-xl border border-pink-100">
            {[
              { key: 'overview', label: '总览分析', icon: Gem },
              { key: 'yearly', label: '流年桃花', icon: Calendar },
              { key: 'advice', label: '婚配建议', icon: Lightbulb },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-pink-50'
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
                {/* 桃花雷达图 */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500" />
                    桃花综合评估
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#fce7f3" />
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
                        name="桃花指数"
                        dataKey="value"
                        stroke="#ec4899"
                        fill="#ec4899"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* 十年周期对比 */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    十年周期桃花对比
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={decadeData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                      <XAxis dataKey="decade" tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid #fbcfe8',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value: number, name: string) => [
                          `${value}分`,
                          name === 'avg' ? '平均' : name === 'max' ? '最高' : '最低'
                        ]}
                      />
                      <Bar dataKey="avg" fill="#f472b6" radius={[4, 4, 0, 0]} name="avg">
                        {decadeData.map((entry, index) => (
                          <Cell key={index} fill={entry.avg >= 60 ? '#ec4899' : entry.avg >= 40 ? '#a855f7' : '#6b7280'} />
                        ))}
                      </Bar>
                      <Line type="monotone" dataKey="max" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899' }} name="max" />
                      <Line type="monotone" dataKey="min" stroke="#6b7280" strokeWidth={2} dot={{ fill: '#6b7280' }} name="min" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 核心分析卡片 - 第一行 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 桃花星状态 */}
                <AnalysisCard 
                  title="桃花星状态" 
                  icon={Flower2} 
                  iconColor="text-pink-600"
                  bgColor="bg-gradient-to-br from-pink-50 to-rose-50"
                  score={loveAnalysis.loveStarScore}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {[1,2,3,4,5].map(i => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i <= Math.round(loveAnalysis.loveStarScore / 2) ? 'text-pink-400 fill-pink-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {loveAnalysis.loveStar}
                  </p>
                </AnalysisCard>

                {/* 正缘类型 */}
                <AnalysisCard 
                  title="正缘配偶" 
                  icon={HeartHandshake} 
                  iconColor="text-purple-600" 
                  score={loveAnalysis.spouseTypeScore}
                >
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {loveAnalysis.spouseType}
                  </p>
                </AnalysisCard>

                {/* 婚恋模式 */}
                <AnalysisCard 
                  title="婚恋模式" 
                  icon={Church} 
                  iconColor="text-blue-600"
                >
                  <div className="mb-3">
                    <LovePatternBadge type={loveAnalysis.lovePatternType} size="large" />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {loveAnalysis.lovePattern}
                  </p>
                </AnalysisCard>
              </div>

              {/* 核心分析卡片 - 第二行 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 感情风险 */}
                <AnalysisCard 
                  title="感情风险" 
                  icon={HeartCrack} 
                  iconColor="text-orange-600"
                >
                  <LoveRiskIndicator level={loveAnalysis.loveRiskLevel} />
                  <p className="text-sm text-gray-600 leading-relaxed mt-4">
                    {loveAnalysis.loveRisk}
                  </p>
                </AnalysisCard>

                {/* 婚姻宫分析 */}
                <AnalysisCard 
                  title="婚姻宫分析" 
                  icon={Crown} 
                  iconColor="text-indigo-600"
                  score={loveAnalysis.marriagePalaceScore}
                >
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {loveAnalysis.marriagePalace}
                  </p>
                </AnalysisCard>

                {/* 感情贵人 */}
                <AnalysisCard 
                  title="感情贵人" 
                  icon={Users} 
                  iconColor="text-rose-600"
                >
                  <div className="flex items-center gap-3 mb-3 p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <MapPin className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">贵人方位</p>
                      <p className="text-lg font-bold text-rose-600">{loveAnalysis.loveNobleDirection}方</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {loveAnalysis.loveNoble}
                  </p>
                </AnalysisCard>
              </div>

              {/* 桃花周期时间线 */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-8 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-pink-500" />
                  人生桃花周期
                  <span className="text-xs text-gray-400 font-normal ml-2">（点击查看详情）</span>
                </h3>
                
                <div className="relative">
                  {/* 时间线背景 */}
                  <div className="absolute top-7 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-200 via-rose-300 to-pink-200 rounded-full" />
                  
                  {/* 时间节点 */}
                  <div className="flex justify-between gap-2 relative">
                    {loveAnalysis.loveCycle?.map((period, idx) => (
                      <LoveCycleNode 
                        key={idx} 
                        period={period} 
                        isFirst={idx === 0}
                        isLast={idx === (loveAnalysis.loveCycle?.length || 0) - 1}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== 流年桃花 Tab ========== */}
          {activeTab === 'yearly' && (
            <div className="space-y-6">
              {/* 桃花走势曲线 */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  一生桃花走势曲线
                  <span className="text-xs text-gray-400 font-normal ml-2">（悬停查看每年详情）</span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={loveAnalysis.loveYearlyData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="loveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={0.8} />
                        <stop offset="50%" stopColor="#f472b6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#fce7f3" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                    <XAxis
                      dataKey="age"
                      tickFormatter={(v) => `${v}岁`}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#fce7f3' }}
                      interval={9}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#fce7f3' }}
                      tickCount={6}
                    />
                    <Tooltip content={<LoveChartTooltip />} />
                    <ReferenceLine 
                      y={70} 
                      stroke="#ec4899" 
                      strokeDasharray="4 4" 
                      label={{ value: '桃花旺', fill: '#ec4899', fontSize: 10, position: 'right' }} 
                    />
                    <ReferenceLine 
                      y={50} 
                      stroke="#a855f7" 
                      strokeDasharray="4 4" 
                      label={{ value: '中等线', fill: '#a855f7', fontSize: 10, position: 'right' }} 
                    />
                    <ReferenceLine 
                      y={30} 
                      stroke="#6b7280" 
                      strokeDasharray="4 4" 
                      label={{ value: '桃花淡', fill: '#6b7280', fontSize: 10, position: 'right' }} 
                    />
                    <Area
                      type="monotone"
                      dataKey="loveScore"
                      stroke="#ec4899"
                      fill="url(#loveGradient)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 8, fill: '#ec4899', stroke: '#fff', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 关键年份标记 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 桃花旺年 */}
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-2xl border border-pink-200">
                  <h4 className="font-bold text-pink-800 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    桃花旺年 TOP 5
                  </h4>
                  <div className="space-y-2">
                    {loveAnalysis.loveYearlyData
                      ?.slice()
                      .sort((a, b) => b.loveScore - a.loveScore)
                      .slice(0, 5)
                      .map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/60 p-3 rounded-xl">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-pink-400 text-white' : 
                            idx === 1 ? 'bg-rose-300 text-white' : 
                            idx === 2 ? 'bg-pink-200 text-pink-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <span className="font-bold text-gray-800">{item.year}年</span>
                            <span className="text-gray-400 mx-2">·</span>
                            <span className="text-gray-600">{item.age}岁</span>
                          </div>
                          <span className="text-lg font-bold text-pink-600">{item.loveScore}分</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 感情低谷期 */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-2xl border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    感情淡薄期 警示
                  </h4>
                  <div className="space-y-2">
                    {loveAnalysis.loveYearlyData
                      ?.slice()
                      .sort((a, b) => a.loveScore - b.loveScore)
                      .slice(0, 5)
                      .map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/60 p-3 rounded-xl">
                          <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">
                            ⏳
                          </span>
                          <div className="flex-1">
                            <span className="font-bold text-gray-800">{item.year}年</span>
                            <span className="text-gray-400 mx-2">·</span>
                            <span className="text-gray-600">{item.age}岁</span>
                          </div>
                          <span className="text-lg font-bold text-gray-600">{item.loveScore}分</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== 婚配建议 Tab ========== */}
          {activeTab === 'advice' && (
            <div className="space-y-6">
              {/* 最佳婚配 */}
              <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 p-6 rounded-2xl border border-pink-200">
                <h3 className="text-xl font-bold text-pink-800 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-pink-500 rounded-xl text-white">
                    <HeartHandshake className="w-6 h-6" />
                  </div>
                  婚配分析
                </h3>
                <MatchDisplay bestMatch={loveAnalysis.bestMatch} avoidMatch={loveAnalysis.avoidMatch} />
              </div>

              {/* 增桃花之道 */}
              <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-fuchsia-50 p-6 rounded-2xl border border-rose-200">
                <h3 className="text-xl font-bold text-rose-800 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-rose-500 rounded-xl text-white">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  增桃花之道
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* 喜用颜色 */}
                  <div className="bg-white/70 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-400 to-rose-400" />
                      增桃花颜色
                    </p>
                    <p className="font-bold text-gray-800">粉色、红色、紫色</p>
                  </div>
                  
                  {/* 有利方位 */}
                  <div className="bg-white/70 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      有利方位
                    </p>
                    <p className="font-bold text-gray-800">{loveAnalysis.loveNobleDirection}方</p>
                  </div>
                  
                  {/* 婚恋类型 */}
                  <div className="bg-white/70 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Church className="w-3 h-3 text-purple-500" />
                      婚恋类型
                    </p>
                    <p className="font-bold text-gray-800">
                      {loveAnalysis.lovePatternType === 'early' ? '早婚型' :
                       loveAnalysis.lovePatternType === 'late' ? '晚婚型' :
                       loveAnalysis.lovePatternType === 'multiple' ? '多婚型' : '正常型'}
                    </p>
                  </div>
                  
                  {/* 桃花等级 */}
                  <div className="bg-white/70 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Flower2 className="w-3 h-3 text-pink-500" />
                      桃花潜力
                    </p>
                    <p className="font-bold text-gray-800">{loveLevel.level}</p>
                  </div>
                </div>
                
                <div className="bg-white/60 p-5 rounded-xl">
                  <p className="text-gray-700 leading-relaxed">
                    💕 {loveAnalysis.loveAdvice}
                  </p>
                </div>
              </div>

              {/* 感情风险警示 */}
              <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 p-6 rounded-2xl border border-orange-200">
                <h3 className="text-xl font-bold text-orange-800 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-xl text-white">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  感情风险警示
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/70 p-4 rounded-xl border-l-4 border-orange-400">
                    <p className="text-xs text-gray-500 mb-1">风险等级</p>
                    <p className="font-bold text-orange-700">
                      {loveAnalysis.loveRiskLevel === 'high' ? '高风险' :
                       loveAnalysis.loveRiskLevel === 'medium' ? '中等风险' : '低风险'}
                    </p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-xl border-l-4 border-amber-400">
                    <p className="text-xs text-gray-500 mb-1">重点防范期</p>
                    <p className="font-bold text-amber-700">
                      {loveAnalysis.loveYearlyData
                        ?.filter(d => d.loveScore < 40)
                        .slice(0, 3)
                        .map(d => `${d.age}岁`)
                        .join('、') || '暂无'}
                    </p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-xl border-l-4 border-yellow-400">
                    <p className="text-xs text-gray-500 mb-1">婚恋建议</p>
                    <p className="font-bold text-yellow-700">
                      {loveAnalysis.lovePatternType === 'early' ? '宜早婚' :
                       loveAnalysis.lovePatternType === 'late' ? '宜晚婚' :
                       loveAnalysis.lovePatternType === 'multiple' ? '需慎重' : '顺其自然'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/60 p-5 rounded-xl">
                  <p className="text-gray-700 leading-relaxed">
                    ⚠️ {loveAnalysis.loveRisk}
                  </p>
                </div>
              </div>

              {/* 子女缘分析 */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
                <h3 className="text-xl font-bold text-blue-800 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-xl text-white">
                    <Baby className="w-6 h-6" />
                  </div>
                  子女缘分析
                  <span className={`ml-2 px-3 py-1 rounded-lg text-sm font-bold ${
                    loveAnalysis.childrenFortuneScore >= 7 ? 'bg-emerald-50 text-emerald-600' :
                    loveAnalysis.childrenFortuneScore >= 5 ? 'bg-blue-50 text-blue-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {loveAnalysis.childrenFortuneScore}/10
                  </span>
                </h3>
                
                <div className="bg-white/60 p-5 rounded-xl">
                  <p className="text-gray-700 leading-relaxed">
                    👶 {loveAnalysis.childrenFortune}
                  </p>
                </div>
              </div>

              {/* 感情贵人详解 */}
              <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
                <h3 className="text-xl font-bold text-purple-800 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-xl text-white">
                    <Users className="w-6 h-6" />
                  </div>
                  感情贵人
                </h3>
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <div className="text-center text-white">
                        <MapPin className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{loveAnalysis.loveNobleDirection}</p>
                        <p className="text-xs opacity-80">贵人方位</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 bg-white/60 p-5 rounded-xl">
                    <p className="text-gray-700 leading-relaxed">
                      🌟 {loveAnalysis.loveNoble}
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

export default LoveAnalysisPanel;

