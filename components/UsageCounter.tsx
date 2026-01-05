import React from 'react';
import { Zap, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * 生成次数显示组件
 * 显示在页面顶部，展示剩余生成次数
 */
const UsageCounter: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const { remainingUses, totalUses, username } = user;
  const isLow = remainingUses <= 1;
  const isEmpty = remainingUses === 0;

  return (
    <div className="flex items-center gap-4">
      {/* 次数显示 */}
      <div 
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          isEmpty 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : isLow 
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
        }`}
      >
        {isEmpty ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <Zap className={`w-4 h-4 ${isLow ? 'text-amber-500' : 'text-emerald-500'}`} />
        )}
        <span>
          剩余次数: <strong>{remainingUses}</strong> / {totalUses}
        </span>
      </div>

      {/* 用户名和登出 */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
          {username}
        </span>
        <button
          onClick={logout}
          className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
          title="退出登录"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">退出</span>
        </button>
      </div>
    </div>
  );
};

export default UsageCounter;
