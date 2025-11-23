import openaiService from './openaiService';
import logger from './logger';
import { ParsedExpense } from '@/types';

export class MessageParserService {
  /**
   * 判斷訊息是否為記帳指令
   */
  isExpenseMessage(message: string): boolean {
    // 簡單的啟發式規則：包含數字且看起來像是記帳
    const hasNumber = /\d+/.test(message);
    const expenseKeywords = [
      '元',
      '塊',
      '花',
      '買',
      '付',
      '餐',
      '吃',
      '喝',
      '用',
    ];
    const hasKeyword = expenseKeywords.some((keyword) =>
      message.includes(keyword)
    );

    // 如果包含數字且長度適中（可能是記帳），或包含關鍵字
    return (hasNumber && message.length < 50) || hasKeyword;
  }

  /**
   * 判斷是否為查詢統計指令
   */
  isStatisticsQuery(message: string): boolean {
    const statsKeywords = [
      '統計',
      '總計',
      '花了',
      '花費',
      '開銷',
      '這個月',
      '上個月',
      '記錄',
      '查看',
    ];
    return statsKeywords.some((keyword) => message.includes(keyword));
  }

  /**
   * 判斷是否為新增項目指令
   */
  isAddCategoryMessage(message: string): boolean {
    const addKeywords = ['新增項目', '新增類別', '加入項目', '加入類別'];
    return addKeywords.some((keyword) => message.includes(keyword));
  }

  /**
   * 從新增項目訊息中提取類別名稱
   */
  extractCategoryName(message: string): string | null {
    const patterns = [
      /新增項目[：:]\s*(.+)/,
      /新增類別[：:]\s*(.+)/,
      /加入項目[：:]\s*(.+)/,
      /加入類別[：:]\s*(.+)/,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * 使用 LLM 解析記帳訊息
   */
  async parseExpenseMessage(
    message: string,
    customCategories?: string[],
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<ParsedExpense> {
    try {
      logger.info('開始解析記帳訊息', { message });
      const parsed = await openaiService.parseExpenseMessage(
        message,
        customCategories,
        conversationHistory
      );
      logger.info('成功解析記帳訊息', { parsed });
      return parsed;
    } catch (error: any) {
      logger.error('解析記帳訊息失敗', {
        error: error.message,
        message,
      });

      // 優雅降級：嘗試簡單的規則解析
      return this.fallbackParse(message);
    }
  }

  /**
   * 降級解析：當 LLM 失敗時使用簡單規則
   */
  private fallbackParse(message: string): ParsedExpense {
    logger.warn('使用降級解析', { message });

    // 提取金額
    const amountMatch = message.match(/(\d+)/);
    const amount = amountMatch ? parseInt(amountMatch[1], 10) : 0;

    // 提取類別（簡單關鍵字匹配）
    const categoryMap: Record<string, string> = {
      餐: '餐點',
      吃: '餐點',
      午餐: '餐點',
      晚餐: '餐點',
      早餐: '餐點',
      運動: '運動',
      健身: '運動',
      飲: '飲品',
      喝: '飲品',
      咖啡: '飲品',
      茶: '飲品',
      生活: '生活用品',
      用品: '生活用品',
      3c: '3C',
      手機: '3C',
      電腦: '3C',
      美妝: '美妝保養',
      保養: '美妝保養',
      訂閱: '網路訂閱',
      交通: '交通',
      車: '交通',
    };

    let category = '其他';
    let detail = message;

    for (const [keyword, cat] of Object.entries(categoryMap)) {
      if (message.includes(keyword)) {
        category = cat;
        detail = message.replace(/\d+/g, '').trim();
        break;
      }
    }

    if (amount === 0) {
      throw new Error('無法從訊息中提取金額，請使用格式：項目 金額（如：午餐 50）');
    }

    return {
      category,
      detail: detail || '未指定',
      amount,
    };
  }
}

export default new MessageParserService();


