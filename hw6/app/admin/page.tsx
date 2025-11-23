'use client';

import { useState, useEffect, useRef } from 'react';
import { ApiResponse } from '@/types';

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

export default function AdminPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterUserId, setFilterUserId] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);

  // 取得對話列表
  const fetchConversations = async () => {
    try {
      const params = new URLSearchParams();
      if (filterUserId) params.append('userId', filterUserId);
      params.append('limit', '50');

      const res = await fetch(`/api/admin/conversations?${params}`);
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
    try {
      const params = new URLSearchParams();
      if (filterUserId) params.append('userId', filterUserId);
      if (filterMonth) {
        const [year, month] = filterMonth.split('-');
        params.append('year', year);
        params.append('month', month);
      }

      const res = await fetch(`/api/admin/statistics?${params}`);
      const data: ApiResponse<Statistics> = await res.json();

      if (data.success && data.data) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('取得統計資料失敗:', error);
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
  }, []);

  // 篩選變更時重新載入
  useEffect(() => {
    fetchConversations();
    fetchStatistics();
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">記帳機器人管理後台</h1>

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


