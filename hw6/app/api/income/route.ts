import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import incomeService from '@/lib/services/incomeService';
import { authenticateRequest, requireAuth } from '@/lib/middleware/auth';
import logger from '@/lib/services/logger';
import { z } from 'zod';

const CreateSchema = z.object({
  userId: z.string().min(1),
  category: z.string().min(1),
  detail: z.string().min(1),
  amount: z.number().positive(),
  timestamp: z.string().optional(),
});

const QuerySchema = z.object({
  userId: z.string().optional(),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
  skip: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 0)),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth || !requireAuth(auth.user, 'viewer')) {
      return NextResponse.json({ success: false, error: '未授權' }, { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const query = QuerySchema.parse({
      userId: searchParams.get('userId'),
      limit: searchParams.get('limit'),
      skip: searchParams.get('skip'),
    });

    if (!query.userId) {
      return NextResponse.json(
        { success: false, error: '請提供 userId' },
        { status: 400 }
      );
    }

    const incomes = await incomeService.getUserIncomes(
      query.userId,
      query.limit,
      query.skip
    );

    return NextResponse.json({
      success: true,
      data: incomes,
    });
  } catch (error: any) {
    logger.error('取得收入記錄失敗', { error: error.message });
    return NextResponse.json(
      { success: false, error: '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth || !requireAuth(auth.user, 'viewer')) {
      return NextResponse.json({ success: false, error: '未授權' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const payload = CreateSchema.parse(body);

    const income = await incomeService.createIncome({
      userId: payload.userId,
      category: payload.category,
      detail: payload.detail,
      amount: payload.amount,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: income,
    });
  } catch (error: any) {
    logger.error('建立收入記錄失敗', { error: error.message });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '輸入格式錯誤', issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}
