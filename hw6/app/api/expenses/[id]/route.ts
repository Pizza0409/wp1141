import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import expenseService from '@/lib/services/expenseService';
import { authenticateRequest, requireAuth } from '@/lib/middleware/auth';
import logger from '@/lib/services/logger';
import { z } from 'zod';

const UpdateSchema = z.object({
  category: z.string().optional(),
  detail: z.string().optional(),
  amount: z.number().positive().optional(),
  timestamp: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const auth = await authenticateRequest(request);
    if (!auth || !requireAuth(auth.user, 'admin')) {
      return NextResponse.json({ success: false, error: '未授權' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const payload = UpdateSchema.parse(body);

    const data: any = { ...payload };
    if (payload.timestamp) {
      data.timestamp = new Date(payload.timestamp);
    }

    const updated = await expenseService.updateExpense(id, data);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    const { id } = await context.params;
    logger.error('更新記帳記錄失敗', { error: error.message, id });

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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const auth = await authenticateRequest(request);
    if (!auth || !requireAuth(auth.user, 'admin')) {
      return NextResponse.json({ success: false, error: '未授權' }, { status: 401 });
    }

    await connectDB();

    const deleted = await expenseService.deleteExpense(id);

    return NextResponse.json({
      success: deleted,
    });
  } catch (error: any) {
    const { id } = await context.params;
    logger.error('刪除記帳記錄失敗', { error: error.message, id });
    return NextResponse.json(
      { success: false, error: '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}

