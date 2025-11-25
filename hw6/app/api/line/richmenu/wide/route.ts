import { NextRequest, NextResponse } from 'next/server';
import lineService from '@/lib/services/lineService';
import logger from '@/lib/services/logger';

// 設定 runtime 為 nodejs
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/line/richmenu/wide
 * 建立 Wide Rich Menu（2500x843 尺寸）
 * 
 * 使用方式：
 * curl -X POST http://localhost:3000/api/line/richmenu/wide
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    logger.info('收到建立 Wide Rich Menu 請求');

    // 檢查環境變數
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      logger.error('LINE_CHANNEL_ACCESS_TOKEN 環境變數未設定');
      return NextResponse.json(
        { success: false, error: 'LINE_CHANNEL_ACCESS_TOKEN 未設定' },
        { status: 500 }
      );
    }

    // 建立 Wide Rich Menu（2500x843）
    const richMenuId = await lineService.createWideRichMenu();

    logger.info('成功建立 Wide Rich Menu', { richMenuId });

    return NextResponse.json({
      success: true,
      data: {
        richMenuId,
        message: 'Wide Rich Menu 建立成功',
        size: '2500x843',
        nextSteps: [
          '使用 POST /api/line/richmenu/{richMenuId}/image 上傳圖片',
          '使用 POST /api/line/richmenu/{richMenuId}/set-default 設定為預設選單',
        ],
      },
    });
  } catch (error: any) {
    logger.error('建立 Wide Rich Menu 失敗', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || '建立 Wide Rich Menu 失敗',
      },
      { status: 500 }
    );
  }
}
