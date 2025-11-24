import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import userRepository from '@/lib/repositories/userRepository';
import adminUserRepository from '@/lib/repositories/adminUserRepository';
import { authenticateRequest, requireAuth } from '@/lib/middleware/auth';
import logger from '@/lib/services/logger';

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

    const [lineUsers, adminAccounts] = await Promise.all([
      userRepository.getAllUsers(),
      adminUserRepository.findAll(),
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

