import OpenAI from 'openai';
import { ParsedExpense, ParsedMessage } from '@/types';
import { z } from 'zod';

// 延遲初始化 OpenAI 客戶端
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY 環境變數未設定');
    }
    openai = new OpenAI({
      apiKey,
    });
  }
  return openai;
}

// 定義解析結果的 Zod schema（舊格式，用於向後兼容）
const ParsedExpenseSchema = z.object({
  category: z.string(),
  detail: z.string(),
  amount: z.number().positive(),
});

// 定義新的解析結果 Zod schema
const ParsedMessageSchema = z.object({
  intent: z.enum(['expense', 'chat', 'query']),
  item: z.string(),
  amount: z.number().min(0),
  category: z.string(),
  reply: z.string(),
});

// 預設項目類別
const DEFAULT_CATEGORIES = [
  '餐點',
  '運動',
  '飲品',
  '生活用品',
  '3C',
  '美妝保養',
  '網路訂閱',
  '交通',
  '娛樂',
  '其他',
];

export class OpenAIService {
  private createPrompt(
    userMessage: string,
    customCategories?: string[],
    conversationHistory?: Array<{ role: string; content: string }>
  ): string {
    const allCategories = [...DEFAULT_CATEGORIES, ...(customCategories || [])];
    const categoriesList = allCategories.join('、');

    // 加入當前時間 (台灣時間)
    const now = new Date();
    const currentDate = now.toLocaleString('zh-TW', { 
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    });
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 月份從 0 開始，所以要 +1

    let historyContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      // 只取最近 5 條對話作為上下文
      const recentHistory = conversationHistory.slice(-5);
      historyContext = '\n\n對話歷史（供參考）：\n' +
        recentHistory.map(msg => `${msg.role === 'user' ? '使用者' : '助手'}: ${msg.content}`).join('\n');
    }

