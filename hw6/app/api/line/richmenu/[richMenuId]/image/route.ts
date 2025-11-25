import { NextRequest, NextResponse } from 'next/server';
import lineService from '@/lib/services/lineService';
import logger from '@/lib/services/logger';

// 設定 runtime 為 nodejs
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/line/richmenu/[richMenuId]/image
 * 上傳 Rich Menu 圖片
 * 
 * 使用方式：
 * curl -X POST http://localhost:3000/api/line/richmenu/{richMenuId}/image \
 *   -H "Content-Type: image/jpeg" \
 *   --data-binary @richmenu.jpg
 * 
 * 注意：圖片必須符合 Rich Menu 的尺寸（1038x635 for Compact Menu）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ richMenuId: string }> }
): Promise<Response> {
  try {
    const { richMenuId } = await params;
    logger.info('收到上傳 Rich Menu 圖片請求', { richMenuId });

    // 檢查環境變數
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      logger.error('LINE_CHANNEL_ACCESS_TOKEN 環境變數未設定');
      return NextResponse.json(
        { success: false, error: 'LINE_CHANNEL_ACCESS_TOKEN 未設定' },
        { status: 500 }
      );
    }

    // 取得圖片資料
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content-Type 必須是 image/jpeg 或 image/png',
        },
        { status: 400 }
      );
    }

    // 讀取圖片資料為 Buffer
    const arrayBuffer = await request.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // 上傳圖片
    await lineService.setRichMenuImage(richMenuId, imageBuffer);

    logger.info('成功上傳 Rich Menu 圖片', { richMenuId, size: imageBuffer.length });

    return NextResponse.json({
      success: true,
      message: 'Rich Menu 圖片上傳成功',
      data: {
        richMenuId,
        imageSize: imageBuffer.length,
      },
    });
  } catch (error: any) {
    const { richMenuId: errorRichMenuId } = await params;
    logger.error('上傳 Rich Menu 圖片失敗', {
      error: error.message,
      richMenuId: errorRichMenuId,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || '上傳 Rich Menu 圖片失敗',
      },
      { status: 500 }
    );
  }
}


