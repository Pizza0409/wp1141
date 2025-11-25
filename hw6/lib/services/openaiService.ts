import OpenAI from 'openai';
import { ParsedExpense, ParsedMessage } from '@/types';
import { z } from 'zod';
import logger from './logger';

// 1. 延遲初始化 OpenAI 客戶端 (Singleton Pattern)
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY 環境變數未設定');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// 2. Zod Schemas 定義

// 舊格式 (向後兼容用)
const ParsedExpenseSchema = z.object({
  category: z.string(),
  detail: z.string(),
  amount: z.number().positive(),
});

// 新格式 (包含意圖識別，增強容錯性)
const ParsedMessageSchema = z.object({
  intent: z.enum(['expense', 'income', 'chat', 'query']),
  // 使用 default('') 防止 AI 回傳 null 導致 crash
  item: z.string().nullable().transform(val => val || '').default(''),
  // 允許 0，但通常記帳不應為 0
  amount: z.number().min(0).default(0),
  category: z.string().default('其他'),
  reply: z.string().default(''),
});

// 預設項目類別 (加入 '薪資', '投資' 以支援收入)
const DEFAULT_CATEGORIES = [
  '餐點', '運動', '飲品', '生活用品', '3C',
  '美妝保養', '網路訂閱', '交通', '娛樂', '醫療',
  '薪資', '投資', '其他',
];

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const FEW_SHOT_EXAMPLES: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
  // 範例 1: 一般支出
  { role: 'user', content: '午餐 120' },
  { role: 'assistant', content: '{"intent":"expense","item":"午餐","amount":120,"category":"餐點","reply":"✅ 記帳完成：餐點 - 午餐 $120"}' },
  // 範例 2: 飲品（易誤分類）
  { role: 'user', content: '買了一杯星巴克 160' },
  { role: 'assistant', content: '{"intent":"expense","item":"星巴克","amount":160,"category":"飲品","reply":"☕ 已記錄：飲品 - 星巴克 $160"}' },
  // 範例 3: 日用品
  { role: 'user', content: '買衛生紙 90' },
  { role: 'assistant', content: '{"intent":"expense","item":"衛生紙","amount":90,"category":"生活用品","reply":"🧻 記下來了：生活用品 - 衛生紙 $90"}' },
  // 範例 4: 收入
  { role: 'user', content: '發薪水了 50000' },
  { role: 'assistant', content: '{"intent":"income","item":"薪水","amount":50000,"category":"薪資","reply":"💰 已記錄收入：薪資 $50000"}' },
  // 範例 5: 查詢
  { role: 'user', content: '這個月花多少' },
  { role: 'assistant', content: '{"intent":"query","item":"","amount":0,"category":"其他","reply":"正在為你查詢本月統計..."}' },
  // 範例 6: 閒聊
  { role: 'user', content: '你好嗎' },
  { role: 'assistant', content: '{"intent":"chat","item":"","amount":0,"category":"其他","reply":"嗨嗨！需要記帳或查詢統計嗎？"}' },
];

export class OpenAIService {
  
  /**
   * 私有輔助方法：呼叫 OpenAI 並強制解析為 JSON
   * 這可以減少重複代碼，並統一處理 JSON 解析錯誤
   */
  private async callOpenAIJSON<T>(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    schema: z.ZodType<T>,
    schemaName: string = 'Result'
  ): Promise<T> {
    try {
      const client = getOpenAIClient();
      const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages,
        temperature: 0.2, // 降低溫度以確保 JSON 格式穩定
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('OpenAI 回應內容為空');

      // 嘗試解析 JSON (包含容錯處理)
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        // 補救措施：如果 AI 回傳了 markdown code block，嘗試提取內容
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          logger.error(`[OpenAI] JSON 解析失敗: ${content}`);
          throw new Error('無法解析 JSON 回應');
        }
      }

