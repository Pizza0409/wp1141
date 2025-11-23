import { NextRequest, NextResponse } from 'next/server';
import { Client, WebhookEvent, TextEventMessage } from '@line/bot-sdk';
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

    // 處理訊息：使用新的統一解析方法
    try {
      const categories = await expenseService.getUserCategories(userId);
      
      // 取得對話歷史作為上下文
      const latestConversation = await conversationRepository.findLatestByUserId(userId);
      const conversationHistory = latestConversation?.messages
        .slice(-10) // 只取最近 10 條訊息
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        })) || [];
      
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
          statistics = await expenseService.getMonthlyStatistics(
            userId,
            now.getFullYear(),
            now.getMonth() + 1
          );
          replyText = `本月統計：總計 $${statistics.total}`;
        }

        // 回覆統計結果
        await lineService.replyStatistics(replyToken, statistics);
        
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

