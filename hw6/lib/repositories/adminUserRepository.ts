import AdminUser, { IAdminUser } from '@/lib/models/adminUser';
import logger from '@/lib/services/logger';

export class AdminUserRepository {
  async findByUsername(username: string): Promise<IAdminUser | null> {
    try {
      return await AdminUser.findOne({ username }).exec();
    } catch (error: any) {
      logger.error('查詢管理使用者失敗', { error: error.message, username });
      throw error;
    }
  }

  async create(data: {
    username: string;
    password: string; // hashed
    role?: 'admin' | 'viewer';
  }): Promise<IAdminUser> {
    try {
      const user = new AdminUser({
        ...data,
        role: data.role || 'viewer',
      });
      return await user.save();
    } catch (error: any) {
      logger.error('建立管理使用者失敗', { error: error.message });
      throw error;
    }
  }

  async updateRole(username: string, role: 'admin' | 'viewer'): Promise<IAdminUser | null> {
    try {
      return await AdminUser.findOneAndUpdate(
        { username },
        { role },
        { new: true }
      ).exec();
    } catch (error: any) {
      logger.error('更新管理使用者角色失敗', { error: error.message, username });
      throw error;
    }
  }

  async findAll(): Promise<IAdminUser[]> {
    try {
      return await AdminUser.find().exec();
    } catch (error: any) {
      logger.error('查詢所有管理使用者失敗', { error: error.message });
      throw error;
    }
  }
}

export default new AdminUserRepository();

