import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// API 基础地址
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// 用户类型
export interface User {
  username: string;
  remainingUses: number;
  totalUses: number;
  status: string;
  firstLoginAt?: string | null;
  lastLoginAt?: string | null;
}

// 认证上下文类型
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// 创建上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token 存储 key
const TOKEN_KEY = 'lifekline_token';
const USER_KEY = 'lifekline_user';

// Provider 组件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化：从 localStorage 恢复登录状态
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // 无效的用户数据，清除
        localStorage.removeItem(USER_KEY);
      }
      // 验证 token 有效性
      validateToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // 验证 token 有效性
  const validateToken = async (tokenToValidate: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setUser(result.data);
          localStorage.setItem(USER_KEY, JSON.stringify(result.data));
        }
      } else {
        // Token 无效，清除登录状态
        handleLogout();
      }
    } catch {
      // 网络错误，保持当前状态
      console.error('Failed to validate token');
    } finally {
      setIsLoading(false);
    }
  };

  // 登录
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        setError(result.error || '登录失败');
        setIsLoading(false);
        return false;
      }
      
      // 保存 token 和用户信息
      const { token: newToken, user: userData } = result.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('网络错误，请检查网络连接');
      setIsLoading(false);
      return false;
    }
  };

  // 内部登出处理
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  // 登出
  const logout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch {
        // 忽略登出请求错误
      }
    }
    handleLogout();
  };

  // 刷新用户信息
  const refreshUser = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setUser(result.data);
          localStorage.setItem(USER_KEY, JSON.stringify(result.data));
        }
      }
    } catch {
      console.error('Failed to refresh user');
    }
  }, [token]);

  // 清除错误
  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义 Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
