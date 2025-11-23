import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import expenseRepository from '@/lib/repositories/expenseRepository';
import userRepository from '@/lib/repositories/userRepository';
import logger from '@/lib/services/logger';
import { z } from 'zod';

const QuerySchema = z.object({
  userId: z.string().optional(),
  year: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  month: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const query = QuerySchema.parse({
      userId: searchParams.get('userId'),
      year: searchParams.get('year'),
      month: searchParams.get('month'),
    });

    const now = new Date();
    const year = query.year || now.getFullYear();
    const month = query.month || now.getMonth() + 1;

    if (query.userId) {
      // 單一使用者統計
      const stats = await expenseRepository.getMonthlyStatistics(
        query.userId,
        year,
        month
      );

      return NextResponse.json({
        success: true,
        data: {
          month: `${year}-${String(month).padStart(2, '0')}`,
          total: stats.total,
          byCategory: stats.byCategory,
        },
      });
    } else {
      // 全體統計
      const users = await userRepository.getAllUsers();
      const allStats: Record<string, { total: number; byCategory: Record<string, number> }> = {};

      for (const user of users) {
        try {
          const stats = await expenseRepository.getMonthlyStatistics(
            user.lineUserId,
            year,
            month
          );
          allStats[user.lineUserId] = stats;
        } catch (error: any) {
          logger.warn('取得使用者統計失敗', {
            userId: user.lineUserId,
            error: error.message,
          });
        }
      }

      // 彙總所有使用者的統計
      let total = 0;
      const byCategory: Record<string, number> = {};

      Object.values(allStats).forEach((stats) => {
        total += stats.total;
        Object.entries(stats.byCategory).forEach(([category, amount]) => {
          byCategory[category] = (byCategory[category] || 0) + amount;
        });
      });

      return NextResponse.json({
        success: true,
        data: {
          month: `${year}-${String(month).padStart(2, '0')}`,
          total,
          byCategory,
          userCount: users.length,
        },
      });
    }
  } catch (error: any) {
    logger.error('取得統計資料失敗', { error: error.message });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '查詢參數格式錯誤' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}


