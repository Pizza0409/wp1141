import logger from '@/lib/services/logger';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class LLMError extends AppError {
  constructor(message: string, public originalError?: any) {
    super(message, 503, true);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, public originalError?: any) {
    super(message, 500, true);
  }
}

export class LineAPIError extends AppError {
  constructor(message: string, public originalError?: any) {
    super(message, 502, true);
  }
}

/**
 * 處理錯誤並回傳友善訊息
 */
export function handleError(error: unknown): {
  message: string;
  statusCode: number;
  isOperational: boolean;
} {
  // 記錄錯誤
  logger.error('處理錯誤', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  // 如果是自定義錯誤
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
    };
  }

  // OpenAI API 錯誤
  if (error && typeof error === 'object' && 'status' in error) {
    const apiError = error as { status: number; message?: string };
    if (apiError.status === 429) {
      return {
        message: 'API 配額已用完或達到速率限制，請稍後再試',
        statusCode: 429,
        isOperational: true,
      };
    }
    if (apiError.status === 401) {
      return {
        message: 'API 認證失敗，請檢查 API Key',
        statusCode: 401,
        isOperational: true,
      };
    }
  }

  // MongoDB 錯誤
  if (error && typeof error === 'object' && 'name' in error) {
    const dbError = error as { name: string; message?: string };
    if (dbError.name === 'MongoNetworkError') {
      return {
        message: '資料庫連接失敗，請稍後再試',
        statusCode: 503,
        isOperational: true,
      };
    }
    if (dbError.name === 'MongoServerError') {
      return {
        message: '資料庫服務錯誤，請稍後再試',
        statusCode: 500,
        isOperational: true,
      };
    }
  }

  // 預設錯誤
  return {
    message: '發生未預期的錯誤，請稍後再試',
    statusCode: 500,
    isOperational: false,
  };
}

/**
 * 錯誤降級處理：當主要服務失敗時提供備用方案
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    logger.warn('主要服務失敗，使用降級方案', {
      error: error instanceof Error ? error.message : String(error),
      errorMessage,
    });
    try {
      return await fallback();
    } catch (fallbackError) {
      logger.error('降級方案也失敗', {
        error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
      });
      throw new AppError(errorMessage, 503);
    }
  }
}


