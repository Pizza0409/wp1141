import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import adminUserRepository from '@/lib/repositories/adminUserRepository';
import authService from '@/lib/services/authService';
import logger from '@/lib/services/logger';
import { z } from 'zod';

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    await connectDB();

    const body = await request.json();
    const { username, password } = LoginSchema.parse(body);

    // 查詢使用者
    const user = await adminUserRepository.findByUsername(username);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '帳號或密碼錯誤' },
        { status: 401 }
      );
    }

    // 驗證密碼
    const isValid = await authService.verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: '帳號或密碼錯誤' },
        { status: 401 }
      );
    }

    // 產生 token
    const token = authService.generateToken(user.username, user.role);

    logger.info('使用者登入成功', { username: user.username, role: user.role });

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    logger.error('登入失敗', { error: error.message });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '輸入格式錯誤' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}


