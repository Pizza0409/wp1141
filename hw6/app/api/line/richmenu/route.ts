import { NextRequest, NextResponse } from 'next/server';
import lineService from '@/lib/services/lineService';
import logger from '@/lib/services/logger';

// 設定 runtime 為 nodejs
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/line/richmenu
 * 建立 Rich Menu（使用官方文件第一步的配置）
 * 
 * 使用方式：
 * curl -X POST http://localhost:3000/api/line/richmenu
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    logger.info('收到建立 Rich Menu 請求');

    // 檢查環境變數
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      logger.error('LINE_CHANNEL_ACCESS_TOKEN 環境變數未設定');
      return NextResponse.json(
        { success: false, error: 'LINE_CHANNEL_ACCESS_TOKEN 未設定' },
        { status: 500 }
      );
    }

    // 建立 Compact Rich Menu（使用官方文件第一步的配置）
    const richMenuId = await lineService.createCompactRichMenu();

    logger.info('成功建立 Rich Menu', { richMenuId });

    return NextResponse.json({
      success: true,
      data: {
        richMenuId,
        message: 'Rich Menu 建立成功',
        nextSteps: [
          '使用 POST /api/line/richmenu/{richMenuId}/image 上傳圖片',
          '使用 POST /api/line/richmenu/{richMenuId}/set-default 設定為預設選單',
        ],
      },
    });
  } catch (error: any) {
    logger.error('建立 Rich Menu 失敗', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || '建立 Rich Menu 失敗',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/line/richmenu
 * 取得所有 Rich Menu 列表
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    logger.info('收到取得 Rich Menu 列表請求');

    // 檢查環境變數
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      logger.error('LINE_CHANNEL_ACCESS_TOKEN 環境變數未設定');
      return NextResponse.json(
        { success: false, error: 'LINE_CHANNEL_ACCESS_TOKEN 未設定' },
        { status: 500 }
      );
    }

    // 使用 LINE SDK 的 client 來取得 Rich Menu 列表
    const { Client } = await import('@line/bot-sdk');
    const client = new Client({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    });

    const richMenuList = await client.getRichMenuList();

    logger.info('成功取得 Rich Menu 列表', { count: richMenuList.length });

    return NextResponse.json({
      success: true,
      data: {
        richMenus: richMenuList,
        count: richMenuList.length,
      },
    });
  } catch (error: any) {
    logger.error('取得 Rich Menu 列表失敗', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || '取得 Rich Menu 列表失敗',
      },
      { status: 500 }
    );
  }
}
