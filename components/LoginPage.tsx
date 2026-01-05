import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();
    
    if (!username.trim()) {
      setLocalError('请输入账号');
      return;
    }
    
    if (!password.trim()) {
      setLocalError('请输入密码');
      return;
    }
    
    const success = await login(username.trim(), password);
    
    if (success) {
      navigate('/', { replace: true });
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 font-serif-sc">人生K线</h1>
          <p className="text-slate-400 text-sm">Life Destiny K-Line System</p>
        </div>
        
        {/* 登录卡片 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">账号登录</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 账号输入 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                账号
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  placeholder="请输入账号 (如 LK20260104...)"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            {/* 密码输入 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            {/* 错误提示 */}
            {displayError && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{displayError}</span>
              </div>
            )}
            
            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  登录中...
                </>
              ) : (
                '登 录'
              )}
            </button>
          </form>
          
          {/* 帮助提示 */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-slate-400 text-sm text-center">
              还没有账号？请前往电商平台购买
            </p>
            <div className="flex justify-center gap-4 mt-3">
              <span className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full">淘宝</span>
              <span className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full">咸鱼</span>
              <span className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full">小红书</span>
            </div>
          </div>
        </div>
        
        {/* 底部版权 */}
        <p className="text-slate-500 text-xs text-center mt-6">
          © {new Date().getFullYear()} 人生K线 | 仅供娱乐与文化研究
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
