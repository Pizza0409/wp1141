// 記帳相關類型
export interface ParsedExpense {
  category: string;
  detail: string;
  amount: number;
}

// LLM 解析結果類型（新格式）
export interface ParsedMessage {
  intent: 'expense' | 'chat' | 'query';
  item: string;
  amount: number;
  category: string;
  reply: string;
}

export interface ExpenseInput {
  userId: string;
  category: string;
  detail: string;
  amount: number;
  timestamp?: Date;
}

export interface MonthlyStatistics {
  month: string; // YYYY-MM
  total: number;
  byCategory: Record<string, number>;
}

// Line 相關類型
export interface LineUser {
  userId: string;
  displayName?: string;
  customCategories?: string[];
}

// 對話相關類型
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  userId: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// API 回應類型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}


