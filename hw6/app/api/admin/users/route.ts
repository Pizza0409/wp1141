import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import userRepository from '@/lib/repositories/userRepository';
import adminUserRepository from '@/lib/repositories/adminUserRepository';
import { authenticateRequest, requireAuth } from '@/lib/middleware/auth';
import logger from '@/lib/services/logger';
import { z } from 'zod';

const DeleteSchema = z.object({
  id: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult || !requireAuth(authResult.user, 'viewer')) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      );
    }

    await connectDB();

    const isAdmin = authResult.user.role === 'admin';

    const [lineUsers, adminAccounts] = await Promise.all([
      userRepository.getAllUsers(),
      isAdmin ? adminUserRepository.findAll() : Promise.resolve([]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        lineUsers: lineUsers.map((user) => ({
          id: user._id.toString(),
          lineUserId: user.lineUserId,
          displayName: user.displayName || '未命名使用者',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
        adminAccounts: adminAccounts.map((admin) => ({
          id: admin._id.toString(),
          username: admin.username,
          role: admin.role,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        })),
      },
    });
  } catch (error: any) {
    logger.error('取得使用者列表失敗', { error: error.message });
    return NextResponse.json(
      { success: false, error: '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult || !requireAuth(authResult.user, 'admin')) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { id } = DeleteSchema.parse(body);

    const targetUser = await adminUserRepository.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: '找不到指定帳號' },
        { status: 404 }
      );
    }

    if (targetUser.role !== 'viewer') {
      return NextResponse.json(
        { success: false, error: '僅能刪除觀看者帳號' },
        { status: 400 }
      );
    }

    const deleted = await adminUserRepository.deleteById(id);
    if (!deleted) {
      throw new Error('刪除帳號失敗');
    }

    logger.info('管理帳號被刪除', {
      username: targetUser.username,
      deletedBy: authResult.user.username,
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error: any) {
    logger.error('刪除管理帳號失敗', { error: error.message });

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

