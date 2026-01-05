/**
 * 带认证的 API 服务封装
 * 用于调用需要登录的后端接口
 */

// 后端服务地址
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Token 存储 key
const TOKEN_KEY = 'lifekline_token';

/**
 * 获取当前 Token
 */
function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 带认证的 fetch 封装
 */
async function authFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

export interface GenerateResult {
  success: boolean;
  data?: any;
  error?: string;
  errorCode?: string;
  remainingUses?: number;
}

/**
 * 扣减生成次数 - 主分析
 */
export async function consumeMainGeneration(baziInfo: any): Promise<GenerateResult> {
  try {
    const response = await authFetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ baziInfo }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || '生成失败',
        errorCode: result.errorCode,
        remainingUses: result.remainingUses,
      };
    }
    
    return {
      success: true,
      remainingUses: result.remainingUses,
    };
  } catch (error: any) {
    return {
      success: false,
      error: '网络错误，请检查网络连接',
    };
  }
}

/**
 * 扣减生成次数 - 财富分析
 */
export async function consumeWealthGeneration(params: any): Promise<GenerateResult> {
  try {
    const response = await authFetch('/api/generate/wealth', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || '生成失败',
        errorCode: result.errorCode,
        remainingUses: result.remainingUses,
      };
    }
    
    return {
      success: true,
      remainingUses: result.remainingUses,
    };
  } catch (error: any) {
    return {
      success: false,
      error: '网络错误，请检查网络连接',
    };
  }
}

/**
 * 扣减生成次数 - 桃花分析
 */
export async function consumeLoveGeneration(params: any): Promise<GenerateResult> {
  try {
    const response = await authFetch('/api/generate/love', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || '生成失败',
        errorCode: result.errorCode,
        remainingUses: result.remainingUses,
      };
    }
    
    return {
      success: true,
      remainingUses: result.remainingUses,
    };
  } catch (error: any) {
    return {
      success: false,
      error: '网络错误，请检查网络连接',
    };
  }
}

/**
 * 获取生成状态
 */
export async function getGenerateStatus(): Promise<GenerateResult> {
  try {
    const response = await authFetch('/api/generate/status');
    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || '获取状态失败',
      };
    }
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: '网络错误',
    };
  }
}
