/**
 * 初始化管理員帳號腳本
 * 
 * 使用方法：
 * 1. 設定環境變數 ADMIN_USERNAME 和 ADMIN_PASSWORD（可選）
 * 2. 執行：npx tsx scripts/init-admin.ts
 * 
 * 預設帳號：admin / admin123456
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import connectDB from '../lib/db/mongodb';
import adminUserRepository from '../lib/repositories/adminUserRepository';
import authService from '../lib/services/authService';
import logger from '../lib/services/logger';

// 載入環境變數
config({ path: resolve(process.cwd(), '.env.local') });

async function initAdmin() {
  try {
    // 連接資料庫
    await connectDB();
    console.log('✅ 已連接到 MongoDB');

    // 取得管理員帳號資訊（從環境變數或使用預設值）
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123456';

    // 檢查是否已存在
    const existingUser = await adminUserRepository.findByUsername(username);
    if (existingUser) {
      console.log(`⚠️  使用者 "${username}" 已存在`);
      console.log(`   角色：${existingUser.role}`);
      
      // 詢問是否要更新為管理員
      if (existingUser.role !== 'admin') {
        console.log(`   正在將角色更新為管理員...`);
        await adminUserRepository.updateRole(username, 'admin');
        console.log(`✅ 已將使用者 "${username}" 更新為管理員`);
      } else {
        console.log(`   使用者已經是管理員，無需更新`);
      }
      return;
    }

    // 建立管理員帳號
    console.log(`正在建立管理員帳號：${username}`);
    const hashedPassword = await authService.hashPassword(password);
    
    const adminUser = await adminUserRepository.create({
      username,
      password: hashedPassword,
      role: 'admin',
    });

    console.log('✅ 管理員帳號建立成功！');
    console.log(`   帳號：${adminUser.username}`);
    console.log(`   角色：${adminUser.role}`);
    console.log(`   密碼：${password}`);
    console.log('\n⚠️  請妥善保管密碼，並在首次登入後修改密碼！');
  } catch (error: any) {
    console.error('❌ 建立管理員帳號失敗：', error.message);
    logger.error('初始化管理員失敗', { error: error.message });
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// 執行初始化
initAdmin();