    return `你是一個專業的「記帳小精靈」。你的核心任務是從使用者的自然語言中，提取出消費資訊，並輸出為 JSON 格式。

# 當前時間資訊

- 當前時間（台灣時間）：${currentDate}
- 當前年份：${currentYear}
- 當前月份：${currentMonth}

當使用者提到「今天」、「這個月」、「上個月」等時間相關詞彙時，請參考上述時間資訊。

# 你的角色設定

1. 任務：分析消費內容。

# 輸出規則 (非常重要)

無論使用者說什麼，你最終**只能**回傳一個 JSON 物件，不要包含任何 markdown (\`\`\`json) 標記或其他閒聊文字。

JSON 格式如下：

{
  "intent": "expense" (記帳) 或 "chat" (閒聊/無法判斷) 或 "query" (查詢統計),
  "item": "商品名稱 (字串)",
  "amount": 金額 (數字，若未提及則為 0),
  "category": "推測類別 (從以下類別選擇：${categoriesList}，或使用「食/衣/住/行/育/樂/其他」)",
  "reply": "給用戶的簡短回應 (字串，20-50字)"
}

# 處理邏輯

1. 如果使用者說「午餐 100」，意圖是 "expense"。
   - intent: "expense"
   - item: "午餐"
   - amount: 100
   - category: 從可用類別中選擇最合適的（如：餐點）
   - reply: "✅ 已記錄：餐點 - 午餐 $100"

2. 如果使用者說「你好」，意圖是 "chat"，請在 reply 中引導他記帳。
   - intent: "chat"
   - item: ""
   - amount: 0
   - category: "其他"
   - reply: "👋 你好！我是記帳小精靈，可以幫你記錄支出。例如：午餐 50"

3. 如果使用者說「這個月花多少」或「這個月花費了多少」，意圖是 "query"。
   - intent: "query"
   - item: ""
   - amount: 0
   - category: "其他"
   - reply: "正在為您查詢 ${currentYear}年${currentMonth}月 的統計..."

4. 如果使用者說「上個月花多少」或「上個月花費了多少」，意圖是 "query"。
   - intent: "query"
   - item: ""
   - amount: 0
   - category: "其他"
   - reply: "正在為您查詢上個月的統計..."

5. 如果使用者說「這半年花多少」或「這半年花費了多少」，意圖是 "query"。
   - intent: "query"
   - item: ""
   - amount: 0
   - category: "其他"
   - reply: "正在為您查詢過去6個月的統計..."

6. 如果使用者說「今年花多少」或「這年花費了多少」，意圖是 "query"。
   - intent: "query"
   - item: ""
   - amount: 0
   - category: "其他"
   - reply: "正在為您查詢 ${currentYear}年 的統計..."

7. 如果使用者說「今天午餐 100」，意圖是 "expense"。
   - intent: "expense"
   - item: "午餐"
   - amount: 100
   - category: "餐點"
   - reply: "✅ 已記錄：餐點 - 午餐 $100（${currentDate}）"

# 類別對應規則

- 食：餐點、飲品
- 衣：美妝保養
- 住：生活用品
- 行：交通
- 育：運動、網路訂閱
- 樂：娛樂
- 其他：無法歸類的項目

使用者訊息：${userMessage}${historyContext}

請嚴格按照 JSON 格式回覆，不要包含任何其他文字。`;
  }

  /**
   * 解析使用者訊息（新格式，包含意圖識別）
   */
  async parseMessage(
    userMessage: string,
    customCategories?: string[],
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<ParsedMessage> {
    try {
      const prompt = this.createPrompt(userMessage, customCategories, conversationHistory);

      const response = await getOpenAIClient().chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              '你是一個專業的記帳小精靈。你必須：\n' +
              '1. 嚴格按照 JSON 格式回覆，只回傳 JSON 物件，不要包含任何 markdown 標記\n' +
              '2. 準確識別使用者意圖（expense/chat/query）\n' +
              '3. 準確提取類別、項目名稱和金額\n' +
              '4. 提供簡短友善的回應（20-50字）',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2, // 降低溫度以提高準確性
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI 回應為空');
      }

      // 解析 JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        // 嘗試提取 JSON（如果回應包含其他文字）
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('無法解析 JSON 回應');
        }
      }

      // 使用 Zod 驗證
      const validated = ParsedMessageSchema.parse(parsed);

      return validated;
    } catch (error: any) {
      // 處理 OpenAI API 錯誤
      if (error?.status === 429) {
        throw new Error(
          'API 配額已用完或達到速率限制，請稍後再試'
        );
      }

      if (error?.code === 'insufficient_quota') {
        throw new Error('API 配額不足');
      }

      // 重新拋出其他錯誤
      throw error;
    }
  }

  async parseExpenseMessage(
    userMessage: string,
    customCategories?: string[],
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<ParsedExpense> {
    try {
      const prompt = this.createPrompt(userMessage, customCategories, conversationHistory);

      const response = await getOpenAIClient().chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              '你是一個專業的記帳助手，專門從使用者訊息中提取記帳資訊。你必須：\n' +
              '1. 嚴格按照 JSON 格式回覆\n' +
              '2. 準確識別類別和金額\n' +
              '3. 如果訊息不是記帳相關，將 amount 設為 0\n' +
              '4. 細節描述要具體，不要重複類別名稱',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2, // 降低溫度以提高準確性
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI 回應為空');
      }

      // 解析 JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        // 嘗試提取 JSON（如果回應包含其他文字）
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('無法解析 JSON 回應');
        }
      }

      // 使用 Zod 驗證
      const validated = ParsedExpenseSchema.parse(parsed);

      if (validated.amount === 0) {
        throw new Error('無法從訊息中提取金額');
      }

      return validated;
    } catch (error: any) {
      // 處理 OpenAI API 錯誤
      if (error?.status === 429) {
        throw new Error(
          'API 配額已用完或達到速率限制，請稍後再試'
        );
      }

      if (error?.code === 'insufficient_quota') {
        throw new Error('API 配額不足');
      }

      // 重新拋出其他錯誤
      throw error;
    }
  }

  async generateResponse(
    userMessage: string,
    context?: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<string> {
    try {
      const systemPrompt = `你是一個友善且專業的記帳機器人助手。你的主要功能包括：

【核心功能】
1. 記錄支出：幫助使用者記錄日常開支（格式：項目 金額，如「午餐 50」）
2. 查詢統計：回答關於支出統計的問題（如「這個月花了多少」）
3. 管理記帳項目：協助新增或管理記帳類別
4. 提供記帳建議：給予合理的記帳建議和提醒

【回答規則】
- 用簡潔、友善、親切的語氣回覆
- 回答要具體且實用
- 如果使用者詢問記帳相關問題，要提供有用的資訊
- 如果使用者想記錄支出但格式不清楚，要友善地引導正確格式
- 保持專業但不過於正式
- 回答長度控制在 100 字以內

${context ? `\n【上下文資訊】\n${context}` : ''}`;

      // 構建對話歷史
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

      // 添加對話歷史（最近 6 條）
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-6);
        for (const msg of recentHistory) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            });
          }
        }
      }

      // 添加當前訊息
      messages.push({ role: 'user', content: userMessage });

      const response = await getOpenAIClient().chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 200,
      });

      return response.choices[0]?.message?.content || '抱歉，我無法產生回應。';
    } catch (error: any) {
      if (error?.status === 429) {
        throw new Error('API 配額已用完或達到速率限制');
      }
      throw error;
    }
  }
}

export default new OpenAIService();


