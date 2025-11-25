import { NextRequest, NextResponse } from 'next/server';
import lineService from '@/lib/services/lineService';
import logger from '@/lib/services/logger';

// 設定 runtime 為 nodejs
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/line/richmenu/[richMenuId]
 * 取得特定 Rich Menu 的資訊
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ richMenuId: string }> }
): Promise<Response> {
  try {
    const { richMenuId } = await params;
    logger.info('收到取得 Rich Menu 資訊請求', { richMenuId });

    // 檢查環境變數
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      logger.error('LINE_CHANNEL_ACCESS_TOKEN 環境變數未設定');
      return NextResponse.json(
        { success: false, error: 'LINE_CHANNEL_ACCESS_TOKEN 未設定' },
        { status: 500 }
      );
    }

    // 使用 LINE SDK 的 client 來取得 Rich Menu 資訊
    const { Client } = await import('@line/bot-sdk');
    const client = new Client({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    });

    const richMenu = await client.getRichMenu(richMenuId);

    logger.info('成功取得 Rich Menu 資訊', { richMenuId });

    return NextResponse.json({
      success: true,
      data: richMenu,
    });
  } catch (error: any) {
    const { richMenuId: errorRichMenuId } = await params;
    logger.error('取得 Rich Menu 資訊失敗', {
      error: error.message,
      richMenuId: errorRichMenuId,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || '取得 Rich Menu 資訊失敗',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/line/richmenu/[richMenuId]
 * 刪除 Rich Menu
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ richMenuId: string }> }
): Promise<Response> {
  try {
    const { richMenuId } = await params;
    logger.info('收到刪除 Rich Menu 請求', { richMenuId });

    await lineService.deleteRichMenu(richMenuId);

    logger.info('成功刪除 Rich Menu', { richMenuId });

    return NextResponse.json({
      success: true,
      message: 'Rich Menu 刪除成功',
    });
  } catch (error: any) {
    const { richMenuId: errorRichMenuId } = await params;
    logger.error('刪除 Rich Menu 失敗', {
      error: error.message,
      richMenuId: errorRichMenuId,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || '刪除 Rich Menu 失敗',
      },
      { status: 500 }
    );
  }
}
