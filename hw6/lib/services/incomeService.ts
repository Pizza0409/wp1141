import incomeRepository from '@/lib/repositories/incomeRepository';
import logger from './logger';
import { z } from 'zod';

// 驗證 schema
const IncomeInputSchema = z.object({
  userId: z.string().min(1),
  category: z.string().min(1),
  detail: z.string().min(1),
  amount: z.number().positive(),
  timestamp: z.date().optional(),
});

export interface IncomeInput {
  userId: string;
  category: string;
  detail: string;
  amount: number;
  timestamp?: Date;
}

export interface MonthlyIncomeStatistics {
  month: string; // YYYY-MM
  total: number;
  byCategory: Record<string, number>;
}

export class IncomeService {
  /**
   * 建立收入記錄
   */
  async createIncome(input: IncomeInput): Promise<any> {
    try {
      // 驗證輸入
      const validated = IncomeInputSchema.parse(input);
      
      logger.info('建立收入記錄', { userId: validated.userId, amount: validated.amount });
      
      const income = await incomeRepository.create({
        userId: validated.userId,
        category: validated.category,
        detail: validated.detail,
        amount: validated.amount,
        timestamp: validated.timestamp,
      });

      return income;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        logger.error('收入記錄驗證失敗', { errors: error.issues });
        throw new Error('輸入資料格式錯誤');
      }
      logger.error('建立收入記錄失敗', { error: error.message });
      throw error;
    }
  }

  /**
   * 取得使用者的收入記錄
   */
  async getUserIncomes(
    userId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<any[]> {
    try {
      return await incomeRepository.findByUserId(userId, limit, skip);
    } catch (error: any) {
      logger.error('查詢使用者收入記錄失敗', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * 取得指定日期範圍的收入記錄
   */
  async getIncomesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      return await incomeRepository.findByUserIdAndDateRange(
        userId,
        startDate,
        endDate
      );
    } catch (error: any) {
      logger.error('查詢日期範圍收入記錄失敗', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * 取得某年某月的收入記錄
   */
  async getMonthlyIncomes(
    userId: string,
    year: number,
    month: number
  ): Promise<any[]> {
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return this.getIncomesByDateRange(userId, startDate, endDate);
  }

  /**
   * 取得當日的收入記錄
   */
  async getTodayIncomes(userId: string): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getIncomesByDateRange(userId, today, tomorrow);
  }

  /**
   * 取得每月統計
   */
  async getMonthlyStatistics(
    userId: string,
    year?: number,
    month?: number
  ): Promise<MonthlyIncomeStatistics> {
    try {
      const now = new Date();
      const targetYear = year || now.getFullYear();
      const targetMonth = month || now.getMonth() + 1;

      logger.info('查詢每月收入統計', { userId, year: targetYear, month: targetMonth });

      const stats = await incomeRepository.getMonthlyStatistics(
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
      logger.error('查詢每月收入統計失敗', { error: error.message, userId });
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
  ): Promise<MonthlyIncomeStatistics> {
    try {
      logger.info('查詢日期範圍收入統計', { userId, startDate, endDate });

      const incomes = await incomeRepository.findByUserIdAndDateRange(
        userId,
        startDate,
        endDate
      );

      const total = incomes.reduce((sum, inc) => sum + inc.amount, 0);
      const byCategory: Record<string, number> = {};

      incomes.forEach((inc) => {
        byCategory[inc.category] = (byCategory[inc.category] || 0) + inc.amount;
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
      logger.error('查詢日期範圍收入統計失敗', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 取得上個月的統計
   */
  async getLastMonthStatistics(userId: string): Promise<MonthlyIncomeStatistics> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return this.getMonthlyStatistics(userId, lastMonth.getFullYear(), lastMonth.getMonth() + 1);
  }

  /**
   * 取得這半年的統計
   */
  async getHalfYearStatistics(userId: string): Promise<MonthlyIncomeStatistics> {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    return this.getStatisticsByDateRange(userId, sixMonthsAgo, now, '過去6個月');
  }

  /**
   * 取得今年的統計
   */
  async getYearStatistics(userId: string): Promise<MonthlyIncomeStatistics> {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    return this.getStatisticsByDateRange(userId, yearStart, now, `${now.getFullYear()}年`);
  }

  async updateIncome(
    id: string,
    data: Partial<{
      category: string;
      detail: string;
      amount: number;
      timestamp: Date;
    }>
  ): Promise<any> {
    const updated = await incomeRepository.updateById(id, data);
    if (!updated) {
      throw new Error('找不到指定的收入紀錄');
    }
    return updated;
  }

  async deleteIncome(id: string): Promise<boolean> {
    return incomeRepository.deleteById(id);
  }
}

export default new IncomeService();
