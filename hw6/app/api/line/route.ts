import { NextRequest, NextResponse } from 'next/server';
import { Client, WebhookEvent, TextEventMessage, QuickReplyItem } from '@line/bot-sdk';
import crypto from 'crypto';
import connectDB from '@/lib/db/mongodb';
import messageParser from '@/lib/services/messageParser';
import expenseService from '@/lib/services/expenseService';
import lineService from '@/lib/services/lineService';
import openaiService from '@/lib/services/openaiService';
import userRepository from '@/lib/repositories/userRepository';
import conversationRepository from '@/lib/repositories/conversationRepository';
import logger from '@/lib/services/logger';

// 設定 runtime 為 nodejs（確保在 Node.js 環境運行）
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

function parseDetailRequest(message: string): { year: number; month: number; label: string } | null {
  const normalized = message.trim();
  if (!/(細項|細目|明細|列表)/.test(normalized)) {
    return null;
  }

  const now = new Date();
  let targetYear = now.getFullYear();
  let targetMonth = now.getMonth() + 1;

  if (/上(個)?月/.test(normalized)) {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    targetYear = lastMonth.getFullYear();
    targetMonth = lastMonth.getMonth() + 1;
  } else if (/這(個)?月|本月/.test(normalized)) {
    // already default to current month
  } else {
    const match = normalized.match(/(\d{4})[\/\-年\.](\d{1,2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      if (year > 0 && month >= 1 && month <= 12) {
        targetYear = year;
        targetMonth = month;
      }
    }
  }

  const label = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
  return { year: targetYear, month: targetMonth, label };
}

function parseDeleteCommand(
  message: string
): { keyword?: string; index?: number } | null {
  const match = message.trim().match(/^刪除(.+)$/);
  if (!match) {
    return null;
  }
  const content = match[1].trim();
  if (!content) {
    return null;
  }

  const indexMatch = content.match(/第?(\d+)(?:筆|條)?/);
  if (indexMatch) {
    const index = parseInt(indexMatch[1], 10);
    if (index > 0) {
      return { index };
    }
  }

  return { keyword: content };
}

function parseUpdateCommand(
  message: string
): {
  keyword?: string;
  index?: number;
  newDetail?: string;
  newAmount?: number;
} | null {
  const match = message.trim().match(/^(修改|更改|更新)(.+)$/);
  if (!match) {
    return null;
  }
  let content = match[2].trim();
  if (!content) {
    return null;
  }

  const indexMatch = content.match(/第?(\d+)(?:筆|條)?/);
  let index: number | undefined;
  if (indexMatch) {
    index = parseInt(indexMatch[1], 10);
    content = content.replace(indexMatch[0], '').trim();
  }

  let newAmount: number | undefined;
  const amountMatch = content.match(/(\d+)(?!.*\d)/);
  if (amountMatch) {
    newAmount = parseInt(amountMatch[1], 10);
    content = content.replace(amountMatch[1], '').trim();
  }

  const keyword = content.trim();
  if (!keyword && index === undefined && newAmount === undefined) {
    return null;
  }

  return {
    keyword: keyword || undefined,
    index,
    newDetail: content || undefined,
    newAmount,
  };
}

// 驗證簽名
function validateSignature(body: string, signature: string): boolean {
  if (!channelSecret) {
    logger.error('LINE_CHANNEL_SECRET 未設定');
    return false;
  }

  if (!signature) {
    logger.warn('簽名不存在');
    return false;
  }

  try {
    const hash = crypto
      .createHmac('sha256', channelSecret)
      .update(body, 'utf8')
      .digest('base64');
    
    const isValid = hash === signature;
    
    if (!isValid) {
      logger.warn('簽名驗證失敗', {
        expected: hash,
        received: signature,
        channelSecretLength: channelSecret.length,
      });
    }
    
    return isValid;
  } catch (error: any) {
    logger.error('簽名驗證過程出錯', { error: error.message });
    return false;
  }
}

// 處理 webhook 事件
async function handleEvent(event: WebhookEvent): Promise<void> {
  // 處理 follow 事件（使用者加入好友）
  if (event.type === 'follow') {
    const userId = (event.source as any).userId;
    if (userId) {
      try {
        await connectDB();
        // 將使用者綁定預設 Rich Menu（需在環境變數中設定 LINE_DEFAULT_RICH_MENU_ID）
        await lineService.linkDefaultRichMenu(userId);
        logger.info('使用者加入好友', { userId });
      } catch (error: any) {
        logger.error('處理 follow 事件失敗', { error: error.message, userId });
      }
    }
    return;
  }

  // 處理 postback 事件（Rich Menu 按鈕點擊）
  if (event.type === 'postback') {
    const userId = (event.source as any).userId;
    const replyToken = (event as any).replyToken;
    const data = (event as any).postback.data;

    if (!userId || !replyToken) {
      return;
    }

    try {
      await connectDB();

      // 解析 postback data
      const params = new URLSearchParams(data);
      const action = params.get('action');

      if (action === 'help') {
        // 使用說明
        const helpText = lineService.getHelpMessage();
        await lineService.replyTextMessage(replyToken, helpText);
        return;
      } else if (action === 'monthly_expense') {
        // 每月開銷 - 顯示月份選擇器
        await lineService.replyMonthSelector(replyToken);
        return;
      } else if (action === 'current_month_stats') {
        // 本月統計
        const now = new Date();
        const statistics = await expenseService.getMonthlyStatistics(
          userId,
          now.getFullYear(),
          now.getMonth() + 1
        );
        await lineService.replyStatisticsWithChart(replyToken, statistics);
        return;
      } else if (action === 'today_expenses') {
        // 今日記錄
        const expenses = await expenseService.getTodayExpenses(userId);
        await lineService.replyExpenseList(replyToken, expenses);
        return;
      } else if (action === 'select_year') {
        // 選擇年份後，顯示月份選擇
        const year = parseInt(params.get('year') || '0', 10);
        if (year > 0) {
          const monthItems: QuickReplyItem[] = [];
          for (let month = 1; month <= 12; month++) {
            monthItems.push({
              type: 'action',
              action: {
                type: 'postback',
                label: `${month}月`,
                data: `action=select_month&year=${year}&month=${month}`,
              },
            });
          }
          await lineService.replyWithQuickReply(
            replyToken,
            `請選擇 ${year} 年的月份：`,
            monthItems
          );
        }
        return;
      } else if (action === 'select_month') {
        // 選擇月份後，顯示該月統計
        const year = parseInt(params.get('year') || '0', 10);
        const month = parseInt(params.get('month') || '0', 10);
        if (year > 0 && month > 0) {
          const statistics = await expenseService.getMonthlyStatistics(
            userId,
            year,
            month
          );
          await lineService.replyStatisticsWithChart(replyToken, statistics);
        }
        return;
      }
    } catch (error: any) {
      logger.error('處理 postback 事件失敗', { error: error.message, userId, data });
      try {
        await lineService.replyError(replyToken, '處理請求時發生錯誤');
      } catch (replyError: any) {
        logger.error('回覆錯誤訊息失敗', { error: replyError.message });
      }
    }
    return;
  }

  // 處理文字訊息
  if (event.type !== 'message' || event.message.type !== 'text') {
    return;
  }

  const textEvent = event as WebhookEvent & {
    message: TextEventMessage;
    source: { userId: string; type: string };
    replyToken: string;
  };

  const userId = textEvent.source.userId;
  const userMessage = textEvent.message.text;
  const replyToken = textEvent.replyToken;

  if (!userId) {
    logger.warn('無法取得使用者 ID', { event });
    return;
  }

  try {
    // 連接資料庫
    await connectDB();

    // 取得或建立使用者
    const userProfile = await lineService.getUserProfile(userId);
    await userRepository.createOrUpdate({
      lineUserId: userId,
      displayName: userProfile?.displayName,
    });

    // 儲存使用者訊息到對話記錄
    await conversationRepository.addMessage(userId, {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    // 判斷是否為細項查詢
    const detailRequest = parseDetailRequest(userMessage);
    if (detailRequest) {
      const expenses = await expenseService.getMonthlyExpenses(
        userId,
        detailRequest.year,
        detailRequest.month
      );
      await lineService.replyExpenseDetails(replyToken, expenses, {
        periodLabel: detailRequest.label,
      });
      await conversationRepository.addMessage(userId, {
        role: 'assistant',
        content: `已回覆 ${detailRequest.label} 的花費細項`,
        timestamp: new Date(),
      });
      return;
    }

    // 判斷是否為刪除指令
    const deleteCommand = parseDeleteCommand(userMessage);
    if (deleteCommand) {
      const recentExpenses = await expenseService.getUserExpenses(userId, 50, 0);
      let target;
      if (deleteCommand.index !== undefined) {
        const idx = deleteCommand.index - 1;
        if (idx >= 0 && idx < recentExpenses.length) {
          target = recentExpenses[idx];
        }
      } else if (deleteCommand.keyword) {
        target = recentExpenses.find(
          (expense) =>
            expense.detail?.includes(deleteCommand.keyword as string) ||
            expense.category?.includes(deleteCommand.keyword as string)
        );
      }

      if (!target) {
        await lineService.replyTextMessage(
          replyToken,
          deleteCommand.index
            ? `找不到第 ${deleteCommand.index} 筆記帳紀錄。請先輸入「花費細項」確認序號，再試一次。`
            : `找不到包含「${deleteCommand.keyword}」的記帳紀錄，請確認內容或輸入更精確的描述。`
        );
        await conversationRepository.addMessage(userId, {
          role: 'assistant',
          content: '刪除失敗：找不到符合的記帳紀錄',
          timestamp: new Date(),
        });
        return;
      }

      await expenseService.deleteExpense(target._id.toString());
      await lineService.replyTextMessage(
        replyToken,
        `🗑 已刪除「${target.detail}」$${target.amount}`
      );
      await conversationRepository.addMessage(userId, {
        role: 'assistant',
        content: `已刪除記錄「${target.detail}」`,
        timestamp: new Date(),
      });
      return;
    }

    // 判斷是否為修改指令
    const updateCommand = parseUpdateCommand(userMessage);
    if (updateCommand) {
      const recentExpenses = await expenseService.getUserExpenses(userId, 50, 0);
      let target;
      if (updateCommand.index !== undefined) {
        const idx = updateCommand.index - 1;
        if (idx >= 0 && idx < recentExpenses.length) {
          target = recentExpenses[idx];
        }
      } else if (updateCommand.keyword) {
        target = recentExpenses.find(
          (expense) =>
            expense.detail?.includes(updateCommand.keyword as string) ||
            expense.category?.includes(updateCommand.keyword as string)
        );
      }

      if (!target) {
        await lineService.replyTextMessage(
          replyToken,
          updateCommand.index
            ? `找不到第 ${updateCommand.index} 筆記帳紀錄。請先輸入「花費細項」確認序號，再試一次。`
            : '找不到需要修改的記帳紀錄，請提供更明確的描述（例如：修改午餐 120）。'
        );
        await conversationRepository.addMessage(userId, {
          role: 'assistant',
          content: '修改失敗：找不到符合的記帳紀錄',
          timestamp: new Date(),
        });
        return;
      }

      const payload: any = {};
      if (updateCommand.newAmount !== undefined) {
        payload.amount = updateCommand.newAmount;
      }
      if (updateCommand.newDetail) {
        payload.detail = updateCommand.newDetail;
      }
      if (Object.keys(payload).length === 0) {
        await lineService.replyTextMessage(
          replyToken,
          '請提供要修改的內容，例如「修改午餐 120」。'
        );
        return;
      }

      const updated = await expenseService.updateExpense(target._id.toString(), payload);
      await lineService.replyTextMessage(
        replyToken,
        `✏️ 已更新「${updated.detail}」，金額：$${updated.amount}`
      );
      await conversationRepository.addMessage(userId, {
        role: 'assistant',
        content: `已更新記錄「${updated.detail}」`,
        timestamp: new Date(),
      });
      return;
    }

    // 處理訊息：使用新的統一解析方法
    try {
      // 快速處理 Rich Menu 的 message 類型 action
      if (userMessage.trim() === '使用說明') {
        const helpText = lineService.getHelpMessage();
        await lineService.replyTextMessage(replyToken, helpText);
        await conversationRepository.addMessage(userId, {
          role: 'assistant',
          content: helpText,
          timestamp: new Date(),
        });
        return;
      }

      if (userMessage.trim() === '查詢統計') {
        const now = new Date();
        const statistics = await expenseService.getMonthlyStatistics(
          userId,
          now.getFullYear(),
          now.getMonth() + 1
        );
        await lineService.replyStatisticsWithChart(replyToken, statistics);
        await conversationRepository.addMessage(userId, {
          role: 'assistant',
          content: `本月統計：總計 $${statistics.total}`,
          timestamp: new Date(),
        });
        return;
      }

      // 效能優化：並行取得類別和對話歷史
      const [categories, latestConversation] = await Promise.all([
        expenseService.getUserCategories(userId),
        conversationRepository.findLatestByUserId(userId),
      ]);
      
      // 取得對話歷史作為上下文（只取最近 5 條以減少 token 使用）
      const conversationHistory = latestConversation?.messages
        .slice(-5) // 減少到 5 條以優化效能
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        })) || [];
      
      // 快速響應：先回覆確認訊息（對於簡單查詢）
      const quickResponses: Record<string, string> = {
        '這個月花多少': '正在查詢本月統計...',
        '上個月花多少': '正在查詢上月統計...',
        '這半年花多少': '正在查詢過去6個月統計...',
        '今年花多少': '正在查詢今年統計...',
      };
      
      const quickReply = quickResponses[userMessage.trim()];
      if (quickReply) {
        // 非同步發送確認訊息（不等待）
        lineService.replyTextMessage(replyToken, quickReply).catch((err: any) => {
          logger.error('發送快速確認訊息失敗', { error: err.message });
        });
      }
      
      // 使用新的統一解析方法
      const parsed = await openaiService.parseMessage(
        userMessage,
        categories,
        conversationHistory
      );

      // 根據意圖處理
      if (parsed.intent === 'expense') {
        // 記帳
        if (parsed.amount > 0) {
          await expenseService.createExpense({
            userId,
            category: parsed.category,
            detail: parsed.item || '未指定',
            amount: parsed.amount,
          });

          // 使用 LLM 生成的 reply 或自訂確認訊息
          const replyText = parsed.reply || `✅ 已記錄：${parsed.category} - ${parsed.item} $${parsed.amount}`;
          await lineService.replyTextMessage(replyToken, replyText);

          await conversationRepository.addMessage(userId, {
            role: 'assistant',
            content: replyText,
            timestamp: new Date(),
          });
        } else {
          // 金額為 0，可能是格式錯誤
          const errorReply = parsed.reply || '❌ 無法識別金額，請使用格式：項目 金額（如：午餐 50）';
          await lineService.replyTextMessage(replyToken, errorReply);
          
          await conversationRepository.addMessage(userId, {
            role: 'assistant',
            content: errorReply,
            timestamp: new Date(),
          });
        }
        return;
      } else if (parsed.intent === 'query') {
        // 查詢統計
        let statistics: any;
        let replyText = '';

        // 判斷查詢類型
        const message = userMessage.toLowerCase();
        
        if (message.includes('今天的記錄') || message.includes('今日記錄') || message.includes('今天')) {
          // 查詢今日記錄
          const expenses = await expenseService.getTodayExpenses(userId);
          await lineService.replyExpenseList(replyToken, expenses);
          
          await conversationRepository.addMessage(userId, {
            role: 'assistant',
            content: `今日記錄：共 ${expenses.length} 筆`,
            timestamp: new Date(),
          });
          return;
        } else if (message.includes('上個月') || message.includes('上个月')) {
          // 查詢上個月統計
          statistics = await expenseService.getLastMonthStatistics(userId);
          replyText = `上個月統計：總計 $${statistics.total}`;
        } else if (message.includes('這半年') || message.includes('这半年') || message.includes('半年')) {
          // 查詢這半年統計
          statistics = await expenseService.getHalfYearStatistics(userId);
          replyText = `過去6個月統計：總計 $${statistics.total}`;
        } else if (message.includes('今年') || message.includes('這年') || message.includes('这年')) {
          // 查詢今年統計
          statistics = await expenseService.getYearStatistics(userId);
          replyText = `${statistics.month}統計：總計 $${statistics.total}`;
        } else {
          // 預設：查詢本月統計
          const now = new Date();
          
          // 效能優化：並行查詢本月統計和月份比較
          const [monthStats, comparison] = await Promise.all([
            expenseService.getMonthlyStatistics(
              userId,
              now.getFullYear(),
              now.getMonth() + 1
            ),
            expenseService.compareMonthlyExpenses(userId).catch(() => null),
          ]);
          
          statistics = monthStats;
          replyText = `本月統計：總計 $${statistics.total}`;

          // 毒舌警告：比較本月與上月花費
          if (comparison && comparison.isIncreased && comparison.percentage > 10) {
            try {
              // 非同步產生警告訊息（不阻塞主要回應）
              openaiService.generateSarcasticWarning(
                comparison.currentMonth.total,
                comparison.lastMonth.total,
                comparison.difference,
                comparison.percentage
              ).then((warningMessage) => {
                // 使用 pushMessage 發送警告（因為 replyToken 已使用）
                lineService.pushMessage(userId, {
                  type: 'text',
                  text: `⚠️ ${warningMessage}`,
                }).catch((err: any) => {
                  logger.error('發送毒舌警告失敗', { error: err.message });
                });
              }).catch((err: any) => {
                logger.warn('產生毒舌警告失敗', { error: err.message });
              });
            } catch (error: any) {
              logger.warn('比較月份花費失敗，跳過毒舌警告', { error: error.message });
            }
          }
        }

        // 回覆統計結果（使用帶圓餅圖的版本）
        await lineService.replyStatisticsWithChart(replyToken, statistics);
        
        await conversationRepository.addMessage(userId, {
          role: 'assistant',
          content: replyText,
          timestamp: new Date(),
        });
        return;
      } else {
        // chat 或其他：使用 LLM 生成的 reply
        // 但先檢查是否為新增項目類別的特殊指令
        if (messageParser.isAddCategoryMessage(userMessage)) {
          const categoryName = messageParser.extractCategoryName(userMessage);
          if (categoryName) {
            await expenseService.addCustomCategory(userId, categoryName);
            const replyText = `✅ 已新增項目類別：${categoryName}`;
            await lineService.replyTextMessage(replyToken, replyText);
            
            await conversationRepository.addMessage(userId, {
              role: 'assistant',
              content: replyText,
              timestamp: new Date(),
            });
            return;
          }
        }

        // 使用 LLM 生成的 reply
        const replyText = parsed.reply || '👋 我是記帳小精靈！可以幫你記錄支出、查詢統計等。';
        await lineService.replyTextMessage(replyToken, replyText);
        
        await conversationRepository.addMessage(userId, {
          role: 'assistant',
          content: replyText,
          timestamp: new Date(),
        });
        return;
      }
    } catch (error: any) {
      logger.error('處理訊息失敗', { error: error.message, userId, userMessage });
      
      // 降級處理：嘗試使用舊的解析方法
      try {
        if (messageParser.isExpenseMessage(userMessage)) {
          const categories = await expenseService.getUserCategories(userId);
          const parsed = await messageParser.parseExpenseMessage(userMessage, categories);
          
          await expenseService.createExpense({
            userId,
            category: parsed.category,
            detail: parsed.detail,
            amount: parsed.amount,
          });

          await lineService.replyExpenseConfirmation(
            replyToken,
            parsed.category,
            parsed.detail,
            parsed.amount
          );

          await conversationRepository.addMessage(userId, {
            role: 'assistant',
            content: `已記錄：${parsed.category} - ${parsed.detail} $${parsed.amount}`,
            timestamp: new Date(),
          });
          return;
        }
      } catch (fallbackError: any) {
        logger.error('降級處理也失敗', { error: fallbackError.message });
      }

      // 最終降級：回覆錯誤訊息
      await lineService.replyError(replyToken, error.message || '服務暫時無法使用，請稍後再試');
      
      await conversationRepository.addMessage(userId, {
        role: 'assistant',
        content: `錯誤：${error.message || '服務暫時無法使用'}`,
        timestamp: new Date(),
      });
    }
  } catch (error: any) {
    logger.error('處理 webhook 事件失敗', {
      error: error.message,
      userId,
      userMessage,
    });

    try {
      await lineService.replyError(
        replyToken,
        '服務暫時無法使用，請稍後再試'
      );
    } catch (replyError: any) {
      logger.error('回覆錯誤訊息失敗', { error: replyError.message });
    }
  }
}

// POST handler
export async function POST(request: NextRequest): Promise<Response> {
  try {
    logger.info('收到 LINE webhook 請求');

    // 檢查環境變數
    if (!channelSecret) {
      logger.error('LINE_CHANNEL_SECRET 環境變數未設定');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get('x-line-signature');

    if (!signature) {
      logger.warn('缺少 x-line-signature 標頭');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // 驗證簽名
    if (!validateSignature(body, signature)) {
      logger.warn('Webhook 簽名驗證失敗', {
        hasBody: !!body,
        bodyLength: body.length,
        hasSignature: !!signature,
      });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 解析事件
    let events: WebhookEvent[] = [];
    try {
      const parsed = JSON.parse(body);
      events = parsed.events || [];
      
      if (events.length === 0) {
        logger.info('收到空事件列表');
        return new Response('OK', { status: 200 });
      }

      logger.info('收到 LINE webhook 事件', { eventCount: events.length, eventType: events[0]?.type });
    } catch (parseError: any) {
      logger.error('解析 JSON 失敗', { error: parseError.message, body: body.substring(0, 200) });
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    // 處理所有事件
    await Promise.all(events.map(handleEvent));

    logger.info('處理 LINE webhook 事件完成');
    return new Response('OK', { status: 200 });
  } catch (error: any) {
    logger.error('Webhook 處理失敗', { 
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET handler (用於 webhook 驗證)
export async function GET(): Promise<Response> {
  return new Response('LINE bot webhook endpoint', { status: 200 });
}

// OPTIONS handler (用於 CORS preflight)
export async function OPTIONS(): Promise<Response> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-line-signature',
    },
  });
}


