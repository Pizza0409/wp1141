import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './database/locations.db';

// 確保資料庫目錄存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Database directory created');
}

// 檢查資料庫是否已存在
const dbExists = fs.existsSync(dbPath);
if (!dbExists) {
  console.log('📝 Creating new database...');
}

export const db = new sqlite3.Database(dbPath);

export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 建立 Users 表
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE,
          username TEXT UNIQUE,
          password TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          CHECK (email IS NOT NULL OR username IS NOT NULL)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
          return;
        }
        console.log('✅ Users table created/verified');
      });

      // 建立 Locations 表
      db.run(`
        CREATE TABLE IF NOT EXISTS locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          notes TEXT,
          userId INTEGER NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating locations table:', err);
          reject(err);
          return;
        }
        console.log('✅ Locations table created/verified');
      });

      // 建立索引
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations (userId)
      `, (err) => {
        if (err) {
          console.error('Error creating index:', err);
          reject(err);
          return;
        }
        console.log('✅ Database indexes created/verified');
        
        // 建立訪客帳號
        db.get('SELECT * FROM users WHERE email = ?', ['guest@example.com'], (err, row) => {
          if (err) {
            console.error('Error checking guest user:', err);
            reject(err);
            return;
          }
          
          if (!row) {
            // 建立訪客帳號
            const bcrypt = require('bcryptjs');
            const hashedPassword = bcrypt.hashSync('guest123', 12);
            
            db.run(
              'INSERT INTO users (email, password) VALUES (?, ?)',
              ['guest@example.com', hashedPassword],
              (err) => {
                if (err) {
                  console.error('Error creating guest user:', err);
                  reject(err);
                  return;
                }
                console.log('✅ Guest user created');
                resolve();
              }
            );
          } else {
            console.log('✅ Guest user already exists');
            resolve();
          }
        });
      });
    });
  });
};

// 只有在資料庫剛建立時才需要初始化表格
// 如果資料庫已存在，上面的 CREATE TABLE IF NOT EXISTS 會自動處理
