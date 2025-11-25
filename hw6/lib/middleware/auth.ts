import { NextRequest } from 'next/server';
import authService from '@/lib/services/authService';
import logger from '@/lib/services/logger';

export interface AuthRequest extends NextRequest {
  user?: {
    username: string;
    role: 'admin' | 'viewer';
  };
}

/**
 * 驗證 JWT token 並附加使用者資訊到請求
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: { username: string; role: 'admin' | 'viewer' } } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authService.extractTokenFromRequest(authHeader);

    if (!token) {
      return null;
    }

    const payload = authService.verifyToken(token);
    if (!payload) {
      return null;
    }

    return {
      user: {
        username: payload.username,
        role: payload.role,
      },
    };
  } catch (error: any) {
    logger.error('認證請求失敗', { error: error.message });
    return null;
  }
}

/**
 * 檢查權限（管理者或觀看者）
 */
export function requireAuth(
  user: { username: string; role: 'admin' | 'viewer' } | null,
  requiredRole: 'admin' | 'viewer' = 'viewer'
): boolean {
  if (!user) {
    return false;
  }

  return authService.checkPermission(user.role, requiredRole);
}


