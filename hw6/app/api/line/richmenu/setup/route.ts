import { NextRequest, NextResponse } from 'next/server';
import lineService from '@/lib/services/lineService';
import logger from '@/lib/services/logger';

// 設定 runtime 為 nodejs
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/line/richmenu/setup
 * 完整設置 Rich Menu（創建 + 上傳圖片 + 設為預設）
 * 
 * 根據官方文檔流程：
 * 1. 創建 Rich Menu
 * 2. 上傳圖片（必需）
 * 3. 設為預設 Rich Menu
 * 
 * 使用方式：
 * curl -X POST http://localhost:3000/api/line/richmenu/setup \
 *   -H "Content-Type: multipart/form-data" \
 *   -F "image=@richmenu.jpg"
 * 
 * 或者只創建（不上傳圖片）：
 * curl -X POST http://localhost:3000/api/line/richmenu/setup
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    logger.info('收到設置 Rich Menu 請求');

    // 檢查環境變數
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      logger.error('LINE_CHANNEL_ACCESS_TOKEN 環境變數未設定');
      return NextResponse.json(
        { success: false, error: 'LINE_CHANNEL_ACCESS_TOKEN 未設定' },
        { status: 500 }
      );
    }

    // 步驟 1: 創建 Rich Menu
    logger.info('步驟 1: 創建 Rich Menu');
    const richMenuId = await lineService.createCompactRichMenu();
    logger.info('Rich Menu 創建成功', { richMenuId });

    const result: any = {
      richMenuId,
      steps: {
        step1_create: '成功',
        step2_upload: '跳過（未提供圖片）',
        step3_setDefault: '未執行（需要先上傳圖片）',
      },
    };

    // 步驟 2: 上傳圖片（如果提供）
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        const imageFile = formData.get('image') as File;

        if (imageFile) {
          logger.info('步驟 2: 上傳 Rich Menu 圖片', { 
            fileName: imageFile.name,
            size: imageFile.size 
          });

          const arrayBuffer = await imageFile.arrayBuffer();
          const imageBuffer = Buffer.from(arrayBuffer);

          await lineService.setRichMenuImage(richMenuId, imageBuffer);
          logger.info('Rich Menu 圖片上傳成功', { richMenuId });
          
          result.steps.step2_upload = '成功';
          result.imageSize = imageBuffer.length;

          // 步驟 3: 設為預設 Rich Menu（只有上傳圖片後才能設置）
          logger.info('步驟 3: 設為預設 Rich Menu');
          await lineService.setDefaultRichMenu(richMenuId);
          logger.info('Rich Menu 已設為預設選單', { richMenuId });
          
          result.steps.step3_setDefault = '成功';
        }
      } catch (uploadError: any) {
        logger.error('上傳圖片失敗', { error: uploadError.message });
        result.steps.step2_upload = `失敗: ${uploadError.message}`;
        result.warning = '圖片上傳失敗，Rich Menu 可能無法正常顯示。請稍後使用 POST /api/line/richmenu/{richMenuId}/image 重新上傳。';
      }
    }

    return NextResponse.json({
      success: true,
      message: result.steps.step3_setDefault === '成功' 
        ? 'Rich Menu 設置完成！' 
        : 'Rich Menu 已創建，但需要上傳圖片後才能設為預設選單',
      data: result,
      nextSteps: result.steps.step2_upload !== '成功' ? [
        `使用 POST /api/line/richmenu/${richMenuId}/image 上傳圖片`,
        `上傳圖片後，使用 POST /api/line/richmenu/${richMenuId}/set-default 設為預設選單`,
      ] : [],
    });
  } catch (error: any) {
    logger.error('設置 Rich Menu 失敗', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || '設置 Rich Menu 失敗',
      },
      { status: 500 }
    );
  }
}


