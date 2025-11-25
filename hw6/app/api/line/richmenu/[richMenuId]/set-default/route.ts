import { NextRequest, NextResponse } from 'next/server';
import lineService from '@/lib/services/lineService';
import logger from '@/lib/services/logger';

// 設定 runtime 為 nodejs
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/line/richmenu/[richMenuId]/set-default
 * 設定 Rich Menu 為預設選單（給所有使用者）
 * 
 * 使用方式：
 * curl -X POST http://localhost:3000/api/line/richmenu/{richMenuId}/set-default
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ richMenuId: string }> }
): Promise<Response> {
  try {
    const { richMenuId } = await params;
    logger.info('收到設定預設 Rich Menu 請求', { richMenuId });

    // 檢查環境變數
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      logger.error('LINE_CHANNEL_ACCESS_TOKEN 環境變數未設定');
      return NextResponse.json(
        { success: false, error: 'LINE_CHANNEL_ACCESS_TOKEN 未設定' },
        { status: 500 }
      );
    }

    // 設定為預設 Rich Menu
    await lineService.setDefaultRichMenu(richMenuId);

    logger.info('成功設定預設 Rich Menu', { richMenuId });

    return NextResponse.json({
      success: true,
      message: 'Rich Menu 已設定為預設選單',
      data: {
        richMenuId,
      },
    });
  } catch (error: any) {
    const { richMenuId: errorRichMenuId } = await params;
    logger.error('設定預設 Rich Menu 失敗', {
      error: error.message,
      richMenuId: errorRichMenuId,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || '設定預設 Rich Menu 失敗',
      },
      { status: 500 }
    );
  }
}