      // 使用 Zod 進行型別驗證與轉換
      return schema.parse(parsed);

    } catch (error: any) {
      this.handleError(error, schemaName);
      throw error; // 讓上層決定如何處理 (例如降級回覆)
    }
  }

  /**
   * 私有輔助方法：呼叫 OpenAI 產生純文字
   */
  private async callOpenAIText(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    temperature: number = 0.7,
    maxTokens: number = 200
  ): Promise<string> {
    try {
      const client = getOpenAIClient();
      const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
      });
      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      this.handleError(error, 'TextGeneration');
      return '抱歉，我暫時無法產生回應。';
    }
  }

  /**
   * 統一錯誤處理
   */
  private handleError(error: any, context: string) {
    if (error?.status === 429) {
      logger.warn(`[OpenAI] ${context} - Rate Limit Exceeded`);
      throw new Error('API 配額已用完或達到速率限制，請稍後再試');
    }
    if (error?.code === 'insufficient_quota') {
      logger.error(`[OpenAI] ${context} - Insufficient Quota`);
      throw new Error('API 配額不足');
    }
    logger.error(`[OpenAI] ${context} - Error: ${error.message}`);
  }

  /**
   * 建構系統提示詞 (System Prompt)
   */
  private createSystemPrompt(
    customCategories?: string[],
    conversationHistory?: Array<{ role: string; content: string }>
  ): string {
    const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...(customCategories || [])]));
    const categoriesList = allCategories.join('、');

    // 時間資訊 (精確到分，並包含星期)
    const now = new Date();
    const currentDate = now.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 對話歷史摘要
    let historyContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-5);
      historyContext = '\n\n# 對話歷史參考\n' +
        recentHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Bot'}: ${msg.content}`).join('\n');
    }

    return `你是一個專業的「記帳小精靈」。你的核心任務是從使用者的自然語言中，提取出消費或收入資訊，並嚴格輸出為 JSON 格式。

# 當前時間資訊
- 時間：${currentDate} (台灣時間)
- 年份：${currentYear} / 月份：${currentMonth}
- 當使用者提到「今天」、「昨天」、「這個月」時，請基於此時間推算。

# 輸出規則 (Strict JSON)
無論使用者說什麼，你**只能**回傳一個 JSON 物件。**嚴禁**包含 Markdown 標記 (如 \`\`\`json) 或其他閒聊文字。

JSON 格式：
{
  "intent": "expense" (支出) | "income" (收入) | "query" (查詢) | "chat" (閒聊/無法判斷),
  "item": "項目名稱 (字串)",
  "amount": 金額 (數字，若無則為 0),
  "category": "推測類別 (從下方清單選擇)",
  "reply": "給用戶的簡短回應 (字串，溫馨/幽默風格，30字內)"
}

# 類別清單
${categoriesList}

# 關鍵規則
1. **類別對應**：
   - 「食」相關：正餐(午餐/晚餐/便當) -> **「餐點」**。
   - 飲料/咖啡/茶 -> **「飲品」** (請與餐點區分)。
   - 薪水/轉帳收入 -> **「薪資」** 或 **「其他」** (intent 為 income)。
2. **意圖判斷**：
   - 包含「金額」與「項目」-> 通常是 expense 或 income。
   - 「花多少」、「統計」 -> query。
   - 打招呼或無意義文字 -> chat。

${historyContext}`;
  }

  // --- 公開方法 ---

  /**
   * 解析使用者訊息 (核心功能)
   */
  async parseMessage(
    userMessage: string,
    customCategories?: string[],
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<ParsedMessage> {
    
    const systemPrompt = this.createSystemPrompt(customCategories, conversationHistory);

    // 使用 Few-Shot Prompting 提高準確度
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...FEW_SHOT_EXAMPLES,
      { role: 'user', content: userMessage },
    ];

    try {
      return await this.callOpenAIJSON(messages, ParsedMessageSchema, 'ParseMessage');
    } catch (error: any) {
      logger.warn('[OpenAI] ParseMessage 失敗，使用 fallback 解析', { error: error.message });
      return this.fallbackParsedMessage(userMessage);
    }
  }

  /**
   * 舊方法兼容：只解析支出
   * (建議在其他程式碼中逐漸改用 parseMessage)
   */
  async parseExpenseMessage(
    userMessage: string,
    customCategories?: string[],
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<ParsedExpense> {
    const result = await this.parseMessage(userMessage, customCategories, conversationHistory);

    if (result.intent !== 'expense' || result.amount <= 0) {
      throw new Error('無法從訊息中提取有效的支出金額');
    }

    return {
      category: result.category,
      detail: result.item || '未指定項目',
      amount: result.amount,
    };
  }

  /**
   * 生成一般回應
   */
  async generateResponse(
    userMessage: string,
    context?: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { 
        role: 'system', 
        content: '你是一個記帳小精靈。請用親切、簡短、有點可愛的語氣回覆使用者。' 
      }
    ];

    if (context) {
      messages.push({ role: 'system', content: `上下文資訊：\n${context}` });
    }

    // 加入歷史對話 (限制數量避免 token 過多)
    if (conversationHistory) {
      conversationHistory.slice(-4).forEach(msg => {
        messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
      });
    }

    messages.push({ role: 'user', content: userMessage });

    return this.callOpenAIText(messages);
  }

  /**
   * 產生毒舌警告
   */
  async generateSarcasticWarning(
    currentTotal: number,
    lastMonthTotal: number,
    difference: number,
    percentage: number
  ): Promise<string> {
    const prompt = `
    本月目前花費：$${currentTotal}
    上月同期花費：$${lastMonthTotal}
    差額：+$${difference} (+${percentage.toFixed(1)}%)
    
    任務：請用「毒舌、幽默、損友」的語氣警告使用者花太多了。
    限制：30字以內，要一針見血。
    範例：
    - "你是想吃土嗎？這花費速度是坐火箭吧！🚀"
    - "錢包在哭泣，你聽到了嗎？再買就要剁手了！💸"
    `;

    return this.callOpenAIText([{ role: 'user', content: prompt }], 0.8, 100);
  }

  /**
   * 解析更正指令
   */
  async parseUpdateCommand(
    userMessage: string,
    recentExpenses: Array<{
      _id: string;
      category: string;
      detail: string;
      amount: number;
      timestamp: Date;
    }>,
    conversationHistory?: Array<{ role: string; content: string }>
  ) {
    // 1. 準備最近紀錄的清單字串
    const expensesList = recentExpenses.slice(0, 5).map((e, i) => {
        const dateStr = new Date(e.timestamp).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
        return `${i + 1}. [${e.category}] ${e.detail} $${e.amount} (${dateStr})`;
    }).join('\n');

    const prompt = `
    使用者想要修改記帳紀錄。
    
    最近 5 筆紀錄：
    ${expensesList}

    使用者指令："${userMessage}"

    請分析指令並回傳 JSON：
    {
      "targetIndex": 數字 (1-5, 對應清單序號, 若無法確定則 null),
      "targetId": 字串 (對應的紀錄ID, 此欄位由後端處理，AI回傳 null 即可),
      "newAmount": 數字 (若無修改則 null),
      "newDetail": 字串 (新項目名稱, 若無修改則 null),
      "newCategory": 字串 (新類別, 若無修改則 null),
      "error": 字串 (若指令模糊無法判斷，請說明原因，否則 null)
    }
    `;

    // 定義回應的 Schema
    const UpdateSchema = z.object({
      targetIndex: z.number().nullable(),
      targetId: z.string().nullable().optional(),
      newAmount: z.number().nullable(),
      newDetail: z.string().nullable(),
      newCategory: z.string().nullable(),
      error: z.string().nullable(),
      candidates: z.array(z.number()).nullable().optional(),
    });

    const parsed = await this.callOpenAIJSON([{ role: 'user', content: prompt }], UpdateSchema, 'UpdateCommand');

    // 2. 後處理：將 Index 轉為真實 ID
    if (parsed.targetIndex !== null) {
      const idx = parsed.targetIndex - 1;
      if (idx >= 0 && idx < recentExpenses.length) {
        parsed.targetId = recentExpenses[idx]._id.toString();
      }
    }

    return parsed;
  }

  /**
   * Fallback：當 OpenAI 無回應時的簡易解析
   */
  private fallbackParsedMessage(userMessage: string): ParsedMessage {
    const amountMatch = userMessage.match(/(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? Number(amountMatch[0]) : 0;
    const cleaned = userMessage.replace(/(\d+(?:\.\d+)?)/, '').trim();

    const incomeKeywords = ['收入', '薪水', '薪資', '匯款', '轉帳', 'bonus', '獎金', '發薪', '領錢'];
    const isIncome = incomeKeywords.some((keyword) => cleaned.includes(keyword));

    if (amount === 0) {
      return {
        intent: 'chat',
        item: '',
        amount: 0,
        category: '其他',
        reply: '👋 需要我幫你記帳或查詢統計嗎？可以試著輸入「午餐 120」。',
      };
    }

    if (isIncome) {
      return {
        intent: 'income',
        item: cleaned || '收入',
        amount,
        category: '薪資',
        reply: `💰 已記錄收入：$${amount}`,
      };
    }

    return {
      intent: 'expense',
      item: cleaned || '未指定項目',
      amount,
      category: cleaned.includes('咖啡') || cleaned.includes('茶') || cleaned.includes('飲料') ? '飲品' : '其他',
      reply: `✅ 已記錄：${cleaned || '支出'} $${amount}`,
    };
  }
}

export default new OpenAIService();