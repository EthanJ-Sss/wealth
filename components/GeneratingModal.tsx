import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface GeneratingModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
}

const tips = [
  '正在分析命盘格局...',
  '正在计算大运流年...',
  '正在推算用神喜忌...',
  '正在评估各维度运势...',
  '正在生成流年详批...',
  '正在整理分析报告...',
];

const GeneratingModal: React.FC<GeneratingModalProps> = ({
  isOpen,
  title = '正在生成分析报告',
  message = '请稍候，AI 正在为您分析命盘...'
}) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setTipIndex(0);
      setProgress(0);
      return;
    }

    // 每3秒切换提示文字
    const tipTimer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tips.length);
    }, 3000);

    // 进度条动画
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 5;
      });
    }, 1000);

    return () => {
      clearInterval(tipTimer);
      clearInterval(progressTimer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
        <div className="flex flex-col items-center gap-6">
          {/* 加载动画 */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-indigo-600 animate-bounce" />
              </div>
            </div>
            <Loader2 className="w-24 h-24 text-indigo-300 absolute top-0 left-0 animate-spin" style={{ animationDuration: '2s' }} />
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2 font-serif-sc">{title}</h3>
            <p className="text-gray-500">{message}</p>
          </div>

          {/* 进度条 */}
          <div className="w-full">
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 动态提示 */}
          <div className="h-6 flex items-center">
            <p className="text-sm text-indigo-600 font-medium animate-pulse">
              {tips[tipIndex]}
            </p>
          </div>
          
          <p className="text-xs text-gray-400">预计需要 30-60 秒，请勿关闭页面</p>
        </div>
      </div>
    </div>
  );
};

export default GeneratingModal;
