'use client';

import { useState, useEffect, useRef } from 'react';
import { ApiResponse } from '@/types';

interface User {
  username: string;
  role: 'admin' | 'viewer';
}

interface Conversation {
  _id: string;
  userId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Statistics {
  month: string;
  total: number;
  byCategory: Record<string, number>;
  userCount?: number;
}

interface Expense {
  _id: string;
  userId: string;
  category: string;
  detail: string;
  amount: number;
  timestamp: Date;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [authError, setAuthError] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [filterUserId, setFilterUserId] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);

  // 檢查是否已登入
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }
  }, []);

  // 登入
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data: ApiResponse<{ token: string; user: User }> = await res.json();

      if (data.success && data.data) {
        localStorage.setItem('admin_token', data.data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.data.user));
        setUser(data.data.user);
        setLoginForm({ username: '', password: '' });
      } else {
        setAuthError(data.error || '登入失敗');
      }
    } catch (error) {
      setAuthError('登入時發生錯誤');
    }
  };

  // 註冊
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthError('密碼不一致');
      return;
    }

    try {
      const res = await fetch('/api/admin/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerForm.username,
          password: registerForm.password,
        }),
      });

      const data: ApiResponse<{ username: string; role: string }> = await res.json();

      if (data.success) {
        setAuthError('');
        setIsLoginMode(true);
        setRegisterForm({ username: '', password: '', confirmPassword: '' });
        alert('註冊成功！請登入');
      } else {
        setAuthError(data.error || '註冊失敗');
      }
    } catch (error) {
      setAuthError('註冊時發生錯誤');
    }
  };

  // 登出
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
  };

  // 取得認證標頭
  const getAuthHeaders = (): HeadersInit | undefined => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      return undefined;
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // 取得對話列表
  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      const params = new URLSearchParams();
      if (filterUserId) params.append('userId', filterUserId);
      params.append('limit', '50');

      const res = await fetch(`/api/admin/conversations?${params}`, {
        headers: getAuthHeaders(),
      });
      const data: ApiResponse<Conversation[]> = await res.json();

      if (data.success && data.data) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error('取得對話列表失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 取得統計資料
  const fetchStatistics = async () => {
    if (!user) return;
    
    try {
      const params = new URLSearchParams();
      if (filterUserId) params.append('userId', filterUserId);
      if (filterMonth) {
        const [year, month] = filterMonth.split('-');
        params.append('year', year);
        params.append('month', month);
      }

      const res = await fetch(`/api/admin/statistics?${params}`, {
        headers: getAuthHeaders(),
      });
      const data: ApiResponse<Statistics> = await res.json();

      if (data.success && data.data) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('取得統計資料失敗:', error);
    }
  };

  // 取得記帳記錄
  const fetchExpenses = async () => {
    if (!user) return;
    
    setExpensesLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterUserId) params.append('userId', filterUserId);
      if (filterMonth) {
        const [year, month] = filterMonth.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }
      params.append('limit', '100');

      const res = await fetch(`/api/admin/expenses?${params}`, {
        headers: getAuthHeaders(),
      });
      const data: ApiResponse<Expense[]> = await res.json();

      if (data.success && data.data) {
        setExpenses(data.data);
      }
    } catch (error) {
      console.error('取得記帳記錄失敗:', error);
    } finally {
      setExpensesLoading(false);
    }
  };

  // 設定 SSE 即時更新
  useEffect(() => {
    eventSourceRef.current = new EventSource('/api/admin/events');

    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_conversations' && data.data) {
        // 更新對話列表
        fetchConversations();
      }
    };

    eventSourceRef.current.onerror = () => {
      console.error('SSE 連接錯誤');
    };

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  // 初始載入
  useEffect(() => {
    fetchConversations();
    fetchStatistics();
    fetchExpenses();
  }, []);

  // 篩選變更時重新載入
  useEffect(() => {
    fetchConversations();
    fetchStatistics();
    fetchExpenses();
  }, [filterUserId, filterMonth]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW');
  };

  // 計算統計圖表資料
  const getChartData = () => {
    if (!statistics) return [];

    return Object.entries(statistics.byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: statistics.total > 0 ? (amount / statistics.total) * 100 : 0,
      }));
  };

  // 如果未登入，顯示登入/註冊頁面
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            記帳機器人管理後台
          </h1>

          <div className="flex mb-6 border-b">
            <button
              onClick={() => {
                setIsLoginMode(true);
                setAuthError('');
              }}
              className={`flex-1 py-2 text-center ${
                isLoginMode
                  ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                  : 'text-gray-600'
              }`}
            >
              登入
            </button>
            <button
              onClick={() => {
                setIsLoginMode(false);
                setAuthError('');
              }}
              className={`flex-1 py-2 text-center ${
                !isLoginMode
                  ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                  : 'text-gray-600'
              }`}
            >
              註冊（觀看者）
            </button>
          </div>

          {isLoginMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  帳號
                </label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, username: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密碼
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {authError && (
                <div className="text-red-600 text-sm">{authError}</div>
              )}
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                登入
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  帳號（至少3個字元）
                </label>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, username: e.target.value })
                  }
                  required
                  minLength={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密碼（至少6個字元）
                </label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, password: e.target.value })
                  }
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  確認密碼
                </label>
                <input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {authError && (
                <div className="text-red-600 text-sm">{authError}</div>
              )}
              <button
                type="submit"
                className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                註冊（觀看者）
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                註冊後預設為觀看者，只有管理者可以建立管理者帳號
              </p>
            </form>
          )}
        </div>
      </div>
  );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">記帳機器人管理後台</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.username} ({user.role === 'admin' ? '管理者' : '觀看者'})
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              登出
            </button>
          </div>
        </div>

        {/* 篩選區域 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">篩選條件</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                使用者 ID
              </label>
              <input
                type="text"
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                placeholder="輸入使用者 ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                月份
              </label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 統計區域 */}
        {statistics && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              統計資料 - {statistics.month}
            </h2>
            <div className="mb-4">
              <p className="text-2xl font-bold text-blue-600">
                總計：${statistics.total.toLocaleString()}
              </p>
              {statistics.userCount && (
                <p className="text-sm text-gray-600 mt-1">
                  使用者數：{statistics.userCount}
                </p>
              )}
            </div>

            {/* 類別統計圖表 */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">各項目花費</h3>
              <div className="space-y-3">
                {getChartData().map((item) => (
                  <div key={item.category}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {item.category}
                      </span>
                      <span className="text-sm text-gray-600">
                        ${item.amount.toLocaleString()} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 記帳記錄列表 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">記帳記錄</h2>
            <button
              onClick={fetchExpenses}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              disabled={expensesLoading}
            >
              {expensesLoading ? '載入中...' : '重新整理'}
            </button>
          </div>

          {expensesLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">載入中...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">尚無記帳記錄</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      使用者 ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      類別
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      項目
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      金額
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(expense.timestamp.toString())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.userId.substring(0, 20)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {expense.detail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ${expense.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-gray-600">
                共 {expenses.length} 筆記錄
              </div>
            </div>
          )}
        </div>

        {/* 對話列表 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">對話紀錄</h2>
            <button
              onClick={fetchConversations}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              重新整理
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">載入中...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">尚無對話紀錄</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conv) => (
                <div
                  key={conv._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        使用者：{conv.userId}
                      </p>
                      <p className="text-sm text-gray-500">
                        建立時間：{formatDate(conv.createdAt)}
                      </p>
                      <p className="text-sm text-gray-500">
                        更新時間：{formatDate(conv.updatedAt)}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {conv.messages.length} 則訊息
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                    {conv.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded ${
                          msg.role === 'user'
                            ? 'bg-blue-50 text-blue-900'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-medium mb-1">
                            {msg.role === 'user' ? '使用者' : '機器人'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(msg.timestamp.toString())}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


