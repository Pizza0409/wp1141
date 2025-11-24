import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import conversationRepository from '@/lib/repositories/conversationRepository';
import { authenticateRequest, requireAuth } from '@/lib/middleware/auth';
import logger from '@/lib/services/logger';
import { z } from 'zod';

const QuerySchema = z.object({
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
  skip: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 0)),
  userId: z.string().optional(),
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
      limit: searchParams.get('limit') ?? undefined,
      skip: searchParams.get('skip') ?? undefined,
      userId: searchParams.get('userId') ?? undefined,
    });

    let conversations;
    if (query.userId) {
      conversations = await conversationRepository.findByUserId(
        query.userId,
        query.limit,
        query.skip
      );
    } else {
      conversations = await conversationRepository.getAllConversations(
        query.limit,
        query.skip
      );
    }

    return NextResponse.json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    logger.error('取得對話列表失敗', { error: error.message });
    
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


