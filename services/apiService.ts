/**
 * 后端 API 服务封装
 * 用于调用后端代理服务生成命理分析数据
 */

// 后端服务地址（从环境变量读取）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Token 存储 key
const TOKEN_KEY = 'lifekline_token';

/**
 * 获取当前认证 Token
 */
function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 获取带认证的请求头
 */
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

export interface BaziInfo {
  name?: string;
  gender: 'Male' | 'Female';
  birthYear: string;
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  startAge: string;
  firstDaYun: string;
}

export interface GenerateResult {
  success: boolean;
  data?: any;
  error?: string;
  errorCode?: string;
  remainingUses?: number;
}

/**
 * 生成 K线主分析（需要认证，消耗次数）
 */
export async function generateMainAnalysis(baziInfo: BaziInfo): Promise<GenerateResult> {
  console.log('[API] 调用 K线主分析接口...');
  console.log('[API] URL:', `${API_BASE_URL}/api/generate`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ baziInfo }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[API] 请求失败:', result.error);
      return { 
        success: false, 
        error: result.error || '生成失败',
        errorCode: result.errorCode,
        remainingUses: result.remainingUses,
      };
    }

    console.log('[API] K线主分析生成成功');
    return { 
      success: true, 
      data: result.data,
      remainingUses: result.remainingUses,
    };
  } catch (error: any) {
    console.error('[API] 网络错误:', error);
    return { success: false, error: '网络错误，请检查网络连接或后端服务是否启动' };
  }
}

/**
 * 生成财富深度分析（需要认证，消耗次数）
 */
export async function generateWealthAnalysis(params: {
  bazi: string[];
  birthYear: number;
  summary?: string;
  geJu?: string;
  yongShen?: string;
}): Promise<GenerateResult> {
  console.log('[API] 调用财富深度分析接口...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate/wealth`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[API] 请求失败:', result.error);
      return { 
        success: false, 
        error: result.error || '生成失败',
        errorCode: result.errorCode,
        remainingUses: result.remainingUses,
      };
    }

    console.log('[API] 财富深度分析生成成功');
    return { 
      success: true, 
      data: result.data,
      remainingUses: result.remainingUses,
    };
  } catch (error: any) {
    console.error('[API] 网络错误:', error);
    return { success: false, error: '网络错误，请检查网络连接或后端服务是否启动' };
  }
}

/**
 * 生成桃花深度分析（需要认证，消耗次数）
 */
export async function generateLoveAnalysis(params: {
  bazi: string[];
  birthYear: number;
  summary?: string;
  geJu?: string;
  yongShen?: string;
}): Promise<GenerateResult> {
  console.log('[API] 调用桃花深度分析接口...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate/love`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[API] 请求失败:', result.error);
      return { 
        success: false, 
        error: result.error || '生成失败',
        errorCode: result.errorCode,
        remainingUses: result.remainingUses,
      };
    }

    console.log('[API] 桃花深度分析生成成功');
    return { 
      success: true, 
      data: result.data,
      remainingUses: result.remainingUses,
    };
  } catch (error: any) {
    console.error('[API] 网络错误:', error);
    return { success: false, error: '网络错误，请检查网络连接或后端服务是否启动' };
  }
}

/**
 * 检查后端服务健康状态
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
