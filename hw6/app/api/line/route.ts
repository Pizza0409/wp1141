import { NextRequest, NextResponse } from 'next/server';
import { Client, WebhookEvent, TextEventMessage, QuickReplyItem } from '@line/bot-sdk';
import crypto from 'crypto';
import connectDB from '@/lib/db/mongodb';
import messageParser from '@/lib/services/messageParser';
import expenseService from '@/lib/services/expenseService';
import incomeService from '@/lib/services/incomeService';
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

function parseChineseNumber(text: string): number | null {
  const digitMap: Record<string, number> = {
    零: 0,
    一: 1,
    二: 2,
    兩: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };
  if (!text) {
    return null;
  }
  if (text === '十') {
    return 10;
  }
  if (text.includes('十')) {
    const [left, right] = text.split('十');
    const tens = left ? digitMap[left] ?? null : 1;
    if (tens === null) {
      return null;
    }
    const ones = right ? digitMap[right] ?? 0 : 0;
    return tens * 10 + ones;
  }
  if (text.length === 1 && digitMap[text] !== undefined) {
    return digitMap[text];
  }
  return null;
}

type DetailQuery = {
  category?: string;
  startDate: Date;
  endDate: Date;
  label: string;
};

type IncomePeriod =
  | {
      type: 'month';
      year: number;
      month: number;
      label?: string;
    }
  | {
      type: 'range';
      start: Date;
      end: Date;
      label: string;
    };

const TIME_KEYWORDS = [
  '今天',
  '今日',
  '昨天',
  '昨日',
  '前天',
  '這個月',
  '這月',
  '本月',
  '上個月',
  '上月',
  '今年',
  '本年',
  '去年',
  '前年',
  '今年度',
  '去年度',
  '這一年',
  '這年',
  '本年度',
];

