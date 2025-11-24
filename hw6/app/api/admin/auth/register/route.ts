import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import adminUserRepository from '@/lib/repositories/adminUserRepository';
import authService from '@/lib/services/authService';
import { authenticateRequest, requireAuth } from '@/lib/middleware/auth';
import logger from '@/lib/services/logger';
import { z } from 'zod';

const RegisterSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    await connectDB();

    // 驗證認證（只有已登入的管理者可以建立新使用者，或任何人都可以註冊為 viewer）
    const authResult = await authenticateRequest(request);
    const isAdmin = authResult && requireAuth(authResult.user, 'admin');

    const body = await request.json();
    const { username, password } = RegisterSchema.parse(body);

    // 檢查使用者是否已存在
    const existingUser = await adminUserRepository.findByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '使用者名稱已存在' },
        { status: 400 }
      );
    }

    // 雜湊密碼
    const hashedPassword = await authService.hashPassword(password);

    // 建立使用者（預設為 viewer，只有管理者可以建立 admin）
    const role = isAdmin && body.role === 'admin' ? 'admin' : 'viewer';
    
    const user = await adminUserRepository.create({
      username,
      password: hashedPassword,
      role,
    });

    logger.info('新使用者註冊', { username: user.username, role: user.role });

    return NextResponse.json({
      success: true,
      data: {
        username: user.username,
        role: user.role,
      },
    });
  } catch (error: any) {
    logger.error('註冊失敗', { error: error.message });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '輸入格式錯誤' },
        { status: 400 }
      );
    }

    // MongoDB 重複鍵錯誤
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: '使用者名稱已存在' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}

