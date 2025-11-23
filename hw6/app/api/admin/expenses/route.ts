import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import expenseRepository from '@/lib/repositories/expenseRepository';
import logger from '@/lib/services/logger';
import { z } from 'zod';

const QuerySchema = z.object({
  userId: z.string().optional(),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 100)),
  skip: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 0)),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const query = QuerySchema.parse({
      userId: searchParams.get('userId'),
      limit: searchParams.get('limit'),
      skip: searchParams.get('skip'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    let expenses;

    if (query.userId) {
      if (query.startDate && query.endDate) {
        // 日期範圍查詢
        expenses = await expenseRepository.findByUserIdAndDateRange(
          query.userId,
          new Date(query.startDate),
          new Date(query.endDate)
        );
      } else {
        // 一般查詢
        expenses = await expenseRepository.findByUserId(
          query.userId,
          query.limit,
          query.skip
        );
      }
    } else {
      // 如果沒有指定 userId，需要實作全體查詢（這裡簡化處理）
      return NextResponse.json(
        { success: false, error: '請指定 userId' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: expenses,
      count: expenses.length,
    });
  } catch (error: any) {
    logger.error('取得記帳記錄失敗', { error: error.message });
    
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


