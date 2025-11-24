import { Client, Message, TextMessage, QuickReply, QuickReplyItem, FlexMessage, FlexBubble, FlexBox, FlexText, FlexSeparator } from '@line/bot-sdk';
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
   * 回傳統計訊息（帶圓餅圖）
   */
  async replyStatisticsWithChart(
    replyToken: string,
    statistics: MonthlyStatistics
  ): Promise<void> {
    try {
      // 按金額排序類別
      const sortedCategories = Object.entries(statistics.byCategory).sort(
        (a, b) => b[1] - a[1]
      );

      if (sortedCategories.length === 0) {
        await this.replyTextMessage(replyToken, `📊 ${statistics.month} 統計\n\n總計：$${statistics.total}\n\n本月尚無記錄`);
        return;
      }

      // 建立 Flex Message 的內容
      const bodyContents: any[] = [
        {
          type: 'text',
          text: `📊 ${statistics.month} 統計`,
          weight: 'bold',
          size: 'xl',
          color: '#1DB446',
        },
        {
          type: 'separator',
          margin: 'md',
        },
        {
          type: 'text',
          text: `總計：$${statistics.total.toLocaleString()}`,
          weight: 'bold',
          size: 'xxl',
          margin: 'md',
        },
      ];

      // 添加各類別的花費（使用進度條模擬圓餅圖效果）
      sortedCategories.forEach(([category, amount]) => {
        const percentage = statistics.total > 0
          ? (amount / statistics.total) * 100
          : 0;
        
        // 計算進度條長度（最大寬度為 100%）
        const barWidth = Math.max(5, Math.min(100, percentage));

        bodyContents.push(
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: category,
                    size: 'sm',
                    color: '#555555',
                    flex: 0,
                  },
                  {
                    type: 'text',
                    text: `$${amount.toLocaleString()}`,
                    size: 'sm',
                    color: '#111111',
                    align: 'end',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'vertical',
                margin: 'sm',
                contents: [
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'box',
                        layout: 'vertical',
                        contents: [],
                        width: `${barWidth}%`,
                        backgroundColor: '#1DB446',
                        height: '8px',
                        cornerRadius: '4px',
                      },
                      {
                        type: 'box',
                        layout: 'vertical',
                        contents: [],
                        width: `${100 - barWidth}%`,
                        backgroundColor: '#E5E5E5',
                        height: '8px',
                        cornerRadius: '4px',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'text',
                text: `${percentage.toFixed(1)}%`,
                size: 'xs',
                color: '#888888',
                align: 'end',
                margin: 'sm',
              },
            ],
          }
        );
      });

      const bubble: FlexBubble = {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: bodyContents,
          paddingAll: '20px',
        },
      };

      const flexMessage: FlexMessage = {
        type: 'flex',
        altText: `${statistics.month} 統計：總計 $${statistics.total}`,
        contents: bubble,
      };

      await client.replyMessage(replyToken, flexMessage);
      logger.info('成功回覆統計（帶圓餅圖）', { replyToken });
    } catch (error: any) {
      logger.error('回覆統計（帶圓餅圖）失敗，降級為文字訊息', {
        error: error.message,
        replyToken,
      });
      // 降級為文字訊息
      await this.replyStatistics(replyToken, statistics);
    }
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

  /**
   * 建立 Rich Menu
   */
  async createRichMenu(): Promise<string> {
    try {
      const richMenu = {
        size: {
          width: 2500,
          height: 1686,
        },
        selected: true,
        name: '記帳機器人選單',
        chatBarText: '選單',
        areas: [
          {
            bounds: {
              x: 0,
              y: 0,
              width: 625,
              height: 843,
            },
            action: {
              type: 'postback' as const,
              label: '使用說明',
              data: 'action=help',
            },
          },
          {
            bounds: {
              x: 625,
              y: 0,
              width: 625,
              height: 843,
            },
            action: {
              type: 'postback' as const,
              label: '每月開銷',
              data: 'action=monthly_expense',
            },
          },
          {
            bounds: {
              x: 1250,
              y: 0,
              width: 625,
              height: 843,
            },
            action: {
              type: 'postback' as const,
              label: '本月統計',
              data: 'action=current_month_stats',
            },
          },
          {
            bounds: {
              x: 1875,
              y: 0,
              width: 625,
              height: 843,
            },
            action: {
              type: 'postback' as const,
              label: '今日記錄',
              data: 'action=today_expenses',
            },
          },
        ],
      };

      const richMenuId = await client.createRichMenu(richMenu);
      logger.info('成功建立 Rich Menu', { richMenuId });
      return richMenuId;
    } catch (error: any) {
      logger.error('建立 Rich Menu 失敗', { error: error.message });
      throw error;
    }
  }

  /**
   * 設定 Rich Menu 圖片（需要先上傳圖片）
   */
  async setRichMenuImage(richMenuId: string, imageBuffer: Buffer): Promise<void> {
    try {
      await client.setRichMenuImage(richMenuId, imageBuffer);
      logger.info('成功設定 Rich Menu 圖片', { richMenuId });
    } catch (error: any) {
      logger.error('設定 Rich Menu 圖片失敗', { error: error.message, richMenuId });
      throw error;
    }
  }

  /**
   * 設定 Rich Menu 給使用者
   */
  async setRichMenuToUser(userId: string, richMenuId: string): Promise<void> {
    try {
      await client.linkRichMenuToUser(userId, richMenuId);
      logger.info('成功設定 Rich Menu 給使用者', { userId, richMenuId });
    } catch (error: any) {
      logger.error('設定 Rich Menu 給使用者失敗', { error: error.message, userId, richMenuId });
      throw error;
    }
  }

  /**
   * 設定預設 Rich Menu（給所有使用者）
   */
  async setDefaultRichMenu(richMenuId: string): Promise<void> {
    try {
      await client.setDefaultRichMenu(richMenuId);
      logger.info('成功設定預設 Rich Menu', { richMenuId });
    } catch (error: any) {
      logger.error('設定預設 Rich Menu 失敗', { error: error.message, richMenuId });
      throw error;
    }
  }

  /**
   * 刪除 Rich Menu
   */
  async deleteRichMenu(richMenuId: string): Promise<void> {
    try {
      await client.deleteRichMenu(richMenuId);
      logger.info('成功刪除 Rich Menu', { richMenuId });
    } catch (error: any) {
      logger.error('刪除 Rich Menu 失敗', { error: error.message, richMenuId });
      throw error;
    }
  }

  /**
   * 取得使用說明文字
   */
  getHelpMessage(): string {
    return `📖 記帳機器人使用說明

【基本功能】
1. 記帳：直接輸入「項目 金額」
   範例：午餐 100、咖啡 50

2. 查詢統計：
   • 「這個月花多少」- 查詢本月統計
   • 「上個月花多少」- 查詢上月統計
   • 「這半年花多少」- 查詢過去6個月
   • 「今年花多少」- 查詢今年統計

3. 今日記錄：查看今天的記帳記錄

【使用技巧】
• 可以說「午餐 100」或「今天午餐 100」
• 系統會自動分類（餐點、交通、娛樂等）
• 支援自然語言對話

開始記帳吧！💪`;
  }

  /**
   * 回覆月份選擇器
   */
  async replyMonthSelector(replyToken: string): Promise<void> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 建立年份和月份的快速回覆選項
    const yearItems: QuickReplyItem[] = [];
    for (let year = currentYear; year >= currentYear - 2; year--) {
      yearItems.push({
        type: 'action',
        action: {
          type: 'postback',
          label: `${year}年`,
          data: `action=select_year&year=${year}`,
        },
      });
    }

    await this.replyWithQuickReply(
      replyToken,
      '請選擇要查詢的年份：',
      yearItems
    );
  }
}

export default new LineService();