const KNOWN_EXPENSE_CATEGORIES = new Set([
  '餐點',
  '飲品',
  '運動',
  '生活用品',
  '3C',
  '美妝保養',
  '網路訂閱',
  '交通',
  '娛樂',
  '醫療',
  '其他',
]);

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDateLabel(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createMonthRange(year: number, month: number): DetailQuery {
  const startDate = startOfDay(new Date(year, month - 1, 1));
  const endDate = endOfDay(new Date(year, month, 0));
  return {
    startDate,
    endDate,
    label: `${year}-${String(month).padStart(2, '0')}`,
  };
}

function createYearRange(year: number, includeFuture: boolean = true): DetailQuery {
  const startDate = startOfDay(new Date(year, 0, 1));
  const endDate = includeFuture && year === new Date().getFullYear()
    ? endOfDay(new Date())
    : endOfDay(new Date(year, 11, 31));
  return {
    startDate,
    endDate,
    label: `${year}年`,
  };
}

function createDayRange(year: number, month: number, day: number): DetailQuery {
  const target = new Date(year, month - 1, day);
  return {
    startDate: startOfDay(target),
    endDate: endOfDay(target),
    label: formatDateLabel(target),
  };
}

function extractCategoryKeyword(message: string): string | undefined {
  const categoryRegex = /(?:查看|看|查詢|查)?\s*([^\s的]+?)?(?:類別)?(?:細項|細目|明細|列表|記錄)/;
  const match = message.match(categoryRegex);
  if (!match || !match[1]) {
    return undefined;
  }

  let candidate = match[1]
    .replace(new RegExp(TIME_KEYWORDS.join('|'), 'g'), '')
    .replace(/\d{4}[\/\-年\.]\d{1,2}(?:[\/\-月\.]\d{1,2})?/g, '')
    .replace(/\d{1,2}[\/\-]\d{1,2}/g, '')
    .replace(/\d{1,2}月\d{0,2}日?/g, '')
    .replace(/(類別|花費|費用|消費|支出|明細|細項)/g, '')
    .replace(/[的、，,\s]+/g, '')
    .trim();

  if (!candidate || ['花費', '費用', '支出'].includes(candidate)) {
    return undefined;
  }

  return candidate;
}

function normalizeCategoryName(raw?: string): string | undefined {
  if (!raw) {
    return undefined;
  }

  const candidate = raw.replace(/(類別|類)$/g, '').trim();
  if (!candidate) {
    return undefined;
  }

  const aliasMap: Record<string, string> = {
    食: '餐點',
    餐: '餐點',
    餐飲: '餐點',
    餐點: '餐點',
    飲料: '飲品',
    飲品: '飲品',
    咖啡: '飲品',
    手搖: '飲品',
    交通: '交通',
    通勤: '交通',
    油錢: '交通',
    加油: '交通',
    生活用品: '生活用品',
    生活: '生活用品',
    娛樂: '娛樂',
    運動: '運動',
    醫療: '醫療',
    '3C': '3C',
    科技: '3C',
    網路訂閱: '網路訂閱',
    訂閱: '網路訂閱',
    美妝保養: '美妝保養',
    保養: '美妝保養',
    其他: '其他',
  };

  for (const [key, value] of Object.entries(aliasMap)) {
    if (candidate.includes(key)) {
      return value;
    }
  }

  return candidate;
}

function extractDateRange(message: string): DetailQuery | null {
  const now = new Date();

  if (/今天|今日/.test(message)) {
    return createDayRange(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  if (/昨天|昨日/.test(message)) {
    const target = new Date(now);
    target.setDate(now.getDate() - 1);
    return createDayRange(target.getFullYear(), target.getMonth() + 1, target.getDate());
  }

  if (/前天/.test(message)) {
    const target = new Date(now);
    target.setDate(now.getDate() - 2);
    return createDayRange(target.getFullYear(), target.getMonth() + 1, target.getDate());
  }

  let match = message.match(/(\d{4})[\/\-年\.](\d{1,2})[\/\-月\.](\d{1,2})(?:日|號)?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return createDayRange(year, month, day);
    }
  }

  match = message.match(/(\d{1,2})月(\d{1,2})日?/);
  if (match) {
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return createDayRange(now.getFullYear(), month, day);
    }
  }

  match = message.match(/(\d{4})[\/\-年\.](\d{1,2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    if (month >= 1 && month <= 12) {
      return createMonthRange(year, month);
    }
  }

  match = message.match(/(\d{1,2})月/);
  if (match) {
    const month = parseInt(match[1], 10);
    if (month >= 1 && month <= 12) {
      return createMonthRange(now.getFullYear(), month);
    }
  }

  match = message.match(/(\d{4})年/);
  if (match) {
    const year = parseInt(match[1], 10);
    return createYearRange(year, year === now.getFullYear());
  }

  if (/今年|本年|今年度|本年度|這一年|這年/.test(message)) {
    return createYearRange(now.getFullYear(), true);
  }

  if (/去年|去年度/.test(message)) {
    return createYearRange(now.getFullYear() - 1, false);
  }

  if (/前年/.test(message)) {
    return createYearRange(now.getFullYear() - 2, false);
  }

  if (/上(個)?月/.test(message)) {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return createMonthRange(lastMonth.getFullYear(), lastMonth.getMonth() + 1);
  }

  if (/這(個)?月|本月/.test(message)) {
    return createMonthRange(now.getFullYear(), now.getMonth() + 1);
  }

  return null;
}

function parseExpenseDetailQuery(message: string): DetailQuery | null {
  const normalized = message.trim();
  if (!/(細項|細目|明細|列表|記錄)/.test(normalized)) {
    return null;
  }

  // 交給收入細項邏輯處理
  if (/(收入)(的)?(細項|明細|列表|記錄)/.test(normalized) && !/(支出|花費|費用)/.test(normalized)) {
    return null;
  }

  const now = new Date();
  const dateRange = extractDateRange(normalized) || createMonthRange(now.getFullYear(), now.getMonth() + 1);
  const rawCategory = extractCategoryKeyword(normalized);
  const category = normalizeCategoryName(rawCategory);

  return {
    ...dateRange,
    category,
  };
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

  // Arabic numerals
  const indexMatch = content.match(/第?(\d+)(?:筆|條|點)?/);
  if (indexMatch) {
    const index = parseInt(indexMatch[1], 10);
    if (index > 0) {
      return { index };
    }
  }

  // Chinese numerals (例如：第一點、第二筆)
  const chineseMatch = content.match(/第([一二三四五六七八九十兩]+)(?:筆|條|點)?/);
  if (chineseMatch) {
    const parsed = parseChineseNumber(chineseMatch[1]);
    if (parsed && parsed > 0) {
      return { index: parsed };
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
  newCategory?: string;
} | null {
  const normalizedMessage = message.trim();
  const hasChangeVerb = /(修改|更改|更新|更正|改成|改為|變成|換成)/.test(normalizedMessage);
  if (!hasChangeVerb) {
    return null;
  }

  const match = normalizedMessage.match(/^(修改|更改|更新|更正)?(.*)$/);
  if (!match) {
    return null;
  }

  let content = match[2].trim();
  if (!content) {
    return null;
  }

  const indexMatch = content.match(/第?(\d+)(?:筆|條|點)?/);
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

  let newDetail: string | undefined;
  let newCategory: string | undefined;
  const changeMatch = content.match(/(改成|改為|變成|換成)(.+)$/);
  if (changeMatch) {
    const newValue = changeMatch[2].trim();
    const normalizedCategory = normalizeCategoryName(newValue);
    if (normalizedCategory && KNOWN_EXPENSE_CATEGORIES.has(normalizedCategory)) {
      newCategory = normalizedCategory;
    } else {
      newDetail = newValue;
    }
    content = content.replace(changeMatch[0], '').trim();
  }

  const keyword = content
    .replace(/(要|把|項目|類別|分類|改|為|成)/g, '')
    .trim();

  if (
    index === undefined &&
    !keyword &&
    newAmount === undefined &&
    !newDetail &&
    !newCategory
  ) {
    return null;
  }

  return {
    keyword: keyword || undefined,
    index,
    newDetail,
    newAmount,
    newCategory,
  };
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-US');
}

function getPositiveNetMessage(netIncome: number): string {
  if (netIncome === 0) {
    return '😌 本月收支打平，保持節奏就能繼續往前。';
  }

  const formatted = formatAmount(netIncome);
  if (netIncome >= 50000) {
    return `🚀 淨收入 +$${formatted}，錢包直接起飛！`;
  }
  if (netIncome >= 10000) {
    return `👏 淨收入 +$${formatted}，穩穩往財富自由邁進！`;
  }
  return `👍 淨收入 +$${formatted}，每天都更接近目標！`;
}

function getNegativeNetMessage(netIncome: number): string {
  const loss = Math.abs(netIncome);
  const formatted = formatAmount(loss);
  if (loss >= 5000) {
    return `⚠️ 提醒：淨收入 -$${formatted}，鈔票正用光速逃離，快勒緊荷包！`;
  }
  return `🙃 淨收入 -$${formatted}，再這樣月底就只能喝西北風啦。`;
}

async function buildMonthlyStatsSummary(userId: string, year: number, month: number) {
  const [expenseStats, incomeStats] = await Promise.all([
    expenseService.getMonthlyStatistics(userId, year, month),
    incomeService
      .getMonthlyStatistics(userId, year, month)
      .catch(() => ({ month: '', total: 0, byCategory: {} })),
  ]);

  const netIncome = incomeStats.total - expenseStats.total;
  const moodMessage = netIncome >= 0 ? getPositiveNetMessage(netIncome) : getNegativeNetMessage(netIncome);

  const statsText =
    `📊 ${expenseStats.month} 統計\n\n` +
    `💰 收入：$${formatAmount(incomeStats.total)}\n` +
    `💸 支出：$${formatAmount(expenseStats.total)}\n` +
    `📈 淨收入：$${formatAmount(netIncome)}\n\n` +
    moodMessage;

  return { statsText, expenseStats, incomeStats };
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
        const { statsText, expenseStats, incomeStats } = await buildMonthlyStatsSummary(
          userId,
          now.getFullYear(),
          now.getMonth() + 1
        );
        await lineService.replyTextMessage(replyToken, statsText);
        await lineService.replyStatisticsWithChart(replyToken, expenseStats, incomeStats);
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
          const { statsText, expenseStats, incomeStats } = await buildMonthlyStatsSummary(userId, year, month);
          await lineService.replyTextMessage(replyToken, statsText);
          await lineService.replyStatisticsWithChart(replyToken, expenseStats, incomeStats);
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
    const detailQuery = parseExpenseDetailQuery(userMessage);
    if (detailQuery) {
      const expenses = detailQuery.category
        ? await expenseService.getExpensesByCategoryRange(
            userId,
            detailQuery.category,
            detailQuery.startDate,
            detailQuery.endDate
          )
        : await expenseService.getExpensesByDateRange(userId, detailQuery.startDate, detailQuery.endDate);

      const periodLabel = detailQuery.category
        ? `${detailQuery.label} ${detailQuery.category}`
        : detailQuery.label;

      await lineService.replyExpenseDetails(replyToken, expenses, {
        periodLabel,
      });
      await conversationRepository.addMessage(userId, {
        role: 'assistant',
        content: `已回覆 ${periodLabel} 的花費細項`,
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
        const keyword = deleteCommand.keyword.replace(/\|/g, ' ').trim();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateMatch = keyword.match(/(\d{1,2})[\/\-](\d{1,2})/);
        const zhDateMatch = keyword.match(/(\d{1,2})月(\d{1,2})日?/);
        let specificDate: Date | undefined;
        if (dateMatch) {
          const month = parseInt(dateMatch[1], 10);
          const day = parseInt(dateMatch[2], 10);
          specificDate = new Date(today.getFullYear(), month - 1, day);
        } else if (zhDateMatch) {
          const month = parseInt(zhDateMatch[1], 10);
          const day = parseInt(zhDateMatch[2], 10);
          specificDate = new Date(today.getFullYear(), month - 1, day);
        }

        const wantsToday = /今天/.test(keyword);
        const wantsYesterday = /(昨天|昨日)/.test(keyword);

        const normalizeCategory = (cat: string) => (cat === '食' ? '餐點' : cat);
        const availableCategories = Array.from(new Set(recentExpenses.map((exp) => exp.category)));
        const knownCategories = ['餐點', '飲品', '交通', '生活用品', '娛樂', '醫療', '3C', '其他'];
        let categoryKeyword: string | undefined;
        [...availableCategories, ...knownCategories].forEach((cat) => {
          if (!cat) {
            return;
          }
          if (keyword.includes(cat)) {
            categoryKeyword = normalizeCategory(cat);
          }
        });
        if (!categoryKeyword && keyword.includes('食')) {
          categoryKeyword = '餐點';
        }

        let detailKeyword: string | undefined = keyword
          .replace(/今天|昨天|昨日|刪除|的/g, '')
          .replace(/第[一二三四五六七八九十兩\d]+(?:筆|條|點)?/g, '')
          .replace(/(\d{1,2})[\/\-](\d{1,2})/g, '')
          .replace(/(\d{1,2})月(\d{1,2})日?/g, '')
          .trim();
        if (categoryKeyword && detailKeyword) {
          detailKeyword = detailKeyword.replace(new RegExp(categoryKeyword, 'g'), '').trim();
        }
        if (detailKeyword === '') {
          detailKeyword = undefined;
        }

        const isSameDay = (source: Date, targetDate: Date) => {
          const d = new Date(source);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === targetDate.getTime();
        };

        let filtered = recentExpenses.filter((expense) => {
          let match = true;
          if (specificDate) {
            match = match && isSameDay(expense.timestamp, specificDate);
          } else if (wantsToday) {
            match = match && isSameDay(expense.timestamp, today);
          } else if (wantsYesterday) {
            match = match && isSameDay(expense.timestamp, yesterday);
          }

          if (categoryKeyword) {
            match = match && expense.category === categoryKeyword;
          }

          if (detailKeyword) {
            const normalizedDetail = expense.detail?.replace(/\s+/g, '') || '';
            const normalizedKeyword = detailKeyword.replace(/\s+/g, '');
            match =
              match &&
              (normalizedDetail.includes(normalizedKeyword) ||
                expense.category?.includes(normalizedKeyword));
          }

          return match;
        });

        if (filtered.length === 1) {
          target = filtered[0];
        } else if (filtered.length > 1) {
          let message = '找到多筆符合條件的記錄，請指定要刪除的編號：\n\n';
          filtered.slice(0, 5).forEach((expense) => {
            const idx =
              recentExpenses.findIndex((item) => item._id.toString() === expense._id.toString()) + 1;
            const date = new Date(expense.timestamp);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            message += `${idx}. ${expense.category} - ${expense.detail} $${expense.amount} (${dateStr})\n`;
          });
          message += '\n請輸入「刪除第X筆」再試一次。';
          await lineService.replyTextMessage(replyToken, message);
          await conversationRepository.addMessage(userId, {
            role: 'assistant',
            content: '刪除失敗：需使用指定的序號',
            timestamp: new Date(),
          });
          return;
        }
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

    // 判斷是否為修改指令（先檢查簡單格式，再使用 LLM）
    const simpleUpdateCommand = parseUpdateCommand(userMessage);
    if (
      simpleUpdateCommand ||
      /^(修改|更改|更新|更正)/.test(userMessage.trim()) ||
      /(改成|改為|變成|換成)/.test(userMessage)
    ) {
      const recentExpenses = await expenseService.getUserExpenses(userId, 50, 0);
      
      // 使用 LLM 解析更正指令
      const latestConversation = await conversationRepository.findLatestByUserId(userId);
      const conversationHistory = latestConversation?.messages
        .slice(-5)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        })) || [];

      const parsedUpdate = await openaiService.parseUpdateCommand(
        userMessage,
        recentExpenses.map((exp) => ({
          _id: exp._id.toString(),
          category: exp.category,
          detail: exp.detail,
          amount: exp.amount,
          timestamp: exp.timestamp,
        })),
        conversationHistory
      );

      const candidateIndexes = parsedUpdate.candidates || [];

      // 如果有錯誤或多個候選，顯示候選列表
      if (parsedUpdate.error || candidateIndexes.length > 1) {
        if (candidateIndexes.length > 0) {
          let message = '找到多筆可能的記錄，請選擇要修改的記錄：\n\n';
          candidateIndexes.forEach((candidateIndex: number) => {
            const idx = candidateIndex - 1;
            if (idx >= 0 && idx < recentExpenses.length) {
              const candidateExpense = recentExpenses[idx];
              const date = new Date(candidateExpense.timestamp);
              const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
              message += `${candidateIndex}. ${candidateExpense.category} - ${candidateExpense.detail} $${candidateExpense.amount} (${dateStr})\n`;
            }
          });
          message += '\n請回覆「修改第X筆 [新內容]」來指定要修改的記錄。';
          await lineService.replyTextMessage(replyToken, message);
        } else {
          await lineService.replyTextMessage(
            replyToken,
            parsedUpdate.error || '找不到需要修改的記帳紀錄，請提供更明確的描述（例如：修改午餐 120 或 更正昨天的晚餐為100）。'
          );
        }
        await conversationRepository.addMessage(userId, {
          role: 'assistant',
          content: '更正指令需要更多資訊',
          timestamp: new Date(),
        });
        return;
      }

      // 確定目標記錄
      let target;
      if (parsedUpdate.targetId) {
        target = recentExpenses.find((exp) => exp._id.toString() === parsedUpdate.targetId);
      } else if (parsedUpdate.targetIndex) {
        const idx = parsedUpdate.targetIndex - 1;
        if (idx >= 0 && idx < recentExpenses.length) {
          target = recentExpenses[idx];
        }
      } else if (simpleUpdateCommand) {
        // 降級到簡單解析
        if (simpleUpdateCommand.index !== undefined) {
          const idx = simpleUpdateCommand.index - 1;
          if (idx >= 0 && idx < recentExpenses.length) {
            target = recentExpenses[idx];
          }
        } else if (simpleUpdateCommand.keyword) {
          target = recentExpenses.find(
            (expense) =>
              expense.detail?.includes(simpleUpdateCommand.keyword as string) ||
              expense.category?.includes(simpleUpdateCommand.keyword as string)
          );
        }
      }

      if (!target && candidateIndexes.length === 1) {
        const idx = candidateIndexes[0] - 1;
        if (idx >= 0 && idx < recentExpenses.length) {
          target = recentExpenses[idx];
        }
      }

      if (!target) {
        await lineService.replyTextMessage(
          replyToken,
          '找不到需要修改的記帳紀錄。請提供更明確的描述，例如：\n- "更正今天的晚餐為100"\n- "修改第3筆為150"\n- "更正昨天的午餐"'
        );
        await conversationRepository.addMessage(userId, {
          role: 'assistant',
          content: '修改失敗：找不到符合的記帳紀錄',
          timestamp: new Date(),
        });
        return;
      }

      // 構建更新 payload
      const payload: any = {};
      if (parsedUpdate.newAmount !== undefined && parsedUpdate.newAmount !== null) {
        payload.amount = parsedUpdate.newAmount;
      } else if (simpleUpdateCommand?.newAmount !== undefined) {
        payload.amount = simpleUpdateCommand.newAmount;
      }
      
      if (parsedUpdate.newDetail) {
        payload.detail = parsedUpdate.newDetail;
      } else if (simpleUpdateCommand?.newDetail) {
        payload.detail = simpleUpdateCommand.newDetail;
      }

      if (parsedUpdate.newCategory) {
        payload.category = parsedUpdate.newCategory === '食' ? '餐點' : parsedUpdate.newCategory;
      } else if (simpleUpdateCommand?.newCategory) {
        payload.category =
          simpleUpdateCommand.newCategory === '食' ? '餐點' : simpleUpdateCommand.newCategory;
      }

      if (Object.keys(payload).length === 0) {
        await lineService.replyTextMessage(
          replyToken,
          '請提供要修改的內容，例如「修改午餐 120」或「更正今天的晚餐為100」。'
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
        const { statsText, expenseStats, incomeStats } = await buildMonthlyStatsSummary(
          userId,
          now.getFullYear(),
          now.getMonth() + 1
        );
        await lineService.replyTextMessage(replyToken, statsText);
        await lineService.replyStatisticsWithChart(replyToken, expenseStats, incomeStats);
        await conversationRepository.addMessage(userId, {
          role: 'assistant',
          content: statsText,
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
        // 記帳（支出）
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
      } else if (parsed.intent === 'income') {
        // 記帳（收入）
        if (parsed.amount > 0) {
          const incomeCategory = parsed.category || '其他收入';
          const incomeDetail = parsed.item || '未指定';
          
          await incomeService.createIncome({
            userId,
            category: incomeCategory,
            detail: incomeDetail,
            amount: parsed.amount,
          });

          // 使用 LLM 生成的 reply 或友善提示
          const replyText =
            parsed.reply || lineService.buildIncomeReply(incomeCategory, incomeDetail, parsed.amount);
          await lineService.replyTextMessage(replyToken, replyText);

          await conversationRepository.addMessage(userId, {
            role: 'assistant',
            content: replyText,
            timestamp: new Date(),
          });
        } else {
          // 金額為 0，可能是格式錯誤
          const errorReply = parsed.reply || '❌ 無法識別金額，請使用格式：收入 金額（如：薪水 30000）';
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
        const message = userMessage.toLowerCase();
        let incomePeriod: IncomePeriod | null = null;
        let cachedIncomeStats: { month: string; total: number; byCategory: Record<string, number> } | null =
          null;
        let comparisonResult: Awaited<ReturnType<typeof expenseService.compareMonthlyExpenses>> | null = null;
        let isCurrentMonthQuery = false;
        
        const incomeDetailRequest = /(收入)(的)?(細項|明細|列表|記錄)/.test(userMessage);
        if (incomeDetailRequest) {
          const now = new Date();
          const incomes = await incomeService.getMonthlyIncomes(
            userId,
            now.getFullYear(),
            now.getMonth() + 1
          );
          await lineService.replyIncomeDetails(replyToken, incomes, {
            periodLabel: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
          });

          await conversationRepository.addMessage(userId, {
            role: 'assistant',
            content: `已回覆本月收入細項，共 ${incomes.length} 筆`,
            timestamp: new Date(),
          });
          return;
        }
        
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
          const now = new Date();
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const targetYear = lastMonth.getFullYear();
          const targetMonth = lastMonth.getMonth() + 1;
          statistics = await expenseService.getMonthlyStatistics(userId, targetYear, targetMonth);
          replyText = `上個月統計：總計 $${statistics.total}`;
          incomePeriod = { type: 'month', year: targetYear, month: targetMonth, label: statistics.month };
        } else if (message.includes('這半年') || message.includes('这半年') || message.includes('半年')) {
          // 查詢這半年統計
          statistics = await expenseService.getHalfYearStatistics(userId);
          replyText = `過去6個月統計：總計 $${statistics.total}`;
          const now = new Date();
          const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          sixMonthsAgo.setHours(0, 0, 0, 0);
          const rangeEnd = new Date(now);
          rangeEnd.setHours(23, 59, 59, 999);
          incomePeriod = { type: 'range', start: sixMonthsAgo, end: rangeEnd, label: '過去6個月' };
        } else if (message.includes('今年') || message.includes('這年') || message.includes('这年')) {
          // 查詢今年統計
          statistics = await expenseService.getYearStatistics(userId);
          replyText = `${statistics.month}統計：總計 $${statistics.total}`;
          const now = new Date();
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          startOfYear.setHours(0, 0, 0, 0);
          const endOfYear = new Date(now);
          endOfYear.setHours(23, 59, 59, 999);
          incomePeriod = { type: 'range', start: startOfYear, end: endOfYear, label: statistics.month };
        } else {
          // 預設：查詢本月統計
          const now = new Date();
          
          // 效能優化：並行查詢本月統計和月份比較
          const monthStats = await expenseService.getMonthlyStatistics(
            userId,
            now.getFullYear(),
            now.getMonth() + 1
          );
          
          const [incomeStats, comparison] = await Promise.all([
            incomeService.getMonthlyStatistics(
              userId,
              now.getFullYear(),
              now.getMonth() + 1
            ).catch(() => ({ month: monthStats.month, total: 0, byCategory: {} })),
            expenseService.compareMonthlyExpenses(userId).catch(() => null),
          ]);
          
          statistics = monthStats;
          cachedIncomeStats = incomeStats;
          comparisonResult = comparison;
          const netIncome = incomeStats.total - statistics.total;
          replyText = `本月統計：支出 $${statistics.total} | 收入 $${incomeStats.total} | 淨收入 $${netIncome}`;
          incomePeriod = {
            type: 'month',
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            label: monthStats.month,
          };
          isCurrentMonthQuery = true;
        }

        let incomeStats = cachedIncomeStats;
        if (!incomeStats) {
          if (incomePeriod?.type === 'month') {
            incomeStats = await incomeService
              .getMonthlyStatistics(userId, incomePeriod.year, incomePeriod.month)
              .catch(() => ({ month: statistics.month, total: 0, byCategory: {} }));
          } else if (incomePeriod?.type === 'range') {
            incomeStats = await incomeService
              .getStatisticsByDateRange(userId, incomePeriod.start, incomePeriod.end, incomePeriod.label)
              .catch(() => ({ month: statistics.month, total: 0, byCategory: {} }));
          } else {
            incomeStats = { month: statistics.month, total: 0, byCategory: {} };
          }
        }

        // 回覆統計結果（使用帶圓餅圖的版本，但先顯示包含收入的文字統計）
        const netIncome = incomeStats.total - statistics.total;
        const statsText = `📊 ${statistics.month} 統計\n\n💰 收入：$${incomeStats.total}\n💸 支出：$${statistics.total}\n📈 淨收入：$${netIncome}\n\n`;
        await lineService.replyTextMessage(replyToken, statsText);
        
        // 然後顯示支出/收入統計圖表
        await lineService.replyStatisticsWithChart(replyToken, statistics, incomeStats);
        
        await conversationRepository.addMessage(userId, {
          role: 'assistant',
          content: replyText,
          timestamp: new Date(),
        });

        if (isCurrentMonthQuery) {
          if (netIncome >= 0) {
            try {
              await lineService.pushMessage(userId, {
                type: 'text',
                text: `👏 本月淨收入 +$${netIncome}，保持得很棒！`,
              });
            } catch (error: any) {
              logger.error('發送鼓勵訊息失敗', { error: error.message });
            }
          } else if (comparisonResult && comparisonResult.isIncreased && comparisonResult.percentage > 10) {
            try {
              openaiService
                .generateSarcasticWarning(
                  comparisonResult.currentMonth.total,
                  comparisonResult.lastMonth.total,
                  comparisonResult.difference,
                  comparisonResult.percentage
                )
                .then((warningMessage) => {
                  lineService
                    .pushMessage(userId, {
                      type: 'text',
                      text: `⚠️ ${warningMessage}`,
                    })
                    .catch((err: any) => {
                      logger.error('發送毒舌警告失敗', { error: err.message });
                    });
                })
                .catch((err: any) => {
                  logger.warn('產生毒舌警告失敗', { error: err.message });
                });
            } catch (error: any) {
              logger.warn('比較月份花費失敗，跳過毒舌警告', { error: error.message });
            }
          }
        }
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


