import { Client, Message, TextMessage, QuickReply, QuickReplyItem } from '@line/bot-sdk';
import logger from './logger';
import { MonthlyStatistics } from '@/types';

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
});

export class LineService {
  /**
   * 回覆文字訊息
   */
  async replyTextMessage(replyToken: string, text: string): Promise<void> {
    try {
      await client.replyMessage(replyToken, {
        type: 'text',
        text,
      });
      logger.info('成功回覆 Line 訊息', { replyToken });
    } catch (error: any) {
      logger.error('回覆 Line 訊息失敗', {
        error: error.message,
        replyToken,
      });
      throw error;
    }
  }

  /**
   * 回覆確認記帳訊息
   */
  async replyExpenseConfirmation(
    replyToken: string,
    category: string,
    detail: string,
    amount: number
  ): Promise<void> {
    const message: TextMessage = {
      type: 'text',
      text: `✅ 已記錄\n\n項目：${category}\n細節：${detail}\n金額：$${amount}`,
    };

    await client.replyMessage(replyToken, message);
  }

  /**
   * 回傳統計訊息
   */
  async replyStatistics(
    replyToken: string,
    statistics: MonthlyStatistics
  ): Promise<void> {
    let text = `📊 ${statistics.month} 統計\n\n總計：$${statistics.total}\n\n`;

    // 按金額排序類別
    const sortedCategories = Object.entries(statistics.byCategory).sort(
      (a, b) => b[1] - a[1]
    );

    if (sortedCategories.length === 0) {
      text += '本月尚無記錄';
    } else {
      text += '各項目花費：\n';
      sortedCategories.forEach(([category, amount]) => {
        const percentage = statistics.total > 0
          ? ((amount / statistics.total) * 100).toFixed(1)
          : '0.0';
        text += `• ${category}：$${amount} (${percentage}%)\n`;
      });
    }

    await this.replyTextMessage(replyToken, text);
  }

  /**
   * 回覆記錄列表
   */
  async replyExpenseList(
    replyToken: string,
    expenses: Array<{ category: string; detail: string; amount: number; timestamp: Date }>
  ): Promise<void> {
    if (expenses.length === 0) {
      await this.replyTextMessage(replyToken, '📝 目前沒有記錄');
      return;
    }

    let text = `📝 記錄列表（共 ${expenses.length} 筆）\n\n`;

    expenses.slice(0, 10).forEach((expense, index) => {
      const date = new Date(expense.timestamp);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      text += `${index + 1}. ${expense.category} - ${expense.detail}\n   $${expense.amount} (${dateStr})\n\n`;
    });

    if (expenses.length > 10) {
      text += `... 還有 ${expenses.length - 10} 筆記錄`;
    }

    await this.replyTextMessage(replyToken, text);
  }

  /**
   * 回覆錯誤訊息
   */
  async replyError(
    replyToken: string,
    errorMessage: string
  ): Promise<void> {
    const friendlyMessages: Record<string, string> = {
      'API 配額已用完或達到速率限制': '⚠️ 服務暫時忙碌中，請稍後再試',
      'API 配額不足': '⚠️ 服務配額不足，請稍後再試',
      '無法從訊息中提取金額': '❌ 無法解析金額，請使用格式：項目 金額（如：午餐 50）',
      '輸入資料格式錯誤': '❌ 輸入格式錯誤，請檢查後重試',
    };

    const message =
      friendlyMessages[errorMessage] ||
      `❌ 發生錯誤：${errorMessage}\n\n請使用格式：項目 金額（如：午餐 50）`;

    await this.replyTextMessage(replyToken, message);
  }

  /**
   * 回覆快速回覆選項
   */
  async replyWithQuickReply(
    replyToken: string,
    text: string,
    items: QuickReplyItem[]
  ): Promise<void> {
    const quickReply: QuickReply = {
      items,
    };

    const message: TextMessage = {
      type: 'text',
      text,
      quickReply,
    };

    await client.replyMessage(replyToken, message);
  }

  /**
   * 取得使用者資訊
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      const profile = await client.getProfile(userId);
      return profile;
    } catch (error: any) {
      logger.error('取得使用者資訊失敗', { error: error.message, userId });
      return null;
    }
  }

  /**
   * 推送訊息（主動發送）
   */
  async pushMessage(userId: string, message: Message): Promise<void> {
    try {
      await client.pushMessage(userId, message);
      logger.info('成功推送訊息', { userId });
    } catch (error: any) {
      logger.error('推送訊息失敗', { error: error.message, userId });
      throw error;
    }
  }
}

export default new LineService();


