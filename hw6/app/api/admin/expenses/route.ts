import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import expenseRepository from '@/lib/repositories/expenseRepository';
import { authenticateRequest, requireAuth } from '@/lib/middleware/auth';
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
    // 驗證認證
    const authResult = await authenticateRequest(request);
    if (!authResult || !requireAuth(authResult.user, 'viewer')) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      );
    }

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
      // 查詢特定使用者的記帳記錄
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
      // 查詢所有使用者的記帳記錄（管理後台功能）
      if (query.startDate && query.endDate) {
        expenses = await expenseRepository.findAll(
          query.limit,
          query.skip,
          new Date(query.startDate),
          new Date(query.endDate)
        );
      } else {
        expenses = await expenseRepository.findAll(
          query.limit,
          query.skip
        );
      }
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


