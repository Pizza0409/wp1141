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

interface LineUserOption {
  id: string;
  lineUserId: string;
  displayName: string;
  createdAt: string;
}

interface AdminAccount {
  id: string;
  username: string;
  role: 'admin' | 'viewer';
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
  const [lineUsers, setLineUsers] = useState<LineUserOption[]>([]);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
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

  // 取得使用者 / 管理帳號列表
  const fetchUsers = async () => {
    if (!user) return;

    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: ApiResponse<{
        lineUsers: LineUserOption[];
        adminAccounts: AdminAccount[];
      }> = await res.json();

      if (data.success && data.data) {
        setLineUsers(data.data.lineUsers);
        setAdminAccounts(data.data.adminAccounts);
        if (!filterUserId && data.data.lineUsers.length > 0) {
          setFilterUserId(data.data.lineUsers[0].lineUserId);
        }
      } else {
        console.error('取得使用者列表失敗:', data.error || '未知錯誤');
        setLineUsers([]);
        setAdminAccounts([]);
      }
    } catch (error: any) {
      console.error('取得使用者列表失敗:', error);
      setLineUsers([]);
      setAdminAccounts([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // 取得統計資料
  const fetchStatistics = async () => {
    if (!user) return;
    
    try {
      const params = new URLSearchParams();
      if (filterUserId && filterUserId.trim()) {
        params.append('userId', filterUserId.trim());
      }
      if (filterMonth && filterMonth.trim()) {
        // 驗證月份格式：YYYY-MM
        const monthMatch = filterMonth.trim().match(/^(\d{4})-(\d{2})$/);
        if (monthMatch) {
          const [, year, month] = monthMatch;
          const yearNum = parseInt(year, 10);
          const monthNum = parseInt(month, 10);
          
          if (yearNum > 0 && monthNum >= 1 && monthNum <= 12) {
            params.append('year', year);
            params.append('month', month);
          } else {
            console.warn('無效的月份格式:', filterMonth);
          }
        } else {
          console.warn('月份格式錯誤，應為 YYYY-MM:', filterMonth);
        }
      }

      const res = await fetch(`/api/admin/statistics?${params}`, {
        headers: getAuthHeaders(),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data: ApiResponse<Statistics> = await res.json();

      if (data.success && data.data) {
        setStatistics(data.data);
      } else {
        console.error('取得統計資料失敗:', data.error || '未知錯誤');
        setStatistics(null);
      }
    } catch (error: any) {
      console.error('取得統計資料失敗:', error);
      setStatistics(null);
    }
  };

  // 取得記帳記錄
  const fetchExpenses = async () => {
    if (!user) return;
    
    setExpensesLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterUserId && filterUserId.trim()) {
        params.append('userId', filterUserId.trim());
      }
      if (filterMonth && filterMonth.trim()) {
        // 驗證月份格式：YYYY-MM
        const monthMatch = filterMonth.trim().match(/^(\d{4})-(\d{2})$/);
        if (monthMatch) {
          const [, year, month] = monthMatch;
          const yearNum = parseInt(year, 10);
          const monthNum = parseInt(month, 10);
          
          if (yearNum > 0 && monthNum >= 1 && monthNum <= 12) {
            const startDate = new Date(yearNum, monthNum - 1, 1);
            const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
            params.append('startDate', startDate.toISOString());
            params.append('endDate', endDate.toISOString());
          } else {
            console.warn('無效的月份格式:', filterMonth);
          }
        } else {
          console.warn('月份格式錯誤，應為 YYYY-MM:', filterMonth);
        }
      }
      params.append('limit', '100');

      const res = await fetch(`/api/admin/expenses?${params}`, {
        headers: getAuthHeaders(),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data: ApiResponse<Expense[]> = await res.json();

      if (data.success && data.data) {
        setExpenses(data.data);
      } else {
        console.error('取得記帳記錄失敗:', data.error || '未知錯誤');
        setExpenses([]); // 清空列表以避免顯示舊數據
      }
    } catch (error: any) {
      console.error('取得記帳記錄失敗:', error);
      setExpenses([]); // 發生錯誤時清空列表
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
    fetchUsers();
  }, []);

  const resolveUserLabel = (lineUserId: string) => {
    const user = lineUsers.find((u) => u.lineUserId === lineUserId);
    return user ? `${user.displayName} (${lineUserId})` : lineUserId;
  };

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
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  帳號
                </label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, username: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  style={{ color: '#111827' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  密碼
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  style={{ color: '#111827' }}
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">
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
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  style={{ color: '#111827' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
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
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  style={{ color: '#111827' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  確認密碼
                </label>
                <input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  style={{ color: '#111827' }}
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
                使用者
              </label>
              <select
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="">全部使用者</option>
                {lineUsers.map((lineUser) => (
                  <option key={lineUser.id} value={lineUser.lineUserId}>
                    {lineUser.displayName} ({lineUser.lineUserId})
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                placeholder="或手動輸入使用者 ID"
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
              <div className="flex items-center mt-2 gap-2 text-xs text-gray-500">
                <button
                  type="button"
                  onClick={() => setFilterUserId('')}
                  className="text-blue-600 hover:underline"
                  disabled={!filterUserId}
                >
                  清除選擇
                </button>
                {usersLoading ? (
                  <span>載入使用者列表...</span>
                ) : (
                  <span>共 {lineUsers.length} 位使用者</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                月份
              </label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
              <div className="flex items-center mt-2 gap-2 text-xs text-gray-500">
                <button
                  type="button"
                  onClick={() => setFilterMonth('')}
                  className="text-blue-600 hover:underline"
                  disabled={!filterMonth}
                >
                  清除月份
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 帳號列表 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">後台帳號列表</h2>
            {usersLoading ? (
              <span className="text-sm text-gray-500">載入中...</span>
            ) : (
              <span className="text-sm text-gray-500">
                共 {adminAccounts.length} 筆
              </span>
            )}
          </div>
          {usersLoading ? (
            <div className="text-center py-6 text-gray-600">載入中...</div>
          ) : adminAccounts.length === 0 ? (
            <div className="text-center py-6 text-gray-600">尚無帳號資料</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      帳號
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      角色
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      建立時間
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {adminAccounts.map((account) => (
                    <tr key={account.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {account.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {account.role === 'admin' ? '管理者' : '觀看者'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(account.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
              <p className="text-gray-700 font-medium">載入中...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-700 font-medium">尚無記帳記錄</p>
              <p className="text-sm text-gray-500 mt-2">
                請確認是否有記帳資料，或檢查篩選條件
              </p>
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
                      使用者
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
                        {resolveUserLabel(expense.userId)}
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
              <p className="text-gray-700 font-medium">載入中...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-700 font-medium">尚無對話紀錄</p>
              <p className="text-sm text-gray-500 mt-2">
                請確認是否有對話資料，或檢查篩選條件
              </p>
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
                        使用者：{resolveUserLabel(conv.userId)}
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


