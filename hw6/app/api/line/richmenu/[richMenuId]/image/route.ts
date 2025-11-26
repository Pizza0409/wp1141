import { NextRequest, NextResponse } from 'next/server';
import lineService from '@/lib/services/lineService';
import logger from '@/lib/services/logger';
import sharp from 'sharp';

// 設定 runtime 為 nodejs
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/line/richmenu/[richMenuId]/image
 * 上傳 Rich Menu 圖片
 * 
 * 支援兩種方式：
 * 1. multipart/form-data (推薦):
 *    curl -X POST http://localhost:3000/api/line/richmenu/{richMenuId}/image \
 *      -F "image=@richmenu.png"
 * 
 * 2. 直接上傳圖片二進位:
 *    curl -X POST http://localhost:3000/api/line/richmenu/{richMenuId}/image \
 *      -H "Content-Type: image/png" \
 *      --data-binary @richmenu.png
 * 
 * 注意：
 * - 圖片會自動轉換為 JPEG 格式（LINE API 要求）
 * - Compact Menu 尺寸：1038x635
 * - Wide Menu 尺寸：2500x843
 * - Full Menu 尺寸：2500x1686
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

    let imageBuffer: Buffer;
    const contentType = request.headers.get('content-type') || '';

    // 處理 multipart/form-data
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const imageFile = formData.get('image') as File;

      if (!imageFile) {
        return NextResponse.json(
          {
            success: false,
            error: '請提供圖片檔案（form-data 欄位名稱：image）',
          },
          { status: 400 }
        );
      }

      logger.info('從 form-data 讀取圖片', {
        fileName: imageFile.name,
        size: imageFile.size,
        type: imageFile.type,
      });

      const arrayBuffer = await imageFile.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else if (contentType.startsWith('image/')) {
      // 處理直接上傳的圖片二進位
      logger.info('從請求體讀取圖片', { contentType });
      const arrayBuffer = await request.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: '請使用 multipart/form-data 或直接上傳圖片（Content-Type: image/*）',
        },
        { status: 400 }
      );
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '圖片資料為空',
        },
        { status: 400 }
      );
    }

    // 驗證並轉換圖片為 JPEG（LINE API 只接受 JPEG）
    logger.info('處理圖片', { size: imageBuffer.length });
    
    let processedImage: Buffer;
    try {
      // 使用 sharp 轉換為 JPEG 並驗證尺寸
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      logger.info('圖片資訊', {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
      });

      // 轉換為 JPEG（LINE API 要求）
      processedImage = await image
        .jpeg({ quality: 90 })
        .toBuffer();

      logger.info('圖片已轉換為 JPEG', {
        originalSize: imageBuffer.length,
        processedSize: processedImage.length,
      });
    } catch (imageError: any) {
      logger.error('圖片處理失敗', { error: imageError.message });
      return NextResponse.json(
        {
          success: false,
          error: `圖片處理失敗: ${imageError.message}`,
        },
        { status: 400 }
      );
    }

    // 上傳圖片到 LINE
    await lineService.setRichMenuImage(richMenuId, processedImage);

    logger.info('成功上傳 Rich Menu 圖片', {
      richMenuId,
      originalSize: imageBuffer.length,
      processedSize: processedImage.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Rich Menu 圖片上傳成功',
      data: {
        richMenuId,
        originalSize: imageBuffer.length,
        processedSize: processedImage.length,
        format: 'jpeg',
      },
    });
  } catch (error: any) {
    const { richMenuId: errorRichMenuId } = await params;
    logger.error('上傳 Rich Menu 圖片失敗', {
      error: error.message,
      stack: error.stack,
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


