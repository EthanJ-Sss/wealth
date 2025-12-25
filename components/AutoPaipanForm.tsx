/**
 * 自动排盘表单组件
 * 用户输入出生时间，自动计算八字四柱和大运信息
 */

import React, { useState, useMemo } from 'react';
import { 
  calculateBazi, 
  PaipanResult, 
  getShiChenList, 
  getDaysInMonth,
  BirthTimeInput 
} from '../services/paipanService';
import { Calendar, Clock, User, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

interface AutoPaipanFormProps {
  onResult: (result: PaipanResult) => void;
  onFillForm: (data: {
    birthYear: string;
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
    hourPillar: string;
    startAge: string;
    firstDaYun: string;
    gender: string;
  }) => void;
}

const AutoPaipanForm: React.FC<AutoPaipanFormProps> = ({ onResult, onFillForm }) => {
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState<BirthTimeInput>({
    year: currentYear - 30,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    gender: 'male',
  });
  
  const [result, setResult] = useState<PaipanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filled, setFilled] = useState(false);
  
  const shiChenList = getShiChenList();
  
  // 生成年份选项（1900-2100）
  const yearOptions = useMemo(() => 
    Array.from({ length: 201 }, (_, i) => 1900 + i), 
  []);
  
  // 生成月份选项
  const monthOptions = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => i + 1), 
  []);
  
  // 生成日期选项（根据年月动态计算）
  const dayOptions = useMemo(() => {
    const days = getDaysInMonth(formData.year, formData.month);
    return Array.from({ length: days }, (_, i) => i + 1);
  }, [formData.year, formData.month]);
  
  // 当月份天数变化时，调整日期
  React.useEffect(() => {
    const maxDay = getDaysInMonth(formData.year, formData.month);
    if (formData.day > maxDay) {
      setFormData(prev => ({ ...prev, day: maxDay }));
    }
  }, [formData.year, formData.month, formData.day]);
  
  // 执行排盘计算
  const handleCalculate = () => {
    try {
      setError(null);
      setFilled(false);
      const paipanResult = calculateBazi(formData);
      setResult(paipanResult);
      onResult(paipanResult);
    } catch (err: any) {
      console.error('排盘错误:', err);
      setError(`排盘失败：${err.message || '未知错误'}`);
      setResult(null);
    }
  };
  
  // 填充到表单
  const handleFillForm = () => {
    if (!result) return;
    
    onFillForm({
      birthYear: result.birthYear.toString(),
      yearPillar: result.yearPillar,
      monthPillar: result.monthPillar,
      dayPillar: result.dayPillar,
      hourPillar: result.hourPillar,
      startAge: result.startAge.toString(),
      firstDaYun: result.firstDaYun,
      gender: formData.gender === 'male' ? 'Male' : 'Female',
    });
    setFilled(true);
  };
  
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-purple-600 text-white p-1.5 rounded-lg">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-purple-800">自动排盘</h3>
          <p className="text-xs text-purple-500">输入出生时间，自动生成八字</p>
        </div>
      </div>
      
      {/* 出生日期选择 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">出生年份</label>
          <select
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm"
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">月份</label>
          <select
            value={formData.month}
            onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm"
          >
            {monthOptions.map(m => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">日期</label>
          <select
            value={formData.day}
            onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm"
          >
            {dayOptions.map(d => (
              <option key={d} value={d}>{d}日</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* 时辰和性别 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            <Clock className="w-3 h-3 inline mr-1" />
            出生时辰
          </label>
          <select
            value={formData.hour}
            onChange={(e) => setFormData({ ...formData, hour: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm"
          >
            {shiChenList.map(sc => (
              <option key={sc.value} value={sc.value}>
                {sc.label} ({sc.range})
              </option>
            ))}
            <option value={-1}>⚠️ 不知道时辰</option>
          </select>
          {formData.hour === -1 && (
            <p className="text-xs text-amber-600 mt-1">将按午时（12:00）计算</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            <User className="w-3 h-3 inline mr-1" />
            性别
          </label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
            className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm"
          >
            <option value="male">乾造 (男)</option>
            <option value="female">坤造 (女)</option>
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
        <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {/* 排盘结果预览 */}
      {result && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-gray-800">排盘结果</h4>
            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
              {result.zodiac}年生
            </span>
          </div>
          
          {/* 四柱展示 */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: '年柱', value: result.yearPillar },
              { label: '月柱', value: result.monthPillar },
              { label: '日柱', value: result.dayPillar },
              { label: '时柱', value: result.hourPillar },
            ].map((item, i) => (
              <div key={i} className="text-center p-2 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                <div className="text-xl font-serif-sc font-bold text-gray-800">{item.value}</div>
              </div>
            ))}
          </div>
          
          {/* 附加信息 */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between">
              <span className="text-gray-500">农历:</span>
              <span className="font-medium text-gray-700">{result.lunarDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">日主:</span>
              <span className="font-medium text-gray-700">{result.dayMaster}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">起运:</span>
              <span className="font-medium text-indigo-600">{result.startAge}岁</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">首运:</span>
              <span className="font-medium text-indigo-600">{result.firstDaYun}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-gray-500">大运方向:</span>
              <span className={`font-medium ${result.daYunDirection === 'forward' ? 'text-green-600' : 'text-orange-600'}`}>
                {result.daYunDirection === 'forward' ? '顺行 ↗' : '逆行 ↙'}
              </span>
            </div>
          </div>
          
          {/* 大运预览 */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">大运预览（前5步）:</div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {result.daYunList.slice(0, 5).map((dy, i) => (
                <div key={i} className="flex-shrink-0 text-center px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="font-serif-sc font-bold text-indigo-700">{dy.ganZhi}</div>
                  <div className="text-xs text-indigo-500">{dy.startAge}-{dy.endAge}岁</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 填充按钮 */}
          <button
            onClick={handleFillForm}
            disabled={filled}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              filled 
                ? 'bg-green-500 text-white cursor-default'
                : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg'
            }`}
          >
            {filled ? (
              <>
                <CheckCircle className="w-5 h-5" />
                已填充到下方表单
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                使用此结果填充表单
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default AutoPaipanForm;


