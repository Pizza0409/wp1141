import expenseRepository from '@/lib/repositories/expenseRepository';
import userRepository from '@/lib/repositories/userRepository';
import logger from './logger';
import { ExpenseInput, MonthlyStatistics } from '@/types';
import { z } from 'zod';

// 驗證 schema
const ExpenseInputSchema = z.object({
  userId: z.string().min(1),
  category: z.string().min(1),
  detail: z.string().min(1),
  amount: z.number().positive(),
  timestamp: z.date().optional(),
});

export class ExpenseService {
  /**
   * 建立記帳記錄
   */
  async createExpense(input: ExpenseInput): Promise<any> {
    try {
      // 驗證輸入
      const validated = ExpenseInputSchema.parse(input);
      
      logger.info('建立記帳記錄', { userId: validated.userId, amount: validated.amount });
      
      const expense = await expenseRepository.create({
        userId: validated.userId,
        category: validated.category,
        detail: validated.detail,
        amount: validated.amount,
        timestamp: validated.timestamp,
      });

      return expense;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        logger.error('記帳記錄驗證失敗', { errors: error.issues });
        throw new Error('輸入資料格式錯誤');
      }
      logger.error('建立記帳記錄失敗', { error: error.message });
      throw error;
    }
  }

  /**
   * 取得使用者的記帳記錄
   */
  async getUserExpenses(
    userId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<any[]> {
    try {
      return await expenseRepository.findByUserId(userId, limit, skip);
    } catch (error: any) {
      logger.error('查詢記帳記錄失敗', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 取得指定日期範圍的記帳記錄
   */
  async getExpensesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      return await expenseRepository.findByUserIdAndDateRange(
        userId,
        startDate,
        endDate
      );
    } catch (error: any) {
      logger.error('查詢日期範圍記帳記錄失敗', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * 取得當日的記帳記錄
   */
  async getTodayExpenses(userId: string): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getExpensesByDateRange(userId, today, tomorrow);
  }

  /**
   * 取得每月統計
   */
  async getMonthlyStatistics(
    userId: string,
    year?: number,
    month?: number
  ): Promise<MonthlyStatistics> {
    try {
      const now = new Date();
      const targetYear = year || now.getFullYear();
      const targetMonth = month || now.getMonth() + 1;

      logger.info('查詢每月統計', { userId, year: targetYear, month: targetMonth });

      const stats = await expenseRepository.getMonthlyStatistics(
        userId,
        targetYear,
        targetMonth
      );

      return {
        month: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
        total: stats.total,
        byCategory: stats.byCategory,
      };
    } catch (error: any) {
      logger.error('查詢每月統計失敗', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 取得指定日期範圍的統計
   */
  async getStatisticsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    periodName?: string
  ): Promise<MonthlyStatistics> {
    try {
      logger.info('查詢日期範圍統計', { userId, startDate, endDate });

      const expenses = await expenseRepository.findByUserIdAndDateRange(
        userId,
        startDate,
        endDate
      );

      const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const byCategory: Record<string, number> = {};

      expenses.forEach((exp) => {
        byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
      });

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      const period = periodName || `${startStr} 至 ${endStr}`;

      return {
        month: period,
        total,
        byCategory,
      };
    } catch (error: any) {
      logger.error('查詢日期範圍統計失敗', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 取得上個月的統計
   */
  async getLastMonthStatistics(userId: string): Promise<MonthlyStatistics> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = lastMonth.getMonth() + 1;

    return this.getMonthlyStatistics(userId, year, month);
  }

  /**
   * 取得這半年的統計（過去6個月）
   */
  async getHalfYearStatistics(userId: string): Promise<MonthlyStatistics> {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    return this.getStatisticsByDateRange(
      userId,
      sixMonthsAgo,
      endDate,
      '過去6個月'
    );
  }

  /**
   * 取得這年的統計（今年1月至今）
   */
  async getYearStatistics(userId: string): Promise<MonthlyStatistics> {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    startOfYear.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    return this.getStatisticsByDateRange(
      userId,
      startOfYear,
      endDate,
      `${now.getFullYear()}年`
    );
  }

  /**
   * 新增自訂項目類別
   */
  async addCustomCategory(
    lineUserId: string,
    category: string
  ): Promise<boolean> {
    try {
      logger.info('新增自訂類別', { lineUserId, category });
      
      const user = await userRepository.addCustomCategory(lineUserId, category);
      
      if (!user) {
        // 如果使用者不存在，先建立使用者
        await userRepository.createOrUpdate({ lineUserId });
        await userRepository.addCustomCategory(lineUserId, category);
      }

      return true;
    } catch (error: any) {
      logger.error('新增自訂類別失敗', { error: error.message, lineUserId, category });
      throw error;
    }
  }

  /**
   * 取得使用者的所有類別（包含預設和自訂）
   */
  async getUserCategories(lineUserId: string): Promise<string[]> {
    try {
      const user = await userRepository.findByLineUserId(lineUserId);
      const defaultCategories = [
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

      const customCategories = user?.customCategories || [];
      return [...defaultCategories, ...customCategories];
    } catch (error: any) {
      logger.error('取得使用者類別失敗', { error: error.message, lineUserId });
      // 降級：回傳預設類別
      return [
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
    }
  }
}

export default new ExpenseService();


