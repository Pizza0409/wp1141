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
    const rawQuery = {
      userId: searchParams.get('userId') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      skip: searchParams.get('skip') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
    };
    const query = QuerySchema.parse(rawQuery);

    // 解析日期並驗證
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    if (query.startDate || query.endDate) {
      if (!query.startDate || !query.endDate) {
        return NextResponse.json(
          { success: false, error: 'startDate 與 endDate 必須一起提供' },
          { status: 400 }
        );
      }

      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { success: false, error: '日期格式錯誤，請使用 ISO 字串' },
          { status: 400 }
        );
      }
    }

    let expenses;

    if (query.userId) {
      // 查詢特定使用者的記帳記錄
      if (startDate && endDate) {
        // 日期範圍查詢
        expenses = await expenseRepository.findByUserIdAndDateRange(
          query.userId,
          startDate,
          endDate
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
      if (startDate && endDate) {
        expenses = await expenseRepository.findAll(
          query.limit,
          query.skip,
          startDate,
          endDate
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


