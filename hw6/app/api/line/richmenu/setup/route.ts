import { NextRequest, NextResponse } from 'next/server';
import lineService from '@/lib/services/lineService';
import logger from '@/lib/services/logger';
import sharp from 'sharp';

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

    let richMenuId: string;
    let imageMetadata: { width?: number; height?: number; format?: string } | null = null;
    let originalImageBuffer: Buffer | null = null; // 保存圖片 buffer，避免重複讀取
    const result: any = {
      steps: {
        step1_create: '未執行',
        step2_upload: '跳過（未提供圖片）',
        step3_setDefault: '未執行（需要先上傳圖片）',
      },
    };

    // 步驟 0: 先讀取圖片（如果提供），以決定 Rich Menu 尺寸
    // 注意：request body 只能讀取一次，所以要在這裡一次讀取並保存
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        const imageFile = formData.get('image') as File;

        if (imageFile) {
          logger.info('步驟 0: 讀取圖片資訊', { 
            fileName: imageFile.name,
            size: imageFile.size,
            type: imageFile.type,
          });

          const arrayBuffer = await imageFile.arrayBuffer();
          originalImageBuffer = Buffer.from(arrayBuffer);

          // 讀取圖片尺寸
          try {
            const image = sharp(originalImageBuffer);
            imageMetadata = await image.metadata();
            
            logger.info('圖片資訊', {
              width: imageMetadata.width,
              height: imageMetadata.height,
              format: imageMetadata.format,
            });
          } catch (imageError: any) {
            logger.error('讀取圖片資訊失敗', { error: imageError.message });
            throw new Error(`讀取圖片資訊失敗: ${imageError.message}`);
          }
        }
      } catch (readError: any) {
        logger.error('讀取圖片失敗', { error: readError.message });
        return NextResponse.json(
          {
            success: false,
            error: readError.message || '讀取圖片失敗',
          },
          { status: 400 }
        );
      }
    }

    // 步驟 1: 根據圖片尺寸創建對應的 Rich Menu
    logger.info('步驟 1: 創建 Rich Menu');
    try {
      if (imageMetadata && imageMetadata.width && imageMetadata.height) {
        // 根據圖片尺寸選擇對應的 Rich Menu 類型
        const { width, height } = imageMetadata;
        
        if (width === 2500 && height === 843) {
          // Wide Menu
          logger.info('根據圖片尺寸選擇 Wide Rich Menu (2500x843)');
          richMenuId = await lineService.createWideRichMenu();
          result.menuType = 'Wide Menu (2500x843)';
        } else if (width === 2500 && height === 1686) {
          // Full Menu
          logger.info('根據圖片尺寸選擇 Full Rich Menu (2500x1686)');
          richMenuId = await lineService.createRichMenu();
          result.menuType = 'Full Menu (2500x1686)';
        } else if (width === 1038 && height === 635) {
          // Compact Menu
          logger.info('根據圖片尺寸選擇 Compact Rich Menu (1038x635)');
          richMenuId = await lineService.createCompactRichMenu();
          result.menuType = 'Compact Menu (1038x635)';
        } else {
          // 預設使用 Compact Menu，但警告尺寸不匹配
          logger.warn('圖片尺寸不符合標準，使用預設 Compact Menu', {
            width,
            height,
            expected: '1038x635, 2500x843, 或 2500x1686',
          });
          richMenuId = await lineService.createCompactRichMenu();
          result.menuType = 'Compact Menu (1038x635)';
          result.warning = `圖片尺寸 (${width}x${height}) 不符合標準 Rich Menu 尺寸，可能無法正常顯示。建議使用 1038x635、2500x843 或 2500x1686。`;
        }
      } else {
        // 沒有提供圖片，使用預設 Compact Menu
        logger.info('未提供圖片，使用預設 Compact Rich Menu');
        richMenuId = await lineService.createCompactRichMenu();
        result.menuType = 'Compact Menu (1038x635)';
      }

      logger.info('Rich Menu 創建成功', { richMenuId, menuType: result.menuType });
      result.richMenuId = richMenuId;
      result.steps.step1_create = '成功';
    } catch (createError: any) {
      logger.error('創建 Rich Menu 失敗', { error: createError.message });
      return NextResponse.json(
        {
          success: false,
          error: createError.message || '創建 Rich Menu 失敗',
        },
        { status: 500 }
      );
    }

    // 步驟 2: 上傳圖片（如果提供）
    // 使用之前保存的 originalImageBuffer，避免重複讀取 request body
    if (originalImageBuffer) {
      try {
        logger.info('步驟 2: 上傳 Rich Menu 圖片', { 
          size: originalImageBuffer.length,
        });

        // 轉換為 JPEG（LINE API 要求）
        let processedImage: Buffer;
        try {
          const image = sharp(originalImageBuffer);
          const metadata = await image.metadata();
          
          // 驗證尺寸是否匹配
          if (metadata.width && metadata.height) {
            const menuSize = result.menuType?.match(/\((\d+)x(\d+)\)/);
            if (menuSize) {
              const expectedWidth = parseInt(menuSize[1]);
              const expectedHeight = parseInt(menuSize[2]);
              if (metadata.width !== expectedWidth || metadata.height !== expectedHeight) {
                logger.warn('圖片尺寸與 Rich Menu 尺寸不匹配', {
                  imageSize: `${metadata.width}x${metadata.height}`,
                  menuSize: `${expectedWidth}x${expectedHeight}`,
                });
                result.warning = `圖片尺寸 (${metadata.width}x${metadata.height}) 與 Rich Menu 尺寸 (${expectedWidth}x${expectedHeight}) 不匹配，可能無法正常顯示。`;
              }
            }
          }

          processedImage = await image
            .jpeg({ quality: 90 })
            .toBuffer();

          logger.info('圖片已轉換為 JPEG', {
            originalSize: originalImageBuffer.length,
            processedSize: processedImage.length,
          });
        } catch (imageError: any) {
          logger.error('圖片處理失敗', { error: imageError.message });
          throw new Error(`圖片處理失敗: ${imageError.message}`);
        }

        await lineService.setRichMenuImage(richMenuId, processedImage);
        logger.info('Rich Menu 圖片上傳成功', { richMenuId });
        
        result.steps.step2_upload = '成功';
        result.imageSize = {
          original: originalImageBuffer.length,
          processed: processedImage.length,
          format: 'jpeg',
          dimensions: imageMetadata ? `${imageMetadata.width}x${imageMetadata.height}` : undefined,
        };

        // 步驟 3: 設為預設 Rich Menu（只有上傳圖片後才能設置）
        logger.info('步驟 3: 設為預設 Rich Menu');
        await lineService.setDefaultRichMenu(richMenuId);
        logger.info('Rich Menu 已設為預設選單', { richMenuId });
        
        result.steps.step3_setDefault = '成功';
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


